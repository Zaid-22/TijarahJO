USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying conversation participant index optimization...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
    BEGIN
        IF NOT EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User1_Conversation'
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Conversations_User1_Conversation
            ON dbo.Conversations (User1ID, ConversationID)
            INCLUDE (User2ID, PostID, CreatedAt);
        END

        IF NOT EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Conversations')
              AND name = N'IX_Conversations_User2_Conversation'
        )
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Conversations_User2_Conversation
            ON dbo.Conversations (User2ID, ConversationID)
            INCLUDE (User1ID, PostID, CreatedAt);
        END
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602221240__conversation_participant_indexes.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602221240__conversation_participant_indexes.sql',
            SYSUTCDATETIME(),
            N'Adds per-participant conversation indexes to improve recent-chat retrieval paths'
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

PRINT 'Conversation participant index optimization complete.';
GO
