USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- Fix: Add IsDeleted to UserExternalIdentities for soft-delete consistency
-- =============================================================================

IF COL_LENGTH(N'dbo.UserExternalIdentities', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.UserExternalIdentities
    ADD IsDeleted BIT NOT NULL CONSTRAINT DF_UserExternalIdentities_IsDeleted DEFAULT 0;
    PRINT 'Added UserExternalIdentities.IsDeleted column.';
END
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080700__add_external_identities_is_deleted.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080700__add_external_identities_is_deleted.sql'',
                    N''Added IsDeleted to UserExternalIdentities for consistency'');
        END';
END
GO
