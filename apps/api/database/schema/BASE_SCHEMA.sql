-- =============================================================================
-- TijarahJo Base Schema (Canonical Source)
-- Canonical table/constraint definitions (no stored procedures).
--
-- IMPORTANT:
-- - Uses canonical table names only (no Tb-prefixed objects).
-- - Active bootstrap migrations are canonical-only.
-- - Legacy Tb-prefixed migration history is archived under archive/migrations-legacy.
-- =============================================================================

IF DB_ID(N'TijarahJoDB') IS NULL
BEGIN
    CREATE DATABASE TijarahJoDB;
END
GO

USE TijarahJoDB;
GO

-- ---------------------------------------------------------------------------
-- Roles
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Roles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Roles
    (
        RoleID   INT           IDENTITY(1,1) CONSTRAINT PK_Roles PRIMARY KEY,
        RoleName NVARCHAR(50)  NOT NULL,
        CreatedAt DATETIME2    NOT NULL CONSTRAINT DF_Roles_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT          NOT NULL CONSTRAINT DF_Roles_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_Roles_RoleName UNIQUE (RoleName)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Status Lookup Tables (required before Users/Posts due to FK)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.UserStatusLookup', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserStatusLookup
    (
        StatusID    INT           NOT NULL CONSTRAINT PK_UserStatusLookup PRIMARY KEY,
        Code        NVARCHAR(50)  NOT NULL CONSTRAINT UQ_UserStatusLookup_Code UNIQUE,
        StatusName  NVARCHAR(50)  NOT NULL CONSTRAINT UQ_UserStatusLookup_StatusName UNIQUE,
        IsActive    BIT           NOT NULL,
        Description NVARCHAR(200) NULL
    );
END
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PostStatusLookup
    (
        StatusID    INT           NOT NULL CONSTRAINT PK_PostStatusLookup PRIMARY KEY,
        Code        NVARCHAR(50)  NOT NULL CONSTRAINT UQ_PostStatusLookup_Code UNIQUE,
        StatusName  NVARCHAR(50)  NOT NULL CONSTRAINT UQ_PostStatusLookup_StatusName UNIQUE,
        IsVisible   BIT           NOT NULL,
        Description NVARCHAR(200) NULL
    );
END
GO

-- ---------------------------------------------------------------------------
-- Location Lookup Tables (required before Users/Posts due to FK)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Cities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Cities
    (
        CityID   INT           IDENTITY(1,1) NOT NULL CONSTRAINT PK_Cities PRIMARY KEY,
        CityName NVARCHAR(100) NOT NULL CONSTRAINT UQ_Cities_CityName UNIQUE
    );
END
GO

IF OBJECT_ID(N'dbo.Areas', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Areas
    (
        AreaID   INT           IDENTITY(1,1) NOT NULL CONSTRAINT PK_Areas PRIMARY KEY,
        CityID   INT           NOT NULL,
        AreaName NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_Areas_Cities FOREIGN KEY (CityID) REFERENCES dbo.Cities(CityID),
        CONSTRAINT UQ_Areas_City_Area UNIQUE (CityID, AreaName),
        CONSTRAINT UQ_Areas_AreaID_CityID UNIQUE (AreaID, CityID)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Users
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserID         INT           IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
        HashedPassword NVARCHAR(500) NOT NULL,   -- 500 chars: future-proof for Argon2id/SCrypt
        Email          NVARCHAR(255) NOT NULL,
        FirstName      NVARCHAR(100) NOT NULL,
        LastName       NVARCHAR(100) NULL,
        Phone          NVARCHAR(20)  NULL,
        CityID         INT           NULL,
        AreaID         INT           NULL,
        Bio            NVARCHAR(1000) NULL,
        Avatar         NVARCHAR(1000) NULL,
        JoinDate       DATETIME2     NOT NULL CONSTRAINT DF_Users_JoinDate DEFAULT SYSUTCDATETIME(),
        Status         INT           NOT NULL,
        RoleID         INT           NOT NULL,
        IsDeleted      BIT           NOT NULL CONSTRAINT DF_Users_IsDeleted DEFAULT 0,
        SearchFirstNameNormalized AS CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(FirstName, N''))))) PERSISTED,
        SearchLastNameNormalized  AS CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(LastName, N''))))) PERSISTED,
        SearchFullNameNormalized  AS CONVERT(NVARCHAR(201), UPPER(LTRIM(RTRIM(CONCAT(ISNULL(FirstName, N''), N' ', ISNULL(LastName, N'')))))) PERSISTED,
        CONSTRAINT UQ_Users_Email          UNIQUE (Email),
        CONSTRAINT FK_Users_RoleID         FOREIGN KEY (RoleID)  REFERENCES dbo.Roles(RoleID),
        CONSTRAINT FK_Users_StatusLookup   FOREIGN KEY (Status)  REFERENCES dbo.UserStatusLookup(StatusID),
        CONSTRAINT FK_Users_Cities         FOREIGN KEY (CityID)  REFERENCES dbo.Cities(CityID),
        CONSTRAINT FK_Users_Areas          FOREIGN KEY (AreaID)  REFERENCES dbo.Areas(AreaID),
        CONSTRAINT FK_Users_AreaCity_Consistency FOREIGN KEY (AreaID, CityID) REFERENCES dbo.Areas(AreaID, CityID),
        CONSTRAINT CK_Users_Email_NotBlank CHECK (LEN(LTRIM(RTRIM(Email))) > 0),
        CONSTRAINT CK_Users_FirstName_NotBlank CHECK (LEN(LTRIM(RTRIM(FirstName))) > 0),
        CONSTRAINT CK_Users_AreaRequiresCity CHECK (AreaID IS NULL OR CityID IS NOT NULL),
        CONSTRAINT CK_Users_Status CHECK (Status IN (1, 2, 3))
    );
END
GO

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Categories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Categories
    (
        CategoryID   INT           IDENTITY(1,1) CONSTRAINT PK_Categories PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL,
        NameAr       NVARCHAR(100) NULL,
        Icon         NVARCHAR(100) NULL,
        Color        NVARCHAR(20)  NULL,
        Image        NVARCHAR(1000) NULL,
        CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted    BIT           NOT NULL CONSTRAINT DF_Categories_IsDeleted DEFAULT 0,
        SearchCategoryNameNormalized AS CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(CategoryName, N''))))) PERSISTED,
        CONSTRAINT UQ_Categories_CategoryName UNIQUE (CategoryName)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Posts
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Posts
    (
        PostID          INT           IDENTITY(1,1) CONSTRAINT PK_Posts PRIMARY KEY,
        UserID          INT           NOT NULL,
        CategoryID      INT           NOT NULL,
        PostTitle       NVARCHAR(200) NOT NULL,
        PostDescription NVARCHAR(MAX) NULL,
        Price           DECIMAL(18,2) NULL,
        Status          INT           NOT NULL,
        CreatedAt       DATETIME2     NOT NULL CONSTRAINT DF_Posts_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted       BIT           NOT NULL CONSTRAINT DF_Posts_IsDeleted DEFAULT 0,
        Views           BIGINT        NOT NULL CONSTRAINT DF_Posts_Views DEFAULT 0,  -- BIGINT: no overflow for popular listings
        CityID          INT           NULL,
        AreaID          INT           NULL,
        SearchTitleNormalized AS CONVERT(NVARCHAR(200), UPPER(LTRIM(RTRIM(ISNULL(PostTitle, N''))))) PERSISTED,
        SearchDescriptionPrefixNormalized AS CONVERT(NVARCHAR(450), UPPER(LEFT(LTRIM(RTRIM(ISNULL(PostDescription, N''))), 450))) PERSISTED,
        CONSTRAINT CK_Posts_Price    CHECK (Price IS NULL OR Price >= 0),
        CONSTRAINT CK_Posts_Status   CHECK (Status IN (0, 1, 3)),
        CONSTRAINT CK_Posts_Views_NonNegative CHECK (Views >= 0),
        CONSTRAINT CK_Posts_AreaRequiresCity CHECK (AreaID IS NULL OR CityID IS NOT NULL),
        CONSTRAINT FK_Posts_UserID   FOREIGN KEY (UserID)      REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Posts_CategoryID FOREIGN KEY (CategoryID) REFERENCES dbo.Categories(CategoryID),
        CONSTRAINT FK_Posts_StatusLookup FOREIGN KEY (Status)  REFERENCES dbo.PostStatusLookup(StatusID),
        CONSTRAINT FK_Posts_Cities   FOREIGN KEY (CityID)      REFERENCES dbo.Cities(CityID),
        CONSTRAINT FK_Posts_Areas    FOREIGN KEY (AreaID)      REFERENCES dbo.Areas(AreaID),
        CONSTRAINT FK_Posts_AreaCity_Consistency FOREIGN KEY (AreaID, CityID) REFERENCES dbo.Areas(AreaID, CityID)
    );
END
GO

-- ---------------------------------------------------------------------------
-- PostImages
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.PostImages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PostImages
    (
        PostImageID  INT           IDENTITY(1,1) CONSTRAINT PK_PostImages PRIMARY KEY,
        PostID       INT           NOT NULL,
        PostImageURL NVARCHAR(MAX) NOT NULL,
        UploadedAt   DATETIME2     NOT NULL CONSTRAINT DF_PostImages_UploadedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted    BIT           NOT NULL CONSTRAINT DF_PostImages_IsDeleted DEFAULT 0,
        CONSTRAINT FK_PostImages_PostID FOREIGN KEY (PostID) REFERENCES dbo.Posts(PostID)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Favorites (junction: Users <-> Posts)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Favorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Favorites
    (
        FavoriteID INT       IDENTITY(1,1) CONSTRAINT PK_Favorites PRIMARY KEY,
        UserID     INT       NOT NULL,
        PostID     INT       NOT NULL,
        CreatedAt  DATETIME2 NOT NULL CONSTRAINT DF_Favorites_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted  BIT       NOT NULL CONSTRAINT DF_Favorites_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_Favorites_User_Post UNIQUE (UserID, PostID),
        CONSTRAINT FK_Favorites_UserID FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Favorites_PostID FOREIGN KEY (PostID) REFERENCES dbo.Posts(PostID)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reviews
    (
        ReviewID       INT           IDENTITY(1,1) CONSTRAINT PK_Reviews PRIMARY KEY,
        ReviewerID     INT           NOT NULL,
        ReviewedUserID INT           NOT NULL,
        Rating         INT           NOT NULL CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5),
        Comment        NVARCHAR(MAX) NULL,   -- NULL allowed: a star rating without comment is valid UX
        [Timestamp]    DATETIME2     NOT NULL CONSTRAINT DF_Reviews_Timestamp DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_Reviews_ReviewerID     FOREIGN KEY (ReviewerID)     REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Reviews_ReviewedUserID FOREIGN KEY (ReviewedUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_Reviews_NoSelfReview CHECK (ReviewerID <> ReviewedUserID),
        CONSTRAINT UQ_Reviews_Reviewer_Reviewed UNIQUE (ReviewerID, ReviewedUserID)
    );
END
GO

-- ---------------------------------------------------------------------------
-- Conversations (normalizes sender/receiver chat pairs)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Conversations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Conversations
    (
        ConversationID INT NOT NULL IDENTITY(1,1) CONSTRAINT PK_Conversations PRIMARY KEY,
        User1ID        INT NOT NULL,   -- Always the lower UserID
        User2ID        INT NOT NULL,   -- Always the higher UserID
        PostID         INT NULL,       -- Optional: post the conversation was initiated about
        CONSTRAINT FK_Conversations_User1 FOREIGN KEY (User1ID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Conversations_User2 FOREIGN KEY (User2ID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Conversations_Posts FOREIGN KEY (PostID) REFERENCES dbo.Posts(PostID),
        CONSTRAINT CK_Conversations_UserPairOrdered CHECK (User1ID < User2ID),
        CONSTRAINT UQ_Conversations_Pair  UNIQUE (User1ID, User2ID, PostID)   -- prevents duplicate threads
    );
END
GO

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Messages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Messages
    (
        MessageID      INT           IDENTITY(1,1) CONSTRAINT PK_Messages PRIMARY KEY,
        SenderID       INT           NOT NULL,
        ConversationID INT           NOT NULL,
        Content        NVARCHAR(MAX) NOT NULL,
        [Timestamp]    DATETIME2     NOT NULL CONSTRAINT DF_Messages_Timestamp DEFAULT SYSUTCDATETIME(),
        IsRead         BIT           NOT NULL CONSTRAINT DF_Messages_IsRead DEFAULT 0,
        CONSTRAINT FK_Messages_Sender        FOREIGN KEY (SenderID)       REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Messages_Conversations FOREIGN KEY (ConversationID) REFERENCES dbo.Conversations(ConversationID)
    );
END
GO

IF OBJECT_ID(N'dbo.TR_Messages_SenderMustBeConversationParticipant', N'TR') IS NULL
BEGIN
    EXEC(N'
CREATE TRIGGER dbo.TR_Messages_SenderMustBeConversationParticipant
ON dbo.Messages
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        LEFT JOIN dbo.Conversations AS c
            ON c.ConversationID = i.ConversationID
        WHERE c.ConversationID IS NULL
           OR (i.SenderID <> c.User1ID AND i.SenderID <> c.User2ID)
    )
    BEGIN
        ;THROW 51041, ''Invalid sender/conversation pair: sender must belong to the conversation.'', 1;
    END
END
');
END
GO

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Notifications', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Notifications
    (
        NotificationID   INT            IDENTITY(1,1) CONSTRAINT PK_Notifications PRIMARY KEY,
        UserID           INT            NOT NULL,
        NotificationType NVARCHAR(50)   NOT NULL,
        Title            NVARCHAR(200)  NOT NULL,
        Body             NVARCHAR(1000) NOT NULL,
        SenderUserID     INT            NULL,
        ConversationID   INT            NULL,
        MessageID        INT            NULL,
        RouteUrl         NVARCHAR(300)  NULL,
        IsRead           BIT            NOT NULL CONSTRAINT DF_Notifications_IsRead DEFAULT 0,
        CreatedAt        DATETIME2      NOT NULL CONSTRAINT DF_Notifications_CreatedAt DEFAULT SYSUTCDATETIME(),
        ReadAt           DATETIME2      NULL,
        PayloadJson      NVARCHAR(MAX)  NULL,
        CONSTRAINT FK_Notifications_UserID         FOREIGN KEY (UserID)         REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Notifications_SenderUserID   FOREIGN KEY (SenderUserID)   REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Notifications_ConversationID FOREIGN KEY (ConversationID) REFERENCES dbo.Conversations(ConversationID),
        CONSTRAINT FK_Notifications_MessageID      FOREIGN KEY (MessageID)      REFERENCES dbo.Messages(MessageID),
        CONSTRAINT CK_Notifications_Type_NotBlank  CHECK (LEN(LTRIM(RTRIM(NotificationType))) > 0),
        CONSTRAINT CK_Notifications_Title_NotBlank CHECK (LEN(LTRIM(RTRIM(Title))) > 0),
        CONSTRAINT CK_Notifications_Body_NotBlank  CHECK (LEN(LTRIM(RTRIM(Body))) > 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Notifications')
      AND name = N'IX_Notifications_UserID_IsRead_CreatedAt'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_UserID_IsRead_CreatedAt
    ON dbo.Notifications (UserID, IsRead, CreatedAt DESC, NotificationID DESC)
    INCLUDE (NotificationType, SenderUserID, ConversationID, MessageID, RouteUrl);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Notifications')
      AND name = N'IX_Notifications_User_Conversation_Read'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_Notifications_User_Conversation_Read
    ON dbo.Notifications (UserID, NotificationType, ConversationID, IsRead)
    INCLUDE (NotificationID, CreatedAt, ReadAt);
END
GO

-- ---------------------------------------------------------------------------
-- Push Subscriptions (for browser push notifications)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.PushSubscriptions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PushSubscriptions
    (
        PushSubscriptionID INT            IDENTITY(1,1) CONSTRAINT PK_PushSubscriptions PRIMARY KEY,
        UserID             INT            NOT NULL,
        Endpoint           NVARCHAR(1000) NOT NULL,
        EndpointHash       AS CONVERT(BINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(Endpoint))))) PERSISTED,
        P256DH             NVARCHAR(255)  NOT NULL,
        Auth               NVARCHAR(255)  NOT NULL,
        UserAgent          NVARCHAR(500)  NULL,
        IsActive           BIT            NOT NULL CONSTRAINT DF_PushSubscriptions_IsActive DEFAULT 1,
        CreatedAt          DATETIME2      NOT NULL CONSTRAINT DF_PushSubscriptions_CreatedAt DEFAULT SYSUTCDATETIME(),
        UpdatedAt          DATETIME2      NOT NULL CONSTRAINT DF_PushSubscriptions_UpdatedAt DEFAULT SYSUTCDATETIME(),
        LastSuccessAt      DATETIME2      NULL,
        LastFailureAt      DATETIME2      NULL,
        LastFailureReason  NVARCHAR(400)  NULL,
        CONSTRAINT FK_PushSubscriptions_UserID FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT UQ_PushSubscriptions_User_EndpointHash UNIQUE (UserID, EndpointHash),
        CONSTRAINT CK_PushSubscriptions_Endpoint_NotBlank CHECK (LEN(LTRIM(RTRIM(Endpoint))) > 0)
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.PushSubscriptions')
      AND name = N'IX_PushSubscriptions_User_IsActive'
)
BEGIN
    CREATE NONCLUSTERED INDEX IX_PushSubscriptions_User_IsActive
    ON dbo.PushSubscriptions (UserID, IsActive, UpdatedAt DESC, PushSubscriptionID DESC);
END
GO

-- ---------------------------------------------------------------------------
-- Schema Migrations tracking table
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SchemaMigrations
    (
        ScriptName NVARCHAR(255) NOT NULL CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
        AppliedAt  DATETIME2     NOT NULL CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME(),
        Notes      NVARCHAR(500) NULL
    );
END
GO
