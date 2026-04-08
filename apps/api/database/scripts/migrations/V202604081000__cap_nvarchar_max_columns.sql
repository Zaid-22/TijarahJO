USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- ATOMICITY_EXCEPTION: Idempotent DDL/DML with GO-batched statements.
-- =============================================================================
-- V202604081000 — Cap NVARCHAR(MAX) columns to realistic bounded lengths
-- DBRE Audit: Findings 7, 12
-- =============================================================================
-- NVARCHAR(MAX) stores data off-row in LOB pages when >8000 bytes, causing
-- extra I/O. Capping to realistic maximums keeps data in-row and improves
-- scan performance.
--
-- Pre-check: Each ALTER is guarded by a max-length verification to ensure
-- no existing data exceeds the new limit.

-- ---------------------------------------------------------------------------
-- 1. Posts.PostDescription: NVARCHAR(MAX) → NVARCHAR(4000)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Posts WHERE LEN(PostDescription) > 4000)
BEGIN
    IF COL_LENGTH(N'dbo.Posts', N'SearchDescriptionPrefixNormalized') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.Posts DROP COLUMN SearchDescriptionPrefixNormalized;
    END

    ALTER TABLE dbo.Posts ALTER COLUMN PostDescription NVARCHAR(4000) NULL;

    ALTER TABLE dbo.Posts ADD SearchDescriptionPrefixNormalized AS
        UPPER(SUBSTRING(PostDescription, 1, 100)) PERSISTED;
END
GO

-- ---------------------------------------------------------------------------
-- 2. Messages.Content: NVARCHAR(MAX) → NVARCHAR(4000)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Messages WHERE LEN(Content) > 4000)
BEGIN
    ALTER TABLE dbo.Messages ALTER COLUMN Content NVARCHAR(4000) NOT NULL;
END
GO

-- ---------------------------------------------------------------------------
-- 3. SystemSettings.Value: NVARCHAR(MAX) → NVARCHAR(4000)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE LEN(Value) > 4000)
BEGIN
    ALTER TABLE dbo.SystemSettings ALTER COLUMN Value NVARCHAR(4000) NOT NULL;
END
GO

-- ---------------------------------------------------------------------------
-- 4. Notifications.PayloadJson: NVARCHAR(MAX) → NVARCHAR(2000)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.Notifications WHERE LEN(PayloadJson) > 2000)
BEGIN
    ALTER TABLE dbo.Notifications ALTER COLUMN PayloadJson NVARCHAR(2000) NULL;
END
GO

-- ---------------------------------------------------------------------------
-- 5. HeroBanners.ImageUrl: NVARCHAR(MAX) → NVARCHAR(2048)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.HeroBanners WHERE LEN(ImageUrl) > 2048)
BEGIN
    ALTER TABLE dbo.HeroBanners ALTER COLUMN ImageUrl NVARCHAR(2048) NOT NULL;
END
GO

-- ---------------------------------------------------------------------------
-- Track migration
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604081000__cap_nvarchar_max_columns.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604081000__cap_nvarchar_max_columns.sql'', SYSUTCDATETIME(), N''Cap NVARCHAR(MAX) columns to bounded lengths'');
        END';
END
GO

