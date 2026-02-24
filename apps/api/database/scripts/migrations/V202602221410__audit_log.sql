-- =============================================================================
-- V202602221410 — Audit Log Table
-- ATOMICITY_EXCEPTION: This migration is idempotent single-object DDL with GO-batched statements.
-- Creates an AuditLog table to record INSERT/UPDATE/DELETE operations
-- on sensitive tables: Users, Posts, Reviews, Categories, Roles.
--
-- Entries are written by the application layer (EF Core SaveChangesAsync
-- override in TijarahJoDbContext) within the same transaction as the
-- primary data change.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.AuditLog
    (
        AuditLogID      BIGINT IDENTITY(1, 1) NOT NULL,
        TableName       NVARCHAR(100)         NOT NULL,
        RecordID        INT                   NOT NULL,
        Action          NVARCHAR(10)          NOT NULL,  -- 'INSERT' | 'UPDATE' | 'DELETE'
        ChangedByUserID INT                   NULL,      -- NULL = system / unauthenticated
        ChangedAt       DATETIME2             NOT NULL CONSTRAINT DF_AuditLog_ChangedAt DEFAULT SYSUTCDATETIME(),
        OldValues       NVARCHAR(MAX)         NULL,      -- JSON snapshot before change (UPDATE/DELETE)
        NewValues       NVARCHAR(MAX)         NULL,      -- JSON snapshot after change (INSERT/UPDATE)

        CONSTRAINT PK_AuditLog PRIMARY KEY CLUSTERED (AuditLogID),
        CONSTRAINT CK_AuditLog_Action CHECK (Action IN (N'INSERT', N'UPDATE', N'DELETE'))
    );

    -- Index: look up audit history for a specific record in a table
    CREATE NONCLUSTERED INDEX IX_AuditLog_TableName_RecordID
        ON dbo.AuditLog (TableName, RecordID)
        INCLUDE (Action, ChangedByUserID, ChangedAt);

    -- Index: look up all actions by a specific user
    CREATE NONCLUSTERED INDEX IX_AuditLog_ChangedByUserID
        ON dbo.AuditLog (ChangedByUserID, ChangedAt DESC)
        WHERE ChangedByUserID IS NOT NULL;

    -- Optional FK to Users — soft reference (no CASCADE) so that
    -- audit entries survive even after user deletion.
    ALTER TABLE dbo.AuditLog
        ADD CONSTRAINT FK_AuditLog_ChangedByUser
        FOREIGN KEY (ChangedByUserID) REFERENCES dbo.Users (UserID)
        ON DELETE NO ACTION
        ON UPDATE NO ACTION;

    PRINT 'Created table: dbo.AuditLog';
END
ELSE
BEGIN
    PRINT 'Table dbo.AuditLog already exists — skipped.';
END
GO

PRINT 'V202602221410 — Audit log table complete.';
GO
