#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
PRIMARY_CHECKSUM_LOCK_FILE="$SCRIPT_DIR/migration_checksums.sha256"
EXTENSION_CHECKSUM_LOCK_FILE="$SCRIPT_DIR/migration_checksums.extensions.sha256"

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Error: migrations directory not found at $MIGRATIONS_DIR" >&2
  exit 1
fi

collect_migration_files() {
  find "$MIGRATIONS_DIR" -type f -name 'V*.sql' | sort
}

collect_relative_migration_files() {
  while IFS= read -r file; do
    printf "%s\n" "${file#"$SCRIPT_DIR"/}"
  done < <(collect_migration_files)
}

extract_lock_paths() {
  local lock_file="$1"
  awk 'NF >= 2 { print $2 }' "$lock_file"
}

generate_checksums_for_paths() {
  local paths_file="$1"
  local relative_file=""

  while IFS= read -r relative_file; do
    if [[ -z "$relative_file" ]]; then
      continue
    fi

    local absolute_file="$SCRIPT_DIR/$relative_file"
    if [[ ! -f "$absolute_file" ]]; then
      echo "Error: lock file references missing migration: $absolute_file" >&2
      exit 1
    fi

    local hash
    hash="$(shasum -a 256 "$absolute_file" | awk '{print $1}')"
    printf "%s  %s\n" "$hash" "$relative_file"
  done < "$paths_file"
}

validate_lock_file() {
  local lock_file="$1"

  if [[ ! -f "$lock_file" ]]; then
    echo "Error: migration checksum lock file is missing: $lock_file" >&2
    echo "Run ./apps/api/database/scripts/guard_migration_checksums.sh --update to initialize it." >&2
    exit 1
  fi

  local lock_paths_file
  lock_paths_file="$(mktemp)"
  extract_lock_paths "$lock_file" > "$lock_paths_file"

  local generated_file
  generated_file="$(mktemp)"
  generate_checksums_for_paths "$lock_paths_file" > "$generated_file"

  if ! diff -u "$lock_file" "$generated_file"; then
    rm -f "$lock_paths_file" "$generated_file"
    echo "Error: migration checksum lock mismatch detected for $lock_file." >&2
    echo "Migrations are expected to be immutable once committed." >&2
    echo "If this is an intentional migration update, add a new migration file and refresh lock files:" >&2
    echo "  ./apps/api/database/scripts/guard_migration_checksums.sh --update" >&2
    exit 1
  fi

  rm -f "$lock_paths_file" "$generated_file"
}

validate_lock_coverage() {
  local locked_paths_file
  locked_paths_file="$(mktemp)"
  {
    extract_lock_paths "$PRIMARY_CHECKSUM_LOCK_FILE"
    extract_lock_paths "$EXTENSION_CHECKSUM_LOCK_FILE"
  } | sort > "$locked_paths_file"

  local current_paths_file
  current_paths_file="$(mktemp)"
  collect_relative_migration_files | sort > "$current_paths_file"

  if ! diff -u "$locked_paths_file" "$current_paths_file"; then
    rm -f "$locked_paths_file" "$current_paths_file"
    echo "Error: migration checksum lock files do not cover the active migration set." >&2
    echo "Refresh lock files after intentionally adding a new migration:" >&2
    echo "  ./apps/api/database/scripts/guard_migration_checksums.sh --update" >&2
    exit 1
  fi

  rm -f "$locked_paths_file" "$current_paths_file"
}

update_lock_files() {
  local primary_paths_file
  primary_paths_file="$(mktemp)"
  if [[ -f "$PRIMARY_CHECKSUM_LOCK_FILE" ]]; then
    extract_lock_paths "$PRIMARY_CHECKSUM_LOCK_FILE" > "$primary_paths_file"
  fi

  local all_paths_file
  all_paths_file="$(mktemp)"
  collect_relative_migration_files > "$all_paths_file"

  local extension_paths_file
  extension_paths_file="$(mktemp)"
  if [[ -s "$primary_paths_file" ]]; then
    grep -Fvx -f "$primary_paths_file" "$all_paths_file" > "$extension_paths_file" || true
  else
    cp "$all_paths_file" "$extension_paths_file"
  fi

  if [[ -s "$primary_paths_file" ]]; then
    generate_checksums_for_paths "$primary_paths_file" > "$PRIMARY_CHECKSUM_LOCK_FILE"
  fi
  generate_checksums_for_paths "$extension_paths_file" > "$EXTENSION_CHECKSUM_LOCK_FILE"

  rm -f "$primary_paths_file" "$all_paths_file" "$extension_paths_file"
  echo "Updated migration checksum lock files:"
  echo "  $PRIMARY_CHECKSUM_LOCK_FILE"
  echo "  $EXTENSION_CHECKSUM_LOCK_FILE"
}

validate_lock_files() {
  validate_lock_file "$PRIMARY_CHECKSUM_LOCK_FILE"
  validate_lock_file "$EXTENSION_CHECKSUM_LOCK_FILE"
  validate_lock_coverage
  echo "Migration checksum locks validated."
}

case "${1:-}" in
  --update)
    update_lock_files
    ;;
  "")
    validate_lock_files
    ;;
  *)
    echo "Usage: $0 [--update]" >&2
    exit 1
    ;;
esac
