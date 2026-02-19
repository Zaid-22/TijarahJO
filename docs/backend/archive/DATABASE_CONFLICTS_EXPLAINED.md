# Database Conflicts Explained

## Yes, There Are Conflicts! 🔴

Your database has **multiple migration scripts** that partially update the same stored procedures, which can cause conflicts.

## The Problem

### Conflicting Migration Scripts

You have **4 different scripts** that modify the same stored procedures:

1. **`FIX_SP_ADD_POST.sql`** ❌
   - Only adds `City` and `Area` parameters to `SP_AddPost`
   - Does NOT include `Views` column
   - Does NOT update other procedures

2. **`FIX_SP_UPDATE_POST.sql`** ❌
   - Only adds `City` and `Area` parameters to `SP_UpdatePost`
   - Does NOT include `Views` column
   - Does NOT update other procedures

3. **`FIX_BOTH_POST_STORED_PROCEDURES.sql`** ❌
   - Adds `City` and `Area` to both `SP_AddPost` and `SP_UpdatePost`
   - Does NOT include `Views` column
   - Does NOT create `SP_IncrementPostViews`
   - Does NOT update `SP_GetPostByID` or `SP_GetAllTbUserPosts`

4. **`FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql`** ✅ **USE THIS ONE**
   - Complete solution: Updates ALL procedures
   - Includes `Views`, `City`, and `Area`
   - Creates `SP_IncrementPostViews`
   - Updates all 6 stored procedures correctly

## What Conflicts Occur

### Conflict 1: Partial Updates
If you ran `FIX_SP_ADD_POST.sql` or `FIX_BOTH_POST_STORED_PROCEDURES.sql`:
- ✅ `SP_AddPost` has `City` and `Area` parameters
- ❌ `SP_AddPost` does NOT handle `Views` column
- ❌ `SP_GetPostByID` does NOT return `Views`
- ❌ `SP_IncrementPostViews` does NOT exist
- **Result**: 500 error when trying to increment views

### Conflict 2: Schema vs Procedures Mismatch
If you ran `ADD_VIEWS_AND_LOCATION_TO_POSTS.sql` (adds columns) but NOT `FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql`:
- ✅ `Views`, `City`, `Area` columns exist in `TbPosts` table
- ❌ Stored procedures don't know about these columns
- **Result**: Procedures fail when trying to use these columns

### Conflict 3: Missing Stored Procedure
The most critical conflict:
- ❌ `SP_IncrementPostViews` does NOT exist
- **Result**: `/api/posts/{id}/views` returns 500 error

## How to Check for Conflicts

Run this diagnostic script:
```sql
apps/api/database/scripts/archive/diagnostics/CHECK_AND_CLEAN_DUPLICATES.sql
```

This will show you:
- Which columns exist
- Which stored procedures are outdated
- What conflicts need to be resolved

## The Solution

### Step 1: Run the Complete Migration (Recommended)

Run these scripts **IN ORDER**:

1. **`database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql`**
   - Adds `Views`, `City`, `Area` columns to `TbPosts` table
   - Safe to run multiple times (uses `IF NOT EXISTS`)

2. **`database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql`**
   - Updates ALL 6 stored procedures
   - Creates `SP_IncrementPostViews`
   - Safe to run multiple times (drops and recreates)

### Step 2: Verify

After running the scripts, verify:
```sql
-- Check columns
SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'TbPosts' AND COLUMN_NAME IN ('Views', 'City', 'Area');

-- Check stored procedure exists
SELECT * FROM sys.procedures WHERE name = 'SP_IncrementPostViews';

-- Test the procedure
EXEC SP_IncrementPostViews @PostID = 13;
```

### Step 3: Restart Backend

After running migrations:
1. Stop your backend server
2. Restart it: `dotnet run`
3. Test the endpoint: `POST /api/posts/13/views`

## Why This Happened

The partial fix scripts (`FIX_SP_ADD_POST.sql`, etc.) were created to fix specific issues (City/Area parameters), but they don't include the complete solution. Use `database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql` as the active canonical script. The old `UPDATE_STORED_PROCEDURES_FOR_VIEWS_LOCATION.sql` script is archived.

## Prevention

To avoid conflicts in the future:
1. ✅ Always use the comprehensive migration scripts
2. ✅ Run diagnostic scripts before applying migrations
3. ✅ Document which scripts have been run
4. ❌ Don't run partial fix scripts if a comprehensive one exists

## Quick Fix Command

If you just want to fix everything now:

```sql
-- Run in SQL Server Management Studio or your SQL client:

-- 1. Add columns (if not exists)
-- Execute: database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql

-- 2. Update all procedures
-- Execute: database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql
```

Then restart your backend server.
