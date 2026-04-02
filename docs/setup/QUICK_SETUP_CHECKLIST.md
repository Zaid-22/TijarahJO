# TijarahJo - Quick Setup Checklist

Use this checklist when setting up the project on a new computer.

## ✅ Prerequisites Installation

- [ ] Install .NET 8.0 SDK
  - Verify: `dotnet --version`
  - Should show: `8.0.x`

- [ ] Install Node.js 18+ and npm
  - Verify: `node --version` and `npm --version`

- [ ] Install Docker Desktop
  - Verify: `docker --version`
  - Verify: `docker compose version`

- [ ] Install Git
  - Verify: `git --version`

## ✅ Local Environment

- [ ] Copy `.env.example` to `.env`
- [ ] Set `MSSQL_SA_PASSWORD`
- [ ] Set `JWT_SIGNING_KEY`
- [ ] Set `DB_APP_PASSWORD`
- [ ] Confirm `VITE_API_BASE_URL=http://localhost:5033/api/v1`

## ✅ Database Setup

- [ ] Run `./scripts/bootstrap_db.sh`
- [ ] Database `TijarahJoDB` exists
- [ ] Swagger loads at `http://localhost:5033/swagger`
- [ ] API verification passes

## ✅ App Startup

- [ ] Run `./scripts/run-dev.sh`
- [ ] Backend starts on `http://localhost:5033`
- [ ] Frontend starts on `http://localhost:5173`
- [ ] No startup errors in terminal output

## ✅ Integration Testing

- [ ] Frontend can fetch categories from backend
- [ ] Frontend can fetch posts from backend
- [ ] Can register a new user
- [ ] Can login with credentials
- [ ] Signed-in hard refresh restores account state cleanly
- [ ] Can create a new post
- [ ] Can view post details
- [ ] Can edit own post
- [ ] Can delete own post
- [ ] Images upload correctly

## ✅ Final Verification

- [ ] No errors in browser console
- [ ] No errors in backend logs
- [ ] Database operations working
- [ ] Authentication working
- [ ] Ready for development

## 📝 Configuration Notes

**Backend API:**
```
http://localhost:5033
```

**Frontend:**
```
http://localhost:5173
```

**API Base URL:**
```
http://localhost:5033/api/v1
```

---

**Last Updated:** 2026-04-02  
**Setup Date:** _______________  
**Setup By:** _______________  
**Computer:** _______________
