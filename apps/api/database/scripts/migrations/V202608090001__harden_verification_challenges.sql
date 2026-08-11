-- Ensure each user has at most one state row per challenge type and grant the
-- complete DML surface used by the runtime challenge adapter.

SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    IF OBJECT_ID(N'dbo.VerificationChallenges', N'U') IS NOT NULL
    BEGIN
        ;WITH RankedChallenges AS
        (
            SELECT
                ChallengeId,
                ROW_NUMBER() OVER
                (
                    PARTITION BY UserId, ChallengeType
                    ORDER BY ExpiresAt DESC, CreatedAt DESC, ChallengeId DESC
                ) AS DuplicateRank
            FROM dbo.VerificationChallenges
        )
        DELETE FROM RankedChallenges
        WHERE DuplicateRank > 1;

        IF NOT EXISTS
        (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'UX_VerificationChallenges_User_Type'
              AND object_id = OBJECT_ID(N'dbo.VerificationChallenges')
        )
        BEGIN
            CREATE UNIQUE NONCLUSTERED INDEX UX_VerificationChallenges_User_Type
                ON dbo.VerificationChallenges (UserId, ChallengeType);
        END;

        IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_role') IS NOT NULL
            GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.VerificationChallenges TO tijarahjo_app_role;

        IF DATABASE_PRINCIPAL_ID(N'tijarahjo_app_runtime') IS NOT NULL
            GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.VerificationChallenges TO tijarahjo_app_runtime;
    END;

    IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1
           FROM dbo.SchemaMigrations
           WHERE ScriptName = N'V202608090001__harden_verification_challenges.sql'
       )
    BEGIN
        INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
        VALUES
        (
            N'V202608090001__harden_verification_challenges.sql',
            SYSUTCDATETIME(),
            N'Enforce one verification challenge per user/type and grant runtime DML'
        );
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
