# Infrastructure

Infrastructure assets (Docker Compose files, environment templates, deployment helpers) live here.

## Files

- `docker-compose.yml`: local data services (SQL Server + Redis)
- `docker-compose.production.yml`: production-style stack (web + api + SQL + Redis)
- `nginx/web.conf`: web reverse-proxy config for API, SignalR, and uploads
