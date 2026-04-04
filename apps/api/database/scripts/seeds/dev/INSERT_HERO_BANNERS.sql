USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.HeroBanners)
BEGIN
    INSERT INTO dbo.HeroBanners (
        Title, TitleAr, Subtitle, SubtitleAr, ButtonText, ButtonTextAr, 
        ImageUrl, BgClass, TextClass, AltText, AltTextAr, LinkUrl, IsActive, DisplayOrder
    ) VALUES
    (
        N'Buy and Sell Easily', N'اشتري وبيع بسهولة', 
        N'Join Jordan''s largest marketplace today.', N'انضم إلى أكبر سوق إلكتروني في الأردن اليوم.', 
        N'Start Now', N'ابدأ الآن',
        N'/banners/asset-slide-1.webp', N'bg-sky-50', N'text-slate-900',
        N'Buy and Sell Easily in Jordan', N'اشتري وبيع بسهولة في الأردن',
        N'/posts', 1, 0
    ),
    (
        N'Premium Electronics', N'إلكترونيات مميزة', 
        N'Up to 50% off on top tech brands.', N'خصومات تصل إلى 50٪ على أفضل العلامات التجارية.', 
        N'Shop Deals', N'تسوق العروض',
        N'/banners/asset-slide-2.webp', N'bg-slate-900', N'text-white',
        N'Electronics Deals', N'عروض الإلكترونيات',
        N'/category/Education', 1, 1  -- Using generic valid category instead of specific one if Electronics doesn't exist
    ),
    (
        N'Refresh Your Home', N'جدد بيتك', 
        N'Modern furniture for every room.', N'أثاث عصري لكل غرفة.', 
        N'Explore Furniture', N'استكشف الأثاث',
        N'/banners/asset-slide-3.webp', N'bg-amber-50', N'text-amber-950',
        N'Home and Furniture', N'المنزل والأثاث',
        N'/category/Fashion', 1, 2
    );

    PRINT 'Hero Banners seeded successfully.';
END
ELSE
BEGIN
    PRINT 'Hero Banners already exist. Skipping seed.';
END
GO
