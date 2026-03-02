#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNTIME_INFRA_DIR="$SCRIPT_DIR/../../src/Infrastructure"

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: rg (ripgrep) is required for guard_runtime_proc_contract.sh" >&2
  exit 1
fi

if [[ ! -d "$RUNTIME_INFRA_DIR" ]]; then
  echo "Error: runtime source directory not found at $RUNTIME_INFRA_DIR" >&2
  exit 1
fi

TMP_PROC_TOKENS="$(mktemp)"
trap 'rm -f "$TMP_PROC_TOKENS"' EXIT

# EF Core is the canonical runtime path. Any SP_/usp_ token in Infrastructure
# should be treated as a contract violation.
rg -n --no-heading -P '(?i)\b(?:sp|usp)_[A-Za-z0-9_]+' \
  "$RUNTIME_INFRA_DIR" -g '*.cs' > "$TMP_PROC_TOKENS" || true

if [[ ! -s "$TMP_PROC_TOKENS" ]]; then
  echo "SQL runtime proc contract guard passed: no SP_/usp_ runtime calls were detected in Infrastructure."
  exit 0
fi

echo "SQL runtime proc contract guard failed: runtime source contains stored procedure tokens (SP_/usp_)." >&2
sed 's/^/- /' "$TMP_PROC_TOKENS" >&2
exit 1
