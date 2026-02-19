# Current Project Structure (2026)

This document is the canonical structure reference for the current repository state.

## Top-Level

```text
final project primary/
├── .github/workflows/
├── apps/
│   ├── api/
│   └── web/
├── contracts/
├── docs/
├── infra/
├── scripts/
├── README.md
├── README-RUN.md
└── Makefile
```

## Frontend (`apps/web/`)

- Stack: React + TypeScript + Vite.
- Main source: `apps/web/src/`
- `app/`: bootstrap + root composition + route shell
- `features/`: domain slices (auth, chat, admin, marketplace, product-details)
- `pages/`: route-level page composition
- `app/routes/`: routing helpers and wrappers
- `shared/`: reusable UI primitives and shared modules
- `services/`: API and chat services
- `contexts/`, `hooks/`, `types/`, `utils/`, `constants/`, `styles/`, `data/`, `lib/`
- Tests: `apps/web/tests/`
  - `unit/`, `integration/`, `e2e/`

## Backend (`apps/api/`)

- Stack: ASP.NET Core (.NET 8) + SQL Server.
- Solution: `apps/api/TijarahJo.sln`
- Source projects:
  - `apps/api/src/Api/` (`TijarahJo.Api.csproj`)
  - `apps/api/src/Application/` (`TijarahJo.Application.csproj`)
  - `apps/api/src/Domain/` (`TijarahJo.Domain.csproj`)
  - `apps/api/src/Infrastructure/` (`TijarahJo.Infrastructure.csproj`)
- Tests:
  - Unit tests: `apps/api/tests/Api.Tests/`
  - Integration tests: `apps/api/tests/Integration.Tests/`
  - API contract/smoke scripts: `apps/api/tests/contracts/`
- Database assets:
  - `apps/api/database/scripts/`
  - `apps/api/database/schema/`
  - `apps/api/database/bundles/` (generated artifacts)
  - `apps/api/database/scripts/migrations/`, `procedures/`, `seeds/`, `maintenance/`

## Documentation (`docs/`)

- `docs/architecture/`: active architecture documents
  - `docs/architecture/adr/`: architecture decision records
  - `docs/architecture/PATH_CONVENTIONS.md`: path and dependency boundary rules
- `docs/backend/`: backend issue/fix and operational notes
- `docs/frontend/`: frontend-specific docs
- `docs/setup/`: environment and onboarding guides
- `docs/reports/`: project and API reports
- `docs/checklists/`: quality and launch checklists
- `docs/troubleshooting/`: active troubleshooting docs
- `docs/**/archive/` and `docs/archive/`: historical snapshots

## Operational Entry Points

- Start both services: `./scripts/run-dev.sh`
- Rebuild DB + verify backend APIs: `./scripts/bootstrap_db.sh`
- Full API regression run: `./scripts/verify_all_apis.sh`
- Local CI mirror: `make ci-local`
- Structure compliance check: `./scripts/check_structure.sh`

Updated: 2026-02-19
