USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Standardizing DATETIME2 default constraints to SYSUTCDATETIME()...';
GO

DECLARE @Targets TABLE
(
    TableName SYSNAME NOT NULL,
    ColumnName SYSNAME NOT NULL,
    ConstraintName SYSNAME NOT NULL
);

INSERT INTO @Targets (TableName, ColumnName, ConstraintName)
VALUES
    (N'TbRoles', N'CreatedAt', N'DF_TbRoles_CreatedAt'),
    (N'TbUsers', N'JoinDate', N'DF_TbUsers_JoinDate'),
    (N'TbItemCategories', N'CreatedAt', N'DF_TbItemCategories_CreatedAt'),
    (N'TbPosts', N'CreatedAt', N'DF_TbPosts_CreatedAt'),
    (N'TbPostImages', N'UploadedAt', N'DF_TbPostImages_UploadedAt'),
    (N'TbFavorites', N'CreatedAt', N'DF_TbFavorites_CreatedAt'),
    (N'TbMessages', N'Timestamp', N'DF_TbMessages_Timestamp'),
    (N'TbReviews', N'Timestamp', N'DF_TbReviews_Timestamp');

DECLARE
    @TableName SYSNAME,
    @ColumnName SYSNAME,
    @ConstraintName SYSNAME,
    @ObjectID INT,
    @CurrentConstraint SYSNAME,
    @Sql NVARCHAR(MAX);

DECLARE TargetCursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT TableName, ColumnName, ConstraintName
    FROM @Targets;

OPEN TargetCursor;
FETCH NEXT FROM TargetCursor INTO @TableName, @ColumnName, @ConstraintName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @ObjectID = OBJECT_ID(N'dbo.' + @TableName, N'U');

    IF @ObjectID IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM sys.columns
            WHERE object_id = @ObjectID
              AND name = @ColumnName
       )
    BEGIN
        SELECT TOP (1)
            @CurrentConstraint = dc.name
        FROM sys.default_constraints AS dc
        INNER JOIN sys.columns AS c
            ON c.object_id = dc.parent_object_id
           AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = @ObjectID
          AND c.name = @ColumnName;

        IF @CurrentConstraint IS NOT NULL
        BEGIN
            SET @Sql = N'ALTER TABLE dbo.' + QUOTENAME(@TableName) + N' DROP CONSTRAINT ' + QUOTENAME(@CurrentConstraint) + N';';
            EXEC sp_executesql @Sql;
        END

        SET @Sql = N'ALTER TABLE dbo.' + QUOTENAME(@TableName) +
            N' ADD CONSTRAINT ' + QUOTENAME(@ConstraintName) +
            N' DEFAULT SYSUTCDATETIME() FOR ' + QUOTENAME(@ColumnName) + N';';
        EXEC sp_executesql @Sql;
    END

    SET @CurrentConstraint = NULL;
    FETCH NEXT FROM TargetCursor INTO @TableName, @ColumnName, @ConstraintName;
END

CLOSE TargetCursor;
DEALLOCATE TargetCursor;
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM dbo.SchemaMigrations
        WHERE ScriptName = N'V202602191000__standardize_utc_default_constraints.sql'
   )
BEGIN
    INSERT INTO dbo.SchemaMigrations (ScriptName, AppliedAt, Notes)
    VALUES (
        N'V202602191000__standardize_utc_default_constraints.sql',
        SYSUTCDATETIME(),
        N'UTC default constraints standardized'
    );
END
GO

PRINT 'UTC default-constraint standardization complete.';
GO
