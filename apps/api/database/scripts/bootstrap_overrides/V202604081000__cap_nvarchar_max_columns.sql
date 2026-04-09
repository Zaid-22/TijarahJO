USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- Bootstrap override for the historical migration. The committed migration file
-- remains immutable; fresh bundle generation substitutes this fixed variant.

IF EXISTS (SELECT 1 FROM dbo.Posts WHERE LEN(PostDescription) > 4000)
BEGIN
    THROW 51081, 'Posts.PostDescription contains values longer than 4000 characters.', 1;
END
GO

IF EXISTS (SELECT 1 FROM dbo.Messages WHERE LEN(Content) > 4000)
BEGIN
    THROW 51082, 'Messages.Content contains values longer than 4000 characters.', 1;
END
GO

IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE LEN(Value) > 4000)
BEGIN
    THROW 51083, 'SystemSettings.Value contains values longer than 4000 characters.', 1;
END
GO

IF EXISTS (SELECT 1 FROM dbo.Notifications WHERE LEN(PayloadJson) > 2000)
BEGIN
    THROW 51084, 'Notifications.PayloadJson contains values longer than 2000 characters.', 1;
END
GO

IF EXISTS (SELECT 1 FROM dbo.HeroBanners WHERE LEN(ImageUrl) > 2048)
BEGIN
    THROW 51085, 'HeroBanners.ImageUrl contains values longer than 2048 characters.', 1;
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchDescription_Active' AND object_id = OBJECT_ID(N'dbo.Posts'))
BEGIN
    DROP INDEX IX_Posts_SearchDescription_Active ON dbo.Posts;
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchDescriptionPrefixNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
BEGIN
    DROP INDEX IX_Posts_SearchDescriptionPrefixNormalized ON dbo.Posts;
END
GO

IF COL_LENGTH(N'dbo.Posts', N'SearchDescriptionPrefixNormalized') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Posts DROP COLUMN SearchDescriptionPrefixNormalized;
END
GO

ALTER TABLE dbo.Posts ALTER COLUMN PostDescription NVARCHAR(4000) NULL;
GO

ALTER TABLE dbo.Messages ALTER COLUMN Content NVARCHAR(4000) NOT NULL;
GO

ALTER TABLE dbo.SystemSettings ALTER COLUMN Value NVARCHAR(4000) NOT NULL;
GO

ALTER TABLE dbo.Notifications ALTER COLUMN PayloadJson NVARCHAR(2000) NULL;
GO

ALTER TABLE dbo.HeroBanners ALTER COLUMN ImageUrl NVARCHAR(2048) NOT NULL;
GO

ALTER TABLE dbo.Posts ADD SearchDescriptionPrefixNormalized AS
    CONVERT(NVARCHAR(450), UPPER(LEFT(LTRIM(RTRIM(ISNULL(PostDescription, N''))), 450))) PERSISTED;
GO

CREATE NONCLUSTERED INDEX IX_Posts_SearchDescription_Active
ON dbo.Posts (SearchDescriptionPrefixNormalized, Status, CreatedAt DESC, PostID DESC)
INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID)
WHERE IsDeleted = 0;
GO

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
