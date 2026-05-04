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
    if (!this.firstEvidenceClickTime || !this.aiOutputViewTime) {
      // If no evidence clicks, use final decision time
      return null;
    }
    return Math.round((this.firstEvidenceClickTime - this.aiOutputViewTime) / 1000);
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
   * Start a new case interaction
   */
  async startCase(caseId, caseOrder) {
    state.reset();
    state.caseStartTime = Date.now();

    // Create interaction record
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
        timestamp_final_decision: new Date(state.caseStartTime).toISOString(), // Will be updated on submission
        // These will be filled as interaction progresses
        ai_correctness: false, // Set when AI recommendation is shown
        is_foil_case: false,
        ai_recommendation: 'TBD',
        correct_diagnosis: 'TBD',
        user_final_diagnosis: 'TBD',
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create case interaction:', error);
      return null;
    }

    state.interactionId = data.id;
    console.log(`📝 Started case ${caseId} (interaction: ${state.interactionId})`);

    // Log UI event
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
   * Log AI output viewed
   */
  async viewAIOutput(aiRecommendation, correctDiagnosis, isFoil) {
    state.aiOutputViewTime = Date.now();

    const { error } = await supabase
      .from('case_interactions')
      .update({
        ai_recommendation: aiRecommendation,
        correct_diagnosis: correctDiagnosis,
        ai_correctness: !isFoil,
        is_foil_case: isFoil,
        timestamp_ai_output_viewed: new Date(state.aiOutputViewTime).toISOString(),
      })
      .eq('id', state.interactionId);

    if (error) {
      console.error('❌ Failed to log AI output:', error);
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
   * Submit final diagnosis
   * Calculates overreliance and learning metrics
   */
  async submitFinalDiagnosis(finalDiagnosis) {
    const now = Date.now();
    const totalTaskTime = state.getTotalTaskTime();

    // Fetch current interaction to get AI recommendation and correct diagnosis
    const { data: interaction } = await supabase
      .from('case_interactions')
      .select('ai_recommendation, correct_diagnosis, user_hypothesis, ai_correctness')
      .eq('id', state.interactionId)
      .single();

    if (!interaction) {
      console.error('❌ Interaction not found');
      return;
    }

    const userAgreedWithAI = finalDiagnosis.toLowerCase() === interaction.ai_recommendation.toLowerCase();
    const userFinallyCorrect = finalDiagnosis.toLowerCase() === interaction.correct_diagnosis.toLowerCase();
    const userInitiallyCorrect = interaction.user_hypothesis
      ? interaction.user_hypothesis.toLowerCase() === interaction.correct_diagnosis.toLowerCase()
      : null;

    // Calculate SDT metrics
    const disagreedWithAI = !userAgreedWithAI;
    const disagreedDespiteHighConfidence = false; // TODO: Calculate from confidence ratings

    const { error: updateError } = await supabase
      .from('case_interactions')
      .update({
        user_final_diagnosis: finalDiagnosis,
        timestamp_final_decision: new Date(now).toISOString(),
        total_task_time_seconds: totalTaskTime,
        time_exploring_evidence_seconds: state.totalEvidenceTime,
        user_agreed_with_ai: userAgreedWithAI,
        user_finally_correct: userFinallyCorrect,
        user_initially_correct: userInitiallyCorrect,
        disagreed_with_ai: disagreedWithAI,
        disagreed_despite_high_confidence: disagreedDespiteHighConfidence,
      })
      .eq('id', state.interactionId);

    if (updateError) {
      console.error('❌ Failed to save final diagnosis:', updateError);
      throw new Error(`Failed to save diagnosis: ${updateError.message}`);
    }

    await this.logEvent('final_decision_submitted', {
      final_diagnosis: finalDiagnosis,
      agreed_with_ai: userAgreedWithAI,
      correct: userFinallyCorrect,
      total_time_seconds: totalTaskTime,
    });

    // Log overreliance event if applicable
    if (interaction.ai_correctness === false && userAgreedWithAI) {
      console.warn('⚠️  OVERRELIANCE: User agreed with AI error (sensible foil)');
      await this.logEvent('overreliance_detected', {
        ai_recommendation: interaction.ai_recommendation,
        user_diagnosis: finalDiagnosis,
      });
    }

    console.log(`✅ Final diagnosis submitted: "${finalDiagnosis}" (${totalTaskTime}s total)`);
    console.log(`   Agreed with AI: ${userAgreedWithAI} | Correct: ${userFinallyCorrect}`);

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
   * Log Likert assessments (Autonomy, Trust, NASA-TLX)
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
   */
  async startSession(sessionType) {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: this.userId,
        session_type: sessionType,
        total_cases: sessionType === 'intervention' ? 10 : 4,
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

/**
 * Helper: Calculate overreliance rate for a user
 */
export async function calculateOverrelianceRate(userId) {
  const { data } = await supabase
    .from('case_interactions')
    .select('is_foil_case, user_agreed_with_ai')
    .eq('user_id', userId)
    .eq('is_foil_case', true);

  if (!data || data.length === 0) return 0;

  const agreedWithFoils = data.filter((d) => d.user_agreed_with_ai).length;
  return (agreedWithFoils / data.length) * 100;
}

// NOTE: calculateLearningGain() removed — post-test is deployed as a separate application.
