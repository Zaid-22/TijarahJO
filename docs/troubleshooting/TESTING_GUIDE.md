# TijarahJo Testing Guide

**Date:** $(date)
**Purpose:** Comprehensive testing checklist for all project functionality

---

## 🚀 Pre-Testing Setup

### 1. Backend Setup

```bash
# Ensure SQL Server is running
# Check connection string in:
# TijarahJo-Backend/TijarahJoDBAPI/DAL/clsDataAccessSettings.cs

# Current connection string:
# Data Source=localhost;Database=TijarahJoDB;User Id=sa;Password=Zaidzaid12;TrustServerCertificate=True;
```

### 2. Frontend Setup

```bash
cd TijarahJo-frontend
npm install
npm run dev
# Should start on http://localhost:5173
```

### 3. Backend Startup

1. Open `TijarahJo-Backend/TijarahJoDBAPI/TijarahJoDBAPI.sln` in Visual Studio
2. Press F5 or click "Start Debugging"
3. Backend should start on `http://localhost:5033`
4. Swagger UI should be available at `http://localhost:5033/swagger`

---

## ✅ Testing Checklist

### 🔐 Authentication Testing

#### 1. Backend Connection Test

- [ ] **Test:** Open browser console
- [ ] **Expected:** No connection errors
- [ ] **Check:** Network tab shows successful requests to `localhost:5033`

#### 2. Database Connection Test

- [ ] **Test:** Backend starts without errors
- [ ] **Expected:** No SQL connection errors in backend console
- [ ] **Check:** Database `TijarahJoDB` exists and is accessible

#### 3. Sign Up (Registration)

- [ ] **Test:** Navigate to signup page
- [ ] **Test:** Fill all required fields:
  - First Name: "Test"
  - Last Name: "User"
  - Username: "testuser123" (unique)
  - Email: "test@example.com" (unique)
  - Password: "Test123!" (meets requirements)
  - Confirm Password: "Test123!"
- [ ] **Expected:**
  - Form validation works
  - Password strength indicator shows
  - Success message appears
  - User is logged in automatically
  - Token is stored in localStorage as `tijarahjo_token`
- [ ] **Error Cases:**
  - [ ] Try duplicate username → Should show error
  - [ ] Try duplicate email → Should show error
  - [ ] Try weak password → Should show validation error
  - [ ] Try mismatched passwords → Should show error

#### 4. Login

- [ ] **Test:** Navigate to login page
- [ ] **Test:** Enter credentials:
  - Email/Username: "test@example.com" or "testuser123"
  - Password: "Test123!"
- [ ] **Expected:**
  - Login successful
  - Token stored in localStorage
  - User redirected to home page
  - User profile shows in header
- [ ] **Error Cases:**
  - [ ] Wrong password → Should show error
  - [ ] Non-existent user → Should show error
  - [ ] Empty fields → Should show validation errors

#### 5. Token Verification

- [ ] **Test:** After login, refresh the page
- [ ] **Expected:**
  - User remains logged in
  - Token is verified with backend `/api/auth/me`
  - User data loads from backend
- [ ] **Test:** Clear localStorage and refresh
- [ ] **Expected:** User is logged out

#### 6. Logout

- [ ] **Test:** Click logout button
- [ ] **Expected:**
  - User is logged out
  - Token removed from localStorage
  - Redirected to home page
  - Login button appears

---

### 📦 Posts/Products Testing

#### 7. Load Posts from Database

- [ ] **Test:** Open home page
- [ ] **Expected:**
  - Posts load from backend API
  - Console shows: "Successfully fetched X posts from backend"
  - Posts display in grid/list view
  - No errors in console
- [ ] **Check:** Network tab shows successful GET to `/api/TbPosts/All` or `/api/TbPosts/pagination`

#### 8. Post Display

- [ ] **Test:** View posts on home page
- [ ] **Expected:**
  - Post images display correctly
  - Post titles visible
  - Prices formatted correctly (JOD)
  - Categories shown
  - Seller names shown
  - Locations shown
- [ ] **Test:** Click on a post
- [ ] **Expected:** Navigate to product details page

#### 9. Post Details Page

- [ ] **Test:** Click on any post
- [ ] **Expected:**
  - All post images display
  - Full description shown
  - Price, location, category visible
  - Seller information shown
  - "Contact Seller" button works
  - "Add to Favorites" works (if logged in)

#### 10. Search Functionality

- [ ] **Test:** Enter search query in header
- [ ] **Expected:**
  - Search results page appears
  - Results match query
  - Can filter by category
  - Can clear search
- [ ] **Test:** Search for non-existent item
- [ ] **Expected:** "No results found" message

#### 11. Category Filtering

- [ ] **Test:** Click on category card
- [ ] **Expected:**
  - Category page opens
  - Shows posts in that category
  - Can navigate back
- [ ] **Test:** Use category dropdown
- [ ] **Expected:** Filters posts correctly

---

### 👤 User Interface Testing

#### 12. Responsive Design

- [ ] **Test:** Resize browser window
- [ ] **Expected:**
  - Layout adapts to screen size
  - Mobile view works (test on mobile device or DevTools)
  - Tablet view works
  - Desktop view works

#### 13. Dark Mode

- [ ] **Test:** Toggle dark mode
- [ ] **Expected:**
  - Theme changes immediately
  - Preference saved in localStorage
  - All components support dark mode
  - Text is readable in both modes

#### 14. Language Toggle

- [ ] **Test:** Switch between English and Arabic
- [ ] **Expected:**
  - All text translates
  - RTL layout for Arabic
  - Preference saved
  - Icons and images remain correct

#### 15. View Modes

- [ ] **Test:** Switch between grid-4, grid-3, grid-2, list
- [ ] **Expected:**
  - Layout changes correctly
  - Preference saved
  - All posts visible in each mode

---

### ⭐ Favorites Testing

#### 16. Add to Favorites

- [ ] **Test:** Click heart icon on a post (while logged in)
- [ ] **Expected:**
  - Heart fills/becomes active
  - Post added to favorites
  - Saved in localStorage
- [ ] **Test:** Click heart while not logged in
- [ ] **Expected:** Login prompt appears

#### 17. View Favorites

- [ ] **Test:** Navigate to Favorites page
- [ ] **Expected:**
  - All favorited posts shown
  - Can remove from favorites
  - Empty state if no favorites

---

### 📝 Forms Testing

#### 18. Form Validation

- [ ] **Test:** Try submitting empty forms
- [ ] **Expected:** Validation errors appear
- [ ] **Test:** Enter invalid email
- [ ] **Expected:** Email validation error
- [ ] **Test:** Enter invalid phone
- [ ] **Expected:** Phone validation error

#### 19. Browser Extension Compatibility

- [ ] **Test:** Use password manager (LastPass, 1Password, etc.)
- [ ] **Expected:**
  - Forms are recognized
  - Auto-fill works
  - No console errors from extensions

---

### 🔧 Error Handling Testing

#### 20. Backend Offline

- [ ] **Test:** Stop backend server
- [ ] **Expected:**
  - Frontend shows connection error
  - Falls back to mock data (if configured)
  - User-friendly error message
  - No app crash

#### 21. Invalid API Responses

- [ ] **Test:** Modify backend to return invalid data
- [ ] **Expected:**
  - Frontend handles gracefully
  - Error messages shown
  - No crashes

---

## 🐛 Common Issues & Solutions

### Issue: "Cannot connect to backend"

**Solution:**

1. Check backend is running on `localhost:5033`
2. Check firewall settings
3. Verify API_BASE_URL in `api.ts`

### Issue: "Database connection failed"

**Solution:**

1. Check SQL Server is running
2. Verify connection string in `clsDataAccessSettings.cs`
3. Check database `TijarahJoDB` exists
4. Verify username/password

### Issue: "Token verification failed"

**Solution:**

1. Check `/api/auth/me` endpoint works in Swagger
2. Verify JWT token is valid
3. Check token storage key matches (`tijarahjo_token`)

### Issue: "Posts not loading"

**Solution:**

1. Check `/api/TbPosts/All` endpoint in Swagger
2. Verify database has posts
3. Check browser console for errors
4. Verify CORS is enabled on backend

---

## 📊 Performance Testing

#### 22. Load Time

- [ ] **Test:** Measure initial page load
- [ ] **Expected:** < 3 seconds on good connection
- [ ] **Test:** Measure API response times
- [ ] **Expected:** < 1 second per request

#### 23. Large Data Sets

- [ ] **Test:** Load page with 100+ posts
- [ ] **Expected:**
  - Pagination works
  - No performance issues
  - Smooth scrolling

---

## ✅ Final Verification

### All Systems Operational

- [ ] No console errors
- [ ] No linter errors
- [ ] All API endpoints working
- [ ] Database connectivity confirmed
- [ ] Authentication flow complete
- [ ] All forms functional
- [ ] UI responsive and accessible
- [ ] Dark mode working
- [ ] Language toggle working

---

## 📝 Test Results Template

```
Date: ___________
Tester: ___________

Backend Status: [ ] Running [ ] Not Running
Database Status: [ ] Connected [ ] Not Connected
Frontend Status: [ ] Running [ ] Not Running

Tests Passed: ___ / 23
Critical Issues: ___
Minor Issues: ___

Notes:
_______________________________________
_______________________________________
_______________________________________
```

---

## 🎯 Quick Test Commands

### Check Backend

```bash
curl http://localhost:5033/api/TbPosts/All
```

### Check Frontend

```bash
# In browser console:
localStorage.getItem('tijarahjo_token')
```

### Check Database

```sql
SELECT COUNT(*) FROM TbPosts;
SELECT COUNT(*) FROM TbUsers;
```

---

**Last Updated:** $(date)
**Status:** ✅ Ready for Testing
