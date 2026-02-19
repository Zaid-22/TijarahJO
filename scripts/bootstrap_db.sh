#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/api/src/Api"
DB_SCRIPTS_DIR="$ROOT_DIR/apps/api/database/scripts"
DB_BUNDLES_DIR="$ROOT_DIR/apps/api/database/bundles"
DOCKER_COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
SQL_BUNDLE_BUILDER="$DB_SCRIPTS_DIR/build_sql_bundles.sh"
MASTER_SQL_BUNDLE="$DB_BUNDLES_DIR/master.sql"
SEED_BASELINE_SQL_BUNDLE="$DB_BUNDLES_DIR/seed_data.sql"
SEED_DEV_SQL_BUNDLE="$DB_BUNDLES_DIR/seed_dev.sql"
SEED_TEST_SQL_BUNDLE="$DB_BUNDLES_DIR/seed_test.sql"
VERIFY_SCRIPT="$ROOT_DIR/scripts/verify_all_apis.sh"
CONTAINER_NAME="tijarahjo-db"
SQLCMD_IN_CONTAINER="/opt/mssql-tools18/bin/sqlcmd"
BACKEND_LOG_FILE="${BACKEND_LOG_FILE:-/tmp/tijarahjo_bootstrap_backend.log}"
BACKEND_PID_FILE="${BACKEND_PID_FILE:-$ROOT_DIR/.tijarahjo_backend.pid}"

RESET_VOLUME=1
RUN_VERIFY=1
KEEP_BACKEND_RUNNING=0
APPLY_DEV_SEEDS="${APPLY_DEV_SEEDS:-false}"
APPLY_TEST_SEEDS="${APPLY_TEST_SEEDS:-false}"

print_usage() {
  cat <<'EOF'
Usage: ./scripts/bootstrap_db.sh [options]

Options:
  --no-volume-reset   Keep Docker volume; still recreates TijarahJoDB database.
  --no-verify         Skip verify_all_apis.sh.
  --keep-backend      Keep backend process running after completion.
  --with-dev-seeds    Apply development seed bundle after baseline seeds.
  --with-test-seeds   Apply test seed bundle after baseline seeds.
  -h, --help          Show this help message.

Environment:
  MSSQL_SA_PASSWORD   SQL sa password (required; set in shell or .env)
  JWT_SIGNING_KEY     Backend JWT key (required; set in shell or .env)
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
    --with-dev-seeds)
      APPLY_DEV_SEEDS="true"
      shift
      ;;
    --with-test-seeds)
      APPLY_TEST_SEEDS="true"
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

if [[ -z "${MSSQL_SA_PASSWORD:-}" ]]; then
  echo "Error: MSSQL_SA_PASSWORD is not set."
  echo "Set it in your shell or $ROOT_DIR/.env before running scripts/bootstrap_db.sh." >&2
  exit 1
fi

if [[ -z "${JWT_SIGNING_KEY:-}" ]]; then
  echo "Error: JWT_SIGNING_KEY is not set."
  echo "Set it in your shell or $ROOT_DIR/.env before running scripts/bootstrap_db.sh." >&2
  exit 1
fi

SA_PASSWORD="$MSSQL_SA_PASSWORD"
JWT_SIGNING_KEY="$JWT_SIGNING_KEY"
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

if [[ ! -f "$DOCKER_COMPOSE_FILE" ]]; then
  echo "Error: Docker Compose file not found at $DOCKER_COMPOSE_FILE" >&2
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
  echo "==> Resetting SQL Docker volume (docker compose -f \"$DOCKER_COMPOSE_FILE\" down -v)..."
  MSSQL_SA_PASSWORD="$SA_PASSWORD" docker compose -f "$DOCKER_COMPOSE_FILE" down -v >/dev/null
fi
MSSQL_SA_PASSWORD="$SA_PASSWORD" docker compose -f "$DOCKER_COMPOSE_FILE" up -d >/dev/null

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
docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -Q "USE master; IF DB_ID('TijarahJoDB') IS NOT NULL BEGIN ALTER DATABASE [TijarahJoDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [TijarahJoDB]; END;"

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

if [[ -f "$SEED_BASELINE_SQL_BUNDLE" ]]; then
  apply_sql_file "$SEED_BASELINE_SQL_BUNDLE"
else
  echo "Warning: baseline seed bundle was not generated at $SEED_BASELINE_SQL_BUNDLE (continuing without seeds)."
fi

if [[ "$APPLY_DEV_SEEDS" == "1" || "$APPLY_DEV_SEEDS" == "true" ]]; then
  if [[ -f "$SEED_DEV_SQL_BUNDLE" ]]; then
    apply_sql_file "$SEED_DEV_SQL_BUNDLE"
  else
    echo "Warning: dev seed bundle was not generated at $SEED_DEV_SQL_BUNDLE (skipping dev seeds)."
  fi
fi

if [[ "$APPLY_TEST_SEEDS" == "1" || "$APPLY_TEST_SEEDS" == "true" ]]; then
  if [[ -f "$SEED_TEST_SQL_BUNDLE" ]]; then
    apply_sql_file "$SEED_TEST_SQL_BUNDLE"
  else
    echo "Warning: test seed bundle was not generated at $SEED_TEST_SQL_BUNDLE (skipping test seeds)."
  fi
fi

echo "==> Starting backend..."
if lsof -ti tcp:5033 >/dev/null 2>&1; then
  lsof -ti tcp:5033 | xargs kill -9 || true
fi

if [[ "$KEEP_BACKEND_RUNNING" -eq 1 ]]; then
  (
    cd "$BACKEND_DIR"
    nohup env \
      ASPNETCORE_ENVIRONMENT=Development \
      ASPNETCORE_URLS="$BACKEND_URL" \
      JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
      DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=${SA_PASSWORD};Encrypt=True;TrustServerCertificate=True;" \
      dotnet run --no-launch-profile >>"$BACKEND_LOG_FILE" 2>&1 < /dev/null &
    echo $! > "$BACKEND_PID_FILE"
  )
  BACKEND_PID="$(cat "$BACKEND_PID_FILE")"
else
  (
    cd "$BACKEND_DIR"
    ASPNETCORE_ENVIRONMENT=Development \
    ASPNETCORE_URLS="$BACKEND_URL" \
    JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
    DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=${SA_PASSWORD};Encrypt=True;TrustServerCertificate=True;" \
    dotnet run --no-launch-profile >"$BACKEND_LOG_FILE" 2>&1
  ) &
  BACKEND_PID=$!
fi

cleanup_processes() {
  if [[ "$KEEP_BACKEND_RUNNING" -eq 0 ]]; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup_processes EXIT

echo "==> Waiting for backend readiness..."
for i in $(seq 1 90); do
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    echo "Error: backend process exited before readiness checks completed." >&2
    echo "Backend log: $BACKEND_LOG_FILE" >&2
    tail -n 150 "$BACKEND_LOG_FILE" || true
    exit 1
  fi
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
