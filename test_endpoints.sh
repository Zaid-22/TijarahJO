#!/bin/bash

BASE_URL="http://localhost:5033"
echo "========================================="
echo "Testing API Endpoints"
echo "Base URL: $BASE_URL"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -n "Testing $method $endpoint - $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -sS -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" 2>&1)
    else
        response=$(curl -sS -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json" -d "$data" 2>&1)
    fi

    http_code=$(printf "%s\n" "$response" | tail -n1)
    body=$(printf "%s\n" "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✓ OK (${http_code})${NC}"
        return 0
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo -e "${YELLOW}⚠ Client Error (${http_code})${NC}"
        return 1
    elif [ "$http_code" -ge 500 ]; then
        echo -e "${RED}✗ Server Error (${http_code})${NC}"
        echo "  Response: $body"
        return 2
    else
        echo -e "${RED}✗ Failed (${http_code})${NC}"
        echo "  Response: $body"
        return 3
    fi
}

echo "=== AUTH ENDPOINTS ==="
test_endpoint "POST" "/api/auth/login" "Login" '{"Login":"test","Password":"test"}'
test_endpoint "POST" "/api/auth/signup" "Signup" '{"Email":"test@test.com","Password":"test123","FirstName":"Test","LastName":"User","Phone":"+962790000000"}'
# GetCurrentUser requires auth token, skip for now

echo ""
echo "=== USER ENDPOINTS ==="
test_endpoint "GET" "/api/users/All" "Get All Users"
test_endpoint "GET" "/api/users/1" "Get User By ID"
test_endpoint "GET" "/api/users/Exists/1" "Check User Exists"
# Register, Update, Delete require valid data/models, skip for now

echo ""
echo "=== CATEGORY ENDPOINTS ==="
test_endpoint "GET" "/api/categories/All" "Get All Categories"
test_endpoint "GET" "/api/categories/1" "Get Category By ID"
test_endpoint "GET" "/api/categories/Exists/1" "Check Category Exists"

echo ""
echo "=== POST ENDPOINTS ==="
test_endpoint "GET" "/api/posts/All" "Get All Posts"
test_endpoint "GET" "/api/posts/1" "Get Post By ID"
test_endpoint "GET" "/api/posts/pagination?pageNumber=1&rowsPerPage=10&includeDeleted=false" "Get Paginated Posts"
test_endpoint "GET" "/api/posts/Exists/1" "Check Post Exists"
test_endpoint "GET" "/api/posts/user/1" "Get Posts By User"
test_endpoint "GET" "/api/posts/category/1" "Get Posts By Category"

echo ""
echo "=== POST IMAGE ENDPOINTS ==="
test_endpoint "GET" "/api/TbPostImages/All" "Get All Post Images"
test_endpoint "GET" "/api/TbPostImages/1" "Get Post Image By ID"
test_endpoint "GET" "/api/TbPostImages/Exists/1" "Check Post Image Exists"

echo ""
echo "=== ROLE ENDPOINTS ==="
test_endpoint "GET" "/api/TbRoles/All" "Get All Roles"
test_endpoint "GET" "/api/TbRoles/1" "Get Role By ID"
test_endpoint "GET" "/api/TbRoles/Exists/1" "Check Role Exists"

echo ""
echo "========================================="
echo "Testing Complete"
echo "========================================="
