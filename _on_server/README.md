# VPS deploy staging (`_on_server/`)

Keep **production-only** files here, then copy them into the repo root before deploy.

## Files

| Staged file | Copied to | Purpose |
|-------------|-----------|---------|
| `.env` | `/.env` (repo root) | Docker Compose + `bootstrap_db.sh` environment |

`apply.sh` also links `infra/.env` → `.env` so Compose loads secrets without extra flags.

Add more rows here if you later stage nginx overrides or other host-specific files.

## Workflow

### 1. Edit secrets (once)

```bash
cd _on_server
cp .env.example .env   # first time only
# edit .env — production URLs, strong passwords, API keys
```

`.env` is **gitignored**. Never commit it.

### 2. Apply to project root

**On Linux / VPS:**

```bash
chmod +x _on_server/apply.sh scripts/compose-production.sh
./_on_server/apply.sh
```

**On Windows:**

```powershell
.\_on_server\apply.ps1
```

### 3. Deploy (from repo root)

```bash
./scripts/bootstrap_db.sh --sql-only --with-sample-posts   # first time only (no dotnet on VPS)
./scripts/compose-production.sh up -d --build
```

Equivalent manual form:

```bash
set -a && source .env && set +a
docker compose -f infra/docker-compose.production.yml up -d --build
```

See `docs/setup/PRODUCTION_DEPLOYMENT_DOCKER.md` for TLS and full steps.

## On the VPS

```bash
cd /opt/tijarahjo   # or /var/www/tijarahjo
git pull
./_on_server/apply.sh
./scripts/compose-production.sh up -d --build
```

Alternatively, copy only `_on_server/.env` with `scp` and rename to `.env` at repo root, then run `apply.sh` once to refresh `infra/.env`.

## Before go-live

- [ ] Strong `MSSQL_SA_PASSWORD`, `DB_APP_PASSWORD`, `REDIS_PASSWORD`
- [ ] Unique `JWT_SIGNING_KEY` and both `TwoFactor__*` keys (`openssl rand -base64 48`)
- [ ] Google OAuth redirect URIs include `https://tijarahjo.online/...`
- [ ] `GCP_VISION_CREDENTIALS_FILE` points to a service account JSON on the host and Cloud Vision API is enabled (chat/post image uploads fail with 503 otherwise)
- [ ] Resend sender domain verified if using custom `FromAddress`
- [ ] Quote any `.env` value that contains spaces (e.g. `FromName="TijarahJo Security"`)
- [ ] `ALLOWED_HOSTS` uses **semicolons** (`tijarahjo.online;www.tijarahjo.online`), not commas — commas cause every API request to return 400 Invalid Hostname

## TLS certificate (first time)

Webroot certbot fails if **nothing listens on port 80**. Use **standalone** mode first:

```bash
docker run -it --rm -p 80:80 \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d tijarahjo.online -d www.tijarahjo.online \
  --email YOUR_REAL_EMAIL --agree-tos --no-eff-email
```

Requirements: DNS A records for `@` and `www` must point to this VPS, and port 80 must be open (`ufw allow 80/tcp`).

After certs exist under `/etc/letsencrypt/live/tijarahjo.online/`, start the production stack.

## Troubleshooting

### `lstat /opt/apps: no such file or directory`

You used `--project-directory .` with this compose file. Build `context: ..` is then resolved from repo root to `/opt`, not `/opt/tijarahjo`.

**Do not** use `--project-directory`. Use `./scripts/compose-production.sh` or `source .env` + `docker compose -f infra/docker-compose.production.yml`.

### `tijarahjo-db is unhealthy` — SA password mismatch

Logs show:

```text
Login failed for user 'sa'. Reason: Password did not match...
```

SQL Server sets the **SA password only on first volume creation**. Changing `MSSQL_SA_PASSWORD` in `.env` later does **not** update the existing database — the health check then fails forever.

**Option A — restore the original password (keeps data):**

Set `MSSQL_SA_PASSWORD` in `.env` to the password used when you first ran `bootstrap_db.sh`, then:

```bash
cd /opt/tijarahjo
./_on_server/apply.sh
./scripts/compose-production.sh up -d
```

Test which password works:

```bash
set -a && source .env && set +a
docker exec tijarahjo-db /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -Q "SELECT 1"
```

**Option B — reset database (fresh VPS / no data to keep):**

```bash
cd /opt/tijarahjo
nano .env   # set a strong MSSQL_SA_PASSWORD (e.g. TijarahJo_Sa2026!)
./_on_server/apply.sh
./scripts/compose-production.sh down
docker volume rm infra_mssql_data
./scripts/bootstrap_db.sh --sql-only --with-sample-posts
./scripts/compose-production.sh up -d --build
```

### API requests return 429 Too Many Requests

The API rate-limits by client IP (240 requests/minute). Behind Docker/nginx, if the real client IP is not read correctly, **all visitors share one bucket** and the site quickly returns 429. Chrome DevTools may label these as `(from service worker)` because the PWA service worker used to intercept `/api/...` routes.

**Immediate workaround (no code deploy):** add to `.env` and recreate the API container:

```bash
FeatureFlags__EnableRateLimiting=false
```

```bash
./_on_server/apply.sh
./scripts/compose-production.sh up -d api
```

**Permanent fix:** pull the latest code (per-client IP resolution + no API caching in the service worker), rebuild, and redeploy:

```bash
git pull
./_on_server/apply.sh
./scripts/compose-production.sh up -d --build api web
```

After redeploying the web container, hard-refresh the browser (or unregister the old service worker in DevTools → Application → Service Workers) so the updated SW stops intercepting API calls.

### Always run compose from repo root

Run from `/opt/tijarahjo`, not `infra/`. Use the wrapper or `source .env` — **never** `--project-directory .`:

```bash
cd /opt/tijarahjo
./scripts/compose-production.sh up -d
./scripts/compose-production.sh logs sqlserver --tail 50
```

### `GCP_VISION_CREDENTIALS_FILE is missing a value`

Compose reads `.env` from `infra/` by default. Run `./_on_server/apply.sh` to symlink `infra/.env` → `.env`, or `source .env` before compose.

Also ensure the key file exists on the host:

```bash
ls -la /opt/tijarahjo/secrets/gcp-vision-sa.json
```
