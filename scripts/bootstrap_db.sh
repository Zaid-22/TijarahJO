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
CONFIGURATION="${CONFIGURATION:-Debug}"


RESET_VOLUME=1
RUN_VERIFY=1
KEEP_BACKEND_RUNNING=0
ENABLE_DEV_SEEDS=0
ENABLE_TEST_SEEDS=0

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
  DB_RUNTIME_PRINCIPAL Runtime DB principal for backend connection: app|sa (default: app)
  DB_APP_LOGIN        App DB login when DB_RUNTIME_PRINCIPAL=app (default: tijarahjo_app)
  DB_APP_PASSWORD     App DB password when DB_RUNTIME_PRINCIPAL=app (required; no fallback)
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
      ENABLE_DEV_SEEDS=1
      shift
      ;;
    --with-test-seeds)
      ENABLE_TEST_SEEDS=1
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
DB_RUNTIME_PRINCIPAL="${DB_RUNTIME_PRINCIPAL:-app}"
DB_APP_LOGIN="${DB_APP_LOGIN:-tijarahjo_app}"
DB_APP_PASSWORD="${DB_APP_PASSWORD:-}"
RUNTIME_DB_USER="sa"
RUNTIME_DB_PASSWORD="$SA_PASSWORD"

if [[ "$DB_RUNTIME_PRINCIPAL" != "app" && "$DB_RUNTIME_PRINCIPAL" != "sa" ]]; then
  echo "Error: DB_RUNTIME_PRINCIPAL must be either 'app' or 'sa' (got '$DB_RUNTIME_PRINCIPAL')." >&2
  exit 1
fi

if [[ "$DB_RUNTIME_PRINCIPAL" == "app" && -z "${DB_APP_PASSWORD:-}" ]]; then
  echo "Error: DB_APP_PASSWORD must be set when DB_RUNTIME_PRINCIPAL=app." >&2
  echo "Use a secret manager or CI secret and inject DB_APP_PASSWORD at runtime." >&2
  exit 1
fi

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
  cat "$file_path" | docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -I
}

configure_runtime_db_principal() {
  if [[ "$DB_RUNTIME_PRINCIPAL" == "sa" ]]; then
    RUNTIME_DB_USER="sa"
    RUNTIME_DB_PASSWORD="$SA_PASSWORD"
    echo "==> Runtime DB principal: sa (explicit override)."
    return
  fi

  if [[ ! "$DB_APP_LOGIN" =~ ^[A-Za-z][A-Za-z0-9_]{2,63}$ ]]; then
    echo "Error: DB_APP_LOGIN must match ^[A-Za-z][A-Za-z0-9_]{2,63}$ (got '$DB_APP_LOGIN')." >&2
    exit 1
  fi

  local escaped_app_password
  escaped_app_password="$(printf "%s" "$DB_APP_PASSWORD" | sed "s/'/''/g")"

  cat <<SQL | docker exec -i "$CONTAINER_NAME" "$SQLCMD_IN_CONTAINER" -S localhost -U sa -P "$SA_PASSWORD" -C -b -I >/dev/null
USE master;
IF NOT EXISTS (SELECT 1 FROM sys.sql_logins WHERE name = N'${DB_APP_LOGIN}')
BEGIN
    CREATE LOGIN [${DB_APP_LOGIN}] WITH PASSWORD = N'${escaped_app_password}', CHECK_POLICY = ON, CHECK_EXPIRATION = OFF;
END
ELSE
BEGIN
    ALTER LOGIN [${DB_APP_LOGIN}] WITH PASSWORD = N'${escaped_app_password}';
END
GO

USE TijarahJoDB;
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'${DB_APP_LOGIN}')
BEGIN
    CREATE USER [${DB_APP_LOGIN}] FOR LOGIN [${DB_APP_LOGIN}];
END
GO

GRANT CONNECT TO [${DB_APP_LOGIN}];

IF EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS rm
    INNER JOIN sys.database_principals AS r ON r.principal_id = rm.role_principal_id
    INNER JOIN sys.database_principals AS m ON m.principal_id = rm.member_principal_id
    WHERE r.name = N'db_datareader' AND m.name = N'${DB_APP_LOGIN}'
)
BEGIN
    ALTER ROLE db_datareader DROP MEMBER [${DB_APP_LOGIN}];
END

IF EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS rm
    INNER JOIN sys.database_principals AS r ON r.principal_id = rm.role_principal_id
    INNER JOIN sys.database_principals AS m ON m.principal_id = rm.member_principal_id
    WHERE r.name = N'db_datawriter' AND m.name = N'${DB_APP_LOGIN}'
)
BEGIN
    ALTER ROLE db_datawriter DROP MEMBER [${DB_APP_LOGIN}];
END

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app_runtime' AND type = N'R')
BEGIN
    CREATE ROLE [tijarahjo_app_runtime] AUTHORIZATION [dbo];
END

IF NOT EXISTS
(
    SELECT 1
    FROM sys.database_role_members AS rm
    INNER JOIN sys.database_principals AS r ON r.principal_id = rm.role_principal_id
    INNER JOIN sys.database_principals AS m ON m.principal_id = rm.member_principal_id
    WHERE r.name = N'tijarahjo_app_runtime' AND m.name = N'${DB_APP_LOGIN}'
)
BEGIN
    ALTER ROLE [tijarahjo_app_runtime] ADD MEMBER [${DB_APP_LOGIN}];
END

-- Reset legacy schema-level grants before applying least-privilege grants.
REVOKE SELECT, INSERT, UPDATE, DELETE ON SCHEMA::dbo TO [tijarahjo_app_runtime];

-- Runtime principal is data-access only: block destructive/DDL paths.
DENY DELETE ON SCHEMA::dbo TO [tijarahjo_app_runtime];
DENY ALTER ON SCHEMA::dbo TO [tijarahjo_app_runtime];
DENY CONTROL ON SCHEMA::dbo TO [tijarahjo_app_runtime];
DENY REFERENCES ON SCHEMA::dbo TO [tijarahjo_app_runtime];

GRANT SELECT ON dbo.Users TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Roles TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Categories TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Posts TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.PostImages TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Favorites TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Reviews TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Conversations TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Messages TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Notifications TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.PushSubscriptions TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.UserExternalIdentities TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Cities TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.Areas TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.UserStatusLookup TO [tijarahjo_app_runtime];
GRANT SELECT ON dbo.PostStatusLookup TO [tijarahjo_app_runtime];

GRANT INSERT, UPDATE ON dbo.Users TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Categories TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Posts TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.PostImages TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Favorites TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Reviews TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Conversations TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Messages TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.Notifications TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.PushSubscriptions TO [tijarahjo_app_runtime];
GRANT INSERT, UPDATE ON dbo.UserExternalIdentities TO [tijarahjo_app_runtime];

-- Explicitly keep reference/metadata tables read-only for runtime.
DENY INSERT, UPDATE, DELETE ON dbo.Roles TO [tijarahjo_app_runtime];
DENY INSERT, UPDATE, DELETE ON dbo.UserStatusLookup TO [tijarahjo_app_runtime];
DENY INSERT, UPDATE, DELETE ON dbo.PostStatusLookup TO [tijarahjo_app_runtime];
DENY INSERT, UPDATE, DELETE ON dbo.Cities TO [tijarahjo_app_runtime];
DENY INSERT, UPDATE, DELETE ON dbo.Areas TO [tijarahjo_app_runtime];
DENY INSERT, UPDATE, DELETE ON dbo.SchemaMigrations TO [tijarahjo_app_runtime];
GO
SQL

  RUNTIME_DB_USER="$DB_APP_LOGIN"
  RUNTIME_DB_PASSWORD="$DB_APP_PASSWORD"
  echo "==> Runtime DB principal: app login '$DB_APP_LOGIN' (explicit object-level least privilege)."
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

if [[ "$ENABLE_DEV_SEEDS" -eq 1 ]]; then
  if [[ -f "$SEED_DEV_SQL_BUNDLE" ]]; then
    apply_sql_file "$SEED_DEV_SQL_BUNDLE"
  else
    echo "Warning: dev seed bundle was not generated at $SEED_DEV_SQL_BUNDLE (skipping dev seeds)."
  fi
fi

if [[ "$ENABLE_TEST_SEEDS" -eq 1 ]]; then
  if [[ -f "$SEED_TEST_SQL_BUNDLE" ]]; then
    apply_sql_file "$SEED_TEST_SQL_BUNDLE"
  else
    echo "Warning: test seed bundle was not generated at $SEED_TEST_SQL_BUNDLE (skipping test seeds)."
  fi
fi

configure_runtime_db_principal

echo "==> Starting backend..."
if lsof -ti tcp:5033 >/dev/null 2>&1; then
  lsof -ti tcp:5033 | xargs kill -9 || true
fi

if [[ "$KEEP_BACKEND_RUNNING" -eq 1 ]]; then
  BACKEND_DLL_PATH="$BACKEND_DIR/bin/$CONFIGURATION/net8.0/TijarahJo.Api.dll"
  (
    cd "$BACKEND_DIR"
    # Build once, then run the compiled app directly so PID tracking stays stable.
    if [[ ! -f "$BACKEND_DLL_PATH" ]]; then
      dotnet build -c "$CONFIGURATION" --nologo >/dev/null
      if [[ ! -f "$BACKEND_DLL_PATH" ]]; then
        echo "Error: backend build output not found at $BACKEND_DLL_PATH" >&2
        exit 1
      fi
    fi

    nohup env \
      ASPNETCORE_ENVIRONMENT=Development \
      ASPNETCORE_URLS="$BACKEND_URL" \
      JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
      DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=${RUNTIME_DB_USER};Password=${RUNTIME_DB_PASSWORD};Encrypt=True;TrustServerCertificate=True;" \
      dotnet "$BACKEND_DLL_PATH" >>"$BACKEND_LOG_FILE" 2>&1 < /dev/null &
    echo $! > "$BACKEND_PID_FILE"
  )
  BACKEND_PID="$(cat "$BACKEND_PID_FILE")"
else
  (
    cd "$BACKEND_DIR"
    ASPNETCORE_ENVIRONMENT=Development \
    ASPNETCORE_URLS="$BACKEND_URL" \
    JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
    DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=${RUNTIME_DB_USER};Password=${RUNTIME_DB_PASSWORD};Encrypt=True;TrustServerCertificate=True;" \
    dotnet run -c "$CONFIGURATION" --no-launch-profile >"$BACKEND_LOG_FILE" 2>&1
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
