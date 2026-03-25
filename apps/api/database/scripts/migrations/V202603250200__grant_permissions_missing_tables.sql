-- =============================================================================
-- V202603250200 — Grant Permissions on Missing Tables
-- ATOMICITY_EXCEPTION: This migration is permission DCL with GO-batched role setup.
-- Grants required permissions on newly added tables to the application roles.
-- =============================================================================

USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

-- ---------------------------------------------------------------------------
-- 1. Grant permissions to tijarahjo_app_role (DML on transactional tables)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.BlacklistedTokens', N'U') IS NOT NULL
    GRANT SELECT, INSERT, DELETE ON dbo.BlacklistedTokens TO tijarahjo_app_role;

IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
    GRANT SELECT, INSERT, UPDATE ON dbo.SystemSettings TO tijarahjo_app_role;

IF OBJECT_ID(N'dbo.Reports', N'U') IS NOT NULL
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Reports TO tijarahjo_app_role;

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
    GRANT SELECT ON dbo.Permissions TO tijarahjo_app_role;

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
    GRANT SELECT ON dbo.RolePermissions TO tijarahjo_app_role;
GO

-- ---------------------------------------------------------------------------
-- 2. Grant permissions to tijarahjo_readonly_role (SELECT only)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.BlacklistedTokens', N'U') IS NOT NULL
    GRANT SELECT ON dbo.BlacklistedTokens TO tijarahjo_readonly_role;

IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
    GRANT SELECT ON dbo.SystemSettings TO tijarahjo_readonly_role;

IF OBJECT_ID(N'dbo.Reports', N'U') IS NOT NULL
    GRANT SELECT ON dbo.Reports TO tijarahjo_readonly_role;

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
    GRANT SELECT ON dbo.Permissions TO tijarahjo_readonly_role;

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
    GRANT SELECT ON dbo.RolePermissions TO tijarahjo_readonly_role;
GO

PRINT 'Granted permissions on missing tables for application roles.';
GO
