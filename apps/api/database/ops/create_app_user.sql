-- =============================================================================
-- TijarahJo – Create dedicated application database user
-- =============================================================================
-- PURPOSE: Stop using the 'sa' (sysadmin) account for application connections.
-- This script creates a low-privilege login and user with only the permissions
-- the application actually needs.
--
-- USAGE:
--   1. Replace @AppPassword below with a strong, unique password
--   2. Run this script against the SQL Server instance as 'sa'
--   3. Update .env: DB_RUNTIME_PRINCIPAL=tijarahjo_app
--   4. Update .env: DB_APP_PASSWORD=<your chosen password>
-- =============================================================================

USE [master];
GO

-- Create server-level login (if not exists)
IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'tijarahjo_app')
BEGIN
    CREATE LOGIN [tijarahjo_app]
        WITH PASSWORD = N'CHANGE_ME_STRONG_APP_PASSWORD',
             DEFAULT_DATABASE = [TijarahJoDB],
             CHECK_EXPIRATION = OFF,
             CHECK_POLICY = ON;
    PRINT 'Created login [tijarahjo_app].';
END
ELSE
BEGIN
    PRINT 'Login [tijarahjo_app] already exists.';
END
GO

USE [TijarahJoDB];
GO

-- Create database-level user mapped to the login
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app')
BEGIN
    CREATE USER [tijarahjo_app] FOR LOGIN [tijarahjo_app];
    PRINT 'Created user [tijarahjo_app] in TijarahJoDB.';
END
ELSE
BEGIN
    PRINT 'User [tijarahjo_app] already exists in TijarahJoDB.';
END
GO

-- Grant minimum required permissions
-- Read/write access to all tables (EF Core needs this)
ALTER ROLE [db_datareader] ADD MEMBER [tijarahjo_app];
ALTER ROLE [db_datawriter] ADD MEMBER [tijarahjo_app];
GO

-- Grant EXECUTE on all stored procedures and functions
GRANT EXECUTE TO [tijarahjo_app];
GO

-- Grant ability to view definition (needed for EF Core migrations introspection)
GRANT VIEW DEFINITION TO [tijarahjo_app];
GO

-- Grant CREATE TABLE permission (needed if EF Core creates tables at runtime)
-- Remove this line if you only use manual SQL migrations
-- GRANT CREATE TABLE TO [tijarahjo_app];

PRINT 'Permissions granted to [tijarahjo_app]. Application should now connect using this user instead of sa.';
GO
