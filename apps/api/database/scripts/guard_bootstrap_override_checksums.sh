#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OVERRIDES_DIR="$SCRIPT_DIR/bootstrap_overrides"
CHECKSUM_LOCK_FILE="$SCRIPT_DIR/bootstrap_override_checksums.sha256"

if [[ ! -d "$OVERRIDES_DIR" ]]; then
  echo "Error: bootstrap overrides directory not found at $OVERRIDES_DIR" >&2
  exit 1
fi

collect_override_files() {
  find "$OVERRIDES_DIR" -maxdepth 1 -type f -name 'V*.sql' | sort
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
  done < <(collect_override_files)
}

update_lock_file() {
  generate_checksums > "$CHECKSUM_LOCK_FILE"
  echo "Updated bootstrap override checksum lock file: $CHECKSUM_LOCK_FILE"
}

validate_lock_file() {
  if [[ ! -f "$CHECKSUM_LOCK_FILE" ]]; then
    echo "Error: bootstrap override checksum lock file is missing: $CHECKSUM_LOCK_FILE" >&2
    echo "Run ./apps/api/database/scripts/guard_bootstrap_override_checksums.sh --update to initialize it." >&2
    exit 1
  fi

  local tmp_file
  tmp_file="$(mktemp)"
  generate_checksums > "$tmp_file"

  if ! diff -u "$CHECKSUM_LOCK_FILE" "$tmp_file"; then
    rm -f "$tmp_file"
    echo "Error: bootstrap override checksum lock mismatch detected." >&2
    echo "Fresh bootstrap must not silently diverge from reviewed override SQL." >&2
    echo "If this is an intentional bootstrap override update, refresh the override lock file:" >&2
    echo "  ./apps/api/database/scripts/guard_bootstrap_override_checksums.sh --update" >&2
    exit 1
  fi

  rm -f "$tmp_file"
  echo "Bootstrap override checksum lock validated."
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
