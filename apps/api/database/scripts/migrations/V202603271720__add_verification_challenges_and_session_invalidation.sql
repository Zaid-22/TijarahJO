-- =============================================================================
-- Migration: Add VerificationChallenges and LastInvalidatedAt
-- Description: Creates a DB-backed store for 2FA and password-reset challenges 
--              (fixing in-memory ConcurrentDictionary issue). Adds LastInvalidatedAt 
--              to Users for robust session invalidation.
-- =============================================================================

-- 1. Add VerificationChallenges table
IF OBJECT_ID(N'dbo.VerificationChallenges', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VerificationChallenges
    (
        ChallengeId NVARCHAR(128) NOT NULL CONSTRAINT PK_VerificationChallenges PRIMARY KEY,
        ChallengeType NVARCHAR(50)  NOT NULL, -- e.g., 'PasswordReset', 'TwoFactorLogin'
        UserId      INT           NOT NULL,
        StateJson   NVARCHAR(MAX) NOT NULL, -- Serialized challenge state
        ExpiresAt   DATETIME2     NOT NULL,
        CreatedAt   DATETIME2     NOT NULL CONSTRAINT DF_VerificationChallenges_CreatedAt DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_VerificationChallenges_User FOREIGN KEY (UserId) REFERENCES dbo.Users(UserID) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_VerificationChallenges_ExpiresAt
        ON dbo.VerificationChallenges (ExpiresAt);
        
    CREATE NONCLUSTERED INDEX IX_VerificationChallenges_User_Type
        ON dbo.VerificationChallenges (UserId, ChallengeType);
END
GO

-- 2. Add LastInvalidatedAt to Users
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID(N'dbo.Users') AND name = N'LastInvalidatedAt'
)
BEGIN
    ALTER TABLE dbo.Users ADD LastInvalidatedAt DATETIME2 NULL;
END
GO
