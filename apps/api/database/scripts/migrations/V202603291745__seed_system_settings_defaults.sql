-- =============================================================================
-- V202603291745 — Seed System Settings Defaults
-- ATOMICITY_EXCEPTION: Idempotent seed inserts for admin-visible system settings.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Seeding default system settings...';
GO

IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'MaintenanceMode')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES (N'MaintenanceMode', N'Maintenance Mode', N'false', N'bool', N'Puts the platform into maintenance mode for public traffic.');
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'AllowNewRegistrations')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES (N'AllowNewRegistrations', N'Allow New Registrations', N'true', N'bool', N'Controls whether new users can create accounts.');
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'ForceAdminTwoFactor')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES (N'ForceAdminTwoFactor', N'Force Admin Two-Factor', N'false', N'bool', N'Requires administrator accounts to enable two-factor authentication.');
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'EnablePushNotifications')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES (N'EnablePushNotifications', N'Enable Push Notifications', N'true', N'bool', N'Allows browser push notification features for supported clients.');
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'MaxHomepageHeroBanners')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES (N'MaxHomepageHeroBanners', N'Max Homepage Hero Banners', N'10', N'int', N'Maximum number of hero banners the admin carousel should keep active.');
    END;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603291745__seed_system_settings_defaults.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603291745__seed_system_settings_defaults.sql',
        SYSUTCDATETIME(),
        N'Seed default admin-visible system settings'
    );
END
GO

PRINT 'System settings defaults seeded.';
GO
