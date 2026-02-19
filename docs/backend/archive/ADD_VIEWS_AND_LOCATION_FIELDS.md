# Adding Views and Location Fields to Posts

## Current Issues

1. **Views**: Posts show "0 views" because the database doesn't track views
2. **Location**: Posts always show "Jordan" because location isn't stored in the database

## Database Changes Needed

### Option 1: Add Views Column to TbPosts

```sql
USE [TijarahJoDB]
GO

-- Add Views column to TbPosts table
ALTER TABLE dbo.TbPosts
ADD Views INT NOT NULL DEFAULT 0;

-- Create index for views (useful for sorting by popularity)
CREATE INDEX IX_TbPosts_Views ON dbo.TbPosts(Views DESC);
GO
```

### Option 2: Add Location Fields to TbPosts

```sql
USE [TijarahJoDB]
GO

-- Add Location fields to TbPosts table
ALTER TABLE dbo.TbPosts
ADD City NVARCHAR(100) NULL,
    Area NVARCHAR(100) NULL;

-- Create index for location-based searches
CREATE INDEX IX_TbPosts_City ON dbo.TbPosts(City);
GO
```

## Backend Changes Needed

### 1. Update PostModel.cs
Add Views, City, and Area fields:

```csharp
public int Views { get; set; }
public string? City { get; set; }
public string? Area { get; set; }
```

### 2. Update Stored Procedures
- `SP_GetPostByID` - Include Views, City, Area in SELECT
- `SP_GetAllTbUserPosts` - Include Views, City, Area in SELECT
- `SP_AddPost` - Accept City, Area parameters
- `SP_UpdatePost` - Accept City, Area parameters

### 3. Update Controllers
- Accept City/Area when creating/updating posts
- Increment Views when a post is viewed

## Frontend Changes Needed

### 1. Store Location When Creating Posts
The location is already collected in `SellItemDialog.tsx` but not sent to backend.

### 2. Track Views
Call an API endpoint to increment views when viewing a post detail page.

## Quick Fix (Without Database Changes)

For now, we can:
1. **Views**: Show "0 views" (already working)
2. **Location**: Get location from the post creation form data if available, or default to "Jordan"

This requires frontend changes to pass location when creating posts and store it in the product object.

