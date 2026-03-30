#!/bin/bash
RES=$(curl -s -X POST http://localhost:5033/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@tijarahjo.local", "password": "Admin@123"}')
echo "Login Response: $RES"
TOKEN=$(echo "$RES" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
echo "Token Length: ${#TOKEN}"

curl -s -X POST http://localhost:5033/api/v1/admin/locations/cities \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Irbed", "nameAr": "إربد"}' -w "\nHTTP Code: %{http_code}\n"
