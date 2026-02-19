# Quick Fix Checklist - Views and Location

## ⚠️ IMPORTANT: You MUST Run These Steps!

### Step 1: Run SQL Scripts (REQUIRED)

**You MUST run these SQL scripts in your database for Views and Location to work!**

1. Open SQL Server Management Studio (SSMS)
2. Connect to your `TijarahJoDB` database
3. Run this script first:
   ```
   database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql
   ```
   This adds the Views, City, and Area columns to the TbPosts table.

4. Then run this script:
   ```
   database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql
   ```
   This updates all stored procedures to return the new fields.

### Step 2: Rebuild Backend (REQUIRED)

After running the SQL scripts, rebuild the backend:

```bash
cd apps/api
dotnet build
```

Or in Visual Studio: Right-click project → Rebuild

### Step 3: Restart Backend Server (REQUIRED)

After rebuilding, restart your backend server.

### Step 4: Verify Database Columns Exist

Run this SQL query to verify the columns were added:

```sql
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'TbPosts'
AND COLUMN_NAME IN ('Views', 'City', 'Area');
```

You should see:
- Views (int, not null)
- City (nvarchar, nullable)
- Area (nvarchar, nullable)

### Step 5: Test

1. **Create a new post** with a location (e.g., "Amman")
2. **View the post** - check if:
   - Location shows "Amman" (not "Jordan")
   - Views shows "1 view" (after viewing)
   - Posted time shows correctly

## 🔍 Troubleshooting

### If location still shows "Jordan":
- ✅ Check if you ran the SQL scripts
- ✅ Check if backend was rebuilt
- ✅ Check browser console for errors
- ✅ Check backend console logs for database errors
- ✅ Verify stored procedure returns City: `EXEC SP_GetPostByID @PostID = 1`

### If views still show "0":
- ✅ Check if Views column exists in database
- ✅ Check browser Network tab - is `/api/posts/{id}/views` being called?
- ✅ Check backend console for errors when incrementing views
- ✅ Verify stored procedure exists: `SELECT * FROM sys.procedures WHERE name = 'SP_IncrementPostViews'`

### If nothing works:
1. Check backend console logs when fetching a post
2. Check browser console for API response data
3. Verify the PostModel in backend includes Views, City, Area
4. Check if stored procedures are returning the new columns

## 📝 Quick Test Query

Run this to see if a post has Views and City:

```sql
SELECT PostID, PostTitle, Views, City, Area
FROM TbPosts
WHERE PostID = 1;  -- Replace 1 with an actual PostID
```

If Views and City are NULL or the query fails, the columns don't exist yet - run the SQL scripts.
