#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CANONICAL_PROCS_FILE="$SCRIPT_DIR/procedures/CANONICAL_STORED_PROCEDURES.sql"
RUNTIME_INFRA_DIR="$SCRIPT_DIR/../../src/Infrastructure"

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: rg (ripgrep) is required for guard_runtime_proc_contract.sh" >&2
  exit 1
fi

if [[ ! -f "$CANONICAL_PROCS_FILE" ]]; then
  echo "Error: canonical procedures file not found at $CANONICAL_PROCS_FILE" >&2
  exit 1
fi

if [[ ! -d "$RUNTIME_INFRA_DIR" ]]; then
  echo "Error: runtime source directory not found at $RUNTIME_INFRA_DIR" >&2
  exit 1
fi

TMP_RAW_CALLS="$(mktemp)"
TMP_CALLED_DETAILS="$(mktemp)"
TMP_CALLED_NAMES="$(mktemp)"
TMP_DEFINED_NAMES="$(mktemp)"
TMP_MISSING_NAMES="$(mktemp)"
trap 'rm -f "$TMP_RAW_CALLS" "$TMP_CALLED_DETAILS" "$TMP_CALLED_NAMES" "$TMP_DEFINED_NAMES" "$TMP_MISSING_NAMES"' EXIT

# Capture lines that instantiate SqlCommand with an SP_/usp_ token in the SQL literal.
rg -n --no-heading -P 'SqlCommand\(\s*"[^"]*(?:(?i:sp)|(?i:usp))_[^"]*"' "$RUNTIME_INFRA_DIR" > "$TMP_RAW_CALLS" || true

while IFS= read -r line; do
  file_path="${line%%:*}"
  remainder="${line#*:}"
  line_number="${remainder%%:*}"
  source_line="${remainder#*:}"

  sql_literal="$(printf '%s\n' "$source_line" | sed -E 's/.*SqlCommand\(\s*"([^"]*)".*/\1/')"
  proc_name="$(printf '%s\n' "$sql_literal" | perl -ne 'if (/(?:\[?dbo\]?\.)?\[?((?:SP|USP)_[A-Za-z0-9_]+)\]?/i) { print "$1\n"; }')"

  if [[ -n "$proc_name" ]]; then
    proc_name_lc="$(printf '%s' "$proc_name" | tr '[:upper:]' '[:lower:]')"
    printf '%s|%s|%s:%s|%s\n' "$proc_name_lc" "$proc_name" "$file_path" "$line_number" "$sql_literal" >> "$TMP_CALLED_DETAILS"
  fi
done < "$TMP_RAW_CALLS"

if [[ ! -s "$TMP_CALLED_DETAILS" ]]; then
  echo "SQL runtime proc contract guard passed: no SP_/usp_ runtime calls were detected in Infrastructure."
  exit 0
fi

cut -d'|' -f1 "$TMP_CALLED_DETAILS" | sort -u > "$TMP_CALLED_NAMES"

rg -oP \
  "(?i)(?:create\\s+(?:or\\s+alter\\s+)?procedure|alter\\s+procedure)\\s+\\[?(?:dbo)\\]?\\.?\\[?((?:SP|USP)_[A-Za-z0-9_]+)\\]?" \
  "$CANONICAL_PROCS_FILE" \
  --replace '$1' | tr '[:upper:]' '[:lower:]' | sort -u > "$TMP_DEFINED_NAMES"

comm -23 "$TMP_CALLED_NAMES" "$TMP_DEFINED_NAMES" > "$TMP_MISSING_NAMES"

if [[ -s "$TMP_MISSING_NAMES" ]]; then
  echo "SQL runtime proc contract guard failed: runtime code calls procedures missing from canonical SQL." >&2

  while IFS= read -r missing_proc; do
    if [[ -z "$missing_proc" ]]; then
      continue
    fi

    echo "- $missing_proc" >&2
    awk -F'|' -v missing="$missing_proc" '
      tolower($1) == missing {
        printf "  - %s (%s)\\n", $3, $4
      }
    ' "$TMP_CALLED_DETAILS" >&2
  done < "$TMP_MISSING_NAMES"

  exit 1
fi

called_count="$(wc -l < "$TMP_CALLED_NAMES" | tr -d ' ')"
defined_count="$(wc -l < "$TMP_DEFINED_NAMES" | tr -d ' ')"
echo "SQL runtime proc contract guard passed: $called_count runtime procedures are covered by $defined_count canonical definitions."
