# Contracts

`contracts/` is the source of truth for API and schema contracts shared across backend and frontend.

## Layout

- `openapi/`: versioned OpenAPI documents (`tijarahjo.v1.yaml` is canonical).
- `schemas/`: JSON Schemas for reused DTO payloads.
- `generated/`: generated frontend/backend contract artifacts (do not hand-edit).

## Update Flow

1. Export API surface from a running backend:
   - `./scripts/contracts/export_openapi.sh`
2. Generate typed frontend artifacts:
   - `./scripts/contracts/generate_web_types.sh`

Use pull requests to review any contract diff before merging.
