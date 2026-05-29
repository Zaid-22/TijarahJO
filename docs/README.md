# TijarahJo Documentation

## Directory Index

```text
docs/
├── README.md
├── DATABASE.md                  # Database schema, ERD, lifecycle conventions
├── api/                         # API conventions & versioning
├── architecture/                # Structure, ADRs, path conventions
│   └── adr/
├── backend/                     # Operational runbooks & quick start
├── frontend/                    # ID system, auth QA, UI governance, perf budgets
├── setup/                       # Machine setup, env config, DB setup
├── reports/                     # Project reports & API status
├── checklists/                  # Launch readiness & PR quality
└── assets/diagrams/             # ERD helper and diagram notes
```

## Architecture (`architecture/`)

- Canonical current structure: `architecture/CURRENT_STRUCTURE_2026.md`
- Path ownership and boundaries: `architecture/PATH_CONVENTIONS.md`
- Architectural decisions: `architecture/adr/README.md`

## Database (`DATABASE.md`)

- Entity relationship diagram (Mermaid)
- Schema enforcement notes
- Auth persistence model
- Data lifecycle conventions (soft-delete strategy, background cleanup)

## API (`api/`)

API-specific documentation for contracts, endpoint conventions, route versioning, and OpenAPI notes.

## Backend (`backend/`)

- `QUICK_START.md` — bootstrap and startup quick path
- `OPERATIONS_RUNBOOK.md` — startup modes, health semantics, incident response
- Runtime config reference: `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

## Frontend (`frontend/`)

- `ID_SYSTEM.md` — canonical frontend ID model and implementation details
- `AUTH_RUNTIME_QA_MATRIX.md` — runtime authentication QA matrix
- `UI_GOVERNANCE.md` — design system rules, accessibility standards, canonical components
- `STORYBOOK_WORKFLOW.md` — Storybook usage, baseline stories, CI gate
- `PERFORMANCE_BUDGETS.md` — bundle size budgets enforced in CI

## Setup (`setup/`)

- `SETUP_NEW_COMPUTER_GUIDE.md` — full machine setup
- `QUICK_SETUP_CHECKLIST.md` — condensed checklist
- `BACKEND_SETUP_STEP_BY_STEP.md` — backend-specific setup
- `DATABASE_SETUP_CHECKLIST.md` — SQL Server / Docker DB setup
- `PRODUCTION_DEPLOYMENT_DOCKER.md` — production container deployment
- Environment template: root `.env.example`

## Reports (`reports/`)

- `API_ENDPOINTS_STATUS.md` — full API endpoint inventory
- `FRONTEND_FILE_ASSESSMENT_2026-02-17.md` — frontend file assessment

## Checklists (`checklists/`)

- `LAUNCH_READINESS_CHECKLIST.md` — launch readiness gates
- `QUICK_LAUNCH_CHECKLIST.md` — condensed launch checklist
- `PR_QUALITY_CHECKLIST.md` — PR quality gates

## Quick Navigation

| Goal | Document |
|------|----------|
| Set up a new machine | `setup/SETUP_NEW_COMPUTER_GUIDE.md` |
| Deploy to production | `setup/PRODUCTION_DEPLOYMENT_DOCKER.md` |
| View current structure | `architecture/CURRENT_STRUCTURE_2026.md` |
| Check API endpoints | `reports/API_ENDPOINTS_STATUS.md` |
| Configure environment | root `.env.example` |
| View database schema | `DATABASE.md` |
| Launch prep | `checklists/LAUNCH_READINESS_CHECKLIST.md` |
| Backend quick start | `backend/QUICK_START.md` |
| Frontend docs | `frontend/README.md` |

Last Updated: 2026-05-28
