# TijarahJo - Setup Guide for New Computer

Use this guide when onboarding the project onto a fresh machine.

## Recommended Path

The current repo workflow is:

1. Configure local secrets in the repo root `.env`
2. Bootstrap the database with `./scripts/bootstrap_db.sh`
3. Start backend + frontend with `./scripts/run-dev.sh`

This is the preferred path over older manual SQL or Visual Studio-only setup flows.

## Prerequisites

Install these first:

1. .NET 8 SDK
2. Node.js 18+ and npm
3. Docker Desktop with `docker compose`
4. Git
5. Optional: SQL Server Management Studio for manual DB inspection

## Step 1: Prepare Local Environment

From the repo root:

```bash
cp .env.example .env
```

Update `.env` with real values for at least:

- `MSSQL_SA_PASSWORD`
- `JWT_SIGNING_KEY`
- `DB_APP_PASSWORD`

Important notes:

- `DB_RUNTIME_PRINCIPAL=app` is the default and requires `DB_APP_PASSWORD`
- `VITE_API_BASE_URL` should normally stay `http://localhost:5033/api/v1`
- `GOOGLE_AUTH_*` values are optional for local setup

Reference templates:

- `.env.example`
- `docs/setup/ENV_TEMPLATE.txt`
- `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

## Step 2: Bootstrap the Database

Run:

```bash
./scripts/bootstrap_db.sh
```

What this does:

- starts SQL Server in Docker
- recreates `TijarahJoDB`
- applies canonical schema + ordered migrations
- applies baseline seed data
- starts the backend on `http://localhost:5033`
- runs API verification unless disabled

Useful options:

```bash
./scripts/bootstrap_db.sh --no-volume-reset
./scripts/bootstrap_db.sh --no-verify
./scripts/bootstrap_db.sh --keep-backend
./scripts/bootstrap_db.sh --with-dev-seeds
```

If you need a deeper DB checklist, use:

- `docs/setup/DATABASE_SETUP_CHECKLIST.md`

## Step 3: Start the App

Run:

```bash
./scripts/run-dev.sh
```

This script:

- loads `.env` automatically
- validates backend/database auth config before startup
- starts the backend on `http://localhost:5033`
- starts the frontend on `http://localhost:5173`

Default local URLs:

- Backend API: `http://localhost:5033`
- Swagger: `http://localhost:5033/swagger`
- Frontend: `http://localhost:5173`

## Step 4: Verify Everything

Check these:

- Swagger loads at `http://localhost:5033/swagger`
- Frontend loads at `http://localhost:5173`
- Categories/posts load in the UI
- Login/signup works
- Signed-in refresh keeps the page visible and restores account state cleanly

## Manual Fallback

Use this only if you are troubleshooting or intentionally avoiding the scripts.

### Backend only

```bash
cd apps/api/src/Api
dotnet restore
dotnet build
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://localhost:5033 \
JWT_SIGNING_KEY='<your-jwt-signing-key>' \
DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' \
dotnet run --no-launch-profile
```

### Frontend only

Create `apps/web/.env` if needed:

```env
VITE_API_BASE_URL=http://localhost:5033/api/v1
```

Then run:

```bash
cd apps/web
npm install
npm run dev
```

## Troubleshooting

### `JWT_SIGNING_KEY is not configured`

Set `JWT_SIGNING_KEY` in `.env` or your shell before running the scripts.

### `DB_APP_PASSWORD must be set when DB_RUNTIME_PRINCIPAL=app`

Set `DB_APP_PASSWORD` in `.env`, or switch to `DB_RUNTIME_PRINCIPAL=sa` only if you intentionally want that runtime mode.

### SQL login/auth failure during bootstrap

Try a clean Docker reset:

```bash
docker compose -f infra/docker-compose.yml down -v
```

Then update `.env` and rerun:

```bash
./scripts/bootstrap_db.sh
```

### Frontend cannot connect to API

Check:

- backend is running on `http://localhost:5033`
- `VITE_API_BASE_URL=http://localhost:5033/api/v1`
- browser console for CORS or network errors

## Related Docs

- `README-RUN.md`
- `docs/setup/QUICK_SETUP_CHECKLIST.md`
- `docs/setup/DATABASE_SETUP_CHECKLIST.md`
- `docs/setup/BACKEND_SETUP_STEP_BY_STEP.md`
- `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

**Last Updated:** 2026-04-02
**Version:** 2.0
