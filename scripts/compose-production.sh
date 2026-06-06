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
  set -a
  # shellcheck disable=SC1091
  source "$ROOT_DIR/infra/.env"
  set +a
fi

if [[ ! -f "$ROOT_DIR/.env" && ! -f "$ROOT_DIR/infra/.env" ]]; then
  echo "Missing both $ROOT_DIR/.env and $ROOT_DIR/infra/.env" >&2
  echo "Create infra/.env from infra/.env.example and fill in production secrets." >&2
  exit 1
fi

exec docker compose -f infra/docker-compose.production.yml "$@"
