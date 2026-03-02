# API Docs

API-facing documentation (OpenAPI guidance, endpoint conventions, versioning notes) belongs here.

## Current API Contract Rules

- Route versioning only: `/api/v1/...`
- Query/header version overrides are not supported.
- Request/response contracts live under:
  - `apps/api/src/Api/Contracts/Requests`
  - `apps/api/src/Api/Contracts/Responses`
