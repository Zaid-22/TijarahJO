# Troubleshooting Signup Issues

## Common Error: "Error creating user account. Please try again."

This error occurs when `user.Save()` returns `false`, which means the stored procedure `SP_AddTbUser` either:
1. Doesn't exist in the database
2. Failed to execute
3. Returned an invalid UserID

## Solution Steps

### Step 1: Verify Stored Procedure Exists

Run this SQL query in Azure Data Studio:

```sql
USE TijarahJoDB;
GO

SELECT name, SCHEMA_NAME(schema_id) as schema_name 
FROM sys.procedures 
WHERE name = 'SP_AddTbUser';
GO
```

**Expected Result:** Should return one row with `SP_AddTbUser` in the `dbo` schema.

**If no results:** The stored procedure doesn't exist. Go to Step 2.

### Step 2: Create the Stored Procedure

Run this SQL script in Azure Data Studio:

**File:** `apps/api/SETUP_ALL_STORED_PROCEDURES.sql`

Or just the signup one:

**File:** `apps/api/CREATE_SP_ADDTBUSER.sql`

Make sure:
- Database: `TijarahJoDB` is selected
- Server: `localhost`
- Login: `sa`
- Password: `<your-local-db-password>`

You should see: **"SP_AddTbUser created successfully!"**

### Step 3: Check Backend Console

When you try to sign up, check the backend terminal for error messages:

**Look for:**
- `ERROR in AddUser: ...` - Shows what went wrong
- `SQL ERROR in AddUser: ...` - Shows SQL-specific errors
- `ERROR: SP_AddTbUser returned invalid UserID: -1` - Stored procedure didn't return a valid ID

### Step 4: Verify Database Connection

Make sure SQL Server is running:

```bash
docker ps
```

Should show `tijarahjo-sql` container running.

### Step 5: Test the Stored Procedure Directly

Run this SQL to test the stored procedure:

```sql
USE TijarahJoDB;
GO

DECLARE @NewUserID INT;

EXEC dbo.SP_AddTbUser
    @Login = 'testuser2',
    @HashedPassword = 'testhash123',
    @Email = 'test2@example.com',
    @FirstName = 'Test',
    @LastName = 'User',
    @JoinDate = GETDATE(),
    @Status = 1,
    @RoleID = 2,
    @IsDeleted = 0,
    @NewUserID = @NewUserID OUTPUT;

SELECT @NewUserID as NewUserID;
GO
```

**Expected Result:** Should return a number > 0 (the new UserID).

**If it fails:** Check the error message - it will tell you what's wrong (e.g., unique constraint violation, missing table, etc.).

## Common Issues

### Issue 1: Stored Procedure Not Found
**Error:** `Could not find stored procedure 'SP_AddTbUser'`
**Solution:** Run `CREATE_SP_ADDTBUSER.sql` script

### Issue 2: Unique Constraint Violation
**Error:** `Violation of UNIQUE KEY constraint 'UQ_TbUsers_Email'`
**Solution:** Use a different email or login

### Issue 3: Invalid UserID Returned
**Error:** `SP_AddTbUser returned invalid UserID: -1`
**Solution:** Check if the INSERT in the stored procedure is working. Verify the TbUsers table exists and has the correct structure.

### Issue 4: Connection Failed
**Error:** `Login failed for user 'sa'`
**Solution:** Check your DB environment variables (`DATABASE_CONNECTION_STRING` or `DB_USER`/`DB_PASSWORD`) and make sure credentials are correct.

## After Fixing

1. **Restart the backend:**
   ```bash
   cd apps/api/src/Api
   dotnet run
   ```

2. **Try signup again** - should work now!

3. **Check backend console** - should see no errors, or specific error messages if something is still wrong.
