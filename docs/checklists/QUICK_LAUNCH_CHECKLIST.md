# 🚀 Quick Launch Checklist — Remaining Priorities

**Last Updated:** 2026-05-22  
**Status:** Code/build readiness is strong; production publish is blocked on real environment and ops setup.

> This is a condensed view. See [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) for the full audit.

---

## ✅ Already Completed (Code-Level)

These items from the original checklist are **done and verified** in the codebase:

- [x] JWT signing key from environment variable (validated ≥ 32 bytes at startup)
- [x] Database connection string from environment variable
- [x] `[Authorize]` active on all protected endpoints (16 granular RBAC policies)
- [x] Ownership checks on update/delete operations
- [x] HTTPS enforcement + HSTS
- [x] Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] CORS locked down for production (throws if not configured)
- [x] File-based image upload (posts, avatars, chat — with WebP optimization + thumbnails)
- [x] Base64 storage replaced with FormData uploads
- [x] Toast notifications (sonner library, no raw `alert()`)
- [x] Form validation with per-field error indicators
- [x] `appsettings.Production.json` configured
- [x] `.env.production` created for frontend
- [x] All secrets stored as empty placeholders (env-var driven)
- [x] PBKDF2-SHA256 password hashing (100k iterations)
- [x] Rate limiting on auth endpoints
- [x] 40+ lazy-loaded routes/components
- [x] Structured JSON logging for production
- [x] Health check endpoints (`/health/live`, `/health/ready`)
- [x] Debug logs gated behind environment check
- [x] Structure check passed on 2026-05-22 (`./scripts/check_structure.sh`)
- [x] Frontend production build passed on 2026-05-22 (`npm run build`)
- [x] Frontend unit/integration/policy tests passed on 2026-05-22 (`npm test`: 67 passed)
- [x] Backend unit tests passed on 2026-05-22 (`dotnet test apps/api/TijarahJo.sln -c Release`: 229 passed)

---

## 🟡 Remaining Code Tasks

| # | Task | Priority |
|---|------|----------|
| 1 | Account lockout after failed login attempts | Should fix |
| 2 | Content-Security-Policy header | Should fix |
| 3 | Database index review for high-frequency queries | Should fix |
| 4 | Code cleanup (unused imports, commented code) | Nice to have |

---

## 🔴 Remaining Manual Testing

| # | Test | Status |
|---|------|--------|
| 1 | Try to edit another user's post (should fail) | Not tested |
| 2 | Try to delete another user's post (should fail) | Not tested |
| 3 | Test with expired token | Not tested |
| 4 | Test with invalid/missing required fields | Not tested |
| 5 | Test role-based access (admin vs user) | Not tested |

---

## 🔧 Remaining Ops/Deployment Tasks

| # | Task | Notes |
|---|------|-------|
| 1 | Choose hosting platform | Azure, AWS, DigitalOcean, etc. |
| 2 | Set up staging + production environments | — |
| 3 | SSL certificates | Hosting provider |
| 4 | Database backups | Automated schedule |
| 5 | CI/CD deployment pipeline | Quality-check workflows exist; automated deploy/rollback remains |
| 6 | External monitoring/alerting | Sentry, Application Insights, etc. |
| 7 | Replace placeholder domains and production env values | `your-production-domain.com`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`, `ALLOWED_HOSTS`, `JWT_ISSUER`, `JWT_AUDIENCE` |
| 8 | Run live backend and browser E2E checks against deployed/staging URL | `BASE_URL=...`, Playwright backend-live suite |

---

**See [`LAUNCH_READINESS_CHECKLIST.md`](LAUNCH_READINESS_CHECKLIST.md) for the full detailed checklist with file-level evidence.**
