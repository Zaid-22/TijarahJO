USE TijarahJoDB;
GO

-- Create a seed dev admin user.
MERGE dbo.Users AS target
USING
(
    SELECT
        'PBKDF2_SHA256$100000$4IVh016LywSFAR2xrkIA/A==$hL3YTmKQbHp+Efo+qJj7CFM0YgkA3O2o6DNh+R4XkB8=' AS HashedPassword,
        'admin@tijarahjo.local' AS Email,
        'Admin' AS FirstName,
        'User' AS LastName,
        CAST(SYSUTCDATETIME() AS DATETIME2) AS JoinDate
) AS source
ON target.Email = source.Email
WHEN MATCHED THEN
    UPDATE SET
        FirstName = source.FirstName,
        LastName  = source.LastName,
        HashedPassword = source.HashedPassword
WHEN NOT MATCHED BY TARGET THEN
    INSERT (HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID, IsDeleted)
    VALUES (
        source.HashedPassword,
        source.Email,
        source.FirstName,
        source.LastName,
        source.JoinDate,
        1,
        (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'Admin' ORDER BY RoleID),
        0
    );
GO

PRINT 'Dev Admin user inserted/updated.';
GO
