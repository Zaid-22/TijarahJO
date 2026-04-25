# TijarahJo — Jordan's C2C Marketplace Platform

<div align="center">

![TijarahJo](https://img.shields.io/badge/TijarahJo-Marketplace-0A4ABF?style=for-the-badge)
![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?style=for-the-badge&logo=dotnet)
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?style=for-the-badge&logo=microsoftsqlserver)

**A full-stack Customer-to-Customer (C2C) marketplace for buying and selling items in Jordan.**

</div>

---

## Repository Layout

```text

├── apps/
│   ├── web/                     # React + TypeScript + Vite frontend
│   └── api/                     # ASP.NET Core 8 API + SQL migrations
│       ├── src/
│       │   ├── Api/             # Controllers, hubs, startup, contracts
│       │   ├── Application/     # Business logic & service layer
│       │   ├── Domain/          # Domain entities & interfaces
│       │   ├── Infrastructure/  # Data access, external services (Gemini AI, YouTube API)
│       │   └── Bootstrap/       # DI composition root
│       ├── database/            # SQL scripts, migrations & bundles
│       └── tests/               # Unit, integration & contract tests
├── contracts/                   # Shared OpenAPI contract artifacts
├── docs/                        # Project documentation & guides
├── infra/                       # Docker Compose + infra templates
├── scripts/                     # Operational & dev scripts
├── README-RUN.md                # Local run / bootstrap instructions
└── Makefile                     # Common CI and dev commands
```

## Core Features

### Marketplace
- Post creation, editing, status management (active / sold / deleted), and deletion
- Category browsing (15+ categories) and full-text search
- AI-Powered Post Comparison (side-by-side analysis, pros & cons, language-aware)
- YouTube Video Recommendations for compared products
- Image uploads with server-side validation, WebP optimization, thumbnails, and local file storage
- Location map integration with travel time/distance estimations and a polished responsive UI
- Favorites system and seller profiles
- Post view tracking

### User & Security
- Cookie-backed JWT authentication with refresh flow, token blacklisting, session invalidation, and CSRF protection
- Google OAuth 2.0 social login
- Two-Factor Authentication (TOTP / Authenticator app)
- Password reset with email verification codes and DB-backed hashed verification challenges
- Role-based access control (RBAC)

### Communication
- Real-time chat via SignalR (with image uploads)
- In-app notifications
- User reviews and ratings

### Admin Panel
- Dashboard with analytics and KPI metrics
- User management (block, delete, role assignment)
- Post moderation and reports queue
- Fraud detection tools
- Audit logging
- System settings management

### Internationalization
- Full English & Arabic language support
- Complete RTL layout handling
- Dark mode with per-component theming

---

## Architecture Notes

- Password reset and Two-Factor Authentication (2FA) challenge state is persisted in the `VerificationChallenges` table, with hashed tokens and expiry metadata.
- JWT session safety uses cookie-backed access tokens, refresh endpoints, token blacklisting, and `LastInvalidatedAt` session invalidation checks.
- Redis-backed caching and SignalR scale-out are supported when configured; the API can gracefully fall back for local development.
- Production deployments must provide environment-specific origins, hosts, JWT issuer/audience/signing key, database credentials, and persistent upload storage.

---

## Quick Start

See [`README-RUN.md`](README-RUN.md) for the full local workflow.

```bash
./scripts/check_structure.sh   # Verify repo conventions
./scripts/run-dev.sh           # Start backend + frontend
./scripts/bootstrap_db.sh      # Reset DB, apply migrations, seed, verify
make backend-live-tests        # Run live .NET HTTP integration tests
make backend-live-check        # Run the broader live backend verification suite
make ci-local                  # Full local CI mirror
```

`dotnet test ./apps/api/TijarahJo.sln` may skip live HTTP integration tests when `BASE_URL` is unset. Use the live backend make targets above when you want explicit local backend integration coverage against a running backend.

## Documentation

| Document | Purpose |
|----------|---------|
| [`docs/README.md`](docs/README.md) | Documentation index |
| [`docs/DATABASE.md`](docs/DATABASE.md) | Database schema, ERD, lifecycle conventions |
| [`docs/architecture/CURRENT_STRUCTURE_2026.md`](docs/architecture/CURRENT_STRUCTURE_2026.md) | Canonical project structure |
| [`docs/architecture/PATH_CONVENTIONS.md`](docs/architecture/PATH_CONVENTIONS.md) | Path ownership & boundaries |
| [`docs/setup/SETUP_NEW_COMPUTER_GUIDE.md`](docs/setup/SETUP_NEW_COMPUTER_GUIDE.md) | Full setup guide |
| [`docs/reports/API_ENDPOINTS_STATUS.md`](docs/reports/API_ENDPOINTS_STATUS.md) | API endpoint inventory |
| [`ENVIRONMENT_VARIABLES.md`](apps/api/src/Api/ENVIRONMENT_VARIABLES.md) | Environment config reference |

## Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, TypeScript 5, Vite, Tailwind CSS v4, Radix UI, TanStack Query, SignalR client, Lucide React |
| **Backend** | ASP.NET Core 8, Entity Framework Core, SignalR, ImageSharp, optional Redis integration |
| **Database** | SQL Server 2022, Flyway-style ordered migrations, migration guard scripts |
| **Auth** | Cookie-backed JWT auth, refresh endpoint, token blacklisting, CSRF protection, Google OAuth 2.0, TOTP 2FA |
| **Infra** | Docker Compose, GitHub Actions CI |

---

Last Updated: 2026-04-22
