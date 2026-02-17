#!/usr/bin/env bash

set -euo pipefail

# Script to run both Backend and Frontend
# Usage: ./run-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
FRONTEND_DIR="$ROOT_DIR/TijarahJo-frontend"
BACKEND_URL="${ASPNETCORE_URLS:-http://localhost:5033}"
DATABASE_CONNECTION_SOURCE=""

DEFAULT_JWT_SIGNING_KEY="LocalDevSigningKey_ChangeMe_ButAtLeast32Chars_123456"

if [[ -f "$ROOT_DIR/.env" ]]; then
  # Load local environment variables if present.
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "${JWT_SIGNING_KEY:-}" ]]; then
  JWT_SIGNING_KEY="$DEFAULT_JWT_SIGNING_KEY"
fi

if [[ -z "${DATABASE_CONNECTION_STRING:-}" ]]; then
  if [[ -n "${DB_USER:-}" && -n "${DB_PASSWORD:-}" ]]; then
    DB_HOST_VALUE="${DB_HOST:-localhost,1433}"
    DB_NAME_VALUE="${DB_NAME:-TijarahJoDB}"
    DATABASE_CONNECTION_STRING="Data Source=${DB_HOST_VALUE};Database=${DB_NAME_VALUE};User Id=${DB_USER};Password=${DB_PASSWORD};TrustServerCertificate=True;Encrypt=False;"
    DATABASE_CONNECTION_SOURCE="DB_USER/DB_PASSWORD"
  elif [[ -n "${MSSQL_SA_PASSWORD:-}" ]]; then
    DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=${MSSQL_SA_PASSWORD};TrustServerCertificate=True;Encrypt=False;"
    DATABASE_CONNECTION_SOURCE="MSSQL_SA_PASSWORD"
  elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' 2>/dev/null | grep -qx "tijarahjo-db"; then
    SA_PASSWORD="$(docker inspect -f '{{range .Config.Env}}{{println .}}{{end}}' tijarahjo-db 2>/dev/null | awk -F= '/^MSSQL_SA_PASSWORD=/{sub(/^MSSQL_SA_PASSWORD=/,""); print; exit}')"
    if [[ -n "$SA_PASSWORD" ]]; then
      DATABASE_CONNECTION_STRING="Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=${SA_PASSWORD};TrustServerCertificate=True;Encrypt=False;"
      DATABASE_CONNECTION_SOURCE="docker inspect (tijarahjo-db)"
    fi
  fi
else
  DATABASE_CONNECTION_SOURCE="DATABASE_CONNECTION_STRING"
fi

if [[ -z "${DATABASE_CONNECTION_STRING:-}" ]]; then
  cat <<EOF
Error: DATABASE_CONNECTION_STRING is not configured.
Set one of:
  1) DATABASE_CONNECTION_STRING
  2) DB_USER + DB_PASSWORD (+ optional DB_HOST/DB_NAME)
  3) MSSQL_SA_PASSWORD
You can place values in $ROOT_DIR/.env
EOF
  exit 1
fi

if [[ "$DATABASE_CONNECTION_STRING" == *"SET_DATABASE_CONNECTION_STRING_VIA_ENVIRONMENT"* ]]; then
  echo "Error: DATABASE_CONNECTION_STRING still contains a placeholder value."
  echo "Set a real SQL Server connection string before starting dev servers."
  exit 1
fi

extract_conn_value() {
  local key="$1"
  printf "%s" "$DATABASE_CONNECTION_STRING" | tr ';' '\n' | awk -F= -v wanted="$key" '
    {
      k=$1
      v=substr($0, index($0, "=") + 1)
      gsub(/^[ \t]+|[ \t]+$/, "", k)
      gsub(/^[ \t]+|[ \t]+$/, "", v)
      if (tolower(k) == wanted) {
        print v
        exit
      }
    }
  '
}

print_db_fix_instructions() {
  cat <<EOF
Fix options:
  1) Set DATABASE_CONNECTION_STRING explicitly (recommended).
  2) Set DB_USER + DB_PASSWORD (+ optional DB_HOST/DB_NAME).
  3) If using Docker SQL and password is unknown/stale in the volume:
     docker compose down -v
     MSSQL_SA_PASSWORD='<new-strong-password>' docker compose up -d
EOF
}

DB_DATA_SOURCE="$(extract_conn_value "data source")"
DB_USER_FROM_CONN="$(extract_conn_value "user id")"
if [[ -z "$DB_USER_FROM_CONN" ]]; then
  DB_USER_FROM_CONN="$(extract_conn_value "uid")"
fi
DB_PASSWORD_FROM_CONN="$(extract_conn_value "password")"
if [[ -z "$DB_PASSWORD_FROM_CONN" ]]; then
  DB_PASSWORD_FROM_CONN="$(extract_conn_value "pwd")"
fi

if command -v sqlcmd >/dev/null 2>&1 && [[ -n "$DB_DATA_SOURCE" && -n "$DB_USER_FROM_CONN" && -n "$DB_PASSWORD_FROM_CONN" ]]; then
  echo "Checking database login with sqlcmd..."
  if ! sqlcmd -S "$DB_DATA_SOURCE" -U "$DB_USER_FROM_CONN" -P "$DB_PASSWORD_FROM_CONN" -C -l 5 -Q "SELECT 1" >/dev/null 2>&1 \
    && ! sqlcmd -S "$DB_DATA_SOURCE" -U "$DB_USER_FROM_CONN" -P "$DB_PASSWORD_FROM_CONN" -l 5 -Q "SELECT 1" >/dev/null 2>&1; then
    echo "Error: database login preflight failed for source '$DATABASE_CONNECTION_SOURCE'."
    if [[ "$DATABASE_CONNECTION_SOURCE" == "docker inspect (tijarahjo-db)" ]]; then
      echo "Detected Docker metadata password source; this may not match persisted SQL volume credentials."
    fi
    print_db_fix_instructions
    exit 1
  fi
fi

echo "Starting TijarahJo Development Servers..."
echo

cleanup() {
  echo
  echo "Stopping servers..."
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

trap cleanup SIGINT SIGTERM EXIT

echo "Starting Backend (ASP.NET Core) on http://localhost:5033..."
(
  cd "$BACKEND_DIR"
  ASPNETCORE_ENVIRONMENT=Development \
  ASPNETCORE_URLS="$BACKEND_URL" \
  JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
  DATABASE_CONNECTION_STRING="$DATABASE_CONNECTION_STRING" \
  dotnet run --no-launch-profile
) &
BACKEND_PID=$!

sleep 4

BACKEND_HEALTH_CODE="$(curl -s -o /tmp/tijarahjo_backend_health.json -w '%{http_code}' http://localhost:5033/api/categories/All || true)"
if [[ "$BACKEND_HEALTH_CODE" == "000" ]]; then
  echo "Error: backend did not respond on $BACKEND_URL."
  echo "Check backend startup logs above."
  exit 1
fi

if [[ "$BACKEND_HEALTH_CODE" =~ ^5 ]]; then
  echo "Error: backend returned HTTP $BACKEND_HEALTH_CODE for /api/categories/All."
  echo "Database/auth config is not healthy (source: $DATABASE_CONNECTION_SOURCE)."
  if [[ "$DATABASE_CONNECTION_SOURCE" == "docker inspect (tijarahjo-db)" ]]; then
    echo "Docker container env password may not match the persisted SQL volume password."
  fi
  print_db_fix_instructions
  exit 1
fi

echo "Starting Frontend (Vite) on http://localhost:5173..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend API: http://localhost:5033"
echo "Frontend: http://localhost:5173"
echo "Swagger: http://localhost:5033/swagger"
echo
echo "Press Ctrl+C to stop both servers"

wait
