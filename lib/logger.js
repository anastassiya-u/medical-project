/**
 * Real-Time Event Logger for Oracle vs. Critic Experiment
 * Streams SDT metrics (Autonomy, Competence, Relatedness) to Supabase
 *
 * Key Metrics Tracked:
 * - Task Completion Time (timestamp deltas)
 * - Overreliance Rate (agreement with AI errors)
 * - Evidence Exploration Depth (Critic group)
 * - Hypothesis Revision Behavior (Autonomy indicator)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase credentials not found. Logging will fail.');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * In-memory state for current interaction
 * Tracks timestamps to calculate durations
 */
class InteractionState {
  constructor() {
    this.interactionId = null;
    this.caseStartTime = null;
    this.hypothesisSubmitTime = null;
    this.aiOutputViewTime = null;
    this.firstEvidenceClickTime = null;
    this.evidencePanelsOpened = [];
    this.evidenceExplorationStart = null;
    this.totalEvidenceTime = 0;
  }

  reset() {
    this.interactionId = null;
    this.caseStartTime = null;
    this.hypothesisSubmitTime = null;
    this.aiOutputViewTime = null;
    this.firstEvidenceClickTime = null;
    this.evidencePanelsOpened = [];
    this.evidenceExplorationStart = null;
    this.totalEvidenceTime = 0;
  }

  // Calculate time deltas for SDT metrics
  getTimeToHypothesis() {
    if (!this.hypothesisSubmitTime || !this.caseStartTime) return null;
    return Math.round((this.hypothesisSubmitTime - this.caseStartTime) / 1000);
  }

  getTimeViewingAI() {
    if (!this.aiOutputViewTime) return null;
    // For Critic: time until first evidence click (user stops passively viewing AI table)
    // For Oracle: time from AI display until final submission (entire reading period)
    const endTime = this.firstEvidenceClickTime || Date.now();
    return Math.round((endTime - this.aiOutputViewTime) / 1000);
  }

  getTotalTaskTime() {
    if (!this.caseStartTime) return null;
    return Math.round((Date.now() - this.caseStartTime) / 1000);
  }
}

const state = new InteractionState();

/**
 * Logger Class
 * Provides methods for logging all experiment events
 */
class ExperimentLogger {
  constructor() {
    this.userId = null;
    this.sessionId = null;
    this.paradigm = null;
    this.accuracyLevel = null;
  }

  /**
   * Initialize logger with user and session context
   */
  init({ userId, sessionId, paradigm, accuracyLevel }) {
    this.userId = userId;
    this.sessionId = sessionId;
    this.paradigm = paradigm;
    this.accuracyLevel = accuracyLevel;
    console.log(`✅ Logger initialized for user ${userId} (${paradigm} / ${accuracyLevel})`);
  }

  /**
   * Start a new case interaction.
   * Accepts AI fields upfront so they are written atomically in the INSERT —
   * no separate UPDATE needed, eliminating the TBD race condition.
   *
   * @param {string} caseId
   * @param {number} caseOrder
   * @param {Object} aiData - { aiRecommendation, correctDiagnosis, isFoil }
   */
  async startCase(caseId, caseOrder, aiData = {}) {
    state.reset();
    state.caseStartTime = Date.now();

    const { aiRecommendation = '', correctDiagnosis = '', isFoil = false } = aiData;

    const { data, error } = await supabase
      .from('case_interactions')
      .insert({
        user_id: this.userId,
        session_id: this.sessionId,
        case_id: caseId,
        case_order: caseOrder,
        paradigm: this.paradigm,
        accuracy_level: this.accuracyLevel,
        timestamp_case_start: new Date(state.caseStartTime).toISOString(),
        timestamp_final_decision: new Date(state.caseStartTime).toISOString(), // Updated on submission
        ai_recommendation: aiRecommendation,    // '' for pre-test (no AI); label for intervention
        correct_diagnosis: correctDiagnosis,    // '' for pre-test; label for intervention
        ai_correctness: !isFoil,
        is_foil_case: isFoil,
        user_final_diagnosis: '',               // Updated by submitFinalDiagnosis
        // timestamp_ai_output_viewed written by viewAIOutput after INSERT confirms
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create case interaction:', error);
      return null;
    }

    state.interactionId = data.id;
    console.log(`📝 Started case ${caseId} (interaction: ${state.interactionId})`);

    await this.logEvent('case_presented', { case_id: caseId });

    return state.interactionId;
  }

  /**
   * Log hypothesis submission (Critic only)
   * SDT Autonomy Metric: Time to formulate own diagnosis
   */
  async submitHypothesis(hypothesis) {
    if (this.paradigm !== 'critic') {
      console.warn('⚠️  submitHypothesis called in Oracle mode');
      return;
    }

    state.hypothesisSubmitTime = Date.now();
    const timeToHypothesis = state.getTimeToHypothesis();

    const { error } = await supabase
      .from('case_interactions')
      .update({
        user_hypothesis: hypothesis,
        timestamp_hypothesis_submitted: new Date(state.hypothesisSubmitTime).toISOString(),
        time_to_hypothesis_seconds: timeToHypothesis,
      })
      .eq('id', state.interactionId);

    if (error) {
      console.error('❌ Failed to log hypothesis:', error);
      return;
    }

    await this.logEvent('hypothesis_submitted', {
      hypothesis,
      time_to_hypothesis_seconds: timeToHypothesis,
    });

    console.log(`💭 Hypothesis submitted: "${hypothesis}" (${timeToHypothesis}s)`);
  }

  /**
   * Log AI output viewed — writes only timestamp_ai_output_viewed.
   * AI fields (ai_recommendation, correct_diagnosis, ai_correctness, is_foil_case)
   * are already written atomically by startCase, so we never try to update them here.
   * This eliminates the TBD bug caused by VARCHAR overflow on long aiRecommendation text.
   */
  async viewAIOutput(aiRecommendation, correctDiagnosis, isFoil) {
    state.aiOutputViewTime = Date.now();

    const { error } = await supabase
      .from('case_interactions')
      .update({
        timestamp_ai_output_viewed: new Date(state.aiOutputViewTime).toISOString(),
      })
      .eq('id', state.interactionId);

    if (error) {
      console.error('❌ Failed to log AI output timestamp:', error);
      return;
    }

    await this.logEvent('ai_output_viewed', {
      ai_recommendation: aiRecommendation,
      is_foil: isFoil,
    });

    console.log(`🤖 AI output viewed: "${aiRecommendation}" ${isFoil ? '(FOIL)' : '(CORRECT)'}`);
  }

  /**
   * Log evidence panel opened (Critic only)
   * SDT Competence Metric: Active evidence exploration
   */
  async openEvidencePanel(evidenceType) {
    if (this.paradigm !== 'critic') return;

    const now = Date.now();

    if (!state.firstEvidenceClickTime) {
      state.firstEvidenceClickTime = now;
    }

    state.evidencePanelsOpened.push(evidenceType);
    state.evidenceExplorationStart = now;

    // Record in evidence_exploration table
    await supabase.from('evidence_exploration').insert({
      interaction_id: state.interactionId,
      evidence_type: evidenceType,
      timestamp_revealed: new Date(now).toISOString(),
      reveal_stage: state.evidencePanelsOpened.length,
      was_user_requested: true,
    });

    await supabase
      .from('case_interactions')
      .update({
        num_evidence_panels_opened: state.evidencePanelsOpened.length,
        evidence_requests: state.evidencePanelsOpened,
        timestamp_first_evidence_click: state.firstEvidenceClickTime
          ? new Date(state.firstEvidenceClickTime).toISOString()
          : null,
      })
      .eq('id', state.interactionId);

    await this.logEvent('evidence_panel_opened', {
      evidence_type: evidenceType,
      reveal_stage: state.evidencePanelsOpened.length,
    });

    console.log(`🔍 Evidence panel opened: ${evidenceType} (stage ${state.evidencePanelsOpened.length})`);
  }

  /**
   * Log evidence panel closed (track viewing time)
   */
  async closeEvidencePanel(evidenceType) {
    if (!state.evidenceExplorationStart) return;

    const viewingTime = Math.round((Date.now() - state.evidenceExplorationStart) / 1000);
    state.totalEvidenceTime += viewingTime;

    // Update the most recent evidence_exploration record
    const { data } = await supabase
      .from('evidence_exploration')
      .select('id')
      .eq('interaction_id', state.interactionId)
      .eq('evidence_type', evidenceType)
      .order('timestamp_revealed', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      await supabase
        .from('evidence_exploration')
        .update({ time_spent_viewing_seconds: viewingTime })
        .eq('id', data.id);
    }

    console.log(`👀 Evidence panel closed: ${evidenceType} (viewed ${viewingTime}s)`);
  }

  /**
   * Log confidence rating (pre/post AI)
   */
  async rateConfidence(rating, stage = 'pre') {
    const field = stage === 'pre' ? 'user_confidence_pre' : 'user_confidence_post';

    await supabase
      .from('case_interactions')
      .update({ [field]: rating })
      .eq('id', state.interactionId);

    await this.logEvent('confidence_rated', {
      rating,
      stage,
    });

    console.log(`⭐ Confidence rated: ${rating}/5 (${stage})`);
  }

  /**
   * Log hypothesis revision (Critic only)
   * SDT Autonomy Metric: Willingness to change mind
   */
  async reviseHypothesis(newHypothesis, reason) {
    if (this.paradigm !== 'critic') return;

    await supabase
      .from('case_interactions')
      .update({
        hypothesis_revised: true,
        revision_reason: reason,
      })
      .eq('id', state.interactionId);

    await this.logEvent('hypothesis_revised', {
      new_hypothesis: newHypothesis,
      reason,
    });

    console.log(`✏️  Hypothesis revised to: "${newHypothesis}"`);
  }

  /**
   * Submit final diagnosis.
   *
   * Stores raw user answer, timing, and engagement metrics.
   * Does NOT compute user_agreed_with_ai or user_finally_correct automatically —
   * those fields are left null for manual adjudication by the researcher.
   * Raw fields preserved for comparison: user_final_diagnosis, ai_recommendation,
   * correct_diagnosis (all stored in clean label form, not explanatory sentences).
   */
  async submitFinalDiagnosis(finalDiagnosis) {
    const now = Date.now();
    const totalTaskTime = state.getTotalTaskTime();
    const timeViewingAI = state.getTimeViewingAI();

    const { error: updateError } = await supabase
      .from('case_interactions')
      .update({
        user_final_diagnosis: finalDiagnosis,
        timestamp_final_decision: new Date(now).toISOString(),
        total_task_time_seconds: totalTaskTime,
        // time_viewing_ai_output_seconds: Critic = time until first evidence click;
        //   Oracle = time from AI display until submission. Null if AI was never shown.
        time_viewing_ai_output_seconds: timeViewingAI,
        // time_exploring_evidence_seconds: Critic only; 0 for Oracle (no panels).
        time_exploring_evidence_seconds: state.totalEvidenceTime || null,
        // user_agreed_with_ai, user_finally_correct, user_initially_correct:
        //   NOT auto-computed — free-text matching is unreliable.
        //   Left null; researcher compares user_final_diagnosis vs ai_recommendation
        //   and correct_diagnosis manually.
      })
      .eq('id', state.interactionId);

    if (updateError) {
      console.error('❌ Failed to save final diagnosis:', updateError);
      throw new Error(`Failed to save diagnosis: ${updateError.message}`);
    }

    // Increment cases_completed on the session
    const { error: rpcError } = await supabase.rpc('increment_cases_completed', { session_id: this.sessionId });
    if (rpcError) console.error('❌ Failed to increment cases_completed:', rpcError);

    await this.logEvent('final_decision_submitted', {
      final_diagnosis: finalDiagnosis,
      total_time_seconds: totalTaskTime,
    });

    console.log(`✅ Final diagnosis submitted: "${finalDiagnosis}" (${totalTaskTime}s total)`);

    state.reset();
  }

  /**
   * Generic event logger
   * Writes to ui_events table for granular analysis
   */
  async logEvent(eventType, metadata = {}) {
    await supabase.from('ui_events').insert({
      user_id: this.userId,
      session_id: this.sessionId,
      interaction_id: state.interactionId,
      event_type: eventType,
      timestamp: new Date().toISOString(),
      metadata,
    });
  }

  /**
   * Log NFC responses
   */
  async submitNFC(responses) {
    const { data, error } = await supabase
      .from('nfc_responses')
      .insert({
        user_id: this.userId,
        ...responses,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to submit NFC:', error);
      throw new Error(`NFC submission failed: ${error.message}`);
    }

    console.log(`📊 NFC submitted: Total Score = ${data.total_score}`);
    return data;
  }

  /**
   * INACTIVE — reserved for future use (post-study Likert: Autonomy, Trust, NASA-TLX).
   * Not called by the current app flow. The active final assessment is submitNFC().
   * The `likert_assessments` table remains in the schema for future data collection.
   */
  async submitLikertAssessment(responses) {
    const { error } = await supabase.from('likert_assessments').insert({
      user_id: this.userId,
      session_id: this.sessionId,
      ...responses,
    });

    if (error) {
      console.error('❌ Failed to submit Likert:', error);
      throw new Error(`Likert submission failed: ${error.message}`);
    }

    console.log('📊 Likert assessment submitted');
  }

  /**
   * Start a new session
   * total_cases is only meaningful for case-based phases.
   * nfc_assessment has no cases, so total_cases is left null.
   */
  async startSession(sessionType) {
    const totalCasesMap = { pre_test: 4, intervention: 10 };
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: this.userId,
        session_type: sessionType,
        total_cases: totalCasesMap[sessionType] ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to start session:', error);
      return null;
    }

    this.sessionId = data.id;
    console.log(`🚀 Session started: ${sessionType} (ID: ${this.sessionId})`);
    return this.sessionId;
  }

  /**
   * Complete session
   */
  async completeSession() {
    await supabase
      .from('sessions')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', this.sessionId);

    console.log(`✅ Session completed: ${this.sessionId}`);
  }
}

// Singleton instance
const logger = new ExperimentLogger();

export default logger;

// NOTE: calculateLearningGain() removed — post-test is deployed as a separate application.
// NOTE: calculateOverrelianceRate() removed — user_agreed_with_ai is not auto-computed;
//   overreliance is assessed manually by the researcher from raw logged fields.
