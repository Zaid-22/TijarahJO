# Views and Location Fix - Complete Implementation

## ✅ What Was Fixed

### 1. Database Schema
- ✅ Added `Views` column to `TbPosts` table (INT, default 0)
- ✅ Added `City` column to `TbPosts` table (NVARCHAR(100), nullable)
- ✅ Added `Area` column to `TbPosts` table (NVARCHAR(100), nullable)
- ✅ Created indexes for Views and City for better performance

### 2. Backend Changes
- ✅ Updated `PostModel.cs` to include Views, City, Area fields
- ✅ Updated `Post.cs` (BLL) to handle new fields
- ✅ Updated `PostData.cs` (DAL) to read/write new fields
- ✅ Updated stored procedures:
  - `SP_GetPostByID` - Returns Views, City, Area
  - `SP_GetAllTbUserPosts` - Returns Views, City, Area
  - `SP_GetTbPostsPaged` - Returns Views, City, Area
  - `SP_AddPost` - Accepts City, Area parameters
  - `SP_UpdatePost` - Accepts City, Area parameters
  - `SP_IncrementPostViews` - New procedure to track views
- ✅ Updated controllers to handle new fields
- ✅ Added `/api/posts/{id}/views` endpoint to track views
- ✅ Updated DTOMapper to use actual City from post instead of hardcoded "Jordan"

### 3. Frontend Changes
- ✅ Updated `createPost` to send City and Area when creating posts
- ✅ Updated `updatePost` to send City and Area when updating posts
- ✅ Updated `getPost` to track views when viewing post details
- ✅ Updated `transformPostModelToProduct` to use City from postModel
- ✅ Added view tracking in `ProductDetailsPage` component
- ✅ Fixed location display to show actual city instead of "Jordan"
- ✅ Fixed views display to show actual view count

## 📋 Steps to Apply the Fix

### Step 1: Run Database Scripts

**IMPORTANT: Run these scripts in order!**

1. **Add columns to database:**
   ```sql
   -- Run: database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql
   ```
   This adds Views, City, and Area columns to TbPosts table.

2. **Update stored procedures:**
   ```sql
   -- Run: database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql
   ```
   This updates all stored procedures to handle the new fields.

### Step 2: Rebuild Backend

The backend code has been updated. You need to rebuild:

```bash
cd apps/api
dotnet build
```

Or in Visual Studio: Right-click project → Rebuild

### Step 3: Restart Backend Server

After rebuilding, restart your backend server.

### Step 4: Test

1. **Create a new post** with location - it should save and display correctly
2. **View a post** - views should increment automatically
3. **Check location** - should show the actual city you selected, not "Jordan"

## 🎯 How It Works Now

### Views Tracking
- When a user views a post detail page, the frontend calls `POST /api/posts/{id}/views`
- Backend increments the Views count in the database
- Views are displayed in real-time on the post detail page

### Location Display
- When creating a post, the location (city) is saved to the database
- When displaying posts, the actual city from the database is shown
- If no city is set, it defaults to "Jordan"

### Posted Time
- Calculates time difference from `CreatedAt` date
- Shows: minutes, hours, days, weeks, months, or years ago
- Supports both English and Arabic

## 📝 Files Changed

### Backend
- `Models/PostModel.cs` - Added Views, City, Area
- `BLL/Post.cs` - Added Views, City, Area fields
- `DAL/PostData.cs` - Updated to read/write new fields, added IncrementPostViews
- `Controllers/UserPostsController.cs` - Updated to handle new fields, added view tracking endpoint
- `Utils/DTOMapper.cs` - Updated to use actual City from post

### Frontend
- `services/api.ts` - Updated createPost, updatePost, getPost, transformPostModelToProduct
- `components/figma/ProductDetailsPage.tsx` - Added view tracking, fixed time/views display

### SQL Scripts
- `database/scripts/migrations/ADD_VIEWS_AND_LOCATION_TO_POSTS.sql` - Adds database columns
- `database/scripts/migrations/FIX_MISSING_CHAT_REVIEW_AND_FILTER_PROCS.sql` - Updates stored procedures
- `database/scripts/archive/migrations/UPDATE_STORED_PROCEDURES_FOR_VIEWS_LOCATION.sql` - Legacy archived script (reference only)

## ⚠️ Important Notes

1. **Existing Posts**: Posts created before this fix will have:
   - Views = 0
   - City = NULL (will display as "Jordan")
   - Area = NULL

2. **Backward Compatibility**: The code handles missing columns gracefully, so it won't break if you haven't run the SQL scripts yet.

3. **View Tracking**: Views are tracked automatically when viewing post details. No manual action needed.

## 🐛 Troubleshooting

### Views not incrementing?
- Check backend console for errors
- Verify `SP_IncrementPostViews` stored procedure exists
- Check network tab in browser DevTools for API calls

### Location still showing "Jordan"?
- Verify you ran the SQL scripts
- Check that City column exists: `SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('TbPosts') AND name = 'City'`
- Rebuild and restart backend
- Create a new post with location to test

### Posted time not calculating?
- Check that `product.createdAt` is set correctly
- Verify the date format from backend matches expected format
