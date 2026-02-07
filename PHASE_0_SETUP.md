# Phase 0 Setup Guide - Foundation

This guide walks you through setting up the foundation for the MedEd Platform. Follow these steps to get authentication working end-to-end.

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm or yarn
- Supabase account (free tier)

## 1. Supabase Setup

### 1.1 Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Wait for the project to initialize (5-10 minutes)

### 1.2 Get Your Credentials
Once your project is ready:
1. Go to **Project Settings** → **API**
2. Copy the following:
   - `Project URL` → This is your `SUPABASE_URL`
   - `anon public key` → This is your `SUPABASE_KEY` (for frontend)
   - `service_role key` → This is your `SUPABASE_SERVICE_KEY` (for backend, keep secret!)

### 1.3 Create Database Schema
1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of `supabase_schema.sql` from the root directory
4. Paste into the SQL editor
5. Click **Run** to execute all SQL commands
6. Wait for completion (should see all tables created)

### 1.4 Enable Email Verification (Optional but Recommended)
1. Go to **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Go to **Email Templates** and review signup/verification templates

## 2. Backend Setup

### 2.1 Create Python Virtual Environment
```bash
cd /Users/angie/DevFest-2026/backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2.2 Install Dependencies
```bash
pip install -r requirements.txt
```

### 2.3 Configure Environment Variables
1. Open `backend/.env`
2. Fill in the following values:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```
3. Keep other API keys empty for now (they'll be added in later phases)
4. **Important**: Keep the `JWT_SECRET_KEY` as is (already generated)

### 2.4 Test Backend
```bash
cd /Users/angie/DevFest-2026/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Test the health endpoint:**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

Keep the backend running in a terminal window.

## 3. Frontend Setup

### 3.1 Configure Environment Variables
1. Open `src/.env`
2. Fill in the Supabase credentials (same ones from Supabase Setup):
   ```
   REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

### 3.2 Install Frontend Dependencies
```bash
# In the root directory (/Users/angie/DevFest-2026)
npm install  # Already done, but just to be sure
```

### 3.3 Start Frontend Development Server
```bash
# In a new terminal, in the root directory
npm start
```

You should see:
```
webpack compiled with ... warnings
Compiled successfully!
You can now view devfest2026 in the browser.
Local: http://localhost:3000
```

The app should open in your browser at `http://localhost:3000`

## 4. Test Authentication Flow

### 4.1 Register a New User
1. You should see the Registration page
2. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123`
   - Confirm Password: `TestPassword123`
3. Click "Sign up"
4. You should see: "Registration successful!"

**Note**: If email verification is enabled, you need to verify your email before login. Check spam folder.

### 4.2 Login
1. Click "Sign in" link
2. Enter your email and password
3. Click "Sign in"
4. You should be redirected to the Dashboard
5. You should see "Welcome, test@example.com!"

### 4.3 Logout
1. Click "Logout" button
2. You should be redirected to the login page

### 4.4 Test Protected Route
1. Try accessing `http://localhost:3000/dashboard` directly without logging in
2. You should be redirected to login page

## 5. Verify Backend-Frontend Communication

### 5.1 Check Token Passing
1. Open your browser's **Developer Tools** (F12)
2. Go to **Network** tab
3. Login to the app
4. Look at any request to `http://localhost:8000`
5. In the **Headers**, you should see: `Authorization: Bearer [your_token]`

This means the frontend is correctly passing the auth token to the backend!

## 6. Troubleshooting

### Backend won't start
```
Error: ModuleNotFoundError: No module named 'fastapi'
```
**Solution**: Make sure you activated the virtual environment
```bash
source backend/venv/bin/activate  # or venv\Scripts\activate on Windows
```

### Frontend can't connect to backend
```
Error: Cannot POST http://localhost:8000
```
**Solution**: Make sure backend is running on port 8000:
```bash
# In backend directory
uvicorn app.main:app --reload --port 8000
```

### Supabase connection errors
```
Error: Invalid API key or URL
```
**Solution**: Double-check your `.env` files have the correct Supabase credentials

### Email verification issues
If you're stuck waiting for email verification:
1. Go to Supabase Dashboard
2. Click **Authentication** → **Users**
3. Find your user and click the three dots
4. Select **Confirm user identity**

## 7. Next Steps

Once Phase 0 is working:

1. **Verify in Supabase**:
   - Go to Authentication → Users, you should see your test user
   - Go to SQL Editor and run: `SELECT * FROM profiles;`
   - You should see your user profile

2. **Commit your changes**:
   ```bash
   git status
   git add src/.env backend/.env
   git commit -m "Add environment variables (local development only)"
   ```

3. **Ready for Phase 1**: You're now ready to implement the ElevenLabs consultation feature!

## 8. Quick Reference

**Terminal Windows You'll Need:**
1. Backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload`
2. Frontend: `npm start`

**Key Files:**
- Backend config: `backend/app/config.py`
- Frontend auth: `src/contexts/AuthContext.js`
- Database schema: `supabase_schema.sql`
- Routes setup: `src/App.js`

**Useful URLs:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`
- Supabase Dashboard: `https://app.supabase.com`

## 9. Common Issues

### Register button not working
- Check browser console for errors (F12)
- Make sure Supabase URL and key are correct in `src/.env`
- Check that backend is running

### Can't login after registering
- If email verification is enabled, check your email (spam folder!)
- Go to Supabase → Authentication → Users and manually confirm the user
- Or disable email verification in Supabase → Authentication → Providers → Email

### Data not showing in Supabase
- Make sure the profile auto-creation trigger is working
- Go to Supabase → SQL Editor → Triggers, verify `on_auth_user_created` exists
- Check Supabase logs for errors

---

**You're now ready to move to Phase 1: ElevenLabs Consultations!** 🎉
