# Documentation Organization

This file defines the current documentation map and maintenance rules.

## Active Structure

```text
docs/
├── README.md
├── DOCUMENTATION_ORGANIZATION.md
├── reports/
│   └── archive/
├── setup/
├── troubleshooting/
│   └── archive/
├── architecture/
│   └── archive/
└── checklists/
```

## Category Purpose

- `reports/`: consolidated project and integration reports.
- `reports/archive/`: historical full report snapshots.
- `setup/`: installation, environment, and onboarding instructions.
- `troubleshooting/`: active issue investigations and current fix guides.
- `troubleshooting/archive/`: historical troubleshooting and verification logs.
- `architecture/`: current structure reference and active migration docs.
- `architecture/archive/`: historical restructure execution artifacts.
- `checklists/`: launch/readiness and PR quality gates.

## Canonical References

- Primary docs index: `docs/README.md`
- Current repository/file structure: `docs/architecture/CURRENT_STRUCTURE_2026.md`

## Consistency Rules

1. Do not reference files that do not exist.
2. Prefer linking to canonical docs rather than copying full reports.
3. Use absolute dates in metadata lines.
4. Keep folder names and examples aligned with the real repository layout.

## Legacy Notes

Historical docs are tracked through archive indices:

- `docs/troubleshooting/archive/README.md`
- `docs/architecture/archive/README.md`

Treat `docs/architecture/CURRENT_STRUCTURE_2026.md` as the authoritative structure reference.

Last Updated: 2026-02-17
