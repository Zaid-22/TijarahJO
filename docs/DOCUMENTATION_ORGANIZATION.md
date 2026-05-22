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
├── frontend/               # ID system, auth QA matrix
│   └── archive/
├── setup/                  # Machine setup, env config, DB setup
├── reports/                # Project & API status reports
├── checklists/             # Launch readiness & PR quality
├── troubleshooting/        # Active troubleshooting guides
└── assets/                 # Documentation assets and diagram notes
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
| `checklists/` | Launch readiness and PR quality gates |
| `troubleshooting/` | Active issue investigations and fix guides |
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
section-specific `archive/` folders when those files exist, not alongside current
operational docs.

## Legacy Notes

Current archived files live under `docs/architecture/archive/` and
`docs/frontend/archive/`. Empty archive folders may exist as placeholders but
should not be referenced as active indices.

Treat `docs/architecture/CURRENT_STRUCTURE_2026.md` as the authoritative structure reference.

Last Updated: 2026-05-22
