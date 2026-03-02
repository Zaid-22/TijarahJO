-- =============================================================================
-- V202602251000__add_user_totp_2fa_columns.sql
-- Adds TOTP 2FA state/secret columns to dbo.Users.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying user TOTP 2FA schema migration...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
    BEGIN
        THROW 51091, 'Users table was not found. Cannot add 2FA columns.', 1;
    END

    IF COL_LENGTH(N'dbo.Users', N'TwoFactorEnabled') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD TwoFactorEnabled BIT NOT NULL
            CONSTRAINT DF_Users_TwoFactorEnabled DEFAULT 0;
    END

    IF COL_LENGTH(N'dbo.Users', N'TwoFactorSecret') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD TwoFactorSecret NVARCHAR(512) NULL;
    END

    IF COL_LENGTH(N'dbo.Users', N'TwoFactorPendingSecret') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD TwoFactorPendingSecret NVARCHAR(512) NULL;
    END

    EXEC sp_executesql N'
        UPDATE dbo.Users
        SET TwoFactorEnabled = 0
        WHERE TwoFactorEnabled = 1
          AND (TwoFactorSecret IS NULL OR LEN(LTRIM(RTRIM(TwoFactorSecret))) = 0);
    ';

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602251000__add_user_totp_2fa_columns.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202602251000__add_user_totp_2fa_columns.sql',
            SYSUTCDATETIME(),
            N'Adds TwoFactorEnabled, TwoFactorSecret, and TwoFactorPendingSecret columns to Users'
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

PRINT 'User TOTP 2FA schema migration complete.';
GO
