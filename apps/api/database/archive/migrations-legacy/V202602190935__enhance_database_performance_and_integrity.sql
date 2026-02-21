USE TijarahJoDB;
GO

-- Required session options for filtered indexes.
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying database performance and integrity enhancements...';
GO

-- ============================================================
-- 1) Data normalization (safe, idempotent)
-- ============================================================
IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.TbUsers
    SET Email = LOWER(LTRIM(RTRIM(Email)))
    WHERE Email <> LOWER(LTRIM(RTRIM(Email)));

    UPDATE dbo.TbUsers
    SET FirstName = LTRIM(RTRIM(FirstName))
    WHERE FirstName <> LTRIM(RTRIM(FirstName));

    UPDATE dbo.TbUsers
    SET LastName = NULLIF(LTRIM(RTRIM(LastName)), N'')
    WHERE LastName IS NOT NULL;

    IF COL_LENGTH(N'dbo.TbUsers', N'Phone') IS NOT NULL
    BEGIN
        UPDATE dbo.TbUsers
        SET Phone = NULLIF(LTRIM(RTRIM(Phone)), N'')
        WHERE Phone IS NOT NULL;

        ;WITH PhoneCandidates AS
        (
            SELECT
                UserID,
                LTRIM(RTRIM(Phone)) AS TrimPhone,
                REPLACE(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(
                                    REPLACE(LTRIM(RTRIM(Phone)), N'+', N''),
                                N' ', N''),
                            N'-', N''),
                        N'(', N''),
                    N')', N''),
                N'.', N'') AS DigitsOnly
            FROM dbo.TbUsers
            WHERE Phone IS NOT NULL
        )
        UPDATE u
        SET Phone =
            CASE
                WHEN LEN(pc.DigitsOnly) = 12 AND LEFT(pc.DigitsOnly, 3) = N'962'
                    THEN N'+962' + RIGHT(pc.DigitsOnly, 9)
                WHEN LEN(pc.DigitsOnly) = 10 AND LEFT(pc.DigitsOnly, 1) = N'0'
                    THEN N'+962' + RIGHT(pc.DigitsOnly, 9)
                WHEN LEN(pc.DigitsOnly) = 9
                    THEN N'+962' + pc.DigitsOnly
                ELSE pc.TrimPhone
            END
        FROM dbo.TbUsers AS u
        INNER JOIN PhoneCandidates AS pc
            ON pc.UserID = u.UserID;
    END
END
GO

-- ============================================================
-- 2) Integrity checks (deterministic / fail-fast)
-- ============================================================
IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_TbUsers_Email_NotBlank'
          AND parent_object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM dbo.TbUsers
            WHERE LTRIM(RTRIM(ISNULL(Email, N''))) = N''
        )
        BEGIN
            THROW 51001, 'Cannot apply CK_TbUsers_Email_NotBlank: blank email values exist in dbo.TbUsers.', 1;
        END

        ALTER TABLE dbo.TbUsers
        ADD CONSTRAINT CK_TbUsers_Email_NotBlank
            CHECK (LEN(LTRIM(RTRIM(Email))) > 0);
        PRINT 'Added constraint CK_TbUsers_Email_NotBlank.';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_TbUsers_FirstName_NotBlank'
          AND parent_object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        IF EXISTS (
            SELECT 1
            FROM dbo.TbUsers
            WHERE LTRIM(RTRIM(ISNULL(FirstName, N''))) = N''
        )
        BEGIN
            THROW 51002, 'Cannot apply CK_TbUsers_FirstName_NotBlank: blank first-name values exist in dbo.TbUsers.', 1;
        END

        ALTER TABLE dbo.TbUsers
        ADD CONSTRAINT CK_TbUsers_FirstName_NotBlank
            CHECK (LEN(LTRIM(RTRIM(FirstName))) > 0);
        PRINT 'Added constraint CK_TbUsers_FirstName_NotBlank.';
    END
END
GO

-- ============================================================
-- 3) Indexes for auth/login and common query paths
-- ============================================================
IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbUsers', N'Phone') IS NOT NULL
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbUsers_Login_Email_Active'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_TbUsers_Login_Email_Active
            ON dbo.TbUsers (Email)
            INCLUDE (UserID, HashedPassword, FirstName, LastName, Phone, JoinDate, Status, RoleID)
            WHERE IsDeleted = 0;
            PRINT 'Created index IX_TbUsers_Login_Email_Active.';
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbUsers_Login_Phone_Active'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_TbUsers_Login_Phone_Active
            ON dbo.TbUsers (Phone)
            INCLUDE (UserID, HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID)
            WHERE IsDeleted = 0 AND Phone IS NOT NULL;
            PRINT 'Created index IX_TbUsers_Login_Phone_Active.';
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'UQ_TbUsers_Phone_Active'
              AND object_id = OBJECT_ID(N'dbo.TbUsers')
        )
        BEGIN
            IF EXISTS (
                SELECT Phone
                FROM dbo.TbUsers
                WHERE IsDeleted = 0
                  AND Phone IS NOT NULL
                GROUP BY Phone
                HAVING COUNT(*) > 1
            )
            BEGIN
                THROW 51003, 'Cannot apply UQ_TbUsers_Phone_Active: duplicate active phone values exist in dbo.TbUsers.', 1;
            END

            CREATE UNIQUE NONCLUSTERED INDEX UQ_TbUsers_Phone_Active
            ON dbo.TbUsers (Phone)
            WHERE IsDeleted = 0 AND Phone IS NOT NULL;
            PRINT 'Created unique index UQ_TbUsers_Phone_Active.';
        END
    END
END
GO

IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_UserID_IsDeleted_Status'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_UserID_IsDeleted_Status
        ON dbo.TbPosts (UserID, IsDeleted, Status)
        INCLUDE (Views, CreatedAt, CategoryID, Price);
        PRINT 'Created index IX_TbPosts_UserID_IsDeleted_Status.';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_IsDeleted_CreatedAt'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_IsDeleted_CreatedAt
        ON dbo.TbPosts (IsDeleted, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Status, Price, Views);
        PRINT 'Created index IX_TbPosts_IsDeleted_CreatedAt.';
    END

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_IsDeleted_Price'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_IsDeleted_Price
        ON dbo.TbPosts (IsDeleted, Price DESC, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Status, Views)
        WHERE Price IS NOT NULL;
        PRINT 'Created index IX_TbPosts_IsDeleted_Price.';
    END
END
GO

IF OBJECT_ID(N'dbo.TbPostImages', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbPostImages', N'IsDeleted') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPostImages_PostID_IsDeleted'
              AND object_id = OBJECT_ID(N'dbo.TbPostImages')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPostImages_PostID_IsDeleted
        ON dbo.TbPostImages (PostID, IsDeleted)
        INCLUDE (PostImageURL);
        PRINT 'Created index IX_TbPostImages_PostID_IsDeleted.';
    END
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.TbMessages', N'PostID') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbMessages_PostID'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_TbMessages_PostID
    ON dbo.TbMessages (PostID)
    WHERE PostID IS NOT NULL;
    PRINT 'Created index IX_TbMessages_PostID.';
END
GO

PRINT 'usp_TbUsers_Login definition is maintained in procedures/CANONICAL_STORED_PROCEDURES.sql.';
PRINT 'Database performance and integrity enhancements (non-procedure changes) completed.';
GO
