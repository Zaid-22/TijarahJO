USE TijarahJoDB;
GO

-- Insert sample posts
-- Make sure you have at least 1 user and some categories in the database first

-- Sample Post 1: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'iPhone 14 Pro Max 256GB', N'Brand new iPhone 14 Pro Max in excellent condition. Comes with original box and charger. Never been used.', 850.00, 0, GETDATE(), 0);
GO

-- Sample Post 2: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'Sony WH-1000XM5 Wireless Headphones', N'Premium noise-cancelling headphones. Perfect condition, all accessories included.', 280.00, 0, GETDATE(), 0);
GO

-- Sample Post 3: Furniture
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 2, N'Modern Sofa Set - 3 Pieces', N'Beautiful modern sofa set in excellent condition. Perfect for living room.', 450.00, 0, GETDATE(), 0);
GO

-- Sample Post 4: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'MacBook Pro 14" M2 Chip', N'2023 MacBook Pro with M2 chip, 16GB RAM, 512GB SSD. Like new condition.', 1200.00, 0, GETDATE(), 0);
GO

-- Sample Post 5: Furniture
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 2, N'Dining Table with 6 Chairs', N'Wooden dining table set. Great condition, perfect for family dinners.', 350.00, 0, GETDATE(), 0);
GO

-- Sample Post 6: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'Samsung 55" 4K Smart TV', N'55 inch Samsung Smart TV with 4K resolution. Excellent picture quality.', 380.00, 0, GETDATE(), 0);
GO

-- Sample Post 7: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'PlayStation 5 Disc Edition', N'PS5 console in perfect condition. Includes controller and all cables.', 420.00, 0, GETDATE(), 0);
GO

-- Sample Post 8: Electronics
INSERT INTO dbo.TbPosts (UserID, CategoryID, PostTitle, PostDescription, Price, Status, CreatedAt, IsDeleted)
VALUES (1, 1, N'Canon EOS R6 Camera Body', N'Professional mirrorless camera. Excellent for photography enthusiasts.', 1650.00, 0, GETDATE(), 0);
GO

PRINT 'Sample posts inserted successfully!';
GO

