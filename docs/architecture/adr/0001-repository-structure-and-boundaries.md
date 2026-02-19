# ADR 0001: Repository Structure and Boundaries

- Status: Accepted
- Date: 2026-02-17

## Context

The repository had mixed root concerns, transitional script duplication, and unclear ownership boundaries between frontend, backend, and documentation. This increased onboarding time and raised regression risk during refactors.

## Decision

Adopt a structured monorepo layout:

- Root ownership: `.github/`, `apps/`, `contracts/`, `docs/`, `infra/`, `scripts/`
- Backend clean architecture under `apps/api/src/{Api,Application,Domain,Infrastructure}`
- Frontend feature-first layout under `apps/web/src/{app,features,shared}`
- Test taxonomy split by type (unit/integration/contract/e2e)
- Operational entrypoints only in `scripts/`
- Documentation lifecycle split into active and archived zones

Governance is enforced by:

- CI gates (lint/build/test/contracts)
- `scripts/check_structure.sh` for path and stale-reference checks
- `docs/architecture/PATH_CONVENTIONS.md` as the policy reference

## Consequences

Positive:

- Clear ownership and dependency boundaries
- Lower chance of structure regressions
- Predictable onboarding and navigation

Tradeoffs:

- Initial migration cost and path updates
- Need to keep conventions enforced in reviews and CI
