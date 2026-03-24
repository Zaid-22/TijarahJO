-- =============================================================================
-- V202603241000 — Important Schema Fixes
-- ATOMICITY_EXCEPTION: This migration is idempotent single-object DDL with GO-batched statements.
-- Idempotent migration: missing indexes, constraints, and data type corrections.
-- =============================================================================

USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

PRINT 'Applying important schema fixes...';
GO

-- ------------------------------------------------------------
-- I1: Missing index on Reviews.ReviewedUserID
--     Enables efficient seller profile review lookups.
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Reviews_ReviewedUserID'
      AND object_id = OBJECT_ID(N'dbo.Reviews')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Reviews_ReviewedUserID
    ON dbo.Reviews (ReviewedUserID, IsDeleted, CreatedAt DESC)
    INCLUDE (ReviewerID, Rating, Comment);

    PRINT 'Created index: IX_Reviews_ReviewedUserID';
END
GO

-- ------------------------------------------------------------
-- I2: Missing index on Conversations.LastMessageAt DESC
--     Enables efficient inbox sorting using the denormalized field.
-- ------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'IX_Conversations_Inbox'
      AND object_id = OBJECT_ID(N'dbo.Conversations')
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Conversations_Inbox
    ON dbo.Conversations (LastMessageAt DESC, ConversationID DESC)
    INCLUDE (User1ID, User2ID, PostID)
    WHERE IsDeleted = 0 AND LastMessageAt IS NOT NULL;

    PRINT 'Created index: IX_Conversations_Inbox';
END
GO

-- ------------------------------------------------------------
-- I4: Change PostImageURL from NVARCHAR(MAX) to NVARCHAR(2048)
--     URLs have a practical max; MAX wastes storage and prevents indexing.
-- ------------------------------------------------------------
IF EXISTS (
    SELECT 1
    FROM sys.columns AS c
    WHERE c.object_id = OBJECT_ID(N'dbo.PostImages')
      AND c.name = N'PostImageURL'
      AND c.max_length = -1  -- -1 means MAX
)
BEGIN
    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'IX_PostImages_PostID_Active' AND object_id = OBJECT_ID(N'dbo.PostImages'))
    BEGIN
        DROP INDEX IX_PostImages_PostID_Active ON dbo.PostImages;
    END

    ALTER TABLE dbo.PostImages
    ALTER COLUMN PostImageURL NVARCHAR(2048) NOT NULL;

    CREATE NONCLUSTERED INDEX IX_PostImages_PostID_Active
        ON dbo.PostImages (PostID)
        INCLUDE (PostImageURL, UploadedAt)
        WHERE IsDeleted = 0;

    PRINT 'Altered PostImageURL to NVARCHAR(2048) and recreated index';
END
GO

-- ------------------------------------------------------------
-- I5: Add CK_Posts_Title_NotBlank constraint
--     Prevents empty post titles.
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_Title_NotBlank'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
   )
BEGIN
    ALTER TABLE dbo.Posts
    ADD CONSTRAINT CK_Posts_Title_NotBlank CHECK (LEN(LTRIM(RTRIM(PostTitle))) > 0);

    PRINT 'Added constraint: CK_Posts_Title_NotBlank';
END
GO

-- ------------------------------------------------------------
-- I7: Fix Roles.UQ_Roles_RoleName to be filtered by IsDeleted = 0
--     Allows re-creation of soft-deleted role names.
-- ------------------------------------------------------------
IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'UQ_Roles_RoleName'
      AND parent_object_id = OBJECT_ID(N'dbo.Roles')
)
BEGIN
    ALTER TABLE dbo.Roles DROP CONSTRAINT UQ_Roles_RoleName;
    PRINT 'Dropped constraint: UQ_Roles_RoleName';
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UQ_Roles_RoleName'
      AND object_id = OBJECT_ID(N'dbo.Roles')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Roles_RoleName
    ON dbo.Roles(RoleName)
    WHERE IsDeleted = 0;

    PRINT 'Created filtered index: UQ_Roles_RoleName';
END
GO

-- ------------------------------------------------------------
-- I8: Add CK_Notifications_Type CHECK constraint
--     Constrains NotificationType to known values.
--     Current: CHAT_MESSAGE. Future: REVIEW, FAVORITE, SYSTEM, POST_STATUS.
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Notifications_Type'
          AND parent_object_id = OBJECT_ID(N'dbo.Notifications')
   )
BEGIN
    ALTER TABLE dbo.Notifications
    ADD CONSTRAINT CK_Notifications_Type
        CHECK (NotificationType IN (
            N'CHAT_MESSAGE',
            N'REVIEW',
            N'FAVORITE',
            N'SYSTEM',
            N'POST_STATUS'
        ));

    PRINT 'Added constraint: CK_Notifications_Type';
END
GO

-- ------------------------------------------------------------
-- Migration tracking
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603241000__important_schema_fixes.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603241000__important_schema_fixes.sql',
        SYSUTCDATETIME(),
        N'Important fixes: missing indexes, PostImageURL type, PostTitle constraint, Roles uniqueness'
    );
END
GO

PRINT 'Important schema fixes complete.';
GO
