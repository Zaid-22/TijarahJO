USE TijarahJoDB;
GO

-- Make sure roles exist first
IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'Admin')
BEGIN
    INSERT INTO dbo.Roles (RoleName)
    VALUES (N'Admin');
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.Roles WHERE RoleName = N'User')
BEGIN
    INSERT INTO dbo.Roles (RoleName)
    VALUES (N'User');
END
GO

-- Insert test user
-- Password: intentionally removed for security (no seeded credentials)
-- Account requires manual password reset or API creation
MERGE dbo.Users AS target
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
        HashedPassword = 'DISABLED_NO_SEEDED_CREDENTIALS',
        FirstName = source.FirstName,
        LastName = source.LastName,
        JoinDate = source.JoinDate,
        Status = 1,
        RoleID = (SELECT TOP (1) RoleID FROM dbo.Roles WHERE RoleName = N'User' ORDER BY RoleID),
        IsDeleted = 0,
        IsEmailVerified = 1
WHEN NOT MATCHED BY TARGET THEN
    INSERT (
        HashedPassword,
        Email,
        FirstName,
        LastName,
        JoinDate,
        Status,
        RoleID,
        IsDeleted,
        IsEmailVerified
    )
    VALUES (
        'DISABLED_NO_SEEDED_CREDENTIALS',
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

PRINT '';
PRINT '========================================';
PRINT 'Test user created successfully!';
PRINT '========================================';
PRINT '';
PRINT 'Login Credentials:';
PRINT '  Email:    test@example.com';
PRINT '  Password: (DISABLED - Use password reset API or create via Register endpoint)';
PRINT '';
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
FROM dbo.Users 
WHERE Email = 'test@example.com';
GO
