USE TijarahJoDB;
GO

-- =============================================================================
-- Fix: Cap Review.Comment to NVARCHAR(4000) from NVARCHAR(MAX)
-- Reason: Review comments should have a reasonable length limit
-- =============================================================================

ALTER TABLE dbo.Reviews ALTER COLUMN Comment NVARCHAR(4000) NULL;
GO

PRINT 'Changed Reviews.Comment from NVARCHAR(MAX) to NVARCHAR(4000).';
GO

-- Record migration
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
