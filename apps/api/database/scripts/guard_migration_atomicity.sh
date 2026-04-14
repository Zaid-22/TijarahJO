#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Enforce atomicity standards for modern canonical migrations.
# Legacy and earlier canonical migrations remain immutable; this gate is forward-looking.
ATOMICITY_VERSION_FLOOR="${MIGRATION_ATOMICITY_VERSION_FLOOR:-202602201100}"



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

  if grep -Eqi -- '--[[:space:]]*ATOMICITY_EXCEPTION' "$file"; then
    echo "Atomicity guard: skipping exception-marked migration $base_name"
    skipped=$((skipped + 1))
    continue
  fi

  missing=()

  if ! grep -Eqi 'SET[[:space:]]+XACT_ABORT[[:space:]]+ON' "$file"; then
    missing+=("SET XACT_ABORT ON")
  fi

  if ! grep -Eqi 'BEGIN[[:space:]]+TRY' "$file"; then
    missing+=("BEGIN TRY")
  fi

  if ! grep -Eqi 'BEGIN[[:space:]]+CATCH' "$file"; then
    missing+=("BEGIN CATCH")
  fi

  if ! grep -Eqi 'BEGIN[[:space:]]+TRAN(SACTION)?' "$file"; then
    missing+=("BEGIN TRANSACTION")
  fi

  if ! grep -Eqi 'COMMIT[[:space:]]+TRAN(SACTION)?' "$file"; then
    missing+=("COMMIT TRANSACTION")
  fi

  if ! grep -Eqi 'ROLLBACK[[:space:]]+TRAN(SACTION)?' "$file"; then
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
