-- =============================================================================
-- Migration: Expand HeroBanners.ImageUrl for uploaded banner images
-- Description: Supports admin-uploaded data URLs and longer hosted image URLs.
-- =============================================================================

USE TijarahJoDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
    BEGIN
        ALTER TABLE dbo.HeroBanners
        ALTER COLUMN ImageUrl NVARCHAR(MAX) NOT NULL;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

PRINT 'HeroBanners.ImageUrl expanded successfully.';
GO
