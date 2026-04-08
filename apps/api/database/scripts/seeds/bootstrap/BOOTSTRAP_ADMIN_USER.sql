USE TijarahJoDB;
GO

:setvar AdminEmail "admin@tijarahjo.local"
:setvar AdminFirstName "Admin"
:setvar AdminLastName "User"
:setvar AdminPasswordHash "PBKDF2_SHA256$100000$fyQpso6qnOiDKHSIHUSP4A==$VI9qIEp2EMOo7RFhl7nt5NxEAxWWtEtRfFe5Pi6vggM="
GO

PRINT 'Applying guarded admin bootstrap seed...';
GO

IF EXISTS (
    SELECT 1
    FROM dbo.Users AS u
    INNER JOIN dbo.Roles AS r ON r.RoleID = u.RoleID
    WHERE r.RoleName = N'Admin'
      AND ISNULL(u.IsDeleted, 0) = 0
)
BEGIN
    PRINT 'Skipped admin bootstrap because an active admin account already exists.';
END
ELSE
BEGIN
    MERGE dbo.Users AS target
    USING
    (
        SELECT
            N'$(AdminPasswordHash)' AS HashedPassword,
            N'$(AdminEmail)' AS Email,
            N'$(AdminFirstName)' AS FirstName,
            N'$(AdminLastName)' AS LastName,
            CAST(SYSUTCDATETIME() AS DATETIME2) AS JoinDate
    ) AS source
    ON target.Email = source.Email
    WHEN MATCHED THEN
        UPDATE SET
            FirstName = source.FirstName,
            LastName = source.LastName,
            HashedPassword = source.HashedPassword,
            Status = 1,
            RoleID = (
                SELECT TOP (1) RoleID
                FROM dbo.Roles
                WHERE RoleName = N'Admin'
                ORDER BY RoleID
            ),
            IsDeleted = 0
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (HashedPassword, Email, FirstName, LastName, JoinDate, Status, RoleID, IsDeleted)
        VALUES (
            source.HashedPassword,
            source.Email,
            source.FirstName,
            source.LastName,
            source.JoinDate,
            1,
            (
                SELECT TOP (1) RoleID
                FROM dbo.Roles
                WHERE RoleName = N'Admin'
                ORDER BY RoleID
            ),
            0
        );

    PRINT 'Guarded admin bootstrap completed.';
END
GO
