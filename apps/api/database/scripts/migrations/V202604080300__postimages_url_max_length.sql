USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- Fix: Align PostImageURL SQL type with EF Core HasMaxLength(2048)
-- Reason: SQL had NVARCHAR(MAX), EF had HasMaxLength(2048) — mismatch
-- =============================================================================

ALTER TABLE dbo.PostImages ALTER COLUMN PostImageURL NVARCHAR(2048) NOT NULL;
GO

PRINT 'Changed PostImages.PostImageURL from NVARCHAR(MAX) to NVARCHAR(2048).';
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080300__postimages_url_max_length.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080300__postimages_url_max_length.sql'',
                    N''Changed PostImageURL from NVARCHAR(MAX) to NVARCHAR(2048) to match EF Core mapping'');
        END';
END
GO
