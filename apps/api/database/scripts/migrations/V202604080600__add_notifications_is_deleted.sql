USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- Fix: Add IsDeleted to Notifications for soft-delete consistency
-- =============================================================================

IF COL_LENGTH(N'dbo.Notifications', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.Notifications
    ADD IsDeleted BIT NOT NULL CONSTRAINT DF_Notifications_IsDeleted DEFAULT 0;
    PRINT 'Added Notifications.IsDeleted column.';
END
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080600__add_notifications_is_deleted.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080600__add_notifications_is_deleted.sql'',
                    N''Added IsDeleted to Notifications for consistency with other entities'');
        END';
END
GO
