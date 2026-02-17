#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
DB_SCRIPTS_DIR="$ROOT_DIR/TijarahJo-Backend/TijarahJoDBAPI/database/scripts"
SQL_BUNDLE_BUILDER="$DB_SCRIPTS_DIR/build_sql_bundles.sh"
MASTER_SQL_BUNDLE="$DB_SCRIPTS_DIR/bundles/master.sql"
VERIFY_SCRIPT="$ROOT_DIR/verify_all_apis.sh"
CONTAINER_NAME="tijarahjo-db"
SQLCMD_IN_CONTAINER="/opt/mssql-tools18/bin/sqlcmd"
BACKEND_LOG_FILE="${BACKEND_LOG_FILE:-/tmp/tijarahjo_bootstrap_backend.log}"

DEFAULT_SA_PASSWORD="TijarahJo#2026!Secure"
DEFAULT_JWT_SIGNING_KEY="LocalDevSigningKey_ChangeMe_ButAtLeast32Chars_123456"

RESET_VOLUME=1
RUN_VERIFY=1
KEEP_BACKEND_RUNNING=0

print_usage() {
  cat <<'EOF'
Usage: ./bootstrap_db.sh [options]

Options:
  --no-volume-reset   Keep Docker volume; still recreates TijarahJoDB database.
  --no-verify         Skip verify_all_apis.sh.
  --keep-backend      Keep backend process running after completion.
  -h, --help          Show this help message.

Environment:
  MSSQL_SA_PASSWORD   SQL sa password (default: TijarahJo#2026!Secure)
  JWT_SIGNING_KEY     Backend JWT key
  ASPNETCORE_URLS     Backend URL (default: http://localhost:5033)
  ADMIN_TOKEN         Optional token passed through to verify_all_apis.sh
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-volume-reset)
      RESET_VOLUME=0
      shift
      ;;
    --no-verify)
      RUN_VERIFY=0
      shift
      ;;
    --keep-backend)
      KEEP_BACKEND_RUNNING=1
      shift
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      print_usage
      exit 1
      ;;
  esac
done

if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

SA_PASSWORD="${MSSQL_SA_PASSWORD:-$DEFAULT_SA_PASSWORD}"
JWT_SIGNING_KEY="${JWT_SIGNING_KEY:-$DEFAULT_JWT_SIGNING_KEY}"
BACKEND_URL="${ASPNETCORE_URLS:-http://localhost:5033}"

for required_cmd in docker dotnet curl jq awk sed lsof; do
  if ! command -v "$required_cmd" >/dev/null 2>&1; then
    echo "Error: required command '$required_cmd' was not found in PATH." >&2
    exit 1
  fi
done

if ! docker compose version >/dev/null 2>&1; then
  echo "Error: 'docker compose' is not available." >&2
  exit 1
fi

if [[ ! -f "$VERIFY_SCRIPT" ]]; then
  echo "Error: verify script not found at $VERIFY_SCRIPT" >&2
  exit 1
fi

if [[ ! -x "$SQL_BUNDLE_BUILDER" ]]; then
  echo "Error: SQL bundle builder not found or not executable at $SQL_BUNDLE_BUILDER" >&2
  exit 1
fi

echo "==> Starting Docker SQL Server container..."
if [[ "$RESET_VOLUME" -eq 1 ]]; then
  echo "==> Resetting SQL Docker volume (docker compose down -v)..."
  MSSQL_SA_PASSWORD="$SA_PASSWORD" docker compose down -v >/dev/null
fi
MSSQL_SA_PASSWORD="$SA_PASSWORD" docker compose up -d >/dev/null

echo "==> Waiting for SQL Server readiness..."
for i in $(seq 1 90); do
  if docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -Q "SELECT 1" >/dev/null 2>&1; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 90 ]]; then
    echo "Error: SQL Server did not become ready in time." >&2
    exit 1
  fi
done

echo "==> Recreating TijarahJoDB..."
docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -Q "IF DB_ID('TijarahJoDB') IS NOT NULL BEGIN ALTER DATABASE [TijarahJoDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [TijarahJoDB]; END;"

apply_sql_file() {
  local file_path="$1"
  echo "==> Applying $(basename "$file_path")..."
  cat "$file_path" | docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -I >/dev/null
}

echo "==> Building consolidated SQL bundles..."
"$SQL_BUNDLE_BUILDER" >/dev/null

if [[ ! -f "$MASTER_SQL_BUNDLE" ]]; then
  echo "Error: consolidated SQL bundle was not generated at $MASTER_SQL_BUNDLE" >&2
  exit 1
fi

apply_sql_file "$MASTER_SQL_BUNDLE"

echo "==> Starting backend..."
if lsof -ti tcp:5033 >/dev/null 2>&1; then
  lsof -ti tcp:5033 | xargs kill -9 || true
fi

(
  cd "$BACKEND_DIR"
  ASPNETCORE_ENVIRONMENT=Development \
  ASPNETCORE_URLS="$BACKEND_URL" \
  JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
  DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;Encrypt=False;" \
  dotnet run --no-launch-profile >"$BACKEND_LOG_FILE" 2>&1
) &
BACKEND_PID=$!

cleanup_processes() {
  if [[ "$KEEP_BACKEND_RUNNING" -eq 0 ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup_processes EXIT

echo "==> Waiting for backend readiness..."
for i in $(seq 1 90); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$BACKEND_URL/swagger/index.html" || true)"
  if [[ "$code" == "200" ]]; then
    break
  fi
  sleep 2
  if [[ "$i" -eq 90 ]]; then
    echo "Error: backend did not become ready. Last HTTP code: $code" >&2
    echo "Backend log: $BACKEND_LOG_FILE" >&2
    tail -n 150 "$BACKEND_LOG_FILE" || true
    exit 1
  fi
done

echo "==> Backend is ready at $BACKEND_URL"

if [[ "$RUN_VERIFY" -eq 1 ]]; then
  echo "==> Running API verification..."
  BASE_URL="$BACKEND_URL" "$VERIFY_SCRIPT"
fi

if [[ "$KEEP_BACKEND_RUNNING" -eq 1 ]]; then
  echo "==> Done. Backend is still running (PID: $BACKEND_PID)."
else
  echo "==> Done."
fi
