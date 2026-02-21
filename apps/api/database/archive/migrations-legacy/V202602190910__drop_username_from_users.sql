USE TijarahJoDB;
GO

/*
  Removes legacy Username field from TbUsers and drops dependent indexes/constraints.
  Safe to re-run.
*/

IF COL_LENGTH('dbo.TbUsers', 'Username') IS NOT NULL
BEGIN
    DECLARE @TableObjectId INT = OBJECT_ID('dbo.TbUsers');
    DECLARE @ColumnId INT = COLUMNPROPERTY(@TableObjectId, 'Username', 'ColumnId');
    DECLARE @Sql NVARCHAR(MAX) = N'';

    IF @ColumnId IS NOT NULL
    BEGIN
        -- Drop unique/primary key constraints that depend on Username.
        SELECT @Sql = @Sql + N'ALTER TABLE dbo.TbUsers DROP CONSTRAINT [' + kc.name + N'];' + CHAR(10)
        FROM sys.key_constraints kc
        INNER JOIN sys.index_columns ic
            ON ic.object_id = kc.parent_object_id
           AND ic.index_id = kc.unique_index_id
        WHERE kc.parent_object_id = @TableObjectId
          AND ic.column_id = @ColumnId;

        -- Drop standalone indexes that depend on Username.
        SELECT @Sql = @Sql + N'DROP INDEX [' + i.name + N'] ON dbo.TbUsers;' + CHAR(10)
        FROM sys.indexes i
        INNER JOIN sys.index_columns ic
            ON ic.object_id = i.object_id
           AND ic.index_id = i.index_id
        WHERE i.object_id = @TableObjectId
          AND ic.column_id = @ColumnId
          AND i.is_primary_key = 0
          AND i.is_unique_constraint = 0;
    END

    IF LEN(@Sql) > 0
    BEGIN
        EXEC sp_executesql @Sql;
    END

    ALTER TABLE dbo.TbUsers DROP COLUMN Username;
    PRINT 'Dropped TbUsers.Username and all dependent objects.';
END
ELSE
BEGIN
    PRINT 'TbUsers.Username already removed.';
END
GO
