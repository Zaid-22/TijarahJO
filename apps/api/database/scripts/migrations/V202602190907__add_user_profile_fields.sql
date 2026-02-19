USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Add profile fields to TbUsers if they do not already exist.
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbUsers]')
      AND name = 'City'
)
BEGIN
    ALTER TABLE [dbo].[TbUsers]
    ADD [City] NVARCHAR(100) NULL;

    PRINT 'Column City added to TbUsers table.';
END
ELSE
BEGIN
    PRINT 'Column City already exists in TbUsers table.';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbUsers]')
      AND name = 'Area'
)
BEGIN
    ALTER TABLE [dbo].[TbUsers]
    ADD [Area] NVARCHAR(100) NULL;

    PRINT 'Column Area added to TbUsers table.';
END
ELSE
BEGIN
    PRINT 'Column Area already exists in TbUsers table.';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbUsers]')
      AND name = 'Bio'
)
BEGIN
    ALTER TABLE [dbo].[TbUsers]
    ADD [Bio] NVARCHAR(1000) NULL;

    PRINT 'Column Bio added to TbUsers table.';
END
ELSE
BEGIN
    PRINT 'Column Bio already exists in TbUsers table.';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbUsers]')
      AND name = 'Avatar'
)
BEGIN
    ALTER TABLE [dbo].[TbUsers]
    ADD [Avatar] NVARCHAR(MAX) NULL;

    PRINT 'Column Avatar added to TbUsers table.';
END
ELSE
BEGIN
    PRINT 'Column Avatar already exists in TbUsers table.';
END
GO

PRINT 'Stored procedure definitions are maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
GO
