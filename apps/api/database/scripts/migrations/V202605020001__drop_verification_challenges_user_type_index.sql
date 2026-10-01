-- V202605020001 - Drop Verification Challenges User/Type composite index
-- The IX_VerificationChallenges_User_Type index was removed from the EF model
-- because it duplicated coverage already provided by the primary key and FK index.

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_VerificationChallenges_User_Type'
          AND object_id = OBJECT_ID(N'dbo.VerificationChallenges')
    )
    BEGIN
        DROP INDEX IX_VerificationChallenges_User_Type ON dbo.VerificationChallenges;
    END

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
    BEGIN
        ROLLBACK TRANSACTION;
    END;

    THROW;
END CATCH;
