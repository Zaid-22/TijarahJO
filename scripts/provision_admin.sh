#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_BASE_URL="${API_BASE_URL:-http://localhost:5033}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-tijarahjo-db}"
SQLCMD_IN_CONTAINER="${SQLCMD_IN_CONTAINER:-/opt/mssql-tools18/bin/sqlcmd}"
SQLCMD_UTF8_FLAGS=(-f 65001)
MSSQL_SA_PASSWORD="${MSSQL_SA_PASSWORD:-}"

ADMIN_EMAIL=""
ADMIN_PASSWORD=""
FIRST_NAME="Admin"
LAST_NAME="User"
PROMOTE_ONLY=0
GENERATE_PASSWORD=0

normalize_api_base_url() {
  local base_url="${1%/}"

  if [[ "$base_url" =~ /api/v[0-9]+$ ]]; then
    printf "%s" "$base_url"
    return
  fi

  if [[ "$base_url" =~ /api$ ]]; then
    printf "%s/v1" "$base_url"
    return
  fi

  printf "%s/api/v1" "$base_url"
}

usage() {
  cat <<'EOF'
Usage: ./scripts/provision_admin.sh --email <admin@email> [options]

Options:
  --email <email>            Admin email (required).
  --password <password>      Admin password for signup.
  --generate-password        Generate a one-time random password for signup.
  --first-name <name>        First name used for signup (default: Admin).
  --last-name <name>         Last name used for signup (default: User).
  --promote-only             Skip signup; only promote existing user to Admin role.
  --api-base-url <url>       API base URL (default: http://localhost:5033).
  -h, --help                 Show this help message.

Required environment:
  MSSQL_SA_PASSWORD          SQL Server sa password (used for role promotion).

Optional environment:
  DB_CONTAINER_NAME          SQL Server container name (default: tijarahjo-db).
  SQLCMD_IN_CONTAINER        sqlcmd path in container (default: /opt/mssql-tools18/bin/sqlcmd).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --email)
      ADMIN_EMAIL="${2:-}"
      shift 2
      ;;
    --password)
      ADMIN_PASSWORD="${2:-}"
      shift 2
      ;;
    --generate-password)
      GENERATE_PASSWORD=1
      shift
      ;;
    --first-name)
      FIRST_NAME="${2:-}"
      shift 2
      ;;
    --last-name)
      LAST_NAME="${2:-}"
      shift 2
      ;;
    --promote-only)
      PROMOTE_ONLY=1
      shift
      ;;
    --api-base-url)
      API_BASE_URL="${2:-}"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

API_BASE_URL="$(normalize_api_base_url "$API_BASE_URL")"

if [[ -z "$ADMIN_EMAIL" ]]; then
  echo "Error: --email is required." >&2
  usage
  exit 1
fi

for required_cmd in curl docker jq sed tr head grep; do
  if ! command -v "$required_cmd" >/dev/null 2>&1; then
    echo "Error: required command '$required_cmd' not found in PATH." >&2
    exit 1
  fi
done

if [[ -z "$MSSQL_SA_PASSWORD" ]]; then
  echo "Error: MSSQL_SA_PASSWORD is required." >&2
  exit 1
fi

if [[ "$PROMOTE_ONLY" -eq 0 ]]; then
  if [[ "$GENERATE_PASSWORD" -eq 1 && -z "$ADMIN_PASSWORD" ]]; then
    ADMIN_PASSWORD="$(LC_ALL=C tr -dc 'A-Za-z0-9!@#$%^&*_+=-' </dev/urandom | head -c 24 || true)"
  fi

  if [[ ${#ADMIN_PASSWORD} -lt 12 ]]; then
    echo "Error: generated/admin password is too short; retry with --password." >&2
    exit 1
  fi

  if [[ -z "$ADMIN_PASSWORD" ]]; then
    echo "Error: provide --password or --generate-password (unless using --promote-only)." >&2
    exit 1
  fi

  signup_payload="$(jq -cn \
    --arg email "$ADMIN_EMAIL" \
    --arg password "$ADMIN_PASSWORD" \
    --arg firstName "$FIRST_NAME" \
    --arg lastName "$LAST_NAME" \
    '{email:$email,password:$password,firstName:$firstName,lastName:$lastName}')"

  signup_response_file="$(mktemp)"
  signup_status="$(curl -sS \
    -o "$signup_response_file" \
    -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -d "$signup_payload" \
    "$API_BASE_URL/auth/signup" || true)"

  if [[ "$signup_status" == "201" || "$signup_status" == "200" ]]; then
    echo "Signup created user: $ADMIN_EMAIL"
  elif [[ "$signup_status" == "400" ]] && grep -Eqi "already|exists|duplicate|taken" "$signup_response_file"; then
    echo "Signup reports existing user. Continuing with role promotion for: $ADMIN_EMAIL"
  else
    echo "Error: signup failed (HTTP $signup_status)." >&2
    cat "$signup_response_file" >&2
    rm -f "$signup_response_file"
    exit 1
  fi

  rm -f "$signup_response_file"
fi

escaped_email="$(printf "%s" "$ADMIN_EMAIL" | sed "s/'/''/g")"

read -r -d '' promote_sql <<SQL || true
USE TijarahJoDB;
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET NUMERIC_ROUNDABORT OFF;

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Admin' AND ISNULL(IsDeleted, 0) = 0)
BEGIN
    INSERT INTO dbo.Roles (RoleName, IsDeleted, CreatedAt)
    VALUES (N'Admin', 0, SYSUTCDATETIME());
END

DECLARE @AdminRoleID INT = (
    SELECT TOP (1) RoleID
    FROM dbo.Roles
    WHERE RoleName = N'Admin'
    ORDER BY RoleID
);

IF @AdminRoleID IS NULL
BEGIN
    THROW 51101, 'Admin role could not be resolved.', 1;
END

UPDATE u
SET
    u.RoleID = @AdminRoleID,
    u.Status = 1,
    u.IsDeleted = 0
FROM dbo.Users AS u
WHERE u.Email = N'$escaped_email';

IF @@ROWCOUNT = 0
BEGIN
    THROW 51102, 'Admin user email was not found in dbo.Users.', 1;
END

SELECT TOP (1)
    u.UserID,
    u.Email,
    u.FirstName,
    u.LastName,
    u.Status,
    u.IsDeleted,
    r.RoleName
FROM dbo.Users AS u
INNER JOIN dbo.Roles AS r ON r.RoleID = u.RoleID
WHERE u.Email = N'$escaped_email'
ORDER BY u.UserID DESC;
SQL

printf "%s\n" "$promote_sql" | docker exec -i "$DB_CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" "${SQLCMD_UTF8_FLAGS[@]}" \
  -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -W -s "|"

echo
echo "Admin provisioning complete."
echo "Email: $ADMIN_EMAIL"
if [[ "$PROMOTE_ONLY" -eq 0 ]]; then
  echo "Password: $ADMIN_PASSWORD"
else
  echo "Password: unchanged (promote-only mode)."
fi
