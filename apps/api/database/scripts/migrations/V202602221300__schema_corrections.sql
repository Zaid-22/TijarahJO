-- =============================================================================
-- V202602221300__schema_corrections.sql
-- Addresses all critical and important issues from architecture review:
--
--   1. Remove HashedPassword from login index INCLUDE (security)
--   2. Drop redundant CK_Users_Status / CK_Posts_Status (FK is authority)
--   3. Remove status 2=DELETED from PostStatusLookup (IsDeleted is canonical)
--   4. Add UpdatedAt to Users and Posts
--   5. Add LastMessageAt to Conversations
--   6. Add IsDeleted to Reviews, Messages, Conversations
--   7. Rename [Timestamp] -> CreatedAt in Messages and Reviews
--   8. Add missing indexes: Reviews, Posts-by-Category, Messages-unread
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying schema corrections migration...';
GO

-- ============================================================
-- 1. Fix IX_Users_Login_Email_Active — remove HashedPassword
--    from INCLUDE clause (security: hashed pw on index pages)
-- ============================================================
BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Users')
          AND name = N'IX_Users_Login_Email_Active'
    )
    BEGIN
        DROP INDEX IX_Users_Login_Email_Active ON dbo.Users;
    END

    IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE object_id = OBJECT_ID(N'dbo.Users')
          AND name = N'IX_Users_Login_Email_Active'
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_Login_Email_Active
        ON dbo.Users (Email)
        INCLUDE (UserID, FirstName, LastName, Phone, JoinDate, Status, RoleID, CityID, AreaID)
        WHERE IsDeleted = 0;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    ;THROW;
END CATCH
GO

-- ============================================================
-- 2. Drop redundant CHECK constraints on Status columns
--    The FK → PostStatusLookup / UserStatusLookup is the authority.
--    Keeping both creates a two-source-of-truth problem.
-- ============================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_Users_Status'
      AND parent_object_id = OBJECT_ID(N'dbo.Users')
)
BEGIN
    ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_Status;
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_Posts_Status'
      AND parent_object_id = OBJECT_ID(N'dbo.Posts')
)
BEGIN
    ALTER TABLE dbo.Posts DROP CONSTRAINT CK_Posts_Status;
END
GO

-- ============================================================
-- 3. Remove status 2=DELETED from PostStatusLookup.
--    IsDeleted BIT column is the canonical deletion mechanism.
--    Any posts currently marked Status=2 are soft-deleted via
--    IsDeleted — force them to consistent state first.
-- ============================================================
IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    -- Ensure posts with Status=2 (DELETED) have IsDeleted=1
    UPDATE dbo.Posts
    SET    IsDeleted = 1,
           Status    = 0        -- reset to ACTIVE for FK validity after lookup row deletion
    WHERE  Status = 2
      AND  IsDeleted = 0;

    UPDATE dbo.Posts
    SET    Status = 0
    WHERE  Status = 2;          -- catch any remaining status=2 rows
END
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NOT NULL
AND EXISTS (
    SELECT 1 FROM dbo.PostStatusLookup WHERE StatusID = 2
)
BEGIN
    DELETE FROM dbo.PostStatusLookup WHERE StatusID = 2;
END
GO

-- ============================================================
-- 4. Add UpdatedAt to Users and Posts
-- ============================================================
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Users', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Users
    ADD UpdatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Users_UpdatedAt DEFAULT SYSUTCDATETIME();

    -- Back-fill existing rows to JoinDate so UpdatedAt is meaningful
    UPDATE dbo.Users SET UpdatedAt = JoinDate WHERE UpdatedAt = SYSUTCDATETIME() OR UpdatedAt IS NULL;
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Posts', N'UpdatedAt') IS NULL
BEGIN
    ALTER TABLE dbo.Posts
    ADD UpdatedAt DATETIME2 NOT NULL
        CONSTRAINT DF_Posts_UpdatedAt DEFAULT SYSUTCDATETIME();

    -- Back-fill to CreatedAt
    UPDATE dbo.Posts SET UpdatedAt = CreatedAt WHERE UpdatedAt IS NULL OR UpdatedAt = SYSUTCDATETIME();
END
GO

-- ============================================================
-- 5. Add LastMessageAt to Conversations
--    Allows inbox sort without a full JOIN to Messages.
-- ============================================================
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Conversations', N'LastMessageAt') IS NULL
BEGIN
    ALTER TABLE dbo.Conversations
    ADD LastMessageAt DATETIME2 NULL;

    -- Back-fill from most recent message per conversation.
    -- Use dynamic SQL so the migration works for either legacy [Timestamp]
    -- or normalized CreatedAt schemas.
    DECLARE @messagesActivityColumn NVARCHAR(32) = NULL;
    DECLARE @backfillSql NVARCHAR(MAX);

    IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(N'dbo.Messages', N'CreatedAt') IS NOT NULL
            SET @messagesActivityColumn = N'CreatedAt';
        ELSE IF COL_LENGTH(N'dbo.Messages', N'Timestamp') IS NOT NULL
            SET @messagesActivityColumn = N'[Timestamp]';
    END

    IF @messagesActivityColumn IS NOT NULL
    BEGIN
        SET @backfillSql = N'
            UPDATE c
            SET c.LastMessageAt = latest.MaxTs
            FROM dbo.Conversations AS c
            INNER JOIN (
                SELECT ConversationID, MAX(' + @messagesActivityColumn + N') AS MaxTs
                FROM dbo.Messages
                GROUP BY ConversationID
            ) AS latest
                ON latest.ConversationID = c.ConversationID;';

        EXEC sp_executesql @backfillSql;
    END
END
GO

-- ============================================================
-- 6. Add IsDeleted to Reviews, Messages, Conversations
--    Required for GDPR right-to-be-forgotten and soft deletes.
--    Must be done BEFORE renaming [Timestamp].
-- ============================================================
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Reviews', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.Reviews
    ADD IsDeleted BIT NOT NULL
        CONSTRAINT DF_Reviews_IsDeleted DEFAULT 0;
END
GO

IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Messages', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.Messages
    ADD IsDeleted BIT NOT NULL
        CONSTRAINT DF_Messages_IsDeleted DEFAULT 0;
END
GO

IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Conversations', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.Conversations
    ADD IsDeleted BIT NOT NULL
        CONSTRAINT DF_Conversations_IsDeleted DEFAULT 0;
END
GO

-- ============================================================
-- 7. Rename [Timestamp] -> CreatedAt in Messages and Reviews
--    [Timestamp] is a reserved SQL Server keyword; escaping
--    works but breaks naming convention consistency.
-- ============================================================
IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Messages', N'Timestamp') IS NOT NULL
AND COL_LENGTH(N'dbo.Messages', N'CreatedAt') IS NULL
BEGIN
    EXEC sp_rename N'dbo.Messages.[Timestamp]', N'CreatedAt', N'COLUMN';
END
GO

IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL
AND COL_LENGTH(N'dbo.Reviews', N'Timestamp') IS NOT NULL
AND COL_LENGTH(N'dbo.Reviews', N'CreatedAt') IS NULL
BEGIN
    EXEC sp_rename N'dbo.Reviews.[Timestamp]', N'CreatedAt', N'COLUMN';
END
GO

-- Update default constraint names post-rename for clarity
IF EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE name = N'DF_Messages_Timestamp'
      AND parent_object_id = OBJECT_ID(N'dbo.Messages')
)
BEGIN
    EXEC sp_rename N'DF_Messages_Timestamp', N'DF_Messages_CreatedAt', N'OBJECT';
END
GO

IF EXISTS (
    SELECT 1 FROM sys.default_constraints
    WHERE name = N'DF_Reviews_Timestamp'
      AND parent_object_id = OBJECT_ID(N'dbo.Reviews')
)
BEGIN
    EXEC sp_rename N'DF_Reviews_Timestamp', N'DF_Reviews_CreatedAt', N'OBJECT';
END
GO

-- ============================================================
-- 8. Add missing indexes
-- ============================================================

-- 8a. Reviews by ReviewedUserID (seller profile query)
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Reviews')
      AND name = N'IX_Reviews_ReviewedUserID'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Reviews_ReviewedUserID
    ON dbo.Reviews (ReviewedUserID, IsDeleted, CreatedAt DESC)
    INCLUDE (ReviewerID, Rating, Comment);
END
GO

-- 8b. Posts by Category (browse by category — currently no index)
IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Posts')
      AND name = N'IX_Posts_CategoryID_Active'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Posts_CategoryID_Active
    ON dbo.Posts (CategoryID, IsDeleted, Status, CreatedAt DESC, PostID DESC)
    INCLUDE (UserID, Price, Views, CityID, AreaID)
    WHERE IsDeleted = 0;
END
GO

-- 8c. Messages: unread count per conversation
IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Messages')
      AND name = N'IX_Messages_ConversationID_IsRead_SenderID'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_IsRead_SenderID
    ON dbo.Messages (ConversationID, IsRead, SenderID)
    INCLUDE (MessageID, CreatedAt);
END
GO

-- 8d. Conversations: inbox sorted by last activity
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Conversations')
      AND name = N'IX_Conversations_User1_LastMessageAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Conversations_User1_LastMessageAt
    ON dbo.Conversations (User1ID, IsDeleted, LastMessageAt DESC, ConversationID DESC)
    INCLUDE (User2ID, PostID);
END
GO

IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Conversations')
      AND name = N'IX_Conversations_User2_LastMessageAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Conversations_User2_LastMessageAt
    ON dbo.Conversations (User2ID, IsDeleted, LastMessageAt DESC, ConversationID DESC)
    INCLUDE (User1ID, PostID);
END
GO

-- ============================================================
-- Register migration
-- ============================================================
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
AND NOT EXISTS (
    SELECT 1 FROM dbo.SchemaMigrations
    WHERE ScriptName = N'V202602221300__schema_corrections.sql'
)
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202602221300__schema_corrections.sql',
        SYSUTCDATETIME(),
        N'Security, integrity, and structural corrections: index security fix, redundant CHECKs removed, IsDeleted on Reviews/Messages/Conversations, UpdatedAt on Users/Posts, LastMessageAt on Conversations, [Timestamp] renamed to CreatedAt, 3 new indexes'
    );
END
GO

PRINT 'Schema corrections migration complete.';
GO
