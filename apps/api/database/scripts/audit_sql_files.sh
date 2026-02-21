#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SCHEMA_DIR="$SCRIPT_DIR/../schema"
ACTIVE_MIGRATIONS_DIR="$SCRIPT_DIR/migrations"
ACTIVE_PROCEDURES_DIR="$SCRIPT_DIR/procedures"
ACTIVE_SEEDS_DIR="$SCRIPT_DIR/seeds"
ARCHIVE_DIR="$SCRIPT_DIR/archive"
BUNDLES_DIR="$DB_DIR/bundles"
ACTIVE_PROC_SCAN_DIRS=("$ACTIVE_MIGRATIONS_DIR")

if [[ -d "$ACTIVE_PROCEDURES_DIR" ]]; then
  ACTIVE_PROC_SCAN_DIRS+=("$ACTIVE_PROCEDURES_DIR")
fi

count_sql_files() {
  local target="$1"
  if [[ -d "$target" ]]; then
    find "$target" -type f -name '*.sql' | wc -l | tr -d ' '
  else
    echo "0"
  fi
}

count_top_level_sql_files() {
  local target="$1"
  if [[ -d "$target" ]]; then
    find "$target" -maxdepth 1 -type f -name '*.sql' | wc -l | tr -d ' '
  else
    echo "0"
  fi
}

list_duplicate_content() {
  local root="$1"
  local tmp_hashes
  tmp_hashes="$(mktemp)"

  find "$root" -type f -name '*.sql' -print0 \
    | sort -z \
    | xargs -0 shasum -a 256 > "$tmp_hashes"

  awk '
    {
      hash=$1
      file=$2
      counts[hash]++
      files[hash]=files[hash] "\n  - " file
    }
    END {
      found=0
      for (h in counts) {
        if (counts[h] > 1) {
          found=1
          print "- hash " h " appears in " counts[h] " files:" files[h]
        }
      }
      if (!found) {
        print "- none"
      }
    }
  ' "$tmp_hashes"

  rm -f "$tmp_hashes"
}

print_name_duplicates() {
  local regex="$1"
  local cleanup_sed="$2"
  local title="$3"
  local duplicates

  echo "$title"
  duplicates="$(
    rg --no-filename -o "$regex" "${ACTIVE_PROC_SCAN_DIRS[@]}" -S \
    --glob '!**/legacy/**' \
    | sed -E "$cleanup_sed" \
    | sort \
    | uniq -c \
    | awk '$1>1{print "- " $2 " (" $1 " definitions)"}' || true
  )"

  if [[ -n "$duplicates" ]]; then
    echo "$duplicates"
  else
    echo "- none"
  fi
}

SCHEMA_COUNT="$(count_sql_files "$SCHEMA_DIR")"
TOTAL_SQL_FILES="$(count_sql_files "$DB_DIR")"
ACTIVE_MIGRATIONS_COUNT="$(count_top_level_sql_files "$ACTIVE_MIGRATIONS_DIR")"
ACTIVE_PROCEDURES_COUNT="$(count_sql_files "$ACTIVE_PROCEDURES_DIR")"
ACTIVE_SEEDS_COUNT="$(count_sql_files "$ACTIVE_SEEDS_DIR")"
ACTIVE_TOTAL_COUNT="$((SCHEMA_COUNT + ACTIVE_MIGRATIONS_COUNT + ACTIVE_PROCEDURES_COUNT + ACTIVE_SEEDS_COUNT))"
LEGACY_MIGRATIONS_COUNT="$(count_sql_files "$DB_DIR/archive/migrations-legacy")"
ARCHIVE_COUNT="$(count_sql_files "$ARCHIVE_DIR")"
BUNDLES_COUNT="$(count_sql_files "$BUNDLES_DIR")"

echo "SQL Audit"
echo "========="
echo "- root: $SCRIPT_DIR"
echo "- total sql files: $TOTAL_SQL_FILES"
echo "- active sql files: $ACTIVE_TOTAL_COUNT"
echo "  - schema: $SCHEMA_COUNT (outside scripts root: $SCHEMA_DIR)"
echo "  - migrations (active): $ACTIVE_MIGRATIONS_COUNT"
echo "  - migrations (legacy archive): $LEGACY_MIGRATIONS_COUNT"
echo "  - procedures: $ACTIVE_PROCEDURES_COUNT"
echo "  - seeds: $ACTIVE_SEEDS_COUNT"
echo "- archived sql files: $ARCHIVE_COUNT"
echo "- bundle sql files: $BUNDLES_COUNT"
echo

echo "Duplicate object names in active source SQL:"
print_name_duplicates \
  "(?:CREATE\\s+(?:OR\\s+ALTER\\s+)?PROCEDURE|ALTER\\s+PROCEDURE)\\s+\\[?dbo\\]?\\.\\[?[A-Za-z0-9_]+\\]?" \
  's/.*\.\[?([A-Za-z0-9_]+)\]?$/\1/' \
  "Procedures:"
print_name_duplicates \
  "CREATE\\s+(?:UNIQUE\\s+)?INDEX\\s+\\[?[A-Za-z0-9_]+\\]?" \
  's/.*INDEX[[:space:]]+\[?([A-Za-z0-9_]+)\]?$/\1/' \
  "Indexes:"
echo

echo "Duplicate SQL file content hashes (entire database tree):"
list_duplicate_content "$DB_DIR"
