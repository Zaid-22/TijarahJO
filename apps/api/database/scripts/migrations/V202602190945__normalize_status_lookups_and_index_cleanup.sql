USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying status lookup normalization and index cleanup...';
GO

-- ============================================================
-- 1) Status lookup tables (normalization with backward compatibility)
-- ============================================================
IF OBJECT_ID(N'dbo.UserStatusLookup', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserStatusLookup
    (
        StatusID INT NOT NULL CONSTRAINT PK_UserStatusLookup PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL CONSTRAINT UQ_UserStatusLookup_Code UNIQUE,
        StatusName NVARCHAR(50) NOT NULL CONSTRAINT UQ_UserStatusLookup_StatusName UNIQUE,
        IsActive BIT NOT NULL,
        Description NVARCHAR(200) NULL
    );

    PRINT 'Created dbo.UserStatusLookup.';
END
GO

IF OBJECT_ID(N'dbo.UserStatusLookup', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.UserStatusLookup', N'Code') IS NULL
BEGIN
    ALTER TABLE dbo.UserStatusLookup
    ADD Code NVARCHAR(50) NULL;
END
GO

MERGE dbo.UserStatusLookup AS target
USING
(
    VALUES
        (1, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Active user account'),
        (2, N'BANNED', N'BANNED', CAST(0 AS BIT), N'Banned user account'),
        (3, N'INACTIVE', N'INACTIVE', CAST(0 AS BIT), N'Inactive user account')
) AS source (StatusID, Code, StatusName, IsActive, Description)
ON target.StatusID = source.StatusID
WHEN MATCHED THEN
    UPDATE SET
        target.Code = source.Code,
        target.StatusName = source.StatusName,
        target.IsActive = source.IsActive,
        target.Description = source.Description
WHEN NOT MATCHED BY TARGET THEN
    INSERT (StatusID, Code, StatusName, IsActive, Description)
    VALUES (source.StatusID, source.Code, source.StatusName, source.IsActive, source.Description);
GO

IF OBJECT_ID(N'dbo.UserStatusLookup', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.UserStatusLookup
    SET Code = UPPER(StatusName)
    WHERE Code IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.UserStatusLookup')
          AND name = N'Code'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.UserStatusLookup
        ALTER COLUMN Code NVARCHAR(50) NOT NULL;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_UserStatusLookup_Code'
          AND parent_object_id = OBJECT_ID(N'dbo.UserStatusLookup')
    )
    BEGIN
        ALTER TABLE dbo.UserStatusLookup
        ADD CONSTRAINT UQ_UserStatusLookup_Code UNIQUE (Code);
    END
END
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PostStatusLookup
    (
        StatusID INT NOT NULL CONSTRAINT PK_PostStatusLookup PRIMARY KEY,
        Code NVARCHAR(50) NOT NULL CONSTRAINT UQ_PostStatusLookup_Code UNIQUE,
        StatusName NVARCHAR(50) NOT NULL CONSTRAINT UQ_PostStatusLookup_StatusName UNIQUE,
        IsVisible BIT NOT NULL,
        Description NVARCHAR(200) NULL
    );

    PRINT 'Created dbo.PostStatusLookup.';
END
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PostStatusLookup', N'Code') IS NULL
BEGIN
    ALTER TABLE dbo.PostStatusLookup
    ADD Code NVARCHAR(50) NULL;
END
GO

MERGE dbo.PostStatusLookup AS target
USING
(
    VALUES
        (0, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Visible active listing'),
        (1, N'BANNED', N'BANNED', CAST(0 AS BIT), N'Moderated listing'),
        (3, N'SOLD', N'SOLD', CAST(0 AS BIT), N'Sold listing')
) AS source (StatusID, Code, StatusName, IsVisible, Description)
ON target.StatusID = source.StatusID
WHEN MATCHED THEN
    UPDATE SET
        target.Code = source.Code,
        target.StatusName = source.StatusName,
        target.IsVisible = source.IsVisible,
        target.Description = source.Description
WHEN NOT MATCHED BY TARGET THEN
    INSERT (StatusID, Code, StatusName, IsVisible, Description)
    VALUES (source.StatusID, source.Code, source.StatusName, source.IsVisible, source.Description);
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.PostStatusLookup
    SET Code = UPPER(StatusName)
    WHERE Code IS NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.PostStatusLookup')
          AND name = N'Code'
          AND is_nullable = 1
    )
    BEGIN
        ALTER TABLE dbo.PostStatusLookup
        ALTER COLUMN Code NVARCHAR(50) NOT NULL;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.key_constraints
        WHERE name = N'UQ_PostStatusLookup_Code'
          AND parent_object_id = OBJECT_ID(N'dbo.PostStatusLookup')
    )
    BEGIN
        ALTER TABLE dbo.PostStatusLookup
        ADD CONSTRAINT UQ_PostStatusLookup_Code UNIQUE (Code);
    END
END
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    -- Normalize out-of-range status values before FK enforcement.
    -- Soft-delete is controlled by IsDeleted only.
    UPDATE u
    SET u.Status = 1
    FROM dbo.TbUsers AS u
    LEFT JOIN dbo.UserStatusLookup AS s
      ON s.StatusID = u.Status
    WHERE s.StatusID IS NULL OR u.Status = 0;

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_TbUsers_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        ALTER TABLE dbo.TbUsers DROP CONSTRAINT CK_TbUsers_Status;
    END

    ALTER TABLE dbo.TbUsers WITH CHECK
    ADD CONSTRAINT CK_TbUsers_Status CHECK (Status IN (0, 1, 2, 3));
    ALTER TABLE dbo.TbUsers CHECK CONSTRAINT CK_TbUsers_Status;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_TbUsers_StatusLookup'
          AND parent_object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        ALTER TABLE dbo.TbUsers
        ADD CONSTRAINT FK_TbUsers_StatusLookup
            FOREIGN KEY (Status) REFERENCES dbo.UserStatusLookup(StatusID);
        PRINT 'Added FK_TbUsers_StatusLookup.';
    END
END
GO

IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    -- Normalize out-of-range status values before FK enforcement.
    -- Soft-delete is controlled by IsDeleted only.
    UPDATE p
    SET p.Status = 0
    FROM dbo.TbPosts AS p
    LEFT JOIN dbo.PostStatusLookup AS s
      ON s.StatusID = p.Status
    WHERE s.StatusID IS NULL OR p.Status = 2;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_TbPosts_StatusLookup'
          AND parent_object_id = OBJECT_ID(N'dbo.TbPosts')
    )
    BEGIN
        ALTER TABLE dbo.TbPosts
        ADD CONSTRAINT FK_TbPosts_StatusLookup
            FOREIGN KEY (Status) REFERENCES dbo.PostStatusLookup(StatusID);
        PRINT 'Added FK_TbPosts_StatusLookup.';
    END
END
GO

-- ============================================================
-- 2) Index consolidation (remove clear redundancies)
-- ============================================================
IF OBJECT_ID(N'dbo.TbItemCategories', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_TbItemCategories_CategoryName'
          AND object_id = OBJECT_ID(N'dbo.TbItemCategories')
   )
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbItemCategories_Name'
          AND object_id = OBJECT_ID(N'dbo.TbItemCategories')
   )
BEGIN
    DROP INDEX IX_TbItemCategories_Name ON dbo.TbItemCategories;
    PRINT 'Dropped redundant IX_TbItemCategories_Name.';
END
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_TbUsers_Email'
          AND object_id = OBJECT_ID(N'dbo.TbUsers')
   )
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbUsers_Email'
          AND object_id = OBJECT_ID(N'dbo.TbUsers')
   )
BEGIN
    DROP INDEX IX_TbUsers_Email ON dbo.TbUsers;
    PRINT 'Dropped redundant IX_TbUsers_Email.';
END
GO

-- Merge phone login coverage into unique filtered index, then remove duplicate.
IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_TbUsers_Phone_Active'
          AND object_id = OBJECT_ID(N'dbo.TbUsers')
   )
BEGIN
    DECLARE @PhoneUniqueHasIncludes BIT = 0;

    IF EXISTS (
        SELECT 1
        FROM sys.index_columns ic
        JOIN sys.indexes i
          ON i.object_id = ic.object_id
         AND i.index_id = ic.index_id
        WHERE i.object_id = OBJECT_ID(N'dbo.TbUsers')
          AND i.name = N'UQ_TbUsers_Phone_Active'
          AND ic.is_included_column = 1
    )
    BEGIN
        SET @PhoneUniqueHasIncludes = 1;
    END

    IF @PhoneUniqueHasIncludes = 0
    BEGIN
        DROP INDEX UQ_TbUsers_Phone_Active ON dbo.TbUsers;

        CREATE UNIQUE NONCLUSTERED INDEX UQ_TbUsers_Phone_Active
        ON dbo.TbUsers (Phone)
        INCLUDE (UserID, HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID)
        WHERE IsDeleted = 0 AND Phone IS NOT NULL;

        PRINT 'Recreated UQ_TbUsers_Phone_Active with INCLUDE columns.';
    END

    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbUsers_Login_Phone_Active'
          AND object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        DROP INDEX IX_TbUsers_Login_Phone_Active ON dbo.TbUsers;
        PRINT 'Dropped redundant IX_TbUsers_Login_Phone_Active.';
    END
END
GO

IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_SearchCity'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
   )
   AND EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_City'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
   )
BEGIN
    DROP INDEX IX_TbPosts_City ON dbo.TbPosts;
    PRINT 'Dropped redundant IX_TbPosts_City (covered by IX_TbPosts_SearchCity).';
END
GO

PRINT 'Status lookup normalization and index cleanup completed.';
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602190945__normalize_status_lookups_and_index_cleanup.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202602190945__normalize_status_lookups_and_index_cleanup.sql',
        SYSUTCDATETIME(),
        N'Status normalization + index cleanup'
    );
END
GO
