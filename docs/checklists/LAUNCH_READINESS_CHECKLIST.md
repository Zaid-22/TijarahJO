# 🚀 TijarahJo Project - Launch Readiness Checklist

**Project:** TijarahJo Marketplace Platform  
**Status:** Launch Hardening — Final Phase  
**Last Updated:** 2026-04-14  
**Last Audit:** 2026-04-14 (automated code-level audit)

---

## 📋 Table of Contents

1. [🔐 Security & Authentication](#security--authentication)
2. [🛡️ Authorization & Permissions](#authorization--permissions)
3. [💾 Database & Data Integrity](#database--data-integrity)
4. [🖼️ Image Upload & Storage](#image-upload--storage)
5. [✅ Validation & Error Handling](#validation--error-handling)
6. [🔧 Configuration & Environment](#configuration--environment)
7. [🚀 Performance & Optimization](#performance--optimization)
8. [🧪 Testing & Quality Assurance](#testing--quality-assurance)
9. [📝 Documentation & Code Quality](#documentation--code-quality)
10. [🌐 Deployment & Infrastructure](#deployment--infrastructure)
11. [📱 Frontend Polish](#frontend-polish)
12. [🔍 Monitoring & Logging](#monitoring--logging)

---

## 🔐 Security & Authentication

### Critical (Must Fix Before Launch)

- [x] **JWT Token Security**
  - [x] JWT signing key read from environment variable (empty placeholder in `appsettings.json`)
  - [x] Minimum 256-bit key enforced at startup (`AuthenticationExtensions.cs` rejects < 32 bytes)
  - [x] Store signing key via secure env var or secret manager at deployment time
  - [x] JWT token lifetime set to 120 minutes (configurable in `appsettings.Production.json`)
- [x] **Connection String Security**

  - [x] Connection strings resolved from env vars (`DataAccessSettings.cs`: `DATABASE_CONNECTION_STRING` / `ConnectionStrings:DefaultConnection`)
  - [x] Config files contain empty placeholders — no secrets committed
  - [x] Secure connection strings configured at deployment time

- [x] **HTTPS Enforcement**

  - [x] HTTPS redirection enabled (`Program.cs`: `app.UseHttpsRedirection()`)
  - [ ] Configure SSL certificates (ops task — hosting provider)
  - [x] CORS validates HTTPS origins in production (`CorsExtensions.cs`)

- [x] **API Security Headers**
  - [x] HSTS header enabled (`Program.cs`: `app.UseHsts()`)
  - [x] `X-Content-Type-Options: nosniff` (added 2026-04-14 via `UseTijarahJoSecurityHeaders`)
  - [x] `X-Frame-Options: DENY` (added 2026-04-14 via `UseTijarahJoSecurityHeaders`)
  - [x] `Referrer-Policy: strict-origin-when-cross-origin` (added 2026-04-14)
  - [x] `Permissions-Policy` restricting camera/mic/geo (added 2026-04-14)
  - [ ] Content-Security-Policy (deferred — requires per-app tuning)
  - [x] CORS locked down for production: throws if `CORS:AllowedOrigins` not set (`CorsExtensions.cs`)
  - [x] `AllowedHosts` set to specific domain in `appsettings.Production.json`

### Important (Should Fix Soon)

- [x] **Password Security**

  - [x] PBKDF2-SHA256 with 100,000 iterations and random salt (`PasswordHelper.cs`)
  - [x] Legacy hash auto-migration on login
  - [x] Rate limiting on auth endpoints (`[EnableRateLimiting("auth")]` — 30 permits/min)
  - [ ] Implement account lockout after failed attempts

- [x] **Input Sanitization**
  - [x] EF Core parameterized queries (default) + Dapper parameterized queries
  - [x] File upload validation (type, size, allowed extensions)
  - [x] Image moderation (adult/violence detection before accepting uploads)

---

## 🛡️ Authorization & Permissions

### Critical (Must Fix Before Launch)

- [x] **Enable Authorization on Protected Endpoints**

  - [x] `[Authorize]` attributes active on all protected controllers (Users, Reports, Favorites, Notifications, Compare, Chat, Admin)
  - [x] JWT claims extraction implemented in controllers
  - [x] Ownership verification for update/delete (e.g., `UsersController.cs` checks `currentUserId == id`)
  - [ ] End-to-end test: users cannot modify/delete other users' posts

- [x] **Role-Based Access Control (RBAC)**

  - [x] Granular policy-based authorization: `UsersView`, `UsersManage`, `PostsView`, `PostsModerate`, `AdminAccess`, `AdminOnly`, `ReportsView`, `ReportsResolve`, `CategoriesManage`, `LocationsManage`, `SettingsManage`, `RolesManage`, `CommentsView`, `CommentsModerate`
  - [x] Admin-only endpoints protected via `[Authorize(Policy = AuthorizationPolicies.AdminOnly)]`
  - [x] Role checks in controllers with `_authorizationService.AuthorizeAsync`

- [x] **Resource Ownership**
  - [x] Users can only update their own profile (admin override via policy check)
  - [x] Avatar upload verifies `currentUserId == id`

### Important (Should Fix Soon)

- [x] **Session Refresh Hardening**
  - [x] Authenticated refresh endpoint (`POST /api/v1/auth/refresh`)
  - [x] Frontend handles token expiration via retry and session revalidation
  - [ ] Auto-refresh tokens before expiration (nice-to-have)

---

## 💾 Database & Data Integrity

### Critical (Must Fix Before Launch)

- [x] **Foreign Key Constraints**

  - [x] All entity configurations define explicit `OnDelete` behaviors across 15+ configuration files
  - [x] Cascade delete for post comments and verification challenges
  - [x] Restrict delete for posts, users, favorites, reviews, reports, messages (prevents accidental data loss)
  - [ ] Consider adding manual cleanup logic when deleting posts (images use `Restrict`, not `Cascade`)

- [x] **Database Cleanup**

  - [x] Bootstrap script exists (`./scripts/bootstrap_db.sh`)
  - [x] SQL audit scripts exist
  - [x] Versioned migration scripts in `apps/api/database/scripts/migrations/`

- [ ] **Database Backups** _(ops task)_
  - [ ] Set up automated database backups
  - [ ] Test backup restoration process
  - [ ] Document backup schedule and retention policy

### Important (Should Fix Soon)

- [x] **Database Migrations**

  - [x] Versioned migration scripts (V-prefixed) with checksums
  - [x] Migration state tracked via bootstrap workflow

- [ ] **Indexes**
  - [ ] Review and optimize indexes on frequently queried columns
  - [ ] Verify index coverage for `PostTitle`, `Email`, search fields

---

## 🖼️ Image Upload & Storage

### Critical (Must Fix Before Launch)

- [x] **Implement File Upload Endpoint**

  - [x] Post images: `PostImagesController.cs` → `[HttpPost("upload")]` with `[FromForm]`
  - [x] User avatars: `UsersController.cs` → `UploadAvatar` endpoint
  - [x] Chat images: `ChatController.cs` → `[HttpPost("upload-image")]`
  - [x] File type validation (allowed extensions configured)
  - [x] File size validation (max 10MB configurable via `MaxPostImageBytes`)

- [x] **Image Storage Solution**

  - [x] Local filesystem storage via `LocalPostImageFileStorageService`
  - [x] Production path: `/var/lib/tijarahjo/uploads` (configurable)
  - [x] Unique filenames generated to prevent conflicts
  - [x] WebP conversion with configurable quality (`OptimizeImages: true`, `ConvertImagesToWebp: true`)
  - [x] Thumbnail generation (640x640, quality 60)

- [x] **Replace Base64 Storage**

  - [x] Frontend uploads via `FormData` (not base64)
  - [x] `readAsDataURL` used only for client-side preview (never sent to backend)
  - [x] Backwards-compatible parser in `mappers.ts` for any legacy base64 data in DB

- [x] **Image Management**
  - [x] Image update functionality via `replacePostImages` (deletes old, uploads new)
  - [x] Image moderation (adult/violence content detection)

### Important (Should Fix Soon)

- [ ] **CDN Integration**
  - [ ] Set up CDN for image delivery
  - [x] Image caching configured (30-day `Cache-Control` header on static uploads)

---

## ✅ Validation & Error Handling

### Critical (Must Fix Before Launch)

- [x] **Form Validation**

  - [x] Toast notifications via `sonner` library (no raw `alert()` calls)
  - [x] Client-side validation on all forms (`validateEditProfileForm`, `validateLoginForm`, `validateLoginField`)
  - [x] Per-field visual error indicators
  - [x] Consistent error message display

- [x] **API Error Handling**

  - [x] All API calls wrapped in try-catch with user-friendly messages
  - [x] Consistent `ProblemDetails` response format (RFC 7807)
  - [x] Global exception handler (`UseTijarahJoExceptionHandler`)
  - [x] Status code pages middleware (`UseTijarahJoStatusCodePages`)

- [x] **Input Validation**
  - [x] Required field validation on all forms
  - [x] Email format validation
  - [x] Phone number normalization (`normalizeJordanPhone`)
  - [x] Model state validation with auto-400 responses

### Important (Should Fix Soon)

- [x] **Error Logging**
  - [x] Structured JSON logging in production (`appsettings.Production.json`)
  - [ ] External log aggregation (Application Insights, Sentry, etc.) — ops task
  - [ ] Error alerting — ops task

---

## 🔧 Configuration & Environment

### Critical (Must Fix Before Launch)

- [x] **Environment Variables**

  - [x] `appsettings.Production.json` exists with production-ready structure
  - [x] All secrets are empty placeholders — must be provided via environment
  - [x] JWT, connection strings, API keys, 2FA keys, email credentials all env-driven

- [x] **Production Configuration**

  - [x] JWT issuer/audience template ready in `appsettings.Production.json`
  - [x] CORS configured for production (requires `CORS:AllowedOrigins` env var)
  - [x] Production logging levels (Warning, JSON format, UTC timestamps)
  - [x] Feature flags: rate limiting, health checks, Redis all enabled for production

- [x] **Frontend Environment Variables**
  - [x] `.env.production` created (2026-04-14) — replace `your-production-domain.com` with real URL
  - [x] `.env` files covered by `.gitignore`

### Important (Should Fix Soon)

- [x] **Configuration Management**
  - [x] Environment variables documented in `ENVIRONMENT_VARIABLES.md`
  - [x] Startup validation (JWT key length, CORS origins, missing config throws on boot)

---

## 🚀 Performance & Optimization

### Critical (Must Fix Before Launch)

- [x] **API Performance**

  - [x] Pagination implemented for posts feed and search results
  - [x] In-memory caching enabled (feature flag)
  - [x] Redis configured for production (session cache, SignalR backplane)

- [x] **Frontend Performance**

  - [x] Code splitting: 40+ `lazy()` imports across all major pages and components
  - [x] Route-level lazy loading for admin, auth, marketplace, settings, chat
  - [x] Image optimization on upload (WebP conversion, thumbnails)

- [ ] **Database Performance**
  - [ ] Review slow query logs
  - [ ] Add missing indexes for high-frequency queries
  - [ ] Verify connection pooling configuration

### Important (Should Fix Soon)

- [x] **Caching Strategy**
  - [x] In-memory caching enabled
  - [x] Redis presence for distributed caching in production
  - [x] Static file caching (30-day `Cache-Control` on uploads)

---

## 🧪 Testing & Quality Assurance

### Critical (Must Fix Before Launch)

- [x] **Manual Testing - Core Features**

  - [x] User registration/signup
  - [x] User login
  - [x] Create post
  - [x] Edit post (own posts only)
  - [x] Delete post (own posts only)
  - [x] View all posts
  - [x] View post details
  - [x] View user profile
  - [x] Edit user profile
  - [x] Search functionality
  - [x] Category filtering
  - [ ] Try to edit another user's post (should fail)
  - [ ] Try to delete another user's post (should fail)
  - [ ] Test with expired token

- [ ] **Manual Testing - Edge Cases**

  - [ ] Test with invalid data
  - [ ] Test with missing required fields
  - [ ] Test with very long strings
  - [ ] Test with special characters

- [ ] **Authorization Testing**
  - [ ] Verify users cannot access other users' data
  - [ ] Verify users cannot modify other users' posts
  - [ ] Verify unauthorized requests are rejected
  - [ ] Test role-based access

### Important (Should Fix Soon)

- [x] **Automated Testing**

  - [x] Unit tests for critical business logic (12+ test files: Auth, Search, Password Reset, Chat, Rate Limiting, Categories, Sellers, Favorites, Post Images)
  - [x] Contract/integration test script (`backend_integration_contract.sh`)
  - [x] E2E test setup (Playwright configured, test directory exists)
  - [ ] CI/CD pipeline with automated tests

- [ ] **Load Testing**
  - [ ] Test API under load
  - [ ] Identify performance bottlenecks
  - [ ] Test concurrent user scenarios

---

## 📝 Documentation & Code Quality

### Important (Should Fix Soon)

- [x] **Code Cleanup**

  - [x] Debug logs gated behind environment check (`logger.ts`: only active when `DEV && VITE_DEBUG_LOGS`)
  - [ ] Remove commented-out code
  - [ ] Remove unused imports
  - [ ] Remove unused files

- [x] **Documentation**

  - [x] API endpoints documented via Swagger (with JWT auth support)
  - [x] Environment variables documented (`ENVIRONMENT_VARIABLES.md`)
  - [x] Database architecture documented (`DATABASE.md`, `AUDIT_SUMMARY.md`)
  - [x] Architecture documented (`CURRENT_STRUCTURE_2026.md`, `PATH_CONVENTIONS.md`, ADRs)
  - [x] Setup guide exists (`BACKEND_SETUP_STEP_BY_STEP.md`, `QUICK_SETUP_CHECKLIST.md`)
  - [x] Operations runbook exists (`OPERATIONS_RUNBOOK.md`)

- [ ] **Code Quality**
  - [x] Prettier and ESLint configured (`.prettierrc.json`, `.eslintrc.cjs`)
  - [ ] Fix all compiler warnings
  - [ ] Run code formatter across full codebase
  - [ ] Add XML documentation comments to public APIs

---

## 🌐 Deployment & Infrastructure

### Critical (Must Fix Before Launch)

- [ ] **Deployment Plan** _(ops tasks)_

  - [ ] Choose hosting platform (Azure, AWS, DigitalOcean, etc.)
  - [ ] Set up staging environment
  - [ ] Set up production environment
  - [ ] Configure domain names and DNS
  - [ ] Set up SSL certificates

- [x] **Backend Deployment Readiness**

  - [x] `appsettings.Production.json` template ready
  - [x] Health check endpoints (`/health/live`, `/health/ready`)
  - [x] Forwarded headers support for reverse proxy

- [x] **Frontend Deployment Readiness**

  - [x] Dockerfile exists (`apps/web/Dockerfile`)
  - [x] `.env.production` created with placeholder URL
  - [x] Vite production build configured

- [ ] **Database Deployment** _(ops tasks)_
  - [ ] Set up production database server
  - [x] Migration scripts ready to run
  - [ ] Configure database backups
  - [ ] Set up database monitoring

### Important (Should Fix Soon)

- [ ] **CI/CD Pipeline**
  - [ ] Set up automated builds
  - [ ] Set up automated deployments
  - [ ] Configure deployment approvals
  - [ ] Set up rollback procedures

---

## 📱 Frontend Polish

### Important (Should Fix Soon)

- [ ] **User Experience**

  - [x] Loading states on async operations (skeleton loaders, spinners)
  - [ ] Add empty states (no posts, no results, etc.)
  - [x] User-friendly error messages via toast notifications
  - [x] Form validation feedback with per-field indicators

- [ ] **Responsive Design**

  - [ ] Test on mobile devices
  - [ ] Test on tablets
  - [ ] Test on different screen sizes
  - [ ] Fix any layout issues

- [ ] **Accessibility**

  - [x] `aria-label` attributes on interactive elements
  - [ ] Add alt text to all images
  - [ ] Ensure keyboard navigation works
  - [ ] Check color contrast ratios

- [ ] **Browser Compatibility**
  - [ ] Test on Chrome, Firefox, Safari, Edge
  - [ ] Fix any browser-specific issues
  - [ ] Test on mobile browsers

---

## 🔍 Monitoring & Logging

### Important (Should Fix Soon)

- [ ] **Application Monitoring** _(ops task)_

  - [ ] Set up APM (Application Insights, Datadog, etc.)
  - [ ] Monitor API response times
  - [ ] Monitor error rates
  - [ ] Set up alerts for critical issues

- [x] **Logging**

  - [x] Structured JSON logging in production (`appsettings.Production.json`)
  - [x] Scoped logging with UTC timestamps
  - [x] Production log level: Warning (reduces noise)
  - [ ] External log aggregation (ops task)

- [x] **Health Checks**
  - [x] `/health/live` — process liveness check
  - [x] `/health/ready` — database connectivity check
  - [ ] Monitor external service dependencies (Redis, Gemini API)

---

## 📊 Launch Day Checklist

### Pre-Launch (24 hours before)

- [ ] Run full test suite
- [ ] Perform security scan
- [ ] Review all critical checklist items
- [ ] Back up database
- [ ] Notify team of launch time

### Launch Day

- [ ] Deploy to staging first
- [ ] Test staging deployment
- [ ] Deploy to production
- [ ] Verify production deployment
- [ ] Monitor error logs
- [ ] Test critical user flows
- [ ] Monitor performance metrics

### Post-Launch (First 24 hours)

- [ ] Monitor error logs continuously
- [ ] Monitor performance metrics
- [ ] Respond to user feedback
- [ ] Fix any critical bugs immediately
- [ ] Document any issues found

---

## 🎯 Priority Summary

### ✅ Completed (Code-Level)

1. ~~Security & Authentication~~ — JWT, PBKDF2, rate limiting, security headers all implemented
2. ~~Authorization~~ — Full RBAC with granular policies, ownership checks
3. ~~Image upload~~ — File-based upload with WebP optimization, thumbnails, moderation
4. ~~Validation & Error handling~~ — ProblemDetails, toast notifications, form validation
5. ~~Configuration~~ — Production config templates ready, env-var driven
6. ~~Performance~~ — Lazy loading, pagination, caching, Redis

### 🟡 Remaining Code Tasks

1. Account lockout after failed login attempts
2. Content-Security-Policy header (requires per-app tuning)
3. Database index review
4. Manual authorization testing (edit/delete other user's post)
5. Code cleanup (unused imports, commented code)

### 🔧 Remaining Ops/Deployment Tasks

1. Choose hosting platform and set up environments
2. SSL certificates
3. Database backups
4. CI/CD pipeline
5. External monitoring/alerting
6. Replace placeholder domains in production config

---

## 📝 Notes

- This checklist should be reviewed regularly
- Update dates as items are completed
- Add new items as they are discovered
- Prioritize security and critical bugs first

---

**Status Tracking:**

- Total Code Items: ~90
- Code Items Completed: ~70 ✅
- Remaining Code Tasks: ~5
- Remaining Ops Tasks: ~10
- Remaining Manual Testing: ~10

**Last Audit Date:** 2026-04-14 (automated code-level audit)  
**Next Review Date:** Weekly until launch
