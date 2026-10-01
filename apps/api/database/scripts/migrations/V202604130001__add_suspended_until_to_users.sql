SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Add SuspendedUntil column to Users if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(N'dbo.Users', N'U')
          AND name = N'SuspendedUntil'
    )
    BEGIN
        ALTER TABLE dbo.Users
            ADD SuspendedUntil DATETIME2 NULL;
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
           SELECT 1 FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202604130001__add_suspended_until_to_users.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES (
            N'V202604130001__add_suspended_until_to_users.sql',
            SYSUTCDATETIME(),
            N'Adds SuspendedUntil for timed user suspension from admin reports'
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
