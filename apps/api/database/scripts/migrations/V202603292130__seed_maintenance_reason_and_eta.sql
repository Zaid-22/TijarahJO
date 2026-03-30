-- =============================================================================
-- V202603292130 — Seed Maintenance Reason And Expected Return Settings
-- ATOMICITY_EXCEPTION: Idempotent seed inserts for new maintenance metadata.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Seeding maintenance metadata settings...';
GO

IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'MaintenanceReason')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES
        (
            N'MaintenanceReason',
            N'Maintenance Reason',
            N'Performance improvements and feature updates.',
            N'string',
            N'Public reason shown on the maintenance page.'
        );
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'MaintenanceExpectedReturn')
    BEGIN
        INSERT INTO dbo.SystemSettings (SettingKey, Label, Value, ValueType, Description)
        VALUES
        (
            N'MaintenanceExpectedReturn',
            N'Maintenance Expected Return',
            N'Within about 1 hour',
            N'string',
            N'Public expected return window shown on the maintenance page.'
        );
    END;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603292130__seed_maintenance_reason_and_eta.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603292130__seed_maintenance_reason_and_eta.sql',
        SYSUTCDATETIME(),
        N'Seed maintenance reason and expected return settings'
    );
END
GO

PRINT 'Maintenance metadata settings seeded.';
GO
