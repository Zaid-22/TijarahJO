-- =============================================================================
-- V202603242145 — Add Missing Tables
-- ATOMICITY_EXCEPTION: This migration is idempotent single-object DDL with GO-batched statements.
-- =============================================================================

USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Creating missing tables: BlacklistedTokens, SystemSettings, Reports, Permissions, RolePermissions...';
GO

-- ---------------------------------------------------------------------------
-- Blacklisted Tokens (JWT revocation)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.BlacklistedTokens', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.BlacklistedTokens
    (
        Jti       NVARCHAR(450) NOT NULL CONSTRAINT PK_BlacklistedTokens PRIMARY KEY,
        ExpiresAt DATETIME2     NOT NULL
    );

    CREATE NONCLUSTERED INDEX IX_BlacklistedTokens_ExpiresAt
        ON dbo.BlacklistedTokens (ExpiresAt);
END
GO

-- ---------------------------------------------------------------------------
-- System Settings (feature flags / admin config)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.SystemSettings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SystemSettings
    (
        SettingID   INT           IDENTITY(1,1) CONSTRAINT PK_SystemSettings PRIMARY KEY,
        SettingKey  NVARCHAR(100) NOT NULL CONSTRAINT UQ_SystemSettings_Key UNIQUE,
        Label       NVARCHAR(200) NOT NULL,
        Value       NVARCHAR(MAX) NOT NULL,
        ValueType   NVARCHAR(20)  NOT NULL CONSTRAINT DF_SystemSettings_ValueType DEFAULT N'bool',
        Description NVARCHAR(500) NULL,
        UpdatedAt   DATETIME2     NOT NULL CONSTRAINT DF_SystemSettings_UpdatedAt DEFAULT SYSUTCDATETIME()
    );
END
GO

-- ---------------------------------------------------------------------------
-- Reports (abuse / fraud reports)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Reports', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Reports
    (
        ReportID         INT            IDENTITY(1,1) CONSTRAINT PK_Reports PRIMARY KEY,
        ReportType       NVARCHAR(20)   NOT NULL,
        TargetID         INT            NOT NULL,
        Reason           NVARCHAR(50)   NOT NULL,
        Description      NVARCHAR(2000) NULL,
        ReporterUserID   INT            NOT NULL,
        Status           INT            NOT NULL CONSTRAINT DF_Reports_Status DEFAULT 0,
        ResolvedByUserID INT            NULL,
        ResolutionNotes  NVARCHAR(1000) NULL,
        CreatedAt        DATETIME2      NOT NULL CONSTRAINT DF_Reports_CreatedAt DEFAULT SYSUTCDATETIME(),
        ResolvedAt       DATETIME2      NULL,
        CONSTRAINT FK_Reports_Reporter FOREIGN KEY (ReporterUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT FK_Reports_Resolver FOREIGN KEY (ResolvedByUserID) REFERENCES dbo.Users(UserID),
        CONSTRAINT CK_Reports_Type CHECK (ReportType IN (N'LISTING', N'USER', N'REVIEW', N'COMMENT')),
        CONSTRAINT CK_Reports_Status CHECK (Status IN (0, 1, 2, 3))
    );

    CREATE NONCLUSTERED INDEX IX_Reports_Status_CreatedAt
        ON dbo.Reports (Status, CreatedAt DESC)
        INCLUDE (ReportType, ReporterUserID, TargetID);
END
GO

-- ---------------------------------------------------------------------------
-- Permissions (granular RBAC permissions)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.Permissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Permissions
    (
        PermissionID  INT           IDENTITY(1,1) CONSTRAINT PK_Permissions PRIMARY KEY,
        PermissionKey NVARCHAR(100) NOT NULL CONSTRAINT UQ_Permissions_Key UNIQUE,
        Description   NVARCHAR(300) NOT NULL,
        Category      NVARCHAR(50)  NOT NULL
    );
END
GO

-- ---------------------------------------------------------------------------
-- Role Permissions (junction: Roles <-> Permissions)
-- ---------------------------------------------------------------------------
IF OBJECT_ID(N'dbo.RolePermissions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RolePermissions
    (
        RolePermissionID INT IDENTITY(1,1) CONSTRAINT PK_RolePermissions PRIMARY KEY,
        RoleID           INT NOT NULL,
        PermissionID     INT NOT NULL,
        CONSTRAINT FK_RolePermissions_Role FOREIGN KEY (RoleID) REFERENCES dbo.Roles(RoleID),
        CONSTRAINT FK_RolePermissions_Perm FOREIGN KEY (PermissionID) REFERENCES dbo.Permissions(PermissionID),
        CONSTRAINT UQ_RolePermissions_Role_Perm UNIQUE (RoleID, PermissionID)
    );
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202603242145__add_missing_tables.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES
    (
        N'V202603242145__add_missing_tables.sql',
        SYSUTCDATETIME(),
        N'Add missing BlacklistedTokens, SystemSettings, Reports, Permissions, RolePermissions tables to existing DBs'
    );
END
GO

PRINT 'Missing tables migration complete.';
GO
