USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying canonical index strategy...';
GO

-- ------------------------------------------------------------
-- Users indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_Login_Email_Active'
          AND object_id = OBJECT_ID(N'dbo.Users')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_Login_Email_Active
        ON dbo.Users (Email)
        INCLUDE (UserID, HashedPassword, FirstName, LastName, Phone, JoinDate, Status, RoleID, CityID, AreaID)
        WHERE IsDeleted = 0;
    END

    IF COL_LENGTH(N'dbo.Users', N'Phone') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'UQ_Users_Phone_Active'
              AND object_id = OBJECT_ID(N'dbo.Users')
       )
    BEGIN
        CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Phone_Active
        ON dbo.Users (Phone)
        INCLUDE (UserID, HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID)
        WHERE IsDeleted = 0 AND Phone IS NOT NULL;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Users_ActiveByRoleStatus'
          AND object_id = OBJECT_ID(N'dbo.Users')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_ActiveByRoleStatus
        ON dbo.Users (RoleID, Status, IsDeleted)
        INCLUDE (UserID, Email, FirstName, LastName, JoinDate, CityID, AreaID);
    END

    IF COL_LENGTH(N'dbo.Users', N'SearchFirstNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Users_SearchFirstNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.Users')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_SearchFirstNameNormalized
        ON dbo.Users (SearchFirstNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, LastName, Email);
    END

    IF COL_LENGTH(N'dbo.Users', N'SearchLastNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Users_SearchLastNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.Users')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_SearchLastNameNormalized
        ON dbo.Users (SearchLastNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, FirstName, Email);
    END

    IF COL_LENGTH(N'dbo.Users', N'SearchFullNameNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Users_SearchFullNameNormalized'
              AND object_id = OBJECT_ID(N'dbo.Users')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Users_SearchFullNameNormalized
        ON dbo.Users (SearchFullNameNormalized, IsDeleted, Status)
        INCLUDE (UserID, FirstName, LastName, Email);
    END
END
GO

-- ------------------------------------------------------------
-- Categories indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Categories', N'SearchCategoryNameNormalized') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Categories_SearchCategoryNameNormalized'
          AND object_id = OBJECT_ID(N'dbo.Categories')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_Categories_SearchCategoryNameNormalized
    ON dbo.Categories (SearchCategoryNameNormalized, IsDeleted)
    INCLUDE (CategoryID, CategoryName);
END
GO

-- ------------------------------------------------------------
-- Posts indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Posts_UserID_IsDeleted_Status'
          AND object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_UserID_IsDeleted_Status
        ON dbo.Posts (UserID, IsDeleted, Status)
        INCLUDE (Views, CreatedAt, CategoryID, Price, CityID, AreaID);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Posts_IsDeleted_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_IsDeleted_CreatedAt
        ON dbo.Posts (IsDeleted, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Status, Price, Views, CityID, AreaID);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Posts_IsDeleted_Price'
          AND object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_IsDeleted_Price
        ON dbo.Posts (IsDeleted, Price DESC, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Status, Views, CityID, AreaID)
        WHERE Price IS NOT NULL;
    END

    IF COL_LENGTH(N'dbo.Posts', N'SearchTitleNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Posts_SearchTitleNormalized'
              AND object_id = OBJECT_ID(N'dbo.Posts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_SearchTitleNormalized
        ON dbo.Posts (SearchTitleNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID);
    END

    IF COL_LENGTH(N'dbo.Posts', N'SearchDescriptionPrefixNormalized') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Posts_SearchDescriptionPrefixNormalized'
              AND object_id = OBJECT_ID(N'dbo.Posts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_SearchDescriptionPrefixNormalized
        ON dbo.Posts (SearchDescriptionPrefixNormalized, IsDeleted, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views, CityID, AreaID);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Posts_CityID_Active'
          AND object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_CityID_Active
        ON dbo.Posts (CityID, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views, AreaID)
        WHERE IsDeleted = 0 AND CityID IS NOT NULL;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Posts_AreaID_Active'
          AND object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Posts_AreaID_Active
        ON dbo.Posts (AreaID, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Price, Views, CityID)
        WHERE IsDeleted = 0 AND AreaID IS NOT NULL;
    END
END
GO

-- ------------------------------------------------------------
-- PostImages indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.PostImages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_PostImages_PostID_IsDeleted'
          AND object_id = OBJECT_ID(N'dbo.PostImages')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_PostImages_PostID_IsDeleted
    ON dbo.PostImages (PostID, IsDeleted)
    INCLUDE (PostImageURL, UploadedAt);
END
GO

-- ------------------------------------------------------------
-- Favorites indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Favorites', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Favorites_UserID_IsDeleted_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.Favorites')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Favorites_UserID_IsDeleted_CreatedAt
        ON dbo.Favorites (UserID, IsDeleted, CreatedAt DESC, FavoriteID DESC)
        INCLUDE (PostID);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Favorites_PostID_IsDeleted'
          AND object_id = OBJECT_ID(N'dbo.Favorites')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Favorites_PostID_IsDeleted
        ON dbo.Favorites (PostID, IsDeleted)
        INCLUDE (UserID, CreatedAt);
    END
END
GO

-- ------------------------------------------------------------
-- Conversations and Messages indexes
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Conversations_User1ID_PostID'
          AND object_id = OBJECT_ID(N'dbo.Conversations')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Conversations_User1ID_PostID
        ON dbo.Conversations (User1ID, PostID, ConversationID)
        INCLUDE (User2ID);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Conversations_User2ID_PostID'
          AND object_id = OBJECT_ID(N'dbo.Conversations')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Conversations_User2ID_PostID
        ON dbo.Conversations (User2ID, PostID, ConversationID)
        INCLUDE (User1ID);
    END
END
GO

IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Messages', N'Timestamp') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Messages_ConversationID_Timestamp'
              AND object_id = OBJECT_ID(N'dbo.Messages')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_Timestamp
            ON dbo.Messages (ConversationID, [Timestamp] DESC, MessageID DESC)
            INCLUDE (SenderID, IsRead);
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Messages_Sender_Timestamp'
              AND object_id = OBJECT_ID(N'dbo.Messages')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_Sender_Timestamp
            ON dbo.Messages (SenderID, [Timestamp] DESC, MessageID DESC)
            INCLUDE (ConversationID, IsRead);
        END
    END
    ELSE IF COL_LENGTH(N'dbo.Messages', N'CreatedAt') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Messages_ConversationID_Timestamp'
              AND object_id = OBJECT_ID(N'dbo.Messages')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_ConversationID_Timestamp
            ON dbo.Messages (ConversationID, CreatedAt DESC, MessageID DESC)
            INCLUDE (SenderID, IsRead);
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_Messages_Sender_Timestamp'
              AND object_id = OBJECT_ID(N'dbo.Messages')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_Sender_Timestamp
            ON dbo.Messages (SenderID, CreatedAt DESC, MessageID DESC)
            INCLUDE (ConversationID, IsRead);
        END
    END
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602200910__canonical_indexes.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202602200910__canonical_indexes.sql',
        SYSUTCDATETIME(),
        N'Canonical filtered/index strategy for runtime query paths'
    );
END
GO

PRINT 'Canonical index strategy complete.';
GO
