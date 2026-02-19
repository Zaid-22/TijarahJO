USE TijarahJoDB;
GO

PRINT 'Applying baseline reference seed data...';
GO

MERGE dbo.TbRoles AS target
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

MERGE dbo.TbItemCategories AS target
USING
(
    VALUES
        (N'Electronics', N'Electronics', N'camera', N'#0A4ABF', N'https://example.com/images/categories/electronics.jpg'),
        (N'Furniture', N'Furniture', N'armchair', N'#8B5CF6', N'https://example.com/images/categories/furniture.jpg'),
        (N'Vehicles', N'Vehicles', N'car', N'#EF4444', N'https://example.com/images/categories/vehicles.jpg'),
        (N'Services', N'Services', N'wrench', N'#64748B', N'https://example.com/images/categories/services.jpg')
) AS source (CategoryName, NameAr, Icon, Color, Image)
ON target.CategoryName = source.CategoryName
WHEN MATCHED THEN
    UPDATE SET
        target.NameAr = source.NameAr,
        target.Icon = source.Icon,
        target.Color = source.Color,
        target.Image = source.Image,
        target.IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (CategoryName, NameAr, Icon, Color, Image, IsDeleted)
    VALUES (source.CategoryName, source.NameAr, source.Icon, source.Color, source.Image, 0);
GO

PRINT 'Baseline reference seed data completed.';
GO
