# User Update Fix Guide

## Problem
Getting 500 Internal Server Error when updating user profile with message "Error updating UserBL"

## Root Causes
1. **Stored Procedure Issue**: `SP_UpdateUser` tries to set `HashedPassword` to NULL when no password is provided, but the column is `NOT NULL`
2. **DAL Code Issue**: Using `ExecuteNonQuery()` instead of `ExecuteScalar()` to read the rows affected value

## Solution Steps

### Step 1: Update the Database Stored Procedure

1. Open **SQL Server Management Studio (SSMS)** or your SQL client
2. Connect to your `TijarahJoDB` database
3. Open and execute the file: `FIX_UPDATE_USER_PASSWORD.sql`
4. Verify the script ran successfully - you should see:
   ```
   SP_UpdateUser updated successfully to handle NULL passwords and unique constraints correctly.
   ```

### Step 2: Rebuild the Backend Project

The DAL code has been updated to use `ExecuteScalar()` instead of `ExecuteNonQuery()`. You need to rebuild:

1. **If using Visual Studio:**
   - Right-click on `TijarahJoDBAPI` project
   - Select "Rebuild"
   - Or press `Ctrl+Shift+B`

2. **If using .NET CLI:**
   ```bash
   cd apps/api
   dotnet build
   ```

3. **Restart the backend server** after rebuilding

### Step 3: Check Backend Console Logs

After rebuilding and restarting, when you try to update a user, check the backend console for detailed logs:

Look for these log messages:
- `[UpdateUser] Updating user ID: ...`
- `[UpdateUser] ExecuteScalar result: ...`
- `[UpdateUser] Final rows affected: ...`
- `[UpdateUser Controller] Exception during Save(): ...` (if there's an error)

These logs will help identify the exact issue.

## What the Fix Does

### Stored Procedure (`SP_UpdateUser`)
- ✅ Only updates password if provided (not NULL/empty)
- ✅ Preserves existing password when no new password is provided
- ✅ Validates login/email uniqueness (prevents conflicts with other users)
- ✅ Returns rows affected via SELECT statement

### DAL Code (`UserData.cs`)
- ✅ Uses `ExecuteScalar()` to read the rows affected value
- ✅ Includes detailed logging for debugging
- ✅ Handles edge cases (null results, conversion errors)

## Testing

After applying the fixes, test these scenarios:

1. **Update profile without password** - Should work ✅
2. **Update profile with new password** - Should work ✅
3. **Update login/email to existing values** - Should fail with clear error ✅
4. **Update to new unique login/email** - Should work ✅

## Troubleshooting

### If you still get 500 error:

1. **Check backend console logs** - Look for `[UpdateUser]` messages
2. **Verify stored procedure exists** - Run this in SQL:
   ```sql
   SELECT * FROM sys.procedures WHERE name = 'SP_UpdateUser'
   ```
3. **Check stored procedure definition** - Run this in SQL:
   ```sql
   EXEC sp_helptext 'SP_UpdateUser'
   ```
   Should show the updated procedure with NULL password handling

4. **Verify backend is using updated DLL** - Make sure you rebuilt and restarted

### Common Issues

- **"Stored procedure not found"** → Run the SQL script again
- **"Conversion error"** → Check backend logs for ExecuteScalar result
- **"No rows affected"** → User might not exist or WHERE clause doesn't match
- **"Unique constraint violation"** → Login/email already exists for another user

## Files Changed

1. `FIX_UPDATE_USER_PASSWORD.sql` - Updated stored procedure
2. `DAL/UserData.cs` - Changed from ExecuteNonQuery to ExecuteScalar

## Need More Help?

Check the backend console logs for detailed error messages. The logs include:
- Exception messages
- Stack traces
- Inner exceptions
- SQL parameter values

