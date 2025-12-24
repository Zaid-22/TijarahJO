# Database Setup Checklist - TijarahJoDB

## ✅ What's Already Complete (Based on Your Screenshots)

### 1. Database Created ✅

- [x] `TijarahJoDB` database exists
- [x] Connected and accessible

### 2. Tables Created ✅

- [x] `TbRoles` - 2 rows (Admin, User)
- [x] `TbUsers` - 2 rows (admin01, user01)
- [x] `TbItemCategories` - 4 rows (Electronics, Furniture, Vehicles, Services)
- [x] `TbPosts` - Multiple rows visible
- [x] `TbPostImages` - 4 rows visible

### 3. Basic Seed Data ✅

- [x] Roles inserted
- [x] Users inserted
- [x] Categories inserted
- [x] Sample posts inserted
- [x] Sample post images inserted

---

## ⚠️ What Might Be Missing

### 1. Indexes (Performance Optimization)

**Status:** Need to verify

The `scripts.txt` file includes CREATE INDEX statements (lines 179-193):

- `IX_TbUsers_Email`
- `IX_TbUsers_HashedPassword`
- `IX_TbUsers_RoleID`
- `IX_TbUsers_Username`
- `IX_TbUsers_Status`
- `IX_TbUserPosts_UserID`
- `IX_TbUserPosts_CategoryID`
- `IX_TbUserPosts_Status`
- `IX_TbItemCategories_Name`
- `IX_TbPostImages_PostID`

**How to Check:**

```sql
USE TijarahJoDB;
GO

-- Check if indexes exist
SELECT
    t.name AS TableName,
    i.name AS IndexName
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('TbUsers', 'TbPosts', 'TbItemCategories', 'TbPostImages')
    AND i.name LIKE 'IX_%'
ORDER BY t.name, i.name;
```

**If Missing:** Run lines 179-193 from `scripts.txt`

---

### 2. Stored Procedures (CRITICAL - Backend Needs These!)

**Status:** ⚠️ **LIKELY MISSING - Backend will NOT work without these!**

The backend code uses stored procedures for ALL database operations. You need to run `Stored-Procedures.txt`.

**Required Stored Procedures:**

#### For Users:

- `SP_GetUserById` (or `SP_GetUserByID`)
- `SP_AddUser`
- `SP_UpdateUser`
- `SP_DeleteUser`
- `SP_DoesUserExist`
- `SP_GetAllTbUsers`
- `SP_TbUsers_Login` (or `sp_TbUsers_Login`)

#### For Roles:

- `SP_GetRoleById` (or `SP_GetRoleByID`)
- `SP_AddRole`
- `SP_UpdateRole`
- `SP_DeleteRole`
- `SP_DoesRoleExist`
- `SP_GetAllTbRoles`

#### For Categories:

- `SP_GetCategoryById` (or `SP_GetCategoryByID`)
- `SP_AddCategory`
- `SP_UpdateCategory`
- `SP_DeleteCategory`
- `SP_DoesCategoryExist`
- `SP_GetAllTbItemCategories`

#### For Posts:

- `SP_GetPostById` (or `SP_GetPostByID`)
- `SP_AddPost`
- `SP_UpdatePost`
- `SP_DeletePost`
- `SP_DoesPostExist`
- `SP_GetAllTbUserPosts` (or `SP_GetAllTbPosts`)
- `SP_GetTbPostsPaged` ⭐ (for pagination)

#### For Post Images:

- `SP_GetPostImageById` (or `SP_GetPostImageByID`)
- `SP_AddPostImage`
- `SP_UpdatePostImage`
- `SP_DeletePostImage`
- `SP_DoesPostImageExist`
- `SP_GetAllTbPostImages`

**How to Check:**

```sql
USE TijarahJoDB;
GO

-- Check if stored procedures exist
SELECT
    ROUTINE_SCHEMA,
    ROUTINE_NAME,
    ROUTINE_TYPE
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_SCHEMA = 'dbo'
ORDER BY ROUTINE_NAME;
```

**If Missing:** Run `Stored-Procedures.txt` file in Azure Data Studio

---

### 3. Login Stored Procedure Issue ⚠️

**Status:** Potential mismatch

**Problem:**

- `scripts.txt` has: `sp_TbUsers_Login` with `@Email` parameter
- Backend code (`UserData.cs` line 218) uses: `@Login` parameter

**Check the stored procedure:**

```sql
USE TijarahJoDB;
GO

-- Check stored procedure parameters
SELECT
    p.name AS ParameterName,
    t.name AS DataType
FROM sys.parameters p
INNER JOIN sys.types t ON p.user_type_id = t.user_type_id
WHERE p.object_id = OBJECT_ID('dbo.sp_TbUsers_Login')
    OR p.object_id = OBJECT_ID('dbo.SP_TbUsers_Login');
```

**Fix if needed:**
The stored procedure in `scripts.txt` uses `@Email`, but the backend code passes `@Login`. You may need to:

1. Update the stored procedure to use `@Login` instead of `@Email`
2. OR update the backend code to use `@Email`

---

## 📋 Complete Setup Steps

### Step 1: Verify Tables ✅ (Already Done)

```sql
USE TijarahJoDB;
GO

SELECT name FROM sys.tables WHERE type = 'U';
-- Should show: TbRoles, TbUsers, TbItemCategories, TbPosts, TbPostImages
```

### Step 2: Verify Indexes

```sql
USE TijarahJoDB;
GO

SELECT
    t.name AS TableName,
    i.name AS IndexName
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('TbUsers', 'TbPosts', 'TbItemCategories', 'TbPostImages')
    AND i.name LIKE 'IX_%';
```

**If missing, run:**

- Copy lines 179-193 from `scripts.txt`
- Execute in Azure Data Studio

### Step 3: Create Stored Procedures ⚠️ **CRITICAL**

```sql
-- Open Stored-Procedures.txt
-- Copy entire file
-- Paste in Azure Data Studio
-- Make sure TijarahJoDB is selected
-- Execute (F5)
```

**Verify:**

```sql
USE TijarahJoDB;
GO

SELECT COUNT(*) AS StoredProcedureCount
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_SCHEMA = 'dbo';
-- Should show around 30+ stored procedures
```

### Step 4: Fix Login Stored Procedure (If Needed)

```sql
USE TijarahJoDB;
GO

-- Check current procedure
EXEC sp_helptext 'sp_TbUsers_Login';
-- OR
EXEC sp_helptext 'SP_TbUsers_Login';

-- If it uses @Email but backend needs @Login, update it:
ALTER PROCEDURE dbo.sp_TbUsers_Login
(
    @Login          NVARCHAR(255),  -- Changed from @Email
    @HashedPassword NVARCHAR(255)
)
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (1)
           u.UserID,
           u.Username,
           u.HashedPassword,
           u.Email,
           u.FirstName,
           u.LastName,
           u.JoinDate,
           u.Status,
           u.RoleID,
           u.IsDeleted
    FROM dbo.TbUsers AS u
    WHERE (u.Email = @Login OR u.Username = @Login)  -- Accept email or username
      AND u.HashedPassword = @HashedPassword
      AND u.IsDeleted = 0;
END;
GO
```

---

## 🎯 Quick Verification Script

Run this complete check:

```sql
USE TijarahJoDB;
GO

-- 1. Check Tables
PRINT '=== TABLES ===';
SELECT name AS TableName FROM sys.tables WHERE type = 'U' ORDER BY name;

-- 2. Check Indexes
PRINT '=== INDEXES ===';
SELECT
    t.name AS TableName,
    i.name AS IndexName
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE t.name IN ('TbUsers', 'TbPosts', 'TbItemCategories', 'TbPostImages')
    AND i.name LIKE 'IX_%'
ORDER BY t.name, i.name;

-- 3. Check Stored Procedures
PRINT '=== STORED PROCEDURES ===';
SELECT ROUTINE_NAME
FROM INFORMATION_SCHEMA.ROUTINES
WHERE ROUTINE_TYPE = 'PROCEDURE'
    AND ROUTINE_SCHEMA = 'dbo'
ORDER BY ROUTINE_NAME;

-- 4. Check Data
PRINT '=== DATA COUNTS ===';
SELECT 'TbRoles' AS TableName, COUNT(*) AS RowCount FROM TbRoles
UNION ALL
SELECT 'TbUsers', COUNT(*) FROM TbUsers
UNION ALL
SELECT 'TbItemCategories', COUNT(*) FROM TbItemCategories
UNION ALL
SELECT 'TbPosts', COUNT(*) FROM TbPosts
UNION ALL
SELECT 'TbPostImages', COUNT(*) FROM TbPostImages;
```

---

## ✅ Final Checklist

Before connecting backend:

- [ ] All 5 tables exist (TbRoles, TbUsers, TbItemCategories, TbPosts, TbPostImages)
- [ ] All indexes created (10 indexes total)
- [ ] All stored procedures created (30+ procedures)
- [ ] Login stored procedure uses correct parameter name
- [ ] Sample data inserted (at least roles and users)
- [ ] Database connection string configured in backend
- [ ] Backend can connect to database

---

## 🚨 Most Critical Missing Item

**STORED PROCEDURES** - Without these, your backend API will fail!

The backend code uses stored procedures for EVERY database operation. If they don't exist, you'll get errors like:

- "Could not find stored procedure 'SP_GetUserById'"
- "Invalid object name 'SP_AddPost'"

**Action Required:**

1. Open `Stored-Procedures.txt`
2. Copy entire file
3. Paste in Azure Data Studio
4. Execute (F5)
5. Verify all procedures created

---

## Summary

**What You Have:**

- ✅ Database created
- ✅ All tables created
- ✅ Basic seed data inserted

**What You Need:**

- ⚠️ **Stored Procedures** (CRITICAL - backend won't work without these)
- ⚠️ Indexes (for performance - recommended)
- ⚠️ Login stored procedure parameter fix (if mismatch exists)

**Next Step:**
Run `Stored-Procedures.txt` in Azure Data Studio to complete the setup!
