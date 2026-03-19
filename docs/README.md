# TijarahJo Documentation

This folder contains the maintained project documentation.

## Directory Index

```text
docs/
├── README.md
├── DOCUMENTATION_ORGANIZATION.md
├── api/
├── archive/
├── backend/
├── frontend/
├── reports/
│   └── archive/
├── setup/
├── troubleshooting/
│   └── archive/
├── architecture/
│   ├── adr/
│   └── archive/
└── checklists/
```

## Reports (`reports/`)

- `reports/FINAL_PROJECT_REPORT.md`
- `reports/API_ENDPOINTS_STATUS.md`
- `reports/FRONTEND_FILE_ASSESSMENT_2026-02-17.md`
- `reports/archive/README.md` (historical snapshots)

Use for project summary, endpoint status, and active report references.

## API (`api/`)

API-specific documentation for contracts, endpoint conventions, and OpenAPI-related notes.

## Backend (`backend/`)

Operational backend notes and historical fix summaries consolidated from the API repository.

## Frontend (`frontend/`)

Frontend-focused implementation notes and QA matrices.

## Setup (`setup/`)

- `setup/SETUP_NEW_COMPUTER_GUIDE.md`
- `setup/QUICK_SETUP_CHECKLIST.md`
- `setup/PRODUCTION_DEPLOYMENT_DOCKER.md`
- `setup/ENV_TEMPLATE.txt`
- `setup/BACKEND_SETUP_STEP_BY_STEP.md`
- `setup/DATABASE_SETUP_CHECKLIST.md`

Use for machine setup, backend setup, and environment configuration.

## Troubleshooting (`troubleshooting/`)

Primary active docs:
- `troubleshooting/README.md`

Historical troubleshooting logs:

- `troubleshooting/archive/README.md`

## Architecture (`architecture/`)

- Canonical current structure: `architecture/CURRENT_STRUCTURE_2026.md`
- Path ownership and boundaries: `architecture/PATH_CONVENTIONS.md`
- Architectural decisions: `architecture/adr/README.md`
- Historical restructure implementation artifacts:
  - `architecture/archive/README.md`

## Checklists (`checklists/`)

Launch/readiness and PR quality checklists.

## Quick Navigation

- Setup project: `setup/SETUP_NEW_COMPUTER_GUIDE.md`
- Production containers: `setup/PRODUCTION_DEPLOYMENT_DOCKER.md`
- Backend docs index: `backend/README.md`
- Frontend docs index: `frontend/README.md`
- View historical final report snapshot: `reports/archive/README.md`
- Check API behavior: `reports/API_ENDPOINTS_STATUS.md`
- View current structure: `architecture/CURRENT_STRUCTURE_2026.md`
- Review path conventions: `architecture/PATH_CONVENTIONS.md`
- Review archived troubleshooting history: `troubleshooting/archive/README.md`
- Launch prep: `checklists/LAUNCH_READINESS_CHECKLIST.md`

## Documentation Maintenance Rules

1. Keep references path-accurate to actual files.
2. Use real dates (no unresolved template strings).
3. Prefer one canonical document per topic; link instead of duplicating.
4. Mark legacy documents clearly when they are historical and move them into section archives when practical.

Last Updated: 2026-02-17
