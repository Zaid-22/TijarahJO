-- =============================================================================
-- V202606040001 — Grant PostComments access for runtime app principals
-- ATOMICITY_EXCEPTION: Permission DCL with GO-batched role checks.
-- PostComments is created in BASE_SCHEMA.sql before migrations run, so
-- V202604010000 skips its GRANT block. Production also uses tijarahjo_app_runtime
-- with explicit table grants that never included PostComments.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.PostComments', N'U') IS NOT NULL
BEGIN
    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PostComments TO tijarahjo_app_role;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PostComments TO tijarahjo_app_runtime;

    IF DATABASE_PRINCIPAL_ID(N'tijarahjo_readonly_role') IS NOT NULL
        GRANT SELECT ON dbo.PostComments TO tijarahjo_readonly_role;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202606040001__postcomments_runtime_access.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202606040001__postcomments_runtime_access.sql',
        SYSUTCDATETIME(),
        N'Grant PostComments DML to tijarahjo_app_role and tijarahjo_app_runtime'
    );
END
GO

PRINT 'Granted PostComments access for application runtime roles.';
GO
