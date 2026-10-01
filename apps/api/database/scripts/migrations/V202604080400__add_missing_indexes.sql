USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- ATOMICITY_EXCEPTION: Idempotent DDL/DML with GO-batched statements.
-- =============================================================================
-- Performance: Add 5 missing indexes identified in architecture audit
-- =============================================================================

-- Posts: UserID queries (GetPostsByUserIDAsync)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_UserID_IsDeleted_CreatedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_UserID_IsDeleted_CreatedAt
    ON dbo.Posts (UserID, IsDeleted, CreatedAt DESC, PostID DESC)
    INCLUDE (CategoryID, PostTitle, Price, Status, Views, CityID, AreaID);
    PRINT 'Created index IX_Posts_UserID_IsDeleted_CreatedAt.';
END
GO

-- Posts: CategoryID queries (GetPostsByCategoryIDAsync)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_CategoryID_IsDeleted_CreatedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_CategoryID_IsDeleted_CreatedAt
    ON dbo.Posts (CategoryID, IsDeleted, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, PostTitle, Price, Status, Views, CityID, AreaID);
    PRINT 'Created index IX_Posts_CategoryID_IsDeleted_CreatedAt.';
END
GO

-- Posts: Status + IsDeleted filter (marketplace listing queries)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts') AND name = N'IX_Posts_Status_IsDeleted'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_Status_IsDeleted
    ON dbo.Posts (Status, IsDeleted)
    WHERE IsDeleted = 0;
    PRINT 'Created index IX_Posts_Status_IsDeleted.';
END
GO

-- Messages: Chat history pagination within a conversation
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Messages') AND name = N'IX_Messages_ConversationID_CreatedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_CreatedAt
    ON dbo.Messages (ConversationID, CreatedAt DESC, MessageID DESC)
    INCLUDE (SenderID, ReceiverID, Content, IsRead, IsDeleted);
    PRINT 'Created index IX_Messages_ConversationID_CreatedAt.';
END
GO

-- Favorites: PostID lookups (cascade on post deletion)
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Favorites') AND name = N'IX_Favorites_PostID'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Favorites_PostID
    ON dbo.Favorites (PostID)
    WHERE IsDeleted = 0;
    PRINT 'Created index IX_Favorites_PostID.';
END
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080400__add_missing_indexes.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080400__add_missing_indexes.sql'',
                    N''Added 5 missing indexes for Posts (UserID, CategoryID, Status), Messages (ConversationID), Favorites (PostID)'');
        END';
END
GO
