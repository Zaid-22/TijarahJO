USE TijarahJoDB;
GO

PRINT 'Applying baseline reference seed data...';
GO

MERGE dbo.UserStatusLookup AS target
USING
(
    VALUES
        (1, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Active user account'),
        (2, N'BANNED', N'BANNED', CAST(0 AS BIT), N'Banned user account'),
        (3, N'INACTIVE', N'INACTIVE', CAST(0 AS BIT), N'Inactive user account')
) AS source (StatusID, Code, StatusName, IsActive, Description)
ON target.StatusID = source.StatusID
WHEN MATCHED THEN
    UPDATE SET
        target.Code = source.Code,
        target.StatusName = source.StatusName,
        target.IsActive = source.IsActive,
        target.Description = source.Description
WHEN NOT MATCHED BY TARGET THEN
    INSERT (StatusID, Code, StatusName, IsActive, Description)
    VALUES (source.StatusID, source.Code, source.StatusName, source.IsActive, source.Description);
GO

MERGE dbo.PostStatusLookup AS target
USING
(
    VALUES
        (0, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Visible active listing'),
        (1, N'BLOCKED', N'BLOCKED', CAST(0 AS BIT), N'Moderated listing'),
        (3, N'SOLD', N'SOLD', CAST(1 AS BIT), N'Sold listing')
) AS source (StatusID, Code, StatusName, IsVisible, Description)
ON target.StatusID = source.StatusID
WHEN MATCHED THEN
    UPDATE SET
        target.Code = source.Code,
        target.StatusName = source.StatusName,
        target.IsVisible = source.IsVisible,
        target.Description = source.Description
WHEN NOT MATCHED BY TARGET THEN
    INSERT (StatusID, Code, StatusName, IsVisible, Description)
    VALUES (source.StatusID, source.Code, source.StatusName, source.IsVisible, source.Description);
GO

MERGE dbo.Roles AS target
USING
(
    VALUES
        (N'Admin'),
        (N'User')
) AS source (RoleName)
ON target.RoleName = source.RoleName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (RoleName)
    VALUES (source.RoleName);
GO

MERGE dbo.Categories AS target
USING
(
    VALUES
        (N'Electronics', N'الإلكترونيات', N'/uploads/category-images/electronics.jpg'),
        (N'Mobile Phones & Tablets', N'هواتف ذكية وتابلتات', N'/uploads/category-images/mobile-phones-and-tablets.jpg'),
        (N'Computers & Laptops', N'حواسيب وأجهزة كمبيوتر محمولة', N'/uploads/category-images/computers-and-laptops.jpg'),
        (N'Home Appliances', N'أجهزة منزلية', N'/uploads/category-images/home-appliances.jpg'),
        (N'Furniture', N'الأثاث', N'/uploads/category-images/furniture.jpg'),
        (N'Vehicles', N'المركبات', N'/uploads/category-images/vehicles.jpg'),
        (N'Fashion & Clothing', N'الموضة والأزياء', N'/uploads/category-images/fashion-and-clothing.jpg'),
        (N'Health & Beauty', N'الصحة والجمال', N'/uploads/category-images/health-and-beauty.jpg'),
        (N'Sports & Fitness', N'الرياضة واللياقة البدنية', N'/uploads/category-images/sports-and-fitness.jpg'),
        (N'Books & Stationery', N'كتب وأدوات مكتبية', N'/uploads/category-images/books-and-stationery.jpg'),
        (N'Toys & Games', N'ألعاب وألعاب فيديو', N'/uploads/category-images/toys-and-games.jpg'),
        (N'Real Estate', N'عقارات', N'/uploads/category-images/real-estate.jpg'),
        (N'Pets & Animals', N'حيوانات أليفة', N'/uploads/category-images/pets-and-animals.jpg'),
        (N'Services', N'خدمات', N'/uploads/category-images/services.jpg'),
        (N'Other', N'أخرى', N'/uploads/category-images/other.jpg')
) AS source (CategoryName, NameAr, Image)
ON target.CategoryName = source.CategoryName
WHEN MATCHED THEN
    UPDATE SET
        target.NameAr = source.NameAr,
        target.Image = source.Image,
        target.IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CategoryName, NameAr, Image, IsDeleted)
    VALUES (source.CategoryName, source.NameAr, source.Image, 0);
GO

PRINT 'Baseline reference seed data completed.';
GO
