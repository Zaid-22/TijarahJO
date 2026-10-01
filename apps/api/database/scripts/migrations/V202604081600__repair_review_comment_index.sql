SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
        THROW 51096, 'dbo.Reviews must exist before applying V202604081600.', 1;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ReviewedUserID_Active' AND object_id = OBJECT_ID(N'dbo.Reviews'))
        DROP INDEX IX_Reviews_ReviewedUserID_Active ON dbo.Reviews;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ReviewedUserID' AND object_id = OBJECT_ID(N'dbo.Reviews'))
        DROP INDEX IX_Reviews_ReviewedUserID ON dbo.Reviews;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Reviews')
          AND name = N'Comment'
          AND max_length <> 8000
    )
        ALTER TABLE dbo.Reviews ALTER COLUMN Comment NVARCHAR(4000) NULL;

    CREATE NONCLUSTERED INDEX IX_Reviews_ReviewedUserID_Active
    ON dbo.Reviews (ReviewedUserID, IsDeleted, CreatedAt DESC, ReviewID DESC)
    INCLUDE (ReviewerID, Rating, Comment)
    WHERE IsDeleted = 0;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202604081600__repair_review_comment_index.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202604081600__repair_review_comment_index.sql',
            SYSUTCDATETIME(),
            N'Repair the review comment migration by recreating the active review index with ReviewerID and bounded comment storage'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
