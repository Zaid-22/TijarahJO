-- =============================================================================
-- V202603291800 — Seed Permissions And Admin Role Mappings
-- ATOMICITY_EXCEPTION: Idempotent seed inserts for RBAC permissions and default
-- role mappings.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Seeding RBAC permissions and admin role mappings...';
GO

IF OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'users.view')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'users.view', N'View users in the admin dashboard.', N'Users');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'users.manage')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'users.manage', N'Update user status and perform user administration actions.', N'Users');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'posts.view')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'posts.view', N'View marketplace listings in admin tools.', N'Posts');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'posts.moderate')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'posts.moderate', N'Moderate, approve, reject, or delete listings.', N'Posts');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'reviews.view')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'reviews.view', N'View user reviews in moderation tools.', N'Reviews');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'reviews.moderate')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'reviews.moderate', N'Moderate and remove reviews.', N'Reviews');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'reports.view')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'reports.view', N'View abuse and fraud reports.', N'Reports');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'reports.resolve')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'reports.resolve', N'Resolve or dismiss abuse and fraud reports.', N'Reports');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'locations.manage')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'locations.manage', N'Create, update, and delete cities and areas.', N'Locations');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'banners.manage')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'banners.manage', N'Manage homepage hero banners.', N'Content');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'settings.manage')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'settings.manage', N'Edit system settings in the admin panel.', N'System');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'audit.view')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'audit.view', N'View audit log entries.', N'System');

    IF NOT EXISTS (SELECT 1 FROM dbo.Permissions WHERE PermissionKey = N'roles.manage')
        INSERT INTO dbo.Permissions (PermissionKey, Description, Category)
        VALUES (N'roles.manage', N'Create roles and manage role permissions.', N'Roles');
END
GO

IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Roles', N'U') IS NOT NULL
   AND OBJECT_ID(N'dbo.Permissions', N'U') IS NOT NULL
BEGIN
    INSERT INTO dbo.RolePermissions (RoleID, PermissionID)
    SELECT r.RoleID, p.PermissionID
    FROM dbo.Roles AS r
    CROSS JOIN dbo.Permissions AS p
    WHERE r.RoleName = N'Admin'
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.RolePermissions AS rp
          WHERE rp.RoleID = r.RoleID
            AND rp.PermissionID = p.PermissionID
      );
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603291800__seed_permissions_and_admin_role_mappings.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603291800__seed_permissions_and_admin_role_mappings.sql',
        SYSUTCDATETIME(),
        N'Seed RBAC permissions catalog and grant all seeded permissions to the Admin role'
    );
END
GO

PRINT 'RBAC permissions and default admin mappings seeded.';
GO
