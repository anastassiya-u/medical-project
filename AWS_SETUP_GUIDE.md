# AWS Bedrock Setup & Deployment Guide

**Project:** Oracle vs. Critic Experiment Platform
**Date:** March 27, 2026
**AI Provider:** AWS Bedrock (GPT-OSS-20B) - Open-source, cost-effective model

---

## 🎯 Overview

This guide will help you:
1. ✅ Set up AWS Bedrock access
2. ✅ Create IAM credentials
3. ✅ Configure your local environment
4. ✅ Deploy to Vercel with AWS credentials
5. ✅ Test the AI evaluation system

**Total Time:** 15-20 minutes
**Total Cost for Full Study (N=120):** ~$2-4 (extremely affordable!)

---

## 📋 Prerequisites

- AWS Account with credits (you mentioned you have AWS credits)
- Vercel account (already configured)
- GitHub repository (already pushed)

---

## Step 1: Enable AWS Bedrock Access

### 1.1 Log in to AWS Console

1. Go to https://console.aws.amazon.com
2. Sign in with your AWS account
3. Select region: **us-east-1** (N. Virginia) - This is where GPT-OSS-20B is available

### 1.2 Request Bedrock Model Access

1. In the AWS Console, search for **"Bedrock"** in the top search bar
2. Click on **Amazon Bedrock**
3. In the left sidebar, click **Model access**
4. Click the **Modify model access** button (orange button on top right)
5. Find **OpenAI** or **Open-source models** in the list
6. Check the box next to **GPT-OSS-20B** (model ID: `openai.gpt-oss-20b-1:0`)
7. Scroll down and click **Next**
8. Review and click **Submit**

**⏱️ Access is usually granted instantly** for open-source models.

**✅ Confirmation:** You'll see "Access granted" status next to GPT-OSS-20B

**💡 Why this model?** GPT-OSS-20B is an open-source model that's 90% cheaper than Claude/GPT-4 while still providing good quality for medical case evaluation.

---

## Step 2: Create IAM User with Bedrock Permissions

### 2.1 Navigate to IAM

1. In AWS Console, search for **"IAM"** in the top search bar
2. Click on **IAM** (Identity and Access Management)

### 2.2 Create New User

1. In the left sidebar, click **Users**
2. Click **Create user** (blue button)
3. Enter user name: `bedrock-api-user`
4. Click **Next**

### 2.3 Set Permissions

1. Select **Attach policies directly**
2. Click **Create policy** (this will open a new tab)

In the new tab:
1. Click on the **JSON** tab
2. Paste the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModel",
      "Effect": "Allow",
      "Action": "bedrock:InvokeModel",
      "Resource": "arn:aws:bedrock:us-east-1::foundation-model/openai.gpt-oss-20b-*"
    }
  ]
}
```

3. Click **Next**
4. Enter policy name: `BedrockGPTOSSInvokePolicy`
5. Click **Create policy**

Go back to the previous tab (Create user):
1. Click the refresh button (circular arrow)
2. Search for `BedrockGPTOSSInvokePolicy`
3. Check the box next to it
4. Click **Next**
5. Click **Create user**

### 2.4 Generate Access Keys

1. Click on the user you just created (`bedrock-api-user`)
2. Click on the **Security credentials** tab
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Third-party service**
6. Check the confirmation box
7. Click **Next**
8. (Optional) Add description: "Bedrock API for medical education platform"
9. Click **Create access key**

**🔴 IMPORTANT:** This is the ONLY time you'll see the Secret Access Key!

**Copy and save:**
- ✅ Access Key ID (starts with `AKIA...`)
- ✅ Secret Access Key (long random string)

Click **Download .csv file** as backup, then click **Done**

---

## Step 3: Configure Local Environment

### 3.1 Create `.env.local` file

In your project directory (`/Users/anastassiya/Desktop/Demo project/`), create or update `.env.local`:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# AWS Bedrock Configuration (NEW)
NEXT_PUBLIC_AWS_ACCESS_KEY_ID=AKIA... # Paste your Access Key ID here
NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY=... # Paste your Secret Access Key here
NEXT_PUBLIC_AWS_REGION=us-east-1
```

**🔒 Security Note:** `.env.local` is in `.gitignore` - it will NOT be committed to GitHub.

### 3.2 Test Locally

```bash
cd "/Users/anastassiya/Desktop/Demo project"
npm run dev
```

1. Open http://localhost:3000
2. Complete registration
3. Get assigned to **Critic** group (refresh if needed)
4. Enter a test hypothesis like "Pneumonia"
5. Click "Submit My Hypothesis"
6. **Expected:** Loading spinner → Dynamic evidence appears after 2-3 seconds

**✅ Success:** You should see evidence specifically about "Pneumonia" (not generic text)

**❌ If you see error:**
- Check browser console (F12 → Console tab)
- Verify AWS credentials in `.env.local`
- Ensure Bedrock model access is granted

---

## Step 4: Deploy to Vercel

### 4.1 Add Environment Variables to Vercel

Open your terminal and run these commands one by one:

```bash
cd "/Users/anastassiya/Desktop/Demo project"

# Add AWS Access Key ID
vercel env add NEXT_PUBLIC_AWS_ACCESS_KEY_ID
# When prompted:
# - Paste your Access Key ID (AKIA...)
# - Select: Production, Preview, Development (use spacebar to select all)

# Add AWS Secret Access Key
vercel env add NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY
# When prompted:
# - Paste your Secret Access Key
# - Select: Production, Preview, Development (use spacebar to select all)

# Add AWS Region
vercel env add NEXT_PUBLIC_AWS_REGION
# When prompted:
# - Type: us-east-1
# - Select: Production, Preview, Development (use spacebar to select all)
```

**✅ Verification:** Run `vercel env ls` to see all environment variables

### 4.2 Deploy to Production

```bash
vercel --prod
```

**⏱️ Deployment takes 2-3 minutes**

**Output will show:**
```
✅ Deployment ready
🔗 Production: https://demo-project-two-peach.vercel.app
```

### 4.3 Test Production Deployment

1. Visit https://demo-project-two-peach.vercel.app
2. Complete registration
3. Test Critic interface with hypothesis submission
4. Verify dynamic evidence generation works

---

## Step 5: Verify Everything Works

### Test Checklist

#### ✅ Test 1: Accurate Mode (100% Groups)
1. Enter hypothesis: **"Acute Appendicitis"**
2. Submit hypothesis
3. **Expected Evidence:**
   - Supporting: Lists clinical facts supporting Appendicitis
   - Challenging: Lists alternative diagnoses or atypical features
   - Evidence is specific to your hypothesis, not generic

#### ✅ Test 2: Gibberish Hypothesis
1. Enter hypothesis: **"xyz random test 123"**
2. Submit hypothesis
3. **Expected Evidence:**
   - Supporting: May show minimal or no supporting evidence
   - Challenging: Should explain why this is not a valid diagnosis
   - Should NOT show evidence about the correct diagnosis

#### ✅ Test 3: Foil Mode (70% Groups)
*This requires being assigned to "Calibrated" accuracy group + foil case*

1. Complete several cases until you hit a foil case
2. **Expected Behavior:**
   - AI makes a plausible but incorrect recommendation
   - Error is subtle (not obvious)
   - Evidence downplays key differentiator
   - Good students should catch it by reviewing data

#### ✅ Test 4: Russian Language
1. Check if interface displays in Russian
2. Text like "Сначала введите ваш диагноз" should appear
3. Confidence scale labels should be in Russian

#### ✅ Test 5: NFC Scale (18 Items)
1. Complete the NFC assessment
2. **Expected:** 18 questions total (not 6)
3. Check browser console: "📊 NFC submitted: Total Score = [18-90]"

#### ✅ Test 6: Pre-test Confidence Logging
1. Complete a pre-test case
2. Rate confidence before submitting
3. Check Supabase database:
```sql
SELECT user_confidence_pre
FROM case_interactions
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
```
4. **Expected:** NOT NULL value

---

## 🐛 Troubleshooting

### Problem: "Access Denied" from AWS Bedrock

**Possible Causes:**
1. Model access not granted yet
2. IAM policy incorrect
3. Wrong region

**Solutions:**
1. Check Model access page in Bedrock console
2. Verify IAM policy includes `bedrock:InvokeModel` permission
3. Ensure you're using `us-east-1` region

---

### Problem: "Failed to parse AI response"

**Cause:** GPT-OSS-20B returned text instead of JSON

**Solution:**
- Check `lib/ai-evaluator.js` logs in browser console
- GPT-OSS-20B should respond with JSON format
- Fallback to static evidence should activate

---

### Problem: Static Evidence Still Showing

**Possible Causes:**
1. AWS credentials not set in Vercel
2. API call failing silently
3. Fallback mode activated

**Solutions:**
1. Run `vercel env ls` to verify env vars exist
2. Check browser Network tab for AWS API calls
3. Look for "AWS Bedrock API Error" in console

---

### Problem: Deployment Failed

**Error:** `Cannot find module '@aws-sdk/client-bedrock-runtime'`

**Solution:**
```bash
npm install @aws-sdk/client-bedrock-runtime
git add package.json package-lock.json
git commit -m "Fix AWS SDK dependency"
git push origin master
vercel --prod
```

---

## 💰 Cost Monitoring

### AWS Billing Dashboard

1. Go to https://console.aws.amazon.com/billing/
2. Click **Budgets** in left sidebar
3. Click **Create budget**
4. Select **Cost budget**
5. Set budget amount: **$50** (enough for pilot + full study)
6. Set alert at: **80%** ($40)
7. Enter your email for alerts

### Expected Costs

**Per Evaluation:**
- Total tokens (~1000): ~$0.0001-0.0003
- **Total: ~$0.001-0.002 per case** (extremely low!)

**Study Estimates:**
- Pilot (N=10, 15 cases each): **~$0.15-0.30**
- Full study (N=120, 15 cases each): **~$2-4**
- **90% cheaper than Claude/GPT-4!**
- **Easily covered by AWS free tier credits**

### Monitor Usage

```bash
# Check current month's usage
aws ce get-cost-and-usage \
  --time-period Start=2026-03-01,End=2026-03-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --region us-east-1
```

Or use AWS Console → Billing → Cost Explorer

---

## 🎓 How It Works

### Architecture Flow

```
User submits hypothesis
         ↓
CriticInterface.jsx calls evaluateHypothesis()
         ↓
lib/ai-evaluator.js prepares prompt
         ↓
AWS Bedrock API (GPT-OSS-20B)
         ↓
Response parsed as JSON
         ↓
Dynamic evidence displayed to user
         ↓
User explores evidence and makes final decision
         ↓
Data logged to Supabase
```

### AI Prompting Strategy

**100% Accuracy Mode:**
- System: "You are an expert medical educator"
- Temperature: 0.3 (more deterministic)
- Goal: Provide balanced, accurate evidence

**70% Foil Mode:**
- System: "You make subtle diagnostic errors"
- Temperature: 0.7 (more creative)
- Strategy: Emphasize overlaps, omit differentiators
- Goal: Create professional-looking errors

---

## 📊 Database Updates

**No Supabase changes needed!** The database schema already supports all features.

Verify data logging:

```sql
-- Check if AI evaluations are working
SELECT
  case_id,
  user_hypothesis,
  ai_recommendation,
  user_final_diagnosis,
  user_agreed_with_ai,
  is_foil_case
FROM case_interactions
WHERE paradigm = 'critic'
ORDER BY timestamp_case_start DESC
LIMIT 10;

-- Check NFC scores (should be 18-90 range)
SELECT user_id, total_score
FROM nfc_responses
ORDER BY completed_at DESC;
```

---

## ✅ Success Criteria

**You're ready for pilot testing when:**

- ✅ Local testing shows dynamic evidence
- ✅ Production deployment works
- ✅ Gibberish hypothesis shows correct behavior
- ✅ NFC scale shows 18 items
- ✅ Pre-test confidence saves to database
- ✅ Russian language displays correctly
- ✅ AWS billing is under $1 after initial testing

---

## 🚀 Next Steps After Setup

1. **Pilot Testing (N=5-10 users)**
   - Monitor AWS costs daily
   - Check database for complete data
   - Interview 2-3 users about experience

2. **Iterate Based on Feedback**
   - Adjust prompts if AI evidence quality is poor
   - Fix any UX issues reported by users
   - Verify overreliance detection works

3. **Full Rollout (N=120)**
   - Aim for 30 users per group
   - Monitor AWS costs (should stay under $20 total)
   - Export data for statistical analysis

---

## 📞 Support

**If you get stuck:**

1. **AWS Issues:** Check AWS Bedrock documentation or contact AWS Support
2. **Vercel Issues:** Run `vercel logs` to see deployment logs
3. **Code Issues:** Check browser console (F12) for error messages
4. **Database Issues:** Check Supabase dashboard for query logs

---

## 🎯 Quick Reference

**AWS Console:** https://console.aws.amazon.com
**AWS Bedrock:** https://console.aws.amazon.com/bedrock/
**IAM Users:** https://console.aws.amazon.com/iam/home#/users
**AWS Billing:** https://console.aws.amazon.com/billing/

**Vercel Dashboard:** https://vercel.com/dashboard
**Production URL:** https://demo-project-two-peach.vercel.app
**GitHub Repo:** https://github.com/anastassiya-u/demo-project

**Supabase Dashboard:** https://supabase.com/dashboard

---

**Good luck with your research! 🎓🔬**
