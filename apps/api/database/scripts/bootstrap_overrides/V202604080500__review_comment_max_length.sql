USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- Bootstrap override for the historical migration. The committed migration file
-- remains immutable; fresh bundle generation substitutes this fixed variant.

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ReviewedUserID_Active' AND object_id = OBJECT_ID(N'dbo.Reviews'))
BEGIN
    DROP INDEX IX_Reviews_ReviewedUserID_Active ON dbo.Reviews;
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ReviewedUserID' AND object_id = OBJECT_ID(N'dbo.Reviews'))
BEGIN
    DROP INDEX IX_Reviews_ReviewedUserID ON dbo.Reviews;
END
GO

ALTER TABLE dbo.Reviews ALTER COLUMN Comment NVARCHAR(4000) NULL;
GO

CREATE NONCLUSTERED INDEX IX_Reviews_ReviewedUserID_Active
ON dbo.Reviews (ReviewedUserID, IsDeleted, CreatedAt DESC, ReviewID DESC)
INCLUDE (ReviewerID, Rating, Comment)
WHERE IsDeleted = 0;
GO

PRINT 'Changed Reviews.Comment from NVARCHAR(MAX) to NVARCHAR(4000) and recreated dependent index.';
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080500__review_comment_max_length.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080500__review_comment_max_length.sql'',
                    N''Capped Review.Comment to NVARCHAR(4000) from NVARCHAR(MAX)'');
        END';
END
GO
