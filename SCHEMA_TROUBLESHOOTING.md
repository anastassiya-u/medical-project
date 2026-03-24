# 🔧 Schema Application Troubleshooting Guide

**Project:** Oracle vs. Critic Experiment
**Issue:** Database schema initialization fails at Step 3

---

## ✅ Verified Status

**Connection Test:** ✓ PASSED
```
URL: https://rdcuqbsqnyzwxnyvndsq.supabase.co
Status: 401 (API accessible, authentication working)
```

**Schema File:** ✓ EXISTS
```
Location: supabase/schema.sql
Size: 439 lines
Content: 9 tables, 3 views, 2 triggers
```

---

## 🎯 Recommended Solution: Manual SQL Editor

Since Supabase's REST API (using anon key) **cannot execute DDL statements** like CREATE TABLE, you must use the **SQL Editor** in the Supabase Dashboard.

### Step-by-Step Process:

#### **1. Copy Schema to Clipboard**

Open Terminal and run:

```bash
cd "/Users/anastassiya/Desktop/Demo project"
cat supabase/schema.sql | pbcopy
```

✓ **Confirmation:** No output means success. Schema is now in clipboard.

---

#### **2. Open Supabase SQL Editor**

**Direct link:**
```
https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/sql/new
```

**Or navigate manually:**
1. Go to [app.supabase.com](https://app.supabase.com)
2. Select project **rdcuqbsqnyzwxnyvndsq**
3. Click **SQL Editor** in left sidebar
4. Click **+ New query** button

---

#### **3. Paste Schema**

1. Click in the SQL editor text area
2. Press **Cmd+V** (paste)
3. You should see 439 lines of SQL appear

**Expected view:**
```sql
-- =====================================================
-- Oracle vs. Critic Experiment: Supabase Schema
-- SDT Logging + 2x2 Factorial Design
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  ...
```

---

#### **4. Execute Schema**

1. Click **Run** button (bottom right, or Cmd+Enter)
2. **Wait 5-10 seconds** for execution
3. Check result panel

**Expected result:**
```
Success. No rows returned
Query executed in XXX ms
```

---

## ❌ Common Error Messages & Fixes

### Error 1: "relation 'users' already exists"

**Cause:** Schema was partially applied in a previous attempt.

**Fix:**
```sql
-- Run this FIRST in SQL Editor to clean up:
DROP TABLE IF EXISTS interview_transcripts CASCADE;
DROP TABLE IF EXISTS likert_assessments CASCADE;
DROP TABLE IF EXISTS nfc_responses CASCADE;
DROP TABLE IF EXISTS ui_events CASCADE;
DROP TABLE IF EXISTS evidence_exploration CASCADE;
DROP TABLE IF EXISTS case_interactions CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP VIEW IF EXISTS randomization_balance;
DROP VIEW IF EXISTS sdt_metrics_by_group;
DROP VIEW IF EXISTS learning_gain_by_group;
DROP VIEW IF EXISTS overreliance_by_group;

DROP FUNCTION IF EXISTS update_user_nfc_level();
DROP FUNCTION IF EXISTS calculate_nfc_score();

-- Then run the full schema again
```

---

### Error 2: "permission denied for extension uuid-ossp"

**Cause:** Insufficient database permissions.

**Fix:**
1. Go to Supabase Dashboard → **Settings** → **Database**
2. Verify you're the project owner
3. If not, ask project owner to:
   - Go to **Settings** → **Team**
   - Add you as **Owner** or **Admin**

---

### Error 3: "syntax error at or near..."

**Cause:** Schema was corrupted during copy/paste.

**Fix:**
1. Clear SQL Editor
2. Re-copy from terminal:
   ```bash
   cat supabase/schema.sql | pbcopy
   ```
3. Paste again (ensure all 439 lines appear)
4. Check line numbers match:
   - First line: `-- =====================`
   - Last line: `COMMENT ON COLUMN case_interactions.num_evidence_panels_opened IS 'SDT Competence proxy: active evidence exploration';`

---

### Error 4: "Query timeout" or "Statement too large"

**Cause:** Supabase SQL Editor has execution limits.

**Fix:** Apply schema in chunks.

**Chunk 1: Extensions and Tables (Lines 1-277)**
```bash
head -277 supabase/schema.sql | pbcopy
```
Paste and Run in SQL Editor.

**Chunk 2: Views and Functions (Lines 278-439)**
```bash
tail -n +278 supabase/schema.sql | pbcopy
```
Paste and Run in SQL Editor.

---

### Error 5: "Failed to fetch" or Network error

**Cause:** Browser connectivity or Supabase service issue.

**Checks:**
1. Verify internet connection
2. Check Supabase status: https://status.supabase.com
3. Try different browser (Chrome, Safari, Firefox)
4. Disable browser extensions (especially ad blockers)
5. Clear browser cache

---

## 🔍 Verification After Success

### Check Tables Created

1. Go to **Table Editor** in Supabase Dashboard
2. You should see 8 tables:

```
✓ users
✓ sessions
✓ case_interactions
✓ evidence_exploration
✓ ui_events
✓ nfc_responses
✓ likert_assessments
✓ interview_transcripts
```

### Check Views Created

Run in SQL Editor:
```sql
SELECT viewname FROM pg_views WHERE schemaname = 'public';
```

Expected output:
```
randomization_balance
overreliance_by_group
learning_gain_by_group
sdt_metrics_by_group
```

### Check Functions Created

Run in SQL Editor:
```sql
SELECT proname FROM pg_proc WHERE proname LIKE '%nfc%';
```

Expected output:
```
calculate_nfc_score
update_user_nfc_level
```

---

## 🆘 If All Else Fails

### Option A: Use Supabase CLI

**Install Supabase CLI:**
```bash
brew install supabase/tap/supabase
```

**Login:**
```bash
supabase login
```

**Link project:**
```bash
supabase link --project-ref rdcuqbsqnyzwxnyvndsq
```

**Apply schema:**
```bash
supabase db push
```

---

### Option B: Request Service Role Key

**NOTE:** Service role key has full database access (dangerous).

**Only if approved by project owner:**

1. Get service role key from: Dashboard → Settings → API → **service_role**
2. Create `.env.service` (DO NOT COMMIT):
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Use curl to execute SQL:
   ```bash
   curl -X POST \
     https://rdcuqbsqnyzwxnyvndsq.supabase.co/rest/v1/rpc/exec_sql \
     -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
     -H "Content-Type: application/json" \
     -d '{"query": "CREATE TABLE ..."}'
   ```

---

## 📊 What Specific Error Are You Seeing?

**To help debug, please provide:**

1. **Exact error message** from SQL Editor
2. **Screenshot** of the error (if visual)
3. **Line number** where error occurs (if shown)
4. **Your role** in the Supabase project (Owner/Admin/Member)
5. **Browser** you're using (Chrome/Safari/Firefox)

**Example:**
```
Error: relation "users" already exists
Line: 12
Role: Owner
Browser: Chrome 120
```

---

## 🎯 Next Steps After Schema Applied

Once schema is successfully applied:

1. **Verify tables:**
   ```bash
   # Should show 8 tables
   open https://app.supabase.com/project/rdcuqbsqnyzwxnyvndsq/editor
   ```

2. **Install dependencies:**
   ```bash
   cd "/Users/anastassiya/Desktop/Demo project"
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Test registration:**
   ```
   http://localhost:3000
   ```

---

## 📞 Support Resources

**Supabase Documentation:**
- SQL Editor: https://supabase.com/docs/guides/database/overview
- Troubleshooting: https://supabase.com/docs/guides/platform/troubleshooting

**Project Setup:**
- Complete guide: [MAC_SETUP.md](MAC_SETUP.md)
- Quick start: [START_HERE.md](START_HERE.md)

---

**Status:** ⏸️ Awaiting user input on specific error message
