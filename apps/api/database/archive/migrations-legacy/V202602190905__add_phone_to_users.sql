USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Add Phone column to TbUsers if it does not already exist.
IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbUsers]')
      AND name = 'Phone'
)
BEGIN
    ALTER TABLE [dbo].[TbUsers]
    ADD [Phone] NVARCHAR(20) NULL;

    PRINT 'Column Phone added to TbUsers table.';
END
ELSE
BEGIN
    PRINT 'Column Phone already exists in TbUsers table.';
END
GO

PRINT 'Stored procedure definitions are maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
GO
