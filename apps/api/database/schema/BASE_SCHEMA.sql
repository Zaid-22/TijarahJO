-- =============================================================================
-- TijarahJo Base Schema (Canonical Source)
-- Tables and constraints only. No procedures, seed data, or indexes.
-- =============================================================================

IF DB_ID(N'TijarahJoDB') IS NULL
BEGIN
    CREATE DATABASE TijarahJoDB;
END
GO

USE TijarahJoDB;
GO

IF OBJECT_ID(N'dbo.TbRoles', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbRoles
    (
        RoleID INT IDENTITY(1,1) CONSTRAINT PK_TbRoles PRIMARY KEY,
        RoleName NVARCHAR(50) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TbRoles_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbRoles_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_TbRoles_RoleName UNIQUE (RoleName)
    );
END
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbUsers
    (
        UserID INT IDENTITY(1,1) CONSTRAINT PK_TbUsers PRIMARY KEY,
        HashedPassword NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        FirstName NVARCHAR(100) NOT NULL,
        LastName NVARCHAR(100) NULL,
        JoinDate DATETIME2 NOT NULL CONSTRAINT DF_TbUsers_JoinDate DEFAULT SYSUTCDATETIME(),
        Status INT NOT NULL CONSTRAINT DF_TbUsers_Status DEFAULT 1,
        RoleID INT NOT NULL,
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbUsers_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_TbUsers_Email UNIQUE (Email),
        CONSTRAINT CK_TbUsers_Status CHECK (Status IN (0, 1, 2, 3)),
        CONSTRAINT FK_TbUsers_RoleID FOREIGN KEY (RoleID) REFERENCES dbo.TbRoles(RoleID)
    );
END
GO

IF OBJECT_ID(N'dbo.TbItemCategories', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbItemCategories
    (
        CategoryID INT IDENTITY(1,1) CONSTRAINT PK_TbItemCategories PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TbItemCategories_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbItemCategories_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_TbItemCategories_CategoryName UNIQUE (CategoryName)
    );
END
GO

IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbPosts
    (
        PostID INT IDENTITY(1,1) CONSTRAINT PK_TbPosts PRIMARY KEY,
        UserID INT NOT NULL,
        CategoryID INT NOT NULL,
        PostTitle NVARCHAR(200) NOT NULL,
        PostDescription NVARCHAR(MAX) NULL,
        Price DECIMAL(18,2) NULL,
        Status INT NOT NULL CONSTRAINT DF_TbPosts_Status DEFAULT 0,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TbPosts_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbPosts_IsDeleted DEFAULT 0,
        CONSTRAINT CK_TbPosts_Price CHECK (Price IS NULL OR Price >= 0),
        CONSTRAINT CK_TbPosts_Status CHECK (Status IN (0, 1, 2, 3)),
        CONSTRAINT FK_TbPosts_UserID FOREIGN KEY (UserID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT FK_TbPosts_CategoryID FOREIGN KEY (CategoryID) REFERENCES dbo.TbItemCategories(CategoryID)
    );
END
GO

IF OBJECT_ID(N'dbo.TbPostImages', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbPostImages
    (
        PostImageID INT IDENTITY(1,1) CONSTRAINT PK_TbPostImages PRIMARY KEY,
        PostID INT NOT NULL,
        PostImageURL NVARCHAR(MAX) NOT NULL,
        UploadedAt DATETIME2 NOT NULL CONSTRAINT DF_TbPostImages_UploadedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbPostImages_IsDeleted DEFAULT 0,
        CONSTRAINT FK_TbPostImages_PostID FOREIGN KEY (PostID) REFERENCES dbo.TbPosts(PostID)
    );
END
GO
