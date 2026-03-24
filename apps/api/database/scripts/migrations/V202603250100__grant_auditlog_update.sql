-- =============================================================================
-- V202603250100 — Grant UPDATE on AuditLog to Application Role
-- ATOMICITY_EXCEPTION: This migration is permission DCL with GO-batched role setup.
-- Allows Entity Framework to backfill RecordID into AuditLog after an INSERT.
-- =============================================================================

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NOT NULL
BEGIN
    -- EF Core inserts the AuditLog with RecordID=0, then updates it after 
    -- the primary entity creates its PK sequence.
    GRANT UPDATE ON dbo.AuditLog TO tijarahjo_app_role;
    PRINT 'Granted UPDATE on dbo.AuditLog for tijarahjo_app_role (EF Core PK fixing).';
END
GO
