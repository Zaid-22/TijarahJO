USE TijarahJoDB;
GO
SET QUOTED_IDENTIFIER ON;
GO
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- Fix: Replace Favorites UNIQUE(UserID, PostID) with filtered index
-- Reason: The unfiltered constraint blocks re-favoriting after soft-delete
-- =============================================================================

-- Drop the existing inline UNIQUE constraint
IF EXISTS (
    SELECT 1 FROM sys.key_constraints
    WHERE parent_object_id = OBJECT_ID(N'dbo.Favorites')
      AND name = N'UQ_Favorites_User_Post'
)
BEGIN
    ALTER TABLE dbo.Favorites DROP CONSTRAINT UQ_Favorites_User_Post;
    PRINT 'Dropped inline UNIQUE constraint UQ_Favorites_User_Post.';
END
GO

-- Drop any existing index with the same name (idempotent)
IF EXISTS (
    SELECT 1 FROM sys.indexes
    WHERE object_id = OBJECT_ID(N'dbo.Favorites')
      AND name = N'UQ_Favorites_User_Post'
)
BEGIN
    DROP INDEX UQ_Favorites_User_Post ON dbo.Favorites;
    PRINT 'Dropped existing index UQ_Favorites_User_Post.';
END
GO

-- Create filtered unique index: only enforces uniqueness on active (non-deleted) rows
CREATE UNIQUE NONCLUSTERED INDEX UQ_Favorites_User_Post
ON dbo.Favorites (UserID, PostID)
WHERE IsDeleted = 0;
GO

PRINT 'Created filtered unique index UQ_Favorites_User_Post (WHERE IsDeleted = 0).';
GO

-- Record migration
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    EXEC sp_executesql N'
        IF NOT EXISTS (SELECT 1 FROM dbo.SchemaMigrations WHERE ScriptName = N''V202604080100__fix_favorites_unique_constraint.sql'')
        BEGIN
            INSERT INTO dbo.SchemaMigrations (ScriptName, Notes)
            VALUES (N''V202604080100__fix_favorites_unique_constraint.sql'',
                    N''Replace Favorites UNIQUE(UserID,PostID) with filtered index WHERE IsDeleted=0 to allow re-favoriting'');
        END';
END
GO
