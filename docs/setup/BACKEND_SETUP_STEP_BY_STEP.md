# Backend Setup - Complete Step-by-Step Guide

## 🎯 Goal
Get your ASP.NET Core backend running and connected to your React frontend.

---

## 📋 Prerequisites Checklist

Before starting, make sure you have:

- [ ] Windows computer
- [ ] Internet connection
- [ ] Administrator access (for installing software)

---

## Part 1: Install Required Software

### Step 1: Install Visual Studio 2022

1. **Download Visual Studio 2022 Community** (FREE):
   - Go to: https://visualstudio.microsoft.com/downloads/
   - Click **"Download Community"** (free version)
   - File size: ~3-4 GB (download may take 10-30 minutes)

2. **Run the Installer:**
   - Double-click the downloaded file
   - Click **"Continue"**
   - Wait for installer to prepare

3. **Select Workloads:**
   - In the installer, you'll see "Workloads" tab
   - Check these boxes:
     - ✅ **ASP.NET and web development**
     - ✅ **.NET desktop development** (optional but recommended)
   - Click **"Install"**

4. **Wait for Installation:**
   - This will take 15-30 minutes
   - Don't close the installer
   - You can minimize and use your computer

5. **Restart Computer:**
   - After installation, restart if prompted
   - Visual Studio is now installed!

### Step 2: Install SQL Server Express

1. **Download SQL Server Express** (FREE):
   - Go to: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   - Click **"Download now"** under "Express"
   - Choose **"Basic"** installation type
   - File size: ~500 MB

2. **Run the Installer:**
   - Double-click downloaded file
   - Click **"Basic"** installation type
   - Click **"Accept"** for license terms

3. **Set SA Password:**
   - **IMPORTANT:** Set a password for the `sa` (system administrator) account
   - Example: `YourPassword123!`
   - **WRITE THIS DOWN** - you'll need it later!
   - Click **"Install"**

4. **Wait for Installation:**
   - Takes 5-10 minutes
   - Don't close the installer

5. **Verify Installation:**
   - Press `Win + R` (Windows key + R)
   - Type: `services.msc`
   - Press Enter
   - Look for **"SQL Server (SQLEXPRESS)"**
   - Status should be **"Running"**
   - If not running, right-click → **"Start"**

### Step 3: Install SQL Server Management Studio (SSMS)

1. **Download SSMS** (FREE):
   - Go to: https://aka.ms/ssmsfullsetup
   - Click **"Download SQL Server Management Studio (SSMS)"**
   - File size: ~500 MB

2. **Run Installer:**
   - Double-click downloaded file
   - Click **"Install"**
   - Wait 2-5 minutes
   - Click **"Close"** when done

---

## Part 2: Set Up Database

### Step 1: Connect to SQL Server in SSMS

1. **Open SQL Server Management Studio (SSMS):**
   - Press `Win` key
   - Type: "SQL Server Management Studio"
   - Press Enter

2. **Connect to Server Dialog:**
   - If dialog doesn't appear, click **"Connect"** button (top left)

3. **Enter Connection Details:**
   - **Server type:** Database Engine (should be selected)
   - **Server name:** Type: `localhost\SQLEXPRESS`
     - OR if that doesn't work, try: `localhost`
   - **Authentication:** Select **"SQL Server Authentication"**
   - **Login:** Type: `sa`
   - **Password:** Type your SQL Server password (the one you set during installation)

4. **Click "Connect"**
   - If successful, you'll see Object Explorer on the left
   - If it fails, see troubleshooting section below

### Step 2: Create Database

1. **In Object Explorer (left side):**
   - Expand the server (click the arrow ▶)
   - You'll see folders like "Databases", "Security", etc.

2. **Create New Database:**
   - Right-click on **"Databases"** folder
   - Select **"New Database..."**

3. **Database Settings:**
   - **Database name:** Type: `TijarahJoDB`
   - Leave all other settings as default
   - Click **"OK"**

4. **Verify Database Created:**
   - Expand "Databases" folder
   - You should see **"TijarahJoDB"** in the list
   - If not, right-click "Databases" → **"Refresh"**

### Step 3: Create Tables (Run Schema Scripts)

1. **Open SQL Script File:**
   - Navigate to: `apps/api/DiagramsAndDocs/scripts.txt`
   - Open with Notepad or any text editor

2. **Open New Query in SSMS:**
   - Click **"New Query"** button (top toolbar, looks like a document)
   - OR press `Ctrl + N`
   - A blank query window opens

3. **Select Database:**
   - In the toolbar, find the database dropdown (usually shows "master")
   - Click it and select **"TijarahJoDB"**
   - OR type at the top of query window:
   ```sql
   USE TijarahJoDB;
   GO
   ```

4. **Copy SQL Scripts:**
   - Go back to `scripts.txt` file
   - Scroll to line 48 (where CREATE TABLE statements start)
   - Select all text from line 48 to the end
   - Copy (Ctrl + C)

5. **Paste in SSMS:**
   - Go back to SSMS query window
   - Paste (Ctrl + V)

6. **Execute Script:**
   - Press **F5** (or click "Execute" button - looks like a play button)
   - Wait a few seconds
   - You should see "Commands completed successfully" in Messages tab

7. **Verify Tables Created:**
   - In Object Explorer, expand: `TijarahJoDB` → `Tables`
   - You should see:
     - `dbo.TbRoles`
     - `dbo.TbUsers`
     - `dbo.TbItemCategories`
     - `dbo.TbPosts`
     - `dbo.TbPostImages`
   - If you don't see them, right-click "Tables" → **"Refresh"**

### Step 4: Insert Sample Data (Optional)

1. **In SSMS Query Window:**
   - Keep the same query window open
   - Clear it (select all → Delete)

2. **Copy INSERT Statements:**
   - Go back to `scripts.txt`
   - Find the INSERT statements (around lines 140-174)
   - Copy them

3. **Paste and Execute:**
   - Paste in SSMS
   - Press F5
   - Should see "Commands completed successfully"

4. **Verify Data:**
   - In Object Explorer, right-click `TbUsers` table
   - Select **"Select Top 1000 Rows"**
   - You should see data (or empty if no seed data)

---

## Part 3: Configure Backend

### Step 1: Open Backend Project in Visual Studio

1. **Open Visual Studio 2022:**
   - Press `Win` key
   - Type: "Visual Studio 2022"
   - Press Enter

2. **Open Solution:**
   - Click **"Open a project or solution"**
   - Navigate to: `apps/api/`
   - Select **`TijarahJo.sln`**
   - Click **"Open"**

3. **Wait for Project to Load:**
   - Visual Studio will restore NuGet packages
   - Wait for "Ready" status at bottom
   - May take 1-2 minutes first time

### Step 2: Configure Database Connection String

1. **Find Connection Settings File:**
   - In Solution Explorer (right side), expand: `DAL` folder
   - Double-click: `clsDataAccessSettings.cs`

2. **Update Connection String:**
   - Find this line:
   ```csharp
   public static string ConnectionString = "Data Source=.;Database=TijarahJoDB;Integrated Security=True;TrustServerCertificate=True;";
   ```

3. **Change to SQL Server Authentication:**
   - Replace with (use your SQL Server password):
   ```csharp
   public static string ConnectionString = "Data Source=localhost\\SQLEXPRESS;Database=TijarahJoDB;User Id=sa;Password=YourPassword123!;TrustServerCertificate=True;";
   ```
   - Replace `YourPassword123!` with your actual SQL Server password
   - Replace `SQLEXPRESS` with your instance name if different

4. **Save File:**
   - Press `Ctrl + S`
   - File is saved

### Step 3: Configure CORS (Allow Frontend to Connect)

1. **Open Program.cs:**
   - In Solution Explorer, expand: `TijarahJoDBAPI` folder
   - Double-click: `Program.cs`

2. **Find CORS Configuration:**
   - Scroll to around line 107-117
   - Find this code:
   ```csharp
   policy.WithOrigins("http://localhost:3456")
   ```

3. **Update Frontend URL:**
   - Change to:
   ```csharp
   policy.WithOrigins("http://localhost:5173") // Frontend runs on port 5173
   ```

4. **Save File:**
   - Press `Ctrl + S`

### Step 4: Check Backend Port

1. **Open launchSettings.json:**
   - In Solution Explorer, expand: `TijarahJoDBAPI` → `Properties`
   - Double-click: `launchSettings.json`

2. **Note the Port Numbers:**
   - Look for `applicationUrl` or `launchUrl`
   - You'll see something like:
     - `http://localhost:5000`
     - `https://localhost:7000`
   - **Write down the HTTP port** (usually 5000 or 7000)
   - You'll need this for frontend configuration

---

## Part 4: Run Backend

### Step 1: Set Startup Project

1. **In Solution Explorer:**
   - Right-click on **`TijarahJoDBAPI`** project (not the solution)
   - Select **"Set as Startup Project"**
   - Project name should be bold now

### Step 2: Build the Project

1. **Build Solution:**
   - Go to menu: `Build` → `Build Solution`
   - OR press `Ctrl + Shift + B`
   - Wait for build to complete
   - Check bottom status bar: Should say "Build succeeded"
   - If there are errors, fix them first

### Step 3: Run Backend

1. **Start Debugging:**
   - Press **F5** (or click green "Start" button)
   - OR: `Debug` → `Start Debugging`

2. **Wait for Backend to Start:**
   - Browser may open automatically
   - You should see Swagger UI (API documentation page)
   - URL will be something like: `https://localhost:7000/swagger` or `http://localhost:5000/swagger`

3. **Verify Backend is Running:**
   - In Swagger UI, you should see API endpoints listed
   - Try clicking on an endpoint (e.g., `GET /api/Users`)
   - Click "Try it out" → "Execute"
   - Should return data (or empty array)

4. **Note the Port:**
   - Look at the URL in browser
   - Note the port number (e.g., `7000` or `5000`)
   - **You'll need this for frontend!**

5. **Keep Backend Running:**
   - **Don't close Visual Studio or stop the backend**
   - Minimize it if needed
   - Backend must stay running for frontend to connect

---

## Part 5: Connect Frontend to Backend

### Step 1: Create Environment File

1. **Navigate to Frontend Root:**
   - Go to: `final project` folder (where `package.json` is)

2. **Create `.env` File:**
   - Create a new file named: `.env`
   - **Important:** File must be named exactly `.env` (with the dot at the beginning)
   - No extension (.txt, etc.)

3. **Add API URL:**
   - Open `.env` file in Notepad
   - Add this line (replace port with your backend port):
   ```
   VITE_API_BASE_URL=http://localhost:7000/api/v1
   ```
   - If your backend uses HTTPS, use:
   ```
   VITE_API_BASE_URL=https://localhost:7000/api/v1
   ```
   - **Replace `7000` with your actual backend port!**

4. **Save File:**
   - Save and close

### Step 2: Update Frontend API Service

1. **Open API Service File:**
   - Navigate to: `services/api.ts`

2. **Disable Mock Mode:**
   - Find line 34:
   ```typescript
   const MOCK_MODE = true;
   ```
   - Change to:
   ```typescript
   const MOCK_MODE = false; // Changed from true to false
   ```

3. **Verify API URL:**
   - Check line 30-31:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";
   ```
   - This should automatically use your `.env` file
   - The fallback `http://localhost:3001/api` is just a default

4. **Save File:**
   - Press `Ctrl + S`

### Step 3: Restart Frontend

1. **Stop Frontend (if running):**
   - Go to terminal where frontend is running
   - Press `Ctrl + C` to stop

2. **Start Frontend Again:**
   ```bash
   npm run dev
   ```

3. **Verify Frontend Starts:**
   - Should open: `http://localhost:5173`
   - Frontend should load normally

---

## Part 6: Test Connection

### Step 1: Test in Browser

1. **Open Frontend:**
   - Go to: `http://localhost:5173`

2. **Open Browser Developer Tools:**
   - Press `F12` (or right-click → "Inspect")
   - Go to **"Console"** tab
   - Go to **"Network"** tab

3. **Try to Use Frontend:**
   - Try to login
   - Try to browse products
   - Try to create a post

4. **Check Network Tab:**
   - You should see API requests to `http://localhost:7000/api/v1/...`
   - Requests should show status `200` (success) or other codes
   - If you see `CORS error`, see troubleshooting

5. **Check Console Tab:**
   - Look for any error messages
   - Should not see connection errors

### Step 2: Verify Backend Receives Requests

1. **In Visual Studio:**
   - Look at **"Output"** window (bottom of Visual Studio)
   - When you use frontend, you should see log messages
   - OR check **"Debug Output"** tab

2. **In Swagger UI:**
   - Go to: `http://localhost:7000/swagger` (or your port)
   - Try executing an endpoint
   - Should return data

---

## Troubleshooting

### Problem: Can't Connect to SQL Server in SSMS

**Solution 1: Check Server Name**
- Try: `localhost\SQLEXPRESS`
- Try: `localhost`
- Try: `.\SQLEXPRESS`
- Try: `(local)\SQLEXPRESS`

**Solution 2: Check SQL Server is Running**
- Press `Win + R`
- Type: `services.msc`
- Find "SQL Server (SQLEXPRESS)"
- Right-click → "Start" if not running

**Solution 3: Check Authentication**
- Make sure you're using SQL Server Authentication
- Login: `sa`
- Password: The one you set during installation

### Problem: Backend Won't Start

**Solution 1: Check Build Errors**
- Build solution first: `Build` → `Build Solution`
- Fix any errors shown
- Common: Missing NuGet packages (Visual Studio will restore them)

**Solution 2: Check Port Conflicts**
- Another app might be using the port
- Change port in `launchSettings.json`
- Or stop the other application

**Solution 3: Check Database Connection**
- Verify connection string in `clsDataAccessSettings.cs`
- Test connection in SSMS first
- Make sure database `TijarahJoDB` exists

### Problem: Frontend Can't Connect to Backend

**Solution 1: Check Backend is Running**
- Visual Studio should show "Running" status
- Swagger UI should be accessible
- Check URL in browser

**Solution 2: Check CORS Settings**
- In `Program.cs`, verify:
  ```csharp
  policy.WithOrigins("http://localhost:5173")
  ```
- Must match frontend URL exactly
- Restart backend after changing

**Solution 3: Check API URL in Frontend**
- Verify `.env` file exists and has correct URL
- Check `services/api.ts` has `MOCK_MODE = false`
- Restart frontend after changes

**Solution 4: Check Browser Console**
- Press F12 → Console tab
- Look for CORS errors
- Look for connection refused errors
- Share error message for help

### Problem: CORS Error in Browser

**Error:** "Access to fetch at 'http://localhost:7000/api/v1/...' from origin 'http://localhost:5173' has been blocked by CORS policy"

**Solution:**
1. Open `Program.cs` in backend
2. Find CORS configuration (around line 107)
3. Make sure it says:
   ```csharp
   policy.WithOrigins("http://localhost:5173")
   ```
4. Save and restart backend (stop F5, then press F5 again)

### Problem: Database Connection Error in Backend

**Error:** "Cannot open database" or "Login failed"

**Solution:**
1. Open `clsDataAccessSettings.cs`
2. Verify connection string:
   ```csharp
   "Data Source=localhost\\SQLEXPRESS;Database=TijarahJoDB;User Id=sa;Password=YourPassword;TrustServerCertificate=True;"
   ```
3. Test connection in SSMS first
4. Make sure database `TijarahJoDB` exists

---

## Quick Reference: Ports and URLs

### Backend:
- **Default HTTP:** `http://localhost:5000`
- **Default HTTPS:** `https://localhost:7000`
- **Swagger UI:** `http://localhost:5000/swagger` or `https://localhost:7000/swagger`
- **Check in:** `launchSettings.json`

### Frontend:
- **Development:** `http://localhost:5173`
- **Configured in:** `vite.config.ts`

### Database:
- **Server:** `localhost\SQLEXPRESS`
- **Database:** `TijarahJoDB`
- **Port:** `1433` (default)

---

## Complete Setup Checklist

### Software Installation:
- [ ] Visual Studio 2022 installed
- [ ] SQL Server Express installed
- [ ] SSMS installed
- [ ] SQL Server service running

### Database Setup:
- [ ] Connected to SQL Server in SSMS
- [ ] Created `TijarahJoDB` database
- [ ] Ran CREATE TABLE scripts
- [ ] Tables visible in Object Explorer
- [ ] (Optional) Inserted sample data

### Backend Configuration:
- [ ] Backend project opened in Visual Studio
- [ ] Connection string updated in `clsDataAccessSettings.cs`
- [ ] CORS updated in `Program.cs` (frontend URL)
- [ ] Project builds successfully
- [ ] Backend runs (F5) and shows Swagger UI

### Frontend Configuration:
- [ ] `.env` file created with API URL
- [ ] `MOCK_MODE = false` in `services/api.ts`
- [ ] Frontend restarted after changes

### Testing:
- [ ] Backend accessible in browser (Swagger UI)
- [ ] Frontend accessible in browser
- [ ] No CORS errors in browser console
- [ ] API requests visible in Network tab
- [ ] Data loads in frontend from backend

---

## Step-by-Step Summary

1. **Install:** Visual Studio 2022, SQL Server, SSMS
2. **Database:** Connect SSMS → Create database → Run scripts
3. **Backend:** Open in Visual Studio → Configure connection → Configure CORS → Run (F5)
4. **Frontend:** Create `.env` → Set `MOCK_MODE = false` → Restart
5. **Test:** Use frontend → Check browser console → Verify API calls

---

## Need Help?

If you get stuck:
1. Check the error message carefully
2. Check browser console (F12)
3. Check Visual Studio Output window
4. Verify all steps in checklist above
5. Check troubleshooting section

**You're ready to connect frontend and backend! 🚀**
