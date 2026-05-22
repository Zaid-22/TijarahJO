# Backend Documentation

This folder contains backend-specific documentation consolidated from the API project.

## Active Docs

- `QUICK_START.md`: bootstrap and startup quick path.
- `OPERATIONS_RUNBOOK.md`: startup modes, health semantics, incident response flow.

## Source of Truth

- Runtime configuration and environment notes: `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`
- Current repository structure: `docs/architecture/CURRENT_STRUCTURE_2026.md`

## API Contract Direction

- Canonical public routes use `/api/v1/...`.
- Unversioned `/api/...` routes are not part of the supported contract; use `docs/reports/API_ENDPOINTS_STATUS.md` as the endpoint inventory source of truth.
- Query/header API version overrides are intentionally not part of the contract.

## Auth Runtime Notes

- The backend uses cookie-backed JWT authentication with token blacklisting.
- Session recovery is supported through `POST /api/v1/auth/refresh` and `GET /api/v1/auth/me`.
- Frontend hard refresh behavior and session revalidation expectations are documented in `docs/frontend/AUTH_RUNTIME_QA_MATRIX.md`.

Last Updated: 2026-05-22
