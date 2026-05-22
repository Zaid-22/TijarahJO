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
├── Makefile
├── .env.example
└── .editorconfig
```

## Frontend (`apps/web/`)

- **Stack:** React 18 + TypeScript 5 + Vite + Tailwind CSS v4
- **Main source:** `apps/web/src/`
  - `app/` — bootstrap, root composition, route shell
  - `features/` — domain slices:
    - `admin/` — admin panel (dashboard, users, posts, analytics, reports)
    - `auth/` — login, signup, password reset, 2FA
    - `chat/` — real-time messaging via SignalR
    - `home/` — landing page & hero
    - `marketplace/` — post browsing, category filtering, search
    - `post-details/` — single post view, image gallery, similar posts
    - `profile/` — user profile editing
    - `seller-profile/` — public seller pages & reviews
    - `settings/` — user settings, language, theme, 2FA management
  - `pages/` — route-level page composition
  - `shared/` — reusable UI primitives and shared modules
  - `services/` — API client layer and chat service
  - `contexts/` — React contexts (auth, theme, language)
  - `hooks/` — custom hooks (debounce, favorites, localStorage, navigation)
  - `translations/` — i18n string bundles (EN, AR)
  - `types/`, `utils/`, `constants/`, `styles/`, `data/`, `lib/`
- **Tests:** `apps/web/tests/`
  - `unit/`, `integration/`, `e2e/`

## Backend (`apps/api/`)

- **Stack:** ASP.NET Core 8 (.NET 8) + SQL Server + SignalR
- **Solution:** `apps/api/TijarahJo.sln`
- **Source projects (Clean Architecture):**
  - `apps/api/src/Api/` (`TijarahJo.Api.csproj`) — Controllers, Hubs, Startup, Contracts
    - `Features/` — feature folders:
      - `Admin/` — admin controllers (analytics, audit log, dashboard, locations, permissions, posts, reports queue, reviews, search, settings, users)
      - `Auth/` — AuthController, OAuthController, PasswordResetController, TwoFactorController
      - `Categories/`, `Chat/`, `Compare/`, `Favorites/`, `Locations/`
      - `Notifications/`, `Posts/`, `Reviews/`, `Roles/`
      - `Search/`, `Sellers/`, `Users/`
    - `Hubs/` — SignalR ChatHub
    - `Contracts/` — Request/Response DTOs
    - `Common/` — Shared utilities and helpers
    - `Startup/` — service registration & middleware pipeline
  - `apps/api/src/Application/` (`TijarahJo.Application.csproj`) — Business logic
  - `apps/api/src/Domain/` (`TijarahJo.Domain.csproj`) — Entities & interfaces
  - `apps/api/src/Infrastructure/` (`TijarahJo.Infrastructure.csproj`) — Data access, external services (Gemini AI, YouTube API)
  - `apps/api/src/Bootstrap/` — DI composition root
- **Tests:**
  - Unit tests: `apps/api/tests/Api.Tests/`
  - Integration tests: `apps/api/tests/Integration.Tests/`
  - API contract/smoke scripts: `apps/api/tests/contracts/`
- **Database assets:**
  - `apps/api/database/scripts/migrations/` — 59 versioned migration files
  - `apps/api/database/scripts/bootstrap_overrides/`, `diagnostics/`, `maintenance/`, `seeds/`, `setup/`
  - `apps/api/database/schema/`
  - `apps/api/database/bundles/` — generated consolidated SQL bundles

## Documentation (`docs/`)

- `docs/DATABASE.md` — canonical database schema, ERD, lifecycle conventions
- `docs/architecture/` — active architecture documents
  - `docs/architecture/adr/` — architecture decision records
  - `docs/architecture/PATH_CONVENTIONS.md` — path and dependency boundary rules
- `docs/api/` — API conventions (versioning, route contracts)
- `docs/backend/` — backend operational notes & runbooks
- `docs/frontend/` — frontend technical docs (ID system, auth QA matrix)
- `docs/setup/` — environment and onboarding guides
- `docs/reports/` — project and API endpoint reports
- `docs/checklists/` — quality and launch checklists
- `docs/troubleshooting/` — active troubleshooting docs

## Operational Entry Points

| Command | Purpose |
|---------|---------|
| `./scripts/run-dev.sh` | Start both backend & frontend |
| `./scripts/bootstrap_db.sh` | Reset DB + apply migrations + verify APIs |
| `./scripts/verify_all_apis.sh` | Full API regression run |
| `./scripts/check_structure.sh` | Repo structure compliance check |
| `make ci-local` | Full local CI mirror |
| `make sql-bundles` | Regenerate consolidated SQL bundles |

Updated: 2026-05-22
