USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying normalized search columns and prefix index strategy...';
GO

-- ============================================================
-- 1) TbPosts normalized search columns + indexes
-- ============================================================
IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbPosts', N'SearchTitleNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbPosts
        ADD SearchTitleNormalized AS
            CONVERT(NVARCHAR(200), UPPER(LTRIM(RTRIM(ISNULL(PostTitle, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'SearchDescriptionPrefixNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbPosts
        ADD SearchDescriptionPrefixNormalized AS
            CONVERT(NVARCHAR(450), UPPER(LEFT(LTRIM(RTRIM(ISNULL(PostDescription, N''))), 450)))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'City') IS NOT NULL
       AND COL_LENGTH(N'dbo.TbPosts', N'SearchCityNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbPosts
        ADD SearchCityNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(City, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'Area') IS NOT NULL
       AND COL_LENGTH(N'dbo.TbPosts', N'SearchAreaNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbPosts
        ADD SearchAreaNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(Area, N'')))))
            PERSISTED;
    END
END
GO

IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbPosts', N'SearchTitleNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPosts_SearchTitleNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbPosts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchTitleNormalized
        ON dbo.TbPosts (SearchTitleNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views);
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'SearchDescriptionPrefixNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPosts_SearchDescriptionPrefixNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbPosts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchDescriptionPrefixNormalized
        ON dbo.TbPosts (SearchDescriptionPrefixNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views);
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'SearchCityNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPosts_SearchCityNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbPosts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchCityNormalized
        ON dbo.TbPosts (SearchCityNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views);
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'SearchAreaNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPosts_SearchAreaNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbPosts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchAreaNormalized
        ON dbo.TbPosts (SearchAreaNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views);
    END
END
GO

-- ============================================================
-- 2) TbItemCategories normalized search columns + indexes
-- ============================================================
IF OBJECT_ID(N'dbo.TbItemCategories', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbItemCategories', N'SearchCategoryNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbItemCategories
        ADD SearchCategoryNameNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(CategoryName, N'')))))
            PERSISTED;
    END
END
GO

IF OBJECT_ID(N'dbo.TbItemCategories', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TbItemCategories', N'SearchCategoryNameNormalized') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbItemCategories_SearchCategoryNameNormalized'
          AND object_id = OBJECT_ID(N'dbo.TbItemCategories')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_TbItemCategories_SearchCategoryNameNormalized
    ON dbo.TbItemCategories (SearchCategoryNameNormalized, IsDeleted)
    INCLUDE (CategoryID, CategoryName);
END
GO

-- ============================================================
-- 3) TbUsers normalized search columns + indexes
-- ============================================================
IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbUsers', N'SearchFirstNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbUsers
        ADD SearchFirstNameNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(FirstName, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.TbUsers', N'SearchLastNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbUsers
        ADD SearchLastNameNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(LastName, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.TbUsers', N'SearchFullNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.TbUsers
        ADD SearchFullNameNormalized AS
            CONVERT(NVARCHAR(201), UPPER(LTRIM(RTRIM(CONCAT(ISNULL(FirstName, N''), N' ', ISNULL(LastName, N''))))))
            PERSISTED;
    END
END
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbUsers', N'SearchFirstNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbUsers_SearchFirstNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbUsers_SearchFirstNameNormalized
        ON dbo.TbUsers (SearchFirstNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, LastName, Email);
    END

    IF COL_LENGTH(N'dbo.TbUsers', N'SearchLastNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbUsers_SearchLastNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbUsers_SearchLastNameNormalized
        ON dbo.TbUsers (SearchLastNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, FirstName, Email);
    END

    IF COL_LENGTH(N'dbo.TbUsers', N'SearchFullNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbUsers_SearchFullNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbUsers_SearchFullNameNormalized
        ON dbo.TbUsers (SearchFullNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, FirstName, LastName, Email);
    END
END
GO

-- ============================================================
-- 4) Migration metadata
-- ============================================================
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    MERGE dbo.SchemaMigrations AS target
    USING (SELECT N'V202602191020__add_normalized_search_columns_and_indexes.sql' AS ScriptName) AS source
      ON target.ScriptName = source.ScriptName
    WHEN NOT MATCHED BY TARGET THEN
      INSERT (ScriptName, Notes)
      VALUES (source.ScriptName, N'Normalized search columns and prefix-search indexes');
END
GO

PRINT 'Normalized search columns and prefix index strategy completed.';
GO
