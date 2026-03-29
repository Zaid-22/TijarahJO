-- =============================================================================
-- V202603291830 — Add Categories Manage Permission
-- Adds the missing categories.manage permission and grants it to Admin.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Adding categories.manage permission...';
GO

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.Permissions
        WHERE PermissionKey = N'categories.manage'
   )
BEGIN
    INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
    VALUES (
        N'categories.manage',
        N'Create, update, delete, and upload assets for categories.',
        N'Categories'
    );
END
GO

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.RolePermissions (RoleID, PermissionID)
    SELECT role.RoleID, permission.PermissionID
    FROM dbo.Roles AS role
    CROSS JOIN dbo.Permissions AS permission
    WHERE role.RoleName = N'Admin'
      AND permission.PermissionKey = N'categories.manage'
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.RolePermissions AS rolePermission
          WHERE rolePermission.RoleID = role.RoleID
            AND rolePermission.PermissionID = permission.PermissionID
      );
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603291830__add_categories_manage_permission.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603291830__add_categories_manage_permission.sql',
        SYSUTCDATETIME(),
        N'Add the missing categories.manage permission and grant it to the Admin role'
    );
END
GO

PRINT 'categories.manage permission is ready.';
GO
