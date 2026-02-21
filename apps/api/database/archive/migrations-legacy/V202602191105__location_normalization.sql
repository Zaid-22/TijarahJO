-- V202602191105__location_normalization.sql
-- Extracts string-based City and Area data into normalized lookup tables.
-- IDEMPOTENT: All DDL operations are guarded with IF NOT EXISTS / IF COL_LENGTH checks.

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying location normalization (idempotent)...';
GO

-- ============================================================
-- 1. Create Lookup Tables (guarded)
-- ============================================================
IF OBJECT_ID(N'dbo.Cities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cities
    (
        CityID   INT           IDENTITY(1,1) NOT NULL CONSTRAINT PK_Cities PRIMARY KEY,
        CityName NVARCHAR(100) NOT NULL CONSTRAINT UQ_Cities_CityName UNIQUE
    );
    PRINT 'Created dbo.Cities.';
END
GO

IF OBJECT_ID(N'dbo.Areas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Areas
    (
        AreaID   INT           IDENTITY(1,1) NOT NULL CONSTRAINT PK_Areas PRIMARY KEY,
        CityID   INT           NOT NULL,
        AreaName NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_Areas_Cities   FOREIGN KEY (CityID) REFERENCES dbo.Cities(CityID),
        CONSTRAINT UQ_Areas_City_Area UNIQUE (CityID, AreaName)
    );
    PRINT 'Created dbo.Areas.';
END
GO

-- ============================================================
-- 2. Migrate existing Cities from Users (if City column still exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Users', N'City') IS NOT NULL
BEGIN
    INSERT INTO dbo.Cities (CityName)
    SELECT DISTINCT LTRIM(RTRIM(City))
    FROM dbo.Users
    WHERE City IS NOT NULL
      AND LTRIM(RTRIM(City)) <> ''
      AND LTRIM(RTRIM(City)) NOT IN (SELECT CityName FROM dbo.Cities);

    INSERT INTO dbo.Areas (CityID, AreaName)
    SELECT DISTINCT c.CityID, LTRIM(RTRIM(u.Area))
    FROM dbo.Users u
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(u.City))
    WHERE u.Area IS NOT NULL AND LTRIM(RTRIM(u.Area)) <> ''
      AND u.City IS NOT NULL AND LTRIM(RTRIM(u.City)) <> ''
      AND NOT EXISTS (
          SELECT 1 FROM dbo.Areas a
          WHERE a.CityID = c.CityID AND a.AreaName = LTRIM(RTRIM(u.Area))
      );
END
GO

-- ============================================================
-- 3. Migrate any stragglers from Posts (if City column still exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Posts', N'City') IS NOT NULL
BEGIN
    INSERT INTO dbo.Cities (CityName)
    SELECT DISTINCT LTRIM(RTRIM(City))
    FROM dbo.Posts
    WHERE City IS NOT NULL AND LTRIM(RTRIM(City)) <> ''
      AND LTRIM(RTRIM(City)) NOT IN (SELECT CityName FROM dbo.Cities);

    INSERT INTO dbo.Areas (CityID, AreaName)
    SELECT DISTINCT c.CityID, LTRIM(RTRIM(p.Area))
    FROM dbo.Posts p
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(p.City))
    WHERE p.Area IS NOT NULL AND LTRIM(RTRIM(p.Area)) <> ''
      AND p.City IS NOT NULL AND LTRIM(RTRIM(p.City)) <> ''
      AND NOT EXISTS (
          SELECT 1 FROM dbo.Areas a
          WHERE a.CityID = c.CityID AND a.AreaName = LTRIM(RTRIM(p.Area))
      );
END
GO

-- ============================================================
-- 4. Add nullable lookup FKs to Users (guarded)
-- ============================================================
IF COL_LENGTH(N'dbo.Users', N'CityID') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD CityID INT NULL;
    PRINT 'Added CityID column to Users.';
END
GO

IF COL_LENGTH(N'dbo.Users', N'AreaID') IS NULL
BEGIN
    ALTER TABLE dbo.Users ADD AreaID INT NULL;
    PRINT 'Added AreaID column to Users.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Users_Cities' AND parent_object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Cities FOREIGN KEY (CityID) REFERENCES dbo.Cities(CityID);
    PRINT 'Added FK_Users_Cities.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Users_Areas' AND parent_object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
    ALTER TABLE dbo.Users ADD CONSTRAINT FK_Users_Areas FOREIGN KEY (AreaID) REFERENCES dbo.Areas(AreaID);
    PRINT 'Added FK_Users_Areas.';
END
GO

-- ============================================================
-- 5. Backfill User FKs (only if string City column exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Users', N'City') IS NOT NULL
BEGIN
    UPDATE u SET CityID = c.CityID
    FROM dbo.Users u
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(u.City));

    UPDATE u SET AreaID = a.AreaID
    FROM dbo.Users u
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(u.City))
    INNER JOIN dbo.Areas a ON a.CityID = c.CityID AND a.AreaName = LTRIM(RTRIM(u.Area));
END
GO

-- ============================================================
-- 6. Add nullable lookup FKs to Posts (guarded)
-- ============================================================
IF COL_LENGTH(N'dbo.Posts', N'CityID') IS NULL
BEGIN
    ALTER TABLE dbo.Posts ADD CityID INT NULL;
    PRINT 'Added CityID column to Posts.';
END
GO

IF COL_LENGTH(N'dbo.Posts', N'AreaID') IS NULL
BEGIN
    ALTER TABLE dbo.Posts ADD AreaID INT NULL;
    PRINT 'Added AreaID column to Posts.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Posts_Cities' AND parent_object_id = OBJECT_ID(N'dbo.Posts')
)
BEGIN
    ALTER TABLE dbo.Posts ADD CONSTRAINT FK_Posts_Cities FOREIGN KEY (CityID) REFERENCES dbo.Cities(CityID);
    PRINT 'Added FK_Posts_Cities.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Posts_Areas' AND parent_object_id = OBJECT_ID(N'dbo.Posts')
)
BEGIN
    ALTER TABLE dbo.Posts ADD CONSTRAINT FK_Posts_Areas FOREIGN KEY (AreaID) REFERENCES dbo.Areas(AreaID);
    PRINT 'Added FK_Posts_Areas.';
END
GO

-- ============================================================
-- 7. Backfill Post FKs (only if string City column exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Posts', N'City') IS NOT NULL
BEGIN
    UPDATE p SET CityID = c.CityID
    FROM dbo.Posts p
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(p.City));

    UPDATE p SET AreaID = a.AreaID
    FROM dbo.Posts p
    INNER JOIN dbo.Cities c ON c.CityName = LTRIM(RTRIM(p.City))
    INNER JOIN dbo.Areas a ON a.CityID = c.CityID AND a.AreaName = LTRIM(RTRIM(p.Area));
END
GO

-- ============================================================
-- 8. Drop dependent computed columns and indexes from old string columns
-- ============================================================
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbPosts_SearchCore' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_TbPosts_SearchCore ON dbo.Posts;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbPosts_SearchCity' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_TbPosts_SearchCity ON dbo.Posts;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbPosts_SearchCityNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_TbPosts_SearchCityNormalized ON dbo.Posts;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbPosts_SearchAreaNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_TbPosts_SearchAreaNormalized ON dbo.Posts;

IF COL_LENGTH(N'dbo.Posts', N'SearchCityNormalized') IS NOT NULL
    ALTER TABLE dbo.Posts DROP COLUMN SearchCityNormalized;

IF COL_LENGTH(N'dbo.Posts', N'SearchAreaNormalized') IS NOT NULL
    ALTER TABLE dbo.Posts DROP COLUMN SearchAreaNormalized;
GO

-- ============================================================
-- 9. Drop old string columns (only if they still exist)
-- ============================================================
IF COL_LENGTH(N'dbo.Users', N'City') IS NOT NULL
    ALTER TABLE dbo.Users DROP COLUMN City;

IF COL_LENGTH(N'dbo.Users', N'Area') IS NOT NULL
    ALTER TABLE dbo.Users DROP COLUMN Area;

IF COL_LENGTH(N'dbo.Posts', N'City') IS NOT NULL
    ALTER TABLE dbo.Posts DROP COLUMN City;

IF COL_LENGTH(N'dbo.Posts', N'Area') IS NOT NULL
    ALTER TABLE dbo.Posts DROP COLUMN Area;
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602191105__location_normalization.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
    VALUES (N'V202602191105__location_normalization.sql', N'Location normalized to Cities/Areas lookup tables');
END
GO

PRINT 'Location normalization complete.';
GO
