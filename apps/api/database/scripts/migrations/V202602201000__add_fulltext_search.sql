USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying full-text search migration...';
GO

DECLARE @FullTextInstalled INT = 0;

BEGIN TRY
    SET @FullTextInstalled = CAST(ISNULL(FULLTEXTSERVICEPROPERTY('IsFullTextInstalled'), 0) AS INT);
END TRY
BEGIN CATCH
    SET @FullTextInstalled = 0;
END CATCH

IF @FullTextInstalled = 1
BEGIN
    BEGIN TRY
        EXEC(N'
IF NOT EXISTS (
    SELECT 1
    FROM sys.fulltext_catalogs
    WHERE name = N''TijarahJoCatalog''
)
BEGIN
    CREATE FULLTEXT CATALOG TijarahJoCatalog AS DEFAULT;
END');

        EXEC(N'
IF OBJECT_ID(N''dbo.Posts'', N''U'') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE object_id = OBJECT_ID(N''dbo.Posts'')
          AND name = N''PK_Posts''
          AND is_unique = 1
   )
   AND NOT EXISTS (
        SELECT 1
        FROM sys.fulltext_indexes
        WHERE object_id = OBJECT_ID(N''dbo.Posts'')
   )
BEGIN
    CREATE FULLTEXT INDEX ON dbo.Posts
    (
        PostTitle LANGUAGE 1033,
        PostDescription LANGUAGE 1033
    )
    KEY INDEX PK_Posts
    WITH STOPLIST = SYSTEM;
END');

        PRINT 'Full-text search configured for dbo.Posts.';
    END TRY
    BEGIN CATCH
        PRINT CONCAT(
            'Full-text setup skipped due to runtime error ',
            ERROR_NUMBER(),
            ': ',
            ERROR_MESSAGE()
        );
    END CATCH
END
ELSE
BEGIN
    PRINT 'Full-text feature is not installed on this SQL Server instance; skipping.';
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602201000__add_fulltext_search.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202602201000__add_fulltext_search.sql',
        SYSUTCDATETIME(),
        N'Adds SQL Server full-text catalog/index for large catalog search acceleration'
    );
END
GO

PRINT 'Full-text search migration complete.';
GO
