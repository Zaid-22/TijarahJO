USE TijarahJoDB;
GO

PRINT 'Seeding TbPostImages with dummy data...';
GO

-- Insert dummy images for existing posts if they don't have images
INSERT INTO TbPostImages (PostID, PostImageURL, UploadedAt, IsDeleted)
SELECT 
    p.PostID, 
    'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=600&auto=format&fit=crop' AS PostImageURL, 
    GETDATE(),
    0 -- IsDeleted
FROM TbPosts p
WHERE NOT EXISTS (SELECT 1 FROM TbPostImages pi WHERE pi.PostID = p.PostID);

-- Insert a second image for some posts to test arrays
INSERT INTO TbPostImages (PostID, PostImageURL, UploadedAt, IsDeleted)
SELECT TOP 5
    p.PostID, 
    'https://images.unsplash.com/photo-1593642632823-8f78536709c7?q=80&w=600&auto=format&fit=crop' AS PostImageURL, 
    GETDATE(),
    0
FROM TbPosts p
WHERE NOT EXISTS (SELECT 1 FROM TbPostImages pi WHERE pi.PostID = p.PostID AND pi.PostImageURL LIKE '%photo-1593642%')
ORDER BY NewID();

PRINT 'Seeding complete!';
GO
