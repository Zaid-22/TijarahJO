USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

/*
Dev/Test-only safety gate
-------------------------
This script intentionally refuses to run unless sqlcmd variable ALLOW_DEV_DATA_CLEANUP=1 is provided.

Example:
  sqlcmd ... -v ALLOW_DEV_DATA_CLEANUP=1 -i apps/api/database/ops/dev-only/CLEANUP_TEST_DATA.sql
*/
IF '$(ALLOW_DEV_DATA_CLEANUP)' <> '1'
BEGIN
    THROW 51090, 'CLEANUP_TEST_DATA.sql is blocked. Re-run with sqlcmd variable ALLOW_DEV_DATA_CLEANUP=1 in dev/test only.', 1;
END
GO

PRINT '========================================';
PRINT 'Cleaning up test data from database';
PRINT '========================================';
GO

-- This script is intentionally conservative:
-- 1) Deletes only known sample/test data.
-- 2) Deletes FK-dependent rows first.
-- 3) Keeps user-account deletion optional.

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @TargetUsers TABLE (UserID INT PRIMARY KEY);
    INSERT INTO @TargetUsers (UserID)
    SELECT u.UserID
    FROM dbo.Users AS u
    WHERE u.Email IN (
        'admin@tijarahjo.com',
        'user1@tijarahjo.com',
        'test@example.com',
        'test@test.com',
        'demo@demo.com'
    )
    OR (u.Email LIKE 'test%@example.%')
    OR (u.Email LIKE 'demo%@demo.%')
    OR (u.FirstName = 'Super' AND u.LastName = 'Admin')
    OR (u.FirstName = 'Test' AND u.LastName = 'User')
    OR (u.FirstName = 'Demo' AND u.LastName = 'Account');

    DECLARE @TargetPosts TABLE (PostID INT PRIMARY KEY);

    INSERT INTO @TargetPosts (PostID)
    SELECT p.PostID
    FROM dbo.Posts AS p
    WHERE p.PostTitle IN (
        'iPhone 14 Pro Max 256GB',
        'Sony WH-1000XM5 Wireless Headphones',
        'Modern Sofa Set - 3 Pieces',
        'MacBook Pro 14" M2 Chip',
        'Dining Table with 6 Chairs',
        'Samsung 55" 4K Smart TV',
        'PlayStation 5 Disc Edition',
        'Canon EOS R6 Camera Body',
        'iPhone 13 for Sale',
        'Freelance Web Design'
    );

    INSERT INTO @TargetPosts (PostID)
    SELECT p.PostID
    FROM dbo.Posts AS p
    INNER JOIN @TargetUsers AS tu ON tu.UserID = p.UserID
    WHERE NOT EXISTS (SELECT 1 FROM @TargetPosts tp WHERE tp.PostID = p.PostID);

    IF OBJECT_ID(N'dbo.Favorites', N'U') IS NOT NULL
    BEGIN
        UPDATE f
        SET IsDeleted = 1
        FROM dbo.Favorites AS f
        INNER JOIN @TargetPosts AS tp ON tp.PostID = f.PostID;

        UPDATE f
        SET IsDeleted = 1
        FROM dbo.Favorites AS f
        INNER JOIN @TargetUsers AS tu ON tu.UserID = f.UserID;
    END

    IF OBJECT_ID(N'dbo.PostImages', N'U') IS NOT NULL
    BEGIN
        UPDATE pi
        SET IsDeleted = 1
        FROM dbo.PostImages AS pi
        INNER JOIN @TargetPosts AS tp ON tp.PostID = pi.PostID;
    END

    UPDATE p
    SET IsDeleted = 1
    FROM dbo.Posts AS p
    INNER JOIN @TargetPosts AS tp ON tp.PostID = p.PostID;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    ;THROW;
END CATCH
GO

-- Optional hard-delete of test users (disabled by default).
/*
BEGIN TRY
    BEGIN TRANSACTION;

    DELETE u
    FROM dbo.Users AS u
    WHERE u.Email IN (
        'admin@tijarahjo.com',
        'user1@tijarahjo.com',
        'test@example.com',
        'test@test.com',
        'demo@demo.com'
    )
    OR (u.Email LIKE 'test%@example.%')
    OR (u.Email LIKE 'demo%@demo.%')
    OR (u.FirstName = 'Super' AND u.LastName = 'Admin')
    OR (u.FirstName = 'Test' AND u.LastName = 'User')
    OR (u.FirstName = 'Demo' AND u.LastName = 'Account');

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    ;THROW;
END CATCH
GO
*/

PRINT 'Cleanup verification summary:';
SELECT
    (SELECT COUNT(*) FROM dbo.Users WHERE IsDeleted = 0) AS ActiveUsers,
    (SELECT COUNT(*) FROM dbo.Posts WHERE IsDeleted = 0) AS ActivePosts,
    (SELECT COUNT(*) FROM dbo.PostImages WHERE IsDeleted = 0) AS ActivePostImages;
GO
