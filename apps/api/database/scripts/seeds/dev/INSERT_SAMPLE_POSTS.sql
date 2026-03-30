USE TijarahJoDB;
GO
SET XACT_ABORT ON;
BEGIN TRY
    BEGIN TRANSACTION;

    -- =========================================================================
    -- 1. Create 6 sample users (password = Admin@123 for all)
    -- =========================================================================
    DECLARE @PW NVARCHAR(200) = 'PBKDF2_SHA256$100000$4IVh016LywSFAR2xrkIA/A==$hL3YTmKQbHp+Efo+qJj7CFM0YgkA3O2o6DNh+R4XkB8=';
    DECLARE @UserRole INT = (SELECT TOP 1 RoleID FROM dbo.Roles WHERE RoleName=N'User');
    DECLARE @Now DATETIME2 = SYSUTCDATETIME();

    -- Amman IDs
    DECLARE @AmmanId INT = (SELECT CityID FROM dbo.Cities WHERE CityName=N'Amman');
    DECLARE @IrbidId INT = (SELECT CityID FROM dbo.Cities WHERE CityName=N'Irbid');
    DECLARE @ZarqaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName=N'Zarqa');
    DECLARE @AqabaId INT = (SELECT CityID FROM dbo.Cities WHERE CityName=N'Aqaba');

    -- Area IDs
    DECLARE @Sweifieh INT = (SELECT AreaID FROM dbo.Areas WHERE AreaName=N'Sweifieh' AND CityID=@AmmanId);
    DECLARE @Abdali  INT = (SELECT AreaID FROM dbo.Areas WHERE AreaName=N'Abdali'  AND CityID=@AmmanId);
    DECLARE @Abdoun  INT = (SELECT AreaID FROM dbo.Areas WHERE AreaName=N'Abdoun'  AND CityID=@AmmanId);
    DECLARE @WestAmm INT = (SELECT AreaID FROM dbo.Areas WHERE AreaName=N'West Amman' AND CityID=@AmmanId);
    DECLARE @Jubaiha INT = (SELECT AreaID FROM dbo.Areas WHERE AreaName=N'Jubaiha' AND CityID=@AmmanId);
    DECLARE @IrbidCC INT = (SELECT TOP 1 AreaID FROM dbo.Areas WHERE CityID=@IrbidId);
    DECLARE @ZarqaCC INT = (SELECT TOP 1 AreaID FROM dbo.Areas WHERE CityID=@ZarqaId);

    MERGE dbo.Users AS target
    USING ( VALUES
        (@PW, 'user2@tijarahjo.local', N'Ahmad',  N'Al-Masri', '0791234567', @AmmanId, @Sweifieh, @Now, 1, @UserRole, 0),
        (@PW, 'user3@tijarahjo.local', N'Sarah',  N'Haddad',   '0787654321', @IrbidId, @IrbidCC,  @Now, 1, @UserRole, 0),
        (@PW, 'user4@tijarahjo.local', N'Omar',   N'Zaid',     '0771122334', @AmmanId, @WestAmm,  @Now, 1, @UserRole, 0),
        (@PW, 'user5@tijarahjo.local', N'Laila',  N'Khoury',   '0799988776', @AmmanId, @Abdali,   @Now, 1, @UserRole, 0),
        (@PW, 'user6@tijarahjo.local', N'Tareq',  N'Nassar',   '0785554443', @ZarqaId, @ZarqaCC,  @Now, 1, @UserRole, 0),
        (@PW, 'user7@tijarahjo.local', N'Nour',   N'Qasem',    '0778889990', @AmmanId, @Abdoun,   @Now, 1, @UserRole, 0)
    ) AS source (HashedPassword, Email, FirstName, LastName, Phone, CityID, AreaID, JoinDate, Status, RoleID, IsDeleted)
    ON target.Email = source.Email
    WHEN MATCHED THEN UPDATE SET FirstName=source.FirstName, LastName=source.LastName, Phone=source.Phone, CityID=source.CityID, AreaID=source.AreaID
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (HashedPassword, Email, FirstName, LastName, Phone, CityID, AreaID, JoinDate, Status, RoleID, IsDeleted)
        VALUES (source.HashedPassword, source.Email, source.FirstName, source.LastName, source.Phone, source.CityID, source.AreaID, source.JoinDate, source.Status, source.RoleID, source.IsDeleted);

    -- Resolve UserIDs
    DECLARE @U2 INT=(SELECT UserID FROM dbo.Users WHERE Email='user2@tijarahjo.local');
    DECLARE @U3 INT=(SELECT UserID FROM dbo.Users WHERE Email='user3@tijarahjo.local');
    DECLARE @U4 INT=(SELECT UserID FROM dbo.Users WHERE Email='user4@tijarahjo.local');
    DECLARE @U5 INT=(SELECT UserID FROM dbo.Users WHERE Email='user5@tijarahjo.local');
    DECLARE @U6 INT=(SELECT UserID FROM dbo.Users WHERE Email='user6@tijarahjo.local');
    DECLARE @U7 INT=(SELECT UserID FROM dbo.Users WHERE Email='user7@tijarahjo.local');

    -- Category IDs
    DECLARE @CatElec  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Electronics');
    DECLARE @CatPhone INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Mobile Phones & Tablets');
    DECLARE @CatPC    INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Computers & Laptops');
    DECLARE @CatAppl  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Home Appliances');
    DECLARE @CatFurn  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Furniture');
    DECLARE @CatCar   INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Vehicles');
    DECLARE @CatFash  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Fashion & Clothing');
    DECLARE @CatRE    INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Real Estate');
    DECLARE @CatSport INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Sports & Fitness');
    DECLARE @CatBook  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Books & Stationery');
    DECLARE @CatServ  INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Services');
    DECLARE @CatOther INT=(SELECT TOP 1 CategoryID FROM dbo.Categories WHERE CategoryName=N'Other');

    DECLARE @PID INT;

    -- =========================================================================
    -- 2. Posts for User 2 (Ahmad) — 15 posts, full profile showcase
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatPhone,N'iPhone 15 Pro Max 256GB',N'Brand new condition, Natural Titanium color. Comes with original box, cable, and Apple leather case. Battery health 100%. Face ID works flawlessly.',2850,0,DATEADD(DAY,-30,@Now),@Now,@AmmanId,@Sweifieh,0,342);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatPC,N'MacBook Air M2 2022',N'Space Gray, 8GB RAM, 256GB SSD. Used for 6 months only. Perfect for students and professionals.',2200,0,DATEADD(DAY,-28,@Now),@Now,@AmmanId,@Sweifieh,0,287);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatCar,N'Toyota Camry 2020 Hybrid',N'Pearl white, full option, JBL sound system. Only 35K KM. Serious buyers only.',22000,0,DATEADD(DAY,-25,@Now),@Now,@AmmanId,@Sweifieh,0,498);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatFurn,N'IKEA KALLAX Shelf Unit',N'White, 4x4 cube shelf. Great for books and storage. Like new.',45,0,DATEADD(DAY,-22,@Now),@Now,@AmmanId,@Sweifieh,0,120);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatElec,N'Sony WH-1000XM5 Headphones',N'Industry leading noise cancellation. Silver color. Comes with carrying case.',180,0,DATEADD(DAY,-20,@Now),@Now,@AmmanId,@Sweifieh,0,215);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatRE,N'Apartment for Rent – Sweifieh',N'3BR/2BA, 150sqm, 3rd floor with elevator. Unfurnished. Near Cozmo supermarket.',450,0,DATEADD(DAY,-18,@Now),@Now,@AmmanId,@Sweifieh,0,380);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatSport,N'Treadmill NordicTrack T6.5',N'Foldable, incline control, Bluetooth speakers. Barely used.',350,0,DATEADD(DAY,-15,@Now),@Now,@AmmanId,@Sweifieh,0,95);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatAppl,N'Dyson V15 Detect Vacuum',N'Laser dust detection, powerful suction. 1 year warranty remaining.',280,3,DATEADD(DAY,-14,@Now),@Now,@AmmanId,@Sweifieh,0,170);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatPhone,N'Samsung Galaxy S24 Ultra',N'Titanium Black, 512GB. S Pen included. Under warranty until Dec 2026.',3200,0,DATEADD(DAY,-12,@Now),@Now,@AmmanId,@Sweifieh,0,410);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatFash,N'Nike Air Jordan 1 Retro High',N'Size 43 EU. Worn twice only. University Blue colorway.',120,0,DATEADD(DAY,-10,@Now),@Now,@AmmanId,@Sweifieh,0,310);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatElec,N'Apple Watch Series 9 45mm',N'GPS + Cellular. Midnight aluminum case with sport band.',250,0,DATEADD(DAY,-8,@Now),@Now,@AmmanId,@Sweifieh,0,190);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatBook,N'University Textbooks Bundle',N'Engineering textbooks: Calculus, Physics, Programming in C++. Good condition.',35,3,DATEADD(DAY,-7,@Now),@Now,@AmmanId,@Sweifieh,0,60);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatServ,N'Home Painting Service',N'Professional interior/exterior painting. Free color consultation. 5+ years experience in Amman.',0,0,DATEADD(DAY,-5,@Now),@Now,@AmmanId,@Sweifieh,0,75);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatCar,N'Honda Civic 2019 Sport',N'Red, sunroof, lane assist, 55K KM. Accident-free.',16500,0,DATEADD(DAY,-3,@Now),@Now,@AmmanId,@Sweifieh,0,260);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U2,@CatOther,N'Moving Sale – Everything Must Go',N'Multiple household items: kitchen tools, decor, small appliances. WhatsApp for full list.',0,0,DATEADD(DAY,-1,@Now),@Now,@AmmanId,@Sweifieh,0,55);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&h=400&fit=crop',0,@Now);

    -- =========================================================================
    -- 3. Posts for User 3 (Sarah – Irbid) — 8 posts
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatFash,N'Zara Winter Coat – Size M',N'Black wool coat, worn once. Perfect for winter.',55,0,DATEADD(DAY,-27,@Now),@Now,@IrbidId,@IrbidCC,0,130);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatPhone,N'iPad Air 5th Gen WiFi',N'64GB, Space Gray. With Magic Keyboard and Apple Pencil 2.',550,0,DATEADD(DAY,-24,@Now),@Now,@IrbidId,@IrbidCC,0,200);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatBook,N'Arabic Literature Collection',N'15 classic Arabic novels including works by Naguib Mahfouz.',25,0,DATEADD(DAY,-20,@Now),@Now,@IrbidId,@IrbidCC,0,45);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatFurn,N'Study Desk with Drawers',N'Wooden study desk, 120cm. Great for home office or student room.',70,0,DATEADD(DAY,-17,@Now),@Now,@IrbidId,@IrbidCC,0,88);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatAppl,N'Nespresso Coffee Machine',N'Vertuo Next model. Includes 30 free capsules. Used gently.',90,3,DATEADD(DAY,-13,@Now),@Now,@IrbidId,@IrbidCC,0,155);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatRE,N'Room for Rent Near Yarmouk Uni',N'Furnished room, shared kitchen/bathroom. Female students only. 100 JD/month.',100,0,DATEADD(DAY,-9,@Now),@Now,@IrbidId,@IrbidCC,0,220);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatElec,N'Canon EOS R50 Camera Kit',N'Mirrorless, 24MP, with 18-45mm lens. Perfect for content creators.',650,0,DATEADD(DAY,-4,@Now),@Now,@IrbidId,@IrbidCC,0,175);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U3,@CatSport,N'Yoga Mat + Resistance Bands Set',N'Premium TPE yoga mat, 6mm thick. Includes 5 resistance bands.',20,0,DATEADD(DAY,-2,@Now),@Now,@IrbidId,@IrbidCC,0,40);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',0,@Now);

    -- =========================================================================
    -- 4. Posts for User 4 (Omar – West Amman) — 8 posts
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatCar,N'BMW 320i 2017 M Sport',N'Mineral Grey, M Sport package, navigation, parking sensors. 80K KM.',18500,0,DATEADD(DAY,-29,@Now),@Now,@AmmanId,@WestAmm,0,450);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatElec,N'PS5 + 5 Games Bundle',N'Disc edition, 2 DualSense controllers. Games: GTA V, FIFA 25, Spider-Man 2, God of War, Horizon.',400,0,DATEADD(DAY,-23,@Now),@Now,@AmmanId,@WestAmm,0,380);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatPC,N'Gaming PC RTX 4070',N'i7-13700K, 32GB RAM, 1TB NVMe, RTX 4070 Ti. RGB case with liquid cooling.',1800,0,DATEADD(DAY,-19,@Now),@Now,@AmmanId,@WestAmm,0,320);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatFurn,N'L-Shaped Corner Sofa – Grey',N'Seats 6, reversible chaise. Microfiber fabric, stain resistant.',300,0,DATEADD(DAY,-16,@Now),@Now,@AmmanId,@WestAmm,0,145);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatCar,N'Kia Sportage 2021 AWD',N'Silver, panoramic sunroof, heated seats, blind spot monitor. 25K KM.',21000,0,DATEADD(DAY,-11,@Now),@Now,@AmmanId,@WestAmm,0,290);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatSport,N'Full Home Gym Set',N'Olympic barbell, 100kg plates, adjustable bench, squat rack.',500,0,DATEADD(DAY,-6,@Now),@Now,@AmmanId,@WestAmm,0,110);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatServ,N'Freelance Web Development',N'Full-stack developer. React, Node.js, .NET. Portfolio available on request.',0,0,DATEADD(DAY,-3,@Now),@Now,@AmmanId,@WestAmm,0,65);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U4,@CatElec,N'DJI Mini 3 Pro Drone',N'Under 249g, 4K HDR video, 34 min flight time. Includes Fly More combo.',550,0,DATEADD(DAY,-1,@Now),@Now,@AmmanId,@WestAmm,0,200);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=600&h=400&fit=crop',0,@Now);

    -- =========================================================================
    -- 5. Posts for User 5 (Laila – Abdali) — 7 posts
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatFash,N'Designer Handbag – Michael Kors',N'Genuine leather, medium Jet Set tote. Camel color.',85,0,DATEADD(DAY,-26,@Now),@Now,@AmmanId,@Abdali,0,190);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatAppl,N'Samsung Smart TV 55" QLED',N'2023 model, 4K, Smart Hub, Alexa built-in. Wall mount included.',420,0,DATEADD(DAY,-21,@Now),@Now,@AmmanId,@Abdali,0,310);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatRE,N'Office Space for Rent – Abdali',N'50sqm, open floor plan, co-working friendly. Abdali Boulevard.',600,0,DATEADD(DAY,-16,@Now),@Now,@AmmanId,@Abdali,0,250);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatFurn,N'Baby Crib + Mattress',N'Convertible crib in white, with organic cotton mattress. Like new.',120,3,DATEADD(DAY,-12,@Now),@Now,@AmmanId,@Abdali,0,80);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatPhone,N'Google Pixel 8 Pro 128GB',N'Obsidian, excellent camera, clean Android. With Spigen case.',600,0,DATEADD(DAY,-8,@Now),@Now,@AmmanId,@Abdali,0,175);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatBook,N'IELTS Prep Books Bundle',N'Cambridge IELTS 15-18, Barrons complete guide. All with answer keys.',40,0,DATEADD(DAY,-5,@Now),@Now,@AmmanId,@Abdali,0,95);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U5,@CatServ,N'Private Math Tutoring',N'University-level calculus and statistics. Online or in-person in Amman. 15 JD/hour.',15,0,DATEADD(DAY,-2,@Now),@Now,@AmmanId,@Abdali,0,50);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=600&h=400&fit=crop',0,@Now);

    -- =========================================================================
    -- 6. Posts for User 6 (Tareq – Zarqa) — 6 posts
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatCar,N'Hyundai Accent 2015',N'Manual, 120K KM, new tires, AC works great. Economical.',7500,0,DATEADD(DAY,-25,@Now),@Now,@ZarqaId,@ZarqaCC,0,180);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatAppl,N'LG Washing Machine 9KG',N'Front load, steam wash, inverter motor. 2 years old.',200,0,DATEADD(DAY,-20,@Now),@Now,@ZarqaId,@ZarqaCC,0,110);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatFurn,N'King Bedroom Set Complete',N'Bed, 2 nightstands, dresser with mirror, wardrobe. Egyptian wood.',500,0,DATEADD(DAY,-15,@Now),@Now,@ZarqaId,@ZarqaCC,0,95);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatElec,N'JBL Charge 5 Speaker',N'Blue, waterproof, powerful bass. Battery lasts 20 hours.',75,0,DATEADD(DAY,-10,@Now),@Now,@ZarqaId,@ZarqaCC,0,130);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatRE,N'Shop for Rent in Zarqa Center',N'30sqm commercial shop, ground floor, busy street. 200 JD/month.',200,0,DATEADD(DAY,-6,@Now),@Now,@ZarqaId,@ZarqaCC,0,160);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U6,@CatOther,N'Aquarium 100L with Fish',N'Complete setup: tank, filter, heater, LED light, gravel, and 15 tropical fish.',80,0,DATEADD(DAY,-2,@Now),@Now,@ZarqaId,@ZarqaCC,0,70);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1520301255226-bf5f144451c1?w=600&h=400&fit=crop',0,@Now);

    -- =========================================================================
    -- 7. Posts for User 7 (Nour – Abdoun) — 6 posts
    -- =========================================================================
    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatRE,N'Luxury Apartment – Abdoun',N'200sqm, 4BR/3BA, marble floors, 2 balconies, 24/7 security. Furnished.',1200,0,DATEADD(DAY,-28,@Now),@Now,@AmmanId,@Abdoun,0,490);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatCar,N'Mercedes C200 2021 AMG Line',N'Obsidian Black, AMG body kit, Burmester sound, 20K KM only.',38000,0,DATEADD(DAY,-22,@Now),@Now,@AmmanId,@Abdoun,0,420);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop',0,@Now),(@PID,'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatPC,N'iMac 24" M1 2021',N'Blue, 16GB RAM, 512GB SSD. Includes Magic Keyboard and Trackpad.',1100,0,DATEADD(DAY,-17,@Now),@Now,@AmmanId,@Abdoun,0,230);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatFash,N'Ray-Ban Aviator Sunglasses',N'Original, gold frame, green lens. With case and cloth.',95,0,DATEADD(DAY,-11,@Now),@Now,@AmmanId,@Abdoun,0,140);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatFurn,N'Outdoor Patio Set – 4 Chairs + Table',N'Rattan weave, weather resistant, with cushions. Perfect for garden.',350,0,DATEADD(DAY,-7,@Now),@Now,@AmmanId,@Abdoun,0,85);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&h=400&fit=crop',0,@Now);

    INSERT INTO dbo.Posts(UserID,CategoryID,PostTitle,PostDescription,Price,Status,CreatedAt,UpdatedAt,CityID,AreaID,IsDeleted,Views) VALUES(@U7,@CatElec,N'AirPods Pro 2nd Generation',N'With MagSafe charging case, active noise cancellation. 3 months old.',150,0,DATEADD(DAY,-1,@Now),@Now,@AmmanId,@Abdoun,0,210);
    SET @PID=SCOPE_IDENTITY(); INSERT INTO dbo.PostImages(PostID,PostImageURL,IsDeleted,UploadedAt) VALUES(@PID,'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=400&fit=crop',0,@Now);

    COMMIT TRANSACTION;
    PRINT '50 sample posts with images inserted for 6 users.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
