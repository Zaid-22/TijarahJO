# TijarahJo Debugging Guide

## Issues Identified and Fixes Applied

### 1. ✅ Login Persistence Issue

**Problem**: Login doesn't persist - redirects to homepage but user not actually signed in.

**Root Causes**:

- AuthContext `checkAuth()` runs on mount but may not detect token immediately after login
- LoginPage calls `onLogin` which updates local state but doesn't trigger AuthContext refresh

**Fixes Applied**:

- Updated LoginPage to use `useAuth()` from AuthContext
- Added storage event listener in AuthContext to detect token changes
- Improved token validation and user state restoration

**To Verify**:

1. Log in with valid credentials
2. Check browser console for `[AuthContext] Login successful`
3. Check localStorage for `tijarahjo_token`
4. Reload page - should remain logged in
5. Check backend console for `[Login] Login successful`

### 2. ✅ Post Creation - Wrong User ID

**Problem**: Posts are assigned to admin (UserID: 1) instead of logged-in user.

**Root Causes**:

- `createPost` was defaulting to user ID "1" when `/auth/me` failed
- Not properly extracting user ID from JWT token

**Fixes Applied**:

- Changed default from "1" to "" and added validation
- Now throws error if user not authenticated instead of defaulting to admin
- Improved JWT token decoding fallback
- Added extensive logging

**To Verify**:

1. Log in as a non-admin user (e.g., UserID: 15)
2. Create a new post
3. Check browser console for `[createPost] Got user ID from /auth/me: 15`
4. Check database: `SELECT PostID, UserID, PostTitle FROM TbPosts ORDER BY PostID DESC`
5. Verify UserID matches your logged-in user, not 1

### 3. ✅ Image Saving Issue

**Problem**: Images not being saved to database or not linked to posts.

**Root Causes**:

- Image creation was sequential (await in loop) without error handling
- No validation of image URLs
- No logging to track image creation success/failure

**Fixes Applied**:

- Changed to `Promise.all()` for parallel image creation
- Added error handling for each image
- Added validation to skip empty image URLs
- Added extensive logging
- Track successful image saves separately

**To Verify**:

1. Create a post with images
2. Check browser console for `[createPost] Creating X images for post Y`
3. Check backend console for image creation logs
4. Check database:
   ```sql
   SELECT PostImageID, PostID, PostImageURL, IsDeleted
   FROM TbPostImages
   WHERE PostID = [your_post_id]
   ORDER BY PostImageID DESC
   ```

### 4. ⚠️ API Endpoints Verification Needed

**Backend Endpoints**:

#### Authentication

- ✅ `POST /api/auth/login` - Working (verified in logs)
- ✅ `POST /api/auth/signup` - Needs testing
- ✅ `GET /api/auth/me` - Needs testing (requires JWT token)

#### Posts (CRUD)

- ✅ `GET /api/TbPosts/All` - Working
- ✅ `GET /api/TbPosts/{id}` - Working
- ✅ `POST /api/TbPosts` - Working (needs user ID fix verification)
- ⚠️ `PUT /api/TbPosts/{id}` - Needs testing
- ⚠️ `DELETE /api/TbPosts/{id}` - Needs testing

#### Post Images (CRUD)

- ✅ `GET /api/TbPostImages/All` - Working
- ✅ `GET /api/TbPostImages/{id}` - Exists
- ✅ `POST /api/TbPostImages` - Exists (needs verification)
- ⚠️ `PUT /api/TbPostImages/{id}` - Needs testing
- ⚠️ `DELETE /api/TbPostImages/{id}` - Needs testing

#### Users (CRUD)

- ✅ `GET /api/users/All` - Exists
- ✅ `GET /api/users/{id}` - Exists
- ✅ `POST /api/users` - Exists (registration)
- ✅ `PUT /api/users/{id}` - Exists (profile update - needs verification)
- ⚠️ `DELETE /api/users/{id}` - Needs testing

### 5. ⚠️ CRUD Operations Testing Checklist

#### CREATE Operations

- [ ] Create new post (with images) - **FIXED** (needs verification)
- [ ] Create new user (signup) - **FIXED** (needs verification)
- [ ] Create post images - **FIXED** (needs verification)

#### READ Operations

- [x] Get all posts - Working
- [x] Get single post - Working
- [x] Get all images - Working
- [ ] Get user posts by user ID - Needs testing
- [ ] Get posts by category - Needs testing

#### UPDATE Operations

- [ ] Update post - Needs testing
- [ ] Update user profile - **FIXED** (needs verification)
- [ ] Update post image - Needs testing

#### DELETE Operations

- [ ] Delete post (soft delete) - Needs testing
- [ ] Delete post image - Needs testing
- [ ] Delete user - Needs testing

## Frontend Debugging Steps

### 1. Check Authentication State

```javascript
// In browser console:
localStorage.getItem("tijarahjo_token"); // Should return JWT token
localStorage.getItem("guestMode"); // Should be null or "false"
```

### 2. Check API Calls

Open browser DevTools → Network tab:

- Filter by "Fetch/XHR"
- Look for:
  - `/api/auth/login` - Should return 200 with token
  - `/api/auth/me` - Should return 200 with user data
  - `/api/TbPosts` POST - Should return 201 with created post
  - `/api/TbPostImages` POST - Should return 201 for each image

### 3. Check Console Logs

Look for:

- `[AuthContext] Login successful` - Confirms login worked
- `[createPost] Got user ID from /auth/me: X` - Confirms correct user ID
- `[createPost] Post created with ID: X` - Confirms post creation
- `[createPost] Image X created successfully` - Confirms image creation

## Backend Debugging Steps

### 1. Check Backend Logs

Look for:

- `[Login] Login successful for UserID: X` - Confirms authentication
- `[UpdateUser Controller] User updated successfully` - Confirms profile update
- `[GetAllTbPostImages] Returning X images` - Confirms images retrieved

### 2. Check Database

```sql
-- Check recent posts and their user IDs
SELECT TOP 10 PostID, UserID, PostTitle, CreatedAt
FROM TbPosts
ORDER BY PostID DESC;

-- Check images for a specific post
SELECT PostImageID, PostID, PostImageURL, IsDeleted
FROM TbPostImages
WHERE PostID = [post_id];

-- Check user data
SELECT UserID, Login, Email, FirstName, LastName, IsDeleted
FROM TbUsers
WHERE UserID = [user_id];
```

### 3. Verify Stored Procedures

```sql
-- Check if stored procedures exist
SELECT name, type_desc
FROM sys.objects
WHERE type = 'P'
AND name IN (
    'SP_AddTbUser',
    'SP_TbUsers_Login',
    'SP_AddPost',
    'SP_AddPostImage',
    'SP_UpdateUser',
    'SP_UpdatePost'
);
```

## Common Issues and Solutions

### Issue: "Cannot create post: User not authenticated"

**Solution**:

1. Check if token exists: `localStorage.getItem("tijarahjo_token")`
2. Verify `/api/auth/me` returns user data
3. Check JWT token is valid (not expired)

### Issue: "Posts assigned to admin"

**Solution**:

1. Check browser console for `[createPost] Got user ID from /auth/me: X`
2. Verify X is not "1" (admin)
3. Check backend logs for actual UserID used in post creation

### Issue: "Images not showing"

**Solution**:

1. Check database: `SELECT * FROM TbPostImages WHERE PostID = X`
2. Verify `PostImageURL` is not empty
3. Check `IsDeleted = 0`
4. Check browser console for image creation logs

### Issue: "Login doesn't persist"

**Solution**:

1. Check token is saved: `localStorage.getItem("tijarahjo_token")`
2. Check AuthContext logs on page reload
3. Verify `/api/auth/me` endpoint works with token
4. Check backend JWT token validation

## Next Steps

1. **Test Login Persistence**:

   - Log in
   - Reload page
   - Verify still logged in
   - Check AuthContext state

2. **Test Post Creation**:

   - Log in as non-admin user
   - Create post with images
   - Verify UserID in database matches logged-in user
   - Verify images are saved and linked

3. **Test Profile Update**:

   - Edit profile
   - Save changes
   - Verify changes in database
   - Reload and verify changes persist

4. **Test All CRUD Operations**:
   - Create, Read, Update, Delete for posts
   - Create, Read, Update, Delete for images
   - Update user profile
