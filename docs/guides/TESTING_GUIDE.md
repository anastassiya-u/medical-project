# ✅ Platform Testing Checklist
## Quick Verification Guide

**Platform:** https://demo-project-two-peach.vercel.app/

---

## 🎯 Test 1: Basic Access (5 minutes)

### Step 1: Homepage Loads
- [ ] Open https://demo-project-two-peach.vercel.app/
- [ ] Page loads without errors
- [ ] See "Medical AI Research" header
- [ ] See registration form

**Expected:** Registration form with fields for Student ID, Age, Gender, Medical School, Year of Study, Language

---

## 🎯 Test 2: Registration Flow (5 minutes)

### Step 2: Register Test User
Fill in the form:
- [ ] **First Name:** Test
- [ ] **Last Name:** User
- [ ] **Age:** 25
- [ ] **Gender:** Male
- [ ] **Medical School:** Astana Medical University
- [ ] **Year of Study:** 3
- [ ] **Language:** Russian
- [ ] ✓ Check the informed consent checkbox
- [ ] Click **"Begin Experiment"**

**Expected:** Redirected to Pre-Test phase with first clinical case

---

## 🎯 Test 3: Check Your Assignment (2 minutes)

### Step 3: Open Browser Console
- [ ] Press **Cmd+Option+I** (Mac) or **F12** (Windows)
- [ ] Click **Console** tab
- [ ] Look for message:
  ```
  ✅ Logger initialized for user [uuid] (oracle/critic / high/calibrated)
  ```

**What it means:**
- **oracle** → You got Oracle Interface (Blue, directive AI)
- **critic** → You got Critic Interface (Purple, evaluative AI)
- **high** → AI will be 100% accurate
- **calibrated** → AI will make sensible errors 30% of time

---

## 🎯 Test 4A: If You Got ORACLE Interface (Blue)

### Visual Check
- [ ] Interface has **blue gradient** header
- [ ] See **"🤖 AI RECOMMENDATION"** section immediately
- [ ] AI diagnosis is shown in large bold text
- [ ] See **"✓ Why This Diagnosis?"** section
- [ ] All evidence shown at once (no reveal buttons)

### Interaction Test
- [ ] Read the clinical case
- [ ] AI recommendation is visible without any action
- [ ] Click **"Agree"** or **"Disagree"** button
- [ ] Rate confidence (1-5)
- [ ] Click **"Submit Final Diagnosis"**

**Expected Behavior:**
- No need to enter your own diagnosis first
- AI shows answer immediately
- Only supporting evidence displayed

---

## 🎯 Test 4B: If You Got CRITIC Interface (Purple)

### Visual Check
- [ ] Interface has **purple gradient** accents
- [ ] See **"💭 Enter Your Diagnosis First"** section
- [ ] AI output is **HIDDEN/BLOCKED**
- [ ] Text area for entering YOUR diagnosis
- [ ] Confidence rating before submitting

### Hypothesis Lock Test
- [ ] Try scrolling down → Should NOT see AI recommendation yet
- [ ] Enter a diagnosis (e.g., "Pneumonia")
- [ ] Rate your confidence (1-5)
- [ ] Click **"Submit My Hypothesis"**

**Expected Behavior:**
- AI output only appears AFTER you submit
- Forces you to think independently first

### After Hypothesis Submission
- [ ] See **"You diagnosed: [your diagnosis]"**
- [ ] See two columns:
  - **"✓ SUPPORTS Your Hypothesis"** (green)
  - **"✗ CHALLENGES Your Hypothesis"** (red)
- [ ] See **4 reveal buttons:**
  - 🩺 Show Symptom Analysis
  - 🧪 Show Lab Results
  - 📈 Show Vital Signs History
  - 🔬 Compare Differential Diagnosis

### Progressive Reveal Test
- [ ] Click **"🧪 Show Lab Results"** button
- [ ] Panel expands with lab data
- [ ] Click **"🔬 Compare Differential Diagnosis"**
- [ ] See table with alternative diagnoses

**Expected Behavior:**
- Buttons change color when clicked
- Evidence panels appear below buttons
- Content is hidden until you click

### Final Decision Test
- [ ] Choose **"Keep My Diagnosis"** or **"Revise Diagnosis"**
- [ ] Rate final confidence (1-5)
- [ ] Click **"Submit Final Diagnosis"**

---

## 🎯 Test 5: Verify Data Logging (5 minutes)

### Step 5: Check Supabase Database
1. [ ] Go to: https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/editor
2. [ ] Login to Supabase
3. [ ] Click **Table Editor** in sidebar

### Check Users Table
- [ ] Click **users** table
- [ ] Should see 1 row:
  - `student_id`: TEST001
  - `paradigm`: oracle OR critic
  - `accuracy_level`: high OR calibrated
  - `created_at`: Recent timestamp

### Check Case Interactions Table
- [ ] Click **case_interactions** table
- [ ] Should see 1 row:
  - `case_id`: PRE_001 (or similar)
  - `user_final_diagnosis`: Your submitted diagnosis
  - `timestamp_case_start`: When case started
  - `timestamp_final_decision`: When you submitted
  - `paradigm`: Matches your assignment

**Expected:** All timestamps captured, no NULL values in required fields

---

## 🎯 Test 6: Test the OTHER Interface (10 minutes)

### Step 6: Clear Session and Re-register
1. [ ] Open browser console (Cmd+Option+I)
2. [ ] Type: `localStorage.clear()` and press Enter
3. [ ] Refresh page (Cmd+R)
4. [ ] Register with **NEW student ID:** TEST002
5. [ ] Complete registration

**Expected:** Randomly assigned to different group (maybe same, maybe different)

### If You Get Different Interface This Time
- [ ] Repeat Test 4A or 4B for the new interface
- [ ] Compare the two experiences:
  - Oracle: Directive, all evidence at once, blue
  - Critic: Evaluative, progressive reveal, purple

---

## 🎯 Test 7: Multi-Phase Flow (15 minutes)

### Phase 1: Pre-Test (4 cases, no AI)
- [ ] Complete first case independently
- [ ] See **"Next Case"** button after submission
- [ ] Progress through 4 pre-test cases
- [ ] No AI assistance shown

**Expected:** Baseline diagnostic accuracy measured

### Phase 2: Intervention (10 cases with AI)
- [ ] Now AI assistance appears (Oracle or Critic style)
- [ ] Interface matches your assignment
- [ ] Complete 10 cases with AI help

**Expected:** This is the main experimental manipulation

### Phase 3: NFC Assessment (15 questions)
- [ ] See Need for Cognition scale
- [ ] Answer 15 questions (Likert 1-5)
- [ ] Questions about thinking preferences

**Expected:** Measures analytical thinking tendency

---

## 🎯 Test 8: Foil Error Detection (Advanced)

### If You're in "Calibrated" Accuracy Group
- [ ] Look for cases where AI recommendation seems wrong
- [ ] Check if evidence contradicts AI's diagnosis
- [ ] In Critic: Use differential comparison table to verify

**Example Foil:**
- **Case:** Patient with cough and fever
- **AI Says:** Acute Bronchitis
- **Key Evidence:** Chest X-ray shows infiltrate
- **Correct Diagnosis:** Pneumonia (infiltrate = pneumonia, not bronchitis)

**Test Question:** Can you catch this error?
- **Oracle Users:** Harder to detect (only supporting evidence shown)
- **Critic Users:** Easier to detect (differential table reveals mismatch)

---

## 🎯 Test 9: Randomization Balance (Optional)

### Check Group Distribution
1. [ ] Go to Supabase SQL Editor
2. [ ] Run query:
```sql
SELECT * FROM randomization_balance;
```

**Expected Output:**
```
paradigm | accuracy_level | n_users | percent_of_total
---------|----------------|---------|------------------
oracle   | high           |    X    |       ~25%
oracle   | calibrated     |    X    |       ~25%
critic   | high           |    X    |       ~25%
critic   | calibrated     |    X    |       ~25%
```

With N=2 test users, distribution will be uneven. With N=120 real participants, should approach 25% each.

---

## 🎯 Test 10: Error Handling (5 minutes)

### Test Invalid Inputs
- [ ] Try registering without checking consent → Should block submission
- [ ] Try submitting diagnosis without confidence rating → Should show alert
- [ ] (Oracle) Try submitting without choosing Agree/Disagree → Should block
- [ ] (Critic) Try submitting hypothesis without text → Should show alert

**Expected:** Form validation prevents invalid submissions

---

## ✅ SUCCESS CRITERIA

Your platform is working correctly if:

### ✅ Deployment
- [x] Homepage loads at https://demo-project-two-peach.vercel.app/
- [x] No console errors in browser DevTools
- [x] Environment variables configured correctly

### ✅ User Flow
- [ ] Registration form works
- [ ] User assigned to 1 of 4 groups randomly
- [ ] Interface matches assigned paradigm (Oracle or Critic)
- [ ] Can complete at least 1 case successfully

### ✅ Data Logging
- [ ] User appears in `users` table
- [ ] Case interaction logged in `case_interactions` table
- [ ] Timestamps captured correctly
- [ ] Paradigm and accuracy_level stored

### ✅ Interface Fidelity
- [ ] Oracle: Blue, immediate AI, unilateral evidence
- [ ] Critic: Purple, hypothesis lock, contrastive evidence + progressive reveal

### ✅ Error Detection (Calibrated Groups Only)
- [ ] Foil cases present (AI makes sensible errors)
- [ ] Critic users can detect errors via verification
- [ ] Oracle users struggle to detect errors (only supporting evidence)

---

## 🐛 Common Issues & Fixes

### Issue: "Loading experiment..." never finishes
**Fix:** Check browser console for errors. Verify Supabase credentials in Vercel Dashboard.

### Issue: Can't submit diagnosis
**Fix:** Ensure confidence rating is selected. Check console for validation errors.

### Issue: Interface doesn't match assignment
**Fix:** Clear localStorage and re-register. Check users table for correct paradigm value.

### Issue: No data in Supabase
**Fix:** Verify environment variables include SUPABASE_URL and ANON_KEY. Check network tab for API calls.

### Issue: Both interfaces look the same
**Fix:** Verify randomization is working. Check `paradigm` field in users table. Clear cache and retry.

---

## 📊 Testing Report Template

After testing, note:

**✅ Working:**
- [ ] Deployment and access
- [ ] Registration flow
- [ ] Oracle interface
- [ ] Critic interface
- [ ] Data logging
- [ ] Randomization

**⚠️ Issues Found:**
- Issue 1: [Description]
- Issue 2: [Description]

**🎯 Overreliance Test (Manual):**
- [ ] Oracle users agreed with foil error: __% of time
- [ ] Critic users detected foil error: __% of time

---

**Platform Version:** 1.0.0
**Testing Date:** March 24, 2026
**Status:** Ready for pilot testing (N=5-10 users)
