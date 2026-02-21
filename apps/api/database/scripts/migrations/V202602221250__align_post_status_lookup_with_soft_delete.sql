USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying post status lookup alignment with soft-delete semantics...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Posts', N'U') IS NULL
    BEGIN
        THROW 51011, 'Posts table was not found. Cannot align post status lookup.', 1;
    END

    IF OBJECT_ID(N'dbo.PostStatusLookup', N'U') IS NULL
    BEGIN
        THROW 51012, 'PostStatusLookup table was not found. Cannot align post status lookup.', 1;
    END

    IF EXISTS
    (
        SELECT 1
        FROM dbo.Posts
        WHERE Status = 2
    )
    BEGIN
        THROW 51013, 'Posts still contain legacy Status=2 rows. Run soft-delete unification before this migration.', 1;
    END

    MERGE dbo.PostStatusLookup AS target
    USING
    (
        VALUES
            (0, N'ACTIVE', N'ACTIVE', CAST(1 AS BIT), N'Visible active listing'),
            (1, N'BLOCKED', N'BLOCKED', CAST(0 AS BIT), N'Moderated listing'),
            (3, N'SOLD', N'SOLD', CAST(1 AS BIT), N'Sold listing')
    ) AS source (StatusID, Code, StatusName, IsVisible, Description)
      ON target.StatusID = source.StatusID
    WHEN MATCHED THEN
        UPDATE SET
            target.Code = source.Code,
            target.StatusName = source.StatusName,
            target.IsVisible = source.IsVisible,
            target.Description = source.Description
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (StatusID, Code, StatusName, IsVisible, Description)
        VALUES (source.StatusID, source.Code, source.StatusName, source.IsVisible, source.Description);

    IF EXISTS
    (
        SELECT 1
        FROM dbo.PostStatusLookup
        WHERE StatusID = 2
    )
    BEGIN
        DELETE FROM dbo.PostStatusLookup
        WHERE StatusID = 2;
    END

    IF EXISTS
    (
        SELECT 1
        FROM dbo.PostStatusLookup
        WHERE StatusID NOT IN (0, 1, 3)
    )
    BEGIN
        THROW 51014, 'PostStatusLookup contains unsupported status IDs. Normalize lookup rows before continuing.', 1;
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602221250__align_post_status_lookup_with_soft_delete.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602221250__align_post_status_lookup_with_soft_delete.sql',
            SYSUTCDATETIME(),
            N'Removes legacy DELETED status lookup row and keeps lifecycle statuses ACTIVE/BLOCKED/SOLD only'
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

PRINT 'Post status lookup alignment complete.';
GO
