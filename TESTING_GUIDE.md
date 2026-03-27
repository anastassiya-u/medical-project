# 🧪 Testing Guide - Database & Console Verification

**Production URL:** https://demo-project-two-peach.vercel.app
**Date:** March 27, 2026

---

## 📋 Quick Test Checklist

Follow this step-by-step to verify everything works:

### Phase 1: Language Selector Test (2 min)

1. **Open production URL** in browser
2. **Open browser console:**
   - Chrome/Edge: `F12` or `Ctrl+Shift+J` (Mac: `Cmd+Option+J`)
   - Look for any **red errors**
3. **Test language selector:**
   - Should see big toggle buttons: 🇬🇧 English | 🇷🇺 Русский
   - Click English → interface should show English
   - Click Russian → interface should show Russian
   - **Check console** - any errors?

**✅ Expected:** No errors, smooth language switching

---

### Phase 2: Registration & Database Test (3 min)

1. **Fill registration form:**
   - Student ID: `TEST-USER-001` (use unique ID)
   - Age: `25`
   - Gender: Select any
   - Medical School: `Test University`
   - Year: Select any
   - Language: Choose Russian or English
   - Check consent box

2. **Check console before submit:**
   - Look for any warnings/errors

3. **Click "Begin Experiment"**

4. **Watch console carefully:**
   - Should see: `✅ Logger initialized for user...`
   - Should see: `🚀 Session started...`
   - Should NOT see: ❌ errors about Supabase
   - Should NOT see: ⚠️ warnings about missing environment variables

**✅ Expected console output:**
```
✅ Logger initialized for user abc123 (oracle / high)
🚀 Session started: pre_test (ID: xyz)
📝 Started case...
```

**❌ Bad signs to look for:**
- `❌ Failed to create case interaction`
- `⚠️ Supabase credentials not found`
- `TypeError: Cannot read property...`

---

### Phase 3: Pre-Test Case - Confidence Logging Test (3 min)

**Purpose:** Verify the fix for missing pre-test confidence data

1. **Read the clinical case** presented
2. **Enter a diagnosis** in the text field (any medical term)
3. **Rate confidence** (click any number 1-5)
4. **Watch console when you click submit:**
   - Should see: `⭐ Confidence rated: X/5 (pre)`
   - Should see: `✅ Final diagnosis submitted...`

5. **Check console for errors** - should see NO red errors

**✅ Expected console output:**
```
⭐ Confidence rated: 3/5 (pre)
✅ Final diagnosis submitted: "Your diagnosis" (15s total)
   Agreed with AI: false | Correct: true
```

---

### Phase 4: NFC Scale - 18 Items Test (3 min)

**Purpose:** Verify NFC scale shows all 18 questions and saves correctly

1. **Count the questions** - should be **18 total** (not 6!)
2. **Check progress bar** at top - shows "0 / 18 completed" (or in Russian)
3. **Answer all 18 questions** (click any rating for each)
4. **Watch console when progress reaches 18/18**
5. **Click "Continue to AI-Assisted Cases"**
6. **Watch console:**
   - Should see: `📊 NFC submitted: Total Score = XX` (where XX is between 18-90)
   - Should NOT see: `❌ Failed to submit NFC`

**✅ Expected console output:**
```
📊 NFC submitted: Total Score = 67
```

**❌ Bad signs:**
- Only 6 questions appear
- Score is 6-30 instead of 18-90
- Error: "Failed to submit NFC"

---

### Phase 5: Critic Interface - Translation & AI Test (5 min)

**Purpose:** Verify translations work and AI evaluation succeeds

1. **Check interface language:**
   - If Russian selected: Should see "Сначала введите ваш диагноз"
   - If English selected: Should see "Enter Your Diagnosis First"

2. **Enter a hypothesis:** `Pneumonia` (or any diagnosis)

3. **Rate pre-confidence** (click 1-5)

4. **Click "Submit My Hypothesis"** (or Russian equivalent)

5. **Watch console during AI evaluation:**
   - Should see: `🤖 Calling AWS Bedrock (GPT-OSS-20B): mode: ACCURATE...`
   - Should see loading spinner on screen
   - After 2-3 seconds, should see: `✅ AWS Bedrock Evaluation...`
   - Should NOT see: `❌ AWS Bedrock API Error`

6. **Verify dynamic evidence appears:**
   - Should see green box "SUPPORTS Your Hypothesis" (or Russian)
   - Should see red box "CHALLENGES Your Hypothesis" (or Russian)
   - Evidence should mention "Pneumonia" or your diagnosis
   - Should NOT be generic text

7. **Complete the case:**
   - Choose keep or revise diagnosis
   - Rate post-confidence
   - Submit final diagnosis

8. **Watch console for final save:**
   - Should see: `✅ Final diagnosis submitted...`

**✅ Expected console output:**
```
🤖 Calling AWS Bedrock (GPT-OSS-20B): {mode: "ACCURATE", hypothesis: "Pneumonia", correct: "..."}
✅ AWS Bedrock Evaluation: {hypothesis: "Pneumonia", isFoil: false, supporting: 3, challenging: 3}
💭 Hypothesis submitted: "Pneumonia" (12s)
⭐ Confidence rated: 4/5 (pre)
🤖 AI output viewed: "..." (CORRECT)
⭐ Confidence rated: 5/5 (post)
✅ Final diagnosis submitted: "Pneumonia" (45s total)
   Agreed with AI: true | Correct: true
```

**❌ Bad signs to look for:**
- `❌ AWS Bedrock API Error: Access Denied` → AWS credentials issue
- `Failed to parse AI response` → API returning wrong format
- Static evidence appears instead of dynamic
- Evidence doesn't mention your hypothesis

---

### Phase 6: Check Top Header (1 min)

**Purpose:** Verify accuracy percentage is hidden

1. **Look at the phase header** at top of page
2. **Should see ONLY:**
   - "Oracle" OR "Critic" (clean, simple)
   - Case number (e.g., "1 / 5")
   - Progress bar

3. **Should NOT see:**
   - ❌ "100% accuracy"
   - ❌ "70% accuracy"
   - ❌ Any percentage numbers

**✅ Expected:** Clean header showing only "Critic" or "Oracle"

---

## 🔍 Detailed Console Error Check

### Open Console and Filter

1. **Open browser console** (F12)
2. **Filter by level:**
   - Click "Errors" to show only errors
   - Click "Warnings" to show warnings

### Common Errors to Look For:

#### ✅ GOOD - These are OK:
```
⚠️  submitHypothesis called in Oracle mode (if in Oracle interface)
```

#### ❌ BAD - Report these:
```
❌ Failed to create case interaction: {...}
❌ Failed to submit NFC: {...}
❌ AWS Bedrock API Error: Access Denied
❌ TypeError: Cannot read property 'x' of undefined
❌ Supabase credentials not found
```

---

## 📊 Database Verification Queries

After testing, run these queries in Supabase dashboard to verify data saved:

### 1. Check User Registration

```sql
SELECT
  student_id,
  paradigm,
  accuracy_level,
  preferred_language,
  created_at
FROM users
WHERE student_id = 'TEST-USER-001'
ORDER BY created_at DESC
LIMIT 1;
```

**✅ Expected:** 1 row with your test user data

---

### 2. Check NFC Score

```sql
SELECT
  user_id,
  total_score,
  nfc_level,
  completed_at
FROM nfc_responses
WHERE user_id IN (
  SELECT id FROM users WHERE student_id = 'TEST-USER-001'
)
ORDER BY completed_at DESC
LIMIT 1;
```

**✅ Expected:**
- `total_score` between 18-90 (not 6-30!)
- `nfc_level` = 'low', 'medium', or 'high'
- All 18 question fields (q1-q18) should have values 1-5

---

### 3. Check Pre-Test Confidence (CRITICAL FIX)

```sql
SELECT
  case_id,
  user_hypothesis,
  user_final_diagnosis,
  user_confidence_pre,
  user_confidence_post,
  timestamp_case_start
FROM case_interactions
WHERE user_id IN (
  SELECT id FROM users WHERE student_id = 'TEST-USER-001'
)
AND user_confidence_pre IS NOT NULL
ORDER BY timestamp_case_start DESC
LIMIT 5;
```

**✅ Expected:**
- `user_confidence_pre` should be 1-5 (NOT NULL!)
- This was the bug we fixed - verify it's working

**❌ If NULL:** The confidence logging fix didn't work

---

### 4. Check AI Evaluation Data (Critic only)

```sql
SELECT
  case_id,
  user_hypothesis,
  ai_recommendation,
  user_agreed_with_ai,
  user_finally_correct,
  is_foil_case,
  timestamp_hypothesis_submitted,
  timestamp_ai_output_viewed
FROM case_interactions
WHERE user_id IN (
  SELECT id FROM users WHERE student_id = 'TEST-USER-001'
)
AND paradigm = 'critic'
ORDER BY timestamp_case_start DESC
LIMIT 5;
```

**✅ Expected:**
- `user_hypothesis` = what you typed (e.g., "Pneumonia")
- `timestamp_hypothesis_submitted` should be filled
- `timestamp_ai_output_viewed` should be filled
- All fields populated correctly

---

### 5. Check Session Logging

```sql
SELECT
  session_type,
  total_cases,
  completed_at,
  created_at
FROM sessions
WHERE user_id IN (
  SELECT id FROM users WHERE student_id = 'TEST-USER-001'
)
ORDER BY created_at DESC;
```

**✅ Expected:** Sessions created for each phase (pre_test, intervention, etc.)

---

## 🐛 Known Issues to Ignore

These are expected and not bugs:

1. **"submitHypothesis called in Oracle mode"** - Expected in Oracle interface
2. **npm vulnerabilities warning** - Not critical for research platform
3. **Middleware 26.7 kB** - Normal size

---

## 📝 Testing Report Template

Use this to report your findings:

```
## Test Results - [Date/Time]

### 1. Language Selector
- [ ] Displays correctly
- [ ] English works
- [ ] Russian works
- Errors: [none / list errors]

### 2. Registration
- [ ] Form submits successfully
- [ ] User created in database
- Console errors: [none / list errors]

### 3. Pre-Test Confidence
- [ ] Confidence rating appears
- [ ] Saves to database (user_confidence_pre NOT NULL)
- Console errors: [none / list errors]

### 4. NFC Scale
- [ ] Shows 18 questions (not 6)
- [ ] Progress bar works
- [ ] Score saved (18-90 range)
- Console errors: [none / list errors]

### 5. Critic Interface (if assigned)
- [ ] Hypothesis lock works
- [ ] Translations display correctly
- [ ] AI evaluation succeeds
- [ ] Dynamic evidence appears
- [ ] Evidence mentions my hypothesis
- Console errors: [none / list errors]

### 6. Header Display
- [ ] Shows only "Oracle" or "Critic"
- [ ] No percentage visible
- [ ] Clean display

### 7. Database Verification
- [ ] User registered
- [ ] NFC score saved (18-90)
- [ ] Pre-test confidence saved (NOT NULL)
- [ ] Case interactions logged
- [ ] Sessions created

### Console Errors Found:
[List any ❌ red errors here]

### Overall Status:
- [ ] All tests passed
- [ ] Issues found (see above)
```

---

## 🚀 Quick Test Script (5 minutes)

If you're short on time, do this minimal test:

1. **Open:** https://demo-project-two-peach.vercel.app
2. **Open console** (F12) and watch for red errors
3. **Register** with test user
4. **Complete 1 pre-test case** with confidence rating
5. **Complete NFC scale** (all 18 questions)
6. **If Critic assigned:** Submit 1 hypothesis and check AI evaluation
7. **Check console** - any ❌ errors?
8. **Check database** - run SQL queries above

**If no red errors and database has data → ✅ SUCCESS!**

---

## 📞 What to Report Back

Please tell me:

1. **Console errors?** (copy/paste any ❌ red errors)
2. **Language selector works?** (English/Russian switching)
3. **Header clean?** (shows only "Oracle"/"Critic", no percentage)
4. **NFC shows 18 questions?** (not 6)
5. **Pre-test confidence saves?** (check database query)
6. **AI evaluation works?** (if Critic group - dynamic evidence appears)

---

**Let's verify everything works!** 🎯
