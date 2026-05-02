USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO
SET XACT_ABORT ON;

-- Allow comment abuse reports now that comments can be reported from post details.
-- Chat reports are intentionally not supported because admin chat inspection was removed.
BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Reports', N'U') IS NOT NULL
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM sys.check_constraints
            WHERE name = N'CK_Reports_Type'
              AND parent_object_id = OBJECT_ID(N'dbo.Reports')
        )
        BEGIN
            ALTER TABLE dbo.Reports DROP CONSTRAINT CK_Reports_Type;
        END;

        DELETE FROM dbo.Reports
        WHERE ReportType = N'CHAT';

        ALTER TABLE dbo.Reports
            ADD CONSTRAINT CK_Reports_Type
            CHECK (ReportType IN (N'LISTING', N'USER', N'REVIEW', N'COMMENT'));
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
    BEGIN
        EXEC sp_executesql N'
            IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604300001__allow_comment_reports.sql'')
            BEGIN
                INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
                VALUES (
                    N''V202604300001__allow_comment_reports.sql'',
                    SYSUTCDATETIME(),
                    N''Allow COMMENT as a report type for post comment moderation and remove unsupported CHAT reports.''
                );
            END';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
GO
