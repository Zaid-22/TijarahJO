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
  local body_file="$TMP_DIR/body.json"
  local err_file="$TMP_DIR/err.log"

  LAST_CODE="$(curl -sS -o "$body_file" -w "%{http_code}" -X "$method" "$BASE_URL$path" 2>"$err_file")"
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
  echo "Frontend contract summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "========================================="
}

require_cmd curl
require_cmd jq

echo "Running frontend API contract checks against $BASE_URL"

call_api "preflight.swagger" "GET" "/swagger/index.html" "200"

call_api "posts.feed" "GET" "/api/v1/posts/feed?page=1&limit=10&includeDeleted=false" "200"
assert_jq "posts.feed.contract" '.success==true and (.posts|type=="array") and (.pagination|type=="object")'
assert_jq "posts.feed.pagination.contract" '.pagination.currentPage|type=="number"'

first_post_id="$(printf "%s" "$LAST_BODY" | jq -r '.posts[0].id // empty')"
if [ -n "$first_post_id" ]; then
  log_pass "posts.feed.first.id.present ($first_post_id)"
  assert_jq "posts.feed.first.shape" '.posts[0] | has("name") and has("price") and has("status") and has("images")'
  call_api "posts.by-id" "GET" "/api/v1/posts/${first_post_id}" "200"
  assert_jq "posts.by-id.contract" '.PostID != null and .CategoryID != null and .PostTitle != null'
else
  log_fail "posts.feed.first.id.present" "No posts returned from /api/v1/posts/feed"
fi

call_api "categories.all" "GET" "/api/v1/categories" "200"
assert_jq "categories.all.contract" 'type=="array"'
assert_jq "categories.first.contract" 'length == 0 or (.[0].CategoryID != null and .[0].CategoryName != null)'

call_api "search.basic" "GET" "/api/v1/search?query=test&page=1&limit=5" "200"
assert_jq "search.basic.contract" '.success==true and (.posts|type=="array")'

call_api "posts.all.removed" "GET" "/api/v1/posts/All" "404"

call_api "posts.pagination.removed" "GET" "/api/v1/posts/pagination?pageNumber=1&rowsPerPage=5&includeDeleted=false" "404"

print_summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
