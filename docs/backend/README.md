# Backend Documentation

This folder contains backend-specific documentation consolidated from the API project.

## Active Docs

- `QUICK_START.md`: bootstrap and startup quick path.
- `OPERATIONS_RUNBOOK.md`: startup modes, health semantics, incident response flow.

## Archived Docs

- `archive/`: historical fix reports, troubleshooting notes, and one-off investigation documents.

## Source of Truth

- Runtime configuration and environment notes: `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`
- Current repository structure: `docs/architecture/CURRENT_STRUCTURE_2026.md`

## API Contract Direction

- Canonical public routes use `/api/v1/...`.
- Query/header API version overrides are intentionally not part of the contract.
