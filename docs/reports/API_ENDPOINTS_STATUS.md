# API Endpoints Status Report

**Base URL:** `http://localhost:5033`
**Reviewed:** 2026-04-02
**Last live verification source:** `./scripts/verify_all_apis.sh` + CI backend checks
**Last live verification date:** 2026-03-24

## Summary

- Canonical API version is exposed under:
  - `/api/*`
  - `/api/v1/*`
- Legacy `Tb*` route namespaces are **not** part of the active runtime API.
- Legacy `/All` and `/pagination` post routes are **removed** from canonical API.

---

## Canonical Route Groups

### Auth (`/api/auth`)

- `POST /api/auth/login`
- `POST /api/auth/signup`
- `POST /api/auth/logout` (`[Authorize]`)
- `GET /api/auth/me` (`[Authorize]`)
- `POST /api/auth/refresh` (`[Authorize]`)
- `GET /api/auth/google/start`
- `GET /api/v1/auth/google/callback`

### Two-Factor Authentication (`/api/v1/auth/2fa`)

- `POST /api/v1/auth/2fa/verify-login` — verify 2FA code during login challenge
- `GET /api/v1/auth/2fa/status` (`[Authorize]`) — check 2FA status
- `POST /api/v1/auth/2fa/setup/start` (`[Authorize]`) — initiate 2FA setup (sends email code)
- `POST /api/v1/auth/2fa/setup/confirm` (`[Authorize]`) — confirm setup with verification code
- `POST /api/v1/auth/2fa/disable` (`[Authorize]`) — disable 2FA (requires verification code)

### Password Reset (`/api/v1/auth/forgot-password`)

- `POST /api/v1/auth/forgot-password/request` — request reset code via email
- `POST /api/v1/auth/forgot-password/confirm` — verify code and set new password

### Users (`/api/users`)

- `GET /api/users` (admin only)
- `GET /api/users/{id}`
- `POST /api/users` (admin only)
- `PUT /api/users/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/users/{id}` (`[Authorize]`, ownership/admin enforced)
- `GET /api/users/{id}/exists` (`[Authorize]`)

### Posts (`/api/posts`)

- `GET /api/posts/feed`
- `GET /api/posts/{id}`
- `GET /api/posts/Exists/{id}`
- `POST /api/posts/{id}/views`
- `GET /api/posts/user/{userId}`
- `GET /api/posts/category/{categoryId}`
- `POST /api/posts` (`[Authorize]`)
- `PUT /api/posts/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/posts/{id}` (`[Authorize]`, ownership/admin enforced)
- `PATCH /api/posts/{id}/status` (`[Authorize]`, ownership/admin enforced)

### Post Images (`/api/post-images`)

- `GET /api/post-images`
- `GET /api/post-images/{id}`
- `GET /api/post-images/post/{postId}`
- `GET /api/post-images/Exists/{id}`
- `POST /api/post-images` (`[Authorize]`)
- `PUT /api/post-images/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/post-images/{id}` (`[Authorize]`, ownership/admin enforced)
- `POST /api/post-images/upload` (`[Authorize]`, multipart file upload)

### Categories (`/api/categories`)

- `GET /api/categories`
- `GET /api/categories/{id}`
- `GET /api/categories/Exists/{id}`
- `POST /api/categories` (admin only)
- `PUT /api/categories/{id}` (admin only)
- `DELETE /api/categories/{id}` (admin only)

### Roles (`/api/roles`)

- `GET /api/roles`
- `GET /api/roles/{id}`
- `GET /api/roles/Exists/{id}`
- `POST /api/roles` (admin only)
- `PUT /api/roles/{id}` (admin only)
- `DELETE /api/roles/{id}` (admin only)

### Favorites (`/api/v1/favorites`)

- `GET /api/v1/favorites` (`[Authorize]`)
- `POST /api/v1/favorites` (`[Authorize]`)
- `DELETE /api/v1/favorites/{postId}` (`[Authorize]`)

### Chat (`/api/v1/chat`)

- `GET /api/v1/chat/recent` (`[Authorize]`)
- `GET /api/v1/chat/history/{otherUserId}` (`[Authorize]`)
- `GET /api/v1/chat/presence/{otherUserId}` (`[Authorize]`)
- `POST /api/v1/chat/send` (`[Authorize]`)
- `POST /api/v1/chat/upload-image` (`[Authorize]`, multipart file upload)
- Realtime hub: `/chatHub`

### Search (`/api/search`)

- `GET /api/search`

### Compare (`/api/v1/compare`)

- `POST /api/v1/compare` (`[Authorize]`, supports optional `Language` payload parameter)

### Sellers (`/api/sellers`)

- `GET /api/sellers/{sellerId}`
- `GET /api/sellers/top`

### Reviews (`/api/v1/reviews`)

- `GET /api/v1/reviews/user/{userId}`
- `POST /api/v1/reviews` (`[Authorize]`)

### Notifications (`/api/v1/notifications`)

- `GET /api/v1/notifications` (`[Authorize]`)
- `GET /api/v1/notifications/unread-count` (`[Authorize]`)
- `PUT /api/v1/notifications/{notificationId}/read` (`[Authorize]`)
- `PUT /api/v1/notifications/read-all` (`[Authorize]`)
- `GET /api/v1/notifications/push-config` (`[AllowAnonymous]`)
- `POST /api/v1/notifications/push-subscriptions` (`[Authorize]`)
- `DELETE /api/v1/notifications/push-subscriptions` (`[Authorize]`)

### Locations (`/api/v1/locations`)

- `GET /api/v1/locations` — list available locations
- `GET /api/v1/locations/{id}` — get location details

### Admin (`/api/v1/admin`)

#### Dashboard & Analytics
- `GET /api/v1/admin/dashboard` — KPI summary
- `GET /api/v1/admin/analytics/overview` — analytics overview
- `GET /api/v1/admin/analytics/revenue` — revenue metrics
- `GET /api/v1/admin/analytics/users` — user growth
- `GET /api/v1/admin/analytics/posts` — post activity

#### User Management
- `GET /api/v1/admin/users` — list all users
- `GET /api/v1/admin/users/{id}` — user details
- `PUT /api/v1/admin/users/{id}/status` — block/unblock user
- `PUT /api/v1/admin/users/{id}/role` — change user role
- `DELETE /api/v1/admin/users/{id}` — delete user

#### Post Management
- `GET /api/v1/admin/posts` — list all posts
- `PUT /api/v1/admin/posts/{id}/status` — change post status
- `DELETE /api/v1/admin/posts/{id}` — delete post

#### Reports & Moderation
- `GET /api/v1/admin/reports` — reports queue
- `PUT /api/v1/admin/reports/{id}/resolve` — resolve report

#### Conversations
- `GET /api/v1/admin/conversations` — list conversations

#### Reviews
- `GET /api/v1/admin/reviews` — list reviews
- `DELETE /api/v1/admin/reviews/{id}` — delete review

#### Fraud Detection
- `GET /api/v1/admin/fraud/suspicious-users` — flagged users
- `GET /api/v1/admin/fraud/suspicious-posts` — flagged posts

#### Audit Log
- `GET /api/v1/admin/audit-log` — list audit entries

#### Permissions & Roles
- `GET /api/v1/admin/permissions` — list permissions
- `PUT /api/v1/admin/permissions/{id}` — update permission

#### Settings
- `GET /api/v1/admin/settings` — system settings
- `PUT /api/v1/admin/settings` — update settings

#### Search
- `GET /api/v1/admin/search/users` — search users
- `GET /api/v1/admin/search/posts` — search posts

#### Locations (Admin)
- `GET /api/v1/admin/locations` — manage locations
- `POST /api/v1/admin/locations` — create location
- `PUT /api/v1/admin/locations/{id}` — update location
- `DELETE /api/v1/admin/locations/{id}` — delete location

### Health (`/health`)

- `GET /health/live` — process liveness
- `GET /health/ready` — dependency readiness (database connectivity)

---

## Notes

- All admin endpoints require `[Authorize]` with admin role.
- Authentication failures (`401/403`) on protected routes are expected behavior without valid credentials.
- For full behavior coverage, use:
  - `./scripts/verify_all_apis.sh`
  - `./apps/api/tests/contracts/backend_smoke.sh`
  - `./apps/api/tests/contracts/backend_integration_contract.sh`
