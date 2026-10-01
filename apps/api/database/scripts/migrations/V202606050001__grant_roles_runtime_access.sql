-- =============================================================================
-- V202606050001 — Grant Roles and RolePermissions access for runtime app principals
-- ATOMICITY_EXCEPTION: Permission DCL with GO-batched role checks.
-- bootstrap_db.sh configures tijarahjo_app_runtime with DENY INSERT/UPDATE/DELETE
-- on dbo.Roles, which blocks admin role CRUD even when roles.manage is granted.
-- RolePermissions also needs DML for assigning permissions to roles.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Roles TO tijarahjo_app_role;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
    BEGIN
        REVOKE INSERT, UPDATE, DELETE ON dbo.Roles FROM tijarahjo_app_runtime;
        GRANT INSERT, UPDATE, DELETE ON dbo.Roles TO tijarahjo_app_runtime;
    END

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_readonly_role') IS NOT NULL
        GRANT SELECT ON dbo.Roles TO tijarahjo_readonly_role;
END
GO

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.RolePermissions TO tijarahjo_app_role;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.RolePermissions TO tijarahjo_app_runtime;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_readonly_role') IS NOT NULL
        GRANT SELECT ON dbo.RolePermissions TO tijarahjo_readonly_role;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202606050001__grant_roles_runtime_access.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202606050001__grant_roles_runtime_access.sql',
        SYSUTCDATETIME(),
        N'Grant Roles and RolePermissions DML to tijarahjo_app_role and tijarahjo_app_runtime'
    );
END
GO

PRINT 'Granted Roles and RolePermissions access for application runtime roles.';
GO
