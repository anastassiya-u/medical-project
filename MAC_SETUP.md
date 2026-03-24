# 🍎 MacBook (Apple Silicon) Setup Guide
## Oracle vs. Critic Experiment Platform

**System Detected:** arm64 (Apple Silicon - M1/M2/M3)
**Estimated Setup Time:** 20 minutes

---

## ✅ Pre-Flight Checklist

- [x] Supabase account connected
- [ ] Node.js installed (Apple Silicon native)
- [ ] Dependencies installed
- [ ] Database schema applied
- [ ] Environment variables configured
- [ ] Development server running

---

## Step 1: Install Node.js (Apple Silicon Native)

### Option A: Homebrew (Recommended)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (Apple Silicon native binary)
brew install node@20

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

### Option B: Official Installer

1. Visit [nodejs.org](https://nodejs.org/)
2. Download **LTS version** for **macOS (ARM64)**
3. Run the `.pkg` installer
4. Verify:
```bash
node --version
npm --version
```

---

## Step 2: Install Project Dependencies

```bash
# Navigate to project
cd "/Users/anastassiya/Desktop/Demo project"

# Install all dependencies
npm install

# Expected: ~100 packages in 2-3 minutes
```

### Apple Silicon Compatibility Check ✅

All dependencies in your `package.json` are Apple Silicon compatible:
- ✅ Next.js 14.2.0 - Native ARM64 support
- ✅ React 18.3.0 - Pure JavaScript (no native modules)
- ✅ Supabase JS - Pure JavaScript
- ✅ Tailwind CSS - Pure JavaScript
- ✅ TypeScript 5.5.0 - Native ARM64 binary
- ✅ Framer Motion - No native dependencies
- ✅ Recharts - Pure JavaScript

**No special configuration needed for Apple Silicon!**

---

## Step 3: Configure Supabase Environment

### 3.1 Get Your Supabase Credentials

1. Go to your Supabase dashboard: [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** (⚙️) → **API**
4. Copy:
   - **Project URL:** `https://xxxxx.supabase.co`
   - **anon public key:** `eyJ...` (long string)

### 3.2 Create Environment File

```bash
# Copy template
cp .env.example .env.local

# Open in TextEdit or nano
nano .env.local
```

### 3.3 Paste Your Credentials

Replace placeholders with your actual Supabase values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here

# Application Settings (keep these as-is)
NEXT_PUBLIC_APP_NAME="Oracle vs. Critic Experiment"
NEXT_PUBLIC_TARGET_N_PER_GROUP=30
NEXT_PUBLIC_TOTAL_TARGET_N=120

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_SKIP_POST_TEST_DELAY=false
```

**Save and exit:**
- If using `nano`: Press `Ctrl+X`, then `Y`, then `Enter`
- If using TextEdit: Save and close

---

## Step 4: Initialize Supabase Database

### 4.1 Open Supabase SQL Editor

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in left sidebar
4. Click **+ New query**

### 4.2 Copy & Execute Schema

**In Terminal:**
```bash
# Copy entire schema to clipboard
cat supabase/schema.sql | pbcopy
```

**In Supabase Dashboard:**
1. Paste schema into SQL Editor (Cmd+V)
2. Click **Run** button (bottom right)
3. Wait for "Success. No rows returned"

### 4.3 Verify Tables Created

Go to **Table Editor** (left sidebar), should see:

**Core Tables:**
- ✅ `users` - 10 columns (id, student_id, paradigm, accuracy_level, etc.)
- ✅ `sessions` - 6 columns (id, user_id, session_type, etc.)
- ✅ `case_interactions` - 25+ columns (timestamps, diagnoses, SDT metrics)
- ✅ `evidence_exploration` - Critic group partiality tracking
- ✅ `ui_events` - Granular event logs
- ✅ `nfc_responses` - Need for Cognition 18-item scale
- ✅ `likert_assessments` - Autonomy, trust, NASA-TLX
- ✅ `interview_transcripts` - Qualitative data

**Views (for analysis):**
- ✅ `overreliance_by_group` - % agreement with AI errors
- ✅ `learning_gain_by_group` - Post-test - pre-test accuracy
- ✅ `sdt_metrics_by_group` - Autonomy, competence metrics
- ✅ `randomization_balance` - Group distribution check

---

## Step 5: Verify Interface Integration

Run quick verification:

```bash
# Check component imports
grep -n "OracleInterface\|CriticInterface\|NoAIInterface" components/SessionOrchestrator.jsx
```

**Expected output:**
```
30:import OracleInterface from './OracleInterface';
31:import CriticInterface from './CriticInterface';
33:import NoAIInterface from './NoAIInterface';
```

✅ **All three interfaces correctly imported!**

### Verify Hypothesis Lock

```bash
# Check CriticInterface for hypothesis lock
grep -A5 "hypothesisSubmitted" components/CriticInterface.jsx | head -10
```

✅ **Hypothesis lock is active** - Users must submit diagnosis before seeing AI output.

---

## Step 6: Start Development Server

```bash
# Ensure you're in project directory
cd "/Users/anastassiya/Desktop/Demo project"

# Start Next.js dev server
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

✓ Compiled in 3.2s (528 modules)
```

**Server runs on:** [http://localhost:3000](http://localhost:3000)

---

## Step 7: Test Experimental Flow

### 7.1 Access Platform

Open Safari/Chrome:
```
http://localhost:3000
```

### 7.2 Registration Test

Fill in test participant:
```
Student ID: TEST001
Age: 25
Gender: Male
Medical School: Astana Medical University
Year of Study: 3
Language: Russian
✓ Check consent box
```

Click **"Begin Experiment"**

### 7.3 Verify Randomization

**Open Browser Console** (Option+Cmd+I):
```javascript
// Should see:
✅ Logger initialized for user [uuid] (oracle / high)
// OR
✅ Logger initialized for user [uuid] (critic / calibrated)
```

**Check Supabase:**
1. Dashboard → **Table Editor** → **users**
2. Should see 1 row with:
   - `student_id`: TEST001
   - `paradigm`: oracle or critic (randomly assigned)
   - `accuracy_level`: high or calibrated
   - `randomization_seed`: random number

### 7.4 Test Oracle Interface (if assigned)

**Look for:**
- ✅ Blue gradient header: "AI RECOMMENDATION"
- ✅ Diagnosis shown immediately (no input required)
- ✅ Unilateral explanation (only supporting evidence)
- ✅ All evidence visible at once
- ✅ "Agree" / "Disagree" buttons

### 7.5 Test Critic Interface (if assigned)

**Look for:**
- ✅ Purple gradient with "Enter Your Diagnosis First"
- ✅ **Hypothesis Lock Active:** Text input required before AI shows
- ✅ After submission: Contrastive evidence (FOR / AGAINST)
- ✅ Progressive reveal buttons: "Show Lab Results", "Show Vital Signs", etc.
- ✅ Confidence rating before and after AI

### 7.6 Complete One Case

1. Enter/select diagnosis
2. Rate confidence
3. Click "Submit Final Diagnosis"
4. Should advance to next case

**Verify logging in Supabase:**
- Dashboard → **Table Editor** → **case_interactions**
- Should see 1 row with timestamps and your diagnosis

---

## 🎯 Success Criteria

Before proceeding to pilot testing, verify:

- [ ] Development server runs without errors
- [ ] Registration creates user in Supabase
- [ ] User assigned to one of 4 groups (paradigm × accuracy)
- [ ] Oracle interface shows immediate recommendation
- [ ] Critic interface blocks AI until hypothesis submitted
- [ ] Progressive reveal works (Critic only)
- [ ] All interactions log to Supabase
- [ ] Page refresh preserves session state
- [ ] Can complete full case without errors

---

## 🐛 Troubleshooting (Mac-Specific)

### Issue: "command not found: node"

**Solution:**
```bash
# Homebrew installation path issue
echo 'export PATH="/opt/homebrew/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version
```

### Issue: "Cannot find module '@supabase/supabase-js'"

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Issue: "Module parse failed" errors

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Environment variables not loading

**Verify:**
```bash
# Check file exists
ls -la .env.local

# Print first line (should show NEXT_PUBLIC_SUPABASE_URL)
head -1 .env.local
```

**If missing:**
```bash
cp .env.example .env.local
nano .env.local  # Add your credentials
```

### Issue: Supabase connection timeout

**Check:**
1. Verify URL in .env.local (no trailing slash)
2. Check Supabase project is not paused (dashboard)
3. Test connection:
```bash
curl https://your-project-id.supabase.co/rest/v1/
# Should return: {"message":"Missing Authorization header"}
```

---

## 📊 Quick Reference Commands

### Development
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Run production build
npm run lint         # Check code quality
```

### Database
```bash
# Export schema (if you make changes)
# In Supabase dashboard: SQL Editor → Export

# Import schema
# Copy schema.sql → Paste in SQL Editor → Run
```

### Data Export (for analysis)
```bash
# In Supabase dashboard:
# Table Editor → case_interactions → ... → Download as CSV
```

### Clear Test Data
```bash
# In Supabase SQL Editor:
DELETE FROM case_interactions WHERE user_id IN (
  SELECT id FROM users WHERE student_id LIKE 'TEST%'
);
DELETE FROM sessions WHERE user_id IN (
  SELECT id FROM users WHERE student_id LIKE 'TEST%'
);
DELETE FROM users WHERE student_id LIKE 'TEST%';
```

---

## 🚀 Next Steps

Once setup is complete:

1. **Pilot Test** (N=3-5):
   - Test both Oracle and Critic flows
   - Verify data quality in Supabase
   - Check foil distribution (should see some AI errors in 70% group)

2. **Validate Logging**:
   - Check all timestamps are captured
   - Verify evidence exploration logs (Critic)
   - Ensure overreliance detection works

3. **IRB Preparation**:
   - Document informed consent process
   - Prepare data privacy statement
   - Write participant debriefing script

4. **Launch Data Collection**:
   - Target: N=120 (30 per group)
   - Monitor randomization balance daily
   - Weekly Supabase backups

---

## 📞 Quick Support

**Common Questions:**

**Q: How do I switch a test user's group?**
A: In Supabase, edit the `paradigm` or `accuracy_level` in users table. Then clear browser localStorage.

**Q: Can I test both interfaces with one account?**
A: No (by design - group locking). Create separate test accounts (TEST001, TEST002, etc.).

**Q: How do I see which cases have foils?**
A: Check `src/data/cases.json` → `"isFoil": true` marks sensible foils.

**Q: Development server is slow on Mac**
A: First build is always slower. Subsequent hot reloads are fast. Consider closing other apps.

---

## ✅ Setup Complete!

You're ready to test the Oracle vs. Critic experiment platform.

**Start experimenting:**
```bash
npm run dev
open http://localhost:3000
```

---

**Last Updated:** March 24, 2026
**Platform Version:** 1.0.0
**Optimized for:** Apple Silicon (M1/M2/M3)
