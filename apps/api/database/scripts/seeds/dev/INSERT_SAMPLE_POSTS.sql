USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

PRINT 'Seeding development sample posts...';
GO

DECLARE @SeedUserID INT =
(
    SELECT TOP (1) u.UserID
    FROM dbo.Users AS u
    WHERE u.Email = N'dev@tijarahjo.local'
      AND u.IsDeleted = 0
    ORDER BY u.UserID
);

IF @SeedUserID IS NULL
BEGIN
    SET @SeedUserID =
    (
        SELECT TOP (1) u.UserID
        FROM dbo.Users AS u
        WHERE u.IsDeleted = 0
        ORDER BY u.UserID
    );
END

IF @SeedUserID IS NULL
BEGIN
    ;THROW 51031, 'INSERT_SAMPLE_POSTS.sql requires at least one active user. Run INSERT_DEV_SEED_USER.sql first.', 1;
END

DECLARE @StatusActive INT =
(
    SELECT TOP (1) StatusID
    FROM dbo.PostStatusLookup
    WHERE Code = N'ACTIVE'
    ORDER BY StatusID
);

IF @StatusActive IS NULL
BEGIN
    SET @StatusActive = 0;
END

DECLARE @SamplePosts TABLE
(
    PostTitle NVARCHAR(200) NOT NULL,
    PostDescription NVARCHAR(MAX) NULL,
    Price DECIMAL(18,2) NULL,
    CategoryName NVARCHAR(100) NOT NULL
);

INSERT INTO @SamplePosts (PostTitle, PostDescription, Price, CategoryName)
VALUES
    (N'iPhone 14 Pro Max 256GB', N'Brand new iPhone 14 Pro Max in excellent condition. Comes with original box and charger. Never been used.', 850.00, N'Electronics'),
    (N'Sony WH-1000XM5 Wireless Headphones', N'Premium noise-cancelling headphones. Perfect condition, all accessories included.', 280.00, N'Electronics'),
    (N'Modern Sofa Set - 3 Pieces', N'Beautiful modern sofa set in excellent condition. Perfect for living room.', 450.00, N'Furniture'),
    (N'MacBook Pro 14" M2 Chip', N'2023 MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Like new condition.', 1200.00, N'Electronics'),
    (N'Dining Table with 6 Chairs', N'Wooden dining table set. Great condition, perfect for family dinners.', 350.00, N'Furniture'),
    (N'Samsung 55" 4K Smart TV', N'55 inch Samsung Smart TV with 4K resolution. Excellent picture quality.', 380.00, N'Electronics'),
    (N'PlayStation 5 Disc Edition', N'PS5 console in perfect condition. Includes controller and all cables.', 420.00, N'Electronics'),
    (N'Canon EOS R6 Camera Body', N'Professional mirrorless camera. Excellent for photography enthusiasts.', 1650.00, N'Electronics');

;WITH ResolvedPosts AS
(
    SELECT
        @SeedUserID AS UserID,
        c.CategoryID,
        s.PostTitle,
        s.PostDescription,
        s.Price
    FROM @SamplePosts AS s
    INNER JOIN dbo.Categories AS c
        ON c.CategoryName = s.CategoryName
       AND c.IsDeleted = 0
)
MERGE dbo.Posts AS target
USING ResolvedPosts AS source
   ON target.UserID = source.UserID
  AND target.PostTitle = source.PostTitle
WHEN MATCHED THEN
    UPDATE SET
        target.CategoryID = source.CategoryID,
        target.PostDescription = source.PostDescription,
        target.Price = source.Price,
        target.Status = @StatusActive,
        target.IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted, Views)
    VALUES (source.UserID, source.CategoryID, source.PostTitle, source.PostDescription, source.Price, @StatusActive, SYSUTCDATETIME(), 0, 0);
GO

PRINT 'Development sample posts ready.';
GO
