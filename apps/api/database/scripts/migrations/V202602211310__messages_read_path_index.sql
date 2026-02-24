USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying messages read-path index optimization...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Messages')
              AND name = N'IX_Messages_Conversation_IsRead_Sender'
       )
    BEGIN
        IF COL_LENGTH(N'dbo.Messages', N'Timestamp') IS NOT NULL
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_Conversation_IsRead_Sender
            ON dbo.Messages (ConversationID, IsRead, SenderID)
            INCLUDE (MessageID, [Timestamp]);
        END
        ELSE IF COL_LENGTH(N'dbo.Messages', N'CreatedAt') IS NOT NULL
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_Conversation_IsRead_Sender
            ON dbo.Messages (ConversationID, IsRead, SenderID)
            INCLUDE (MessageID, CreatedAt);
        END
        ELSE
        BEGIN
            CREATE NONCLUSTERED INDEX IX_Messages_Conversation_IsRead_Sender
            ON dbo.Messages (ConversationID, IsRead, SenderID)
            INCLUDE (MessageID);
        END
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602211310__messages_read_path_index.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602211310__messages_read_path_index.sql',
            SYSUTCDATETIME(),
            N'Adds ConversationID/IsRead/SenderID index for read-mark and unread retrieval paths'
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

PRINT 'Messages read-path index optimization complete.';
GO
