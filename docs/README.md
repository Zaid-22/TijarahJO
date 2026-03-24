# TijarahJo Documentation

This folder contains the maintained project documentation.

## Directory Index

```text
docs/
├── README.md
├── DOCUMENTATION_ORGANIZATION.md
├── api/                         # API conventions & versioning
├── architecture/                # Structure, ADRs, path conventions
│   ├── adr/
│   └── archive/
├── backend/                     # Operational runbooks & quick start
│   └── archive/
├── frontend/                    # ID system, auth QA matrix
│   └── archive/
├── setup/                       # Machine setup, env config, DB setup
├── reports/                     # Project reports & API status
│   └── archive/
├── checklists/                  # Launch readiness & PR quality
├── troubleshooting/             # Active troubleshooting guides
│   └── archive/
├── assets/                      # Documentation assets (images, etc.)
└── archive/                     # Top-level historical docs
```

## Architecture (`architecture/`)

- Canonical current structure: `architecture/CURRENT_STRUCTURE_2026.md`
- Path ownership and boundaries: `architecture/PATH_CONVENTIONS.md`
- Architectural decisions: `architecture/adr/README.md`
- Historical artifacts: `architecture/archive/`

## API (`api/`)

API-specific documentation for contracts, endpoint conventions, route versioning, and OpenAPI notes.

## Backend (`backend/`)

- `QUICK_START.md` — bootstrap and startup quick path
- `OPERATIONS_RUNBOOK.md` — startup modes, health semantics, incident response
- Runtime config reference: `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

## Frontend (`frontend/`)

- `ID_SYSTEM.md` — canonical frontend ID model and implementation details
- `AUTH_RUNTIME_QA_MATRIX.md` — runtime authentication behavior and QA matrix

## Setup (`setup/`)

- `SETUP_NEW_COMPUTER_GUIDE.md` — full machine setup
- `QUICK_SETUP_CHECKLIST.md` — condensed checklist
- `BACKEND_SETUP_STEP_BY_STEP.md` — backend-specific setup
- `DATABASE_SETUP_CHECKLIST.md` — SQL Server / Docker DB setup
- `PRODUCTION_DEPLOYMENT_DOCKER.md` — production container deployment
- `ENV_TEMPLATE.txt` — environment variable template

## Reports (`reports/`)

- `API_ENDPOINTS_STATUS.md` — full API endpoint inventory (auth, posts, chat, admin, notifications, reviews, 2FA)
- `FINAL_PROJECT_REPORT.md` — project summary
- `FRONTEND_FILE_ASSESSMENT_2026-02-17.md` — frontend file assessment
- `archive/` — historical snapshots

## Checklists (`checklists/`)

- `LAUNCH_READINESS_CHECKLIST.md` — launch readiness gates
- `QUICK_LAUNCH_CHECKLIST.md` — condensed launch checklist
- `LAUNCH_CHECKLIST_PROGRESS.md` — progress tracker
- `PR_QUALITY_CHECKLIST.md` — PR quality gates

## Troubleshooting (`troubleshooting/`)

- `README.md` — active troubleshooting guides
- `archive/` — historical troubleshooting logs

## Quick Navigation

| Goal | Document |
|------|----------|
| Set up a new machine | `setup/SETUP_NEW_COMPUTER_GUIDE.md` |
| Deploy to production | `setup/PRODUCTION_DEPLOYMENT_DOCKER.md` |
| View current structure | `architecture/CURRENT_STRUCTURE_2026.md` |
| Review path conventions | `architecture/PATH_CONVENTIONS.md` |
| Check API endpoints | `reports/API_ENDPOINTS_STATUS.md` |
| Configure environment | `apps/api/src/Api/ENVIRONMENT_VARIABLES.md` |
| Launch prep | `checklists/LAUNCH_READINESS_CHECKLIST.md` |
| Backend quick start | `backend/QUICK_START.md` |
| Frontend docs | `frontend/README.md` |

## Documentation Maintenance Rules

1. Keep references path-accurate to actual files.
2. Use real dates (no unresolved template strings).
3. Prefer one canonical document per topic; link instead of duplicating.
4. Mark legacy documents clearly and move them into section `archive/` folders.

Last Updated: 2026-03-24
