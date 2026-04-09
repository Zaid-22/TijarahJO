-- =============================================================================
-- V202604081500 — Seed default hero banners
-- =============================================================================
-- Ensures the homepage hero carousel has baseline banner rows whenever the
-- HeroBanners table exists but is still empty.

SET XACT_ABORT ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.HeroBanners', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.HeroBanners)
    BEGIN
        INSERT INTO dbo.HeroBanners
        (
            Title,
            TitleAr,
            Subtitle,
            SubtitleAr,
            ButtonText,
            ButtonTextAr,
            ImageUrl,
            BgClass,
            TextClass,
            AltText,
            AltTextAr,
            LinkUrl,
            IsActive,
            DisplayOrder
        )
        VALUES
        (
            N'Buy and Sell Easily',
            N'اشتري وبيع بسهولة',
            N'Join Jordan''s largest marketplace today.',
            N'انضم إلى أكبر سوق إلكتروني في الأردن اليوم.',
            N'Start Now',
            N'ابدأ الآن',
            N'/banners/asset-slide-1.webp',
            N'bg-sky-50',
            N'text-slate-900',
            N'Buy and Sell Easily in Jordan',
            N'اشتري وبيع بسهولة في الأردن',
            N'/posts',
            1,
            0
        ),
        (
            N'Premium Electronics',
            N'إلكترونيات مميزة',
            N'Up to 50% off on top tech brands.',
            N'خصومات تصل إلى 50٪ على أفضل العلامات التجارية.',
            N'Shop Deals',
            N'تسوق العروض',
            N'/banners/asset-slide-2.webp',
            N'bg-slate-900',
            N'text-white',
            N'Electronics Deals',
            N'عروض الإلكترونيات',
            N'/category/Electronics',
            1,
            1
        ),
        (
            N'Refresh Your Home',
            N'جدد بيتك',
            N'Modern furniture for every room.',
            N'أثاث عصري لكل غرفة.',
            N'Explore Furniture',
            N'استكشف الأثاث',
            N'/banners/asset-slide-3.webp',
            N'bg-amber-50',
            N'text-amber-950',
            N'Home and Furniture',
            N'المنزل والأثاث',
            N'/category/Furniture',
            1,
            2
        );
    END;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202604081500__seed_default_hero_banners.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202604081500__seed_default_hero_banners.sql',
            SYSUTCDATETIME(),
            N'Seed default homepage hero banners when the table is empty'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
GO
