-- =============================================================================
-- V202602241500__filtered_indexes_for_soft_deletes.sql
-- ATOMICITY_EXCEPTION: This migration intentionally uses GO-batched index rebuild operations.
-- Optimizes high-traffic database indexes by applying Filtered Indexes: 
-- adding `WHERE IsDeleted = 0` and removing IsDeleted from the indexed 
-- columns. This drastically shrinks index size and improves read performance.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying filtered indexes for soft deletes migration...';
GO

-- ------------------------------------------------------------
-- Posts Indexes
-- ------------------------------------------------------------

-- 1. IX_Posts_UserID_Status_Active (Replaces IX_Posts_UserID_IsDeleted_Status)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_UserID_IsDeleted_Status' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_UserID_IsDeleted_Status ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_UserID_Status_Active
    ON dbo.Posts (UserID, Status)
    INCLUDE (Views, CreatedAt, CategoryID, Price, CityID, AreaID)
    WHERE IsDeleted = 0;
GO

-- 2. IX_Posts_CreatedAt_Active (Replaces IX_Posts_IsDeleted_CreatedAt)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_IsDeleted_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_IsDeleted_CreatedAt ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_CreatedAt_Active
    ON dbo.Posts (CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, CategoryID, Status, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;
GO

-- 3. IX_Posts_Price_Active (Replaces IX_Posts_IsDeleted_Price)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_IsDeleted_Price' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_IsDeleted_Price ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_Price_Active
    ON dbo.Posts (Price DESC, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, CategoryID, Status, Views, CityID, AreaID)
    WHERE IsDeleted = 0 AND Price IS NOT NULL;
GO

-- 4. IX_Posts_SearchTitle_Active (Replaces IX_Posts_SearchTitleNormalized)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchTitleNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_SearchTitleNormalized ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_SearchTitle_Active
    ON dbo.Posts (SearchTitleNormalized, Status, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;
GO

-- 5. IX_Posts_SearchDescription_Active (Replaces IX_Posts_SearchDescriptionPrefixNormalized)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_SearchDescriptionPrefixNormalized' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_SearchDescriptionPrefixNormalized ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_SearchDescription_Active
    ON dbo.Posts (SearchDescriptionPrefixNormalized, Status, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;
GO

-- 6. IX_Posts_CategoryID_Active (Recreate without IsDeleted in keys)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Posts_CategoryID_Active' AND object_id = OBJECT_ID(N'dbo.Posts'))
    DROP INDEX IX_Posts_CategoryID_Active ON dbo.Posts;
GO
CREATE NONCLUSTERED INDEX IX_Posts_CategoryID_Active
    ON dbo.Posts (CategoryID, Status, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;
GO

-- ------------------------------------------------------------
-- PostImages Indexes
-- ------------------------------------------------------------

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PostImages_PostID_IsDeleted' AND object_id = OBJECT_ID(N'dbo.PostImages'))
    DROP INDEX IX_PostImages_PostID_IsDeleted ON dbo.PostImages;
GO
CREATE NONCLUSTERED INDEX IX_PostImages_PostID_Active
    ON dbo.PostImages (PostID)
    INCLUDE (PostImageURL, UploadedAt)
    WHERE IsDeleted = 0;
GO


-- ------------------------------------------------------------
-- Favorites Indexes
-- ------------------------------------------------------------

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favorites_UserID_IsDeleted_CreatedAt' AND object_id = OBJECT_ID(N'dbo.Favorites'))
    DROP INDEX IX_Favorites_UserID_IsDeleted_CreatedAt ON dbo.Favorites;
GO
CREATE NONCLUSTERED INDEX IX_Favorites_UserID_Active
    ON dbo.Favorites (UserID, CreatedAt DESC, FavoriteID DESC)
    INCLUDE (PostID)
    WHERE IsDeleted = 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Favorites_PostID_IsDeleted' AND object_id = OBJECT_ID(N'dbo.Favorites'))
    DROP INDEX IX_Favorites_PostID_IsDeleted ON dbo.Favorites;
GO
CREATE NONCLUSTERED INDEX IX_Favorites_PostID_Active
    ON dbo.Favorites (PostID)
    INCLUDE (UserID, CreatedAt)
    WHERE IsDeleted = 0;
GO


-- ------------------------------------------------------------
-- Conversations Indexes
-- ------------------------------------------------------------

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Conversations_User1ID_PostID' AND object_id = OBJECT_ID(N'dbo.Conversations'))
    DROP INDEX IX_Conversations_User1ID_PostID ON dbo.Conversations;
GO
CREATE NONCLUSTERED INDEX IX_Conversations_User1ID_Active
    ON dbo.Conversations (User1ID, PostID, ConversationID)
    INCLUDE (User2ID)
    WHERE IsDeleted = 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Conversations_User2ID_PostID' AND object_id = OBJECT_ID(N'dbo.Conversations'))
    DROP INDEX IX_Conversations_User2ID_PostID ON dbo.Conversations;
GO
CREATE NONCLUSTERED INDEX IX_Conversations_User2ID_Active
    ON dbo.Conversations (User2ID, PostID, ConversationID)
    INCLUDE (User1ID)
    WHERE IsDeleted = 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Conversations_User1_LastMessageAt' AND object_id = OBJECT_ID(N'dbo.Conversations'))
    DROP INDEX IX_Conversations_User1_LastMessageAt ON dbo.Conversations;
GO
CREATE NONCLUSTERED INDEX IX_Conversations_User1_LastMessage_Active
    ON dbo.Conversations (User1ID, LastMessageAt DESC, ConversationID DESC)
    INCLUDE (User2ID, PostID)
    WHERE IsDeleted = 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Conversations_User2_LastMessageAt' AND object_id = OBJECT_ID(N'dbo.Conversations'))
    DROP INDEX IX_Conversations_User2_LastMessageAt ON dbo.Conversations;
GO
CREATE NONCLUSTERED INDEX IX_Conversations_User2_LastMessage_Active
    ON dbo.Conversations (User2ID, LastMessageAt DESC, ConversationID DESC)
    INCLUDE (User1ID, PostID)
    WHERE IsDeleted = 0;
GO


-- ------------------------------------------------------------
-- Messages Indexes
-- ------------------------------------------------------------

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_ConversationID_Timestamp' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_Messages_ConversationID_Timestamp ON dbo.Messages;
GO
CREATE NONCLUSTERED INDEX IX_Messages_Conversation_CreatedAt_Active
    ON dbo.Messages (ConversationID, CreatedAt DESC, MessageID DESC)
    INCLUDE (SenderID, IsRead)
    WHERE IsDeleted = 0;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_Sender_Timestamp' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_Messages_Sender_Timestamp ON dbo.Messages;
GO
CREATE NONCLUSTERED INDEX IX_Messages_Sender_CreatedAt_Active
    ON dbo.Messages (SenderID, CreatedAt DESC, MessageID DESC)
    INCLUDE (ConversationID, IsRead)
    WHERE IsDeleted = 0;
GO

-- ------------------------------------------------------------
-- Reviews Indexes
-- ------------------------------------------------------------
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Reviews_ReviewedUserID' AND object_id = OBJECT_ID(N'dbo.Reviews'))
    DROP INDEX IX_Reviews_ReviewedUserID ON dbo.Reviews;
GO
CREATE NONCLUSTERED INDEX IX_Reviews_ReviewedUserID_Active
    ON dbo.Reviews (ReviewedUserID, CreatedAt DESC)
    INCLUDE (ReviewerID, Rating, Comment)
    WHERE IsDeleted = 0;
GO


-- ------------------------------------------------------------
-- Register Migration
-- ------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N'V202602241500__filtered_indexes_for_soft_deletes.sql')
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (N'V202602241500__filtered_indexes_for_soft_deletes.sql', SYSUTCDATETIME(), N'Creates filtered indexes on IsDeleted = 0 for high-traffic tables');
END
GO
