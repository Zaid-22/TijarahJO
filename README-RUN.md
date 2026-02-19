# How to Run TijarahJo Backend and Frontend

## Quick Start (Using Script)

```bash
./scripts/check_structure.sh
./scripts/run-dev.sh
```

This starts both servers and injects backend environment variables for local development.
`./scripts/run-dev.sh` now fails fast if backend/database auth is invalid.
You can define local variables in `.env` using the template at `.env.example`.
The script looks for:
- `DATABASE_CONNECTION_STRING` (or `DB_USER` + `DB_PASSWORD`)
- `JWT_SIGNING_KEY` (required)

---

## One-Command Database Bootstrap + Verification

```bash
./scripts/bootstrap_db.sh
```

This script:
- resets Docker SQL volume (`docker compose -f infra/docker-compose.yml down -v` + `up -d`)
- recreates `TijarahJoDB`
- builds and applies a consolidated SQL deployment bundle (`apps/api/database/bundles/master.sql`, which includes base schema + ordered migrations + canonical procedures)
- applies `apps/api/database/bundles/seed_data.sql` (baseline/dev/test seeds)
- starts backend on `http://localhost:5033`
- runs `./scripts/verify_all_apis.sh`

Required environment values for bootstrap:
- `MSSQL_SA_PASSWORD`
- `JWT_SIGNING_KEY`

Useful flags:
- `--no-volume-reset`
- `--no-verify`
- `--keep-backend`

---

## Make Shortcuts

```bash
make help
make bootstrap
make sql-bundles
make sql-audit
make smoke
make backend-integration
make frontend-contract
make contracts-check
make verify
make full-check
make ci-local
```

---

## CI Workflows

- Backend API checks: `.github/workflows/backend-api-checks.yml`
- Frontend quality checks: `.github/workflows/frontend-quality-checks.yml`

---

## Manual Start (Two Terminal Windows)

### Terminal 1 - Backend (ASP.NET Core)

```bash
cd apps/api/src/Api
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://localhost:5033 \
JWT_SIGNING_KEY='<your-jwt-signing-key>' \
DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' \
dotnet run --no-launch-profile
```

Backend will run on: **http://localhost:5033**
- Swagger UI: http://localhost:5033/swagger

### Terminal 2 - Frontend (Vite/React)

```bash
cd apps/web
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## Manual Start (Single Terminal - Background)

### Option 1: Using `&` (Background Process)

```bash
# Start Backend in background
cd apps/api/src/Api
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://localhost:5033 \
JWT_SIGNING_KEY='<your-jwt-signing-key>' \
DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' \
dotnet run --no-launch-profile &

# Start Frontend in background
cd ../../../web
npm run dev &
```

### Option 2: Using `screen` or `tmux`

```bash
# Using screen
screen -S backend -d -m bash -c "cd apps/api/src/Api && ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://localhost:5033 JWT_SIGNING_KEY='<your-jwt-signing-key>' DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' dotnet run --no-launch-profile"
screen -S frontend -d -m bash -c "cd apps/web && npm run dev"

# View running screens
screen -ls

# Attach to a screen
screen -r backend
screen -r frontend
```

---

## Stop Servers

- **If using the script**: Press `Ctrl+C`
- **If running manually**: Press `Ctrl+C` in each terminal
- **If using background processes**: Use `kill` command or find and kill the processes

```bash
# Find and kill dotnet processes
pkill -f "dotnet run"

# Find and kill node/vite processes
pkill -f "vite"
```

---

## Ports

- **Backend API**: http://localhost:5033
- **Frontend**: http://localhost:5173
- **Swagger**: http://localhost:5033/swagger

---

## Prerequisites

### Backend
- .NET 8.0 SDK
- SQL Server (with TijarahJoDB database configured)
- Environment variables for backend:
  - `DATABASE_CONNECTION_STRING`
  - `JWT_SIGNING_KEY`

### Frontend
- Node.js (v18 or higher)
- npm packages installed: `cd apps/web && npm install`

---

## Troubleshooting

### Backend won't start
- Check if SQL Server is running
- Verify `DATABASE_CONNECTION_STRING` and `JWT_SIGNING_KEY` are set
- Check if port 5033 is available
- If using Docker SQL and login fails for `sa`, your persisted volume password may differ from container env:
  - `docker compose -f infra/docker-compose.yml down -v`
  - `MSSQL_SA_PASSWORD='<new-strong-password>' docker compose -f infra/docker-compose.yml up -d`

### Frontend won't start
- Run `npm install` in the frontend directory
- Check if port 5173 is available
- Verify `VITE_API_BASE_URL` in `.env` file (if exists)

---

## API Regression Checks

Run the full API suite:
```bash
./scripts/verify_all_apis.sh
```

Run a quick backend smoke suite (fast sanity checks):
```bash
./apps/api/tests/contracts/backend_smoke.sh
```

Run backend integration contract checks (auth + post lifecycle):
```bash
./apps/api/tests/contracts/backend_integration_contract.sh
```

Run frontend API contract checks (endpoints consumed by frontend):
```bash
./apps/web/tests/frontend_api_contract.sh
```

Run focused post-delete/chat regression:
```bash
./scripts/test_delete_post_with_chat.sh
```
