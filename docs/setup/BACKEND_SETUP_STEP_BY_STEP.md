# Backend Setup - Complete Step-by-Step Guide

Use this guide when you want the current backend setup flow without relying on the older manual SQL instructions.

## Goal

Get the backend running locally and ready for the frontend to connect.

## Recommended Backend Setup

### 1. Install prerequisites

- .NET 8 SDK
- Docker Desktop with `docker compose`
- Optional: SQL Server Management Studio for inspecting the local DB

### 2. Prepare environment

From the repo root:

```bash
cp .env.example .env
```

Fill in at least:

- `MSSQL_SA_PASSWORD`
- `JWT_SIGNING_KEY`
- `DB_APP_PASSWORD`

Optional:

- `DB_RUNTIME_PRINCIPAL`
- `DATABASE_CONNECTION_STRING`
- `GOOGLE_AUTH_*`

### 3. Bootstrap backend + database

Run:

```bash
./scripts/bootstrap_db.sh
```

This handles:

- SQL Server container startup
- database recreation
- schema + migration application
- baseline seeds
- backend startup on `http://localhost:5033`
- API verification

### 4. Verify backend

Check:

- Swagger: `http://localhost:5033/swagger`
- Live health: `http://localhost:5033/health/live`
- Ready health: `http://localhost:5033/health/ready`

### 5. Run backend without re-bootstrapping

If the database is already prepared:

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

## Frontend Connection

If you are running the frontend separately, set:

```env
VITE_API_BASE_URL=http://localhost:5033/api/v1
```

Then start:

```bash
cd apps/web
npm install
npm run dev
```

No mock-mode toggle is required in the current frontend.

## Current Runtime Notes

- Canonical backend base URL is `http://localhost:5033`
- Canonical frontend API base URL is `http://localhost:5033/api/v1`
- Cookie-backed JWT auth is used
- Session recovery uses `POST /api/v1/auth/refresh` and `GET /api/v1/auth/me`
- Signed-in hard refresh should restore account state without a temporary logged-out header flash

## Troubleshooting

### Backend does not start

Check:

- `.env` exists and has real values
- `JWT_SIGNING_KEY` is set
- database credentials are valid
- port `5033` is free

### Bootstrap fails

Try:

```bash
./scripts/bootstrap_db.sh --no-volume-reset
```

If Docker SQL credentials are stale:

```bash
docker compose -f infra/docker-compose.yml down -v
./scripts/bootstrap_db.sh
```

### Swagger does not load

Check backend logs and verify:

- `ASPNETCORE_URLS=http://localhost:5033`
- the backend process is still running
- `http://localhost:5033/health/live` responds

## Related Docs

- `README-RUN.md`
- `docs/setup/SETUP_NEW_COMPUTER_GUIDE.md`
- `docs/setup/DATABASE_SETUP_CHECKLIST.md`
- `apps/api/src/Api/ENVIRONMENT_VARIABLES.md`

**Last Updated:** 2026-04-14
