USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- ATOMICITY_EXCEPTION: Idempotent DDL/DML with GO-batched statements.
-- =============================================================================
-- Fix: Messages trigger now validates BOTH SenderID and ReceiverID
-- Reason: Original trigger only validated SenderID; ReceiverID could drift
-- =============================================================================

IF OBJECT_ID(N'dbo.TR_Messages_SenderMustBeConversationParticipant', N'TR') IS NOT NULL
BEGIN
    DROP TRIGGER dbo.TR_Messages_SenderMustBeConversationParticipant;
    PRINT 'Dropped old trigger TR_Messages_SenderMustBeConversationParticipant.';
END
GO

IF OBJECT_ID(N'dbo.TR_Messages_ParticipantValidation', N'TR') IS NOT NULL
BEGIN
    DROP TRIGGER dbo.TR_Messages_ParticipantValidation;
    PRINT 'Dropped existing trigger TR_Messages_ParticipantValidation.';
END
GO

CREATE TRIGGER dbo.TR_Messages_ParticipantValidation
ON dbo.Messages
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate SENDER is a conversation participant
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        LEFT JOIN dbo.Conversations AS c ON c.ConversationID = i.ConversationID
        WHERE c.ConversationID IS NULL
           OR (i.SenderID <> c.User1ID AND i.SenderID <> c.User2ID)
    )
    BEGIN
        ;THROW 51041, 'Invalid sender/conversation pair: sender must belong to the conversation.', 1;
    END

    -- Validate RECEIVER is a conversation participant
    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        LEFT JOIN dbo.Conversations AS c ON c.ConversationID = i.ConversationID
        WHERE c.ConversationID IS NULL
           OR (i.ReceiverID <> c.User1ID AND i.ReceiverID <> c.User2ID)
    )
    BEGIN
        ;THROW 51042, 'Invalid receiver/conversation pair: receiver must belong to the conversation.', 1;
    END

    -- Validate sender != receiver
    IF EXISTS (SELECT 1 FROM inserted WHERE SenderID = ReceiverID)
    BEGIN
        ;THROW 51043, 'Sender and receiver cannot be the same user.', 1;
    END
END
GO

PRINT 'Created trigger TR_Messages_ParticipantValidation (validates both sender and receiver).';
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080200__messages_validate_receiver.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080200__messages_validate_receiver.sql'',
                    N''Expanded Messages trigger to validate both SenderID and ReceiverID, and prevent sender=receiver'');
        END';
END
GO
