-- V202602191110__chat_conversations.sql
-- Extracts direct Sender/Receiver pairs from Messages into a normalized Conversations structure.
-- IDEMPOTENT: All DDL guarded with IF NOT EXISTS / IF OBJECT_ID / IF COL_LENGTH checks.

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying chat conversations normalization (idempotent)...';
GO

-- ============================================================
-- 1. Create Conversations Table (guarded)
-- ============================================================
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conversations
    (
        ConversationID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Conversations PRIMARY KEY,
        User1ID        INT NOT NULL,
        User2ID        INT NOT NULL,
        PostID         INT NULL,   -- Optional: conversation initiated about a specific post
        CONSTRAINT FK_Conversations_User1 FOREIGN KEY (User1ID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Conversations_User2 FOREIGN KEY (User2ID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Conversations_Posts FOREIGN KEY (PostID)  REFERENCES dbo.Posts(PostID),
        CONSTRAINT UQ_Conversations_Pair  UNIQUE (User1ID, User2ID, PostID)   -- prevents duplicate threads
    );
    PRINT 'Created dbo.Conversations.';
END
GO

-- ============================================================
-- 2. Migrate existing distinct conversational pairs (only if ReceiverID still exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Messages', N'ReceiverID') IS NOT NULL
BEGIN
    INSERT INTO dbo.Conversations (User1ID, User2ID, PostID)
    SELECT DISTINCT
        CASE WHEN SenderID < ReceiverID THEN SenderID ELSE ReceiverID END AS User1ID,
        CASE WHEN SenderID < ReceiverID THEN ReceiverID ELSE SenderID END AS User2ID,
        PostID
    FROM dbo.Messages
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.Conversations c
        WHERE c.User1ID = CASE WHEN SenderID < ReceiverID THEN SenderID ELSE ReceiverID END
          AND c.User2ID = CASE WHEN SenderID < ReceiverID THEN ReceiverID ELSE SenderID END
          AND (c.PostID = Messages.PostID OR (c.PostID IS NULL AND Messages.PostID IS NULL))
    );
    PRINT 'Migrated existing message pairs into Conversations.';
END
GO

-- ============================================================
-- 3. Add ConversationID to Messages (guarded)
-- ============================================================
IF COL_LENGTH(N'dbo.Messages', N'ConversationID') IS NULL
BEGIN
    ALTER TABLE dbo.Messages ADD ConversationID INT NULL;
    PRINT 'Added ConversationID column to Messages.';
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Messages_Conversations' AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    ALTER TABLE dbo.Messages
    ADD CONSTRAINT FK_Messages_Conversations FOREIGN KEY (ConversationID) REFERENCES dbo.Conversations(ConversationID);
    PRINT 'Added FK_Messages_Conversations.';
END
GO

-- ============================================================
-- 4. Backfill ConversationID into Messages (only if ReceiverID still exists)
-- ============================================================
IF COL_LENGTH(N'dbo.Messages', N'ReceiverID') IS NOT NULL
   AND COL_LENGTH(N'dbo.Messages', N'ConversationID') IS NOT NULL
BEGIN
    UPDATE m
    SET ConversationID = c.ConversationID
    FROM dbo.Messages m
    INNER JOIN dbo.Conversations c
       ON (
             (m.SenderID = c.User1ID AND m.ReceiverID = c.User2ID)
             OR
             (m.SenderID = c.User2ID AND m.ReceiverID = c.User1ID)
          )
       AND (m.PostID = c.PostID OR (m.PostID IS NULL AND c.PostID IS NULL))
    WHERE m.ConversationID IS NULL;
    PRINT 'Backfilled ConversationID into Messages.';
END
GO

-- ============================================================
-- 5. Drop old redundant FKs and indexes (guarded)
-- ============================================================
IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_TbMessages_ReceiverID' AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    ALTER TABLE dbo.Messages DROP CONSTRAINT FK_TbMessages_ReceiverID;
    PRINT 'Dropped FK_TbMessages_ReceiverID.';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_TbMessages_SenderID' AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    ALTER TABLE dbo.Messages DROP CONSTRAINT FK_TbMessages_SenderID;
    PRINT 'Dropped FK_TbMessages_SenderID.';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_TbMessages_PostID' AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    ALTER TABLE dbo.Messages DROP CONSTRAINT FK_TbMessages_PostID;
    PRINT 'Dropped FK_TbMessages_PostID.';
END
GO

-- Drop dependent indexes before dropping columns
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbMessages_Conversation' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_TbMessages_Conversation ON dbo.Messages;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbMessages_Conversation_Reverse' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_TbMessages_Conversation_Reverse ON dbo.Messages;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbMessages_Receiver_Sender_Unread' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_TbMessages_Receiver_Sender_Unread ON dbo.Messages;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbMessages_Receiver_Timestamp' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_TbMessages_Receiver_Timestamp ON dbo.Messages;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_Messages_Unread' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_Messages_Unread ON dbo.Messages;

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_TbMessages_PostID' AND object_id = OBJECT_ID(N'dbo.Messages'))
    DROP INDEX IX_TbMessages_PostID ON dbo.Messages;
GO

-- ============================================================
-- 6. Drop old columns (guarded)
-- ============================================================
IF COL_LENGTH(N'dbo.Messages', N'ReceiverID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Messages DROP COLUMN ReceiverID;
    PRINT 'Dropped ReceiverID from Messages.';
END
GO

IF COL_LENGTH(N'dbo.Messages', N'PostID') IS NOT NULL
BEGIN
    ALTER TABLE dbo.Messages DROP COLUMN PostID;
    PRINT 'Dropped PostID from Messages.';
END
GO

-- ============================================================
-- 7. Re-add SenderID FK under new canonical name (guarded)
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = N'FK_Messages_Sender' AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    ALTER TABLE dbo.Messages
    ADD CONSTRAINT FK_Messages_Sender FOREIGN KEY (SenderID) REFERENCES dbo.Users(UserID);
    PRINT 'Added FK_Messages_Sender.';
END
GO

-- ============================================================
-- 8. Add new covering index for conversation-based lookups
-- ============================================================
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE name = N'IX_Messages_ConversationID_Timestamp'
      AND object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_Timestamp
    ON dbo.Messages (ConversationID, [Timestamp] DESC, MessageID DESC)
    INCLUDE (SenderID, IsRead);
    PRINT 'Created IX_Messages_ConversationID_Timestamp.';
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1 FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602191110__chat_conversations.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
    VALUES (N'V202602191110__chat_conversations.sql', N'Chat Conversations table normalization');
END
GO

PRINT 'Chat conversations normalization complete.';
GO
