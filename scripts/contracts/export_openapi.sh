#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5033}"
OUTPUT_PATH="${OUTPUT_PATH:-contracts/openapi/tijarahjo.v1.json}"
SWAGGER_URL="${BASE_URL%/}/swagger/v1/swagger.json"

mkdir -p "$(dirname "$OUTPUT_PATH")"

echo "Exporting OpenAPI from ${SWAGGER_URL}..."
curl -fsSL "$SWAGGER_URL" -o "$OUTPUT_PATH"
echo "OpenAPI exported to ${OUTPUT_PATH}"
