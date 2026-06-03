#!/usr/bin/env bash
# Run production Docker Compose from repo root with .env loaded.
# Do not use --project-directory here: build context ".." is relative to infra/
# and breaks when the project directory is overridden (lstat /opt/apps).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f "$ROOT_DIR/.env" ]]; then
  echo "Missing $ROOT_DIR/.env" >&2
  echo "Copy _on_server/.env.example to _on_server/.env, edit secrets, then run ./_on_server/apply.sh" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
source "$ROOT_DIR/.env"
set +a

exec docker compose -f infra/docker-compose.production.yml "$@"
