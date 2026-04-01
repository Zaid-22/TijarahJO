-- =============================================================================
-- V202604010100 — Add Post Comment Permissions
-- ATOMICITY_EXCEPTION: Idempotent seed inserts for the missing permissions and
-- default Admin role mappings.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Adding post comment permissions...';
GO

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Permissions
        WHERE PermissionKey = N'comments.view'
    )
    BEGIN
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (
            N'comments.view',
            N'View marketplace post comments and replies in admin moderation tools.',
            N'Comments'
        );
    END;

    IF NOT EXISTS (
        SELECT 1
        FROM dbo.Permissions
        WHERE PermissionKey = N'comments.moderate'
    )
    BEGIN
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (
            N'comments.moderate',
            N'Soft-delete marketplace post comments and replies.',
            N'Comments'
        );
    END;
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
      AND permission.PermissionKey IN (N'comments.view', N'comments.moderate')
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
        WHERE ScriptName = N'V202604010100__add_post_comment_permissions.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202604010100__add_post_comment_permissions.sql',
        SYSUTCDATETIME(),
        N'Add comments.view and comments.moderate permissions and grant them to the Admin role'
    );
END
GO

PRINT 'post comment permissions are ready.';
GO
