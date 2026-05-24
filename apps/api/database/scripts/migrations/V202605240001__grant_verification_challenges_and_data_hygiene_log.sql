-- =============================================================================
-- V202605240001 — Grant Permissions on VerificationChallenges and DataHygieneLog
-- ATOMICITY_EXCEPTION: This migration is permission DCL with GO-batched role setup.
-- Grants required permissions on tables that were created without GRANT statements.
-- VerificationChallenges: app needs SELECT, INSERT, DELETE for 2FA/password-reset.
-- DataHygieneLog: app needs SELECT, INSERT, UPDATE for data hygiene service.
-- =============================================================================

USE TijarahJoDB;
GO

SET NOCOUNT ON;
GO

-- ---------------------------------------------------------------------------
-- 1. Grant permissions to tijarahjo_app_role (DML on transactional tables)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.VerificationChallenges', N'U') IS NOT NULL
    GRANT SELECT, INSERT, DELETE ON dbo.VerificationChallenges TO tijarahjo_app_role;

IF OBJECT_ID(N'dbo.DataHygieneLog', N'U') IS NOT NULL
    GRANT SELECT, INSERT, UPDATE ON dbo.DataHygieneLog TO tijarahjo_app_role;
GO

-- ---------------------------------------------------------------------------
-- 2. Grant permissions to tijarahjo_readonly_role (SELECT only)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.VerificationChallenges', N'U') IS NOT NULL
    GRANT SELECT ON dbo.VerificationChallenges TO tijarahjo_readonly_role;

IF OBJECT_ID(N'dbo.DataHygieneLog', N'U') IS NOT NULL
    GRANT SELECT ON dbo.DataHygieneLog TO tijarahjo_readonly_role;
GO

PRINT 'Granted permissions on VerificationChallenges and DataHygieneLog for application roles.';
GO
