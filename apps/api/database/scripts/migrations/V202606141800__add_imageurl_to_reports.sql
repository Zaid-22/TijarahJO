USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- Add ImageUrl column to Reports table for evidence image uploads
-- =============================================================================

IF NOT EXISTS (
    SELECT 1
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = 'dbo'
      AND TABLE_NAME   = 'Reports'
      AND COLUMN_NAME  = 'ImageUrl'
)
BEGIN
    ALTER TABLE dbo.Reports
        ADD ImageUrl NVARCHAR(500) NULL;
END
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202606141800__add_imageurl_to_reports.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202606141800__add_imageurl_to_reports.sql'',
                    N''Adds nullable ImageUrl column to Reports for evidence image uploads.'');
        END';
END
GO
