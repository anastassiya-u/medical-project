# REQUIRED: Update Vercel Environment Variables

## What Changed

AWS credentials have been moved from **client-side** (exposed in browser) to **server-side** (secure).

## Action Required: Update Vercel Dashboard

**Go to:** https://vercel.com/anastassiyas-projects-72520fa5/demo-project/settings/environment-variables

### Variables to UPDATE:

**❌ DELETE these (old client-side variables):**
- `NEXT_PUBLIC_AWS_ACCESS_KEY_ID`
- `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY`
- `NEXT_PUBLIC_AWS_REGION`

**✅ ADD these (new server-side variables):**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `AWS_ACCESS_KEY_ID` | (copy from `.env.local`) | Production, Preview, Development |
| `AWS_SECRET_ACCESS_KEY` | (copy from `.env.local`) | Production, Preview, Development |
| `AWS_REGION` | `us-east-1` | Production, Preview, Development |

**To get values:** Open `.env.local` file and copy the values for `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

### Steps:

1. **Open Vercel Dashboard:** https://vercel.com/anastassiyas-projects-72520fa5/demo-project/settings/environment-variables

2. **Delete old variables:**
   - Find `NEXT_PUBLIC_AWS_ACCESS_KEY_ID` → Click "..." → Delete
   - Find `NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY` → Click "..." → Delete
   - Find `NEXT_PUBLIC_AWS_REGION` → Click "..." → Delete

3. **Add new variables:**
   - Click "Add New"
   - Name: `AWS_ACCESS_KEY_ID`
   - Value: Copy from `.env.local` (starts with `AKIA...`)
   - Environment: Check all (Production, Preview, Development)
   - Click "Save"

   - Click "Add New"
   - Name: `AWS_SECRET_ACCESS_KEY`
   - Value: Copy from `.env.local` (the long secret key)
   - Environment: Check all (Production, Preview, Development)
   - Click "Save"

   - Click "Add New"
   - Name: `AWS_REGION`
   - Value: `us-east-1`
   - Environment: Check all (Production, Preview, Development)
   - Click "Save"

4. **Redeploy** (after saving all variables):
   - Either: Let automatic deployment trigger (already pushed to GitHub)
   - Or: Run `vercel --prod` from terminal

## Why This Change?

**Before (INSECURE):**
```javascript
// AWS credentials exposed in browser JavaScript
accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID
```

**After (SECURE):**
```javascript
// AWS credentials only accessible on server
accessKeyId: process.env.AWS_ACCESS_KEY_ID
```

**Client-side code now calls API route:**
```javascript
// components/CriticInterface.jsx
const response = await fetch('/api/evaluate-hypothesis', {
  method: 'POST',
  body: JSON.stringify({ caseData, userHypothesis, ... })
});
```

**Server-side API route uses credentials:**
```javascript
// app/api/evaluate-hypothesis/route.js (server-only)
import { evaluateHypothesis } from '../../../lib/ai-evaluator';
// This file has access to process.env.AWS_ACCESS_KEY_ID
```

## Verification

After redeploying, test that AI evaluation still works:

1. Go to https://demo-project-two-peach.vercel.app
2. Register and start experiment
3. In Critic interface, submit a hypothesis
4. Check that AI evidence appears (supporting/challenging)
5. Check browser console - should see: `📡 API: Evaluating hypothesis (server-side)`

If AI fails, check Vercel deployment logs for errors about missing AWS credentials.

---

**IMPORTANT:** Without these environment variables, the AI evaluation will fail and users will see fallback evidence.
