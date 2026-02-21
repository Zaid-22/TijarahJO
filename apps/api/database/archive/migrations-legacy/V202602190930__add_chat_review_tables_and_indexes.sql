USE [TijarahJoDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Ensure reviews table exists.
IF OBJECT_ID(N'dbo.TbReviews', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbReviews
    (
        ReviewID INT IDENTITY(1,1) CONSTRAINT PK_TbReviews PRIMARY KEY,
        ReviewerID INT NOT NULL,
        ReviewedUserID INT NOT NULL,
        Rating INT NOT NULL CONSTRAINT CK_TbReviews_Rating CHECK (Rating BETWEEN 1 AND 5),
        Comment NVARCHAR(MAX) NOT NULL,
        [Timestamp] DATETIME2 NOT NULL CONSTRAINT DF_TbReviews_Timestamp DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_TbReviews_ReviewerID FOREIGN KEY (ReviewerID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT FK_TbReviews_ReviewedUserID FOREIGN KEY (ReviewedUserID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT UQ_TbReviews_Reviewer_Reviewed UNIQUE (ReviewerID, ReviewedUserID)
    );
END
GO

IF OBJECT_ID(N'dbo.TbReviews', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbReviews_ReviewedUserID'
          AND object_id = OBJECT_ID(N'dbo.TbReviews')
   )
BEGIN
    CREATE INDEX IX_TbReviews_ReviewedUserID ON dbo.TbReviews(ReviewedUserID);
END
GO

IF OBJECT_ID(N'dbo.TbReviews', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbReviews_ReviewedUserID_Timestamp'
          AND object_id = OBJECT_ID(N'dbo.TbReviews')
   )
BEGIN
    CREATE INDEX IX_TbReviews_ReviewedUserID_Timestamp
    ON dbo.TbReviews(ReviewedUserID, [Timestamp] DESC, ReviewID DESC);
END
GO

-- Ensure messages table exists.
IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbMessages
    (
        MessageID INT IDENTITY(1,1) CONSTRAINT PK_TbMessages PRIMARY KEY,
        SenderID INT NOT NULL,
        ReceiverID INT NOT NULL,
        PostID INT NULL,
        Content NVARCHAR(MAX) NOT NULL,
        [Timestamp] DATETIME2 NOT NULL CONSTRAINT DF_TbMessages_Timestamp DEFAULT SYSUTCDATETIME(),
        IsRead BIT NOT NULL CONSTRAINT DF_TbMessages_IsRead DEFAULT 0,
        CONSTRAINT FK_TbMessages_SenderID FOREIGN KEY (SenderID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT FK_TbMessages_ReceiverID FOREIGN KEY (ReceiverID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT FK_TbMessages_PostID FOREIGN KEY (PostID) REFERENCES dbo.TbPosts(PostID)
    );
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Conversation'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE INDEX IX_TbMessages_Conversation
    ON dbo.TbMessages(SenderID, ReceiverID, [Timestamp], MessageID);
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Conversation_Reverse'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE INDEX IX_TbMessages_Conversation_Reverse
    ON dbo.TbMessages(ReceiverID, SenderID, [Timestamp], MessageID);
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Receiver_Unread'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
    )
    BEGIN
        DROP INDEX IX_TbMessages_Receiver_Unread ON dbo.TbMessages;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Receiver_Sender_Unread'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
    )
    BEGIN
        CREATE INDEX IX_TbMessages_Receiver_Sender_Unread
        ON dbo.TbMessages(ReceiverID, SenderID, IsRead)
        INCLUDE ([Timestamp], MessageID);
    END
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Sender_Timestamp'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE INDEX IX_TbMessages_Sender_Timestamp
    ON dbo.TbMessages(SenderID, [Timestamp], MessageID);
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_Receiver_Timestamp'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE INDEX IX_TbMessages_Receiver_Timestamp
    ON dbo.TbMessages(ReceiverID, [Timestamp], MessageID);
END
GO

PRINT 'Chat/review table and index setup complete. Procedure definitions are maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
GO
