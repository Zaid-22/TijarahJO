USE [TijarahJoDB];
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying consolidated canonical stored procedures...';
GO

-- ---------------------------------------------------------------------------
-- Legacy name cleanup to avoid collision with built-in sys.sp_* procedures.
-- ---------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS [dbo].[SP_AddRole];
GO

DROP PROCEDURE IF EXISTS [dbo].[SP_AddMessage];
GO

-- ---------------------------------------------------------------------------
-- Users procedures (phone-aware signatures)
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_AddTbUser]
    @HashedPassword NVARCHAR(255),
    @Email NVARCHAR(255),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Phone NVARCHAR(20) = NULL,
    @City NVARCHAR(100) = NULL,
    @Area NVARCHAR(100) = NULL,
    @Bio NVARCHAR(1000) = NULL,
    @Avatar NVARCHAR(MAX) = NULL,
    @JoinDate DATETIME2,
    @Status INT,
    @RoleID INT,
    @IsDeleted BIT,
    @NewUserID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO TbUsers
    (
        HashedPassword, Email, FirstName, LastName, Phone, City, Area, Bio, Avatar,
        JoinDate, Status, RoleID, IsDeleted
    )
    VALUES
    (
        @HashedPassword, @Email, @FirstName, @LastName, @Phone, @City, @Area, @Bio, @Avatar,
        @JoinDate, @Status, @RoleID, @IsDeleted
    );

    SET @NewUserID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_UpdateUser]
    @UserID INT,
    @HashedPassword NVARCHAR(255),
    @Email NVARCHAR(255),
    @FirstName NVARCHAR(100),
    @LastName NVARCHAR(100),
    @Phone NVARCHAR(20) = NULL,
    @City NVARCHAR(100) = NULL,
    @Area NVARCHAR(100) = NULL,
    @Bio NVARCHAR(1000) = NULL,
    @Avatar NVARCHAR(MAX) = NULL,
    @JoinDate DATETIME2,
    @Status INT,
    @RoleID INT,
    @IsDeleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE TbUsers
    SET HashedPassword = COALESCE(@HashedPassword, HashedPassword),
        Email = @Email,
        FirstName = @FirstName,
        LastName = @LastName,
        Phone = @Phone,
        City = @City,
        Area = @Area,
        Bio = @Bio,
        Avatar = @Avatar,
        JoinDate = @JoinDate,
        Status = @Status,
        RoleID = @RoleID,
        IsDeleted = @IsDeleted
    WHERE UserID = @UserID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetUserByID]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT UserID, HashedPassword, Email, FirstName, LastName, Phone, City, Area, Bio, Avatar, JoinDate, Status, RoleID, IsDeleted
    FROM TbUsers
    WHERE UserID = @UserID;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetAllTbUsers]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT UserID, HashedPassword, Email, FirstName, LastName, Phone, City, Area, Bio, Avatar, JoinDate, Status, RoleID, IsDeleted
    FROM TbUsers
    WHERE IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_TbUsers_Login]
    @Login NVARCHAR(255),
    @HashedPassword NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @LoginTrim NVARCHAR(255) = LTRIM(RTRIM(ISNULL(@Login, N'')));
    IF @LoginTrim = N''
    BEGIN
        RETURN;
    END

    IF COL_LENGTH(N'dbo.TbUsers', N'Phone') IS NULL
    BEGIN
        SELECT TOP (1)
               u.UserID,
               u.HashedPassword,
               u.Email,
               u.FirstName,
               u.LastName,
               CAST(NULL AS NVARCHAR(20)) AS Phone,
               CAST(NULL AS NVARCHAR(100)) AS City,
               CAST(NULL AS NVARCHAR(100)) AS Area,
               CAST(NULL AS NVARCHAR(1000)) AS Bio,
               CAST(NULL AS NVARCHAR(MAX)) AS Avatar,
               u.JoinDate,
               u.Status,
               u.RoleID,
               u.IsDeleted
        FROM dbo.TbUsers AS u
        WHERE u.Email = @LoginTrim
          AND u.HashedPassword = @HashedPassword
          AND u.IsDeleted = 0;
        RETURN;
    END

    DECLARE @DigitsOnly NVARCHAR(32) =
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(@LoginTrim, N'+', N''),
                        N' ', N''),
                    N'-', N''),
                N'(', N''),
            N')', N''),
        N'.', N'');
    DECLARE @PhoneLookup NVARCHAR(20) = NULL;

    IF LEN(@DigitsOnly) = 12 AND LEFT(@DigitsOnly, 3) = N'962'
        SET @PhoneLookup = N'+962' + RIGHT(@DigitsOnly, 9);
    ELSE IF LEN(@DigitsOnly) = 10 AND LEFT(@DigitsOnly, 1) = N'0'
        SET @PhoneLookup = N'+962' + RIGHT(@DigitsOnly, 9);
    ELSE IF LEN(@DigitsOnly) = 9
        SET @PhoneLookup = N'+962' + @DigitsOnly;
    ELSE IF LEFT(@LoginTrim, 4) = N'+962' AND LEN(@LoginTrim) = 13
        SET @PhoneLookup = @LoginTrim;

    IF CHARINDEX(N'@', @LoginTrim) > 0
    BEGIN
        SELECT TOP (1)
               u.UserID,
               u.HashedPassword,
               u.Email,
               u.FirstName,
               u.LastName,
               u.Phone,
               u.City,
               u.Area,
               u.Bio,
               u.Avatar,
               u.JoinDate,
               u.Status,
               u.RoleID,
               u.IsDeleted
        FROM dbo.TbUsers AS u
        WHERE u.Email = @LoginTrim
          AND u.HashedPassword = @HashedPassword
          AND u.IsDeleted = 0;
    END
    ELSE
    BEGIN
        IF @PhoneLookup IS NULL
            SET @PhoneLookup = @LoginTrim;

        SELECT TOP (1)
               u.UserID,
               u.HashedPassword,
               u.Email,
               u.FirstName,
               u.LastName,
               u.Phone,
               u.City,
               u.Area,
               u.Bio,
               u.Avatar,
               u.JoinDate,
               u.Status,
               u.RoleID,
               u.IsDeleted
        FROM dbo.TbUsers AS u
        WHERE u.Phone = @PhoneLookup
          AND u.HashedPassword = @HashedPassword
          AND u.IsDeleted = 0;
    END
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DeleteUser]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbUsers
    SET IsDeleted = 1
    WHERE UserID = @UserID
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DoesUserExist]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TbUsers WHERE UserID = @UserID)
        SELECT CAST(1 AS BIT) AS Found;
    ELSE
        SELECT CAST(0 AS BIT) AS Found;
END;
GO

-- ---------------------------------------------------------------------------
-- Categories procedures (visual fields aware)
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_GetCategoryByID]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CategoryID, CategoryName, NameAr, Icon, Color, Image, CreatedAt, IsDeleted
    FROM dbo.TbItemCategories
    WHERE CategoryID = @CategoryID;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_AddCategory]
    @CategoryName NVARCHAR(100),
    @NameAr NVARCHAR(100) = NULL,
    @Icon NVARCHAR(100) = NULL,
    @Color NVARCHAR(20) = NULL,
    @Image NVARCHAR(1000) = NULL,
    @CreatedAt DATETIME2,
    @IsDeleted BIT,
    @NewCategoryID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TbItemCategories (CategoryName, NameAr, Icon, Color, Image, CreatedAt, IsDeleted)
    VALUES (@CategoryName, @NameAr, @Icon, @Color, @Image, @CreatedAt, @IsDeleted);

    SET @NewCategoryID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_UpdateCategory]
    @CategoryID INT,
    @CategoryName NVARCHAR(100),
    @NameAr NVARCHAR(100) = NULL,
    @Icon NVARCHAR(100) = NULL,
    @Color NVARCHAR(20) = NULL,
    @Image NVARCHAR(1000) = NULL,
    @CreatedAt DATETIME2,
    @IsDeleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbItemCategories
    SET CategoryName = @CategoryName,
        NameAr = @NameAr,
        Icon = @Icon,
        Color = @Color,
        Image = @Image,
        CreatedAt = @CreatedAt,
        IsDeleted = @IsDeleted
    WHERE CategoryID = @CategoryID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DeleteCategory]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbItemCategories
    SET IsDeleted = 1
    WHERE CategoryID = @CategoryID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DoesCategoryExist]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TbItemCategories WHERE CategoryID = @CategoryID)
        SELECT CAST(1 AS BIT) AS Found;
    ELSE
        SELECT CAST(0 AS BIT) AS Found;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetAllTbItemCategories]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT CategoryID, CategoryName, NameAr, Icon, Color, Image, CreatedAt, IsDeleted
    FROM dbo.TbItemCategories
    WHERE IsDeleted = 0;
END;
GO

-- ---------------------------------------------------------------------------
-- Roles procedures
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_AddRole]
    @RoleName NVARCHAR(100),
    @CreatedAt DATETIME,
    @IsDeleted BIT,
    @NewRoleID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TbRoles (RoleName, CreatedAt, IsDeleted)
    VALUES (@RoleName, @CreatedAt, @IsDeleted);

    SET @NewRoleID = SCOPE_IDENTITY();
END;
GO

-- Backward-compatible wrapper (deprecated; use SP_AddRole).
CREATE OR ALTER PROCEDURE [dbo].[USP_AddRole]
    @RoleName NVARCHAR(100),
    @CreatedAt DATETIME,
    @IsDeleted BIT,
    @NewRoleID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_AddRole
        @RoleName = @RoleName,
        @CreatedAt = @CreatedAt,
        @IsDeleted = @IsDeleted,
        @NewRoleID = @NewRoleID OUTPUT;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_UpdateRole]
    @RoleID INT,
    @RoleName NVARCHAR(100),
    @CreatedAt DATETIME,
    @IsDeleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbRoles
    SET RoleName = @RoleName,
        CreatedAt = @CreatedAt,
        IsDeleted = @IsDeleted
    WHERE RoleID = @RoleID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetRoleByID]
    @RoleID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT RoleID, RoleName, CreatedAt, IsDeleted
    FROM dbo.TbRoles
    WHERE RoleID = @RoleID;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DeleteRole]
    @RoleID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbRoles
    SET IsDeleted = 1
    WHERE RoleID = @RoleID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DoesRoleExist]
    @RoleID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TbRoles WHERE RoleID = @RoleID)
        SELECT CAST(1 AS BIT) AS Found;
    ELSE
        SELECT CAST(0 AS BIT) AS Found;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetAllTbRoles]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT RoleID, RoleName, CreatedAt, IsDeleted
    FROM dbo.TbRoles
    WHERE IsDeleted = 0;
END;
GO

-- ---------------------------------------------------------------------------
-- Posts and post images procedures
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_AddPost]
    @UserID INT,
    @CategoryID INT,
    @PostTitle NVARCHAR(200),
    @PostDescription NVARCHAR(MAX),
    @Price DECIMAL(18,2),
    @Status INT,
    @CreatedAt DATETIME2,
    @IsDeleted BIT,
    @City NVARCHAR(100) = NULL,
    @Area NVARCHAR(100) = NULL,
    @NewPostID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TbPosts
    (
        UserID, CategoryID, PostTitle, PostDescription, Price, Status,
        CreatedAt, IsDeleted, Views, City, Area
    )
    VALUES
    (
        @UserID, @CategoryID, @PostTitle, @PostDescription, @Price, @Status,
        @CreatedAt, @IsDeleted, 0, @City, @Area
    );

    SET @NewPostID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_UpdatePost]
    @PostID INT,
    @UserID INT,
    @CategoryID INT,
    @PostTitle NVARCHAR(200),
    @PostDescription NVARCHAR(MAX),
    @Price DECIMAL(18,2),
    @Status INT,
    @CreatedAt DATETIME2,
    @IsDeleted BIT,
    @City NVARCHAR(100) = NULL,
    @Area NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbPosts
    SET UserID = @UserID,
        CategoryID = @CategoryID,
        PostTitle = @PostTitle,
        PostDescription = @PostDescription,
        Price = @Price,
        Status = @Status,
        CreatedAt = @CreatedAt,
        IsDeleted = @IsDeleted,
        City = @City,
        Area = @Area
    WHERE PostID = @PostID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetPostByID]
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PostID,
        UserID,
        CategoryID,
        PostTitle,
        PostDescription,
        Price,
        Status,
        CreatedAt,
        IsDeleted,
        ISNULL(Views, 0) AS Views,
        City,
        Area
    FROM dbo.TbPosts
    WHERE PostID = @PostID;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DoesPostExist]
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TbPosts WHERE PostID = @PostID)
        SELECT CAST(1 AS BIT) AS Found;
    ELSE
        SELECT CAST(0 AS BIT) AS Found;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetAllTbUserPosts]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PostID,
        UserID,
        CategoryID,
        PostTitle,
        PostDescription,
        Price,
        Status,
        CreatedAt,
        IsDeleted,
        ISNULL(Views, 0) AS Views,
        City,
        Area
    FROM dbo.TbPosts
    WHERE IsDeleted = 0
    ORDER BY CreatedAt DESC, PostID DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetTbPostsPaged]
    @PageNumber INT = 1,
    @RowsPerPage INT = 10,
    @IncludeDeleted BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    IF (@PageNumber < 1)
        SET @PageNumber = 1;

    IF (@RowsPerPage < 1)
        SET @RowsPerPage = 10;

    DECLARE @Offset INT = (@PageNumber - 1) * @RowsPerPage;

    SELECT
        PostID,
        UserID,
        CategoryID,
        PostTitle,
        PostDescription,
        Price,
        Status,
        CreatedAt,
        IsDeleted,
        ISNULL(Views, 0) AS Views,
        City,
        Area,
        COUNT(*) OVER() AS TotalRows
    FROM dbo.TbPosts
    WHERE (@IncludeDeleted = 1 OR IsDeleted = 0)
    ORDER BY CreatedAt DESC, PostID DESC
    OFFSET @Offset ROWS
    FETCH NEXT @RowsPerPage ROWS ONLY;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_AddPostImage]
    @PostID INT,
    @PostImageURL NVARCHAR(MAX),
    @UploadedAt DATETIME2,
    @IsDeleted BIT,
    @NewPostImageID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO TbPostImages (PostID, PostImageURL, UploadedAt, IsDeleted)
    VALUES (@PostID, @PostImageURL, @UploadedAt, @IsDeleted);

    SET @NewPostImageID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_UpdatePostImage]
    @PostImageID INT,
    @PostID INT,
    @PostImageURL NVARCHAR(MAX),
    @UploadedAt DATETIME2,
    @IsDeleted BIT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbPostImages
    SET PostID = @PostID,
        PostImageURL = @PostImageURL,
        UploadedAt = @UploadedAt,
        IsDeleted = @IsDeleted
    WHERE PostImageID = @PostImageID;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetPostImageByID]
    @PostImageID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT PostImageID, PostID, PostImageURL, UploadedAt, IsDeleted
    FROM dbo.TbPostImages
    WHERE PostImageID = @PostImageID;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DeletePostImage]
    @PostImageID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbPostImages
    SET IsDeleted = 1
    WHERE PostImageID = @PostImageID
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DoesPostImageExist]
    @PostImageID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT 1 FROM dbo.TbPostImages WHERE PostImageID = @PostImageID)
        SELECT CAST(1 AS BIT) AS Found;
    ELSE
        SELECT CAST(0 AS BIT) AS Found;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetAllTbPostImages]
AS
BEGIN
    SET NOCOUNT ON;

    SELECT PostImageID, PostID, PostImageURL, UploadedAt, IsDeleted
    FROM dbo.TbPostImages
    WHERE IsDeleted = 0;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_DeletePost]
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RowsAffected INT = 0;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID(N'dbo.TbPostImages', N'U') IS NOT NULL
        BEGIN
            UPDATE dbo.TbPostImages
            SET IsDeleted = 1
            WHERE PostID = @PostID;
        END

        IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
           AND COL_LENGTH(N'dbo.TbFavorites', N'IsDeleted') IS NOT NULL
        BEGIN
            UPDATE dbo.TbFavorites
            SET IsDeleted = 1
            WHERE PostID = @PostID
              AND IsDeleted = 0;
        END

        UPDATE dbo.TbPosts
        SET IsDeleted = 1
        WHERE PostID = @PostID
          AND IsDeleted = 0;

        SET @RowsAffected = @@ROWCOUNT;

        IF @RowsAffected > 0
        BEGIN
            COMMIT TRANSACTION;
            SELECT @RowsAffected AS RowsAffected;
        END
        ELSE
        BEGIN
            ROLLBACK TRANSACTION;
            SELECT 0 AS RowsAffected;
        END
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        THROW;
    END CATCH
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetPostsByUserID]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PostID,
        UserID,
        CategoryID,
        PostTitle,
        PostDescription,
        Price,
        Status,
        CreatedAt,
        IsDeleted,
        ISNULL(Views, 0) AS Views,
        City,
        Area
    FROM dbo.TbPosts
    WHERE UserID = @UserID
      AND IsDeleted = 0
    ORDER BY CreatedAt DESC, PostID DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetPostsByCategoryID]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        PostID,
        UserID,
        CategoryID,
        PostTitle,
        PostDescription,
        Price,
        Status,
        CreatedAt,
        IsDeleted,
        ISNULL(Views, 0) AS Views,
        City,
        Area
    FROM dbo.TbPosts
    WHERE CategoryID = @CategoryID
      AND IsDeleted = 0
    ORDER BY CreatedAt DESC, PostID DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_IncrementPostViews]
    @PostID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbPosts
    SET Views = ISNULL(Views, 0) + 1
    WHERE PostID = @PostID
      AND IsDeleted = 0;

    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

-- ---------------------------------------------------------------------------
-- Reviews procedures
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_AddReview]
    @ReviewerID INT,
    @ReviewedUserID INT,
    @Rating INT,
    @Comment NVARCHAR(MAX),
    @Timestamp DATETIME2,
    @NewReviewID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TbReviews (ReviewerID, ReviewedUserID, Rating, Comment, [Timestamp])
    VALUES (@ReviewerID, @ReviewedUserID, @Rating, @Comment, @Timestamp);

    SET @NewReviewID = SCOPE_IDENTITY();
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetReviewsByUserId]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.ReviewID,
        r.ReviewerID,
        r.ReviewedUserID,
        r.Rating,
        r.Comment,
        r.[Timestamp],
        LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName, ''), ' ', ISNULL(u.LastName, '')))) AS ReviewerName,
        CAST(NULL AS NVARCHAR(255)) AS ReviewerAvatar
    FROM dbo.TbReviews r
    LEFT JOIN dbo.TbUsers u ON u.UserID = r.ReviewerID
    WHERE r.ReviewedUserID = @UserID
    ORDER BY r.[Timestamp] DESC, r.ReviewID DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_HasReviewed]
    @ReviewerID INT,
    @ReviewedUserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(1)
    FROM dbo.TbReviews
    WHERE ReviewerID = @ReviewerID
      AND ReviewedUserID = @ReviewedUserID;
END;
GO

-- ---------------------------------------------------------------------------
-- Chat procedures
-- ---------------------------------------------------------------------------
CREATE OR ALTER PROCEDURE [dbo].[SP_AddMessage]
    @SenderID INT,
    @ReceiverID INT,
    @PostID INT = NULL,
    @Content NVARCHAR(MAX),
    @Timestamp DATETIME2,
    @IsRead BIT,
    @NewMessageID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.TbMessages (SenderID, ReceiverID, PostID, Content, [Timestamp], IsRead)
    VALUES (@SenderID, @ReceiverID, @PostID, @Content, @Timestamp, @IsRead);

    SET @NewMessageID = SCOPE_IDENTITY();
END;
GO

-- Backward-compatible wrapper (deprecated; use SP_AddMessage).
CREATE OR ALTER PROCEDURE [dbo].[USP_AddMessage]
    @SenderID INT,
    @ReceiverID INT,
    @PostID INT = NULL,
    @Content NVARCHAR(MAX),
    @Timestamp DATETIME2,
    @IsRead BIT,
    @NewMessageID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    EXEC dbo.SP_AddMessage
        @SenderID = @SenderID,
        @ReceiverID = @ReceiverID,
        @PostID = @PostID,
        @Content = @Content,
        @Timestamp = @Timestamp,
        @IsRead = @IsRead,
        @NewMessageID = @NewMessageID OUTPUT;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetChatHistory]
    @UserID1 INT,
    @UserID2 INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        MessageID,
        SenderID,
        ReceiverID,
        PostID,
        Content,
        [Timestamp],
        IsRead
    FROM dbo.TbMessages
    WHERE (SenderID = @UserID1 AND ReceiverID = @UserID2)
       OR (SenderID = @UserID2 AND ReceiverID = @UserID1)
    ORDER BY [Timestamp] ASC, MessageID ASC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_GetRecentChats]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH RankedMessages AS
    (
        SELECT
            m.MessageID,
            m.SenderID,
            m.ReceiverID,
            m.PostID,
            m.Content,
            m.[Timestamp],
            m.IsRead,
            ROW_NUMBER() OVER
            (
                PARTITION BY CASE
                    WHEN m.SenderID = @UserID THEN m.ReceiverID
                    ELSE m.SenderID
                END
                ORDER BY m.[Timestamp] DESC, m.MessageID DESC
            ) AS rn
        FROM dbo.TbMessages m
        WHERE m.SenderID = @UserID OR m.ReceiverID = @UserID
    )
    SELECT
        MessageID,
        SenderID,
        ReceiverID,
        PostID,
        Content,
        [Timestamp],
        IsRead
    FROM RankedMessages
    WHERE rn = 1
    ORDER BY [Timestamp] DESC, MessageID DESC;
END;
GO

CREATE OR ALTER PROCEDURE [dbo].[SP_MarkMessagesAsRead]
    @ReceiverID INT,
    @SenderID INT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TbMessages
    SET IsRead = 1
    WHERE ReceiverID = @ReceiverID
      AND SenderID = @SenderID
      AND IsRead = 0;
END;
GO

PRINT 'Canonical stored procedure consolidation completed.';
GO
