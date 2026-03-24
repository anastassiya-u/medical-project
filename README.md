# Oracle vs. Critic Experiment Platform

**A research platform for testing AI explanation paradigms in medical education (Kazakhstan study)**

## 🎯 Project Overview

This platform implements a **2×2 between-subjects factorial experiment** comparing two AI interaction paradigms:
- **Oracle** (Directive XAI): AI gives immediate recommendation with unilateral explanation
- **Critic** (Evaluative AI): AI evaluates user's hypothesis with contrastive evidence

**Research Question:** Which paradigm builds better trust calibration among medical students?

---

## 📊 Experiment Design

### 2×2 Factorial Structure

| Factor | Level 1 | Level 2 |
|--------|---------|---------|
| **Factor A: Paradigm** | Oracle | Critic |
| **Factor B: AI Accuracy** | High (100%) | Calibrated (70% correct + 30% sensible foils) |

**Target:** N=120 participants (30 per group)

### Experimental Flow

1. **Pre-Test** → 5 cases (no AI) - baseline assessment
2. **NFC Assessment** → 6-item Need for Cognition scale
3. **Intervention** → 15 cases with assigned AI paradigm (30% intentional errors in 70% group)
4. **Post-Test** → 5 cases (no AI) - one week later - learning gain measurement
5. **Assessments** → Likert scales + semi-structured interview

---

## 🏗️ Technical Architecture

### Stack

- **Frontend:** Next.js 14 (App Router) + React 18 + TypeScript
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Logging:** Real-time event streaming to Supabase
- **State Management:** Zustand + React Context
- **Deployment:** Vercel (frontend) + Supabase (backend)

### Project Structure

```
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Main entry (SessionOrchestrator)
│   ├── providers.tsx      # Global context providers
│   └── globals.css        # Tailwind + custom styles
├── components/
│   ├── SessionOrchestrator.jsx  # Main experimental flow controller
│   ├── OracleInterface.jsx      # Directive XAI interface
│   ├── CriticInterface.jsx      # Evaluative AI interface
│   ├── NoAIInterface.jsx        # Pre/post-test interface
│   └── NFCScale.jsx             # Need for Cognition assessment
├── lib/
│   ├── logger.js              # Real-time event logging to Supabase
│   ├── randomization.js       # 2×2 group assignment logic
│   ├── sessionUtils.ts        # Session persistence helpers
│   └── contexts/
│       └── LoggerContext.tsx  # Global logger context
├── src/data/
│   └── cases.json         # 25 clinical vignettes with foils
├── supabase/
│   └── schema.sql         # Database schema (SDT logging)
├── middleware.ts          # Group locking & routing
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥18.0.0
- npm ≥9.0.0
- Supabase account

### Installation

1. **Clone the repository**
```bash
cd "/Users/anastassiya/Desktop/Demo project"
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

a. Create a new Supabase project at [supabase.com](https://supabase.com)

b. Run the schema migration:
```sql
-- Copy contents of supabase/schema.sql
-- Paste into Supabase SQL Editor and execute
```

c. Get your Supabase credentials:
   - Project URL: `https://your-project.supabase.co`
   - Anon Key: Found in Settings → API

4. **Configure environment variables**

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

5. **Run development server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## 📝 Core Features

### 1. Randomization & Group Locking

- **Stratified balanced randomization**: Ensures ~30 participants per group
- **Group locking via middleware**: Users can't switch groups mid-session
- **Session persistence**: localStorage + cookies preserve state across refreshes

### 2. Oracle Interface (Directive XAI)

- ✅ Immediate AI recommendation
- ✅ Unilateral explanation (only supporting evidence)
- ✅ All evidence visible at once
- ✅ Authority-style presentation (blue gradient)

### 3. Critic Interface (Evaluative AI)

- ✅ **Hypothesis lock**: Blocks AI output until user submits diagnosis
- ✅ **Contrastive evidence**: Shows evidence FOR and AGAINST hypothesis
- ✅ **Progressive reveal**: Evidence panels unlocked on demand (partiality)
- ✅ **Hypothesis revision tracking**: Logs autonomy behavior

### 4. AI Accuracy Implementation

**100% Accuracy Group:**
- All AI recommendations are correct diagnoses

**70% Accuracy Group (Calibrated):**
- 70% correct recommendations (10-11 cases)
- 30% sensible foils (4-5 cases) - plausible but incorrect diagnoses
- Foils based on common student misconceptions (e.g., Pneumonia → Bronchitis)
- Non-consecutive error distribution

### 5. Comprehensive Logging

**Every interaction logs:**
- Timestamps (case start, hypothesis, AI view, final decision)
- User diagnoses (initial hypothesis + final)
- AI recommendations (correct or foil)
- Agreement with AI (overreliance detection)
- Evidence exploration (which panels clicked, when)
- Confidence ratings (pre/post)
- Task completion time

**SDT Metrics Tracked:**
- **Autonomy**: Time to hypothesis, disagreement rate, revision behavior
- **Competence**: Evidence exploration depth, confidence calibration
- **Relatedness**: Trust ratings, interview themes

---

## 📊 Cases Dataset

**Total: 25 cases**
- 5 pre-test (baseline)
- 15 intervention (AI-assisted, 30% foils in 70% group)
- 5 post-test (learning transfer)

**Categories:**
- Respiratory: Pneumonia, COPD, Pulmonary TB, Pneumothorax, etc.
- Cardiovascular: STEMI, Heart Failure, Aortic Dissection, Pericarditis, etc.

**Sensible Foils Examples:**
- Pneumonia → Bronchitis (shared: cough, fever | differentiator: X-ray infiltrate)
- Pericarditis → MI (shared: chest pain, ST elevation | differentiator: friction rub, positional pain)
- Orthostatic Hypotension → Arrhythmia (shared: syncope | differentiator: positional symptoms, BP drop)

---

## 🔬 Data Analysis

### Primary Hypotheses

**H1 (Trust Calibration):** Critic group will show lower overreliance rates than Oracle group

**H2 (Verifiability):** Critic group will show longer task times (System 2 engagement) but better error detection

**H3 (Cultural Context):** Baseline overreliance will be elevated in Kazakhstan (Semashko legacy); Critic paradigm will mitigate this

### Statistical Analysis Plan

1. **ANCOVA:** Learning gain ~ Paradigm × Accuracy, controlling for pre-test
2. **2×2 ANOVA:** Overreliance rate ~ Paradigm × Accuracy
3. **Moderation:** Test NFC as moderator (high-NFC users benefit more from Critic)
4. **Thematic coding:** Qualitative analysis of interviews (NVivo)

### Database Views

Pre-configured SQL views for analysis:
- `overreliance_by_group` - % agreement with AI errors
- `learning_gain_by_group` - Post-test accuracy - pre-test accuracy
- `sdt_metrics_by_group` - Autonomy, competence, engagement metrics

---

## 🔒 Ethical Considerations

- ✅ IRB approval required
- ✅ Informed consent at registration
- ✅ Data anonymization (no PII in logs)
- ✅ Debriefing after post-test (explains AI errors)
- ✅ Right to withdraw at any time

---

## 🚀 Deployment

### Vercel Deployment (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Setup (Backend)

1. Database already configured via schema.sql
2. Enable Row Level Security (RLS) policies:
```sql
-- Allow authenticated users to insert their own data
CREATE POLICY "Users can insert own data"
  ON case_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

---

## 📖 Key Implementation Notes

### Group Locking

**Middleware (`middleware.ts`):**
- Validates session integrity on every request
- Prevents group switching mid-session
- Enforces post-test delay (7 days after intervention)

**Session Persistence:**
- `localStorage` - client-side state
- Cookies - server-side middleware access
- Supabase - permanent data storage

### Foil Distribution

**Algorithm:**
```javascript
// In lib/randomization.js
selectFoilCases(interventionCases, seed)
// Returns: 30% of cases (4-5) as foils
// Ensures: Non-consecutive distribution
```

**Preparation:**
```javascript
prepareCaseForUser(caseData, accuracyLevel, foilCaseIds)
// Returns: AI recommendation = foilDiagnosis (if 70% group + foil case)
//          OR correctDiagnosis (otherwise)
```

---

## 🎓 Research Team

**Principal Investigator:** [Your Name]
**Institution:** [Medical University]
**IRB Protocol:** [Protocol Number]
**Contact:** research@meduni.kz

---

## 📚 Theoretical Foundation

This platform operationalizes principles from:

- **Buçinca et al., 2021** - Cognitive Forcing Functions reduce overreliance
- **Buçinca et al., 2025** - Contrastive explanations improve learning
- **de Jong et al., 2025** - Partial explanations activate System 2 thinking
- **Fok & Weld, 2024** - Verifiability enables complementary performance
- **Miller, 2023** - Evaluative AI paradigm for hypothesis-driven support
- **Lim et al., 2025** - Kazakhstan sociocultural context (Semashko legacy)

---

## 🐛 Troubleshooting

### Common Issues

**1. Session not persisting:**
```bash
# Clear browser storage
localStorage.clear()
# Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

**2. Supabase connection error:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
# Check Supabase project status at dashboard
```

**3. Cases not loading:**
```bash
# Verify cases.json is valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('src/data/cases.json')))"
```

---

## 📄 License

MIT License - For research and educational purposes

---

## 🙏 Acknowledgments

Built for medical education research in Kazakhstan. Special thanks to medical educators who validated clinical cases.
