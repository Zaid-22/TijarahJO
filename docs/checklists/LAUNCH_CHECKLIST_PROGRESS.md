# Launch Checklist Progress Report

**Date:** 2026-05-22  
**Status:** Launch Hardening — production environment not finalized

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
- **Project documentation refresh** completed on 2026-05-22 for environment templates, structure counts, and stale paths
- **Verification on 2026-05-22:** repository structure passed, web production build passed, frontend tests passed, backend unit tests passed

## Audit Results (2026-05-22)

| Category | Done | Remaining |
|----------|------|-----------|
| Code Items | Most launch-critical implementation items | Account lockout, CSP tuning, database index review, cleanup |
| Ops/Infra Tasks | Docker production baseline and quality workflows exist | Hosting, DNS/TLS, production DB, backups, monitoring, deploy/rollback automation |
| Manual Testing | Automated local checks passed | Live authorization, expired-token, browser, and staging deployment checks |

## Latest Local Verification

| Check | Result |
|-------|--------|
| `./scripts/check_structure.sh` | Passed |
| `npm run build` in `apps/web` | Passed |
| `npm test` in `apps/web` | Passed: 67 tests |
| `dotnet test apps/api/TijarahJo.sln -c Release --verbosity minimal` | Passed: 229 backend unit tests; 26 live HTTP integration tests skipped because `BASE_URL` was unset |
| `docker compose -f infra/docker-compose.production.yml config --quiet` | Blocked until production env vars such as `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `JWT_ISSUER`, and `JWT_AUDIENCE` are set |

## Remaining Code Tasks

1. Account lockout after failed login attempts
2. Content-Security-Policy header (requires per-app tuning)
3. Database index review and optimization
4. Code cleanup (unused imports, commented code)

## Remaining Ops/Deployment Tasks

1. Choose hosting platform and provision environments
2. SSL certificates
3. Database backups and restore testing
4. CI/CD deployment pipeline and rollback procedure
5. External monitoring/alerting (APM, log aggregation)
6. Replace placeholder domains and provide production env vars

## How to Use This File

- Use this file for a current high-level progress summary
- Use `LAUNCH_READINESS_CHECKLIST.md` to track exact remaining work
- Prefer evidence from scripts, tests, and docs over old completion percentages
