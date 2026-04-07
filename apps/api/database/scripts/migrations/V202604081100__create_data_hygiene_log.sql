-- =============================================================================
-- V202604081100 — Create DataHygieneLog table for automated lifecycle tracking
-- =============================================================================
-- Tracks every data hygiene scan finding and cleanup action. Used by the
-- DataHygieneService to record detection results, classifications, and
-- executed cleanup actions with full audit trail.

IF OBJECT_ID(N'dbo.DataHygieneLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DataHygieneLog
    (
        HygieneLogID     BIGINT         IDENTITY(1,1) CONSTRAINT PK_DataHygieneLog PRIMARY KEY,
        CycleID          UNIQUEIDENTIFIER NOT NULL,
        TableName        NVARCHAR(128)  NOT NULL,
        FindingType      NVARCHAR(50)   NOT NULL,   -- COLD_DATA, ORPHAN, STALE, OVERSIZED, TABLE_HEALTH
        Classification   NVARCHAR(50)   NOT NULL,   -- SAFE_TO_DELETE, ARCHIVE, REQUIRES_REVIEW, INFO
        AffectedRowCount INT            NOT NULL CONSTRAINT DF_DataHygieneLog_AffectedRowCount DEFAULT 0,
        SampleData       NVARCHAR(1000) NULL,       -- JSON array of up to 5 sample PKs
        Phase            INT            NOT NULL CONSTRAINT DF_DataHygieneLog_Phase DEFAULT 1,
        ActionTaken      NVARCHAR(50)   NOT NULL CONSTRAINT DF_DataHygieneLog_ActionTaken DEFAULT N'NONE',
        DetectedAt       DATETIME2      NOT NULL CONSTRAINT DF_DataHygieneLog_DetectedAt DEFAULT SYSUTCDATETIME(),
        ActionedAt       DATETIME2      NULL,
        Notes            NVARCHAR(2000) NULL,
        CONSTRAINT CK_DataHygieneLog_Phase CHECK (Phase IN (1, 2, 3)),
        CONSTRAINT CK_DataHygieneLog_FindingType CHECK (FindingType IN (
            'COLD_DATA', 'ORPHAN', 'STALE', 'OVERSIZED', 'TABLE_HEALTH'
        )),
        CONSTRAINT CK_DataHygieneLog_Classification CHECK (Classification IN (
            'SAFE_TO_DELETE', 'ARCHIVE', 'REQUIRES_REVIEW', 'INFO'
        )),
        CONSTRAINT CK_DataHygieneLog_ActionTaken CHECK (ActionTaken IN (
            'NONE', 'SOFT_DELETED', 'HARD_DELETED', 'ARCHIVED', 'SKIPPED'
        ))
    );

    -- Index for querying by cycle (report generation)
    CREATE NONCLUSTERED INDEX IX_DataHygieneLog_CycleID
        ON dbo.DataHygieneLog (CycleID);

    -- Index for self-cleanup (purge entries older than 90 days)
    CREATE NONCLUSTERED INDEX IX_DataHygieneLog_DetectedAt
        ON dbo.DataHygieneLog (DetectedAt);

    -- Index for admin approval queries (pending items)
    CREATE NONCLUSTERED INDEX IX_DataHygieneLog_Classification_Phase
        ON dbo.DataHygieneLog (Classification, Phase)
        WHERE Phase = 1;
END
GO

-- Track migration (deferred: avoids parse-time error if SchemaMigrations doesn't exist)
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604081100__create_data_hygiene_log.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604081100__create_data_hygiene_log.sql'', SYSUTCDATETIME(), N''Creates DataHygieneLog table for automated lifecycle tracking'');
        END';
END
GO
