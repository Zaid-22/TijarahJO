USE [TijarahJoDB];
GO

-- Ensure PostImageURL supports long base64 payloads.
IF EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[TbPostImages]')
      AND name = 'PostImageURL'
)
BEGIN
    ALTER TABLE [dbo].[TbPostImages]
    ALTER COLUMN [PostImageURL] NVARCHAR(MAX) NOT NULL;
    PRINT 'TbPostImages.PostImageURL column updated to NVARCHAR(MAX).';
END
ELSE
BEGIN
    PRINT 'Column PostImageURL not found in TbPostImages table.';
END
GO

PRINT 'Stored procedure definitions are maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
GO
