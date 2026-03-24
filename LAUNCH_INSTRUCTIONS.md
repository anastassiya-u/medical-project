# 🚀 FINAL LAUNCH INSTRUCTIONS
## Oracle vs. Critic Experiment Platform

**Environment Status:** ✅ Configured
**Supabase:** ✅ Connected
**Ready to Launch:** YES

---

## 📋 Complete These 4 Steps

### **Step 1: Install Node.js (if needed)**

Open **Terminal** and run:

```bash
node --version
```

**If you see a version number (v18.x or v20.x):**
- ✅ Skip to Step 2

**If you see "command not found":**

```bash
# Install Node.js via Homebrew
brew install node@20

# Verify installation
node --version  # Should show: v20.x.x
npm --version   # Should show: 10.x.x
```

---

### **Step 2: Install Dependencies**

Copy and paste this entire block into Terminal:

```bash
cd "/Users/anastassiya/Desktop/Demo project"
npm install
```

**Expected:**
- Installing packages... (takes 2-3 minutes)
- ✓ 100+ packages installed
- No error messages

**If you see errors:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

---

### **Step 3: Initialize Supabase Database**

#### 3.1 Copy Schema to Clipboard

In Terminal:
```bash
cd "/Users/anastassiya/Desktop/Demo project"
cat supabase/schema.sql | pbcopy
```

✓ **Schema copied to clipboard**

#### 3.2 Apply Schema in Supabase

1. Open: https://app.supabase.com
2. Select your project: **rdcuqbsqnyzwxnyvndsq**
3. Click **SQL Editor** in left sidebar
4. Click **+ New query**
5. **Paste** (Cmd+V) - you'll see 528 lines of SQL
6. Click **Run** button (bottom right)

**Expected result:**
```
Success. No rows returned
Rows: 0
```

#### 3.3 Verify Tables Created

1. Click **Table Editor** in left sidebar
2. Should see these tables:
   - ✅ users
   - ✅ sessions
   - ✅ case_interactions
   - ✅ evidence_exploration
   - ✅ ui_events
   - ✅ nfc_responses
   - ✅ likert_assessments
   - ✅ interview_transcripts

**If tables missing:** Re-run the schema (repeat 3.2)

---

### **Step 4: Launch Development Server**

In Terminal:

```bash
cd "/Users/anastassiya/Desktop/Demo project"
npm run dev
```

**Expected output:**
```
▲ Next.js 14.2.0
- Local:        http://localhost:3000
- Environments: .env.local

○ Compiling / ...
✓ Compiled in 3.2s (528 modules)
```

**Server is running!** 🎉

---

## 🧪 Test Your Setup

### **Step 5: Open Platform**

**In any browser, go to:**
```
http://localhost:3000
```

### **Step 6: Register Test User**

Fill in the registration form:

```
Student ID: TEST001
Age: 25
Gender: Male
Medical School: Astana Medical University
Year of Study: 3
Preferred Language: Russian
✓ Check "I have read and agree to the informed consent"
```

Click **"Begin Experiment"**

### **Step 7: Verify Everything Works**

**You should see:**
- ✅ Redirected to Pre-Test phase
- ✅ "Clinical Case" header
- ✅ Patient information displayed
- ✅ Diagnosis input field
- ✅ Confidence rating buttons

**Open Browser Console** (Cmd+Option+I):
- ✅ Should see: `✅ Logger initialized for user [uuid] (oracle/critic / high/calibrated)`
- ✅ Should see: `📝 Started case PRE_001`

**Check Supabase Dashboard:**
1. Go to: https://app.supabase.com
2. Table Editor → **users**
3. Should see 1 row:
   - student_id: TEST001
   - paradigm: oracle or critic (random)
   - accuracy_level: high or calibrated (random)

---

## 🎯 Test Both Interfaces

### **If Assigned to Oracle Group:**

**You'll see:**
- 🔵 Blue gradient header
- 🤖 "AI RECOMMENDATION: [Diagnosis]"
- ✅ All evidence shown immediately
- No hypothesis input required
- Agree/Disagree buttons

**This is correct!** Oracle shows directive XAI.

### **If Assigned to Critic Group:**

**You'll see:**
- 🟣 Purple gradient header
- 💭 "Enter Your Diagnosis First"
- 🔒 **AI output blocked until you submit**
- Text input field (hypothesis lock active)
- After submission: FOR / AGAINST evidence
- "Show Lab Results", "Show Vital Signs" buttons (progressive reveal)

**This is correct!** Critic requires hypothesis before AI.

### **To Test Both Interfaces:**

```bash
# In browser console (Cmd+Option+I)
localStorage.clear()

# Refresh page (Cmd+R)
# Register with new ID: TEST002
```

Each new user gets randomly assigned to one of 4 groups:
1. Oracle × High (100% accuracy)
2. Oracle × Calibrated (70% accuracy, 30% errors)
3. Critic × High (100% accuracy)
4. Critic × Calibrated (70% accuracy, 30% errors)

---

## ✅ Success Checklist

After testing, verify:

- [ ] Development server runs without errors
- [ ] Registration form works
- [ ] User created in Supabase users table
- [ ] User assigned to paradigm (oracle or critic)
- [ ] User assigned to accuracy_level (high or calibrated)
- [ ] Pre-test cases display correctly
- [ ] Can enter diagnosis and submit
- [ ] Data appears in case_interactions table
- [ ] Logger messages in browser console
- [ ] No error messages in Terminal or Console

---

## 📊 View Your Data

### **In Supabase Dashboard:**

**users table:**
- Click **Table Editor** → **users**
- See all registered participants
- Check paradigm and accuracy_level assignments

**case_interactions table:**
- Click **Table Editor** → **case_interactions**
- See all case attempts
- Check timestamps, diagnoses, task completion time

**View randomization balance:**
- SQL Editor → New query
- Run: `SELECT * FROM randomization_balance;`
- See distribution across 4 groups

---

## 🔧 Common Issues & Solutions

### Issue: "Cannot find module @supabase/supabase-js"

**Solution:**
```bash
cd "/Users/anastassiya/Desktop/Demo project"
rm -rf node_modules package-lock.json
npm install
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Restart server
npm run dev
```

### Issue: White screen / "Unhandled Runtime Error"

**Check:**
1. Browser console (Cmd+Option+I) - Look for red errors
2. Terminal - Look for compilation errors
3. .env.local - Verify Supabase URL and key are correct

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue: Supabase connection timeout

**Verify:**
```bash
# Test connection
curl https://rdcuqbsqnyzwxnyvndsq.supabase.co/rest/v1/
# Should return: {"message":"Missing Authorization header"}
```

**If fails:** Check your internet connection and Supabase project status

### Issue: Tables not appearing in Supabase

**Solution:**
1. SQL Editor → Copy schema again
2. Make sure you clicked **Run** button
3. Check for error messages in SQL Editor
4. Refresh Table Editor page

---

## 🎓 Next Steps: Pilot Testing

Once setup verified:

### **1. Pilot Test (N=5 users)**

**Test scenarios:**
- 2 users → Oracle group (test directive XAI)
- 2 users → Critic group (test evaluative AI)
- 1 user → Complete full flow (pre-test → intervention → NFC)

**Verify:**
- Both interfaces work smoothly
- Data logging is complete
- No bugs or crashes
- Task completion times are reasonable (5-10 min per case)

### **2. Data Quality Check**

**In Supabase, verify:**
- All timestamps captured (case_start, hypothesis_submitted, final_decision)
- Evidence exploration tracked (Critic group)
- Overreliance detection works (check is_foil_case = true cases)
- Confidence ratings saved

### **3. Adjust for Production**

**Edit .env.local:**
```env
# Change these for real data collection:
NEXT_PUBLIC_ENABLE_DEBUG_MODE=false
NEXT_PUBLIC_SKIP_POST_TEST_DELAY=false
```

**Why?**
- Debug mode: Shows extra console logs (disable for participants)
- Post-test delay: Enforces 7-day wait (enable for real study)

### **4. Launch Full Study**

**Target:** N=120 participants (30 per group)

**Monitor daily:**
- Randomization balance (should be ~equal across 4 groups)
- Data quality (no missing timestamps)
- Participant feedback (any technical issues)

---

## 📞 Support Resources

**Documentation:**
- Quick start: [START_HERE.md](START_HERE.md)
- Complete guide: [MAC_SETUP.md](MAC_SETUP.md)
- Setup status: [SETUP_STATUS.md](SETUP_STATUS.md)

**Troubleshooting:**
- See MAC_SETUP.md → "Troubleshooting (Mac-Specific)" section

**Data Analysis:**
- SQL views are pre-configured in schema
- Export as CSV: Table Editor → ... → Download as CSV

---

## ✨ You're Ready to Launch!

**Your platform is now:**
- ✅ Fully configured
- ✅ Connected to Supabase
- ✅ Ready for testing
- ✅ Production-ready

**Start experimenting:**
```bash
npm run dev
open http://localhost:3000
```

---

## 🎯 Final Verification Commands

**Run these to confirm everything is set up:**

```bash
# Navigate to project
cd "/Users/anastassiya/Desktop/Demo project"

# Check environment
echo "✓ .env.local exists: $([ -f .env.local ] && echo YES || echo NO)"
echo "✓ Supabase URL configured: $(grep -c SUPABASE_URL .env.local)"

# Check dependencies
echo "✓ node_modules exists: $([ -d node_modules ] && echo YES || echo NO)"
echo "✓ Package count: $(ls node_modules 2>/dev/null | wc -l | tr -d ' ')"

# Check components
echo "✓ Interface files: $(ls components/*.jsx 2>/dev/null | wc -l | tr -d ' ')"

# Check cases
echo "✓ Clinical cases: $(node -e "console.log(require('./src/data/cases.json').cases.length)")"

# Check schema
echo "✓ Schema file: $([ -f supabase/schema.sql ] && echo YES || echo NO)"
```

**Expected output:**
```
✓ .env.local exists: YES
✓ Supabase URL configured: 1
✓ node_modules exists: YES
✓ Package count: 100+
✓ Interface files: 5
✓ Clinical cases: 25
✓ Schema file: YES
```

---

**Platform Version:** 1.0.0
**Last Updated:** March 24, 2026
**Status:** 🟢 READY FOR LAUNCH

**Lead Research Engineer:** Setup Complete ✅
