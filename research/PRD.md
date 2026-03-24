# Product Requirements Document: Oracle vs. Critic Experiment Platform

**Version:** 1.0
**Last Updated:** 2026-03-24
**Status:** Design Phase
**Target Launch:** Data Collection Q2 2026

---

## 1. Executive Summary

This document specifies the functional and technical requirements for a web-based experimental platform testing two AI interaction paradigms (Oracle vs. Critic) in medical diagnosis tasks with Kazakhstan medical students.

**Core Innovation:** Implementation of "verifiable explanations" (Fok & Weld, 2024) and "cognitive forcing through partiality" (de Jong et al., 2025) to test whether evaluative AI produces better trust calibration than directive XAI.

---

## 2. The 2×2 Factorial Design: Detailed Specifications

### 2.1 Factor A: Interaction Paradigm

#### **A1: Oracle (Directive XAI) — "Recommend-and-Defend"**

**UI Flow:**
```
1. User sees clinical case presentation
2. AI immediately displays diagnosis recommendation
3. AI provides unilateral explanation (only supporting evidence)
4. User submits final diagnosis (can agree/disagree with AI)
5. User rates confidence (1-5)
```

**Interface Specifications:**
- **Diagnosis Card (Top):**
  - Large bold text: "AI RECOMMENDATION: [Diagnosis]"
  - Confidence indicator: "AI Confidence: 87%"
  - Color: Blue gradient (conveys authority)

- **Explanation Panel (Below):**
  - Header: "Why This Diagnosis?"
  - Bullet list of **only supporting** evidence
  - No contrastive information
  - All evidence visible immediately (no progressive reveal)

**Example Oracle Output:**
```
╔═══════════════════════════════════════╗
║  AI RECOMMENDATION: Pneumonia        ║
║  Confidence: 87%                      ║
╚═══════════════════════════════════════╝

Why This Diagnosis?
✓ Fever (38.9°C) indicates bacterial infection
✓ Productive cough with yellow sputum
✓ Crackles heard in right lower lobe
✓ Elevated WBC count (12,500/μL)
✓ Chest X-ray shows right lower lobe infiltrate

[Submit Your Final Diagnosis] [Agree] [Disagree]
```

---

#### **A2: Critic (Evaluative AI) — "Hypothesis-Driven Evaluation"**

**UI Flow:**
```
1. User sees clinical case presentation
2. User MUST enter their own diagnosis first (input locked until submission)
3. AI echoes user's hypothesis + provides contrastive explanation
4. User can request additional evidence progressively
5. User submits final diagnosis (may revise or keep original)
6. User rates confidence (1-5)
```

**Interface Specifications:**

**Stage 1: Mandatory Hypothesis Input**
- Large text input field: "Enter your diagnosis before viewing AI analysis"
- Submit button (locks until text entered)
- No AI output visible
- Timer starts (logs time-to-hypothesis for SDT autonomy metric)

**Stage 2: Contrastive Evidence Presentation**
- **User Hypothesis Echo:**
  ```
  You diagnosed: [User's Diagnosis]
  Let's evaluate the evidence...
  ```

- **Two-Column Layout:**
  ```
  ┌─────────────────────┬─────────────────────┐
  │  SUPPORTS           │  CHALLENGES         │
  │  Your Hypothesis    │  Your Hypothesis    │
  ├─────────────────────┼─────────────────────┤
  │  ✓ Evidence item 1  │  ✗ Evidence item 1  │
  │  ✓ Evidence item 2  │  ✗ Evidence item 2  │
  │  [Show More]        │  [Show More]        │
  └─────────────────────┴─────────────────────┘
  ```

- **Progressive Reveal Buttons (Partiality Mechanism):**
  - "Show Lab Results" (reveals hemogram, biochemistry)
  - "Show Vital Signs History" (trends over time)
  - "Compare to Differential Diagnosis" (alternative conditions)
  - Each click logged for cognitive engagement metric

**Stage 3: Final Decision**
- "Would you like to revise your diagnosis?" [Keep] [Revise]
- If revised: text input for new diagnosis + reason for change
- Confidence rating before and after AI input (calibration metric)

**Example Critic Output:**
```
╔═══════════════════════════════════════╗
║  You diagnosed: BRONCHITIS           ║
║  Let's evaluate the evidence...      ║
╚═══════════════════════════════════════╝

┌────────────────────────┬────────────────────────┐
│  SUPPORTS Bronchitis   │  CHALLENGES Bronchitis │
├────────────────────────┼────────────────────────┤
│  ✓ Productive cough    │  ✗ High fever (38.9°C) │
│  ✓ Wheezing noted      │    (uncommon in simple │
│                        │     bronchitis)         │
│  ✓ No recent antibiotic│  ✗ X-ray shows         │
│    use                 │    infiltrate (not just│
│                        │    bronchial thickening)│
│  [Show Lab Results]    │  ✗ Elevated WBC        │
│                        │    suggests bacterial  │
│                        │    infection           │
└────────────────────────┴────────────────────────┘

[Keep My Diagnosis] [Revise Diagnosis]
Confidence Before AI: [1][2][3][4][5]
Confidence After AI:  [1][2][3][4][5]
```

**Key Difference from Oracle:**
- No AI recommendation given directly
- User must engage with evidence actively
- Contrastive structure forces critical evaluation
- Progressive reveal prevents passive consumption

---

### 2.2 Factor B: AI Accuracy Levels

#### **B1: High Reliability (100% Accuracy)**
- All AI recommendations are correct
- All contrastive evidence accurately reflects clinical reality
- **Purpose:** Baseline for optimal human-AI performance
- **Cases:** 14-15 cases, all correct

#### **B2: Calibrated Reliability (70% / 30%)**
- **70% correct recommendations** (10-11 cases)
- **30% sensible foils** (4-5 cases) — plausible but incorrect
- **Purpose:** Test overreliance and trust calibration
- **Error distribution:**
  - Foils spread across case types (respiratory, cardiac, infectious)
  - Never consecutive errors (avoid pattern learning)
  - Errors occur in cases with ambiguous presentations

---

## 3. Sensible Foils: Implementation Logic

### 3.1 Criteria for "Sensible" Errors

A sensible foil must satisfy ALL of the following:

1. **Differential Diagnosis Proximity**
   - Foil shares ≥50% of clinical features with correct diagnosis
   - Both conditions appear in standard differential diagnosis lists

2. **Common Student Error Pattern**
   - Documented in medical education literature as frequent mistake
   - Example: Confusing bronchitis and pneumonia (both have cough, fever)

3. **Plausible Reasoning Path**
   - A reasonable clinician could make this error under time pressure
   - NOT a blatantly absurd error (e.g., diagnosing pregnancy in male)

4. **Testable Through Verification**
   - Correct diagnosis can be determined by examining objective data
   - Evidence in case presentation enables users to catch the error

### 3.2 Sensible Foils Database (Examples)

| Case Type | Correct Diagnosis | Sensible Foil | Shared Features | Key Differentiator |
|-----------|-------------------|---------------|-----------------|-------------------|
| Respiratory | **Pneumonia** | Bronchitis | Cough, fever, chest discomfort | X-ray infiltrate (pneumonia), normal X-ray (bronchitis) |
| Cardiac | **Myocardial Infarction** | Unstable Angina | Chest pain, dyspnea, sweating | Troponin elevation (MI), normal troponin (angina) |
| Infectious | **Bacterial Meningitis** | Viral Meningitis | Fever, headache, neck stiffness | CSF analysis: high neutrophils (bacterial), lymphocytes (viral) |
| Endocrine | **Diabetic Ketoacidosis** | Hyperosmolar State | Hyperglycemia, dehydration, confusion | Ketones present (DKA), absent (HHS) |
| GI | **Appendicitis** | Gastroenteritis | Abdominal pain, nausea, fever | Localized RLQ tenderness + rebound (appendicitis) |

### 3.3 Technical Implementation

**Case Configuration Schema:**
```json
{
  "case_id": "RESP_003",
  "correct_diagnosis": "Pneumonia",
  "foil_diagnosis": "Acute Bronchitis",
  "foil_rationale": "Students over-weight cough/fever, under-weight X-ray findings",
  "accuracy_condition": "70%",
  "foil_probability": 0.30,
  "evidence_for_correct": [
    "Chest X-ray: right lower lobe infiltrate",
    "Temperature 38.9°C (high-grade fever)",
    "WBC 12,500/μL (elevated)",
    "Crackles in right lung base"
  ],
  "evidence_for_foil": [
    "Productive cough with mucus",
    "Recent upper respiratory infection",
    "No recent antibiotic use"
  ],
  "key_discriminator": "X-ray infiltrate (definitive for pneumonia)"
}
```

**Randomization Logic:**
- User in B2 (70% accuracy) group receives 4-5 foil cases
- Foils distributed evenly across session (not clustered)
- Each foil appears in different case type (respiratory, cardiac, etc.)
- Order randomized per participant but logged for analysis

---

## 4. Self-Determination Theory (SDT) Logging Architecture

### 4.1 SDT Constructs Mapping

**Autonomy:** User perceives control over decisions
- **Observable Indicators:**
  - Time spent formulating hypothesis before AI input
  - Frequency of disagreement with AI
  - Use of "Revise Diagnosis" option

**Competence:** User perceives skill development
- **Observable Indicators:**
  - Confidence ratings (pre/post AI input)
  - Correct detection of AI errors (overreliance rate)
  - Learning gain (post-test - pre-test accuracy)

**Relatedness:** User perceives AI as collaborative partner
- **Observable Indicators:**
  - Subjective trust ratings
  - Qualitative interview themes (AI as "mentor" vs "authority")
  - Willingness to explore evidence (Critic group)

### 4.2 Database Schema: Interaction Logs

**Table: `case_interactions`**
```sql
CREATE TABLE case_interactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  session_id UUID REFERENCES sessions(id),
  case_id VARCHAR(50),

  -- Experimental conditions
  paradigm VARCHAR(10) CHECK (paradigm IN ('oracle', 'critic')),
  accuracy_level VARCHAR(10) CHECK (accuracy_level IN ('high', 'calibrated')),
  ai_correctness BOOLEAN, -- TRUE if AI recommendation is correct

  -- Timestamps (for task completion time)
  timestamp_case_start TIMESTAMP NOT NULL,
  timestamp_hypothesis_submitted TIMESTAMP, -- Critic only
  timestamp_ai_output_viewed TIMESTAMP,
  timestamp_final_decision TIMESTAMP NOT NULL,

  -- User inputs
  user_hypothesis VARCHAR(200), -- Critic only
  user_final_diagnosis VARCHAR(200) NOT NULL,
  user_confidence_pre INTEGER CHECK (user_confidence_pre BETWEEN 1 AND 5),
  user_confidence_post INTEGER CHECK (user_confidence_post BETWEEN 1 AND 5),

  -- Decision outcomes
  ai_recommendation VARCHAR(200) NOT NULL,
  correct_diagnosis VARCHAR(200) NOT NULL,
  user_agreed_with_ai BOOLEAN,
  user_initially_correct BOOLEAN, -- Critic: hypothesis accuracy
  user_finally_correct BOOLEAN, -- Final diagnosis accuracy

  -- Cognitive engagement (Critic only)
  evidence_requests JSONB, -- Array of clicked evidence panels
  hypothesis_revised BOOLEAN, -- Did user change initial hypothesis?
  revision_reason TEXT,

  -- SDT Metrics
  time_to_hypothesis_seconds INTEGER, -- Autonomy proxy
  time_viewing_evidence_seconds INTEGER, -- Competence engagement
  disagreed_with_ai_despite_high_confidence BOOLEAN, -- Autonomy indicator

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_paradigm ON case_interactions(user_id, paradigm);
CREATE INDEX idx_overreliance ON case_interactions(ai_correctness, user_agreed_with_ai);
```

**Table: `evidence_exploration` (Critic Group Only)**
```sql
CREATE TABLE evidence_exploration (
  id UUID PRIMARY KEY,
  interaction_id UUID REFERENCES case_interactions(id),

  evidence_type VARCHAR(50), -- 'lab_results', 'vitals', 'differential'
  timestamp_revealed TIMESTAMP NOT NULL,
  time_spent_viewing_seconds INTEGER,
  user_scrolled_through BOOLEAN,

  -- Partiality tracking
  reveal_stage INTEGER, -- 1 = first partial, 2 = second, etc.
  total_evidence_revealed INTEGER,
  user_requested_more BOOLEAN
);
```

### 4.3 Real-Time Event Logging

**Client-Side Events to Capture:**
```javascript
// Example event structure
{
  "event_type": "evidence_panel_opened",
  "timestamp": "2026-03-24T14:32:15.234Z",
  "interaction_id": "uuid-here",
  "metadata": {
    "panel_type": "lab_results",
    "reveal_stage": 2,
    "time_since_hypothesis": 45.2 // seconds
  }
}
```

**Critical Events:**
- `case_presented` — User sees case
- `hypothesis_submitted` — Critic user enters diagnosis
- `ai_output_viewed` — User sees AI explanation
- `evidence_panel_opened` — User clicks progressive reveal
- `confidence_rated` — Pre/post ratings submitted
- `diagnosis_revised` — Critic user changes answer
- `final_decision_submitted` — User confirms diagnosis

---

## 5. Partial Explanation Reveal Mechanism (Critic Group)

### 5.1 Progressive Stages Design

**Stage 0: Case Presentation**
- User sees patient history, chief complaint, physical exam
- NO AI output visible
- Input field for hypothesis (required)

**Stage 1: Initial Contrastive Structure**
- After hypothesis submitted, reveal:
  - 2-3 key pieces of evidence FOR hypothesis
  - 2-3 key pieces of evidence AGAINST hypothesis
- Show buttons: "Show Lab Results" | "Show Vital Signs" | "Compare Alternatives"
- **Rationale:** Provides scaffolding but withholds details to prevent passive acceptance

**Stage 2: Lab Results (on demand)**
- User clicks "Show Lab Results"
- Reveal: CBC, CMP, urinalysis, relevant cultures
- Each result annotated with normal ranges
- Highlight abnormal values
- **Rationale:** Activates verification behavior

**Stage 3: Vital Signs Trends (on demand)**
- User clicks "Show Vital Signs"
- Reveal: Time-series chart of temp, BP, HR, RR
- Shows trajectory (improving vs. worsening)
- **Rationale:** Temporal data aids in severity assessment

**Stage 4: Differential Diagnosis Comparison (on demand)**
- User clicks "Compare Alternatives"
- Reveal: Table comparing user's hypothesis to 2-3 similar conditions
- Shows which features match/mismatch each condition
- **Rationale:** Scaffolds differential diagnosis reasoning

### 5.2 UI Component: Progressive Reveal Button

**Design Specifications:**
- Button state changes after click:
  - Before: "Show Lab Results" (blue, actionable)
  - After: "Lab Results" (gray, shows viewed)
- Animated expansion of evidence panel (300ms slide-down)
- Badge shows "New Evidence Available" (3) to indicate un-revealed panels

**Accessibility:**
- Screen reader announces: "Additional evidence available. Click to reveal."
- Keyboard navigation: Tab to button, Enter to expand

### 5.3 A/B Comparison: Oracle vs. Critic Evidence Reveal

| Aspect | Oracle | Critic |
|--------|--------|--------|
| **Initial State** | All evidence visible immediately | Only hypothesis echo + 2-3 key points |
| **User Action Required** | None (passive consumption) | Must click to see full evidence |
| **Evidence Structure** | Unilateral (only supports AI) | Contrastive (for AND against) |
| **Cognitive Load** | Low (easy to process) | Higher (requires active evaluation) |
| **Goal** | Persuade user of AI's correctness | Enable user to verify AI's reasoning |

---

## 6. Sociocultural Calibration: Kazakhstan-Specific Features

### 6.1 Mandatory Hypothesis Input (Anti-Semashko Mechanism)

**Problem:** Hierarchical Semashko system trained students to accept authority without questioning.

**Solution:** Force "dialogue" by blocking AI output until user commits to a hypothesis.

**Implementation:**
```javascript
// Pseudo-code
function CriticInterface() {
  const [hypothesisSubmitted, setHypothesisSubmitted] = useState(false);

  return (
    <div>
      <CasePresentation data={caseData} />

      {!hypothesisSubmitted && (
        <HypothesisInput
          onSubmit={(hypothesis) => {
            logEvent('hypothesis_submitted', hypothesis);
            setHypothesisSubmitted(true);
          }}
          required={true}
          placeholder="Enter your diagnosis before viewing AI analysis"
        />
      )}

      {hypothesisSubmitted && (
        <ContrastiveEvidence hypothesis={userHypothesis} />
      )}
    </div>
  );
}
```

**Validation:** Input field requires ≥3 characters (prevents "idk" responses)

### 6.2 Terminological Dissociation Test

**Context:** Post-Soviet medical education uses outdated terms (e.g., "osteochondrosis," "vegetovascular dystonia") not recognized in ICD-11.

**Implementation:**
- Include 2-3 cases where:
  - **Local terminology** is common in Kazakhstan (e.g., "остеохондроз")
  - **ICD-11 terminology** is more evidence-based (e.g., "degenerative disc disease")
- AI uses ICD-11 terms exclusively
- Measure: Do students trust AI despite terminological mismatch?

**Example Case:**
```
Patient: 35-year-old female, lower back pain
Local diagnosis (common): "Osteochondrosis"
AI diagnosis (ICD-11): "Lumbar degenerative disc disease"

Evidence shown:
- MRI: disc space narrowing at L4-L5
- No nerve root compression
- Pain exacerbated by prolonged sitting

Question: Will students trust evidence-based terminology over familiar post-Soviet label?
```

### 6.3 Localization Requirements

**Language Support:**
- Interface available in Russian (primary) and Kazakh (secondary)
- Clinical terminology follows ICD-11 (English codes mapped to Russian/Kazakh)
- Consent forms and debriefing in both languages

**Cultural Adaptation:**
- Interview questions reference Kazakhstan-specific contexts (e.g., "клиники РК," "дефицит специалистов в регионах")
- Case scenarios use common local presentations (e.g., tuberculosis prevalence)

---

## 7. Experimental Flow: Detailed Protocol

### Phase 1: Pre-Test (Baseline Assessment)

**Duration:** 30-40 minutes
**Cases:** 5 clinical vignettes
**AI Support:** None (independent work)

**Procedure:**
1. User sees case presentation (2-3 paragraphs + vitals)
2. User enters diagnosis (text input)
3. User rates confidence (1-5 scale)
4. System records answer + timestamp
5. NO FEEDBACK on correctness (to avoid learning effects)

**Metrics Logged:**
- `pre_test_accuracy` = (correct diagnoses / 5)
- `pre_test_confidence_avg` = mean confidence rating
- `pre_test_time_per_case` = avg completion time

**Purpose:** ANCOVA covariate to control for prior knowledge differences

---

### Phase 2: NFC Assessment

**Duration:** 5 minutes
**Instrument:** Short Need for Cognition Scale (Cacioppo et al., 1984)

**Sample Items (18-item version):**
1. "I would prefer complex to simple problems."
2. "I like to have the responsibility of handling situations that require a lot of thinking."
3. "Thinking is not my idea of fun." (reverse-scored)

**Scoring:**
- Responses: 1 (strongly disagree) to 5 (strongly agree)
- Total score: 18-90 (higher = greater need for cognition)
- **Median split:** High-NFC (≥54) vs. Low-NFC (<54)

**Purpose:** Test moderation hypothesis — Critic paradigm may benefit high-NFC users more

---

### Phase 3: Intervention (AI-Assisted Cases)

**Duration:** 90-120 minutes
**Cases:** 14-15 clinical vignettes
**AI Support:** Assigned paradigm (Oracle or Critic) × Assigned accuracy (100% or 70%)

**Case Distribution (for 70% Accuracy Groups):**
- Cases 1-3: Correct (warmup)
- Case 4: Foil #1 (first error)
- Cases 5-7: Correct
- Case 8: Foil #2
- Cases 9-11: Correct
- Case 12: Foil #3
- Cases 13-14: Correct
- Case 15: Foil #4 (final error test)

**Procedure Per Case:**
1. Case presentation (1-2 minutes reading)
2. *[Critic only: Hypothesis input (1-2 minutes)]*
3. AI output display (Oracle: immediate; Critic: after hypothesis)
4. Evidence exploration (Critic: progressive reveal; Oracle: all at once)
5. Final diagnosis submission (can agree/disagree with AI)
6. Confidence rating (pre/post for Critic)
7. Next case (no feedback on correctness until debriefing)

**Metrics Logged:**
- `intervention_accuracy` = (correct final diagnoses / 15)
- `overreliance_rate` = (agreed with AI errors / total errors)
- `task_completion_time_avg` = mean time per case
- `evidence_exploration_depth` = # panels clicked (Critic only)

**Breaks:** Mandatory 5-minute break after cases 5 and 10 (prevent fatigue)

---

### Phase 4: Post-Test (Learning Transfer Assessment)

**Timing:** One week after intervention
**Duration:** 30-40 minutes
**Cases:** 5 NEW clinical vignettes (different from pre-test)
**AI Support:** None (independent work)

**Procedure:** Identical to pre-test (no AI assistance)

**Metrics Logged:**
- `post_test_accuracy` = (correct diagnoses / 5)
- `post_test_confidence_avg` = mean confidence rating
- `post_test_time_per_case` = avg completion time

**Key Metric:** `learning_gain = post_test_accuracy - pre_test_accuracy`

**Purpose:** Measure whether interaction paradigm improved independent diagnostic skill (not just AI-assisted performance)

---

### Phase 5: Subjective Assessment

**Duration:** 15-20 minutes

**5.1 Likert Scales**

**Perceived Autonomy (from Intrinsic Motivation Inventory):**
- "I felt like it was my choice to make the final diagnosis."
- "I felt pressured to agree with the AI." (reverse-scored)
- "I felt like I was in control of the diagnostic process."

**Trust Calibration:**
- "I trust the AI's recommendations even when I initially disagreed."
- "I carefully evaluated the AI's reasoning before accepting its advice."
- "I felt confident distinguishing correct from incorrect AI suggestions."

**NASA-TLX (Cognitive Load):**
- Mental Demand (1-5)
- Effort (1-5)
- Frustration (1-5)

**5.2 Semi-Structured Interview (20-30 minutes)**

**Block 1: Interface Experience**
- "In which system did you feel more control over the final diagnosis? Why?"
- "[Critic users] How did you feel about entering your diagnosis before seeing the AI's analysis?"
- "[Oracle users] Did you ever question the AI's recommendation? What stopped you from disagreeing?"

**Block 2: Evidence Evaluation**
- "What made you trust or distrust the AI's reasoning?"
- "[Critic users] Did the 'for and against' structure help you think more critically?"
- "Were there cases where you caught an error by the AI? How did you notice it?"

**Block 3: Sociocultural Context**
- "If a senior professor gave advice without explaining, and the AI gave a different answer with evidence, who would you trust?"
- "Do Kazakhstan clinics encourage questioning colleagues' opinions, or is there pressure to defer to authority?"
- "Would the 'Critic' format help young doctors in regional hospitals where there are fewer specialists?"

**Block 4: Future Preferences**
- "Which interface would you want on your work tablet in 5 years?"
- "What changes would make the AI system more useful for learning?"

**Analysis:** Thematic coding (NVivo or Atlas.ti) for:
- Authority deference themes
- Verifiability strategies
- Autonomy vs. efficiency trade-offs

---

## 8. Technical Stack Recommendations

### 8.1 Frontend

**Framework:** React 18+ with TypeScript
- **Rationale:** Component-based architecture suits Oracle/Critic UI variants
- **State Management:** Zustand (lightweight, easier than Redux for experimental apps)
- **UI Library:** Tailwind CSS + shadcn/ui (accessible components)
- **Animations:** Framer Motion (for progressive reveal transitions)

**Key Libraries:**
- `react-hook-form` — Form validation (hypothesis input)
- `recharts` — Vital signs time-series visualization
- `i18next` — Internationalization (Russian/Kazakh)

### 8.2 Backend

**Framework:** Node.js with Express (or Python FastAPI)
- **Rationale:** Fast development, good for REST APIs

**Key Requirements:**
- **Authentication:** JWT-based (user_id stored in token)
- **Randomization:** Cryptographically secure RNG for group assignment
- **Session Management:** Store paradigm/accuracy assignment in DB
- **Logging:** Real-time event streaming to database

**API Endpoints:**
```
POST /api/auth/register      # User registration + group assignment
POST /api/sessions/start     # Begin pre-test/intervention/post-test
GET  /api/cases/:case_id     # Fetch case presentation
POST /api/interactions       # Log case interaction (diagnosis, timestamps)
POST /api/events             # Log UI events (clicks, scrolls)
POST /api/assessments        # Submit Likert scales
GET  /api/results/:user_id   # Admin: retrieve user data
```

### 8.3 Database

**RDBMS:** PostgreSQL 15+
- **Rationale:** JSONB support for flexible event logging
- **Schema:** See Section 4.2 above

**Tables:**
- `users` — Demographics, consent, NFC scores
- `sessions` — Pre-test, intervention, post-test sessions
- `cases` — Case library (presentations, correct diagnoses, foils)
- `case_interactions` — Primary data table (see Section 4.2)
- `evidence_exploration` — Critic group partiality tracking
- `ui_events` — Granular event logs (clicks, scrolls)
- `assessments` — Likert scale responses
- `interviews` — Transcripts (qualitative)

### 8.4 Infrastructure

**Hosting:**
- **Frontend:** Vercel or Netlify (static hosting + CDN)
- **Backend:** Railway, Render, or DigitalOcean App Platform
- **Database:** Managed PostgreSQL (e.g., Supabase, Neon)

**Monitoring:**
- **Error Tracking:** Sentry
- **Analytics:** PostHog (privacy-friendly, self-hostable)
- **Uptime:** UptimeRobot (alert if system down)

**Backups:**
- Automated daily backups of PostgreSQL
- Export logs to S3 bucket weekly

---

## 9. Data Analysis Plan

### 9.1 Primary Analyses (Quantitative)

**H1: Trust Calibration (Overreliance Rate)**

*Dependent Variable:* `overreliance_rate` = (agreed with AI errors / total errors)
*Independent Variables:* Paradigm (Oracle/Critic) × Accuracy (100%/70%)
*Statistical Test:* 2×2 ANOVA
*Expected Result:* Critic < Oracle in 70% condition (lower overreliance)

**H2: Learning Gain (Post-Test - Pre-Test)**

*Dependent Variable:* `learning_gain` = post_test_accuracy - pre_test_accuracy
*Independent Variables:* Paradigm × Accuracy
*Covariate:* pre_test_accuracy (ANCOVA)
*Statistical Test:* 2×2 ANCOVA
*Expected Result:* Critic > Oracle (greater learning transfer)

**H3: Task Completion Time (Cognitive Engagement)**

*Dependent Variable:* `time_per_case_avg` (intervention phase)
*Independent Variables:* Paradigm × Accuracy
*Statistical Test:* 2×2 ANOVA
*Expected Result:* Critic > Oracle (longer time indicates System 2 engagement)

### 9.2 Moderation Analyses

**NFC as Moderator:**

*Research Question:* Does Critic paradigm benefit high-NFC users more?
*Model:* `learning_gain ~ Paradigm × NFC_level × Accuracy + pre_test_accuracy`
*Statistical Test:* Multiple regression with interaction terms
*Expected Result:* Significant Paradigm × NFC interaction (high-NFC users gain more from Critic)

### 9.3 Qualitative Analysis

**Thematic Coding (NVivo):**

**Codebook (Preliminary):**
- **Authority Deference**
  - "Trust in hierarchy" (Semashko legacy)
  - "Questioning seniors" (cultural norms)
- **Verification Strategies**
  - "Checking evidence" (active verification)
  - "Relying on AI confidence" (passive acceptance)
- **Autonomy Perception**
  - "Felt in control" (Critic users)
  - "Pressured to agree" (Oracle users)
- **Learning Perception**
  - "Helped me think critically" (Critic)
  - "Made it easier but learned less" (Oracle)

**Inter-Rater Reliability:** Cohen's kappa > 0.70 (two independent coders)

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
- [ ] Set up project repository (GitHub)
- [ ] Initialize frontend (React + TypeScript + Tailwind)
- [ ] Initialize backend (Node.js + Express)
- [ ] Set up PostgreSQL database + schema
- [ ] Implement authentication (JWT)
- [ ] Deploy staging environment (Vercel + Railway)

### Phase 2: Core Experiment Logic (Weeks 3-5)
- [ ] Build case presentation component
- [ ] Implement Oracle interface (recommend-and-defend)
- [ ] Implement Critic interface (hypothesis-driven)
- [ ] Build progressive reveal mechanism (Critic partiality)
- [ ] Implement randomization logic (2×2 assignment)
- [ ] Build logging system (interactions + events)

### Phase 3: Case Content Development (Weeks 5-6)
- [ ] Create 25 clinical cases (5 pre-test + 15 intervention + 5 post-test)
- [ ] Define sensible foils for 70% accuracy condition
- [ ] Validate cases with medical educators (SME review)
- [ ] Translate cases to Russian + Kazakh
- [ ] Load cases into database

### Phase 4: Assessment Tools (Weeks 7-8)
- [ ] Implement NFC questionnaire
- [ ] Implement Likert scales (autonomy, trust, NASA-TLX)
- [ ] Build interview scheduling system
- [ ] Create admin dashboard (data export)
- [ ] Implement consent form + debriefing

### Phase 5: Testing & Validation (Weeks 9-10)
- [ ] Unit tests (backend API endpoints)
- [ ] Integration tests (full user flow)
- [ ] Pilot test with 5-10 medical students
- [ ] Fix bugs identified in pilot
- [ ] Validate randomization balance
- [ ] Confirm logging accuracy (100% data capture)

### Phase 6: Data Collection (Weeks 11-18)
- [ ] Recruit N=120 participants (medical schools in Kazakhstan)
- [ ] Monitor data collection (daily checks)
- [ ] Conduct semi-structured interviews (qualitative)
- [ ] Weekly backups of database
- [ ] Handle technical support requests

### Phase 7: Analysis & Reporting (Weeks 19-22)
- [ ] Clean and prepare dataset
- [ ] Run ANCOVA and ANOVA tests (primary hypotheses)
- [ ] Conduct moderation analyses (NFC)
- [ ] Perform thematic coding (interviews)
- [ ] Generate visualizations (plots, tables)
- [ ] Write research paper (results + discussion)

---

## 11. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Low recruitment rate** | Insufficient N for power | Medium | Partner with 3+ medical schools; offer incentives (certificates, small payment) |
| **High attrition (dropout)** | Incomplete data | Medium | Keep sessions short (max 2 hours); mandatory breaks; reminder emails for post-test |
| **Technical failures (downtime)** | Data loss, user frustration | Low | 99% uptime target; automated backups; error monitoring (Sentry) |
| **Participants guess experiment purpose** | Demand characteristics | Medium | Debrief only after post-test; use neutral language ("testing interface designs") |
| **Cultural resistance to Critic paradigm** | Users refuse to enter hypothesis | Medium | Emphasize learning goal; pilot test instructions; provide examples |
| **Sensible foils too obvious/too subtle** | Overreliance rate at ceiling/floor | Medium | Pilot test with N=10; adjust foil difficulty; validate with medical educators |

---

## 12. Ethical Considerations

**IRB Approval Required:** Yes (involves human participants)

**Informed Consent:**
- Participants informed that AI will make errors in some cases
- Right to withdraw at any time without penalty
- Data anonymized (no PII linked to responses)

**Debriefing:**
- After post-test, explain which cases had AI errors
- Clarify that errors were intentional (not system malfunction)
- Provide correct diagnoses for all cases

**Data Privacy:**
- GDPR/Kazakhstan data protection compliance
- No identifiable health information (all cases are fictional)
- Database encrypted at rest and in transit

**Potential Harms:**
- **Minimal risk:** Educational context (not real patients)
- **Mitigation:** Debrief explains learning purpose

---

## 13. Success Metrics

### Research Success Criteria

| Metric | Target | Minimum Acceptable |
|--------|--------|-------------------|
| **Sample Size** | N=120 (30 per group) | N=100 (25 per group) |
| **Attrition Rate** | <10% | <20% |
| **Statistical Power** | 0.80 (detect medium effect size) | 0.70 |
| **Data Completeness** | 100% logs captured | 95% logs captured |
| **Interview Completion** | 30 interviews (25% of sample) | 20 interviews |

### Implementation Success Criteria

| Metric | Target |
|--------|--------|
| **System Uptime** | >99% during data collection |
| **Zero Data Loss** | 100% of interactions logged |
| **User-Reported Issues** | <5% experience technical problems |
| **Task Completion Time** | Median 5-10 min per case (within expected range) |

---

## 14. Next Steps

**Immediate Actions:**
1. Review this PRD with research team and medical educators
2. Obtain IRB approval (submit protocol + consent forms)
3. Begin Phase 1 implementation (foundation setup)
4. Recruit medical schools for pilot testing (N=10)

**Dependencies:**
- IRB approval (estimated 4-6 weeks)
- Medical school partnerships (institutional agreements)
- Case content validation by Subject Matter Experts (SMEs)

**Key Decisions Pending:**
- Final case selection (25 cases total)
- Exact foil difficulty calibration (pilot test required)
- Incentive structure for participants (certificates? payment?)

---

**Document Status:** Ready for team review and IRB submission preparation.

**Contact:** [Your Name], Principal Investigator
**Last Updated:** 2026-03-24
