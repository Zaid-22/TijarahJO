-- =============================================================================
-- V202602241700__enforce_posts_status_domain.sql
-- Enforces post lifecycle status domain at DB level to prevent legacy writes:
-- allowed persisted values are only 0 (ACTIVE), 1 (BLOCKED), 3 (SOLD).
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying posts status domain enforcement migration...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
    BEGIN
        THROW 51032, 'Posts table was not found. Cannot enforce status domain.', 1;
    END

    -- Normalize any legacy rows before adding the guard.
    UPDATE dbo.Posts
    SET IsDeleted = 1,
        Status = 0
    WHERE Status = 2;

    IF EXISTS (SELECT 1 FROM dbo.Posts WHERE Status NOT IN (0, 1, 3))
    BEGIN
        THROW 51031, 'Posts contain unsupported status values. Expected only 0, 1, 3.', 1;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_Status_NoLegacyDeleted'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        ALTER TABLE dbo.Posts WITH CHECK CHECK CONSTRAINT CK_Posts_Status_NoLegacyDeleted;
    END
    ELSE
    BEGIN
        ALTER TABLE dbo.Posts WITH CHECK
        ADD CONSTRAINT CK_Posts_Status_NoLegacyDeleted CHECK (Status IN (0, 1, 3));

        ALTER TABLE dbo.Posts CHECK CONSTRAINT CK_Posts_Status_NoLegacyDeleted;
    END

    IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.PostStatusLookup
        WHERE StatusID = 2;
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N'V202602241700__enforce_posts_status_domain.sql')
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202602241700__enforce_posts_status_domain.sql',
            SYSUTCDATETIME(),
            N'Adds CK_Posts_Status_NoLegacyDeleted and normalizes legacy Status=2 rows'
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
