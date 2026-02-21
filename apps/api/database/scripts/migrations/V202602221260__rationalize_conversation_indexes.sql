USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying conversation index rationalization...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
    BEGIN
        IF EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User1ID_PostID'
        )
        AND EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User1_Conversation'
        )
        BEGIN
            DROP INDEX IX_Conversations_User1ID_PostID ON dbo.Conversations;
        END

        IF EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User2ID_PostID'
        )
        AND EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User2_Conversation'
        )
        BEGIN
            DROP INDEX IX_Conversations_User2ID_PostID ON dbo.Conversations;
        END
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602221260__rationalize_conversation_indexes.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602221260__rationalize_conversation_indexes.sql',
            SYSUTCDATETIME(),
            N'Removes redundant conversation participant indexes once conversation-centric variants are present'
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

PRINT 'Conversation index rationalization complete.';
GO
