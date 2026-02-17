# How to Run TijarahJo Backend and Frontend

## Quick Start (Using Script)

```bash
./run-dev.sh
```

This starts both servers and injects backend environment variables for local development.
`./run-dev.sh` now fails fast if backend/database auth is invalid.
You can define local variables in `.env` using the template at `.env.example`.
The script looks for:
- `DATABASE_CONNECTION_STRING` (or `DB_USER` + `DB_PASSWORD`)
- `JWT_SIGNING_KEY` (uses a local dev default if not set)

---

## One-Command Database Bootstrap + Verification

```bash
./bootstrap_db.sh
```

This script:
- resets Docker SQL volume (`docker compose down -v` + `up -d`)
- recreates `TijarahJoDB`
- builds and applies a consolidated SQL deployment bundle (`database/scripts/bundles/master.sql`, which includes base schema + setup + migrations)
- starts backend on `http://localhost:5033`
- runs `./verify_all_apis.sh`

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
cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://localhost:5033 \
JWT_SIGNING_KEY='LocalDevSigningKey_ChangeMe_ButAtLeast32Chars_123456' \
DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' \
dotnet run --no-launch-profile
```

Backend will run on: **http://localhost:5033**
- Swagger UI: http://localhost:5033/swagger

### Terminal 2 - Frontend (Vite/React)

```bash
cd TijarahJo-frontend
npm run dev
```

Frontend will run on: **http://localhost:5173**

---

## Manual Start (Single Terminal - Background)

### Option 1: Using `&` (Background Process)

```bash
# Start Backend in background
cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI
ASPNETCORE_ENVIRONMENT=Development \
ASPNETCORE_URLS=http://localhost:5033 \
JWT_SIGNING_KEY='LocalDevSigningKey_ChangeMe_ButAtLeast32Chars_123456' \
DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' \
dotnet run --no-launch-profile &

# Start Frontend in background
cd ../../../../TijarahJo-frontend
npm run dev &
```

### Option 2: Using `screen` or `tmux`

```bash
# Using screen
screen -S backend -d -m bash -c "cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI && ASPNETCORE_ENVIRONMENT=Development ASPNETCORE_URLS=http://localhost:5033 JWT_SIGNING_KEY='LocalDevSigningKey_ChangeMe_ButAtLeast32Chars_123456' DATABASE_CONNECTION_STRING='Data Source=localhost,1433;Database=TijarahJoDB;User Id=sa;Password=<your-password>;TrustServerCertificate=True;Encrypt=False;' dotnet run --no-launch-profile"
screen -S frontend -d -m bash -c "cd TijarahJo-frontend && npm run dev"

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
- npm packages installed: `cd TijarahJo-frontend && npm install`

---

## Troubleshooting

### Backend won't start
- Check if SQL Server is running
- Verify `DATABASE_CONNECTION_STRING` and `JWT_SIGNING_KEY` are set
- Check if port 5033 is available
- If using Docker SQL and login fails for `sa`, your persisted volume password may differ from container env:
  - `docker compose down -v`
  - `MSSQL_SA_PASSWORD='<new-strong-password>' docker compose up -d`

### Frontend won't start
- Run `npm install` in the frontend directory
- Check if port 5173 is available
- Verify `VITE_API_BASE_URL` in `.env` file (if exists)

---

## API Regression Checks

Run the full API suite:
```bash
./verify_all_apis.sh
```

Run a quick backend smoke suite (fast sanity checks):
```bash
./TijarahJo-Backend/TijarahJoDBAPI/tests/backend_smoke.sh
```

Run focused post-delete/chat regression:
```bash
./test_delete_post_with_chat.sh
```
