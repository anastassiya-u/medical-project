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
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Demographics
  student_id VARCHAR(50) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age INTEGER,
  gender VARCHAR(20),
  medical_school VARCHAR(200),
  year_of_study INTEGER CHECK (year_of_study BETWEEN 1 AND 6),

  -- Experimental Group Assignment (2x2)
  paradigm VARCHAR(10) CHECK (paradigm IN ('oracle', 'critic')) NOT NULL,
  accuracy_level VARCHAR(20) CHECK (accuracy_level IN ('high', 'calibrated')) NOT NULL,
  randomization_seed INTEGER NOT NULL, -- For reproducibility

  -- Need for Cognition (NFC) Score
  nfc_score INTEGER CHECK (nfc_score BETWEEN 15 AND 75),
  nfc_level VARCHAR(10) CHECK (nfc_level IN ('high', 'low')),

  -- Consent & Privacy
  consent_given BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP,
  preferred_language VARCHAR(10) CHECK (preferred_language IN ('ru', 'kk', 'en')),

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_paradigm ON users(paradigm, accuracy_level);
CREATE INDEX idx_users_nfc ON users(nfc_level);

-- =====================================================
-- 2. SESSIONS TABLE
-- =====================================================
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Session Type (post_test is deployed as a separate application)
  session_type VARCHAR(20) CHECK (session_type IN ('pre_test', 'intervention', 'nfc_assessment')) NOT NULL,

  -- Timestamps
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,

  -- Session Metadata
  total_cases INTEGER,
  cases_completed INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id, session_type);

-- =====================================================
-- 3. CASE_INTERACTIONS TABLE (Primary Data)
-- =====================================================
CREATE TABLE case_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

  -- Case Identification
  case_id VARCHAR(50) NOT NULL,
  case_order INTEGER NOT NULL, -- Position in session (1-4 for pre_test, 1-10 for intervention)

  -- Experimental Conditions (denormalized for analysis)
  paradigm VARCHAR(10) CHECK (paradigm IN ('oracle', 'critic')) NOT NULL,
  accuracy_level VARCHAR(20) CHECK (accuracy_level IN ('high', 'calibrated')) NOT NULL,

  -- AI Correctness (for overreliance calculation)
  ai_correctness BOOLEAN NOT NULL, -- TRUE = AI recommendation is correct
  is_foil_case BOOLEAN NOT NULL, -- TRUE = this is one of the 30% error cases

  -- Timestamps (for task completion time)
  timestamp_case_start TIMESTAMP NOT NULL,
  timestamp_hypothesis_submitted TIMESTAMP, -- Critic only
  timestamp_ai_output_viewed TIMESTAMP,
  timestamp_first_evidence_click TIMESTAMP, -- Critic only
  timestamp_final_decision TIMESTAMP NOT NULL,

  -- User Inputs
  user_hypothesis VARCHAR(200), -- Critic only (initial diagnosis)
  user_final_diagnosis VARCHAR(200) NOT NULL,
  user_confidence_pre INTEGER CHECK (user_confidence_pre BETWEEN 1 AND 5),
  user_confidence_post INTEGER CHECK (user_confidence_post BETWEEN 1 AND 5),

  -- AI Outputs
  ai_recommendation VARCHAR(200) NOT NULL,
  correct_diagnosis VARCHAR(200) NOT NULL,
  foil_diagnosis VARCHAR(200), -- If is_foil_case = TRUE

  -- Decision Outcomes
  user_agreed_with_ai BOOLEAN, -- Final diagnosis matches AI recommendation
  user_initially_correct BOOLEAN, -- Critic: hypothesis == correct_diagnosis
  user_finally_correct BOOLEAN, -- Final diagnosis == correct_diagnosis

  -- Cognitive Engagement (Critic only)
  hypothesis_revised BOOLEAN DEFAULT FALSE, -- Did user change initial hypothesis?
  revision_reason TEXT,
  num_evidence_panels_opened INTEGER DEFAULT 0,
  evidence_requests JSONB, -- Array of panel types clicked: ["lab_results", "vitals", "differential"]

  -- SDT Metrics (calculated fields)
  time_to_hypothesis_seconds INTEGER, -- Autonomy: time before submitting hypothesis
  time_viewing_ai_output_seconds INTEGER, -- Competence: engagement with AI
  time_exploring_evidence_seconds INTEGER, -- Critic only: partiality engagement
  total_task_time_seconds INTEGER, -- Total from start to final decision

  -- Autonomy Indicators
  disagreed_with_ai BOOLEAN, -- User chose different diagnosis than AI
  disagreed_despite_high_confidence BOOLEAN, -- Disagreed even when confident

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for analysis queries
CREATE INDEX idx_interactions_user ON case_interactions(user_id);
CREATE INDEX idx_interactions_session ON case_interactions(session_id);
CREATE INDEX idx_interactions_paradigm ON case_interactions(paradigm, accuracy_level);
CREATE INDEX idx_overreliance ON case_interactions(ai_correctness, user_agreed_with_ai);
CREATE INDEX idx_foil_cases ON case_interactions(is_foil_case, user_agreed_with_ai);

-- =====================================================
-- 4. EVIDENCE_EXPLORATION TABLE (Critic Group Only)
-- =====================================================
CREATE TABLE evidence_exploration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  interaction_id UUID REFERENCES case_interactions(id) ON DELETE CASCADE,

  -- Evidence Panel Details
  evidence_type VARCHAR(50) NOT NULL, -- 'lab_results', 'vitals', 'differential', 'imaging'
  timestamp_revealed TIMESTAMP NOT NULL,
  time_spent_viewing_seconds INTEGER,

  -- Partiality Tracking (de Jong et al., 2025)
  reveal_stage INTEGER, -- 1 = first partial reveal, 2 = second, etc.
  was_user_requested BOOLEAN DEFAULT TRUE, -- Did user click, or auto-revealed?

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_evidence_interaction ON evidence_exploration(interaction_id);
CREATE INDEX idx_evidence_type ON evidence_exploration(evidence_type);

-- =====================================================
-- 5. UI_EVENTS TABLE (Granular Interaction Logs)
-- =====================================================
CREATE TABLE ui_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  interaction_id UUID REFERENCES case_interactions(id) ON DELETE CASCADE,

  -- Event Details
  event_type VARCHAR(50) NOT NULL, -- 'case_presented', 'hypothesis_submitted', 'evidence_panel_opened', etc.
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Event Metadata (flexible JSONB for various event types)
  metadata JSONB,

  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_events_user ON ui_events(user_id);
CREATE INDEX idx_events_interaction ON ui_events(interaction_id);
CREATE INDEX idx_events_type ON ui_events(event_type);

-- =====================================================
-- 6. NFC_RESPONSES TABLE (Need for Cognition Scale)
-- =====================================================
CREATE TABLE nfc_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- 15-item NFC Scale (items 10, 13, 17 removed per researcher decision)
  -- Reverse-scored items: q3, q4, q6, q9, q11, q14, q16, q18
  q1_complex_problems INTEGER CHECK (q1_complex_problems BETWEEN 1 AND 5),
  q2_responsibility_thinking INTEGER CHECK (q2_responsibility_thinking BETWEEN 1 AND 5),
  q3_thinking_not_fun INTEGER CHECK (q3_thinking_not_fun BETWEEN 1 AND 5), -- Reverse scored
  q4_prefer_simple INTEGER CHECK (q4_prefer_simple BETWEEN 1 AND 5), -- Reverse scored
  q5_intellectual_challenge INTEGER CHECK (q5_intellectual_challenge BETWEEN 1 AND 5),
  q6_deep_thinking INTEGER CHECK (q6_deep_thinking BETWEEN 1 AND 5), -- Reverse scored
  q7_prefer_easy INTEGER CHECK (q7_prefer_easy BETWEEN 1 AND 5),
  q8_abstract_problems INTEGER CHECK (q8_abstract_problems BETWEEN 1 AND 5),
  q9_enjoy_puzzles INTEGER CHECK (q9_enjoy_puzzles BETWEEN 1 AND 5), -- Reverse scored
  q11_cognitive_effort INTEGER CHECK (q11_cognitive_effort BETWEEN 1 AND 5), -- Reverse scored
  q12_prefer_straightforward INTEGER CHECK (q12_prefer_straightforward BETWEEN 1 AND 5),
  q14_avoid_situations INTEGER CHECK (q14_avoid_situations BETWEEN 1 AND 5), -- Reverse scored
  q15_deliberation INTEGER CHECK (q15_deliberation BETWEEN 1 AND 5),
  q16_minimal_effort INTEGER CHECK (q16_minimal_effort BETWEEN 1 AND 5), -- Reverse scored
  q18_prefer_little_thought INTEGER CHECK (q18_prefer_little_thought BETWEEN 1 AND 5), -- Reverse scored

  -- Calculated Score (15 items × 5-point scale; range 15–75)
  total_score INTEGER CHECK (total_score BETWEEN 15 AND 75),

  -- Metadata
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_nfc_user ON nfc_responses(user_id);

-- =====================================================
-- 7. LIKERT_ASSESSMENTS TABLE (Perceived Autonomy, Trust, NASA-TLX)
-- =====================================================
CREATE TABLE likert_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,

  -- Perceived Autonomy (IMI - Intrinsic Motivation Inventory)
  autonomy_choice INTEGER CHECK (autonomy_choice BETWEEN 1 AND 5), -- "It was my choice to make the final diagnosis"
  autonomy_pressure INTEGER CHECK (autonomy_pressure BETWEEN 1 AND 5), -- "I felt pressured to agree with AI" (reverse)
  autonomy_control INTEGER CHECK (autonomy_control BETWEEN 1 AND 5), -- "I felt in control of the diagnostic process"

  -- Trust Calibration
  trust_disagreement INTEGER CHECK (trust_disagreement BETWEEN 1 AND 5), -- "I trust AI even when I initially disagreed"
  trust_evaluation INTEGER CHECK (trust_evaluation BETWEEN 1 AND 5), -- "I carefully evaluated AI's reasoning"
  trust_distinguish INTEGER CHECK (trust_distinguish BETWEEN 1 AND 5), -- "I felt confident distinguishing correct/incorrect AI"

  -- NASA-TLX (Cognitive Load)
  tlx_mental_demand INTEGER CHECK (tlx_mental_demand BETWEEN 1 AND 5),
  tlx_effort INTEGER CHECK (tlx_effort BETWEEN 1 AND 5),
  tlx_frustration INTEGER CHECK (tlx_frustration BETWEEN 1 AND 5),

  -- Metadata
  completed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_likert_user ON likert_assessments(user_id);

-- =====================================================
-- 8. INTERVIEW_TRANSCRIPTS TABLE (Qualitative Data)
-- =====================================================
CREATE TABLE interview_transcripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  -- Interview Details
  interviewer_name VARCHAR(100),
  interview_duration_minutes INTEGER,
  language_used VARCHAR(10) CHECK (language_used IN ('ru', 'kk', 'en')),

  -- Transcript Content
  transcript_text TEXT,
  transcript_file_url TEXT, -- Link to audio/video file if stored externally

  -- Thematic Coding (to be filled during analysis)
  themes_coded JSONB, -- Array of theme codes applied
  authority_deference_score INTEGER CHECK (authority_deference_score BETWEEN 1 AND 5),
  verification_strategy_score INTEGER CHECK (verification_strategy_score BETWEEN 1 AND 5),

  -- Metadata
  conducted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_interviews_user ON interview_transcripts(user_id);

-- =====================================================
-- 9. VIEWS FOR ANALYSIS
-- =====================================================

-- View: Overreliance Rate by Group
CREATE VIEW overreliance_by_group AS
SELECT
  paradigm,
  accuracy_level,
  COUNT(*) FILTER (WHERE is_foil_case = TRUE) AS total_foil_cases,
  COUNT(*) FILTER (WHERE is_foil_case = TRUE AND user_agreed_with_ai = TRUE) AS agreed_with_foils,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE is_foil_case = TRUE AND user_agreed_with_ai = TRUE) /
    NULLIF(COUNT(*) FILTER (WHERE is_foil_case = TRUE), 0),
    2
  ) AS overreliance_rate_percent
FROM case_interactions
GROUP BY paradigm, accuracy_level;

-- View: Learning Gain by Group
-- NOTE: This view is intentionally inactive in this application.
-- Post-test data is collected by a separate application.
-- The view is retained here for future cross-app analysis once post-test data
-- is ingested into this database. It will return 0 rows until then.
CREATE VIEW learning_gain_by_group AS
WITH pre_test AS (
  SELECT
    ci.user_id,
    u.paradigm,
    u.accuracy_level,
    COUNT(*) FILTER (WHERE ci.user_finally_correct = TRUE) * 100.0 / COUNT(*) AS pre_test_accuracy
  FROM case_interactions ci
  JOIN users u ON ci.user_id = u.id
  JOIN sessions s ON ci.session_id = s.id
  WHERE s.session_type = 'pre_test'
  GROUP BY ci.user_id, u.paradigm, u.accuracy_level
),
post_test AS (
  -- post_test session_type is written by the separate post-test application
  SELECT
    ci.user_id,
    COUNT(*) FILTER (WHERE ci.user_finally_correct = TRUE) * 100.0 / COUNT(*) AS post_test_accuracy
  FROM case_interactions ci
  JOIN sessions s ON ci.session_id = s.id
  WHERE s.session_type = 'post_test'
  GROUP BY ci.user_id
)
SELECT
  pre.paradigm,
  pre.accuracy_level,
  COUNT(*) AS n_users,
  ROUND(AVG(pre.pre_test_accuracy), 2) AS avg_pre_test_accuracy,
  ROUND(AVG(post.post_test_accuracy), 2) AS avg_post_test_accuracy,
  ROUND(AVG(post.post_test_accuracy - pre.pre_test_accuracy), 2) AS avg_learning_gain
FROM pre_test pre
JOIN post_test post ON pre.user_id = post.user_id
GROUP BY pre.paradigm, pre.accuracy_level;

-- View: SDT Metrics by Group
CREATE VIEW sdt_metrics_by_group AS
SELECT
  u.paradigm,
  u.accuracy_level,
  COUNT(DISTINCT ci.user_id) AS n_users,

  -- Autonomy Metrics
  ROUND(AVG(ci.time_to_hypothesis_seconds), 2) AS avg_time_to_hypothesis_sec,
  ROUND(AVG(ci.time_viewing_ai_output_seconds), 2) AS avg_time_viewing_ai_sec,
  ROUND(
    (100.0 * COUNT(*) FILTER (WHERE ci.disagreed_with_ai = true)::numeric) / NULLIF(COUNT(*)::numeric, 0),
    2
  ) AS disagreement_rate_percent,

  -- Competence Metrics
  ROUND(AVG(ci.num_evidence_panels_opened), 2) AS avg_evidence_panels_opened,
  ROUND(AVG(ci.time_exploring_evidence_seconds), 2) AS avg_evidence_exploration_sec,

  -- Overall Engagement
  ROUND(AVG(ci.total_task_time_seconds), 2) AS avg_total_task_time_sec
FROM case_interactions ci
JOIN users u ON ci.user_id = u.id
JOIN sessions s ON ci.session_id = s.id
WHERE s.session_type = 'intervention'
GROUP BY u.paradigm, u.accuracy_level;

-- =====================================================
-- 10. FUNCTIONS FOR DATA INTEGRITY
-- =====================================================

-- Function: Increment cases_completed on a session row.
-- Called by the logger after every submitFinalDiagnosis so the sessions table
-- reflects actual completed cases rather than always showing 0.
CREATE OR REPLACE FUNCTION increment_cases_completed(session_id UUID)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE sessions
  SET cases_completed = cases_completed + 1
  WHERE id = session_id;
$$;

-- Function: Calculate NFC Total Score (15-item scale)
-- Reverse-scored items: q3, q4, q6, q9, q11, q14, q16, q18
-- Score range: 15–75; high NFC threshold: ≥45
CREATE OR REPLACE FUNCTION calculate_nfc_score()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_score :=
    NEW.q1_complex_problems +
    NEW.q2_responsibility_thinking +
    (6 - NEW.q3_thinking_not_fun) +
    (6 - NEW.q4_prefer_simple) +
    NEW.q5_intellectual_challenge +
    (6 - NEW.q6_deep_thinking) +
    NEW.q7_prefer_easy +
    NEW.q8_abstract_problems +
    (6 - NEW.q9_enjoy_puzzles) +
    (6 - NEW.q11_cognitive_effort) +
    NEW.q12_prefer_straightforward +
    (6 - NEW.q14_avoid_situations) +
    NEW.q15_deliberation +
    (6 - NEW.q16_minimal_effort) +
    (6 - NEW.q18_prefer_little_thought);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_nfc_score
BEFORE INSERT OR UPDATE ON nfc_responses
FOR EACH ROW
EXECUTE FUNCTION calculate_nfc_score();

-- Function: Update NFC Level in Users Table
CREATE OR REPLACE FUNCTION update_user_nfc_level()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users
  SET
    nfc_score = NEW.total_score,
    nfc_level = CASE
      WHEN NEW.total_score >= 45 THEN 'high'  -- median of 15–75 range
      ELSE 'low'
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_nfc
AFTER INSERT OR UPDATE ON nfc_responses
FOR EACH ROW
EXECUTE FUNCTION update_user_nfc_level();

-- =====================================================
-- 11. INITIAL DATA SEEDING (Group Balance Check)
-- =====================================================

-- View: Check Randomization Balance
CREATE VIEW randomization_balance AS
SELECT
  paradigm,
  accuracy_level,
  COUNT(*) AS n_users,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) AS percent_of_total
FROM users
GROUP BY paradigm, accuracy_level
ORDER BY paradigm, accuracy_level;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE users IS 'Participant demographics and experimental group assignment';
COMMENT ON TABLE case_interactions IS 'Primary data table: every case interaction with timestamps and outcomes';
COMMENT ON TABLE evidence_exploration IS 'Critic group only: tracks progressive reveal engagement (partiality)';
COMMENT ON TABLE ui_events IS 'Granular event logs for detailed behavioral analysis';
COMMENT ON COLUMN case_interactions.time_to_hypothesis_seconds IS 'SDT Autonomy proxy: time spent formulating own diagnosis';
COMMENT ON COLUMN case_interactions.num_evidence_panels_opened IS 'SDT Competence proxy: active evidence exploration';
