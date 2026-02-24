USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying user external identities migration...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.UserExternalIdentities
        (
            UserExternalIdentityID INT           IDENTITY(1,1) CONSTRAINT PK_UserExternalIdentities PRIMARY KEY,
            UserID                 INT           NOT NULL,
            Provider               NVARCHAR(50)  NOT NULL,
            ProviderSubject        NVARCHAR(255) NOT NULL,
            ProviderEmail          NVARCHAR(255) NULL,
            CreatedAt              DATETIME2     NOT NULL CONSTRAINT DF_UserExternalIdentities_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt              DATETIME2     NOT NULL CONSTRAINT DF_UserExternalIdentities_UpdatedAt DEFAULT SYSUTCDATETIME()
        );
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.UserExternalIdentities', N'ProviderEmail') IS NULL
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities ADD ProviderEmail NVARCHAR(255) NULL;
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.UserExternalIdentities', N'CreatedAt') IS NULL
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities
        ADD CreatedAt DATETIME2 NOT NULL
            CONSTRAINT DF_UserExternalIdentities_CreatedAt DEFAULT SYSUTCDATETIME();
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND COL_LENGTH(N'dbo.UserExternalIdentities', N'UpdatedAt') IS NULL
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities
        ADD UpdatedAt DATETIME2 NOT NULL
            CONSTRAINT DF_UserExternalIdentities_UpdatedAt DEFAULT SYSUTCDATETIME();
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.foreign_keys
           WHERE name = N'FK_UserExternalIdentities_UserID'
             AND parent_object_id = OBJECT_ID(N'dbo.UserExternalIdentities')
       )
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities
            ADD CONSTRAINT FK_UserExternalIdentities_UserID
            FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID);
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.check_constraints
           WHERE name = N'CK_UserExternalIdentities_Provider_NotBlank'
             AND parent_object_id = OBJECT_ID(N'dbo.UserExternalIdentities')
       )
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities
            ADD CONSTRAINT CK_UserExternalIdentities_Provider_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Provider))) > 0);
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.check_constraints
           WHERE name = N'CK_UserExternalIdentities_Subject_NotBlank'
             AND parent_object_id = OBJECT_ID(N'dbo.UserExternalIdentities')
       )
    BEGIN
        ALTER TABLE dbo.UserExternalIdentities
            ADD CONSTRAINT CK_UserExternalIdentities_Subject_NotBlank
            CHECK (LEN(LTRIM(RTRIM(ProviderSubject))) > 0);
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.indexes
           WHERE object_id = OBJECT_ID(N'dbo.UserExternalIdentities')
             AND name = N'UQ_UserExternalIdentities_Provider_Subject'
       )
    BEGIN
        CREATE UNIQUE INDEX UQ_UserExternalIdentities_Provider_Subject
            ON dbo.UserExternalIdentities (Provider, ProviderSubject);
    END

    IF OBJECT_ID(N'dbo.UserExternalIdentities', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM sys.indexes
           WHERE object_id = OBJECT_ID(N'dbo.UserExternalIdentities')
             AND name = N'UQ_UserExternalIdentities_User_Provider'
       )
    BEGIN
        CREATE UNIQUE INDEX UQ_UserExternalIdentities_User_Provider
            ON dbo.UserExternalIdentities (UserID, Provider);
    END

    IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app_role')
    BEGIN
        GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.UserExternalIdentities TO tijarahjo_app_role;
    END

    IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_readonly_role')
    BEGIN
        GRANT SELECT ON dbo.UserExternalIdentities TO tijarahjo_readonly_role;
    END

    IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'tijarahjo_app_runtime')
    BEGIN
        GRANT SELECT, INSERT, UPDATE ON dbo.UserExternalIdentities TO [tijarahjo_app_runtime];
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602241000__add_user_external_identities.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602241000__add_user_external_identities.sql',
            SYSUTCDATETIME(),
            N'Adds provider-sub mapping table for external OAuth identities (Google account linking)'
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    ;THROW;
END CATCH
GO

PRINT 'User external identities migration complete.';
GO
