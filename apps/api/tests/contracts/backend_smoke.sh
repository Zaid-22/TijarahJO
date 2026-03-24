#!/usr/bin/env bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
TMP_DIR="$(mktemp -d)"
PASS_COUNT=0
FAIL_COUNT=0
LAST_CODE=""
LAST_BODY=""

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
  local body_file="$TMP_DIR/body.json"
  local err_file="$TMP_DIR/err.log"

  local -a args
  args=(-sS -o "$body_file" -w "%{http_code}" -X "$method" "$BASE_URL$path" -H "Content-Type: application/json")

  if [ -n "$token" ]; then
    args+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$payload" ]; then
    args+=(-d "$payload")
  fi

  LAST_CODE="$(curl "${args[@]}" 2>"$err_file")"
  local curl_rc=$?
  LAST_BODY="$(cat "$body_file" 2>/dev/null || true)"
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

print_summary() {
  echo
  echo "========================================="
  echo "Smoke summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "========================================="
}

require_cmd curl
require_cmd jq

echo "Running backend smoke checks against $BASE_URL"

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

signup_payload="$(jq -nc --arg e "$email" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Smoke",LastName:"Test",Phone:"+962790000099",City:"Amman",Area:"Abdali"}')"
call_api "auth.signup" "POST" "/api/v1/auth/signup" "201" "$signup_payload"
token="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
assert_jq "auth.signup.token.present" '.Token | type=="string" and (length>20)'

if [ -n "$token" ]; then
  call_api "auth.me" "GET" "/api/v1/auth/me" "200" "" "$token"
  assert_jq "auth.me.id.present" '.Id != null'

  call_api "favorites.get" "GET" "/api/v1/favorites" "200" "" "$token"
  assert_jq "favorites.get.shape" '.success==true and (.favorites|type=="array")'

  call_api "search.basic" "GET" "/api/v1/search?query=smoke&page=1&limit=5" "200"
  assert_jq "search.basic.shape" '.success==true and (.posts|type=="array")'

  call_api "auth.logout" "POST" "/api/v1/auth/logout" "200" "" "$token"
else
  log_fail "auth.me/favorites/logout" "Token missing from signup response."
fi

print_summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
