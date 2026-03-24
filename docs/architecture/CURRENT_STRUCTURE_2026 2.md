# Current Project Structure (2026)

This document is the canonical structure reference for the current repository state.

## Top-Level

```text
final project primary/
├── .github/workflows/
├── docs/
├── TijarahJo-frontend/
├── TijarahJo-Backend/
├── README.md
├── README-RUN.md
├── Makefile
├── bootstrap_db.sh
├── run-dev.sh
├── verify_all_apis.sh
└── test_delete_post_with_chat.sh
```

## Frontend (`TijarahJo-frontend/`)

- Stack: React + TypeScript + Vite.
- Main source: `src/`
  - `pages/`: route-level views
  - `components/`: admin/chat/figma/ui components
  - `services/`: API and chat services
  - `contexts/`: auth state
  - `hooks/`, `types/`, `utils/`, `constants/`, `styles/`
- Local docs: `TijarahJo-frontend/docs/`

## Backend (`TijarahJo-Backend/`)

- This is a separate git repository referenced from the root repository.
- Main solution: `TijarahJoDBAPI/TijarahJoDBAPI.sln`
- API project: `TijarahJoDBAPI/TijarahJoDBAPI/`
- Layers:
  - `Controllers/`, `DTOs/`, `Hubs/`, `Utils/`, `Services/`, `Models/`
  - `BLL/`, `DAL/`, shared `Models/`
- Database assets: `TijarahJoDBAPI/database/scripts/`
  - `setup/`, `migrations/`, `seeds/`, `bundles/`, `archive/`

## Documentation (`docs/`)

- `reports/`: high-level project and API status reports
- `setup/`: environment and onboarding guides
- `troubleshooting/`: active issue/fix guides
- `troubleshooting/archive/`: historical troubleshooting reports
- `checklists/`: launch and PR quality gates
- `architecture/`: this file + active architecture references
- `architecture/archive/`: historical restructure artifacts

## Operational Entry Points

- Start both services: `./run-dev.sh`
- Rebuild DB + verify backend APIs: `./bootstrap_db.sh`
- Full API regression run: `./verify_all_apis.sh`
- Local CI mirror: `make ci-local`

Updated: 2026-02-17
