# Debug Guide: Profile Edit Not Working

## Common Issues and Solutions

### 1. **Save Button Disabled**
- **Symptom**: Save button is grayed out and not clickable
- **Cause**: `hasChanges` state is `false` (no changes detected)
- **Solution**: 
  - Make sure you've actually changed a field value
  - Check browser console for `[EditProfilePage] Initial formData:` log
  - Try changing First Name, Last Name, or City

### 2. **Validation Errors**
- **Symptom**: Error messages appear when clicking Save
- **Common Errors**:
  - "First name is required" - First Name field is empty
  - "Last name is required" - Last Name field is empty  
  - "City is required" - City dropdown is not selected
  - "Phone number must be 9 digits after +962" - Phone format is invalid
- **Solution**: Fill in all required fields (marked with `*`)

### 3. **City Field Not Selected**
- **Symptom**: City shows "Select your city" placeholder
- **Cause**: City is required but not selected
- **Solution**: 
  - Click the City dropdown
  - Select a city from the list (Amman, Irbid, Zarqa, etc.)
  - The Save button should become enabled after selection

### 4. **API Error**
- **Symptom**: Toast error message appears after clicking Save
- **Check Browser Console** for:
  - `[App] Error calling updateUser API:` - API call failed
  - `[updateUser] Failed:` - Backend returned error
  - Network tab: Check if `/api/users/{id}` returns 500 error
- **Solution**: 
  - Check backend console for errors
  - Verify SQL scripts were run (see `FIX_UPDATE_USER_PASSWORD.sql`)
  - Check if user has permission to update profile

### 5. **Form Not Detecting Changes**
- **Symptom**: Save button stays disabled even after changing fields
- **Cause**: `hasChanges` state not updating
- **Solution**: 
  - Check browser console for `[EditProfilePage] handleChange` logs
  - Make sure you're actually typing/changing values (not just clicking)
  - Try refreshing the page and editing again

## Debug Steps

1. **Open Browser Console** (F12)
2. **Navigate to Edit Profile page**
3. **Check Initial State**:
   ```
   [EditProfilePage] Initial profile: {...}
   [EditProfilePage] Initial formData: {...}
   ```
4. **Change a Field** (e.g., First Name):
   - Type in the First Name field
   - Check console for: `[EditProfilePage] handleChange` logs
   - Verify `hasChanges` should be `true`
5. **Click Save Button**:
   - Check console for: `[EditProfilePage] handleSave called`
   - Check for validation errors: `[EditProfilePage] Validation errors: {...}`
   - If validation passes: `[EditProfilePage] Validation passed, calling onSave`
6. **Check API Call**:
   - Look for: `[App] Calling updateUser API with: {...}`
   - Check Network tab for `/api/users/{id}` request
   - Verify response status (should be 200)

## Required Fields

Make sure these fields are filled:
- ✅ **First Name** (required)
- ✅ **Last Name** (required)
- ✅ **City** (required - must select from dropdown)

## Optional Fields

These can be empty:
- Middle Name
- Phone Number (but if provided, must be valid format)
- Area
- Bio

## Quick Test

1. Open Edit Profile page
2. Change First Name to something different
3. Select a City from dropdown (if not already selected)
4. Click Save
5. Check console for any errors
6. If successful, you should see: "Profile updated successfully!" toast

