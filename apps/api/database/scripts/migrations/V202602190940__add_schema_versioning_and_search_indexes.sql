USE TijarahJoDB;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Applying schema versioning and search index enhancements...';
GO

-- ============================================================
-- 1) Schema migration history table (version control metadata)
-- ============================================================
IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.SchemaMigrations
    (
        ScriptName NVARCHAR(255) NOT NULL
            CONSTRAINT PK_SchemaMigrations PRIMARY KEY,
        AppliedAt DATETIME2 NOT NULL
            CONSTRAINT DF_SchemaMigrations_AppliedAt DEFAULT SYSUTCDATETIME(),
        Notes NVARCHAR(2000) NULL
    );

    PRINT 'Created table dbo.SchemaMigrations.';
END
GO

IF OBJECT_ID(N'dbo.SchemaMigrations', N'U') IS NOT NULL
BEGIN
    MERGE dbo.SchemaMigrations AS target
    USING
    (
        VALUES
            (N'BASE_SCHEMA.sql', N'Canonical base schema source'),
            (N'V202602190900__add_views_and_location_to_posts.sql', N'Posts location + views fields'),
            (N'V202602190905__add_phone_to_users.sql', N'Users phone field'),
            (N'V202602190907__add_user_profile_fields.sql', N'Users city/area/bio/avatar profile fields'),
            (N'V202602190910__drop_username_from_users.sql', N'Removed legacy username'),
            (N'V202602190915__add_category_visual_fields.sql', N'Category visual metadata'),
            (N'V202602190920__add_favorites_table.sql', N'Favorites relation table'),
            (N'V202602190925__fix_post_image_url_size.sql', N'Post image URL size fix'),
            (N'V202602190930__add_chat_review_tables_and_indexes.sql', N'Chat/review schema and indexes'),
            (N'V202602190935__enhance_database_performance_and_integrity.sql', N'Normalization + integrity + indexes'),
            (N'V202602190940__add_schema_versioning_and_search_indexes.sql', N'Schema history + search indexes'),
            (N'CANONICAL_STORED_PROCEDURES.sql', N'Canonical runtime stored procedure definitions')
    ) AS source (ScriptName, Notes)
        ON target.ScriptName = source.ScriptName
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (ScriptName, Notes)
        VALUES (source.ScriptName, source.Notes);

    PRINT 'Recorded baseline migration entries in dbo.SchemaMigrations.';
END
GO

-- ============================================================
-- 2) Integrity constraints for high-traffic tables
-- ============================================================
IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH(N'dbo.TbPosts', N'Views') IS NOT NULL
    BEGIN
        UPDATE dbo.TbPosts
        SET Views = 0
        WHERE Views < 0;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.check_constraints
            WHERE name = N'CK_TbPosts_Views_NonNegative'
              AND parent_object_id = OBJECT_ID(N'dbo.TbPosts')
        )
        BEGIN
            ALTER TABLE dbo.TbPosts
            ADD CONSTRAINT CK_TbPosts_Views_NonNegative CHECK (Views >= 0);
            PRINT 'Added constraint CK_TbPosts_Views_NonNegative.';
        END
    END
END
GO

-- ============================================================
-- 3) Search/query performance indexes
-- ============================================================
IF OBJECT_ID(N'dbo.TbPosts', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbPosts_SearchCore'
          AND object_id = OBJECT_ID(N'dbo.TbPosts')
    )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchCore
        ON dbo.TbPosts (IsDeleted, CategoryID, Status, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, Price, Views, City, Area);

        PRINT 'Created index IX_TbPosts_SearchCore.';
    END

    IF COL_LENGTH(N'dbo.TbPosts', N'City') IS NOT NULL
       AND NOT EXISTS (
            SELECT 1
            FROM sys.indexes
            WHERE name = N'IX_TbPosts_SearchCity'
              AND object_id = OBJECT_ID(N'dbo.TbPosts')
       )
    BEGIN
        CREATE NONCLUSTERED INDEX IX_TbPosts_SearchCity
        ON dbo.TbPosts (City, IsDeleted, CreatedAt DESC, PostID DESC)
        INCLUDE (UserID, CategoryID, Status, Price, Views, Area)
        WHERE City IS NOT NULL;

        PRINT 'Created index IX_TbPosts_SearchCity.';
    END
END
GO

IF OBJECT_ID(N'dbo.TbUsers', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_TbUsers_ActiveByRoleStatus'
          AND object_id = OBJECT_ID(N'dbo.TbUsers')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_TbUsers_ActiveByRoleStatus
    ON dbo.TbUsers (RoleID, Status, IsDeleted)
    INCLUDE (UserID, Email, FirstName, LastName, JoinDate);

    PRINT 'Created index IX_TbUsers_ActiveByRoleStatus.';
END
GO

IF OBJECT_ID(N'dbo.TbMessages', N'U') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'IX_Messages_Unread'
          AND object_id = OBJECT_ID(N'dbo.TbMessages')
   )
BEGIN
    CREATE NONCLUSTERED INDEX IX_Messages_Unread
    ON dbo.TbMessages (ReceiverID, SenderID, IsRead);

    PRINT 'Created index IX_Messages_Unread.';
END
GO

PRINT 'Schema versioning and search index enhancements completed.';
GO
