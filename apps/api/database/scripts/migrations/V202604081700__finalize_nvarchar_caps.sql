SET XACT_ABORT ON;
GO

BEGIN TRY
    IF EXISTS (SELECT 1 FROM dbo.Posts WHERE LEN(PostDescription) > 4000)
        THROW 51091, 'Posts.PostDescription contains values longer than 4000 characters.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Messages WHERE LEN(Content) > 4000)
        THROW 51092, 'Messages.Content contains values longer than 4000 characters.', 1;

    IF EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE LEN(Value) > 4000)
        THROW 51093, 'SystemSettings.Value contains values longer than 4000 characters.', 1;

    IF EXISTS (SELECT 1 FROM dbo.Notifications WHERE LEN(PayloadJson) > 2000)
        THROW 51094, 'Notifications.PayloadJson contains values longer than 2000 characters.', 1;

    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
       AND EXISTS (SELECT 1 FROM dbo.HeroBanners WHERE LEN(ImageUrl) > 2048)
        THROW 51095, 'HeroBanners.ImageUrl contains values longer than 2048 characters.', 1;

    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
        THROW 51097, 'dbo.Posts must exist before applying V202604081700.', 1;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchDescription_Active' AND object_id = OBJECT_ID(N'dbo.Posts'))
        DROP INDEX IX_Posts_SearchDescription_Active ON dbo.Posts;

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchDescriptionPrefixNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
        DROP INDEX IX_Posts_SearchDescriptionPrefixNormalized ON dbo.Posts;

    IF COL_LENGTH(N'dbo.Posts', N'SearchDescriptionPrefixNormalized') IS NOT NULL
        ALTER TABLE dbo.Posts DROP COLUMN SearchDescriptionPrefixNormalized;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Posts')
          AND name = N'PostDescription'
          AND max_length <> 8000
    )
        ALTER TABLE dbo.Posts ALTER COLUMN PostDescription NVARCHAR(4000) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Messages')
          AND name = N'Content'
          AND max_length <> 8000
    )
        ALTER TABLE dbo.Messages ALTER COLUMN Content NVARCHAR(4000) NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.SystemSettings')
          AND name = N'Value'
          AND max_length <> 8000
    )
        ALTER TABLE dbo.SystemSettings ALTER COLUMN Value NVARCHAR(4000) NOT NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Notifications')
          AND name = N'PayloadJson'
          AND max_length <> 4000
    )
        ALTER TABLE dbo.Notifications ALTER COLUMN PayloadJson NVARCHAR(2000) NULL;

    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
       AND EXISTS (
           SELECT 1
           FROM sys.columns
           WHERE object_id = OBJECT_ID(N'dbo.HeroBanners')
             AND name = N'ImageUrl'
             AND max_length <> 4096
       )
        ALTER TABLE dbo.HeroBanners ALTER COLUMN ImageUrl NVARCHAR(2048) NOT NULL;

    ALTER TABLE dbo.Posts ADD SearchDescriptionPrefixNormalized AS
        CONVERT(NVARCHAR(450), UPPER(LEFT(LTRIM(RTRIM(ISNULL(PostDescription, N''))), 450))) PERSISTED;

    CREATE NONCLUSTERED INDEX IX_Posts_SearchDescription_Active
    ON dbo.Posts (SearchDescriptionPrefixNormalized, Status, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202604081700__finalize_nvarchar_caps.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202604081700__finalize_nvarchar_caps.sql',
            SYSUTCDATETIME(),
            N'Finalize bounded NVARCHAR column sizes and rebuild the post description search index with explicit data-length validation'
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
