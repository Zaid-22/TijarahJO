USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET XACT_ABORT ON;
SET NOCOUNT ON;
GO

PRINT 'Applying message integrity and login index hardening migration...';
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- ------------------------------------------------------------
    -- 1) Safely backfill legacy messages without conversation IDs
    -- ------------------------------------------------------------
    IF OBJECT_ID(N'dbo.Messages', N'U') IS NOT NULL
       AND OBJECT_ID(N'dbo.Conversations', N'U') IS NOT NULL
    BEGIN
        ;WITH SenderConversationMap AS
        (
            SELECT c.User1ID AS UserID, c.ConversationID
            FROM dbo.Conversations AS c
            UNION ALL
            SELECT c.User2ID AS UserID, c.ConversationID
            FROM dbo.Conversations AS c
        ),
        UniqueSenderConversation AS
        (
            SELECT
                scm.UserID,
                MIN(scm.ConversationID) AS ConversationID
            FROM SenderConversationMap AS scm
            GROUP BY scm.UserID
            HAVING COUNT(*) = 1
        )
        UPDATE m
        SET m.ConversationID = usc.ConversationID
        FROM dbo.Messages AS m
        INNER JOIN UniqueSenderConversation AS usc
            ON usc.UserID = m.SenderID
        WHERE m.ConversationID IS NULL;

        IF EXISTS (SELECT 1 FROM dbo.Messages WHERE ConversationID IS NULL)
        BEGIN
            THROW 51071, 'Messages with NULL ConversationID remain after deterministic backfill. Resolve manually before migration.', 1;
        END
    END

    -- ------------------------------------------------------------
    -- 2) Enforce non-null ConversationID in Messages
    -- ------------------------------------------------------------
    IF EXISTS
    (
        SELECT 1
        FROM sys.columns AS c
        WHERE c.object_id = OBJECT_ID(N'dbo.Messages')
          AND c.name = N'ConversationID'
          AND c.is_nullable = 1
    )
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.Messages WHERE ConversationID IS NULL)
        BEGIN
            THROW 51072, 'Cannot enforce Messages.ConversationID NOT NULL while NULL rows exist.', 1;
        END

        ALTER TABLE dbo.Messages
        ALTER COLUMN ConversationID INT NOT NULL;
    END

    -- ------------------------------------------------------------
    -- 3) Enforce sender/conversation membership at DB level
    -- ------------------------------------------------------------
    IF OBJECT_ID(N'dbo.TR_Messages_SenderMustBeConversationParticipant', N'TR') IS NOT NULL
    BEGIN
        DROP TRIGGER dbo.TR_Messages_SenderMustBeConversationParticipant;
    END

    EXEC(N'
CREATE TRIGGER dbo.TR_Messages_SenderMustBeConversationParticipant
ON dbo.Messages
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS
    (
        SELECT 1
        FROM inserted AS i
        LEFT JOIN dbo.Conversations AS c
            ON c.ConversationID = i.ConversationID
        WHERE c.ConversationID IS NULL
           OR (i.SenderID <> c.User1ID AND i.SenderID <> c.User2ID)
    )
    BEGIN
        ;THROW 51041, ''Invalid sender/conversation pair: sender must belong to the conversation.'', 1;
    END
END
');

    -- ------------------------------------------------------------
    -- 4) Narrow login index coverage (remove sensitive/bloated INCLUDEs)
    -- ------------------------------------------------------------
    IF OBJECT_ID(N'dbo.Users', N'U') IS NOT NULL
    BEGIN
        IF EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Users')
              AND name = N'IX_Users_Login_Email_Active'
        )
        BEGIN
            DROP INDEX IX_Users_Login_Email_Active ON dbo.Users;
        END

        CREATE NONCLUSTERED INDEX IX_Users_Login_Email_Active
        ON dbo.Users (Email)
        WHERE IsDeleted = 0;

        IF EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE object_id = OBJECT_ID(N'dbo.Users')
              AND name = N'UQ_Users_Phone_Active'
        )
        BEGIN
            DROP INDEX UQ_Users_Phone_Active ON dbo.Users;
        END

        CREATE UNIQUE NONCLUSTERED INDEX UQ_Users_Phone_Active
        ON dbo.Users (Phone)
        WHERE IsDeleted = 0 AND Phone IS NOT NULL;
    END

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
            SELECT 1
            FROM dbo.SchemaMigrations
            WHERE ScriptName = N'V202602201100__message_integrity_and_login_index_hardening.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202602201100__message_integrity_and_login_index_hardening.sql',
            SYSUTCDATETIME(),
            N'Enforces non-null Message.ConversationID, sender-conversation trigger, and narrowed login indexes'
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

PRINT 'Message integrity and login index hardening migration complete.';
GO
