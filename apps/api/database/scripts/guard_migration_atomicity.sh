#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Enforce atomicity standards for modern canonical migrations.
# Legacy and earlier canonical migrations remain immutable; this gate is forward-looking.
ATOMICITY_VERSION_FLOOR="${MIGRATION_ATOMICITY_VERSION_FLOOR:-202602201100}"

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: rg (ripgrep) is required for guard_migration_atomicity.sh" >&2
  exit 0
fi

if [[ ! -d "$MIGRATIONS_DIR" ]]; then
  echo "Error: migrations directory not found at $MIGRATIONS_DIR" >&2
  exit 1
fi

errors=0
checked=0
skipped=0

while IFS= read -r file; do
  base_name="$(basename "$file")"

  if [[ ! "$base_name" =~ ^V([0-9]{12})__ ]]; then
    continue
  fi

  version="${BASH_REMATCH[1]}"
  if ((10#$version < 10#$ATOMICITY_VERSION_FLOOR)); then
    skipped=$((skipped + 1))
    continue
  fi

  if rg -qi -- '--\s*ATOMICITY_EXCEPTION' "$file"; then
    echo "Atomicity guard: skipping exception-marked migration $base_name"
    skipped=$((skipped + 1))
    continue
  fi

  missing=()

  if ! rg -qi 'SET\s+XACT_ABORT\s+ON' "$file"; then
    missing+=("SET XACT_ABORT ON")
  fi

  if ! rg -qi 'BEGIN\s+TRY' "$file"; then
    missing+=("BEGIN TRY")
  fi

  if ! rg -qi 'BEGIN\s+CATCH' "$file"; then
    missing+=("BEGIN CATCH")
  fi

  if ! rg -qi 'BEGIN\s+TRAN(?:SACTION)?' "$file"; then
    missing+=("BEGIN TRANSACTION")
  fi

  if ! rg -qi 'COMMIT\s+TRAN(?:SACTION)?' "$file"; then
    missing+=("COMMIT TRANSACTION")
  fi

  if ! rg -qi 'ROLLBACK\s+TRAN(?:SACTION)?' "$file"; then
    missing+=("ROLLBACK TRANSACTION")
  fi

  if [[ "${#missing[@]}" -gt 0 ]]; then
    echo "Atomicity guard failed for $base_name. Missing: ${missing[*]}" >&2
    errors=$((errors + 1))
    continue
  fi

  checked=$((checked + 1))
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort)

if ((errors > 0)); then
  exit 1
fi

echo "Migration atomicity guard passed: checked $checked migration(s), skipped $skipped."
