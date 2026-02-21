-- V202602191100__architecture_refactoring.sql
-- Renames 'Tb' prefixed tables to canonical plural nouns

EXEC sp_rename 'dbo.TbUsers', 'Users';
EXEC sp_rename 'dbo.TbRoles', 'Roles';
EXEC sp_rename 'dbo.TbPosts', 'Posts';
EXEC sp_rename 'dbo.TbItemCategories', 'Categories';
EXEC sp_rename 'dbo.TbPostImages', 'PostImages';
EXEC sp_rename 'dbo.TbFavorites', 'Favorites';
EXEC sp_rename 'dbo.TbMessages', 'Messages';
EXEC sp_rename 'dbo.TbReviews', 'Reviews';
GO

-- We do not need to aggressively rename constraints because EF Core looks them up 
-- by the table definition anyway. Renaming them dynamically causes 
-- duplicate object errors if run repeatedly against a live database.

-- We rely on EF Core table identity mappings for Constraints and Indexes instead of renaming them.
