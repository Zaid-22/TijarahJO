-- V202606150200__add_email_verified_to_users.sql
-- Add IsEmailVerified column to dbo.Users for email verification feature.
-- All existing users are marked as verified to prevent lockout.

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Users')
          AND name = N'IsEmailVerified'
    )
    BEGIN
        ALTER TABLE dbo.Users ADD IsEmailVerified BIT NOT NULL
            CONSTRAINT DF_Users_IsEmailVerified DEFAULT 0;

        -- Deferred compilation: UPDATE references the new column which doesn't
        -- exist at batch-compile time. sp_executesql compiles at exec time,
        -- after the ALTER TABLE above has already run.
        EXEC sp_executesql N'UPDATE dbo.Users SET IsEmailVerified = 1;';
    END

    IF NOT EXISTS (
        SELECT 1 FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202606150200__add_email_verified_to_users'
    )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
        VALUES (
            N'V202606150200__add_email_verified_to_users',
            N'Add IsEmailVerified BIT NOT NULL DEFAULT 0 to dbo.Users; backfill existing rows to 1 (verified).'
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
