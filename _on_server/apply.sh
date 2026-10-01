#!/usr/bin/env bash
set -euo pipefail

ON_SERVER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$ON_SERVER_DIR/.." && pwd)"
SOURCE_ENV="$ON_SERVER_DIR/.env"
TARGET_ENV="$ROOT_DIR/.env"

if [[ ! -f "$SOURCE_ENV" ]]; then
  echo "Missing $SOURCE_ENV" >&2
  echo "Copy .env.example to .env and fill in production values." >&2
  exit 1
fi

cp "$SOURCE_ENV" "$TARGET_ENV"
chmod 600 "$TARGET_ENV" 2>/dev/null || true

# Compose loads .env from the compose file directory (infra/) by default.
ln -sf "$TARGET_ENV" "$ROOT_DIR/infra/.env"

echo "Applied: _on_server/.env -> .env"
echo "Linked: infra/.env -> .env"
echo "Repo root: $ROOT_DIR"
