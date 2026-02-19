#!/usr/bin/env bash

set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
PASS_COUNT=0
FAIL_COUNT=0
LAST_CODE=""
LAST_BODY=""

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

log_ok() {
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

log_skip() {
  printf "SKIP: %s\n" "$1"
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
    log_ok "$name ($LAST_CODE)"
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
    log_ok "$name"
  else
    log_fail "$name" "jq assertion failed: $expr; body=$input"
  fi
}

assert_jq_or_abort() {
  local name="$1"
  local expr="$2"
  local input="${3:-$LAST_BODY}"

  if printf "%s" "$input" | jq -e "$expr" >/dev/null 2>&1; then
    log_ok "$name"
    return 0
  fi

  abort_verification "$name" "jq assertion failed: $expr; body=$input"
}

require_api() {
  local name="$1"
  local method="$2"
  local path="$3"
  local expected_codes="$4"
  local payload="${5:-}"
  local token="${6:-}"

  if ! call_api "$name" "$method" "$path" "$expected_codes" "$payload" "$token"; then
    abort_verification "$name" "Request failed. path=$path expected=$expected_codes got=$LAST_CODE body=$LAST_BODY"
  fi
}

is_positive_int() {
  [[ "${1:-}" =~ ^[1-9][0-9]*$ ]]
}

require_positive_int() {
  local value="${1:-}"
  local name="$2"
  if ! is_positive_int "$value"; then
    abort_verification "$name" "Expected a positive integer but got '$value'."
  fi
}

require_non_empty() {
  local value="${1:-}"
  local name="$2"
  if [ -z "$value" ]; then
    abort_verification "$name" "Required value is empty."
  fi
}

print_summary() {
  echo
  echo "========================================="
  echo "Verification summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
  echo "========================================="
}

abort_verification() {
  local reason="$1"
  local details="${2:-}"
  log_fail "$reason" "$details"
  echo "Stopping early due to prerequisite failure."
  print_summary
  exit 1
}

echo "Running full API verification against $BASE_URL"
if [ -n "$ADMIN_TOKEN" ]; then
  echo "Admin mode: enabled (ADMIN_TOKEN provided)"
else
  echo "Admin mode: disabled (admin-only checks will validate authorization guards)"
fi

if ! command -v jq >/dev/null 2>&1; then
  abort_verification "preflight.jq" "jq is required but was not found in PATH."
fi

preflight_code="$(curl -sS -o /dev/null -w "%{http_code}" "$BASE_URL/swagger/index.html" || true)"
if [ "$preflight_code" != "200" ]; then
  abort_verification \
    "preflight.backend.unreachable" \
    "Expected $BASE_URL/swagger/index.html to return 200, got $preflight_code."
fi
log_ok "preflight.backend.reachable ($preflight_code)"

db_preflight_file="$TMP_DIR/preflight_categories.json"
db_preflight_code="$(curl -sS -o "$db_preflight_file" -w "%{http_code}" "$BASE_URL/api/categories/All" || true)"
db_preflight_body="$(cat "$db_preflight_file" 2>/dev/null || true)"
if [ "$db_preflight_code" != "200" ]; then
  abort_verification \
    "preflight.database.unhealthy" \
    "Expected $BASE_URL/api/categories/All to return 200, got $db_preflight_code. body=$db_preflight_body"
fi
if ! printf "%s" "$db_preflight_body" | jq -e 'type=="array"' >/dev/null 2>&1; then
  abort_verification \
    "preflight.database.unhealthy" \
    "Expected /api/categories/All response to be a JSON array. body=$db_preflight_body"
fi
log_ok "preflight.database.ready ($db_preflight_code)"

ts="$(date +%s)"
now_iso="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

# 1. Auth setup: create and login two users
email1="apitest_${ts}_1@example.com"
email2="apitest_${ts}_2@example.com"
email3="apitest_${ts}_3@example.com"

signup1_payload="$(jq -nc --arg e "$email1" --arg d "$ts" '{Email:$e,Password:"P@ssw0rd123",FirstName:"API",LastName:"User1",Phone:"+962790000001",City:"Amman",Area:"Abdali"}')"
require_api "auth.signup.user1" "POST" "/api/auth/signup" "201" "$signup1_payload"
token1="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
user1_id="$(printf "%s" "$LAST_BODY" | jq -r '.User.Id // .User.UserID // .User.id // empty')"
assert_jq_or_abort "auth.signup.user1.token.present" '.Token | type=="string" and (length>20)'
require_non_empty "$token1" "auth.bootstrap.user1"

signup2_payload="$(jq -nc --arg e "$email2" '{Email:$e,Password:"P@ssw0rd123",FirstName:"API",LastName:"User2",Phone:"+962790000002",City:"Amman",Area:"Khalda"}')"
require_api "auth.signup.user2" "POST" "/api/auth/signup" "201" "$signup2_payload"
token2="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
user2_id="$(printf "%s" "$LAST_BODY" | jq -r '.User.Id // .User.UserID // .User.id // empty')"
assert_jq_or_abort "auth.signup.user2.token.present" '.Token | type=="string" and (length>20)'
require_non_empty "$token2" "auth.bootstrap.user2"

login1_payload="$(jq -nc --arg l "$email1" '{Login:$l,Password:"P@ssw0rd123"}')"
require_api "auth.login.user1" "POST" "/api/auth/login" "200" "$login1_payload"
token1_login="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
if [ -n "$token1_login" ]; then token1="$token1_login"; fi
require_non_empty "$token1" "auth.login.user1.token"

login2_payload="$(jq -nc --arg l "$email2" '{Login:$l,Password:"P@ssw0rd123"}')"
require_api "auth.login.user2" "POST" "/api/auth/login" "200" "$login2_payload"
token2_login="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
if [ -n "$token2_login" ]; then token2="$token2_login"; fi
require_non_empty "$token2" "auth.login.user2.token"

# Cookie-authenticated CSRF checks
csrf_cookie_jar="$TMP_DIR/csrf_user1.cookies"
csrf_login_body="$TMP_DIR/csrf_login_body.json"
csrf_login_code="$(curl -sS -o "$csrf_login_body" -w "%{http_code}" \
  -c "$csrf_cookie_jar" -b "$csrf_cookie_jar" \
  -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "$login1_payload" || true)"
if [ "$csrf_login_code" != "200" ]; then
  abort_verification "csrf.cookie.login" "Expected 200 for cookie login, got $csrf_login_code body=$(cat "$csrf_login_body" 2>/dev/null || true)"
fi
log_ok "csrf.cookie.login ($csrf_login_code)"

csrf_logout_no_token_code="$(curl -sS -o "$TMP_DIR/csrf_logout_no_token_body.json" -w "%{http_code}" \
  -c "$csrf_cookie_jar" -b "$csrf_cookie_jar" \
  -X POST "$BASE_URL/api/auth/logout" \
  -H "Content-Type: application/json" || true)"
if [[ ",403,400," == *",$csrf_logout_no_token_code,"* ]]; then
  log_ok "csrf.logout.rejected.without_header ($csrf_logout_no_token_code)"
else
  abort_verification "csrf.logout.rejected.without_header" "Expected 403/400, got $csrf_logout_no_token_code body=$(cat "$TMP_DIR/csrf_logout_no_token_body.json" 2>/dev/null || true)"
fi

csrf_me_code="$(curl -sS -o "$TMP_DIR/csrf_me_body.json" -w "%{http_code}" \
  -c "$csrf_cookie_jar" -b "$csrf_cookie_jar" \
  -X GET "$BASE_URL/api/auth/me" \
  -H "Content-Type: application/json" || true)"
if [ "$csrf_me_code" != "200" ]; then
  abort_verification "csrf.cookie.me" "Expected 200 for cookie /auth/me, got $csrf_me_code body=$(cat "$TMP_DIR/csrf_me_body.json" 2>/dev/null || true)"
fi
log_ok "csrf.cookie.me ($csrf_me_code)"

csrf_token="$(awk '$6=="XSRF-TOKEN" {print $7}' "$csrf_cookie_jar" | tail -n1)"
if [ -z "$csrf_token" ]; then
  abort_verification "csrf.cookie.token.present" "Missing XSRF-TOKEN cookie after authenticated GET."
fi
log_ok "csrf.cookie.token.present"

csrf_logout_with_header_code="$(curl -sS -o "$TMP_DIR/csrf_logout_with_header_body.json" -w "%{http_code}" \
  -c "$csrf_cookie_jar" -b "$csrf_cookie_jar" \
  -X POST "$BASE_URL/api/auth/logout" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: $csrf_token" || true)"
if [ "$csrf_logout_with_header_code" != "200" ]; then
  abort_verification "csrf.logout.allowed.with_header" "Expected 200, got $csrf_logout_with_header_code body=$(cat "$TMP_DIR/csrf_logout_with_header_body.json" 2>/dev/null || true)"
fi
log_ok "csrf.logout.allowed.with_header ($csrf_logout_with_header_code)"

require_api "auth.me.user1" "GET" "/api/auth/me" "200" "" "$token1"
if [ -z "$user1_id" ]; then
  user1_id="$(printf "%s" "$LAST_BODY" | jq -r '.Id // .UserID // empty')"
fi
assert_jq_or_abort "auth.me.user1.id.present" '.Id != null'
require_positive_int "$user1_id" "auth.me.user1.id"

require_api "auth.me.user2" "GET" "/api/auth/me" "200" "" "$token2"
if [ -z "$user2_id" ]; then
  user2_id="$(printf "%s" "$LAST_BODY" | jq -r '.Id // .UserID // empty')"
fi
assert_jq_or_abort "auth.me.user2.id.present" '.Id != null'
require_positive_int "$user2_id" "auth.me.user2.id"

# 2. Public read endpoints
if [ -n "$ADMIN_TOKEN" ]; then
  call_api "users.all.admin" "GET" "/api/users/All" "200" "" "$ADMIN_TOKEN"
  assert_jq "users.all.admin.nonempty" 'type=="array" and length>0'
else
  call_api "users.all.restricted" "GET" "/api/users/All" "401,403"
fi

require_api "users.byid" "GET" "/api/users/$user1_id" "200"
require_api "categories.all" "GET" "/api/categories/All" "200"
assert_jq_or_abort "categories.all.array" 'type=="array"'
first_category_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].CategoryID // empty')"
require_positive_int "$first_category_id" "categories.seed.missing"

require_api "categories.byid" "GET" "/api/categories/$first_category_id" "200"
require_api "categories.exists" "GET" "/api/categories/Exists/$first_category_id" "200"
assert_jq_or_abort "categories.exists.true" '. == true'

require_api "roles.all" "GET" "/api/TbRoles/All" "200"
assert_jq_or_abort "roles.all.array" 'type=="array"'
first_role_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].RoleID // empty')"
if is_positive_int "$first_role_id"; then
  require_api "roles.byid" "GET" "/api/TbRoles/$first_role_id" "200"
  require_api "roles.exists" "GET" "/api/TbRoles/Exists/$first_role_id" "200"
  assert_jq_or_abort "roles.exists.true" '. == true'
else
  log_skip "roles.byid / roles.exists (no roles returned)"
fi

require_api "posts.all.gone" "GET" "/api/posts/All" "410"
assert_jq_or_abort "posts.all.gone.contract" '.code=="POSTS_LEGACY_ENDPOINT_REMOVED" and (.message|type=="string")'

require_api "posts.pagination.gone" "GET" "/api/posts/pagination?pageNumber=1&rowsPerPage=10&includeDeleted=false" "410"
assert_jq_or_abort "posts.pagination.gone.contract" '.code=="POSTS_LEGACY_ENDPOINT_REMOVED" and (.message|type=="string")'

require_api "posts.feed.page1" "GET" "/api/posts/feed?page=1&limit=10&includeDeleted=false" "200"
assert_jq_or_abort "posts.feed.page1.shape" '.success==true and (.posts|type=="array") and (.pagination.currentPage==1) and (.pagination.postsPerPage==10) and (.pagination.totalPages>=0) and (.pagination.totalPosts>=0)'
assert_jq_or_abort "posts.feed.page1.post.shape" '(.posts|length==0) or ((.posts[0].id|tostring|length>0) and (.posts[0].sellerId|tostring|length>0) and (.posts[0].categoryId|tostring|length>0) and (.posts[0].images|type=="array"))'
first_post_id="$(printf "%s" "$LAST_BODY" | jq -r '.posts[0].id // empty')"

if is_positive_int "$first_post_id"; then
  require_api "posts.byid" "GET" "/api/posts/$first_post_id" "200"
  require_api "posts.exists" "GET" "/api/posts/Exists/$first_post_id" "200"
  assert_jq_or_abort "posts.exists.true" '. == true'
else
  log_skip "posts.byid / posts.exists (no posts returned)"
fi

require_api "posts.user.filter" "GET" "/api/posts/user/1" "200"
assert_jq "posts.user.filter.array" 'type=="array"'
require_api "posts.category.filter" "GET" "/api/posts/category/$first_category_id" "200"
assert_jq "posts.category.filter.array" 'type=="array"'

require_api "search.basic" "GET" "/api/search?query=api&page=1&limit=10" "200"
assert_jq_or_abort "search.basic.shape" '.success==true and (.posts|type=="array") and (.pagination.currentPage >= 1)'

require_api "sellers.top" "GET" "/api/sellers/top" "200"
assert_jq_or_abort "sellers.top.array" 'type=="array"'

require_api "sellers.profile.user1" "GET" "/api/sellers/$user1_id" "200"
assert_jq_or_abort "sellers.profile.user1.shape" '.success==true and (.seller.id != null) and (.posts|type=="array")'

require_api "postimages.all" "GET" "/api/TbPostImages/All" "200"
assert_jq "postimages.all.array" 'type=="array"'
if is_positive_int "$first_post_id"; then
  require_api "postimages.by_post" "GET" "/api/TbPostImages/post/$first_post_id" "200"
  assert_jq "postimages.by_post.array" 'type=="array"'
else
  log_skip "postimages.by_post (no posts returned)"
fi
first_image_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].PostImageID // empty')"
if is_positive_int "$first_image_id"; then
  require_api "postimages.byid" "GET" "/api/TbPostImages/$first_image_id" "200,404"
  require_api "postimages.exists" "GET" "/api/TbPostImages/Exists/$first_image_id" "200"
else
  log_skip "postimages.byid / postimages.exists (no images returned)"
fi

require_api "reviews.get.user1" "GET" "/api/reviews/user/$user1_id" "200"
assert_jq "reviews.get.array" 'type=="array"'

# 3. Category CRUD (admin-only)
new_category_payload="$(jq -nc \
  --arg n "API Category $ts" \
  --arg na "API Category AR $ts" \
  --arg i "box" \
  --arg c "#0A4ABF" \
  --arg img "https://example.com/categories/api-$ts.jpg" \
  --arg t "$now_iso" \
  '{CategoryID:null,CategoryName:$n,NameAr:$na,Icon:$i,Color:$c,Image:$img,CreatedAt:$t,IsDeleted:false}')"
if [ -n "$ADMIN_TOKEN" ]; then
  require_api "categories.create" "POST" "/api/categories" "201" "$new_category_payload" "$ADMIN_TOKEN"
  new_category_id="$(printf "%s" "$LAST_BODY" | jq -r '.CategoryID // .categoryID // empty')"
  if ! is_positive_int "$new_category_id"; then
    abort_verification "categories.create.id" "Invalid CategoryID in response: '$new_category_id'"
  else
    require_api "categories.get.new" "GET" "/api/categories/$new_category_id" "200"
    assert_jq_or_abort "categories.get.new.visual_fields" '.CategoryName != null and (.Icon // "") == "box" and (.Color // "") == "#0A4ABF" and ((.Image // "") | startswith("https://example.com/categories/api-"))'

    updated_category_payload="$(jq -nc \
      --argjson id "$new_category_id" \
      --arg n "API Category Updated $ts" \
      --arg na "API Category Updated AR $ts" \
      --arg i "camera" \
      --arg c "#111827" \
      --arg img "https://example.com/categories/api-updated-$ts.jpg" \
      --arg t "$now_iso" \
      '{CategoryID:$id,CategoryName:$n,NameAr:$na,Icon:$i,Color:$c,Image:$img,CreatedAt:$t,IsDeleted:false}')"
    require_api "categories.update" "PUT" "/api/categories/$new_category_id" "200" "$updated_category_payload" "$ADMIN_TOKEN"
    assert_jq_or_abort "categories.update.visual_fields" '(.Icon // "") == "camera" and (.Color // "") == "#111827" and ((.Image // "") | startswith("https://example.com/categories/api-updated-"))'
    require_api "categories.delete" "DELETE" "/api/categories/$new_category_id" "200" "" "$ADMIN_TOKEN"
  fi
else
  require_api "categories.create.restricted" "POST" "/api/categories" "401,403" "$new_category_payload" "$token1"
fi

# 4. Role CRUD (admin-only)
new_role_payload="$(jq -nc --arg n "api-role-$ts" --arg t "$now_iso" '{RoleID:null,RoleName:$n,CreatedAt:$t,IsDeleted:false}')"
if [ -n "$ADMIN_TOKEN" ]; then
  require_api "roles.create" "POST" "/api/TbRoles" "201" "$new_role_payload" "$ADMIN_TOKEN"
  new_role_id="$(printf "%s" "$LAST_BODY" | jq -r '.RoleID // empty')"
  if ! is_positive_int "$new_role_id"; then
    abort_verification "roles.create.id" "Invalid RoleID in response: '$new_role_id'"
  else
    updated_role_payload="$(jq -nc --argjson id "$new_role_id" --arg n "api-role-updated-$ts" --arg t "$now_iso" '{RoleID:$id,RoleName:$n,CreatedAt:$t,IsDeleted:false}')"
    require_api "roles.update" "PUT" "/api/TbRoles/$new_role_id" "200" "$updated_role_payload" "$ADMIN_TOKEN"
    require_api "roles.delete" "DELETE" "/api/TbRoles/$new_role_id" "200" "" "$ADMIN_TOKEN"
  fi
else
  require_api "roles.create.restricted" "POST" "/api/TbRoles" "401,403" "$new_role_payload" "$token1"
fi

# 5. Post + image CRUD and status/views
require_positive_int "$user2_id" "posts.create.user2_id"
require_positive_int "$first_category_id" "posts.create.category_id"
new_post_payload="$(jq -nc --argjson uid "$user2_id" --argjson cid "$first_category_id" --arg t "$now_iso" '{PostID:null,UserID:$uid,CategoryID:$cid,PostTitle:"API test post",PostDescription:"Created by verify_all_apis.sh",Price:123.45,Status:0,CreatedAt:$t,IsDeleted:false,Views:0,City:"Amman",Area:"Abdali",Images:["https://example.com/a.jpg"]}')"
require_api "posts.create" "POST" "/api/posts" "201" "$new_post_payload" "$token2"
new_post_id="$(printf "%s" "$LAST_BODY" | jq -r '.PostID // empty')"
if ! is_positive_int "$new_post_id"; then
  abort_verification "posts.create.id" "Invalid PostID in response: '$new_post_id'"
else
  require_api "posts.get.new" "GET" "/api/posts/$new_post_id" "200"
  post_for_update="$LAST_BODY"
  post_update_payload="$(printf "%s" "$post_for_update" | jq '.PostTitle="API test post updated" | .Price=222.22')"
  require_api "posts.update" "PUT" "/api/posts/$new_post_id" "200" "$post_update_payload" "$token2"

  require_api "posts.views.increment" "POST" "/api/posts/$new_post_id/views" "200"
  require_api "posts.status.patch" "PATCH" "/api/posts/$new_post_id/status" "200" '{"Status":"ACTIVE"}' "$token2"
  require_api "posts.feed.newpost" "GET" "/api/posts/feed?page=1&limit=100&includeDeleted=false" "200"
  assert_jq "posts.feed.newpost.present" ".success==true and ((.posts|map(.id|tostring)|index(\"$new_post_id\")) != null)"
  require_api "posts.user.filter.newuser" "GET" "/api/posts/user/$user2_id" "200"
  assert_jq "posts.user.filter.newuser.nonempty" 'type=="array" and length>0'
  require_api "posts.category.filter.newpost" "GET" "/api/posts/category/$first_category_id" "200"
  assert_jq "posts.category.filter.newpost.nonempty" 'type=="array" and length>0'

  favorite_payload="$(jq -nc --arg pid "$new_post_id" '{postId:$pid}')"
  require_api "favorites.add.user1.newpost" "POST" "/api/favorites" "200" "$favorite_payload" "$token1"
  require_api "favorites.get.user1.after.add" "GET" "/api/favorites" "200" "" "$token1"
  assert_jq "favorites.get.user1.after.add.nonempty" '.success==true and (.favorites|type=="array") and ((.favorites|length) >= 1)'
  require_api "favorites.remove.user1.newpost" "DELETE" "/api/favorites/$new_post_id" "200" "" "$token1"
  require_api "favorites.get.user1.after.remove" "GET" "/api/favorites" "200" "" "$token1"
  assert_jq "favorites.get.user1.after.remove.shape" '.success==true and (.favorites|type=="array")'

  require_api "search.newpost.query" "GET" "/api/search?query=API%20test%20post&page=1&limit=20" "200"
  assert_jq "search.newpost.query.shape" '.success==true and (.posts|type=="array")'

  new_image_payload="$(jq -nc --argjson pid "$new_post_id" --arg t "$now_iso" '{PostImageID:null,PostID:$pid,PostImageURL:"https://example.com/api-test-image.jpg",UploadedAt:$t,IsDeleted:false}')"
  require_api "postimages.create" "POST" "/api/TbPostImages" "201" "$new_image_payload" "$token2"
  new_image_id="$(printf "%s" "$LAST_BODY" | jq -r '.PostImageID // empty')"
  if ! is_positive_int "$new_image_id"; then
    abort_verification "postimages.create.id" "Invalid PostImageID in response: '$new_image_id'"
  else
    update_image_payload="$(jq -nc --argjson iid "$new_image_id" --argjson pid "$new_post_id" --arg t "$now_iso" '{PostImageID:$iid,PostID:$pid,PostImageURL:"https://example.com/api-test-image-updated.jpg",UploadedAt:$t,IsDeleted:false}')"
    require_api "postimages.update" "PUT" "/api/TbPostImages/$new_image_id" "200" "$update_image_payload" "$token2"
    require_api "postimages.get.new" "GET" "/api/TbPostImages/$new_image_id" "200"
    require_api "postimages.delete" "DELETE" "/api/TbPostImages/$new_image_id" "200" "" "$token2"
  fi
fi

# 6. Reviews and chat authenticated flow
review_payload="$(jq -nc --argjson rid "$user2_id" --argjson reviewed "$user1_id" --arg t "$now_iso" '{ReviewID:null,ReviewerID:$rid,ReviewedUserID:$reviewed,Rating:5,Comment:"Great seller from API test",Timestamp:$t}')"
require_api "reviews.create" "POST" "/api/reviews" "201,403" "$review_payload" "$token2"
require_api "reviews.get.user1.after" "GET" "/api/reviews/user/$user1_id" "200"
assert_jq "reviews.get.user1.after.nonempty" 'type=="array" and length>0'

chat_post_id="${new_post_id:-$first_post_id}"
if ! is_positive_int "$chat_post_id"; then
  abort_verification "chat.prereq.post_id" "No valid numeric post ID available for chat flow (got '$chat_post_id')."
fi
message_payload="$(jq -nc --argjson sid "$user2_id" --argjson rid "$user1_id" --argjson pid "$chat_post_id" --arg t "$now_iso" '{MessageId:null,SenderId:$sid,ReceiverId:$rid,PostId:$pid,Content:"Hello from API test",Timestamp:$t,IsRead:false}')"
require_api "chat.send" "POST" "/api/chat/send" "200" "$message_payload" "$token2"
require_api "chat.recent.user2" "GET" "/api/chat/recent" "200" "" "$token2"
assert_jq "chat.recent.user2.array" 'type=="array"'
require_api "chat.history.user1-user2" "GET" "/api/chat/history/$user2_id" "200" "" "$token1"
assert_jq "chat.history.user1-user2.nonempty" 'type=="array" and length>0'

# 7. User protected endpoints
require_api "users.exists.auth" "GET" "/api/users/Exists/$user1_id" "200" "" "$token1"
assert_jq "users.exists.auth.true" '. == true'

require_api "users.get.user2.before.update" "GET" "/api/users/$user2_id" "200"
user2_model="$(printf "%s" "$LAST_BODY" | jq '.FirstName="APIUpdated"')"
require_api "users.update.user2" "PUT" "/api/users/$user2_id" "200" "$user2_model" "$token2"

# 8. Delete test user without dependencies (user3)
signup3_payload="$(jq -nc --arg e "$email3" '{Email:$e,Password:"P@ssw0rd123",FirstName:"API",LastName:"DeleteMe",Phone:"+962790000003",City:"Amman",Area:"Dabouq"}')"
require_api "auth.signup.user3" "POST" "/api/auth/signup" "201" "$signup3_payload"
token3="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
user3_id="$(printf "%s" "$LAST_BODY" | jq -r '.User.Id // .User.UserID // .User.id // empty')"
require_non_empty "$token3" "auth.signup.user3.token"
require_positive_int "$user3_id" "auth.signup.user3.id"
require_api "users.delete.user3" "DELETE" "/api/users/$user3_id" "200" "" "$token3"

# 9. Cleanup created post and auth logout
if [ -n "${new_post_id:-}" ]; then
  if is_positive_int "$new_post_id"; then
    require_api "posts.delete.new" "DELETE" "/api/posts/$new_post_id" "200" "" "$token2"
  fi
fi
require_api "auth.logout.user1" "POST" "/api/auth/logout" "200" "" "$token1"
require_api "auth.logout.user2" "POST" "/api/auth/logout" "200" "" "$token2"

print_summary

if [ "$FAIL_COUNT" -gt 0 ]; then
  exit 1
fi
