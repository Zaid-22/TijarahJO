SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- Bootstrap override for the historical migration. The committed migration file
-- remains immutable; fresh bundle generation substitutes this valid trigger.

IF OBJECT_ID(N'dbo.TR_PostComments_MaxDepth', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_PostComments_MaxDepth;
GO

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
        THROW 51070, ''Comment nesting depth exceeds maximum allowed (3 levels).'', 1;
    END
END';

EXEC sp_executesql @CreateTriggerSql;
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604081400__postcomments_depth_guard.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604081400__postcomments_depth_guard.sql'', SYSUTCDATETIME(),
                    N''Trigger to enforce max 3-level nesting depth on PostComments'');
        END';
END
GO
