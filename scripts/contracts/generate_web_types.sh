#!/usr/bin/env bash
set -euo pipefail

INPUT_SPEC="${INPUT_SPEC:-contracts/openapi/tijarahjo.v1.yaml}"
OUTPUT_TYPES="${OUTPUT_TYPES:-contracts/generated/web-api-types.d.ts}"

if ! command -v npx >/dev/null 2>&1; then
  echo "Error: npx is required to generate TypeScript types."
  exit 1
fi

mkdir -p "$(dirname "$OUTPUT_TYPES")"

echo "Generating TypeScript contract types from ${INPUT_SPEC}..."
npx --yes openapi-typescript "$INPUT_SPEC" --output "$OUTPUT_TYPES"
echo "Generated ${OUTPUT_TYPES}"
