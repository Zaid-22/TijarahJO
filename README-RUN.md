# How to Run TijarahJo Backend and Frontend

## Quick Start (Using Script)

```bash
./run-dev.sh
```

This will start both servers automatically.

---

## Manual Start (Two Terminal Windows)

### Terminal 1 - Backend (ASP.NET Core)

```bash
cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI
dotnet run
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
dotnet run &

# Start Frontend in background
cd ../../../../TijarahJo-frontend
npm run dev &
```

### Option 2: Using `screen` or `tmux`

```bash
# Using screen
screen -S backend -d -m bash -c "cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI && dotnet run"
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

### Frontend
- Node.js (v18 or higher)
- npm packages installed: `cd TijarahJo-frontend && npm install`

---

## Troubleshooting

### Backend won't start
- Check if SQL Server is running
- Verify database connection string in `appsettings.json`
- Check if port 5033 is available

### Frontend won't start
- Run `npm install` in the frontend directory
- Check if port 5173 is available
- Verify `VITE_API_BASE_URL` in `.env` file (if exists)

