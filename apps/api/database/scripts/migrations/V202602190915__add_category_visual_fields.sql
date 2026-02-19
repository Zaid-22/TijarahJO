USE [TijarahJoDB];
GO

IF COL_LENGTH('dbo.TbItemCategories', 'NameAr') IS NULL
BEGIN
    ALTER TABLE dbo.TbItemCategories ADD NameAr NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.TbItemCategories', 'Icon') IS NULL
BEGIN
    ALTER TABLE dbo.TbItemCategories ADD Icon NVARCHAR(100) NULL;
END
GO

IF COL_LENGTH('dbo.TbItemCategories', 'Color') IS NULL
BEGIN
    ALTER TABLE dbo.TbItemCategories ADD Color NVARCHAR(20) NULL;
END
GO

IF COL_LENGTH('dbo.TbItemCategories', 'Image') IS NULL
BEGIN
    ALTER TABLE dbo.TbItemCategories ADD Image NVARCHAR(1000) NULL;
END
GO

PRINT 'Stored procedure definitions are maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
GO
