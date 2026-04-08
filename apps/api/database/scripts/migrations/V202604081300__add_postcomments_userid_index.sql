-- ATOMICITY_EXCEPTION: Single idempotent DDL statement.
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V202604081300 — Add PostComments.UserID index for admin queries
-- Senior DB Audit finding O1.
-- =============================================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PostComments')
      AND name = N'IX_PostComments_UserID_Active'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostComments_UserID_Active
    ON dbo.PostComments (UserID, CreatedAt DESC)
    INCLUDE (PostID, Content)
    WHERE IsDeleted = 0;

    PRINT 'Created index: IX_PostComments_UserID_Active';
END
GO

-- Track migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604081300__add_postcomments_userid_index.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604081300__add_postcomments_userid_index.sql'', SYSUTCDATETIME(),
                    N''Add filtered index on PostComments.UserID for admin user-comment queries'');
        END';
END
GO
