#!/usr/bin/env bash

set -euo pipefail

# Script to run both Backend and Frontend
# Usage: ./scripts/run-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/apps/api/src/Api"
FRONTEND_DIR="$ROOT_DIR/apps/web"
DOCKER_COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.yml"
FRONTEND_PORT=5173
FRONTEND_URL="http://localhost:${FRONTEND_PORT}"
DATABASE_CONNECTION_SOURCE=""
DOTNET_BIN="${DOTNET_BIN:-}"

resolve_primary_backend_url() {
  local configured_urls="$1"
  local primary_url="${configured_urls%%;*}"
  primary_url="${primary_url%%,*}"
  printf "%s" "${primary_url%/}"
}

if [[ -f "$ROOT_DIR/.env" ]]; then
  # Load local environment variables if present.
  set -a
  source "$ROOT_DIR/.env"
  set +a
fi

if [[ -z "$DOTNET_BIN" ]]; then
  if command -v dotnet >/dev/null 2>&1; then
    DOTNET_BIN="$(command -v dotnet)"
  elif [[ -x "/usr/local/share/dotnet/dotnet" ]]; then
    DOTNET_BIN="/usr/local/share/dotnet/dotnet"
  elif [[ -x "/opt/homebrew/bin/dotnet" ]]; then
    DOTNET_BIN="/opt/homebrew/bin/dotnet"
  fi
fi

if [[ -z "$DOTNET_BIN" || ! -x "$DOTNET_BIN" ]]; then
  cat <<EOF
Error: dotnet is not available.
Install the .NET SDK or set DOTNET_BIN to the dotnet executable path.
EOF
  exit 1
fi

BACKEND_URL="${ASPNETCORE_URLS:-http://localhost:5033}"

if [[ -z "${JWT_SIGNING_KEY:-}" ]]; then
  echo "Error: JWT_SIGNING_KEY is not configured."
  echo "Set JWT_SIGNING_KEY in your shell or $ROOT_DIR/.env before running scripts/run-dev.sh."
  exit 1
fi

if [[ -z "${DATABASE_CONNECTION_STRING:-}" ]]; then
  if [[ -n "${DB_USER:-}" && -n "${DB_PASSWORD:-}" ]]; then
    DB_HOST_VALUE="${DB_HOST:-localhost,1433}"
    DB_NAME_VALUE="${DB_NAME:-TijarahJoDB}"
    DATABASE_CONNECTION_STRING="Data Source=${DB_HOST_VALUE};Database=${DB_NAME_VALUE};User Id=${DB_USER};Password=${DB_PASSWORD};TrustServerCertificate=True;Encrypt=True;"
    DATABASE_CONNECTION_SOURCE="DB_USER/DB_PASSWORD"
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
     docker compose -f "$DOCKER_COMPOSE_FILE" down -v
     MSSQL_SA_PASSWORD='<new-strong-password>' docker compose -f "$DOCKER_COMPOSE_FILE" up -d
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
  if ! sqlcmd -f 65001 -S "$DB_DATA_SOURCE" -U "$DB_USER_FROM_CONN" -P "$DB_PASSWORD_FROM_CONN" -C -l 5 -Q "SELECT 1" >/dev/null 2>&1 \
    && ! sqlcmd -f 65001 -S "$DB_DATA_SOURCE" -U "$DB_USER_FROM_CONN" -P "$DB_PASSWORD_FROM_CONN" -l 5 -Q "SELECT 1" >/dev/null 2>&1; then
    echo "Error: database login preflight failed for source '$DATABASE_CONNECTION_SOURCE'."
    print_db_fix_instructions
    exit 1
  fi
fi

echo "Starting TijarahJo Development Servers..."
echo

cleanup() {
  if [[ -z "${BACKEND_PID:-}" && -z "${FRONTEND_PID:-}" ]]; then
    return 0
  fi

  echo
  echo "Stopping servers..."
  if [[ -n "${BACKEND_PID:-}" ]]; then
    terminate_process_tree "$BACKEND_PID"
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    terminate_process_tree "$FRONTEND_PID"
  fi
}

trap cleanup SIGINT SIGTERM EXIT

terminate_process_tree() {
  local pid="${1:-}"
  local child_pid=""

  if [[ -z "$pid" ]]; then
    return 0
  fi

  if command -v pgrep >/dev/null 2>&1; then
    while IFS= read -r child_pid; do
      if [[ -n "$child_pid" ]]; then
        terminate_process_tree "$child_pid"
      fi
    done < <(pgrep -P "$pid" 2>/dev/null || true)
  fi

  kill "$pid" 2>/dev/null || true
}

wait_for_http_endpoint() {
  local endpoint="$1"
  local expected_mode="$2"
  local attempts="${3:-30}"
  local sleep_seconds="${4:-2}"
  local code=""

  for ((attempt=1; attempt<=attempts; attempt++)); do
    code="$(curl -s -o /tmp/tijarahjo_backend_health.json -w '%{http_code}' "$endpoint" || true)"

    case "$expected_mode" in
      any-success)
        if [[ "$code" =~ ^[2-5] ]]; then
          printf "%s" "$code"
          return 0
        fi
        ;;
      ok-only)
        if [[ "$code" =~ ^2 ]]; then
          printf "%s" "$code"
          return 0
        fi
        ;;
    esac

    sleep "$sleep_seconds"
  done

  printf "%s" "$code"
  return 1
}

extract_url_port() {
  local url="$1"

  if [[ "$url" =~ ^https?://[^/:]+:([0-9]+)($|/) ]]; then
    printf "%s" "${BASH_REMATCH[1]}"
    return 0
  fi

  if [[ "$url" =~ ^https:// ]]; then
    printf "443"
    return 0
  fi

  printf "80"
}

require_listen_port_available() {
  local name="$1"
  local port="$2"

  if command -v lsof >/dev/null 2>&1 && lsof -nP -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Error: $name port $port is already in use."
    echo "Stop the existing process first:"
    echo "  ./scripts/kill-port.sh $port"
    return 1
  fi

  return 0
}

PRIMARY_BACKEND_URL="$(resolve_primary_backend_url "$BACKEND_URL")"
BACKEND_PORT="$(extract_url_port "$PRIMARY_BACKEND_URL")"
BACKEND_LIVE_ENDPOINT="${PRIMARY_BACKEND_URL}/health/live"
BACKEND_HEALTH_ENDPOINT="${PRIMARY_BACKEND_URL}/api/v1/categories"

PORT_CHECK_FAILED=0
require_listen_port_available "backend" "$BACKEND_PORT" || PORT_CHECK_FAILED=1
require_listen_port_available "frontend" "$FRONTEND_PORT" || PORT_CHECK_FAILED=1
if [[ "$PORT_CHECK_FAILED" -ne 0 ]]; then
  exit 1
fi

echo "Starting Backend (ASP.NET Core) on $PRIMARY_BACKEND_URL..."
(
  cd "$BACKEND_DIR"
  ASPNETCORE_ENVIRONMENT=Development \
  ASPNETCORE_URLS="$BACKEND_URL" \
  JWT_SIGNING_KEY="$JWT_SIGNING_KEY" \
  DATABASE_CONNECTION_STRING="$DATABASE_CONNECTION_STRING" \
  "$DOTNET_BIN" run --no-launch-profile
) &
BACKEND_PID=$!

BACKEND_LIVE_CODE="$(wait_for_http_endpoint "$BACKEND_LIVE_ENDPOINT" "any-success" 120 2 || true)"
if [[ "$BACKEND_LIVE_CODE" == "000" ]]; then
  echo "Error: backend did not respond on $BACKEND_URL."
  echo "Check backend startup logs above."
  exit 1
fi

BACKEND_HEALTH_CODE="$(wait_for_http_endpoint "$BACKEND_HEALTH_ENDPOINT" "any-success" 15 2 || true)"
if [[ "$BACKEND_HEALTH_CODE" == "000" ]]; then
  echo "Error: backend did not finish becoming ready on $BACKEND_HEALTH_ENDPOINT."
  echo "Check backend startup logs above."
  exit 1
fi

if [[ "$BACKEND_HEALTH_CODE" =~ ^5 ]]; then
  echo "Error: backend returned HTTP $BACKEND_HEALTH_CODE for $BACKEND_HEALTH_ENDPOINT."
  echo "Database/auth config is not healthy (source: $DATABASE_CONNECTION_SOURCE)."
  print_db_fix_instructions
  exit 1
fi

echo "Starting Frontend (Vite) on $FRONTEND_URL..."
(
  cd "$FRONTEND_DIR"
  npm run dev
) &
FRONTEND_PID=$!

echo
echo "Both servers are starting..."
echo "Backend API: $PRIMARY_BACKEND_URL"
echo "Frontend: $FRONTEND_URL"
echo "Swagger: ${PRIMARY_BACKEND_URL}/swagger"
echo
echo "Press Ctrl+C to stop both servers"

wait
