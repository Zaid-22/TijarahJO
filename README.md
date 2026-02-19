# TijarahJo Marketplace Platform

Full-stack marketplace application for buying and selling items in Jordan.

## Repository Layout

```text
final project primary/
├── apps/
│   ├── web/                     # React + TypeScript + Vite app
│   └── api/                     # ASP.NET Core API + SQL scripts
├── contracts/                   # Shared API/openapi contract artifacts
├── docs/                        # Project documentation index and guides
├── infra/                       # Docker compose + infra templates
├── scripts/                     # Operational/dev scripts
├── README-RUN.md                # Local run/bootstrap instructions
└── Makefile                     # Common local CI and dev commands
```

## Quick Start

Use `README-RUN.md` for the full local workflow.

Most common commands:

```bash
./scripts/check_structure.sh
./scripts/run-dev.sh
./scripts/bootstrap_db.sh
make ci-local
```

## Documentation

Start here:

- `docs/README.md`
- `docs/architecture/CURRENT_STRUCTURE_2026.md`
- `docs/architecture/PATH_CONVENTIONS.md`

## Core Features

- User authentication and authorization
- Post creation, editing, status updates, and deletion
- Category browsing and search
- Chat, favorites, and seller profiles
- Frontend + backend CI workflows
