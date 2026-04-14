#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

missing=0
violations=0

required_dirs=(
  ".github"
  "apps"
  "contracts"
  "docs"
  "infra"
  "scripts"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "FAIL: missing required top-level directory '$dir'"
    missing=1
  fi
done

forbidden_paths=(
  "TijarahJo-Backend"
  "TijarahJo-frontend"
  "docker-compose.yml"
  "bootstrap_db.sh"
  "run-dev.sh"
  "verify_all_apis.sh"
  "kill-port.sh"
  "test_delete_post_with_chat.sh"
  "bootstrap_db 2.sh"
)

for path in "${forbidden_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "FAIL: forbidden legacy path exists at repo root '$path'"
    violations=1
  fi
done

stale_refs="$(grep -rn '\./\(run-dev\|bootstrap_db\|verify_all_apis\|kill-port\|test_delete_post_with_chat\)\.sh' \
  README.md README-RUN.md docs apps scripts Makefile .github \
  --include='*.md' --include='*.sh' --include='*.yml' --include='Makefile' \
  2>/dev/null | grep -v '/archive/' || true)"
if [[ -n "$stale_refs" ]]; then
  echo "FAIL: found stale root-script references (expected ./scripts/...):"
  echo "$stale_refs"
  violations=1
fi

if [[ "$missing" -ne 0 || "$violations" -ne 0 ]]; then
  echo "Structure check failed."
  exit 1
fi

echo "PASS: repository structure is compliant."
