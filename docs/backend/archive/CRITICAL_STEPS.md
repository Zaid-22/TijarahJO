# ⚠️ CRITICAL: Views and Location Won't Work Until You Do This!

## 🚨 The Problem

Views and Location are **NOT showing** because:

1. ❌ The database columns don't exist yet (SQL scripts not run)
2. ❌ The stored procedures don't return the new fields (not updated)
3. ❌ The backend might not be rebuilt with new code

## ✅ SOLUTION - Do These Steps NOW:

### Step 1: Run SQL Scripts (MUST DO FIRST!)

**Open SQL Server Management Studio and run these scripts IN ORDER:**

1. **First, run:** `database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql`

   - This adds Views, City, Area columns to TbPosts table
   - **VERIFY:** Run `SELECT * FROM TbPosts` - you should see Views, City, Area columns

2. **Then, run:** `database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql`
   - This updates all stored procedures
   - **VERIFY:** Run `EXEC SP_GetPostByID @PostID = 1` - should return Views, City, Area

### Step 2: Rebuild Backend (MUST DO!)

```bash
cd "apps/api"
dotnet build
```

Or in Visual Studio: Right-click `TijarahJoDBAPI` project → **Rebuild**

### Step 3: Restart Backend Server

Stop and restart your backend server after rebuilding.

### Step 4: Verify It Works

1. **Check browser console** - Look for:

   ```
   [transformPostModelToProduct] PostModel data: { Views: ..., City: ..., Area: ... }
   ```

2. **Check backend console** - Look for:

   ```
   [GetAllTbUserPosts] PostID X: Views=0, City=null, Area=null
   ```

3. **Create a new post** with location "Amman"
4. **View the post** - Should show:
   - Location: "Amman" (not "Jordan")
   - Views: "1 view" (after viewing)

## 🔍 Quick Diagnostic

Run this SQL to check if columns exist:

```sql
SELECT COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TbPosts'
AND COLUMN_NAME IN ('Views', 'City', 'Area');
```

**Expected Result:** Should return 3 rows (Views, City, Area)
**If empty:** You haven't run the SQL scripts yet!

## 📝 What Each Script Does

### `database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql`

- Adds `Views INT NOT NULL DEFAULT 0` column
- Adds `City NVARCHAR(100) NULL` column
- Adds `Area NVARCHAR(100) NULL` column
- Creates indexes for performance

### `database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql`

- Updates `SP_GetPostByID` to return Views, City, Area
- Updates `SP_GetAllTbUserPosts` to return Views, City, Area
- Updates `SP_GetTbPostsPaged` to return Views, City, Area
- Updates `SP_AddPost` to accept City, Area parameters
- Updates `SP_UpdatePost` to accept City, Area parameters
- Creates `SP_IncrementPostViews` for view tracking

Legacy note: `UPDATE_STORED_PROCEDURES_FOR_VIEWS_LOCATION.sql` is archived at `database/scripts/archive/migrations/UPDATE_STORED_PROCEDURES_FOR_VIEWS_LOCATION.sql`.

## ⚡ Quick Test After Setup

1. Open browser DevTools (F12)
2. Go to Console tab
3. View a post
4. Look for log: `[transformPostModelToProduct] PostModel data:`
5. Check if `Views` and `City` have values (not undefined/null)

If they're still null/undefined, the SQL scripts weren't run or backend wasn't rebuilt!
