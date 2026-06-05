-- =============================================================================
-- V202606050002 — Grant Cities and Areas access for runtime app principals
-- ATOMICITY_EXCEPTION: Permission DCL with GO-batched role checks.
-- bootstrap_db.sh configures tijarahjo_app_runtime with DENY INSERT/UPDATE/DELETE
-- on dbo.Cities and dbo.Areas, which blocks admin location CRUD even when
-- locations.manage is granted. V202603300100 only granted DML to tijarahjo_app_role.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Cities', N'U') IS NOT NULL
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Cities TO tijarahjo_app_role;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
    BEGIN
        REVOKE INSERT, UPDATE, DELETE ON dbo.Cities FROM tijarahjo_app_runtime;
        GRANT INSERT, UPDATE, DELETE ON dbo.Cities TO tijarahjo_app_runtime;
    END

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_readonly_role') IS NOT NULL
        GRANT SELECT ON dbo.Cities TO tijarahjo_readonly_role;
END
GO

IF OBJECT_ID(N'dbo.Areas', N'U') IS NOT NULL
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.Areas TO tijarahjo_app_role;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
    BEGIN
        REVOKE INSERT, UPDATE, DELETE ON dbo.Areas FROM tijarahjo_app_runtime;
        GRANT INSERT, UPDATE, DELETE ON dbo.Areas TO tijarahjo_app_runtime;
    END

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_readonly_role') IS NOT NULL
        GRANT SELECT ON dbo.Areas TO tijarahjo_readonly_role;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202606050002__grant_locations_runtime_access.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202606050002__grant_locations_runtime_access.sql',
        SYSUTCDATETIME(),
        N'Grant Cities and Areas DML to tijarahjo_app_role and tijarahjo_app_runtime'
    );
END
GO

PRINT 'Granted Cities and Areas access for application runtime roles.';
GO
