SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.PostComments', N'U') IS NULL
        THROW 51098, 'dbo.PostComments must exist before applying V202604081800.', 1;

    IF OBJECT_ID(N'dbo.TR_PostComments_MaxDepth', N'TR') IS NOT NULL
        DROP TRIGGER dbo.TR_PostComments_MaxDepth;

    DECLARE @CreateTriggerSql NVARCHAR(MAX) = N'
CREATE TRIGGER dbo.TR_PostComments_MaxDepth
ON dbo.PostComments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @maxDepth INT = 3;
    DECLARE @hasTooDeepComment BIT = 0;

    ;WITH Ancestry AS (
        SELECT i.CommentID, i.ParentCommentID, 1 AS Depth
        FROM inserted AS i
        WHERE i.ParentCommentID IS NOT NULL

        UNION ALL

        SELECT a.CommentID, pc.ParentCommentID, a.Depth + 1
        FROM Ancestry AS a
        INNER JOIN dbo.PostComments AS pc ON a.ParentCommentID = pc.CommentID
        WHERE pc.ParentCommentID IS NOT NULL
          AND a.Depth < @maxDepth + 1
    )
    SELECT @hasTooDeepComment =
        CASE
            WHEN MAX(CASE WHEN Depth > @maxDepth THEN 1 ELSE 0 END) = 1 THEN 1
            ELSE 0
        END
    FROM Ancestry;

    IF @hasTooDeepComment = 1
    BEGIN
        THROW 51070, ''Comment nesting depth exceeds maximum allowed (3 levels).'',
              1;
    END
END';

    EXEC sp_executesql @CreateTriggerSql;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202604081800__repair_postcomments_depth_trigger.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202604081800__repair_postcomments_depth_trigger.sql',
            SYSUTCDATETIME(),
            N'Repair the PostComments max-depth trigger with valid recursive ancestry evaluation'
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
