USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Enforcing TbUsers status constraint to {0,1,2,3} with soft-delete decoupled...';
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM dbo.TbUsers
        WHERE Status NOT IN (0, 1, 2, 3)
    )
    BEGIN
        UPDATE dbo.TbUsers
        SET Status = 1
        WHERE Status NOT IN (0, 1, 2, 3);
    END

    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints
        WHERE name = N'CK_TbUsers_Status'
          AND parent_object_id = OBJECT_ID(N'dbo.TbUsers')
    )
    BEGIN
        ALTER TABLE dbo.TbUsers DROP CONSTRAINT CK_TbUsers_Status;
    END

    ALTER TABLE dbo.TbUsers WITH CHECK
    ADD CONSTRAINT CK_TbUsers_Status CHECK (Status IN (0, 1, 2, 3));
    ALTER TABLE dbo.TbUsers CHECK CONSTRAINT CK_TbUsers_Status;
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602191010__enforce_user_status_constraint.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202602191010__enforce_user_status_constraint.sql',
        SYSUTCDATETIME(),
        N'Enforce user status check to 0/1/2/3'
    );
END
GO

PRINT 'TbUsers status constraint enforcement complete.';
GO
