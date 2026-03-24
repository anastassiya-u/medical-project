# Complete Setup Guide
## Oracle vs. Critic Experiment Platform

**Estimated Setup Time:** 30-45 minutes
**Prerequisites:** Basic terminal knowledge, Supabase account

---

## 📋 Pre-Installation Checklist

- [ ] Node.js ≥18.0.0 installed
- [ ] npm ≥9.0.0 installed
- [ ] Git installed
- [ ] Supabase account created
- [ ] Text editor (VS Code recommended)

Verify installation:
```bash
node --version  # Should show v18.0.0 or higher
npm --version   # Should show 9.0.0 or higher
```

---

## Step 1: Project Setup (5 min)

### 1.1 Navigate to Project Directory

```bash
cd "/Users/anastassiya/Desktop/Demo project"
```

### 1.2 Install Dependencies

```bash
npm install
```

**Expected output:** ~100 packages installed in 2-3 minutes

---

## Step 2: Supabase Setup (15 min)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub/Google
4. Click "New Project"
5. Fill in:
   - **Name:** oracle-critic-experiment
   - **Database Password:** [Generate strong password - save it!]
   - **Region:** Choose closest to Kazakhstan (e.g., Asia Pacific)
6. Click "Create new project" (takes 2-3 min to provision)

### 2.2 Run Database Migration

1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Open `supabase/schema.sql` in your text editor
4. **Copy entire contents** (Cmd+A, Cmd+C)
5. **Paste into Supabase SQL Editor**
6. Click "Run" button (bottom right)

**Expected output:** "Success. No rows returned"

✅ **Verify tables created:**
- Go to **Table Editor** in left sidebar
- Should see: `users`, `sessions`, `case_interactions`, `evidence_exploration`, etc.

### 2.3 Get API Credentials

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** Long string starting with `eyJ...`

---

## Step 3: Environment Configuration (5 min)

### 3.1 Create Environment File

```bash
cp .env.example .env.local
```

### 3.2 Edit .env.local

Open `.env.local` in text editor and paste your Supabase credentials:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-long-anon-key-here...

# Application Settings
NEXT_PUBLIC_APP_NAME="Oracle vs. Critic Experiment"
NEXT_PUBLIC_TARGET_N_PER_GROUP=30
NEXT_PUBLIC_TOTAL_TARGET_N=120

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_SKIP_POST_TEST_DELAY=false  # Set true for testing only
```

**Important:** Replace placeholders with actual values from Step 2.3

---

## Step 4: Start Development Server (2 min)

### 4.1 Run Server

```bash
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Ready in 3.2s
```

### 4.2 Verify Installation

1. Open browser to [http://localhost:3000](http://localhost:3000)
2. Should see **Registration form** for experiment
3. Fill in test data:
   - Student ID: TEST001
   - Age: 25
   - Gender: Male
   - Medical School: Test University
   - Year: 3
   - Check consent box
4. Click "Begin Experiment"

✅ **Success indicators:**
- Redirects to Pre-Test phase
- Sees "Clinical Case" with patient information
- Console shows: `✅ Logger initialized...` (open Dev Tools: F12)

---

## Step 5: Verify Database Logging (5 min)

### 5.1 Check Data in Supabase

1. Go back to Supabase dashboard
2. Navigate to **Table Editor** → **users**
3. Should see 1 row with your test user (TEST001)
4. Check columns:
   - `paradigm`: oracle or critic (randomly assigned)
   - `accuracy_level`: high or calibrated
   - `randomization_seed`: random number

### 5.2 Complete One Test Case

1. In browser, submit a diagnosis for the first case
2. Return to Supabase → **Table Editor** → **case_interactions**
3. Should see 1 row with:
   - `user_final_diagnosis`: your answer
   - `timestamp_case_start`: when you started
   - `timestamp_final_decision`: when you submitted
   - `total_task_time_seconds`: time taken

✅ **If data appears:** Logging is working correctly!

---

## Step 6: Test Both Interfaces (10 min)

### 6.1 Test Oracle Interface

If your test user was assigned to `oracle` group:
- You should see **immediate AI recommendation** (blue gradient)
- All evidence shown at once
- No hypothesis input required

### 6.2 Test Critic Interface

If assigned to `critic` group:
- Must **enter diagnosis before seeing AI**
- See **contrastive evidence** (FOR and AGAINST)
- Click buttons to **reveal additional evidence** progressively

### 6.3 Switch Groups for Testing

**Option A: Create new user**
```bash
# Clear browser data
localStorage.clear()
# Refresh page (Cmd+R)
# Register with different ID: TEST002
```

**Option B: Manually change group in database**
1. Supabase → **Table Editor** → **users**
2. Click on your user row
3. Edit `paradigm` column: oracle ↔ critic
4. Click "Save"
5. Clear browser storage and re-login

---

## Step 7: Deploy to Production (Optional, 15 min)

### 7.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 7.2 Deploy

```bash
vercel --prod
```

**Follow prompts:**
1. "Set up and deploy?" → Yes
2. "Which scope?" → Your account
3. "Link to existing project?" → No
4. "Project name?" → oracle-critic-experiment
5. "In which directory?" → ./
6. "Auto-detected Next.js!" → Yes

**Deployment takes 2-3 minutes**

### 7.3 Set Environment Variables in Vercel

1. Go to [vercel.com](https://vercel.com) → Your project
2. Click **Settings** → **Environment Variables**
3. Add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your key
4. Click "Save"
5. Redeploy: **Deployments** → **...** → "Redeploy"

✅ **Live at:** `https://oracle-critic-experiment.vercel.app`

---

## 🔧 Troubleshooting

### Issue: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: Supabase connection fails

**Verify:**
```bash
# Check environment variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

**Should output your Supabase URL.** If "undefined":
- Ensure `.env.local` exists in project root
- Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: Cases not displaying

**Verify cases.json:**
```bash
node -e "const data = require('./src/data/cases.json'); console.log('Cases:', data.cases.length)"
```

**Should output:** "Cases: 25"

### Issue: "Session not found" on refresh

**Solution:**
```bash
# Check browser console (F12) for errors
# Clear localStorage and re-register
localStorage.clear()
location.reload()
```

---

## 📊 Testing Checklist

Before data collection, verify:

- [ ] Both interfaces work (Oracle and Critic)
- [ ] All 25 cases load correctly
- [ ] Pre-test, NFC, Intervention phases work
- [ ] Progressive reveal works in Critic interface
- [ ] Data logs to Supabase correctly
- [ ] Randomization assigns users to groups
- [ ] Session persists across page refreshes
- [ ] Post-test delay message appears after intervention
- [ ] Confidence ratings save correctly
- [ ] Evidence panel clicks are logged

**Pilot Test:** Run through full experiment with 3-5 users before launching

---

## 🔐 Security Checklist

Before production deployment:

- [ ] Change `NEXT_PUBLIC_SKIP_POST_TEST_DELAY` to `false`
- [ ] Change `NEXT_PUBLIC_ENABLE_DEBUG_MODE` to `false`
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Add rate limiting to prevent spam
- [ ] Review Supabase API usage limits
- [ ] Set up database backups (automatic in Supabase)

---

## 📞 Support

**Common Questions:**

**Q: How do I reset a participant's session?**
A: In Supabase, delete rows from `users`, `sessions`, and `case_interactions` tables for that user_id.

**Q: Can I change the number of cases?**
A: Yes, edit `cases.json`, but update `SessionOrchestrator.jsx` to reflect new counts.

**Q: How do I export data for analysis?**
A: Supabase → **Table Editor** → **case_interactions** → Click **...** → "Download as CSV"

**Q: Can I add more sensible foils?**
A: Yes, edit `cases.json` and add `foilDiagnosis` field to cases.

---

## ✅ Setup Complete!

You should now have:
- ✅ Local development server running
- ✅ Database configured with schema
- ✅ Logging working correctly
- ✅ Both Oracle and Critic interfaces tested
- ✅ Ready for pilot testing

**Next Steps:**
1. Pilot test with 5-10 participants
2. Review data quality in Supabase
3. Adjust based on feedback
4. Launch full study (N=120)

**Good luck with your research! 🎓**
