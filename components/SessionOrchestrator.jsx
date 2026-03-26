'use client';

/**
 * SessionOrchestrator Component
 * Central state machine for the entire experimental flow
 *
 * Phases:
 * 1. Registration & Consent
 * 2. Pre-test (5 cases, no AI)
 * 3. NFC Assessment (6-item Need for Cognition scale)
 * 4. Intervention (15 cases with AI - paradigm assigned)
 * 5. Post-test (5 cases, no AI - one week later)
 * 6. Likert Assessments & Interview
 *
 * Persistence: Uses localStorage + Supabase to maintain state across refreshes
 */

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import logger from '../lib/logger';
import {
  assignExperimentalGroup,
  generateRandomizationSeed,
  shuffleCases,
  selectFoilCases,
  prepareCaseForUser,
} from '../lib/randomization';

// Import UI components
import OracleInterface from './OracleInterface';
import CriticInterface from './CriticInterface';
import NFCScale from './NFCScale';
import NoAIInterface from './NoAIInterface';
import { useNotification } from './Notification';

// Import cases data
import casesData from '../src/data/cases.json';

console.log('🔧 Creating Supabase client...');
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'defined' : 'UNDEFINED');
console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'defined' : 'UNDEFINED');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

console.log('✅ Supabase client created');

/**
 * Experimental Phases
 */
const PHASES = {
  REGISTRATION: 'registration',
  PRE_TEST: 'pre_test',
  NFC_ASSESSMENT: 'nfc_assessment',
  INTERVENTION: 'intervention',
  POST_TEST_WAITING: 'post_test_waiting', // One week delay
  POST_TEST: 'post_test',
  LIKERT_ASSESSMENT: 'likert_assessment',
  COMPLETE: 'complete',
};

export default function SessionOrchestrator() {
  console.log('🚀 SessionOrchestrator component rendering');

  // User & Session State
  const [userId, setUserId] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [paradigm, setParadigm] = useState(null);
  const [accuracyLevel, setAccuracyLevel] = useState(null);
  const [randomizationSeed, setRandomizationSeed] = useState(null);

  // Phase Management
  const [currentPhase, setCurrentPhase] = useState(PHASES.REGISTRATION);
  const [sessionId, setSessionId] = useState(null);

  // Case Management
  const [cases, setCases] = useState([]);
  const [currentCaseIndex, setCurrentCaseIndex] = useState(0);
  const [foilCaseIds, setFoilCaseIds] = useState([]);

  // Loading & Error State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  console.log('🔍 Current state - loading:', loading, 'phase:', currentPhase);

  /**
   * Initialize or restore session on mount
   */
  useEffect(() => {
    console.log('⚡ useEffect running - calling restoreSession...');
    restoreSession();
  }, []);

  /**
   * Restore session from localStorage or create new
   */
  const restoreSession = async () => {
    console.log('🔄 restoreSession called');
    try {
      // Check if we're in the browser (not SSR)
      if (typeof window === 'undefined') {
        console.log('⚠️  Server side - skipping restore');
        setLoading(false);
        return;
      }

      console.log('✅ Browser detected, checking localStorage...');
      const savedSession = localStorage.getItem('experimentSession');

      if (savedSession) {
        const session = JSON.parse(savedSession);
        console.log('📂 Restoring session:', session);

        // Restore state
        setUserId(session.userId);
        setParadigm(session.paradigm);
        setAccuracyLevel(session.accuracyLevel);
        setRandomizationSeed(session.randomizationSeed);
        setCurrentPhase(session.currentPhase);
        setCurrentCaseIndex(session.currentCaseIndex || 0);
        setFoilCaseIds(session.foilCaseIds || []);

        // Restore logger context
        logger.init({
          userId: session.userId,
          sessionId: session.sessionId,
          paradigm: session.paradigm,
          accuracyLevel: session.accuracyLevel,
        });

        // Load cases for current phase
        const casesLoaded = await loadCasesForPhase(session.currentPhase, session);

        // Validate restored session - if no cases loaded for a phase that requires cases, reset
        const requiresCases = [PHASES.PRE_TEST, PHASES.INTERVENTION, PHASES.POST_TEST].includes(session.currentPhase);
        if (requiresCases && casesLoaded === 0) {
          console.warn('⚠️ Corrupted session detected (0 cases loaded). Resetting to registration...');
          localStorage.removeItem('experimentSession');
          setCurrentPhase(PHASES.REGISTRATION);
          setUserId(null);
          setParadigm(null);
          setAccuracyLevel(null);
          setRandomizationSeed(null);
          setCases([]);
          setCurrentCaseIndex(0);
          setFoilCaseIds([]);
        }
      } else {
        console.log('✅ No saved session - starting fresh');
      }

      console.log('✅ Setting loading to false');
      setLoading(false);
      console.log('✅ setLoading(false) COMPLETED - state should update');
    } catch (err) {
      console.error('❌ Error restoring session:', err);
      setError(`Failed to restore session: ${err.message}`);
      setLoading(false);
    }
  };

  /**
   * Save session to localStorage
   */
  const saveSession = (updates = {}) => {
    const session = {
      userId,
      paradigm,
      accuracyLevel,
      randomizationSeed,
      currentPhase,
      currentCaseIndex,
      sessionId,
      foilCaseIds,
      lastUpdated: new Date().toISOString(),
      ...updates,
    };

    localStorage.setItem('experimentSession', JSON.stringify(session));
    console.log('💾 Session saved:', session);
  };

  /**
   * Register new participant
   */
  const handleRegistration = async (formData) => {
    try {
      setLoading(true);

      // Assign experimental group
      const group = await assignExperimentalGroup();
      const seed = generateRandomizationSeed();

      // Create user in database
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          student_id: formData.studentId,
          age: formData.age,
          gender: formData.gender,
          medical_school: formData.medicalSchool,
          year_of_study: formData.yearOfStudy,
          paradigm: group.paradigm,
          accuracy_level: group.accuracy_level,
          randomization_seed: seed,
          consent_given: true,
          consent_timestamp: new Date().toISOString(),
          preferred_language: formData.language || 'ru',
        })
        .select()
        .single();

      if (userError) throw userError;

      // Set state
      setUserId(user.id);
      setStudentId(formData.studentId);
      setParadigm(group.paradigm);
      setAccuracyLevel(group.accuracy_level);
      setRandomizationSeed(seed);

      // Initialize logger
      logger.init({
        userId: user.id,
        sessionId: null, // Will be set when session starts
        paradigm: group.paradigm,
        accuracyLevel: group.accuracy_level,
      });

      // Move to pre-test
      await transitionToPhase(PHASES.PRE_TEST, {
        userId: user.id,
        paradigm: group.paradigm,
        accuracyLevel: group.accuracy_level,
        randomizationSeed: seed,
      });

      setLoading(false);
    } catch (err) {
      console.error('❌ Registration error:', err);
      setError('Registration failed: ' + err.message);
      setLoading(false);
    }
  };

  /**
   * Transition to a new phase
   */
  const transitionToPhase = async (newPhase, sessionData = {}) => {
    console.log(`🔄 Transitioning to phase: ${newPhase}`);

    // Start new session in database
    const session = await logger.startSession(newPhase);
    setSessionId(session);

    // Load cases for new phase
    await loadCasesForPhase(newPhase, {
      paradigm: sessionData.paradigm || paradigm,
      accuracyLevel: sessionData.accuracyLevel || accuracyLevel,
      randomizationSeed: sessionData.randomizationSeed || randomizationSeed,
    });

    setCurrentPhase(newPhase);
    setCurrentCaseIndex(0);

    // Save session
    saveSession({
      currentPhase: newPhase,
      currentCaseIndex: 0,
      sessionId: session,
      ...sessionData,
    });
  };

  /**
   * Load cases for specific phase
   */
  const loadCasesForPhase = async (phase, sessionData) => {
    let phaseCases = [];
    let foilIds = [];

    switch (phase) {
      case PHASES.PRE_TEST:
        // 5 cases, no AI
        phaseCases = casesData.cases
          .filter((c) => c.phase === 'pre-test')
          .slice(0, 5);
        break;

      case PHASES.INTERVENTION:
        // 15 cases with AI
        let interventionCases = casesData.cases
          .filter((c) => c.phase === 'intervention')
          .slice(0, 15);

        // Shuffle based on user's seed
        if (sessionData.randomizationSeed) {
          interventionCases = shuffleCases(
            interventionCases,
            sessionData.randomizationSeed
          );
        }

        // For 70% accuracy group: select 4-5 cases to show foil diagnosis
        if (sessionData.accuracyLevel === 'calibrated') {
          foilIds = selectFoilCases(
            interventionCases,
            sessionData.randomizationSeed
          );
          setFoilCaseIds(foilIds);
        }

        // Prepare cases (correct or foil based on group)
        phaseCases = interventionCases.map((caseData, idx) => ({
          ...prepareCaseForUser(caseData, sessionData.accuracyLevel, foilIds),
          order: idx + 1,
        }));
        break;

      case PHASES.POST_TEST:
        // 5 cases, no AI
        phaseCases = casesData.cases
          .filter((c) => c.phase === 'post-test')
          .slice(0, 5);
        break;

      default:
        break;
    }

    setCases(phaseCases);
    console.log(`📚 Loaded ${phaseCases.length} cases for ${phase}`);
    if (foilIds.length > 0) {
      console.log(`⚠️  Foil cases: ${foilIds.join(', ')}`);
    }

    // Return the count for validation
    return phaseCases.length;
  };

  /**
   * Handle case completion
   */
  const handleCaseComplete = () => {
    const nextIndex = currentCaseIndex + 1;

    if (nextIndex >= cases.length) {
      // Phase complete - transition to next
      handlePhaseComplete();
    } else {
      // Move to next case
      setCurrentCaseIndex(nextIndex);
      saveSession({ currentCaseIndex: nextIndex });
    }
  };

  /**
   * Handle phase completion
   */
  const handlePhaseComplete = async () => {
    await logger.completeSession();

    switch (currentPhase) {
      case PHASES.PRE_TEST:
        transitionToPhase(PHASES.NFC_ASSESSMENT);
        break;

      case PHASES.NFC_ASSESSMENT:
        transitionToPhase(PHASES.INTERVENTION);
        break;

      case PHASES.INTERVENTION:
        transitionToPhase(PHASES.POST_TEST_WAITING);
        break;

      case PHASES.POST_TEST:
        transitionToPhase(PHASES.LIKERT_ASSESSMENT);
        break;

      case PHASES.LIKERT_ASSESSMENT:
        transitionToPhase(PHASES.COMPLETE);
        break;

      default:
        break;
    }
  };

  /**
   * Handle NFC completion
   */
  const handleNFCComplete = async (responses) => {
    await logger.submitNFC(responses);
    handlePhaseComplete();
  };

  /**
   * Handle Likert assessment completion
   */
  const handleLikertComplete = async (responses) => {
    await logger.submitLikertAssessment(responses);
    handlePhaseComplete();
  };

  // ========================================
  // RENDER
  // ========================================

  if (loading) {
    console.log('🔄 Rendering loading screen (loading === true)');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading experiment...</p>
        </div>
      </div>
    );
  }

  console.log('✅ NOT loading - rendering phase:', currentPhase);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700"
          >
            Reset & Restart
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: REGISTRATION
  // ========================================
  if (currentPhase === PHASES.REGISTRATION) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            AI-Assisted Clinical Decision Making Study
          </h1>
          <p className="text-gray-600 mb-8">
            Kazakhstan Medical Students Research Project
          </p>

          <RegistrationForm onSubmit={handleRegistration} />
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: PRE-TEST
  // ========================================
  if (currentPhase === PHASES.PRE_TEST) {
    const currentCase = cases[currentCaseIndex];

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto">
          <PhaseHeader
            phase="Pre-Test"
            description="Baseline assessment (no AI assistance)"
            caseNumber={currentCaseIndex + 1}
            totalCases={cases.length}
          />
          {currentCase && (
            <NoAIInterface caseData={currentCase} onComplete={handleCaseComplete} />
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: NFC ASSESSMENT
  // ========================================
  if (currentPhase === PHASES.NFC_ASSESSMENT) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto">
          <PhaseHeader
            phase="Need for Cognition Assessment"
            description="Quick questionnaire about thinking preferences"
          />
          <NFCScale onComplete={handleNFCComplete} />
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: INTERVENTION
  // ========================================
  if (currentPhase === PHASES.INTERVENTION) {
    const currentCase = cases[currentCaseIndex];
    const InterfaceComponent =
      paradigm === 'oracle' ? OracleInterface : CriticInterface;

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto">
          <PhaseHeader
            phase={`Intervention: ${paradigm === 'oracle' ? 'Oracle AI' : 'Critic AI'}`}
            description={`AI-assisted diagnosis (${accuracyLevel === 'high' ? '100%' : '70%'} accuracy)`}
            caseNumber={currentCaseIndex + 1}
            totalCases={cases.length}
          />
          {currentCase && (
            <InterfaceComponent
              caseData={currentCase}
              onComplete={handleCaseComplete}
            />
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: POST-TEST WAITING
  // ========================================
  if (currentPhase === PHASES.POST_TEST_WAITING) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-2xl text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Intervention Phase Complete!
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Thank you for completing the AI-assisted cases. To measure long-term
            learning, we need you to return <strong>one week from now</strong> to
            complete the final assessment.
          </p>
          <div className="bg-blue-50 p-6 rounded-lg border-2 border-blue-200 mb-6">
            <p className="font-semibold text-blue-900 mb-2">
              Return Date: {getReturnDate()}
            </p>
            <p className="text-sm text-blue-700">
              You'll receive an email reminder before the post-test window opens.
            </p>
          </div>
          <p className="text-gray-600 text-sm">
            Your progress has been saved. You can close this page.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: POST-TEST
  // ========================================
  if (currentPhase === PHASES.POST_TEST) {
    const currentCase = cases[currentCaseIndex];

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto">
          <PhaseHeader
            phase="Post-Test"
            description="Learning assessment (no AI assistance)"
            caseNumber={currentCaseIndex + 1}
            totalCases={cases.length}
          />
          {currentCase && (
            <NoAIInterface caseData={currentCase} onComplete={handleCaseComplete} />
          )}
        </div>
      </div>
    );
  }

  // ========================================
  // PHASE: COMPLETE
  // ========================================
  if (currentPhase === PHASES.COMPLETE) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100">
        <div className="bg-white p-10 rounded-lg shadow-xl max-w-2xl text-center">
          <div className="text-6xl mb-6">🎉</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Experiment Complete!
          </h2>
          <p className="text-gray-700 mb-6 leading-relaxed">
            Thank you for participating in this research study. Your data will help
            improve AI-assisted clinical education in Kazakhstan.
          </p>
          <div className="bg-gray-50 p-6 rounded-lg mb-6">
            <p className="text-sm text-gray-600">
              Participant ID: <span className="font-mono">{studentId}</span>
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Please contact the research team to schedule your interview.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// ========================================
// HELPER COMPONENTS
// ========================================

function PhaseHeader({ phase, description, caseNumber, totalCases }) {
  const progress = caseNumber && totalCases ? (caseNumber / totalCases) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-800">{phase}</h2>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        {caseNumber && (
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {caseNumber} / {totalCases}
            </div>
            <div className="text-sm text-gray-600">Cases</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {caseNumber && totalCases && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progress)}% Complete</span>
            <span>{totalCases - caseNumber} remaining</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegistrationForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    studentId: '',
    age: '',
    gender: '',
    medicalSchool: '',
    yearOfStudy: '',
    language: 'ru',
  });

  const [consentGiven, setConsentGiven] = useState(false);
  const [studentIdStatus, setStudentIdStatus] = useState(null); // 'checking' | 'valid' | 'duplicate' | 'invalid'
  const [studentIdError, setStudentIdError] = useState('');

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });

    // Reset ID validation when user types
    if (e.target.name === 'studentId') {
      setStudentIdStatus(null);
      setStudentIdError('');
    }
  };

  const validateStudentId = async (id) => {
    if (!id || id.length < 3) {
      setStudentIdStatus('invalid');
      setStudentIdError('ID must be at least 3 characters');
      return false;
    }

    setStudentIdStatus('checking');

    try {
      // Check for duplicate in database
      const { data, error } = await supabase
        .from('users')
        .select('student_id')
        .eq('student_id', id)
        .single();

      // PGRST116 = no rows found (which means ID is available - good!)
      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setStudentIdStatus('duplicate');
        setStudentIdError('This Student ID is already registered');
        return false;
      }

      setStudentIdStatus('valid');
      setStudentIdError('');
      return true;
    } catch (err) {
      console.error('Error checking student ID:', err);
      setStudentIdStatus('invalid');
      setStudentIdError('Unable to verify ID. Please check your connection and try again.');
      return false;
    }
  };

  const handleStudentIdBlur = () => {
    if (formData.studentId) {
      validateStudentId(formData.studentId);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if validation is still running
    if (studentIdStatus === 'checking') {
      showNotification('Please wait while we verify your Student ID', 'info', 3000);
      return;
    }

    if (!consentGiven) {
      showNotification('Please provide informed consent to participate', 'warning');
      return;
    }

    // Validate student ID before submission
    const isValid = await validateStudentId(formData.studentId);
    if (!isValid) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <>
      {NotificationComponent}
      <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Student ID
        </label>
        <p className="text-xs text-gray-600 mb-2">
          Enter your university student ID or the research ID provided by your instructor
        </p>
        <div className="relative">
          <input
            type="text"
            name="studentId"
            value={formData.studentId}
            onChange={handleChange}
            onBlur={handleStudentIdBlur}
            required
            className={`w-full p-3 pr-10 border rounded-lg focus:ring-2 transition ${
              studentIdStatus === 'valid'
                ? 'border-green-500 focus:ring-green-500'
                : studentIdStatus === 'duplicate' || studentIdStatus === 'invalid'
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="e.g., MED2024-001"
          />
          {studentIdStatus === 'checking' && (
            <span className="absolute right-3 top-3.5 text-gray-400">⌛</span>
          )}
          {studentIdStatus === 'valid' && (
            <span className="absolute right-3 top-3.5 text-green-600">✓</span>
          )}
          {(studentIdStatus === 'duplicate' || studentIdStatus === 'invalid') && (
            <span className="absolute right-3 top-3.5 text-red-600">✗</span>
          )}
        </div>
        {studentIdError && (
          <p className="text-xs text-red-600 mt-1">{studentIdError}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            min="18"
            max="65"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Medical School
        </label>
        <input
          type="text"
          name="medicalSchool"
          value={formData.medicalSchool}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Astana Medical University"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Year of Study
        </label>
        <select
          name="yearOfStudy"
          value={formData.yearOfStudy}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select...</option>
          {[1, 2, 3, 4, 5, 6].map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
        <h3 className="font-bold text-gray-800 mb-3">Informed Consent</h3>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          I understand that this study involves diagnosing clinical cases with AI
          assistance. I consent to participate and understand that my data will be
          anonymized and used for research purposes. I can withdraw at any time.
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-gray-800">
            I have read and agree to the informed consent
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={!consentGiven}
        className={`w-full py-4 rounded-lg font-bold text-lg transition ${
          consentGiven
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        Begin Experiment
      </button>
    </form>
    </>
  );
}

function getReturnDate() {
  const returnDate = new Date();
  returnDate.setDate(returnDate.getDate() + 7);
  return returnDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
