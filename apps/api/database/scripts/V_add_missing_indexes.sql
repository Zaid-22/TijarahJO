-- =============================================================================
-- TijarahJo – Add Missing Performance Indexes
-- =============================================================================
-- PURPOSE: Add non-clustered indexes to improve query performance for
--          common access patterns identified in production review.
--
-- Run this after BASE_SCHEMA.sql has been applied.
-- =============================================================================

USE TijarahJoDB;
GO

-- ---------------------------------------------------------------------------
-- Posts: User's posts query (filtered by IsDeleted)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_UserID_IsDeleted'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_UserID_IsDeleted
    ON dbo.Posts (UserID, IsDeleted)
    INCLUDE (PostID, CategoryID, PostTitle, Price, Status, CreatedAt, Views, CityID, AreaID);
    PRINT 'Created index IX_Posts_UserID_IsDeleted.';
END
GO

-- ---------------------------------------------------------------------------
-- Posts: Category posts query (filtered by IsDeleted)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_CategoryID_IsDeleted'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_CategoryID_IsDeleted
    ON dbo.Posts (CategoryID, IsDeleted)
    INCLUDE (PostID, UserID, PostTitle, Price, Status, CreatedAt, Views, CityID, AreaID);
    PRINT 'Created index IX_Posts_CategoryID_IsDeleted.';
END
GO

-- ---------------------------------------------------------------------------
-- Posts: Feed/listing queries (active, non-deleted, ordered by date)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_Feed'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_Feed
    ON dbo.Posts (IsDeleted, Status, CreatedAt DESC)
    INCLUDE (PostID, UserID, CategoryID, PostTitle, Price, Views, CityID, AreaID);
    PRINT 'Created index IX_Posts_Feed.';
END
GO

-- ---------------------------------------------------------------------------
-- Messages: Chat history for a conversation (ordered by time)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Messages') AND name = N'IX_Messages_ConversationID_CreatedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_CreatedAt
    ON dbo.Messages (ConversationID, CreatedAt)
    INCLUDE (MessageID, SenderID, Content, IsRead, IsDeleted);
    PRINT 'Created index IX_Messages_ConversationID_CreatedAt.';
END
GO

-- ---------------------------------------------------------------------------
-- Favorites: User's favorites list (filtered by IsDeleted)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Favorites') AND name = N'IX_Favorites_UserID_IsDeleted'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Favorites_UserID_IsDeleted
    ON dbo.Favorites (UserID, IsDeleted)
    INCLUDE (FavoriteID, PostID, CreatedAt);
    PRINT 'Created index IX_Favorites_UserID_IsDeleted.';
END
GO

-- ---------------------------------------------------------------------------
-- PostImages: Post's images (filtered by IsDeleted)
-- ---------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PostImages') AND name = N'IX_PostImages_PostID_IsDeleted'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostImages_PostID_IsDeleted
    ON dbo.PostImages (PostID, IsDeleted)
    INCLUDE (PostImageID, PostImageURL, UploadedAt);
    PRINT 'Created index IX_PostImages_PostID_IsDeleted.';
END
GO

PRINT 'All performance indexes applied.';
GO
