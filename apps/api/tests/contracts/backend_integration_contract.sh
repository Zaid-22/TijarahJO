#!/usr/bin/env bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
BACKEND_LOG_FILE="${BACKEND_LOG_FILE:-/tmp/tijarahjo_bootstrap_backend.log}"
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

wait_for_email_verification_token() {
  local email="$1"
  local token=""
  local attempt=0

  while [ "$attempt" -lt 50 ]; do
    if [ -f "$BACKEND_LOG_FILE" ]; then
      token="$(awk -v recipient="Recipient=${email} " '
        index($0, recipient) { matching_line = $0 }
        END {
          if (match(matching_line, /[?&]token=[^&[:space:]]+/)) {
            print substr(matching_line, RSTART + 7, RLENGTH - 7)
          }
        }
      ' "$BACKEND_LOG_FILE")"
    fi

    if [ -n "$token" ]; then
      printf "%s" "$token"
      return 0
    fi

    sleep 0.1
    attempt=$((attempt + 1))
  done

  return 1
}

verify_email_and_extract_jwt() {
  local name="$1"
  local email="$2"
  local verification_token
  local verification_payload

  VERIFIED_JWT=""

  verification_token="$(wait_for_email_verification_token "$email" || true)"
  if [ -z "$verification_token" ]; then
    log_fail "$name.verification-token.logged" "No verification token found for $email in $BACKEND_LOG_FILE."
    return 1
  fi

  log_pass "$name.verification-token.logged"
  verification_payload="$(jq -nc --arg token "$verification_token" '{Token:$token}')"
  call_api "$name.verify-email" "POST" "/api/v1/auth/verify-email" "200" "$verification_payload"
  VERIFIED_JWT="$(extract_jwt_cookie)"
  if [ -z "$VERIFIED_JWT" ]; then
    log_fail "$name.jwt-cookie.present" "Email verification response did not issue a JWT cookie."
    return 1
  fi

  log_pass "$name.jwt-cookie.present"
}

assert_jq_arg() {
  local name="$1"
  local expr="$2"
  local arg_name="$3"
  local arg_value="$4"
  local input="${5:-$LAST_BODY}"

  if printf "%s" "$input" | jq -e --arg "$arg_name" "$arg_value" "$expr" >/dev/null 2>&1; then
    log_pass "$name"
  else
    log_fail "$name" "jq assertion failed: $expr; body=$input"
  fi
}

print_summary() {
  echo
  echo "========================================="
  echo "Integration summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "========================================="
}

require_cmd curl
require_cmd jq

echo "Running backend integration contract checks against $BASE_URL"
echo "curl timeouts: connect=${CURL_CONNECT_TIMEOUT_SECONDS}s total=${CURL_MAX_TIME_SECONDS}s"

timestamp="$(date +%s)"
email_owner="integration_${timestamp}_owner@example.com"
email_other="integration_${timestamp}_other@example.com"

call_api "preflight.swagger" "GET" "/swagger/index.html" "200"

# Resolve location IDs for signup
call_api "locations.cities.signup" "GET" "/api/v1/cities" "200"
signup_city_id="$(printf "%s" "$LAST_BODY" | jq -r '.[] | select(.CityName=="Amman") | .CityId // empty')"
if ! [[ "$signup_city_id" =~ ^[0-9]+$ ]]; then signup_city_id="1"; fi

call_api "locations.areas.signup" "GET" "/api/v1/cities/${signup_city_id}/areas" "200"
signup_area_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].AreaId // empty')"
if ! [[ "$signup_area_id" =~ ^[0-9]+$ ]]; then signup_area_id="1"; fi
signup_area2_id="$(printf "%s" "$LAST_BODY" | jq -r '.[1].AreaId // empty')"
if ! [[ "$signup_area2_id" =~ ^[0-9]+$ ]]; then signup_area2_id="$signup_area_id"; fi

signup_owner_payload="$(jq -nc --arg e "$email_owner" --arg p "+962700${timestamp: -6}" --argjson city "$signup_city_id" --argjson area "$signup_area_id" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Owner",LastName:"Test",Phone:$p,CityId:$city,AreaId:$area}')"
call_api "auth.signup.owner" "POST" "/api/v1/auth/signup" "201" "$signup_owner_payload"
assert_jq "auth.signup.owner.token.absent" '(.Token // null) == null'
assert_jq "auth.signup.owner.requires-verification" '(.RequiresEmailVerification // .requiresEmailVerification // false) == true'
owner_signup_token="$(extract_jwt_cookie)"
if [ -z "$owner_signup_token" ]; then
  log_pass "auth.signup.owner.jwt-cookie.absent"
else
  log_fail "auth.signup.owner.jwt-cookie.absent" "Signup issued a JWT before email verification."
fi
verify_email_and_extract_jwt "auth.owner" "$email_owner" || true
owner_token="$VERIFIED_JWT"

signup_other_payload="$(jq -nc --arg e "$email_other" --arg p "+962701${timestamp: -6}" --argjson city "$signup_city_id" --argjson area "$signup_area2_id" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Other",LastName:"User",Phone:$p,CityId:$city,AreaId:$area}')"
call_api "auth.signup.other" "POST" "/api/v1/auth/signup" "201" "$signup_other_payload"
assert_jq "auth.signup.other.token.absent" '(.Token // null) == null'
assert_jq "auth.signup.other.requires-verification" '(.RequiresEmailVerification // .requiresEmailVerification // false) == true'
other_signup_token="$(extract_jwt_cookie)"
if [ -z "$other_signup_token" ]; then
  log_pass "auth.signup.other.jwt-cookie.absent"
else
  log_fail "auth.signup.other.jwt-cookie.absent" "Signup issued a JWT before email verification."
fi
verify_email_and_extract_jwt "auth.other" "$email_other" || true
other_token="$VERIFIED_JWT"

call_api "categories.all" "GET" "/api/v1/categories" "200"
category_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].CategoryID // empty')"
if ! [[ "$category_id" =~ ^[0-9]+$ ]]; then
  log_fail "categories.first.id" "No valid CategoryID found in /api/v1/categories"
  category_id="1"
else
  log_pass "categories.first.id ($category_id)"
fi

# Resolve location IDs dynamically
call_api "locations.cities" "GET" "/api/v1/cities" "200"
amman_city_id="$(printf "%s" "$LAST_BODY" | jq -r '.[] | select(.CityName=="Amman") | .CityId // empty')"
if ! [[ "$amman_city_id" =~ ^[0-9]+$ ]]; then
  amman_city_id="1"
fi

call_api "locations.areas" "GET" "/api/v1/cities/${amman_city_id}/areas" "200"
abdoun_area_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].AreaId // empty')"
if ! [[ "$abdoun_area_id" =~ ^[0-9]+$ ]]; then
  abdoun_area_id="1"
fi

create_post_payload="$(jq -nc --argjson c "$category_id" --argjson city "$amman_city_id" --argjson area "$abdoun_area_id" '{CategoryID:$c,PostTitle:"Integration Contract Post",PostDescription:"Created by backend integration contract test",Price:25.5,CityId:$city,AreaId:$area}')"
call_api "posts.create.owner" "POST" "/api/v1/posts" "201" "$create_post_payload" "$owner_token"
post_id="$(printf "%s" "$LAST_BODY" | jq -r '.PostID // .postID // .postId // empty')"
assert_jq "posts.create.owner.id.present" '.PostID != null or .postID != null or .postId != null'

if ! [[ "$post_id" =~ ^[0-9]+$ ]]; then
  log_fail "posts.create.owner.id.valid" "Invalid post id: $post_id"
else
  log_pass "posts.create.owner.id.valid ($post_id)"

  call_api "posts.feed.normalized" "GET" "/api/v1/posts/feed?page=1&limit=200&includeDeleted=false" "200"
  assert_jq "posts.feed.normalized.success" '.success == true'
  assert_jq "posts.feed.normalized.current-page" '.pagination.currentPage == 1'
  assert_jq "posts.feed.normalized.limit" '.pagination.postsPerPage == 200'
  assert_jq "posts.feed.normalized.posts-array" '.posts | type=="array"'
  assert_jq_arg "posts.feed.normalized.contains-created-post" '.posts | any(.id == $post_id)' "post_id" "$post_id"

  call_api "posts.all.removed" "GET" "/api/v1/posts/All" "404"
  call_api "posts.pagination.removed" "GET" "/api/v1/posts/pagination?pageNumber=1&rowsPerPage=5&includeDeleted=false" "404"

  call_api "posts.update-status.owner" "PATCH" "/api/v1/posts/${post_id}/status" "200" '{"status":"SOLD"}' "$owner_token"
  assert_jq "posts.update-status.owner.status" '.Status == 3 or .status == 3'

  call_api "posts.delete.other.forbidden" "DELETE" "/api/v1/posts/${post_id}" "403" "" "$other_token"
  call_api "posts.delete.owner" "DELETE" "/api/v1/posts/${post_id}" "200" "" "$owner_token"
  call_api "posts.get.deleted" "GET" "/api/v1/posts/${post_id}" "404"

  call_api "posts.feed.include-deleted" "GET" "/api/v1/posts/feed?page=1&limit=20&includeDeleted=true" "200"
  assert_jq "posts.feed.include-deleted.success" '.success == true'
  assert_jq "posts.feed.include-deleted.pagination-shape" '.pagination.currentPage == 1 and (.pagination.totalPages|type=="number") and (.pagination.totalPosts|type=="number") and .pagination.postsPerPage == 20'
fi

print_summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
