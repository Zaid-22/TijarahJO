#!/usr/bin/env bash
# Run production Docker Compose from repo root with .env loaded.
# Do not use --project-directory here: build context ".." is relative to infra/
# and breaks when the project directory is overridden (lstat /opt/apps).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load base env (dev defaults / shared values)
if [[ -f "$ROOT_DIR/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/.env"
  set +a
fi

# Load production env on top — overrides any dev values above.
# infra/.env holds production secrets (DB, JWT, Google OAuth prod credentials, etc.)
if [[ -f "$ROOT_DIR/infra/.env" ]]; then
  # If infra/.env is still the checked-in template, do not let it override the
  # real production secrets loaded from .env. The VPS deployment flow should
  # either symlink infra/.env to .env or provide a non-template override file.
  if [[ -L "$ROOT_DIR/infra/.env" ]] || ! grep -q 'CHANGE_ME_' "$ROOT_DIR/infra/.env"; then
    set -a
    # shellcheck disable=SC1091
    source "$ROOT_DIR/infra/.env"
    set +a
  else
    echo "Warning: skipping $ROOT_DIR/infra/.env because it looks like the template; use ./_on_server/apply.sh to sync production secrets." >&2
  fi
fi

if [[ ! -f "$ROOT_DIR/.env" && ! -f "$ROOT_DIR/infra/.env" ]]; then
  echo "Missing both $ROOT_DIR/.env and $ROOT_DIR/infra/.env" >&2
  echo "Create infra/.env from infra/.env.example and fill in production secrets." >&2
  exit 1
fi

# The web service shares this external network with the host reverse proxy.
# Compose will not create an external network, so make the wrapper's `up`
# path self-contained on a fresh host.
if [[ "${1:-}" == "up" || "${1:-}" == "deploy" ]]; then
  EDGE_NETWORK_NAME="${EDGE_NETWORK_NAME:-edge}"
  export EDGE_NETWORK_NAME
  if ! docker network inspect "$EDGE_NETWORK_NAME" >/dev/null 2>&1; then
    echo "Creating external reverse-proxy network '$EDGE_NETWORK_NAME'..."
    docker network create "$EDGE_NETWORK_NAME" >/dev/null
  fi
fi

if [[ "${1:-}" == "deploy" ]]; then
  shift
  echo "Building production application images..."
  docker compose -f infra/docker-compose.production.yml build api web
  echo "Starting production data services..."
  docker compose -f infra/docker-compose.production.yml up -d sqlserver redis
  "$ROOT_DIR/scripts/migrate-production-db.sh"
  echo "Updating production application services..."
  exec docker compose -f infra/docker-compose.production.yml up -d --no-build "$@" api web
fi

exec docker compose -f infra/docker-compose.production.yml "$@"
