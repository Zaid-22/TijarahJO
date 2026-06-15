USE TijarahJoDB;
GO

-- Create a seed dev user so that sample posts can reference UserID=1.
-- This is a dev-only placeholder with NO real credentials.
MERGE dbo.Users AS target
USING
(
    SELECT
        'DISABLED_NO_SEEDED_CREDENTIALS' AS HashedPassword,
        'dev@tijarahjo.local' AS Email,
        'Dev' AS FirstName,
        'Seed' AS LastName,
        CAST(SYSUTCDATETIME() AS DATETIME2) AS JoinDate
) AS source
ON target.Email = source.Email
WHEN MATCHED THEN
    UPDATE SET
        FirstName = source.FirstName,
        LastName  = source.LastName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID, IsDeleted, IsEmailVerified)
    VALUES (
        source.HashedPassword,
        source.Email,
        source.FirstName,
        source.LastName,
        source.JoinDate,
        1,
        (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'User' ORDER BY RoleID),
        0,
        1
    );
GO

PRINT 'Dev seed user ready.';
GO
