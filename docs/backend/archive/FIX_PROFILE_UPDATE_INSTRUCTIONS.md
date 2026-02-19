# Fix Profile Update Issue - Instructions

## Problem
When trying to edit your profile, you get a 500 Internal Server Error. The error message shows "Error updating UserBL" in the console.

## Root Cause
The stored procedure `SP_UpdateUser` in your database is outdated. The old version:
1. Doesn't handle NULL passwords correctly (tries to set password to NULL, which violates the NOT NULL constraint)
2. Doesn't return rows affected, causing the DAL layer to fail

## Solution

### Step 1: Run the SQL Fix Script

1. Open **SQL Server Management Studio (SSMS)** or your SQL client
2. Connect to your `TijarahJoDB` database
3. Open the file: `FIX_UPDATE_USER_PASSWORD.sql`
4. Execute the script (Press F5 or click Execute)
5. You should see success messages indicating the stored procedure was updated

**Important:** Do **not** run `VERIFY_AND_FIX_SP_UPDATE_USER.sql` for this issue.
That script resets sample posts and deletes existing post/image data.

### Step 2: Verify the Fix

After running the script, verify it worked by running this SQL query:

```sql
USE [TijarahJoDB]
GO

-- Check if the stored procedure exists
SELECT name, create_date, modify_date
FROM sys.procedures
WHERE name = 'SP_UpdateUser'
GO

-- View the stored procedure definition (should show NULL password handling)
EXEC sp_helptext 'SP_UpdateUser'
GO
```

### Step 3: Restart Your Backend Server

After updating the stored procedure:
1. Stop your backend server (if it's running)
2. Restart it
3. The backend code already has the correct DAL implementation, so no code changes are needed

### Step 4: Test the Profile Update

1. Go to your profile edit page
2. Make a change (e.g., update your first name)
3. Click "Save Changes"
4. It should now work without the 500 error!

## What Was Fixed

The new `SP_UpdateUser` stored procedure:
- ✅ Only updates password when a new password is provided
- ✅ Preserves existing password when NULL/empty is passed
- ✅ Returns rows affected via SELECT statement (required by DAL layer)
- ✅ Validates login/email uniqueness before updating
- ✅ Provides better error handling

## Troubleshooting

### If you still get errors after applying the fix:

1. **Check backend console logs** - Look for `[UpdateUser]` messages that show the exact error
2. **Verify stored procedure exists** - Run:
   ```sql
   SELECT * FROM sys.procedures WHERE name = 'SP_UpdateUser'
   ```
3. **Check stored procedure definition** - Run:
   ```sql
   EXEC sp_helptext 'SP_UpdateUser'
   ```
   Should show the version with NULL password handling and SELECT @RowsAffected

4. **Verify backend is running latest code** - The DAL code should use `ExecuteScalar()` (already implemented)

### Common Error Messages:

- **"Stored procedure not found"** → Run the SQL script again
- **"No rows affected"** → User might not exist, check UserID
- **"Login or Email already exists"** → Try a different login/email
- **"Error updating UserBL"** → Check backend console logs for SQL error details

## Need More Help?

Check the backend console logs when you try to update your profile. The logs will show:
- The SQL error message
- Stack trace
- Parameter values being sent

Look for lines starting with `[UpdateUser]` in the backend console output.
