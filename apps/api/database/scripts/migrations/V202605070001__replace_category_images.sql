-- =============================================================================
-- V202605070001 - Replace category image URLs with local generated assets
-- =============================================================================

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
    BEGIN
        DECLARE @CategoryImages TABLE
        (
            CategoryName NVARCHAR(100) NOT NULL PRIMARY KEY,
            Image NVARCHAR(1000) NOT NULL
        );

        INSERT INTO @CategoryImages (CategoryName, Image)
        VALUES
            (N'Electronics', N'/uploads/category-images/electronics.jpg'),
            (N'Mobile Phones & Tablets', N'/uploads/category-images/mobile-phones-and-tablets.jpg'),
            (N'Computers & Laptops', N'/uploads/category-images/computers-and-laptops.jpg'),
            (N'Home Appliances', N'/uploads/category-images/home-appliances.jpg'),
            (N'Furniture', N'/uploads/category-images/furniture.jpg'),
            (N'Vehicles', N'/uploads/category-images/vehicles.jpg'),
            (N'Fashion & Clothing', N'/uploads/category-images/fashion-and-clothing.jpg'),
            (N'Health & Beauty', N'/uploads/category-images/health-and-beauty.jpg'),
            (N'Sports & Fitness', N'/uploads/category-images/sports-and-fitness.jpg'),
            (N'Books & Stationery', N'/uploads/category-images/books-and-stationery.jpg'),
            (N'Toys & Games', N'/uploads/category-images/toys-and-games.jpg'),
            (N'Real Estate', N'/uploads/category-images/real-estate.jpg'),
            (N'Pets & Animals', N'/uploads/category-images/pets-and-animals.jpg'),
            (N'Services', N'/uploads/category-images/services.jpg'),
            (N'Other', N'/uploads/category-images/other.jpg');

        UPDATE category
        SET Image = categoryImage.Image
        FROM dbo.Categories AS category
        INNER JOIN @CategoryImages AS categoryImage
            ON categoryImage.CategoryName = category.CategoryName;
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
    BEGIN
        EXEC sp_executesql N'
            IF NOT EXISTS (
                SELECT 1
                FROM dbo.SchemaMigrations
                WHERE ScriptName = N''V202605070001__replace_category_images.sql''
            )
            BEGIN
                INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
                VALUES
                (
                    N''V202605070001__replace_category_images.sql'',
                    SYSUTCDATETIME(),
                    N''Replace seeded category image URLs with local generated category assets''
                );
            END';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
