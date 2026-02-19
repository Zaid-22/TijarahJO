USE TijarahJoDB;
GO

-- Make sure roles exist first
IF NOT EXISTS (SELECT 1 FROM dbo.TbRoles WHERE RoleName = N'Admin')
BEGIN
    INSERT INTO dbo.TbRoles (RoleName)
    VALUES (N'Admin');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.TbRoles WHERE RoleName = N'User')
BEGIN
    INSERT INTO dbo.TbRoles (RoleName)
    VALUES (N'User');
END
GO

-- Insert test user
-- Password: password123
-- Hash (SHA256 + Base64): 75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=
MERGE dbo.TbUsers AS target
USING
(
    SELECT
        'test@example.com' AS Email,
        'Test' AS FirstName,
        'User' AS LastName,
        CAST(SYSUTCDATETIME() AS DATETIME2) AS JoinDate
) AS source
ON target.Email = source.Email
WHEN MATCHED THEN
    UPDATE SET
        HashedPassword = '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=',
        FirstName = source.FirstName,
        LastName = source.LastName,
        JoinDate = source.JoinDate,
        Status = 1,
        RoleID = (SELECT TOP (1) RoleID FROM dbo.TbRoles WHERE RoleName = N'User' ORDER BY RoleID),
        IsDeleted = 0
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        HashedPassword,
        Email,
        FirstName,
        LastName,
        JoinDate,
        Status,
        RoleID,
        IsDeleted
    )
    VALUES (
        '75K3eLr+dx6JJFuJ7LwIpEpOFmwGZZkRiB84PURz6U8=',
        source.Email,
        source.FirstName,
        source.LastName,
        source.JoinDate,
        1,
        (SELECT TOP (1) RoleID FROM dbo.TbRoles WHERE RoleName = N'User' ORDER BY RoleID),
        0
    );
GO

PRINT '';
PRINT '========================================';
PRINT 'Test user created successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Login Credentials:';
PRINT '  Email:    test@example.com';
PRINT '  Password: password123';
PRINT '';
PRINT 'You can use email to login.';
PRINT '========================================';
GO

-- Verify the user was created
SELECT 
    UserID,
    Email,
    FirstName,
    LastName,
    Status,
    RoleID,
    IsDeleted
FROM dbo.TbUsers 
WHERE Email = 'test@example.com';
GO
