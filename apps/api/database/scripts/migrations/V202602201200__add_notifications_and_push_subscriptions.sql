USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying notifications and push subscriptions migration...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- ------------------------------------------------------------
    -- 1) Notifications table
    -- ------------------------------------------------------------
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

    -- ------------------------------------------------------------
    -- 2) PushSubscriptions table
    -- ------------------------------------------------------------
    IF OBJECT_ID(N'dbo.PushSubscriptions', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.PushSubscriptions
        (
            PushSubscriptionID INT            IDENTITY(1,1) CONSTRAINT PK_PushSubscriptions PRIMARY KEY,
            UserID             INT            NOT NULL,
            Endpoint           NVARCHAR(1000) NOT NULL,
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
            CONSTRAINT UQ_PushSubscriptions_User_Endpoint UNIQUE (UserID, Endpoint),
            CONSTRAINT CK_PushSubscriptions_Endpoint_NotBlank CHECK (LEN(LTRIM(RTRIM(Endpoint))) > 0)
        );
    END

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

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602201200__add_notifications_and_push_subscriptions.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602201200__add_notifications_and_push_subscriptions.sql',
            SYSUTCDATETIME(),
            N'Adds persistent user notifications and browser push subscription storage'
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    ;THROW;
END CATCH
GO

PRINT 'Notifications and push subscriptions migration complete.';
GO
