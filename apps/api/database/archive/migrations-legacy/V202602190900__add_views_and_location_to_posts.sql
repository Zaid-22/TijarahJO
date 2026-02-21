-- Add Views, City, and Area columns to TbPosts table
-- This enables tracking post views and storing location information

USE [TijarahJoDB]
GO

-- Step 1: Add Views column to TbPosts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TbPosts]') AND name = 'Views')
BEGIN
    ALTER TABLE [dbo].[TbPosts]
    ADD [Views] INT NOT NULL DEFAULT 0;
    PRINT 'Views column added to TbPosts table.';
END
ELSE
BEGIN
    PRINT 'Views column already exists in TbPosts table.';
END
GO

-- Step 2: Add City column to TbPosts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TbPosts]') AND name = 'City')
BEGIN
    ALTER TABLE [dbo].[TbPosts]
    ADD [City] NVARCHAR(100) NULL;
    PRINT 'City column added to TbPosts table.';
END
ELSE
BEGIN
    PRINT 'City column already exists in TbPosts table.';
END
GO

-- Step 3: Add Area column to TbPosts
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[dbo].[TbPosts]') AND name = 'Area')
BEGIN
    ALTER TABLE [dbo].[TbPosts]
    ADD [Area] NVARCHAR(100) NULL;
    PRINT 'Area column added to TbPosts table.';
END
ELSE
BEGIN
    PRINT 'Area column already exists in TbPosts table.';
END
GO

-- Step 4: Create index for views (useful for sorting by popularity)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TbPosts_Views' AND object_id = OBJECT_ID(N'[dbo].[TbPosts]'))
BEGIN
    CREATE INDEX [IX_TbPosts_Views] ON [dbo].[TbPosts]([Views] DESC);
    PRINT 'Index IX_TbPosts_Views created.';
END
ELSE
BEGIN
    PRINT 'Index IX_TbPosts_Views already exists.';
END
GO

-- Step 5: Create index for city (useful for location-based searches)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_TbPosts_City' AND object_id = OBJECT_ID(N'[dbo].[TbPosts]'))
BEGIN
    CREATE INDEX [IX_TbPosts_City] ON [dbo].[TbPosts]([City]);
    PRINT 'Index IX_TbPosts_City created.';
END
ELSE
BEGIN
    PRINT 'Index IX_TbPosts_City already exists.';
END
GO

PRINT 'All columns and indexes added successfully!';
PRINT 'Note: Existing posts will have Views = 0 and City/Area = NULL.';
GO

