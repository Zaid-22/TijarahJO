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
- `DB_APP_LOGIN` (runtime SQL login, for example `tijarahjo_app`)
- `DB_APP_PASSWORD` (runtime SQL login password)
- `JWT_SIGNING_KEY` (minimum 32 bytes)
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `FRONTEND_URL`
- `CORS_ALLOWED_ORIGINS`
- `ALLOWED_HOSTS`
- `TwoFactor__SecretEncryptionKey`
- `TwoFactor__ChallengeSigningKey`
- `EmailVerification__Enabled=true`
- `EmailVerification__ResendApiKey`
- `EmailVerification__FromAddress`

For an existing installation, add these `EmailVerification__*` settings to the
ignored `_on_server/.env` before the first deployment of this release. A
`git pull` updates only `.env.example`; it does not update the live secrets
file. Use a live Resend key and a verified sender, then run
`./_on_server/apply.sh` before `deploy`. Production startup fails closed when
email-verification delivery is missing or still contains a placeholder.

Set these when the related feature is enabled:

- `GCP_VISION_CREDENTIALS_FILE` — absolute host path to a Google Cloud service account JSON key with Cloud Vision API access (required for image uploads: chat, posts, avatars). The API container receives it as `GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/gcp-vision.json`.
- `Gemini__ApiKey` when `FeatureFlags__EnableAiComparison=true`
- `YouTube__ApiKey` for YouTube recommendations
- `PasswordResetEmail__ResendApiKey` when password reset email is enabled
- `EmailTwoFactor__ResendApiKey` when email 2FA is enabled

Provision the app database login before starting the API container. Use
`bootstrap_db.sh --sql-only` only for the first installation; it recreates the
database. Existing installations must use the forward-only deployment command.

## 2. Build and Run

From repo root (after `./_on_server/apply.sh` so `infra/.env` exists):

```bash
chmod +x scripts/compose-production.sh
chmod +x scripts/migrate-production-db.sh
./scripts/compose-production.sh deploy
```

The `deploy` command is the routine release entrypoint. It first builds the API
and web images, starts SQL Server and Redis, applies only pending migrations
after a verified backup, and then updates the application services without
rebuilding. A failed image build therefore leaves the database untouched.

For an intentional first installation with an empty environment:

```bash
./scripts/bootstrap_db.sh --sql-only --no-verify
./scripts/compose-production.sh deploy
```

Never run `bootstrap_db.sh` against an existing production database.

Do **not** pass `--project-directory .` — it breaks build `context: ..` (`lstat /opt/apps`).

Services:

- Web app: `http://localhost:8080`
- API: `http://localhost:5033`
- SQL Server: internal compose service `sqlserver`
- Redis: internal compose service `redis`

The web container proxies:

- `/api/v1/*` -> API service
- `/chatHub` -> API SignalR hub
- `/uploads/*` -> API static uploads

Build/runtime notes:

- The web Docker build uses `VITE_API_BASE_URL=/api`
- For standalone frontend builds, set `VITE_API_BASE_URL=https://tijarahjo.online/api/v1`
- The API container listens on `5033`
- The API container stores uploaded files under `/var/lib/tijarahjo/uploads`
- SQL Server is not published on host port `1433`; administer it with `docker exec` or an explicitly secured tunnel.
- The wrapper creates `EDGE_NETWORK_NAME` (default `edge`). Attach the reverse proxy to the same Docker network.

## 3. Uploaded Files

Uploaded post images are persisted in Docker volume `api_uploads` mounted at:

- `/var/lib/tijarahjo/uploads`

The API serves them from:

- `/uploads/post-images/<filename>`

Private chat and report evidence is persisted separately in
`api_private_uploads`, mounted at `/var/lib/tijarahjo/private-uploads`. It is not
served as a public static-file root.

## 4. Database Migrations

`scripts/migrate-production-db.sh` reads `dbo.SchemaMigrations`, recognizes both
historical filename forms (with and without `.sql`), and applies only pending
files in lexical order. Before changing the schema it writes and verifies a
copy-only backup under `/var/opt/mssql/backups` in the persistent SQL volume.
Copy these backups off-host according to the production retention policy.

Use `./scripts/migrate-production-db.sh --check` to list pending migrations.
`--skip-backup` is available only for an explicitly managed backup window.

## 5. Auth and Session Notes

- Runtime auth is cookie-backed JWT authentication
- Session recovery is supported through `/api/v1/auth/refresh`
- `JWT_SIGNING_KEY` must be set before startup
- Compose wires the API to SQL Server using the least-privilege app login via `DATABASE_CONNECTION_STRING`; `sa` is only for SQL Server bootstrap/provisioning.

## 6. Notes

- This compose profile is a production baseline, not a full platform setup (TLS, external managed DB/Redis, backup policy, secrets manager).
- AI comparison sends listing name, price, category, description, city, and view metadata to Gemini when `FeatureFlags__EnableAiComparison=true` and `Gemini__ApiKey` is configured.
- For real production, terminate HTTPS at a trusted edge/load balancer and route to `web` on port `80`.
- Review `docs/backend/OPERATIONS_RUNBOOK.md` before treating this as a deployable operational standard.

**Last Reviewed:** 2026-05-22
