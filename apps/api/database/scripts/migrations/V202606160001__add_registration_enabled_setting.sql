-- ============================================================
-- Migration: Add RegistrationEnabled system setting
-- Allows admins to disable new user registrations via the
-- System Settings panel in the admin dashboard.
-- ============================================================

IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM dbo.SystemSettings WHERE SettingKey = N'RegistrationEnabled'
    )
    BEGIN
        INSERT INTO dbo.SystemSettings
            (SettingKey, Value, ValueType, Label, Description, UpdatedAt)
        VALUES
            (
                N'RegistrationEnabled',
                N'true',
                N'bool',
                N'Registration Enabled',
                N'When disabled, new user registrations (email/password and Google sign-up) are blocked. Existing users can still log in.',
                SYSUTCDATETIME()
            );

        PRINT 'Seeded RegistrationEnabled = true into SystemSettings.';
    END
    ELSE
    BEGIN
        PRINT 'RegistrationEnabled setting already exists — skipping seed.';
    END
END
ELSE
BEGIN
    PRINT 'SystemSettings table does not exist — skipping RegistrationEnabled seed.';
END
