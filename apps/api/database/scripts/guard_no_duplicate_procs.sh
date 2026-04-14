#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTIVE_MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
ACTIVE_PROCEDURES_DIR="$SCRIPT_DIR/procedures"
ACTIVE_SOURCE_DIRS=("$ACTIVE_MIGRATIONS_DIR")

if [[ -d "$ACTIVE_PROCEDURES_DIR" ]]; then
  ACTIVE_SOURCE_DIRS+=("$ACTIVE_PROCEDURES_DIR")
fi




TMP_MATCHES="$(mktemp)"
trap 'rm -f "$TMP_MATCHES"' EXIT

grep -rnoEi \
  "(create\s+(or\s+alter\s+)?procedure|alter\s+procedure)\s+\[?(dbo)?\]?\.\[?([A-Za-z0-9_]+)\]?" \
  "${ACTIVE_SOURCE_DIRS[@]}" --include='*.sql' \
  | grep -v '/legacy/' \
  | sed -E 's/.*\.\[?([A-Za-z0-9_]+)\]?.*/\1/' > "$TMP_MATCHES" || true

if [[ ! -s "$TMP_MATCHES" ]]; then
  echo "SQL proc guard: no procedure definitions found in active sources."
  exit 0
fi

DUPLICATE_REPORT="$(awk -F: '
  {
    proc=$NF
    proc_lc=tolower(proc)
    counts[proc_lc]++
    examples[proc_lc]=examples[proc_lc] "\n  - " $1 ":" $2
  }
  END {
    found=0
    for (p in counts) {
      if (counts[p] > 1) {
        found=1
        printf "- %s has %d active definitions:%s\n", p, counts[p], examples[p]
      }
    }
    if (!found) {
      print ""
    }
  }
' "$TMP_MATCHES")"

if [[ -n "$DUPLICATE_REPORT" ]]; then
  echo "SQL proc guard failed: duplicate active procedure definitions detected." >&2
  echo "$DUPLICATE_REPORT" >&2
  exit 1
fi

TOTAL_PROCS="$(awk -F: '{print tolower($NF)}' "$TMP_MATCHES" | sort -u | wc -l | tr -d ' ')"
echo "SQL proc guard passed: $TOTAL_PROCS unique active procedure definitions."
