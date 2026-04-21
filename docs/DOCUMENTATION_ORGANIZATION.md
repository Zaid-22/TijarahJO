# Documentation Organization

This file defines the current documentation map and maintenance rules.

## Active Structure

```text
docs/
├── README.md
├── DOCUMENTATION_ORGANIZATION.md
├── DATABASE.md                 # Database schema, ERD, lifecycle
├── api/                    # API conventions & versioning
├── architecture/           # Structure, ADRs, path conventions
│   ├── adr/
│   └── archive/
├── backend/                # Operational runbooks & quick start
│   └── archive/
├── frontend/               # ID system, auth QA matrix
│   └── archive/
├── setup/                  # Machine setup, env config, DB setup
├── reports/                # Project & API status reports
│   └── archive/
├── checklists/             # Launch readiness & PR quality
├── troubleshooting/        # Active troubleshooting guides
│   └── archive/
├── assets/                 # Documentation assets
└── archive/                # Top-level historical docs
```

## Category Purpose

| Folder | Purpose |
|--------|---------|
| `api/` | API endpoint conventions, route versioning, OpenAPI notes |
| `architecture/` | Current structure reference, ADRs, path conventions |
| `architecture/archive/` | Historical restructure artifacts |
| `backend/` | Backend operational notes, runbooks, quick start |
| `frontend/` | Frontend ID system, auth QA matrix |
| `setup/` | Installation, environment, and onboarding instructions |
| `reports/` | Consolidated project and API endpoint reports |
| `reports/archive/` | Historical full report snapshots |
| `checklists/` | Launch readiness and PR quality gates |
| `troubleshooting/` | Active issue investigations and fix guides |
| `troubleshooting/archive/` | Historical troubleshooting logs |
| `assets/` | Images, diagrams, and other static doc assets |

## Canonical References

- Primary docs index: `docs/README.md`
- Current repository/file structure: `docs/architecture/CURRENT_STRUCTURE_2026.md`
- Database schema & ERD: `docs/DATABASE.md`
- Environment variables: `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

## Consistency Rules

1. Do not reference files that do not exist.
2. Prefer linking to canonical docs rather than copying full reports.
3. Use absolute dates in metadata lines.
4. Keep folder names and examples aligned with the real repository layout.

Legacy one-time fix reports and historical integration snapshots should live under
section-specific `archive/` folders, not alongside current operational docs.

## Legacy Notes

Historical docs are tracked through archive indices:

- `docs/troubleshooting/archive/README.md`
- `docs/architecture/archive/README.md`

Treat `docs/architecture/CURRENT_STRUCTURE_2026.md` as the authoritative structure reference.

Last Updated: 2026-04-21
