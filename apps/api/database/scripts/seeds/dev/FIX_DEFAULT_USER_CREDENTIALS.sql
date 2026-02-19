USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

PRINT 'Applying development-only default users...';
GO

MERGE dbo.TbRoles AS target
USING
(
    VALUES
        (N'Admin'),
        (N'User')
) AS source (RoleName)
ON target.RoleName = source.RoleName
WHEN NOT MATCHED BY TARGET THEN
    INSERT (RoleName)
    VALUES (source.RoleName);
GO

DECLARE @AdminRoleID INT = (
    SELECT TOP (1) RoleID
    FROM dbo.TbRoles
    WHERE RoleName = N'Admin'
    ORDER BY RoleID
);

DECLARE @UserRoleID INT = (
    SELECT TOP (1) RoleID
    FROM dbo.TbRoles
    WHERE RoleName = N'User'
    ORDER BY RoleID
);

IF @AdminRoleID IS NULL OR @UserRoleID IS NULL
BEGIN
    THROW 50010, 'Required roles (Admin/User) were not found for dev user seed.', 1;
END
GO

-- Development passwords only:
-- admin@tijarahjo.com / admin123
-- user1@tijarahjo.com / user123
-- Legacy SHA256+Base64 hashes are preserved for compatibility.
MERGE dbo.TbUsers AS target
USING
(
    SELECT
        N'admin@tijarahjo.com' AS Email,
        N'Super' AS FirstName,
        N'Admin' AS LastName,
        N'JAvlGPq9JyTdtvBO6x2llnRI1+gxwIyPqCKAn3THIKk=' AS HashedPassword,
        CAST(SYSUTCDATETIME() AS DATETIME2) AS JoinDate,
        CAST(1 AS INT) AS Status,
        CAST((SELECT TOP (1) RoleID FROM dbo.TbRoles WHERE RoleName = N'Admin' ORDER BY RoleID) AS INT) AS RoleID
    UNION ALL
    SELECT
        N'user1@tijarahjo.com',
        N'Test',
        N'User',
        N'5gbjiw2MGbJM8O44CBgxYup81j/3kS27IrXoAyhrREY=',
        CAST(SYSUTCDATETIME() AS DATETIME2),
        CAST(1 AS INT),
        CAST((SELECT TOP (1) RoleID FROM dbo.TbRoles WHERE RoleName = N'User' ORDER BY RoleID) AS INT)
) AS source
ON target.Email = source.Email
WHEN MATCHED THEN
    UPDATE SET
        target.HashedPassword = source.HashedPassword,
        target.FirstName = source.FirstName,
        target.LastName = source.LastName,
        target.JoinDate = source.JoinDate,
        target.Status = source.Status,
        target.RoleID = source.RoleID,
        target.IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID, IsDeleted)
    VALUES (source.HashedPassword, source.Email, source.FirstName, source.LastName, source.JoinDate, source.Status, source.RoleID, 0);
GO

PRINT 'Development default users applied.';
GO
