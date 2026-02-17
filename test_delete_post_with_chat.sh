#!/usr/bin/env bash

set -u

BASE_URL="${BASE_URL:-http://localhost:5033}"
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

echo "Running delete-post-with-chat regression check against $BASE_URL"

ts="$(date +%s)"
now_iso="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"

email1="reg_delete_${ts}_1@example.com"
email2="reg_delete_${ts}_2@example.com"

# 1) Create users and get tokens.
signup1_payload="$(jq -nc --arg e "$email1" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Delete",LastName:"Tester1",Phone:"+962790010001",City:"Amman",Area:"Abdali"}')"
call_api "auth.signup.user1" "POST" "/api/auth/signup" "201" "$signup1_payload"
token1="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
user1_id="$(printf "%s" "$LAST_BODY" | jq -r '.User.Id // .User.UserID // .User.id // empty')"
assert_jq "auth.signup.user1.token.present" '.Token | type=="string" and (length>20)'

signup2_payload="$(jq -nc --arg e "$email2" '{Email:$e,Password:"P@ssw0rd123",FirstName:"Delete",LastName:"Tester2",Phone:"+962790010002",City:"Amman",Area:"Khalda"}')"
call_api "auth.signup.user2" "POST" "/api/auth/signup" "201" "$signup2_payload"
token2="$(printf "%s" "$LAST_BODY" | jq -r '.Token // empty')"
user2_id="$(printf "%s" "$LAST_BODY" | jq -r '.User.Id // .User.UserID // .User.id // empty')"
assert_jq "auth.signup.user2.token.present" '.Token | type=="string" and (length>20)'

# 2) Get an existing category.
call_api "categories.all" "GET" "/api/categories/All" "200"
first_category_id="$(printf "%s" "$LAST_BODY" | jq -r '.[0].CategoryID // empty')"
if [ -z "$first_category_id" ]; then
  log_fail "categories.all.first_id" "No category returned"
fi

# 3) Create a post owned by user2.
new_post_id=""
if [ -n "$user2_id" ] && [ -n "$first_category_id" ]; then
  new_post_payload="$(jq -nc --argjson uid "$user2_id" --argjson cid "$first_category_id" --arg t "$now_iso" '{PostID:null,UserID:$uid,CategoryID:$cid,PostTitle:"Regression delete post",PostDescription:"Post used by delete regression test",Price:100,Status:0,CreatedAt:$t,IsDeleted:false,Views:0,City:"Amman",Area:"Abdali",Images:["https://example.com/regression.jpg"]}')"
  call_api "posts.create" "POST" "/api/posts" "201" "$new_post_payload" "$token2"
  new_post_id="$(printf "%s" "$LAST_BODY" | jq -r '.PostID // empty')"
  if [ -z "$new_post_id" ]; then
    log_fail "posts.create.id" "No PostID in response"
  fi
else
  log_fail "posts.create.precheck" "Missing user2_id or category_id before post creation"
fi

# 4) Send chat message referencing this post.
if [ -n "$new_post_id" ] && [ -n "$user1_id" ] && [ -n "$user2_id" ]; then
  message_payload="$(jq -nc --argjson sid "$user1_id" --argjson rid "$user2_id" --argjson pid "$new_post_id" --arg t "$now_iso" '{MessageId:null,SenderId:$sid,ReceiverId:$rid,PostId:$pid,Content:"Regression message linked to post",Timestamp:$t,IsRead:false}')"
  call_api "chat.send" "POST" "/api/chat/send" "200" "$message_payload" "$token1"
fi

# 5) Delete the post and ensure it succeeds.
if [ -n "$new_post_id" ]; then
  call_api "posts.delete" "DELETE" "/api/posts/$new_post_id" "200" "" "$token2"
  call_api "posts.exists.after.delete" "GET" "/api/posts/Exists/$new_post_id" "200"
  assert_jq "posts.exists.after.delete.false" '. == false'
fi

# 6) Cleanup users.
if [ -n "$user1_id" ] && [ -n "$token1" ]; then
  call_api "users.delete.user1" "DELETE" "/api/users/$user1_id" "200" "" "$token1"
fi

if [ -n "$user2_id" ] && [ -n "$token2" ]; then
  call_api "users.delete.user2" "DELETE" "/api/users/$user2_id" "200" "" "$token2"
fi

echo
echo "========================================="
echo "Regression summary: PASS=$PASS_COUNT FAIL=$FAIL_COUNT"
echo "========================================="

if [ "$FAIL_COUNT" -ne 0 ]; then
  exit 1
fi
