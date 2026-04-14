# Launch Checklist Progress Report

**Date:** 2026-04-14  
**Status:** Launch Hardening — Final Phase

This file is a lightweight progress view. The canonical launch gate list remains:

- `docs/checklists/LAUNCH_READINESS_CHECKLIST.md`

## Completed or Established Baseline

- Environment-based backend configuration is documented and in active use
- Local bootstrap flow exists through `./scripts/bootstrap_db.sh`
- Local app startup flow exists through `./scripts/run-dev.sh`
- Cookie-backed JWT auth, logout invalidation, and refresh recovery are implemented
- Frontend signed-in refresh behavior is documented and aligned with current runtime behavior
- API endpoint inventory is maintained in `docs/reports/API_ENDPOINTS_STATUS.md`
- Database schema, migrations, and bundle workflows are documented under `apps/api/database/` and `docs/DATABASE.md`
- **Full RBAC authorization** with 16 granular policies active across all controllers
- **File-based image upload** with WebP optimization, thumbnails, and content moderation
- **Security headers** (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- **PBKDF2-SHA256** password hashing with 100k iterations
- **Rate limiting** on auth and API endpoints
- **CSRF protection** for cookie-authenticated requests
- **40+ lazy-loaded routes/components** for frontend performance
- **Structured JSON logging** for production
- **Health check endpoints** (`/health/live`, `/health/ready`)
- **`.env.production`** created for frontend deployment
- **`appsettings.Production.json`** with complete production template

## Audit Results (2026-04-14)

| Category | Done | Remaining |
|----------|------|-----------|
| Code Items | ~70 | ~5 |
| Ops/Infra Tasks | 0 | ~10 |
| Manual Testing | ~11 | ~10 |

## Remaining Code Tasks

1. Account lockout after failed login attempts
2. Content-Security-Policy header (requires per-app tuning)
3. Database index review and optimization
4. Code cleanup (unused imports, commented code)

## Remaining Ops/Deployment Tasks

1. Choose hosting platform and provision environments
2. SSL certificates
3. Database backups and restore testing
4. CI/CD pipeline
5. External monitoring/alerting (APM, log aggregation)
6. Replace placeholder domains in production config files

## How to Use This File

- Use this file for a current high-level progress summary
- Use `LAUNCH_READINESS_CHECKLIST.md` to track exact remaining work
- Prefer evidence from scripts, tests, and docs over old completion percentages
