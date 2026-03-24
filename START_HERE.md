# 🚀 START HERE - Quick Launch Guide
## Get Running in 5 Minutes

---

## ⚡ Fast Track Setup (macOS)

### 1️⃣ Install Node.js (if needed)

**Check if installed:**
```bash
node --version
```

**If command not found:**
```bash
# Install via Homebrew
brew install node@20

# Verify
node --version  # Should show v20.x.x
```

---

### 2️⃣ Install Dependencies

```bash
cd "/Users/anastassiya/Desktop/Demo project"
npm install
```

⏱️ **Takes 2-3 minutes**

---

### 3️⃣ Configure Supabase

**I need your Supabase credentials to proceed:**

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Click **Settings** → **API**
4. Copy these two values:

```
Project URL: https://_____________.supabase.co
Anon Key: eyJ_________________________________
```

**Provide these to me, and I'll create your `.env.local` file.**

---

### 4️⃣ Initialize Database

**Copy this command:**
```bash
cat supabase/schema.sql | pbcopy
```

**Then:**
1. Open [app.supabase.com](https://app.supabase.com)
2. Click **SQL Editor** → **New query**
3. Paste (Cmd+V)
4. Click **Run**

✅ **Should see:** "Success. No rows returned"

---

### 5️⃣ Start Server

```bash
npm run dev
```

🌐 **Open:** http://localhost:3000

---

## ✅ Quick Verification

**Test registration:**
1. Fill in: Student ID: TEST001, Age: 25, etc.
2. Check consent
3. Click "Begin Experiment"

**Should see:**
- Pre-test case presentation
- Console log: "Logger initialized"
- In Supabase → users table → 1 row

---

## 🆘 Need Help?

**See full guide:** [MAC_SETUP.md](MAC_SETUP.md)

**Common issues:**
- Node not found → Install Node.js (Step 1 above)
- Module errors → Run `npm install` again
- Supabase errors → Check .env.local credentials
- Port in use → Run `lsof -ti:3000 | xargs kill -9`

---

## 📋 Ready to Provide

**I need from you:**

1. ✅ Supabase Project URL
2. ✅ Supabase Anon Key

**Provide these, and I'll:**
- ✅ Create your `.env.local` file
- ✅ Verify database schema applied
- ✅ Test interface integration
- ✅ Confirm logging works

---

**Quick Status Check:**
```bash
# Run this to see current state:
cd "/Users/anastassiya/Desktop/Demo project"
echo "Node.js: $(node --version 2>&1)"
echo "npm: $(npm --version 2>&1)"
echo ".env.local exists: $([ -f .env.local ] && echo YES || echo NO)"
echo "node_modules exists: $([ -d node_modules ] && echo YES || echo NO)"
```
