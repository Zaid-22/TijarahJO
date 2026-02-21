USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying canonical schema consistency migration...';
GO

-- ------------------------------------------------------------
-- 1) Lookup status data alignment
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.UserStatusLookup', N'U') IS NOT NULL
BEGIN
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
END
GO

IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NOT NULL
BEGIN
    MERGE dbo.PostStatusLookup AS target
    USING
    (
        VALUES
            (0, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Visible active listing'),
            (1, N'BLOCKED', N'BLOCKED', CAST(0 AS BIT), N'Moderated listing'),
            (2, N'DELETED', N'DELETED', CAST(0 AS BIT), N'Soft deleted listing'),
            (3, N'SOLD', N'SOLD', CAST(1 AS BIT), N'Sold listing')
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
END
GO

-- ------------------------------------------------------------
-- 2) Column/type consistency
-- ------------------------------------------------------------
IF EXISTS (
    SELECT 1
    FROM sys.columns AS c
    WHERE c.object_id = OBJECT_ID(N'dbo.Users')
      AND c.name = N'HashedPassword'
      AND c.max_length <> -1
      AND c.max_length < 1000
)
BEGIN
    ALTER TABLE dbo.Users
    ALTER COLUMN HashedPassword NVARCHAR(500) NOT NULL;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns AS c
    INNER JOIN sys.types AS t
        ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID(N'dbo.Posts')
      AND c.name = N'Views'
      AND t.name <> N'bigint'
)
BEGIN
    ALTER TABLE dbo.Posts
    ALTER COLUMN Views BIGINT NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.Posts
    SET Views = 0
    WHERE Views < 0;
END
GO

-- ------------------------------------------------------------
-- 3) Status domain constraints
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.Users
    SET Status = 1
    WHERE Status NOT IN (1, 2, 3);

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Users_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.Users')
    )
    BEGIN
        ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_Status;
    END

    ALTER TABLE dbo.Users WITH CHECK
    ADD CONSTRAINT CK_Users_Status CHECK (Status IN (1, 2, 3));

    ALTER TABLE dbo.Users CHECK CONSTRAINT CK_Users_Status;
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.Posts
    SET Status = 0
    WHERE Status NOT IN (0, 1, 2, 3);

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        ALTER TABLE dbo.Posts DROP CONSTRAINT CK_Posts_Status;
    END

    ALTER TABLE dbo.Posts WITH CHECK
    ADD CONSTRAINT CK_Posts_Status CHECK (Status IN (0, 1, 2, 3));

    ALTER TABLE dbo.Posts CHECK CONSTRAINT CK_Posts_Status;
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_Views_NonNegative'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
   )
BEGIN
    ALTER TABLE dbo.Posts
    ADD CONSTRAINT CK_Posts_Views_NonNegative CHECK (Views >= 0);
END
GO

-- ------------------------------------------------------------
-- 4) Search computed columns expected by runtime queries
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Posts', N'SearchTitleNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.Posts
        ADD SearchTitleNormalized AS
            CONVERT(NVARCHAR(200), UPPER(LTRIM(RTRIM(ISNULL(PostTitle, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.Posts', N'SearchDescriptionPrefixNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.Posts
        ADD SearchDescriptionPrefixNormalized AS
            CONVERT(NVARCHAR(450), UPPER(LEFT(LTRIM(RTRIM(ISNULL(PostDescription, N''))), 450)))
            PERSISTED;
    END
END
GO

IF OBJECT_ID(N'dbo.Categories', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Categories', N'SearchCategoryNameNormalized') IS NULL
BEGIN
    ALTER TABLE dbo.Categories
    ADD SearchCategoryNameNormalized AS
        CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(CategoryName, N'')))))
        PERSISTED;
END
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.Users', N'SearchFirstNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD SearchFirstNameNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(FirstName, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.Users', N'SearchLastNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD SearchLastNameNormalized AS
            CONVERT(NVARCHAR(100), UPPER(LTRIM(RTRIM(ISNULL(LastName, N'')))))
            PERSISTED;
    END

    IF COL_LENGTH(N'dbo.Users', N'SearchFullNameNormalized') IS NULL
    BEGIN
        ALTER TABLE dbo.Users
        ADD SearchFullNameNormalized AS
            CONVERT(NVARCHAR(201), UPPER(LTRIM(RTRIM(CONCAT(ISNULL(FirstName, N''), N' ', ISNULL(LastName, N''))))))
            PERSISTED;
    END
END
GO

-- ------------------------------------------------------------
-- 5) Location consistency constraints
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Areas', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_Areas_AreaID_CityID'
          AND object_id = OBJECT_ID(N'dbo.Areas')
   )
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Areas_AreaID_CityID
    ON dbo.Areas (AreaID, CityID);
END
GO

IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
BEGIN
    UPDATE u
    SET CityID = a.CityID
    FROM dbo.Users AS u
    INNER JOIN dbo.Areas AS a ON a.AreaID = u.AreaID
    WHERE u.AreaID IS NOT NULL
      AND (u.CityID IS NULL OR u.CityID <> a.CityID);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Users_AreaRequiresCity'
          AND parent_object_id = OBJECT_ID(N'dbo.Users')
    )
    BEGIN
        ALTER TABLE dbo.Users
        ADD CONSTRAINT CK_Users_AreaRequiresCity CHECK (AreaID IS NULL OR CityID IS NOT NULL);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_Users_AreaCity_Consistency'
          AND parent_object_id = OBJECT_ID(N'dbo.Users')
    )
    BEGIN
        ALTER TABLE dbo.Users
        ADD CONSTRAINT FK_Users_AreaCity_Consistency
            FOREIGN KEY (AreaID, CityID)
            REFERENCES dbo.Areas (AreaID, CityID);
    END
END
GO

IF OBJECT_ID(N'dbo.Posts', N'U') IS NOT NULL
BEGIN
    UPDATE p
    SET CityID = a.CityID
    FROM dbo.Posts AS p
    INNER JOIN dbo.Areas AS a ON a.AreaID = p.AreaID
    WHERE p.AreaID IS NOT NULL
      AND (p.CityID IS NULL OR p.CityID <> a.CityID);

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_AreaRequiresCity'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        ALTER TABLE dbo.Posts
        ADD CONSTRAINT CK_Posts_AreaRequiresCity CHECK (AreaID IS NULL OR CityID IS NOT NULL);
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.foreign_keys
        WHERE name = N'FK_Posts_AreaCity_Consistency'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        ALTER TABLE dbo.Posts
        ADD CONSTRAINT FK_Posts_AreaCity_Consistency
            FOREIGN KEY (AreaID, CityID)
            REFERENCES dbo.Areas (AreaID, CityID);
    END
END
GO

-- ------------------------------------------------------------
-- 6) Relational integrity hardening
-- ------------------------------------------------------------
IF OBJECT_ID(N'dbo.Reviews', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.Reviews
        WHERE ReviewerID = ReviewedUserID
    )
    BEGIN
        THROW 51061, 'Self-reviews detected in dbo.Reviews. Resolve data manually before applying this migration.', 1;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Reviews_NoSelfReview'
          AND parent_object_id = OBJECT_ID(N'dbo.Reviews')
    )
    BEGIN
        ALTER TABLE dbo.Reviews
        ADD CONSTRAINT CK_Reviews_NoSelfReview CHECK (ReviewerID <> ReviewedUserID);
    END
END
GO

IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.Conversations
        WHERE User1ID >= User2ID
    )
    BEGIN
        THROW 51062, 'Invalid conversation ordering detected (User1ID must be < User2ID). Resolve data manually before migration.', 1;
    END

    IF EXISTS (
        SELECT 1
        FROM (
            SELECT
                User1ID,
                User2ID,
                PostID
            FROM dbo.Conversations
            GROUP BY User1ID, User2ID, PostID
            HAVING COUNT(*) > 1
        ) AS DuplicateConversations
    )
    BEGIN
        THROW 51063, 'Duplicate conversation pairs detected. Resolve duplicates manually before migration.', 1;
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Conversations_UserPairOrdered'
          AND parent_object_id = OBJECT_ID(N'dbo.Conversations')
    )
    BEGIN
        ALTER TABLE dbo.Conversations
        ADD CONSTRAINT CK_Conversations_UserPairOrdered CHECK (User1ID < User2ID);
    END
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602200900__canonical_schema_consistency.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202602200900__canonical_schema_consistency.sql',
        SYSUTCDATETIME(),
        N'Canonical schema consistency: statuses, types, computed columns, and integrity checks'
    );
END
GO

PRINT 'Canonical schema consistency migration complete.';
GO
