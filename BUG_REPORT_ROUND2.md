# Bug Report - Round 2 Testing
## Date: 2026-03-26

---

## 🔴 CRITICAL BUG (BLOCKING DEPLOYMENT)

### Bug #1: Missing 'use client' Directive in SessionOrchestrator
**Severity:** CRITICAL - Application does not load at all

**Status:** ✅ FIXED

**Issue:**
- `SessionOrchestrator.jsx` was missing the `'use client'` directive
- In Next.js 13+ App Router, components using hooks (useState, useEffect) MUST have `'use client'` at the top
- This caused the component to attempt server-side rendering, which failed silently
- Result: Application stuck on "Loading experiment..." forever

**Evidence:**
- Deployed site: https://demo-project-two-peach.vercel.app shows only loading state
- Local dev server reproduced the same issue
- Component uses useState, useEffect, and other client-side hooks

**Fix Applied:**
```javascript
// Added at top of SessionOrchestrator.jsx
'use client';
```

**Verification:**
- Build successful after fix
- Component should now render client-side correctly

---

## ⚠️ HIGH SEVERITY BUGS

### Bug #2: React Hooks Stale Closure in Keyboard Shortcuts
**Severity:** HIGH - Keyboard shortcuts will not work correctly

**Status:** ❌ NOT FIXED YET

**Issue:**
Event listeners in useEffect reference handler functions that are not in the dependency array, causing stale closures.

**Affected Files:**
1. **CriticInterface.jsx** (line 44-61)
   ```javascript
   useEffect(() => {
     const handleKeyPress = (e) => {
       if (e.key === 'Enter' && e.ctrlKey) {
         if (!hypothesisSubmitted && hypothesis && confidencePre) {
           handleSubmitHypothesis(); // ← References function not in deps
         } else if (hypothesisSubmitted && confidencePost) {
           handleSubmitFinal(); // ← References function not in deps
         }
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, [caseData, hypothesisSubmitted, hypothesis, confidencePre, confidencePost]);
   // ↑ Missing: handleSubmitHypothesis, handleSubmitFinal
   ```

2. **OracleInterface.jsx** (line 28-48)
   ```javascript
   useEffect(() => {
     const handleKeyPress = (e) => {
       if (e.key === 'Enter' && e.ctrlKey && confidence && finalDiagnosis) {
         handleSubmitFinal(); // ← References function not in deps
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, [caseData, confidence, finalDiagnosis]);
   // ↑ Missing: handleSubmitFinal
   ```

3. **NoAIInterface.jsx** (line 21-35)
   ```javascript
   useEffect(() => {
     const handleKeyPress = (e) => {
       if (e.key === 'Enter' && e.ctrlKey && diagnosis && confidence) {
         handleSubmit(); // ← References function not in deps
       }
     };
     window.addEventListener('keydown', handleKeyPress);
     return () => window.removeEventListener('keydown', handleKeyPress);
   }, [caseData, diagnosis, confidence]);
   // ↑ Missing: handleSubmit
   ```

**Impact:**
- Keyboard shortcuts (Ctrl+Enter) will capture the FIRST version of the handler functions
- If user types something, state updates, but the keyboard shortcut still calls the OLD function with OLD state
- This can cause: submission with empty data, no submission at all, or incorrect data being submitted

**Symptoms:**
- Ctrl+Enter might not work after user interacts with form
- Ctrl+Enter might submit old/stale data instead of current data

**Recommended Fix:**
Use `useCallback` to memoize handler functions, or use refs to store latest functions.

---

## ⚠️ MEDIUM SEVERITY BUGS

### Bug #3: Potential Race Condition in restoreSession()
**Severity:** MEDIUM

**Issue:**
`SessionOrchestrator.jsx` line 84:
```javascript
useEffect(() => {
  restoreSession();
}, []);
```

The `restoreSession` function is async but not awaited, and it's not in the dependency array. While this works in most cases, it could cause issues if the component unmounts before `restoreSession` completes.

**Recommended Fix:**
```javascript
useEffect(() => {
  let isMounted = true;
  const restore = async () => {
    try {
      await restoreSession();
    } catch (err) {
      if (isMounted) {
        console.error('Error:', err);
        setError(err.message);
      }
    }
  };
  restore();
  return () => { isMounted = false; };
}, []);
```

---

### Bug #4: Missing Error Handling in validateStudentId()
**Severity:** MEDIUM

**Issue:**
`SessionOrchestrator.jsx` line 645-670:
```javascript
const validateStudentId = async (id) => {
  // ... validation logic ...

  const { data } = await supabase
    .from('users')
    .select('student_id')
    .eq('student_id', id)
    .single();

  if (data) {
    setStudentIdStatus('duplicate');
    setStudentIdError('This Student ID is already registered');
    return false;
  }
```

**Issue:** No error handling if Supabase query fails (network error, database down, etc.)

**Impact:**
- If network fails, validation gets stuck in "checking" state
- User cannot proceed even with valid ID

**Recommended Fix:**
```javascript
const validateStudentId = async (id) => {
  if (!id || id.length < 3) {
    setStudentIdStatus('invalid');
    setStudentIdError('ID must be at least 3 characters');
    return false;
  }

  setStudentIdStatus('checking');

  try {
    const { data, error } = await supabase
      .from('users')
      .select('student_id')
      .eq('student_id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is good)
      throw error;
    }

    if (data) {
      setStudentIdStatus('duplicate');
      setStudentIdError('This Student ID is already registered');
      return false;
    }

    setStudentIdStatus('valid');
    setStudentIdError('');
    return true;
  } catch (err) {
    console.error('Error checking student ID:', err);
    setStudentIdStatus('invalid');
    setStudentIdError('Unable to verify ID. Please try again.');
    return false;
  }
};
```

---

## 📝 MINOR ISSUES

### Issue #5: Inconsistent Button Disable State
**Severity:** LOW

**Issue:**
Some submit buttons check for all required fields before enabling, others don't.

**Example:**
CriticInterface.jsx line 225:
```javascript
disabled={!hypothesis || !confidencePre}
```

But later at line 449:
```javascript
disabled={!confidencePost}
```

This second button doesn't check if `finalDiagnosis` is filled (for revised hypotheses).

**Impact:**
User can click "Submit Final Diagnosis" without entering a revised diagnosis.

---

### Issue #6: No Loading State on Student ID Validation
**Severity:** LOW

**Issue:**
When user tabs out of Student ID field, validation runs asynchronously but the button remains enabled.

**Impact:**
User could click "Begin Experiment" before validation completes, bypassing duplicate check.

**Recommended Fix:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();

  // Check if validation is still running
  if (studentIdStatus === 'checking') {
    showNotification('Please wait while we verify your Student ID', 'info');
    return;
  }

  if (!consentGiven) {
    showNotification('Please provide informed consent to participate', 'warning');
    return;
  }

  // ... rest of submission logic
};
```

---

### Issue #7: Console Warnings (React Strict Mode)
**Severity:** LOW

**Issue:**
Running in development mode likely shows warnings about missing dependencies in useEffect.

**Impact:**
Development console noise, but indicates potential bugs (see Bug #2).

---

## 🧪 UNTESTED FEATURES

### Features Requiring Manual Testing:

1. **Notification Component**
   - Not tested in isolation
   - Need to verify: auto-dismiss after 4 seconds, manual close, multiple notifications

2. **Progress Bar**
   - Need to verify: animates smoothly, percentages accurate, "X remaining" updates

3. **Student ID Duplicate Check**
   - Need to test: actual duplicate in database, network failure, slow connection

4. **Keyboard Shortcuts**
   - After fixing Bug #2, need to test: Ctrl+Enter works, doesn't trigger on other modifiers

5. **Confidence Labels**
   - Verify: labels display correctly on mobile, accessible via keyboard

6. **Evidence Panel State**
   - Verify: "Hide" text shows when open, panels close correctly

7. **Hypothesis Lock Explanation**
   - Verify: blue info box displays, text is readable

---

## 🔍 POTENTIAL ISSUES (NOT CONFIRMED)

### Concern #1: Cases.json Large Size
**Size:** ~111 KB

**Concern:**
- Loading 25 full case objects on every page load
- Could impact performance on slow connections
- Should cases be lazy-loaded or split by phase?

**Recommendation:**
Monitor loading times in pilot study. If > 2 seconds on average connection, implement lazy loading.

---

### Concern #2: No Session Timeout
**Issue:**
User could leave browser open for days, session never expires.

**Impact:**
- Potential data corruption if browser state gets stale
- Security concern if shared computer

**Recommendation:**
Add timeout check (30-60 minutes) during pilot, adjust based on user feedback.

---

### Concern #3: No Network Error Recovery
**Issue:**
If Supabase connection fails mid-session, no recovery mechanism.

**Impact:**
User loses progress, has to refresh and restart.

**Recommendation:**
Add connection monitoring and queue failed requests for retry.

---

## 📊 TESTING CHECKLIST (POST-FIX)

After fixing Bug #1 and Bug #2, test these scenarios:

### Critical Path Tests:
- [ ] Page loads and shows registration form (Bug #1 fix verification)
- [ ] Enter Student ID, check for duplicate detection
- [ ] Complete registration, verify group assignment
- [ ] Complete pre-test case, verify database logging
- [ ] Test NFC assessment submission
- [ ] Oracle interface: verify AI output displays, supporting evidence shows
- [ ] Critic interface: verify hypothesis lock works, contrastive evidence shows
- [ ] Test keyboard shortcut (Ctrl+Enter) in all three interfaces (Bug #2 fix verification)
- [ ] Complete intervention case, verify case_interactions table has record
- [ ] Test session persistence (refresh mid-session)
- [ ] Check progress bar updates correctly

### Edge Case Tests:
- [ ] Enter duplicate Student ID
- [ ] Try to submit without consent
- [ ] Try to submit hypothesis without confidence rating
- [ ] Click evidence panels multiple times (verify toggle works)
- [ ] Test notification auto-dismiss (wait 4 seconds)
- [ ] Test on slow connection (verify loading states)
- [ ] Open browser console, verify no errors

### Database Tests:
- [ ] Verify case_interactions record created (Bug #1 from round 1 fix)
- [ ] Verify hypothesis revision logged only once (Bug #2 from round 1 fix)
- [ ] Verify Student ID uniqueness enforced
- [ ] Check overreliance_by_group view returns data

---

## 🎯 PRIORITY RANKINGS

**Fix Immediately (Before Next Deployment):**
1. ✅ Bug #1: 'use client' directive - **ALREADY FIXED**
2. ❌ Bug #2: Stale closure in keyboard shortcuts - **MUST FIX**

**Fix Before Pilot:**
3. Bug #4: Error handling in Student ID validation
4. Issue #6: Loading state on validation

**Fix During Pilot (If Issues Arise):**
5. Bug #3: Race condition in restoreSession
6. Issue #5: Inconsistent button states
7. Concern #2: Session timeout

**Monitor in Pilot:**
8. Concern #1: Cases.json size / loading performance
9. Concern #3: Network error recovery

---

## 📝 SUMMARY

**Critical Issues Found:** 1 (FIXED)
**High Severity Bugs:** 1 (NOT FIXED)
**Medium Severity Bugs:** 2
**Minor Issues:** 3
**Concerns to Monitor:** 3

**Deployment Status:** 🔴 **BLOCKED** until Bug #2 is fixed

**Estimated Fix Time:**
- Bug #2: 15-20 minutes (refactor keyboard shortcuts with useCallback)
- Bug #4: 10 minutes (add error handling)
- Issue #6: 5 minutes (add status check)

**Total:** ~40 minutes to production-ready state

---

**Testing Completed:** 2026-03-26
**Next Action:** Fix Bug #2 (keyboard shortcuts), then redeploy and retest
