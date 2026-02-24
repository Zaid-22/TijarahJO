-- =============================================================================
-- V202602221400 — DB Role Separation
-- ATOMICITY_EXCEPTION: This migration is permission DCL with GO-batched role setup.
-- Creates two SQL Server database roles with minimal required permissions.
--
-- tijarahjo_app      → Application role: SELECT/INSERT/UPDATE/DELETE
--                      on transactional tables, SELECT on lookups.
-- tijarahjo_readonly → Read-only role: SELECT on all tables.
--
-- HOW TO USE:
--   1. Run this script as sa or a sysadmin user.
--   2. Create the actual SQL Server logins separately per environment:
--        CREATE LOGIN tijarahjo_app      WITH PASSWORD = '<strong-password>';
--        CREATE LOGIN tijarahjo_readonly WITH PASSWORD = '<strong-password>';
--   3. Map logins to the database users created by this script.
--   4. Update the connection string in appsettings.json to use tijarahjo_app.
-- =============================================================================

SET NOCOUNT ON;
GO

-- ---------------------------------------------------------------------------
-- 1. Create database users (role containers) if they do not already exist
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app' AND type = 'S')
BEGIN
    -- NOTE: No LOGIN specified — wire up per environment via ALTER USER ... WITH LOGIN = ...
    CREATE USER tijarahjo_app WITHOUT LOGIN;
    PRINT 'Created user: tijarahjo_app';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_readonly' AND type = 'S')
BEGIN
    CREATE USER tijarahjo_readonly WITHOUT LOGIN;
    PRINT 'Created user: tijarahjo_readonly';
END
GO

-- ---------------------------------------------------------------------------
-- 2. Create application role and assign it
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app_role' AND type = 'R')
BEGIN
    CREATE ROLE tijarahjo_app_role;
    PRINT 'Created role: tijarahjo_app_role';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_readonly_role' AND type = 'R')
BEGIN
    CREATE ROLE tijarahjo_readonly_role;
    PRINT 'Created role: tijarahjo_readonly_role';
END
GO

-- Add users to roles
ALTER ROLE tijarahjo_app_role      ADD MEMBER tijarahjo_app;
ALTER ROLE tijarahjo_readonly_role ADD MEMBER tijarahjo_readonly;
GO

-- ---------------------------------------------------------------------------
-- 3. Grant permissions to tijarahjo_app_role (DML on transactional tables)
-- ---------------------------------------------------------------------------

-- Full DML on transactional tables
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Users              TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Posts              TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Categories         TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PostImages         TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Favorites          TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Conversations      TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Messages           TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Reviews            TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Notifications      TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PushSubscriptions  TO tijarahjo_app_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Roles              TO tijarahjo_app_role;
GRANT SELECT, INSERT              ON dbo.AuditLog              TO tijarahjo_app_role;

-- SELECT only on lookup / reference tables (app reads these, never writes)
GRANT SELECT ON dbo.UserStatusLookup  TO tijarahjo_app_role;
GRANT SELECT ON dbo.PostStatusLookup  TO tijarahjo_app_role;
GRANT SELECT ON dbo.Cities            TO tijarahjo_app_role;
GRANT SELECT ON dbo.Areas             TO tijarahjo_app_role;
GRANT SELECT ON dbo.SchemaMigrations  TO tijarahjo_app_role;

-- Explicitly deny DDL operations
DENY ALTER  ON SCHEMA::dbo TO tijarahjo_app_role;
DENY CREATE TABLE TO tijarahjo_app_role;
DENY DROP TABLE   TO tijarahjo_app_role;
GO

-- ---------------------------------------------------------------------------
-- 4. Grant permissions to tijarahjo_readonly_role (SELECT only, all tables)
-- ---------------------------------------------------------------------------
GRANT SELECT ON dbo.Users             TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Posts             TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Categories        TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.PostImages        TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Favorites         TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Conversations     TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Messages          TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Reviews           TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Notifications     TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.PushSubscriptions TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Roles             TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.AuditLog          TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.UserStatusLookup  TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.PostStatusLookup  TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Cities            TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.Areas             TO tijarahjo_readonly_role;
GRANT SELECT ON dbo.SchemaMigrations  TO tijarahjo_readonly_role;

DENY INSERT, UPDATE, DELETE ON SCHEMA::dbo TO tijarahjo_readonly_role;
DENY ALTER  ON SCHEMA::dbo  TO tijarahjo_readonly_role;
GO

PRINT 'V202602221400 — DB role separation complete.';
GO
