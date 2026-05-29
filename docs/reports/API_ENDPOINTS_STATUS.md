# API Endpoints Status Report

**Base URL:** `http://localhost:5033`
**Reviewed:** 2026-05-30
**Last live verification source:** `./scripts/verify_all_apis.sh` + CI backend checks
**Last live verification date:** 2026-04-21
**Latest static route/docs refresh:** 2026-05-30

## Summary

- Canonical API version is exposed under:
  - `/api/v1/*`
- The frontend Docker build may use `VITE_API_BASE_URL=/api`; the frontend runtime normalizes that to `/api/v1`.
- Legacy `Tb*` route namespaces are **not** part of the active runtime API.
- Legacy `/All` and `/pagination` post routes are **removed** from canonical API.

---

## Canonical Route Groups

### Auth (`/api/v1/auth`)

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/logout` (`[Authorize]`)
- `GET /api/v1/auth/me` (`[Authorize]`)
- `POST /api/v1/auth/refresh` (`[Authorize]`)
- `GET /api/v1/auth/google/start`
- `GET /api/v1/auth/google/callback`

### Two-Factor Authentication (`/api/v1/auth/2fa`)

- `POST /api/v1/auth/2fa/verify-login` — verify 2FA code during login challenge
- `GET /api/v1/auth/2fa/status` (`[Authorize]`) — check 2FA status
- `POST /api/v1/auth/2fa/setup/start` (`[Authorize]`) — initiate 2FA setup (sends email code)
- `POST /api/v1/auth/2fa/setup/confirm` (`[Authorize]`) — confirm setup with verification code
- `POST /api/v1/auth/2fa/disable` (`[Authorize]`) — disable 2FA (requires verification code)

### Password Reset (`/api/v1/auth/forgot-password`)

- `POST /api/v1/auth/forgot-password/request` — request reset code via email
- `POST /api/v1/auth/forgot-password/verify` — verify reset code before collecting a new password
- `POST /api/v1/auth/forgot-password/confirm` — verify code again and set new password

### Users (`/api/v1/users`)

- `GET /api/v1/users` (admin only)
- `GET /api/v1/users/{id}`
- `POST /api/v1/users` (admin only)
- `PUT /api/v1/users/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/v1/users/{id}` (`[Authorize]`, ownership/admin enforced)
- `GET /api/v1/users/{id}/exists` (`[Authorize]`)

### Posts (`/api/v1/posts`)

- `GET /api/v1/posts/feed`
- `GET /api/v1/posts/{id}`
- `GET /api/v1/posts/Exists/{id}`
- `POST /api/v1/posts/{id}/views`
- `GET /api/v1/posts/user/{userId}`
- `GET /api/v1/posts/category/{categoryId}`
- `POST /api/v1/posts` (`[Authorize]`)
- `PUT /api/v1/posts/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/v1/posts/{id}` (`[Authorize]`, ownership/admin enforced)
- `PATCH /api/v1/posts/{id}/status` (`[Authorize]`, ownership/admin enforced)

### Post Images (`/api/v1/post-images`)

- `GET /api/v1/post-images`
- `GET /api/v1/post-images/{id}`
- `GET /api/v1/post-images/post/{postId}`
- `GET /api/v1/post-images/Exists/{id}`
- `POST /api/v1/post-images` (`[Authorize]`)
- `PUT /api/v1/post-images/{id}` (`[Authorize]`, ownership/admin enforced)
- `DELETE /api/v1/post-images/{id}` (`[Authorize]`, ownership/admin enforced)
- `POST /api/v1/post-images/upload` (`[Authorize]`, multipart file upload)

### Categories (`/api/v1/categories`)

- `GET /api/v1/categories`
- `GET /api/v1/categories/{id}`
- `GET /api/v1/categories/Exists/{id}`
- `POST /api/v1/categories` (admin only)
- `PUT /api/v1/categories/{id}` (admin only)
- `DELETE /api/v1/categories/{id}` (admin only)

### Roles (`/api/v1/roles`)

- `GET /api/v1/roles`
- `GET /api/v1/roles/{id}`
- `GET /api/v1/roles/Exists/{id}`
- `POST /api/v1/roles` (admin only)
- `PUT /api/v1/roles/{id}` (admin only)
- `DELETE /api/v1/roles/{id}` (admin only)

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

### Search (`/api/v1/search`)

- `GET /api/v1/search`

### Compare (`/api/v1/compare`)

- `POST /api/v1/compare` (`[Authorize]`, supports optional `Language` payload parameter)
- `POST /api/v1/compare/videos` (`[Authorize]`, YouTube video recommendations for compared posts)

### Sellers (`/api/v1/sellers`)

- `GET /api/v1/sellers/{sellerId}`
- `GET /api/v1/sellers/top`

### Reviews (`/api/v1/reviews`)

- `GET /api/v1/reviews/user/{userId}`
- `POST /api/v1/reviews` (`[Authorize]`)

### Post Comments (`/api/v1/posts/{postId}/comments`)

- `GET /api/v1/posts/{postId}/comments`
- `GET /api/v1/posts/{postId}/comments/{commentId}/replies`
- `POST /api/v1/posts/{postId}/comments` (`[Authorize]`)
- `PUT /api/v1/posts/{postId}/comments/{commentId}` (`[Authorize]`, ownership enforced)
- `DELETE /api/v1/posts/{postId}/comments/{commentId}` (`[Authorize]`, ownership/admin enforced)

### Reports (`/api/v1/reports`)

- `POST /api/v1/reports` (`[Authorize]`) — submit abuse/content report

### Banners (`/api/v1/banners`)

- `GET /api/v1/banners` — list active hero banners (public)

### Notifications (`/api/v1/notifications`)

- `GET /api/v1/notifications` (`[Authorize]`)
- `GET /api/v1/notifications/unread-count` (`[Authorize]`)
- `PUT /api/v1/notifications/{notificationId}/read` (`[Authorize]`)
- `PUT /api/v1/notifications/read-all` (`[Authorize]`)

### Locations

- `GET /api/v1/cities` — list available cities
- `GET /api/v1/cities/{cityId}/areas` — list areas for a city

### Admin (`/api/v1/admin`)

#### Dashboard & Analytics
- `GET /api/v1/admin/dashboard/stats` — KPI summary
- `GET /api/v1/admin/analytics` — analytics overview

#### User Management
- `GET /api/v1/admin/users/{id}/details` — user details
- `PUT /api/v1/admin/users/bulk-status` — bulk update user status
- `POST /api/v1/admin/users/{id}/suspend` — suspend user with reason and duration

#### Post Management
- `GET /api/v1/admin/posts` — list all posts
- `PATCH /api/v1/admin/posts/{id}/status` — change post status
- `DELETE /api/v1/admin/posts/{id}` — delete post

#### Post Comments Moderation
- `GET /api/v1/admin/post-comments` — list post comments
- `DELETE /api/v1/admin/post-comments/{id}` — delete comment

#### Reports & Moderation
- `GET /api/v1/admin/reports` — reports queue
- `PUT /api/v1/admin/reports/{id}/status` — update report status

#### Reviews
- `GET /api/v1/admin/reviews` — list reviews
- `DELETE /api/v1/admin/reviews/{id}` — delete review

#### Audit Log
- `GET /api/v1/admin/audit-logs` — list audit entries

#### Permissions & Roles
- `GET /api/v1/admin/permissions` — list permissions
- `GET /api/v1/admin/permissions/role/{roleId}` — get role permissions
- `PUT /api/v1/admin/permissions/role/{roleId}` — update role permissions

#### Settings
- `GET /api/v1/admin/settings` — system settings
- `PUT /api/v1/admin/settings/{key}` — update setting by key

#### Search
- `GET /api/v1/admin/search` — search users and posts

#### Locations (Admin)
- `GET /api/v1/admin/locations/cities` — list cities
- `POST /api/v1/admin/locations/cities` — create city
- `PUT /api/v1/admin/locations/cities/{id}` — update city
- `DELETE /api/v1/admin/locations/cities/{id}` — delete city
- `POST /api/v1/admin/locations/areas` — create area
- `PUT /api/v1/admin/locations/areas/{id}` — update area
- `DELETE /api/v1/admin/locations/areas/{id}` — delete area

#### Banners
- `GET /api/v1/admin/banners` — list banners
- `POST /api/v1/admin/banners` — create banner
- `PUT /api/v1/admin/banners/{id}` — update banner
- `DELETE /api/v1/admin/banners/{id}` — delete banner
- `PATCH /api/v1/admin/banners/{id}/toggle` — toggle banner active status
- `POST /api/v1/admin/banners/upload-image` — upload banner image

#### Data Hygiene
- `GET /api/v1/admin/data-hygiene/report` — data hygiene report
- `GET /api/v1/admin/data-hygiene/history` — cleanup history
- `POST /api/v1/admin/data-hygiene/scan` — trigger scan
- `POST /api/v1/admin/data-hygiene/approve/{cycleId}` — approve cleanup cycle

#### Image Optimization
- `POST /api/v1/admin/images/optimize-existing` — optimize existing images

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
