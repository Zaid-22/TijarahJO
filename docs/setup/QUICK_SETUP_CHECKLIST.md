# TijarahJo - Quick Setup Checklist

Use this checklist when setting up the project on a new computer.

---

## ✅ Prerequisites Installation

- [ ] Install .NET 8.0 SDK
  - Verify: `dotnet --version`
  - Should show: `8.0.x`

- [ ] Install SQL Server (Express or Full)
  - Verify: Can connect using SSMS
  - Note server name: `_________________`

- [ ] Install Node.js 16+ and npm
  - Verify: `node --version` and `npm --version`

- [ ] Install Git (if cloning from repository)
  - Verify: `git --version`

---

## ✅ Database Setup

- [ ] SQL Server is running
- [ ] Recreate database from canonical scripts (`./scripts/bootstrap_db.sh`)
- [ ] Database `TijarahJoDB` exists
- [ ] Can connect to database using SSMS
- [ ] Test connection with credentials:
  - Server: `_________________`
  - Login: `_________________`
  - Password: `_________________`

---

## ✅ Backend Configuration

- [ ] Navigate to: `apps/api/src/Api`
- [ ] Configure database connection (choose one):
  - [ ] Set environment variables (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD)
  - [ ] OR edit `appsettings.Development.json`
- [ ] Configure JWT SigningKey in `appsettings.Development.json`
- [ ] Run `dotnet restore`
- [ ] Run `dotnet build` (should succeed)
- [ ] Run `dotnet run`
- [ ] Backend starts on: `http://localhost:5033`
- [ ] Swagger UI accessible: `http://localhost:5033/swagger`
- [ ] Test endpoint: GET `/api/v1/categories` (should return data)

---

## ✅ Frontend Configuration

- [ ] Navigate to: `apps/web`
- [ ] Create `.env` file with: `VITE_API_BASE_URL=http://localhost:5033/api/v1`
- [ ] Run `npm install`
- [ ] Run `npm run dev`
- [ ] Frontend starts on: `http://localhost:5173`
- [ ] Application loads in browser
- [ ] No console errors

---

## ✅ Integration Testing

- [ ] Frontend can fetch categories from backend
- [ ] Frontend can fetch posts from backend
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Can create a new post
- [ ] Can view post details
- [ ] Can edit own post
- [ ] Can delete own post
- [ ] Images upload correctly

---

## ✅ Final Verification

- [ ] All features working
- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Database operations working
- [ ] Authentication working
- [ ] Ready for development!

---

## 📝 Configuration Notes

**Database Connection:**
```
Server: _________________
Database: TijarahJoDB
Login: _________________
Password: _________________
```

**JWT Signing Key:**
```
Key: _________________
```

**API Base URL:**
```
URL: http://localhost:5033/api/v1
```

---

**Setup Date:** _______________  
**Setup By:** _______________  
**Computer:** _______________
