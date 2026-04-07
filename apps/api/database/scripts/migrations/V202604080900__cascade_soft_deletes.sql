-- =============================================================================
-- V202604080900 — Cascade soft-deletes to orphaned PostImages & Favorites
-- DBRE Audit: Findings 4, 5
-- =============================================================================
-- When a Post is soft-deleted (IsDeleted = 1), its child PostImages and
-- Favorites should also be soft-deleted.  This migration:
--   1. Performs a one-time data fix for any existing orphans
--   2. Documents the app-level cascade that now handles this going forward

-- ---------------------------------------------------------------------------
-- Step 1: Cascade soft-delete to PostImages of deleted Posts
-- ---------------------------------------------------------------------------
UPDATE pi
SET pi.IsDeleted = 1
FROM dbo.PostImages pi
INNER JOIN dbo.Posts p ON pi.PostID = p.PostID
WHERE p.IsDeleted = 1 AND pi.IsDeleted = 0;

-- ---------------------------------------------------------------------------
-- Step 2: Cascade soft-delete to Favorites of deleted Posts
-- ---------------------------------------------------------------------------
UPDATE f
SET f.IsDeleted = 1
FROM dbo.Favorites f
INNER JOIN dbo.Posts p ON f.PostID = p.PostID
WHERE p.IsDeleted = 1 AND f.IsDeleted = 0;

-- ---------------------------------------------------------------------------
-- Track migration
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080900__cascade_soft_deletes.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
            VALUES (N''V202604080900__cascade_soft_deletes.sql'', SYSUTCDATETIME(), N''Cascade soft-deletes to orphaned PostImages and Favorites'');
        END';
END
GO

