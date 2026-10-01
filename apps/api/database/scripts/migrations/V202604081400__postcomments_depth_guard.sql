-- ATOMICITY_EXCEPTION: Idempotent DDL with GO-batched statements.
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V202604081400 — PostComments nesting depth guard (max 3 levels)
-- Senior DB Audit finding O3.
-- =============================================================================
-- Prevents infinite comment nesting by rejecting INSERTs deeper than 3 levels.
-- Level 1: root comment (ParentCommentID IS NULL)
-- Level 2: reply to root
-- Level 3: reply to reply (max depth)

IF OBJECT_ID(N'dbo.TR_PostComments_MaxDepth', N'TR') IS NOT NULL
    DROP TRIGGER dbo.TR_PostComments_MaxDepth;
GO

CREATE TRIGGER dbo.TR_PostComments_MaxDepth
ON dbo.PostComments
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @maxDepth INT = 3;

    ;WITH Ancestry AS (
        SELECT i.CommentID, i.ParentCommentID, 1 AS Depth
        FROM inserted i
        WHERE i.ParentCommentID IS NOT NULL

        UNION ALL

        SELECT a.CommentID, pc.ParentCommentID, a.Depth + 1
        FROM Ancestry a
        INNER JOIN dbo.PostComments pc ON a.ParentCommentID = pc.CommentID
        WHERE pc.ParentCommentID IS NOT NULL
          AND a.Depth < @maxDepth + 1
    )
    IF EXISTS (SELECT 1 FROM Ancestry WHERE Depth > @maxDepth)
    BEGIN
        ;THROW 51070, 'Comment nesting depth exceeds maximum allowed (3 levels).', 1;
    END
END
GO

-- Track migration
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
