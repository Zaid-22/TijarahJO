USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying post soft-delete semantics unification...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
    BEGIN
        THROW 51001, 'Posts table was not found. Cannot apply soft-delete semantics migration.', 1;
    END

    -- Move legacy Status=DELETED rows to the canonical soft-delete flag.
    UPDATE dbo.Posts
    SET IsDeleted = 1
    WHERE Status = 2
      AND IsDeleted = 0;

    -- Status is lifecycle/moderation only after this migration.
    UPDATE dbo.Posts
    SET Status = 0
    WHERE Status = 2;

    IF EXISTS (
        SELECT 1
        FROM dbo.Posts
        WHERE Status NOT IN (0, 1, 3)
    )
    BEGIN
        THROW 51002, 'Posts contain unsupported status values. Normalize data before applying CK_Posts_Status.', 1;
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_Posts_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.Posts')
    )
    BEGIN
        ALTER TABLE dbo.Posts DROP CONSTRAINT CK_Posts_Status;
    END

    ALTER TABLE dbo.Posts WITH CHECK
    ADD CONSTRAINT CK_Posts_Status CHECK (Status IN (0, 1, 3));

    ALTER TABLE dbo.Posts CHECK CONSTRAINT CK_Posts_Status;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602221200__unify_post_soft_delete_semantics.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602221200__unify_post_soft_delete_semantics.sql',
            SYSUTCDATETIME(),
            N'Converges soft-delete behavior on Posts.IsDeleted and restricts status domain to ACTIVE/BLOCKED/SOLD'
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

PRINT 'Post soft-delete semantics unification complete.';
GO
