-- ============================================
-- Migration: Add TbFavorites table
-- ============================================

USE TijarahJoDB;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TbFavorites
    (
        FavoriteID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TbFavorites PRIMARY KEY,
        UserID INT NOT NULL,
        PostID INT NOT NULL,
        CreatedAt DATETIME2 NOT NULL CONSTRAINT DF_TbFavorites_CreatedAt DEFAULT SYSUTCDATETIME(),
        IsDeleted BIT NOT NULL CONSTRAINT DF_TbFavorites_IsDeleted DEFAULT 0,
        CONSTRAINT UQ_TbFavorites_UserID_PostID UNIQUE (UserID, PostID),
        CONSTRAINT FK_TbFavorites_UserID FOREIGN KEY (UserID) REFERENCES dbo.TbUsers(UserID),
        CONSTRAINT FK_TbFavorites_PostID FOREIGN KEY (PostID) REFERENCES dbo.TbPosts(PostID)
    );
END;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbFavorites', N'IsDeleted') IS NULL
    BEGIN
        ALTER TABLE dbo.TbFavorites
        ADD IsDeleted BIT NOT NULL CONSTRAINT DF_TbFavorites_IsDeleted DEFAULT 0;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_TbFavorites_UserID'
          AND parent_object_id = OBJECT_ID(N'dbo.TbFavorites')
          AND delete_referential_action_desc <> N'NO_ACTION'
    )
    BEGIN
        ALTER TABLE dbo.TbFavorites DROP CONSTRAINT FK_TbFavorites_UserID;
        ALTER TABLE dbo.TbFavorites
        ADD CONSTRAINT FK_TbFavorites_UserID
            FOREIGN KEY (UserID) REFERENCES dbo.TbUsers(UserID);
    END

    IF EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_TbFavorites_PostID'
          AND parent_object_id = OBJECT_ID(N'dbo.TbFavorites')
          AND delete_referential_action_desc <> N'NO_ACTION'
    )
    BEGIN
        ALTER TABLE dbo.TbFavorites DROP CONSTRAINT FK_TbFavorites_PostID;
        ALTER TABLE dbo.TbFavorites
        ADD CONSTRAINT FK_TbFavorites_PostID
            FOREIGN KEY (PostID) REFERENCES dbo.TbPosts(PostID);
    END
END;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbFavorites_UserID'
          AND object_id = OBJECT_ID(N'dbo.TbFavorites')
   )
BEGIN
    CREATE INDEX IX_TbFavorites_UserID ON dbo.TbFavorites(UserID);
END;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbFavorites_PostID'
          AND object_id = OBJECT_ID(N'dbo.TbFavorites')
   )
BEGIN
    CREATE INDEX IX_TbFavorites_PostID ON dbo.TbFavorites(PostID);
END;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbFavorites_UserID_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.TbFavorites')
   )
BEGIN
    DROP INDEX IX_TbFavorites_UserID_CreatedAt ON dbo.TbFavorites;
END;
GO

IF OBJECT_ID(N'dbo.TbFavorites', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbFavorites_UserID_IsDeleted_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.TbFavorites')
   )
BEGIN
    CREATE INDEX IX_TbFavorites_UserID_IsDeleted_CreatedAt
    ON dbo.TbFavorites(UserID, IsDeleted, CreatedAt DESC, FavoriteID DESC);
END;
GO
