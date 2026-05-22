# API Docs

API-facing documentation (OpenAPI guidance, endpoint conventions, versioning notes) belongs here.

## Current API Contract Rules

- Canonical route prefix is `/api/v1/...`
- Unversioned `/api/...` routes are not part of the supported contract; use `docs/reports/API_ENDPOINTS_STATUS.md` for the supported endpoint inventory.
- Query/header version overrides are not supported.
- Request/response contracts live under:
  - `apps/api/src/Api/Contracts/Requests`
  - `apps/api/src/Api/Contracts/Responses`
