USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying push subscription endpoint hash uniqueness hardening...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.PushSubscriptions', N'U') IS NOT NULL
    BEGIN
        IF COL_LENGTH(N'dbo.PushSubscriptions', N'EndpointHash') IS NULL
        BEGIN
            ALTER TABLE dbo.PushSubscriptions
            ADD EndpointHash AS CONVERT(BINARY(32), HASHBYTES('SHA2_256', LOWER(LTRIM(RTRIM(Endpoint))))) PERSISTED;
        END

        IF EXISTS (
            SELECT 1
            FROM sys.key_constraints
            WHERE parent_object_id = OBJECT_ID(N'dbo.PushSubscriptions')
              AND name = N'UQ_PushSubscriptions_User_Endpoint'
        )
        BEGIN
            ALTER TABLE dbo.PushSubscriptions
            DROP CONSTRAINT UQ_PushSubscriptions_User_Endpoint;
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.PushSubscriptions')
              AND name = N'UQ_PushSubscriptions_User_EndpointHash'
        )
        BEGIN
            CREATE UNIQUE NONCLUSTERED INDEX UQ_PushSubscriptions_User_EndpointHash
            ON dbo.PushSubscriptions (UserID, EndpointHash);
        END

        IF NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.PushSubscriptions')
              AND name = N'IX_PushSubscriptions_User_EndpointLookup'
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_PushSubscriptions_User_EndpointLookup
            ON dbo.PushSubscriptions (UserID, Endpoint)
            INCLUDE (PushSubscriptionID, IsActive, UpdatedAt);
        END
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602211300__push_subscription_endpoint_hash_unique.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602211300__push_subscription_endpoint_hash_unique.sql',
            SYSUTCDATETIME(),
            N'Replaces endpoint-based unique key with hash-backed unique key for SQL Server index safety'
        );
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
    BEGIN
        ROLLBACK TRANSACTION;
    END

    ;THROW;
END CATCH
GO

PRINT 'Push subscription endpoint hash uniqueness hardening complete.';
GO
