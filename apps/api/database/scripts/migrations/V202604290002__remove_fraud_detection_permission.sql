-- V202604290002 - Remove Fraud Detection Permission
-- The admin dashboard no longer exposes fraud detection, so remove its RBAC permission.

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
    BEGIN
        DELETE rolePermission
        FROM dbo.RolePermissions AS rolePermission
        INNER JOIN dbo.Permissions AS permission
            ON permission.PermissionID = rolePermission.PermissionID
        WHERE permission.PermissionKey = N'fraud.view';
    END

    IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.Permissions
        WHERE PermissionKey = N'fraud.view';
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
