-- ============================================================================
-- Migration: Add filtered unique index on Users.Phone
--
-- Closes the race-condition gap where two concurrent registrations with the
-- same phone number could both pass the application-level pre-check before
-- either INSERT commits, resulting in duplicate phone entries.
--
-- Mirrors the existing UQ_Users_Email pattern:
--   - WHERE IsDeleted = 0  →  allows re-registration after account deletion
--   - WHERE Phone IS NOT NULL  →  phone is nullable; without this, multiple
--     NULL-phone users would violate uniqueness
-- ============================================================================

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Users')
          AND name = N'UQ_Users_Phone'
    )
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Phone
        ON dbo.Users(Phone)
        WHERE IsDeleted = 0 AND Phone IS NOT NULL;
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N'V202606150100__add_unique_phone_index')
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
        VALUES (
            N'V202606150100__add_unique_phone_index',
            N'Add filtered unique index UQ_Users_Phone on dbo.Users(Phone) WHERE IsDeleted=0 AND Phone IS NOT NULL.'
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
