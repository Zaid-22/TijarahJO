USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- ATOMICITY_EXCEPTION: Idempotent DDL/DML with GO-batched statements.
-- =============================================================================
-- Documentation: Reports table uses a polymorphic FK pattern
-- =============================================================================
-- NOTE: Reports.TargetID is a polymorphic foreign key.
-- Depending on ReportType ('LISTING', 'USER', 'REVIEW', 'COMMENT'), TargetID
-- references a different parent table (Posts, Users, Reviews, PostComments).
--
-- Referential integrity for TargetID is enforced at the APPLICATION level
-- (in ReportDataAccessAdapter and ReportService), not at the database level.
--
-- This is a documented, accepted trade-off for this project scope.
-- In a production system at scale, consider refactoring to typed nullable FK
-- columns (TargetPostID, TargetUserID, TargetReviewID, TargetCommentID)
-- with a CHECK constraint ensuring exactly one is non-null.
-- =============================================================================

-- No schema change — this migration is documentation only.

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080800__document_reports_polymorphic_fk.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080800__document_reports_polymorphic_fk.sql'',
                    N''Documentation: Reports.TargetID is a polymorphic FK enforced at app level. See migration file for rationale.'');
        END';
END
GO
