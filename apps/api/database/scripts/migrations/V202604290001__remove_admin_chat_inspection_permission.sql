-- V202604290001 - Remove Admin Chat Inspection Permission
-- The admin dashboard no longer exposes chat inspection, so remove its RBAC permission.

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
        WHERE permission.PermissionKey = N'chat.view';
    END

    IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.Permissions
        WHERE PermissionKey = N'chat.view';
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
