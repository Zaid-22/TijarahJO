# Will TijarahJo Work on Another Computer?

## ✅ YES, it will work! But you need to configure a few things.

---

## Quick Answer

**Yes, the code will work on another computer, including the database**, but you need to:

1. ✅ Install prerequisites (.NET, SQL Server, Node.js)
2. ✅ Restore the database from backup
3. ✅ Configure database connection
4. ✅ Configure JWT settings
5. ✅ Set frontend API URL

**Total setup time: ~30-60 minutes** (depending on download speeds)

---

## What You Need to Do

### 1. Transfer Files

**Copy these to the new computer:**
- ✅ All source code (entire project folder)
- ✅ Database backup: `TijarahJo-Backend/Database Backup/TijarahJoDB.bak`
- ✅ SQL scripts: `TijarahJo-Backend/TijarahJoDBAPI/database/scripts/`

**Don't copy:**
- ❌ `node_modules/` (will reinstall)
- ❌ `bin/` and `obj/` folders (will rebuild)

### 2. Install Prerequisites

- **.NET 8.0 SDK** - Download from Microsoft
- **SQL Server** - Express or Full version
- **Node.js 16+** - Download from nodejs.org

### 3. Restore Database

**Option A: From Backup (Easiest)**
1. Copy `TijarahJoDB.bak` to new computer
2. Open SQL Server Management Studio
3. Right-click "Databases" → "Restore Database"
4. Select the `.bak` file
5. Click "OK"

**Option B: From Scripts**
1. Create database: `CREATE DATABASE TijarahJoDB;`
2. Run scripts from `database/scripts/setup/` in order

### 4. Configure Backend

**Set database connection** (choose one method):

**Method 1: Environment Variables**
```bash
export DB_HOST=localhost
export DB_NAME=TijarahJoDB
export DB_USER=sa
export DB_PASSWORD=YourPassword
```

**Method 2: Edit appsettings.Development.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
  },
  "JWT": {
    "SigningKey": "YourSecretKeyHere_Minimum32Characters"
  }
}
```

### 5. Configure Frontend

Create `.env` file in `TijarahJo-frontend/`:
```
VITE_API_BASE_URL=http://localhost:5033/api
```

### 6. Install Dependencies

**Backend:**
```bash
cd TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI
dotnet restore
dotnet build
dotnet run
```

**Frontend:**
```bash
cd TijarahJo-frontend
npm install
npm run dev
```

---

## What's Already Portable

✅ **All source code** - No changes needed  
✅ **Database schema** - Works on any SQL Server  
✅ **SQL scripts** - Can run on any SQL Server  
✅ **Configuration files** - Just need to update values  
✅ **Dependencies** - Automatically installed  

---

## What Needs Configuration

⚠️ **Database connection** - Must match new SQL Server  
⚠️ **JWT signing key** - Should be different per environment  
⚠️ **API URLs** - May need to update if ports change  

---

## Common Issues & Solutions

### "Cannot connect to database"
- ✅ Check SQL Server is running
- ✅ Verify connection string (server name, username, password)
- ✅ Test connection in SQL Server Management Studio first

### "JWT validation failed"
- ✅ Make sure JWT signing key is set in `appsettings.Development.json`
- ✅ Use same key for token generation and validation

### "Frontend cannot connect to backend"
- ✅ Verify backend is running on `http://localhost:5033`
- ✅ Check `.env` file has correct API URL
- ✅ Verify CORS is configured

---

## Step-by-Step Guide

For detailed instructions, see: **`SETUP_NEW_COMPUTER_GUIDE.md`**

For quick checklist, see: **`QUICK_SETUP_CHECKLIST.md`**

---

## Summary

| Component | Portable? | Needs Configuration? |
|-----------|-----------|---------------------|
| Source Code | ✅ Yes | ❌ No |
| Database | ✅ Yes | ⚠️ Connection string |
| Backend | ✅ Yes | ⚠️ Database + JWT |
| Frontend | ✅ Yes | ⚠️ API URL |
| Dependencies | ✅ Yes | ❌ Auto-install |

**Bottom Line:** Everything will work, you just need to configure the database connection and a few settings. The setup guide makes it easy!

---

**Need Help?** See `SETUP_NEW_COMPUTER_GUIDE.md` for complete instructions.

