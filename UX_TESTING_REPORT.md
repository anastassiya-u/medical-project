# UX Testing Report: Oracle vs. Critic Platform
## Test Date: 2026-03-26

---

## 🔴 CRITICAL ISSUES (Must Fix Before Pilot)

### 1. **DATA LOSS: Case Interactions Not Saving to Database**

**Severity:** CRITICAL - All primary research data is being lost

**Evidence:**
- Database status:
  - ✅ `users` table: 1 record (TEST001)
  - ✅ `sessions` table: 2 records (pre_test, intervention completed)
  - ✅ `ui_events` table: 92 events logged successfully
  - ✅ `evidence_exploration` table: 4 records
  - ❌ `case_interactions` table: **0 records** (EMPTY)

**Impact:**
- No case-level data is being saved
- Cannot measure:
  - Overreliance rates (primary outcome)
  - Task completion times
  - Hypothesis accuracy
  - Agreement with AI
  - Learning gains

**Root Cause Analysis:**
1. `logger.startCase()` tries to INSERT into `case_interactions` with required NOT NULL fields:
   - `ai_recommendation` (NOT NULL) - set to empty string initially
   - `correct_diagnosis` (NOT NULL) - set to empty string initially
   - `user_final_diagnosis` (NOT NULL) - set to empty string initially
   - `timestamp_final_decision` (NOT NULL) - not set on insert

2. **The insert is likely failing** because `timestamp_final_decision` is required but not provided during case start

3. Error handling exists (line 124-126 in logger.js) but errors only log to console, not visible to researchers

**Fix Required:**
```javascript
// In logger.js, line 106-120, change:
timestamp_case_start: new Date(state.caseStartTime).toISOString(),
timestamp_final_decision: new Date(state.caseStartTime).toISOString(), // ADD THIS - will update later
ai_correctness: false,
is_foil_case: false,
ai_recommendation: 'TBD', // Change from empty string
correct_diagnosis: 'TBD', // Change from empty string
user_final_diagnosis: 'TBD', // Change from empty string
```

**Verification Steps:**
1. Check browser console for "❌ Failed to create case interaction" errors
2. Test case submission and verify `case_interactions` table receives records
3. Run full intervention phase and confirm all 15 cases are logged

---

### 2. **BUG: Hypothesis Revision Handler Firing Excessively**

**Severity:** HIGH - Corrupts data quality

**Evidence:**
- UI events show 84 `hypothesis_revised` events
- Many duplicates within milliseconds:
  - `14:00:24.139` - Foreign Body Aspiration
  - `14:00:24.309` - Foreign Body Aspiration (170ms later)
  - `14:00:24.623` - Foreign Body Aspiration (314ms later)
  - `14:00:24.796` - Foreign Body Aspiration (173ms later)
  - `14:00:24.856` - Foreign Body Aspiration (60ms later)

**Impact:**
- Inflates revision counts (makes it look like users are constantly changing minds)
- Corrupts SDT autonomy metrics
- Database bloat (unnecessary event records)

**Root Cause:**
- Likely caused by `onChange` event on textarea firing repeatedly
- Handler in [CriticInterface.jsx:100-104](components/CriticInterface.jsx#L100-L104) triggers on every character typed

**Fix Required:**
```javascript
// Add debouncing or only log when user clicks "Submit Final Diagnosis"
// Don't log revision on every text change
```

---

### 3. **Student ID Field - No Validation or Guidance**

**Severity:** MEDIUM - User confusion, data quality issues

**Current State:**
- Free-text input, placeholder: `"e.g., MED2024-001"`
- No format validation
- No duplicate checking (will fail at DB insert with generic error)
- No guidance on what format to use

**Student Confusion Points:**
1. **"What ID should I use?"**
   - University student ID?
   - A code given by researchers?
   - Make up my own?

2. **No immediate feedback on duplicates**
   - User enters ID, fills out form, clicks submit
   - Gets generic error if duplicate
   - Has to start over

3. **Inconsistent format risks:**
   - Some students: `"MED2024-001"`
   - Others: `"med-2024-1"`, `"MED_001"`, `"student001"`
   - Makes data analysis harder

**Fix Required:**
1. Add clear instruction text:
   ```
   "Enter your university student ID or the research ID provided by your instructor"
   ```

2. Add format validation:
   ```javascript
   // Example: Enforce pattern like MED2024-XXX
   const validateStudentId = (id) => {
     return /^[A-Z]{3}20\d{2}-\d{3}$/.test(id);
   };
   ```

3. Add duplicate check BEFORE form submission:
   ```javascript
   const checkDuplicate = async (studentId) => {
     const { data } = await supabase
       .from('users')
       .select('student_id')
       .eq('student_id', studentId)
       .single();

     return !!data; // Returns true if exists
   };
   ```

4. Add real-time feedback:
   - ✅ Green checkmark when ID is valid and available
   - ❌ Red X when ID already exists
   - ⚠️ Yellow warning when format is invalid

---

## ⚠️ MODERATE ISSUES (Usability Friction)

### 4. **No Visual Feedback While Cases Load**

**Issue:** Home page shows "Loading experiment..." but no progress indicator

**Impact:**
- Students don't know if system is working or frozen
- May refresh page prematurely, losing session

**Fix:** Add spinner or progress bar

---

### 5. **Confidence Rating Labels Unclear**

**Current:** "1 = Not confident • 5 = Very confident"

**Issue:** Students may interpret differently:
- Is 3 "neutral" or "somewhat confident"?
- Medical education typically uses: "Very Low / Low / Moderate / High / Very High"

**Fix:** Add verbal labels to each number:
```
1 (Very Low) - 2 (Low) - 3 (Moderate) - 4 (High) - 5 (Very High)
```

---

### 6. **No Progress Indicator During Intervention Phase**

**Issue:** Students see "Case 1 of 15" but no visual progress bar

**Impact:**
- Can't gauge how much time remains
- May feel overwhelming (15 cases seems like a lot)

**Fix:** Add progress bar:
```
[==========>               ] 33% Complete (5 of 15 cases)
```

---

### 7. **Hypothesis Lock Explanation Could Be Clearer**

**Current Text:**
> "Before viewing the AI's analysis, formulate your own hypothesis based on the clinical presentation."

**Issue:** Students might think:
- "Why can't I just see what the AI thinks first?"
- "Is this testing me or helping me?"
- Cultural context: Kazakhstan's Semashko legacy = students expect to be told answer

**Fix:** Add rationale:
```
"🎯 Why enter your diagnosis first?
Research shows that forming your own hypothesis before seeing AI recommendations
helps you learn better and avoid blindly accepting AI suggestions."
```

---

### 8. **Evidence Panel Buttons Don't Show "Opened" State Clearly**

**Issue:** After clicking "Show Lab Results", button doesn't clearly indicate panel is open

**Impact:**
- Students may click multiple times (contributing to event spam)
- Unclear if they already viewed that evidence

**Fix:** Change button state when open:
- Closed: `📊 Show Lab Results`
- Open: `✅ Lab Results (Click to Hide)`

---

## ✅ MINOR ISSUES (Polish & Accessibility)

### 9. **No Keyboard Shortcuts**

Students using keyboard navigation can't:
- Press Enter to submit hypothesis
- Use Tab to navigate confidence ratings
- Use arrow keys to change confidence

**Fix:** Add keyboard handlers

---

### 10. **Mobile Responsiveness Not Tested**

Cases show tables and multiple columns - may not work on mobile devices

**Risk:** If students try to complete on phones (unlikely but possible), layout will break

---

### 11. **No Session Timeout Warning**

If student leaves page open for hours, session may expire

**Impact:** Lost progress, frustration

**Fix:** Add warning after 30 minutes of inactivity

---

### 12. **Error Messages Are Generic**

Current: `alert('Please enter a diagnosis')`

**Issue:** Browser alert() is jarring and doesn't match UI design

**Fix:** Use styled notification component with specific guidance

---

## 📊 DATA VERIFICATION CHECKLIST

### Supabase Connection Status: ✅ Working
- [x] Users table receiving data
- [x] Sessions table receiving data
- [x] UI events logging correctly
- [x] NFC responses saved
- [x] Evidence exploration tracked
- [ ] **Case interactions NOT saving** ← CRITICAL

### Case Data Structure: ⚠️ Needs Verification

**Pre-test/Post-test cases have:**
- ✅ `correctDiagnosis`
- ✅ `patient`, `vitals`, `labs`, `imaging`
- ❌ No `aiRecommendation` (expected - no AI in these phases)
- ❌ No `supportingEvidence` (expected)

**Intervention cases should have:**
- ✅ `correctDiagnosis`
- ✅ `aiRecommendation`
- ✅ `aiConfidence`
- ✅ `supportingEvidence` (for Oracle)
- ✅ `contrastiveEvidence` (for Critic)
- ✅ `differentialComparison`
- ⚠️ Need to verify all 15 intervention cases have these fields

---

## 🧪 RECOMMENDED TESTING SEQUENCE

### Before Pilot Launch:

1. **Fix Critical Bug #1** (Case interactions not saving)
   - [ ] Update logger.js to include timestamp_final_decision on insert
   - [ ] Change empty strings to 'TBD' for required fields
   - [ ] Test with local Supabase and verify records appear
   - [ ] Run full flow (5 pre + 15 intervention) and confirm 20 records

2. **Fix Critical Bug #2** (Hypothesis revision spam)
   - [ ] Remove or debounce revision logging
   - [ ] Test that single revision = single log entry

3. **Improve Student ID UX** (Issue #3)
   - [ ] Add validation + duplicate check
   - [ ] Add clear instructions
   - [ ] Test with duplicate ID and verify friendly error

4. **Run Manual Test Suite:**
   - [ ] Oracle × High (100%) - Complete 3 cases, verify DB records
   - [ ] Oracle × Calibrated (70%) - Complete 3 cases, verify foils appear
   - [ ] Critic × High (100%) - Complete 3 cases, verify hypothesis lock works
   - [ ] Critic × Calibrated (70%) - Complete 3 cases, verify contrastive evidence
   - [ ] Check browser console for any errors
   - [ ] Verify all timestamps are being captured
   - [ ] Check overreliance_by_group view returns data

5. **Pilot with N=5 test users** (friendly volunteers)
   - [ ] Record screen while they use interface
   - [ ] Ask them to "think aloud"
   - [ ] Note any confusion or questions
   - [ ] Check database after each user

---

## 💬 STUDENT FEEDBACK PREDICTIONS

Based on UX analysis, students will likely ask:

1. **"What ID should I enter?"** → Need clearer instruction
2. **"How long will this take?"** → Add time estimate (est. 45-60 min total)
3. **"Can I save and come back later?"** → Currently yes, but not communicated
4. **"Why do I have to enter my diagnosis first?"** (Critic group) → Need rationale
5. **"Is the AI always right?"** → Need to mention AI has errors (70% groups)
6. **"What happens to my data?"** → Already addressed in footer, good!

---

## 🎯 PRIORITY RANKING

1. **P0 (Blocker):** Fix case_interactions not saving (#1)
2. **P0 (Blocker):** Fix hypothesis revision spam (#2)
3. **P1 (High):** Student ID validation (#3)
4. **P2 (Medium):** Progress indicators (#6)
5. **P2 (Medium):** Hypothesis lock explanation (#7)
6. **P3 (Low):** All other polish issues

---

## ✅ WHAT'S WORKING WELL

1. **Visual Design:** Clean, professional, medical aesthetic
2. **Color Coding:** Blue (Oracle) vs Purple (Critic) is clear
3. **Session Persistence:** localStorage working correctly
4. **Foil Selection:** Randomization logic appears correct
5. **Evidence Exploration:** Tracking which panels opened (Critic)
6. **Phase Transitions:** Flow from registration → pre-test → NFC → intervention is logical
7. **Consent Language:** Clear and ethical
8. **Footer Contact:** Provides support channel

---

## 📝 NEXT STEPS

1. **Immediate (Today):**
   - Fix case_interactions database insert bug
   - Test fix with full flow
   - Verify data appears in Supabase

2. **Before Pilot (This Week):**
   - Implement Student ID validation
   - Fix hypothesis revision spam
   - Add progress indicators
   - Run manual test scenarios (all 4 groups)

3. **Pilot Phase (Next Week):**
   - Deploy to N=10-15 friendly testers
   - Monitor error logs in real-time
   - Collect qualitative feedback
   - Check database integrity after each session

4. **Full Launch (After Pilot):**
   - Address any issues found in pilot
   - Scale to N=120 target participants
   - Set up automated monitoring/alerts

---

**Report Generated:** 2026-03-26
**Platform Version:** 2.1 (Data Integrity Corrected)
**Deployment:** https://demo-project-two-peach.vercel.app
**Database:** Supabase (9 tables, 4 analysis views)
