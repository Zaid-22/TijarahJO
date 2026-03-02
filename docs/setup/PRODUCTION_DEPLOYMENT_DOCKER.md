# Production Deployment (Docker Compose)

This project now includes production container assets for backend + frontend + data services:

- `apps/api/Dockerfile`
- `apps/web/Dockerfile`
- `infra/nginx/web.conf`
- `infra/docker-compose.production.yml`

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

The web container proxies:

- `/api/*` -> API service
- `/chatHub` -> API SignalR hub
- `/uploads/*` -> API static uploads

## 3. Uploaded Files

Uploaded post images are persisted in Docker volume `api_uploads` mounted at:

- `/var/lib/tijarahjo/uploads`

The API serves them from:

- `/uploads/post-images/<filename>`

## 4. Notes

- This compose profile is a production baseline, not a full platform setup (TLS, external managed DB/Redis, backup policy, secrets manager).
- For real production, terminate HTTPS at a trusted edge/load balancer and route to `web` on port `80`.
