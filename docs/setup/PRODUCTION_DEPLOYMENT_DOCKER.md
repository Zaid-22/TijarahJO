# Production Deployment (Docker Compose)

This project now includes production container assets for backend + frontend + data services:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `infra/nginx/web.conf`
- `infra/docker-compose.production.yml`

This compose stack is a production-style baseline for local or controlled deployments, not a full managed-cloud reference architecture.

## 1. Required Environment Variables

Set at least:

- `MSSQL_SA_PASSWORD` (SQL Server SA password)
- `JWT_SIGNING_KEY` (minimum 32 bytes)

Optional:

- `JWT_ISSUER` (default: `https://your-production-domain.com`)
- `JWT_AUDIENCE` (default: `https://your-production-domain.com`)

## 2. Build and Run

From repo root:

```bash
docker compose -f infra/docker-compose.production.yml up -d --build
```

Services:

- Web app: `http://localhost:8080`
- API: `http://localhost:5033`
- SQL Server: internal compose service `sqlserver`
- Redis: internal compose service `redis`

The web container proxies:

- `/api/*` -> API service
- `/chatHub` -> API SignalR hub
- `/uploads/*` -> API static uploads

Build/runtime notes:

- The web Docker build uses `VITE_API_BASE_URL=/api`
- The API container listens on `5033`
- The API container stores uploaded files under `/var/lib/tijarahjo/uploads`

## 3. Uploaded Files

Uploaded post images are persisted in Docker volume `api_uploads` mounted at:

- `/var/lib/tijarahjo/uploads`

The API serves them from:

- `/uploads/post-images/<filename>`

## 4. Auth and Session Notes

- Runtime auth is cookie-backed JWT authentication
- Session recovery is supported through `/api/auth/refresh`
- `JWT_SIGNING_KEY` must be set before startup
- Compose currently wires the API to SQL Server using the `sa` login via `DATABASE_CONNECTION_STRING`

## 5. Notes

- This compose profile is a production baseline, not a full platform setup (TLS, external managed DB/Redis, backup policy, secrets manager).
- For real production, terminate HTTPS at a trusted edge/load balancer and route to `web` on port `80`.
- Review `docs/backend/OPERATIONS_RUNBOOK.md` before treating this as a deployable operational standard.

**Last Reviewed:** 2026-04-02
