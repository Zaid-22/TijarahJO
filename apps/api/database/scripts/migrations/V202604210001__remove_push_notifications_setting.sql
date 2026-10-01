-- =============================================================================
-- V202604210001 — Remove Push Notifications Setting
-- =============================================================================

SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

BEGIN TRY
    BEGIN TRANSACTION;

    PRINT 'Removing deprecated EnablePushNotifications setting...';

    IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
    BEGIN
        DELETE FROM dbo.SystemSettings
        WHERE SettingKey = N'EnablePushNotifications';
    END;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202604210001__remove_push_notifications_setting.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202604210001__remove_push_notifications_setting.sql',
            SYSUTCDATETIME(),
            N'Remove deprecated push notifications system setting'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO

PRINT 'Push notifications system setting removed.';
GO
