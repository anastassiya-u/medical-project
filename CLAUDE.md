# Project Constitution: Oracle vs. Critic Experiment Platform

## Project Overview

This platform implements a **2×2 between-subjects factorial experiment** to test trust calibration in Human-AI collaboration among medical students in Kazakhstan. The research tests whether **evaluative AI** (Critic) produces better trust calibration and learning outcomes compared to **directive XAI** (Oracle), while accounting for AI reliability levels.

---

## Theoretical Foundation

### Core Research Question
**Which interaction paradigm—Oracle (directive) or Critic (evaluative)—builds safer, more calibrated trust among medical students when AI accuracy varies?**

### The 2×2 Factorial Design

| Factor | Level 1 | Level 2 |
|--------|---------|---------|
| **Factor A: Interaction Paradigm** | Oracle (Directive XAI) | Critic (Evaluative AI) |
| **Factor B: AI Accuracy** | High Reliability (100%) | Calibrated Reliability (70% correct / 30% sensible foils) |

**Four Experimental Groups:**
1. **Oracle × High (100%)** — Directive explanations, perfect accuracy
2. **Oracle × Calibrated (70%)** — Directive explanations, 30% sensible errors
3. **Critic × High (100%)** — Evaluative explanations, perfect accuracy
4. **Critic × Calibrated (70%)** — Evaluative explanations, 30% sensible errors

---

## Critical Implementation Layers

### Layer 1: Cognitive Forcing Through Partiality (de Jong et al., 2025)

**Theoretical Basis:** Partial explanations activate "System 2" thinking by forcing users to fill in logical gaps independently, preventing the "illusion of explanatory depth."

**Implementation Requirements for Critic Group:**
- Evidence must be revealed **progressively**, not all at once
- Users must actively request additional evidence (e.g., "Show Lab Results," "Show Vital Signs")
- Initial state: Show ONLY the user's hypothesis echo + indication that evidence exists
- Progressive stages:
  1. **Stage 1:** Symptom alignment (partial matching)
  2. **Stage 2:** Lab/vitals data (upon request)
  3. **Stage 3:** Differential diagnosis comparison (upon request)
- **Rationale:** This prevents passive consumption and forces active sensemaking

**Oracle Group (Control):**
- All evidence is presented immediately with the AI's diagnosis
- No progressive reveal—full unilateral explanation at once

---

### Layer 2: Evidence vs. Process Verifiability (Fok & Weld, 2024)

**Theoretical Basis:** Most XAI methods explain *process* (how AI decided) but fail to provide *verifiability* (whether the decision is correct). Verifiable evidence enables complementary performance.

**Critic Group Requirements:**
- **FOR hypothesis:** Must list objective clinical facts supporting the user's diagnosis
  - Example: "Elevated WBC count (12,500/μL) supports bacterial infection"
  - Example: "Patient reports productive cough with yellow sputum"
- **AGAINST hypothesis:** Must list objective clinical facts contradicting the user's diagnosis
  - Example: "Chest X-ray shows no consolidation (pneumonia unlikely)"
  - Example: "Temperature 37.2°C (no significant fever)"

**What NOT to show (avoid process explanations):**
- ❌ "The model assigned 85% confidence to this diagnosis"
- ❌ "Feature importance: symptom X contributed 0.42 to the score"
- ✅ "Symptom X is present; typically indicates condition Y"

**Oracle Group (Contrast):**
- Shows only evidence that **confirms** the AI's recommended diagnosis
- No contrastive structure—unilateral justification

---

### Layer 3: Sociocultural Calibration (Lim et al., 2025)

**Context:** Kazakhstan's Semashko system legacy created hierarchical, top-down communication where authority is rarely questioned. This increases overreliance risk.

**Mandatory Hypothesis Input (Critic Only):**
- UI must **block** AI output until the user submits their own diagnosis
- Prevents "anchoring bias" from AI's recommendation
- Forces "dialogue" instead of "monologue"
- **Implementation:** Input field + "Submit My Hypothesis" button → locks until pressed

**Terminological Dissociation Test:**
- Include cases with post-Soviet terminology (e.g., "osteochondrosis") to test trust when AI uses Western ICD-11 alternatives
- Measure if students defer to localized terms (authority bias) or adopt evidence-based reasoning

**Oracle Group (Contrast):**
- No mandatory hypothesis input
- AI presents diagnosis immediately, replicating hierarchical authority model

---

### Layer 4: Self-Determination Theory (SDT) Logging

**Theoretical Basis:** Intrinsic motivation is sustained by satisfying three psychological needs: Competence, Autonomy, Relatedness (Deci & Ryan, 2000).

**Logging Requirements for Every Interaction:**

| SDT Construct | Observable Indicators | Logged Events |
|---------------|----------------------|---------------|
| **Autonomy** | User feels in control of diagnosis decision | - Time spent before viewing AI output<br>- Frequency of hypothesis revisions<br>- Clicks on "Disagree with AI" |
| **Competence** | User perceives skill growth | - Confidence ratings before/after AI input<br>- Self-correction events<br>- "I need more evidence" button clicks |
| **Relatedness** | User perceives AI as collaborative partner vs. authority | - Interview responses (qualitative)<br>- Trust calibration scores<br>- "AI helped me learn" Likert ratings |

**Database Schema Requirements:**
- Each case interaction must log:
  - `timestamp_case_start`
  - `timestamp_hypothesis_submitted` (Critic only)
  - `timestamp_first_evidence_reveal` (Critic only)
  - `timestamp_final_decision`
  - `user_hypothesis` (Critic only)
  - `user_final_diagnosis`
  - `ai_recommendation`
  - `user_agreed_with_ai` (boolean)
  - `evidence_requests` (array: which evidence panels user clicked)
  - `confidence_pre` (1-5 scale)
  - `confidence_post` (1-5 scale)

---

## Sensible Foils: The 30% Error Logic

**Requirement:** Errors must be **likely human misconceptions**, not random noise.

**Implementation Strategy:**
1. **Base foils on differential diagnosis proximity:**
   - If correct diagnosis is "Pneumonia," the foil should be "Bronchitis" (similar symptoms)
   - NOT "Appendicitis" (random unrelated condition)

2. **Use predicted foils from literature (Buçinca et al., 2025):**
   - Identify common student errors from pre-test data
   - AI "makes mistakes" that match novice reasoning patterns
   - Example: Over-weighting salient symptoms (fever) and under-weighting base rates

3. **Sensible foil criteria:**
   - ✅ Shares ≥2 clinical features with correct diagnosis
   - ✅ Represents a plausible alternative in differential diagnosis
   - ✅ Has been documented as a common student error
   - ❌ Cannot be blatantly wrong (e.g., diagnosing male with ovarian cyst)

4. **Distribution across case set:**
   - 70% correct recommendations (10-11 cases)
   - 30% sensible foils (4-5 cases)
   - Errors distributed evenly across case types (infectious, cardiovascular, respiratory, etc.)

**Rationale:** This tests whether users can **verify** AI advice rather than blindly accepting plausible-sounding errors.

---

## Randomization Protocol

**Requirement:** Participants must be randomly assigned to one of four groups **before** seeing any case material.

**Implementation:**
1. **Pre-registration phase:**
   - Student provides ID, consent, demographics
   - System assigns random number (1-4) using cryptographic RNG
   - Mapping:
     - 1 → Oracle × High (100%)
     - 2 → Oracle × Calibrated (70%)
     - 3 → Critic × High (100%)
     - 4 → Critic × Calibrated (70%)

2. **Session persistence:**
   - User's group assignment stored in database
   - All subsequent interactions (pre-test, intervention, post-test) use same group logic
   - No mid-session group changes

3. **Balancing:**
   - Check group counts periodically
   - If imbalance exceeds threshold (e.g., |n₁ - n₂| > 5), use stratified randomization
   - Target: N=120 total (n=30 per group)

---

## Experimental Flow

### Phase 1: Pre-Test (Baseline)
- **5 clinical cases** solved independently
- NO AI assistance
- **Metrics:** Initial accuracy, baseline confidence
- **Purpose:** ANCOVA covariate to control for prior knowledge

### Phase 2: NFC Assessment
- **Short Need for Cognition scale** (Cacioppo et al., 1984)
- **Purpose:** Test moderation hypothesis (H2): Critic benefits high-NFC users more

### Phase 3: Intervention (AI-Assisted Cases)
- **14-15 clinical cases** with assigned AI paradigm
- **30% cases include sensible foils** (errors)
- **Metrics:**
  - Task completion time
  - Overreliance rate (% agreement with incorrect AI)
  - Evidence exploration depth (Critic only)
  - Confidence calibration

### Phase 4: Post-Test (Learning Transfer)
- **5 new clinical cases** (one week later)
- NO AI assistance
- **Metrics:** Learning gain (post-test accuracy - pre-test accuracy)
- **Purpose:** Measure whether interaction paradigm improved independent diagnostic skill

### Phase 5: Subjective Assessment
- **Likert scales:**
  - Perceived Autonomy (from IMI)
  - Trust Calibration
  - NASA-TLX (cognitive load)
- **Semi-structured interview** (qualitative)

---

## Primary Hypotheses

**H1 (Trust Calibration):** The Critic paradigm will produce significantly lower overreliance rates compared to Oracle, especially in the 70% accuracy condition.

**H2 (Verifiability → Analytical Thinking):** Critic users will show longer task completion times (indicating System 2 engagement) but higher accuracy on error-detection tasks.

**H3 (Semashko Legacy Moderation):** In the Kazakhstan context, baseline overreliance rates will be elevated compared to Western benchmarks. Cognitive forcing functions (Critic + mandatory hypothesis) will mitigate this effect.

**Analysis Plan:**
- **ANCOVA:** Learning gain ~ Paradigm × Accuracy, controlling for pre-test score
- **Moderation:** Test NFC as moderator (high-NFC users benefit more from Critic)
- **Thematic coding:** Analyze interviews for cultural factors (authority deference, verifiability)

---

## Technical Architecture Principles

1. **Separation of Concerns:**
   - UI layer: React components for Oracle/Critic interfaces
   - Logic layer: Experiment orchestration (case selection, randomization)
   - Data layer: PostgreSQL for structured logs + SDT metrics
   - Analysis layer: Python (statsmodels, scipy) for ANCOVA

2. **Reproducibility:**
   - All randomization seeds logged
   - Case order randomized per user but logged
   - Exact timestamps for all interactions

3. **Ethical Considerations:**
   - Informed consent required
   - Data anonymized (no PII in logs)
   - Debrief explains AI errors after completion
   - Right to withdraw at any time

4. **Localization:**
   - Interface available in Russian and Kazakh
   - Clinical terminology uses ICD-11 but tests post-Soviet terms
   - Interviews conducted in participant's preferred language

---

## Success Criteria

**Research Success:**
- N ≥ 120 participants (30 per group)
- Attrition <15%
- Significant main effects in ANCOVA (p < 0.05)
- Qualitative data saturation in interviews

**Implementation Success:**
- Zero data loss (100% logging accuracy)
- System uptime >99% during data collection
- Median task completion time within expected range (5-10 min per case)
- User-reported technical issues <5%

---

## References Integration

All implementation decisions trace to:
- Buçinca et al., 2021 (Cognitive Forcing Functions)
- Buçinca et al., 2025 (Contrastive Predicted Foils)
- de Jong et al., 2025 (Partial Explanations)
- Fok & Weld, 2024 (Verifiability)
- Lim et al., 2025 (Kazakhstan Sociocultural Context)
- Miller, 2023 (Evaluative AI Paradigm)
- Vaccaro et al., 2024 (Human-AI Collaboration Meta-Analysis)

---

**Next Steps:** See `research/PRD.md` for detailed functional specifications and implementation roadmap.
