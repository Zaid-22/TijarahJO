# TijarahJo - Setup Guide for New Computer

This guide will help you set up the TijarahJo project on a new computer, including the database.

---

## 📋 Prerequisites

### Required Software

1. **.NET 8.0 SDK**
   - Download: https://dotnet.microsoft.com/download/dotnet/8.0
   - Verify: `dotnet --version` (should show 8.0.x)

2. **SQL Server**
   - SQL Server Express or Full Version
   - Download: https://www.microsoft.com/sql-server/sql-server-downloads
   - **OR** SQL Server LocalDB (included with Visual Studio)
   - Verify: Connect using SQL Server Management Studio (SSMS)

3. **Node.js 16+ and npm**
   - Download: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

4. **Git** (optional, if cloning from repository)
   - Download: https://git-scm.com/

5. **Code Editor** (optional)
   - Visual Studio Code: https://code.visualstudio.com/
   - Visual Studio 2022: https://visualstudio.microsoft.com/

---

## 🗄️ Database Setup

### Step 1: Install SQL Server

1. Install SQL Server (Express or Full version)
2. During installation, note:
   - **Server Name**: Usually `localhost` or `localhost\SQLEXPRESS`
   - **Authentication Mode**: Choose "Mixed Mode" (SQL Server + Windows Authentication)
   - **SA Password**: Set a strong password (you'll need this)

### Step 2: Restore Database

You have two options:

#### Option A: Restore from Backup File (Recommended)

1. Copy the backup file to the new computer:
   - Location: `TijarahJo-Backend/Database Backup/TijarahJoDB.bak`

2. Open SQL Server Management Studio (SSMS)

3. Connect to your SQL Server instance

4. Right-click on "Databases" → "Restore Database"

5. Select "Device" → Browse → Add the `.bak` file

6. Click "OK" to restore

7. Verify the database `TijarahJoDB` appears in the database list

#### Option B: Create Database from Scripts

1. Open SQL Server Management Studio (SSMS)

2. Connect to your SQL Server instance

3. Create a new database:
   ```sql
   CREATE DATABASE TijarahJoDB;
   GO
   ```

4. Preferred: run the canonical bootstrap flow:
   - From repo root run: `./bootstrap_db.sh`
   - This applies setup + migrations in the correct order automatically.
   - Manual SQL execution is only needed for troubleshooting.

5. Manual alternative (if not using bootstrap):
   - Navigate to: `TijarahJo-Backend/TijarahJoDBAPI/database/scripts/setup/`
   - Run: `COMPLETE_DATABASE_SETUP.sql`
   - Then apply needed scripts from `database/scripts/migrations/`
   - Note: legacy per-procedure setup scripts were moved to `database/scripts/archive/`

6. (Optional) Add sample data:
   - Run: `database/scripts/seeds/INSERT_SAMPLE_POSTS.sql`
   - Run: `database/scripts/seeds/CREATE_TEST_USER.sql`

### Step 3: Configure Database Connection

The project uses environment variables for database connection. You need to configure:

**Connection String Format:**
```
Data Source=SERVER_NAME;Database=TijarahJoDB;User Id=LOGIN;Password=PASSWORD;TrustServerCertificate=True;
```

**Example:**
```
Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;
```

---

## ⚙️ Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd "TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
```

### Step 2: Configure Database Connection

#### Method 1: Environment Variables (Recommended)

**Windows (Command Prompt):**
```cmd
set DB_HOST=localhost
set DB_NAME=TijarahJoDB
set DB_USER=sa
set DB_PASSWORD=YourPassword123
```

**Windows (PowerShell):**
```powershell
$env:DB_HOST="localhost"
$env:DB_NAME="TijarahJoDB"
$env:DB_USER="sa"
$env:DB_PASSWORD="YourPassword123"
```

**macOS/Linux:**
```bash
export DB_HOST=localhost
export DB_NAME=TijarahJoDB
export DB_USER=sa
export DB_PASSWORD=YourPassword123
```

**OR use full connection string:**
```bash
export DATABASE_CONNECTION_STRING="Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;"
```

#### Method 2: Edit appsettings.Development.json

Edit `TijarahJoDBAPI/appsettings.Development.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=YourPassword123;TrustServerCertificate=True;"
  }
}
```

⚠️ **Security Note:** Never commit passwords to version control!

### Step 3: Configure JWT Settings

Edit `TijarahJoDBAPI/appsettings.Development.json`:

```json
{
  "JWT": {
    "Issuer": "https://localhost",
    "Audience": "https://localhost",
    "Lifetime": 120,
    "SigningKey": "YOUR_SECRET_KEY_HERE_MIN_32_CHARACTERS"
  }
}
```

**Generate a secure key:**
- Use at least 32 characters
- Mix of letters, numbers, and symbols
- Keep it secret!

### Step 4: Restore Dependencies

```bash
dotnet restore
```

### Step 5: Build the Project

```bash
dotnet build
```

### Step 6: Run the Backend

```bash
dotnet run
```

The API should start on:
- HTTP: `http://localhost:5033`
- HTTPS: `https://localhost:7064` (if configured)
- Swagger UI: `http://localhost:5033/swagger`

---

## 🎨 Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd "TijarahJo-frontend"
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure API Base URL

Create a `.env` file in the frontend root directory:

```env
VITE_API_BASE_URL=http://localhost:5033/api
```

**For HTTPS:**
```env
VITE_API_BASE_URL=https://localhost:7064/api
```

### Step 4: Run the Frontend

```bash
npm run dev
```

The frontend should start on: `http://localhost:5173`

---

## ✅ Verification Checklist

### Database
- [ ] SQL Server is installed and running
- [ ] Database `TijarahJoDB` exists
- [ ] Can connect to database using SSMS
- [ ] All stored procedures are created
- [ ] Test data is loaded (optional)

### Backend
- [ ] .NET 8.0 SDK is installed
- [ ] Dependencies restored (`dotnet restore`)
- [ ] Project builds successfully (`dotnet build`)
- [ ] Database connection configured
- [ ] JWT signing key configured
- [ ] Backend runs without errors
- [ ] Swagger UI is accessible
- [ ] Can test an endpoint (e.g., GET /api/categories/All)

### Frontend
- [ ] Node.js and npm are installed
- [ ] Dependencies installed (`npm install`)
- [ ] API base URL configured
- [ ] Frontend runs without errors
- [ ] Can access the application in browser
- [ ] Can see posts/categories (if data exists)

### Integration
- [ ] Frontend can connect to backend API
- [ ] Authentication works (login/signup)
- [ ] Can fetch posts from backend
- [ ] Can create/edit/delete posts
- [ ] Images upload correctly

---

## 🔧 Troubleshooting

### Database Connection Issues

**Problem:** "Cannot connect to database"

**Solutions:**
1. Verify SQL Server is running:
   - Windows: Check Services → SQL Server
   - macOS/Linux: Check SQL Server service status

2. Check connection string:
   - Verify server name (localhost, localhost\SQLEXPRESS, etc.)
   - Verify database name (TijarahJoDB)
   - Verify login and password

3. Check SQL Server authentication:
   - Ensure "SQL Server Authentication" is enabled
   - Verify SA account is enabled

4. Test connection in SSMS first

**Problem:** "Login failed for user"

**Solutions:**
1. Verify login and password are correct
2. Check if SQL Server Authentication is enabled
3. Try Windows Authentication if available

### Backend Issues

**Problem:** "JWT SigningKey is not configured"

**Solution:**
- Set JWT SigningKey in `appsettings.Development.json`
- Or set `JWT_SIGNING_KEY` environment variable

**Problem:** "CORS policy error"

**Solution:**
- Verify frontend URL is in CORS allowed origins
- Check `Program.cs` CORS configuration
- For development, it should allow `http://localhost:5173`

### Frontend Issues

**Problem:** "Cannot connect to API"

**Solutions:**
1. Verify backend is running
2. Check API base URL in `.env` file
3. Verify CORS is configured correctly
4. Check browser console for errors

**Problem:** "Module not found" errors

**Solution:**
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

---

## 🔐 Security Best Practices

### For Development
- Use `appsettings.Development.json` for local settings
- Never commit passwords to Git
- Use strong JWT signing keys

### For Production
- Use environment variables for all sensitive data
- Use strong database passwords
- Use HTTPS
- Configure proper CORS origins
- Use secure JWT signing keys (at least 32 characters)
- Never expose connection strings in code

---

## 📝 Environment Variables Reference

### Backend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | SQL Server hostname | `localhost` |
| `DB_NAME` | Database name | `TijarahJoDB` |
| `DB_USER` | Database login | `sa` |
| `DB_PASSWORD` | Database password | `YourPassword123` |
| `DATABASE_CONNECTION_STRING` | Full connection string | `Data Source=...` |
| `JWT_SIGNING_KEY` | JWT secret key | `YourSecretKey123...` |
| `JWT_ISSUER` | JWT issuer | `https://localhost` |
| `JWT_AUDIENCE` | JWT audience | `https://localhost` |
| `ASPNETCORE_ENVIRONMENT` | Environment | `Development` or `Production` |
| `CORS_AllowedOrigins` | Allowed CORS origins | `http://localhost:5173` |

### Frontend Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5033/api` |

---

## 🚀 Quick Start Script

### Windows (PowerShell)

Create `setup.ps1`:

```powershell
# Set environment variables
$env:DB_HOST="localhost"
$env:DB_NAME="TijarahJoDB"
$env:DB_USER="sa"
$env:DB_PASSWORD="YourPassword123"
$env:JWT_SIGNING_KEY="YourSecretKeyHere12345678901234567890"

# Backend
cd "TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
dotnet restore
dotnet build
Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run"

# Frontend
cd "../../../TijarahJo-frontend"
npm install
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
```

### macOS/Linux

Create `setup.sh`:

```bash
#!/bin/bash

# Set environment variables
export DB_HOST=localhost
export DB_NAME=TijarahJoDB
export DB_USER=sa
export DB_PASSWORD=YourPassword123
export JWT_SIGNING_KEY=YourSecretKeyHere12345678901234567890

# Backend
cd "TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI"
dotnet restore
dotnet build
dotnet run &

# Frontend
cd "../../../TijarahJo-frontend"
npm install
npm run dev
```

---

## 📚 Additional Resources

- **Database Setup**: See `TijarahJo-Backend/TijarahJoDBAPI/database/scripts/README.md`
- **Backend Setup**: See `docs/setup/BACKEND_SETUP_MAC.md`
- **Troubleshooting**: See `docs/troubleshooting/`
- **Integration Report**: See `INTEGRATION_REPORT.md`

---

## ❓ Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review error messages in console/logs
3. Verify all prerequisites are installed
4. Check database connection using SSMS
5. Review configuration files

---

**Last Updated:** December 2024  
**Version:** 1.0.0
