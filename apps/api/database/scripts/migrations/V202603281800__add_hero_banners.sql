-- =============================================================================
-- Migration: Add HeroBanners Table
-- Description: Creates a DB-backed store for homepage hero banners so they can
--              be managed via the Admin Panel instead of hardcoded/localStorage.
-- =============================================================================

USE TijarahJoDB;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.HeroBanners
        (
            BannerID     INT IDENTITY(1,1) PRIMARY KEY,
            Title        NVARCHAR(200)   NOT NULL,
            TitleAr      NVARCHAR(200)   NOT NULL,
            Subtitle     NVARCHAR(400)   NOT NULL,
            SubtitleAr   NVARCHAR(400)   NOT NULL,
            ButtonText   NVARCHAR(100)   NOT NULL,
            ButtonTextAr NVARCHAR(100)   NOT NULL,
            ImageUrl     NVARCHAR(500)   NOT NULL,
            BgClass      NVARCHAR(200)   NOT NULL,
            TextClass    NVARCHAR(200)   NOT NULL,
            AltText      NVARCHAR(200)   NOT NULL,
            AltTextAr    NVARCHAR(200)   NOT NULL,
            LinkUrl      NVARCHAR(500)   NULL,
            IsActive     BIT             NOT NULL DEFAULT 1,
            DisplayOrder INT             NOT NULL DEFAULT 0,
            CreatedAt    DATETIME2       NOT NULL CONSTRAINT DF_HeroBanners_CreatedAt DEFAULT SYSUTCDATETIME(),
            UpdatedAt    DATETIME2       NOT NULL CONSTRAINT DF_HeroBanners_UpdatedAt DEFAULT SYSUTCDATETIME()
        );

        CREATE NONCLUSTERED INDEX IX_HeroBanners_IsActive_Order
            ON dbo.HeroBanners (IsActive, DisplayOrder);
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

-- ---------------------------------------------------------------------------
-- Grant permissions outside transaction to avoid schema lock issues
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
BEGIN
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.HeroBanners TO tijarahjo_app_role;
    GRANT SELECT ON dbo.HeroBanners TO tijarahjo_readonly_role;
END
GO

PRINT 'HeroBanners table created successfully.';
GO
