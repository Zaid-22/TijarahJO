-- Create the PostComments table to support nested replies
CREATE TABLE dbo.PostComments (
    CommentID INT IDENTITY(1,1) NOT NULL,
    PostID INT NOT NULL,
    UserID INT NOT NULL,
    ParentCommentID INT NULL,
    Content NVARCHAR(1000) NOT NULL,
    CreatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_PostComments_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2(7) NOT NULL CONSTRAINT DF_PostComments_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    DeletedAt DATETIME2(7) NULL,
    IsDeleted BIT NOT NULL CONSTRAINT DF_PostComments_IsDeleted DEFAULT (0),
    
    CONSTRAINT PK_PostComments PRIMARY KEY CLUSTERED (CommentID),
    CONSTRAINT FK_PostComments_Posts FOREIGN KEY (PostID) REFERENCES dbo.Posts(PostID) ON DELETE CASCADE,
    CONSTRAINT FK_PostComments_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID),
    CONSTRAINT FK_PostComments_ParentComment FOREIGN KEY (ParentCommentID) REFERENCES dbo.PostComments(CommentID)
);
GO

-- Create performance indexes for querying comments
CREATE NONCLUSTERED INDEX IX_PostComments_PostID 
    ON dbo.PostComments(PostID) 
    INCLUDE (CommentID, UserID, ParentCommentID, Content, CreatedAt, UpdatedAt)
    WHERE IsDeleted = 0;
GO

CREATE NONCLUSTERED INDEX IX_PostComments_UserID 
    ON dbo.PostComments(UserID)
    WHERE IsDeleted = 0;
GO

CREATE NONCLUSTERED INDEX IX_PostComments_ParentCommentID 
    ON dbo.PostComments(ParentCommentID) 
    INCLUDE (CommentID, PostID, UserID, Content, CreatedAt, UpdatedAt)
    WHERE IsDeleted = 0;
GO

-- Grant typical DML to the app role (assumes tijarahjo_app_role exists)
-- Wrap in TRY/CATCH just in case the role doesn't exist to avoid migration failures in some environments
BEGIN TRY
    GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.PostComments TO tijarahjo_app_role;
END TRY
BEGIN CATCH
    PRINT 'Could not grant permissions to tijarahjo_app_role. Role might not exist.';
END CATCH;
GO
