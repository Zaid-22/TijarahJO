#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
CHECKSUM_LOCK_FILE="$SCRIPT_DIR/migration_checksums.sha256"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Error: migrations directory not found at $MIGRATIONS_DIR" >&2
  exit 1
fi

collect_migration_files() {
  find "$MIGRATIONS_DIR" -type f -name 'V*.sql' | sort
}

generate_checksums() {
  local file=""
  while IFS= read -r file; do
    if [[ -z "$file" ]]; then
      continue
    fi

    local relative_file="${file#"$SCRIPT_DIR"/}"
    local hash
    hash="$(shasum -a 256 "$file" | awk '{print $1}')"
    printf "%s  %s\n" "$hash" "$relative_file"
  done < <(collect_migration_files)
}

update_lock_file() {
  generate_checksums > "$CHECKSUM_LOCK_FILE"
  echo "Updated migration checksum lock file: $CHECKSUM_LOCK_FILE"
}

validate_lock_file() {
  if [[ ! -f "$CHECKSUM_LOCK_FILE" ]]; then
    echo "Error: migration checksum lock file is missing: $CHECKSUM_LOCK_FILE" >&2
    echo "Run ./apps/api/database/scripts/guard_migration_checksums.sh --update to initialize it." >&2
    exit 1
  fi

  local tmp_file
  tmp_file="$(mktemp)"
  generate_checksums > "$tmp_file"

  if ! diff -u "$CHECKSUM_LOCK_FILE" "$tmp_file"; then
    rm -f "$tmp_file"
    echo "Error: migration checksum lock mismatch detected." >&2
    echo "Migrations are expected to be immutable once committed." >&2
    echo "If this is an intentional migration update, add a new migration file and refresh lock file:" >&2
    echo "  ./apps/api/database/scripts/guard_migration_checksums.sh --update" >&2
    exit 1
  fi

  rm -f "$tmp_file"
  echo "Migration checksum lock validated."
}

case "${1:-}" in
  --update)
    update_lock_file
    ;;
  "")
    validate_lock_file
    ;;
  *)
    echo "Usage: $0 [--update]" >&2
    exit 1
    ;;
esac
