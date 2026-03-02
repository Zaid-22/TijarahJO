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
        (N'Electronics', N'الإلكترونيات', N'camera', N'#0A4ABF', N'https://images.unsplash.com/photo-1761641466573-f240b6e446de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBlbGVjdHJvbmljcyUyMGRldmljZXN8ZW58MXx8fHwxNzY2MzEzNjM2fDA&ixlib=rb-4.1.0&q=80&w=1080'),
        (N'Mobile Phones & Tablets', N'هواتف ذكية وتابلتات', N'smartphone', N'#3B82F6', N'https://images.unsplash.com/photo-1602980760473-5160c97b0cdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXRlc3QlMjBzbWFydHBob25lJTIwdGFibGV0JTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzY1MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Computers & Laptops', N'حواسيب وأجهزة كمبيوتر محمولة', N'monitor', N'#6366F1', N'https://images.unsplash.com/photo-1511385348-a52b4a160dc2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsYXB0b3AlMjBjb21wdXRlcnxlbnwxfHx8fDE3NjYxOTM4NDJ8MA&ixlib=rb-4.1.0&q=80&w=1080'),
        (N'Home Appliances', N'أجهزة منزلية', N'refrigerator', N'#10B981', N'https://images.unsplash.com/photo-1740803292374-1b167c1558b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob21lJTIwYXBwbGlhbmNlcyUyMGtpdGNoZW58ZW58MXx8fHwxNzY2MjMyMTUwfDA&ixlib=rb-4.1.0&q=80&w=1080'),
        (N'Furniture', N'الأثاث', N'armchair', N'#8B5CF6', N'https://images.unsplash.com/photo-1484101403633-562f891dc89a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZpbmclMjByb29tJTIwc29mYXxlbnwxfHx8fDE3NjYxMjg2MjN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Vehicles', N'المركبات', N'car', N'#EF4444', N'https://images.unsplash.com/photo-1615966996783-5d361a011237?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXIlMjBmcm9udCUyMHZpZXd8ZW58MXx8fHwxNzY2MjM0MDYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Fashion & Clothing', N'الموضة والأزياء', N'shopping-bag', N'#FF69B4', N'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmd8ZW58MXx8fHwxNzY2MjM5OTM5fDA&ixlib=rb-4.1.0&q=80&w=1080'),
        (N'Health & Beauty', N'الصحة والجمال', N'sparkles', N'#EC4899', N'https://images.unsplash.com/photo-1600180583258-6d9b0c7b782b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxza2luY2FyZSUyMGNvc21ldGljcyUyMG1hcmJsZSUyMGZsYXRsYXl8ZW58MXx8fHwxNzY2MjM1NDg3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Sports & Fitness', N'الرياضة واللياقة البدنية', N'dumbbell', N'#10B981', N'https://images.unsplash.com/photo-1683758507025-6e74ad3ca1e5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXRuZXNzJTIwZXF1aXBtZW50JTIwZHVtYmJlbGxzJTIwd2VpZ2h0cyUyMG1hdHxlbnwxfHx8fDE3NjYyMzkyNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Books & Stationery', N'كتب وأدوات مكتبية', N'book-open', N'#14B8A6', N'https://images.unsplash.com/photo-1721552023489-6c2ec21d297f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdGFjayUyMGJvb2tzJTIwbGlicmFyeXxlbnwxfHx8fDE3NjYyMzQwNjJ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Toys & Games', N'ألعاب وألعاب فيديو', N'gamepad-2', N'#EC4899', N'https://images.unsplash.com/photo-1566595151374-4e57e0fd2dfb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0b3klMjBibG9ja3MlMjBib2FyZCUyMGdhbWVzJTIwdGVkZHklMjBiZWFyJTIwZmxhdGxheXxlbnwxfHx8fDE3NjYyMzkwODd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Real Estate', N'عقارات', N'home', N'#0EA5E9', N'https://images.unsplash.com/photo-1758448756207-54505680d130?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob3VzZSUyMHdpbmRvd3MlMjBncmVlbmVyeSUyMGV4dGVyaW9yfGVufDF8fHx8MTc2NjIzNTc5MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Pets & Animals', N'حيوانات أليفة', N'paw-print', N'#84CC16', N'https://images.unsplash.com/photo-1573435567032-ff5982925350?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjYXQlMjBwZXR8ZW58MXx8fHwxNzY2MjM0MDY0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Services', N'خدمات', N'wrench', N'#64748B', N'https://images.unsplash.com/photo-1760009436767-d154e930e55c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjBoZWxtZXQlMjB0b29scyUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3NjYyMzU0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'),
        (N'Other', N'أخرى', N'package', N'#9333EA', N'https://images.unsplash.com/photo-1765000884289-baee6a441acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNjZWxsYW5lb3VzJTIwcHJvZHVjdHMlMjBjb2xsZWN0aW9ufGVufDF8fHx8MTc2NjIzNzg0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')
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
