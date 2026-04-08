-- ATOMICITY_EXCEPTION: Idempotent DDL with GO-batched statements.
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V202604081200 — Fix Reviews unique constraint to support re-review after
-- soft-delete. Replaces hard UNIQUE constraint with filtered unique index.
-- Senior DB Audit finding C1.
-- =============================================================================

-- Step 1: Drop the hard UNIQUE constraint if it exists
IF EXISTS (
    SELECT 1
    FROM sys.key_constraints
    WHERE name = N'UQ_Reviews_Reviewer_Reviewed'
      AND parent_object_id = OBJECT_ID(N'dbo.Reviews')
)
BEGIN
    ALTER TABLE dbo.Reviews DROP CONSTRAINT UQ_Reviews_Reviewer_Reviewed;
    PRINT 'Dropped hard UNIQUE constraint: UQ_Reviews_Reviewer_Reviewed';
END
GO

-- Also drop if it was already a unique index (not constraint)
IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UQ_Reviews_Reviewer_Reviewed'
      AND object_id = OBJECT_ID(N'dbo.Reviews')
)
BEGIN
    DROP INDEX UQ_Reviews_Reviewer_Reviewed ON dbo.Reviews;
    PRINT 'Dropped existing index: UQ_Reviews_Reviewer_Reviewed';
END
GO

-- Step 2: Create the filtered unique index (allows re-review after soft-delete)
CREATE UNIQUE NONCLUSTERED INDEX UQ_Reviews_Reviewer_Reviewed
ON dbo.Reviews (ReviewerID, ReviewedUserID)
WHERE IsDeleted = 0;

PRINT 'Created filtered unique index: UQ_Reviews_Reviewer_Reviewed WHERE IsDeleted = 0';
GO

-- Track migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604081200__fix_reviews_unique_constraint.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604081200__fix_reviews_unique_constraint.sql'', SYSUTCDATETIME(),
                    N''Replace hard UNIQUE on Reviews(ReviewerID, ReviewedUserID) with filtered index WHERE IsDeleted = 0'');
        END';
END
GO
