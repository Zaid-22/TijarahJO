#!/usr/bin/env bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
CURL_CONNECT_TIMEOUT_SECONDS="${CURL_CONNECT_TIMEOUT_SECONDS:-5}"
CURL_MAX_TIME_SECONDS="${CURL_MAX_TIME_SECONDS:-30}"
TMP_DIR="$(mktemp -d)"
PASS_COUNT=0
FAIL_COUNT=0
LAST_CODE=""
LAST_BODY=""
LAST_HEADERS=""

trap 'rm -rf "$TMP_DIR"' EXIT

log_pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  printf "PASS: %s\n" "$1"
}

log_fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  printf "FAIL: %s\n" "$1"
  if [ -n "${2:-}" ]; then
    printf "  details: %s\n" "$2"
  fi
}

require_cmd() {
  local cmd="$1"
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Error: required command '$cmd' not found in PATH." >&2
    exit 1
  fi
}

call_api() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_codes="$4"
  local payload="${5:-}"
  local token="${6:-}"
  local body_file
  local header_file
  local err_file

  body_file="$(mktemp "$TMP_DIR/body.XXXXXX")"
  header_file="$(mktemp "$TMP_DIR/headers.XXXXXX")"
  err_file="$(mktemp "$TMP_DIR/err.XXXXXX")"

  local -a args
  args=(
    -sS
    --connect-timeout "$CURL_CONNECT_TIMEOUT_SECONDS"
    --max-time "$CURL_MAX_TIME_SECONDS"
    -D "$header_file"
    -o "$body_file"
    -w "%{http_code}"
    -X "$method"
    "$BASE_URL$path"
    -H "Content-Type: application/json"
  )

  LAST_CODE=""
  LAST_BODY=""
  LAST_HEADERS=""

  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$payload" ]; then
    args+=(-d "$payload")
  fi

  LAST_CODE="$(curl "${args[@]}" 2>"$err_file")"
  local curl_rc=$?
  LAST_BODY="$(cat "$body_file" 2>/dev/null || true)"
  LAST_HEADERS="$(cat "$header_file" 2>/dev/null || true)"
  local err_out
  err_out="$(cat "$err_file" 2>/dev/null || true)"

  if [ $curl_rc -ne 0 ]; then
    log_fail "$name" "curl rc=$curl_rc $err_out"
    return 1
  fi

  if [[ ",$expected_codes," == *",$LAST_CODE,"* ]]; then
    log_pass "$name ($LAST_CODE)"
    return 0
  fi

  log_fail "$name" "expected [$expected_codes], got $LAST_CODE, body=$LAST_BODY"
  return 1
}

assert_jq() {
  local name="$1"
  local expr="$2"
  local input="${3:-$LAST_BODY}"

  if printf "%s" "$input" | jq -e "$expr" >/dev/null 2>&1; then
    log_pass "$name"
  else
    log_fail "$name" "jq assertion failed: $expr; body=$input"
  fi
}

extract_jwt_cookie() {
  printf "%s" "$LAST_HEADERS" \
    | tr -d '\r' \
    | sed -n 's/^Set-Cookie: jwt=\([^;]*\).*/\1/p' \
    | head -n 1
}

print_summary() {
  echo
  echo "========================================="
  echo "Smoke summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "========================================="
}

require_cmd curl
require_cmd jq

echo "Running backend smoke checks against $BASE_URL"
echo "curl timeouts: connect=${CURL_CONNECT_TIMEOUT_SECONDS}s total=${CURL_MAX_TIME_SECONDS}s"

timestamp="$(date +%s)"
email="smoke_${timestamp}@example.com"

call_api "preflight.swagger" "GET" "/swagger/index.html" "200"
call_api "categories.all" "GET" "/api/v1/categories" "200"
assert_jq "categories.all.array" 'type=="array"'

call_api "roles.all" "GET" "/api/v1/roles" "200"
assert_jq "roles.all.array" 'type=="array"'

call_api "posts.feed" "GET" "/api/v1/posts/feed?page=1&limit=5&includeDeleted=false" "200"
assert_jq "posts.feed.shape" '.success==true and (.posts|type=="array") and (.pagination|type=="object")'

call_api "posts.all.removed" "GET" "/api/v1/posts/All" "404"
call_api "posts.pagination.removed" "GET" "/api/v1/posts/pagination?pageNumber=1&rowsPerPage=5&includeDeleted=false" "404"

call_api "users.all.restricted" "GET" "/api/v1/users" "401,403"

# Resolve location IDs for signup
call_api "locations.cities.smoke" "GET" "/api/v1/cities" "200"
smoke_city_id="$(printf "%s" "$LAST_BODY" | jq -r '.[] | select(.CityName=="Amman") | .CityId // empty')"
if ! [[ "$smoke_city_id" =~ ^[0-9]+$ ]]; then smoke_city_id="1"; fi

call_api "locations.areas.smoke" "GET" "/api/v1/cities/${smoke_city_id}/areas" "200"
smoke_area_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].AreaId // empty')"
if ! [[ "$smoke_area_id" =~ ^[0-9]+$ ]]; then smoke_area_id="1"; fi

signup_payload="$(jq -nc --arg e "$email" --arg p "+962702${timestamp: -6}" --argjson city "$smoke_city_id" --argjson area "$smoke_area_id" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Smoke",LastName:"Test",Phone:$p,CityId:$city,AreaId:$area}')"
call_api "auth.signup" "POST" "/api/v1/auth/signup" "201" "$signup_payload"
token="$(extract_jwt_cookie)"
assert_jq "auth.signup.token.absent" '(.Token // null) == null'

if [ -n "$token" ]; then
  call_api "auth.me" "GET" "/api/v1/auth/me" "200" "" "$token"
  assert_jq "auth.me.id.present" '.Id != null'

  call_api "favorites.get" "GET" "/api/v1/favorites" "200" "" "$token"
  assert_jq "favorites.get.shape" '.success==true and (.favorites|type=="array")'

  call_api "search.basic" "GET" "/api/v1/search?query=smoke&page=1&limit=5" "200"
  assert_jq "search.basic.shape" '.success==true and (.posts|type=="array")'

  call_api "auth.logout" "POST" "/api/v1/auth/logout" "200" "" "$token"
else
  log_fail "auth.me/favorites/logout" "JWT cookie missing from signup response headers."
fi

print_summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
