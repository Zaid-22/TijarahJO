USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying full-text support audit note migration...';
GO

DECLARE @FullTextInstalled BIT = 0;

BEGIN TRY
    SET @FullTextInstalled = CASE
        WHEN CAST(ISNULL(FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'), 0) AS INT) = 1 THEN 1
        ELSE 0
    END;
END TRY
BEGIN CATCH
    SET @FullTextInstalled = 0;
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602221230__fulltext_support_audit_note.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602221230__fulltext_support_audit_note.sql',
            SYSUTCDATETIME(),
            CASE
                WHEN @FullTextInstalled = 1
                    THEN N'Full-text feature detected on this SQL Server instance; canonical full-text migration is eligible.'
                ELSE N'Full-text feature unavailable on this SQL Server instance; canonical migration chain proceeds without full-text index creation.'
            END
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

PRINT 'Full-text support audit note migration complete.';
GO
