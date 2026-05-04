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
import { useTranslation } from '../lib/translations';
import { getCasesData } from '../lib/case-loader';

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
 * Study flow: REGISTRATION → PRE_TEST (4 cases) → INTERVENTION (10 cases) → NFC_ASSESSMENT (15 items) → COMPLETE
 * Post-test is deployed as a separate application — not part of this flow.
 */
const PHASES = {
  REGISTRATION: 'registration',
  PRE_TEST: 'pre_test',
  INTERVENTION: 'intervention',
  NFC_ASSESSMENT: 'nfc_assessment',
  COMPLETE: 'complete',
};

// Case counts enforced as explicit constants
const CASE_COUNTS = {
  PRE_TEST: 4,
  INTERVENTION: 10,
};

export default function SessionOrchestrator() {
  console.log('🚀 SessionOrchestrator component rendering');

  // User & Session State
  const [userId, setUserId] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [paradigm, setParadigm] = useState(null);
  const [accuracyLevel, setAccuracyLevel] = useState(null);
  const [randomizationSeed, setRandomizationSeed] = useState(null);
  const [language, setLanguage] = useState('ru'); // Default to Russian

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

  // Translations
  const t = useTranslation(language);

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
        if (session.language) setLanguage(session.language);

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
        const requiresCases = [PHASES.PRE_TEST, PHASES.INTERVENTION].includes(session.currentPhase);
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
      language,
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
          first_name: formData.firstName,
          last_name: formData.lastName,
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
      setStudentId(user.student_id);
      setParadigm(group.paradigm);
      setAccuracyLevel(group.accuracy_level);
      setRandomizationSeed(seed);
      setLanguage(formData.language || 'ru'); // Save user's language choice

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

    // Get cases data in the appropriate language
    const casesData = getCasesData(language);

    switch (phase) {
      case PHASES.PRE_TEST:
        phaseCases = casesData.cases
          .filter((c) => c.phase === 'pre-test');
        break;

      case PHASES.INTERVENTION:
        let interventionCases = casesData.cases
          .filter((c) => c.phase === 'intervention');

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
   * Flow: PRE_TEST → INTERVENTION → NFC_ASSESSMENT → COMPLETE
   */
  const handlePhaseComplete = async () => {
    await logger.completeSession();

    switch (currentPhase) {
      case PHASES.PRE_TEST:
        transitionToPhase(PHASES.INTERVENTION);
        break;

      case PHASES.INTERVENTION:
        transitionToPhase(PHASES.NFC_ASSESSMENT);
        break;

      case PHASES.NFC_ASSESSMENT:
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
    try {
      await logger.submitNFC(responses);
      handlePhaseComplete();
    } catch (error) {
      console.error('NFC submission failed:', error);
      setError('Failed to save your responses. Please try again or contact support.');
      // Don't proceed to next phase if submission failed
    }
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
            phase={t.preTest}
            description={t.baselineAssessment}
            caseNumber={currentCaseIndex + 1}
            totalCases={cases.length}
            language={language}
          />
          {currentCase && (
            <NoAIInterface caseData={currentCase} onComplete={handleCaseComplete} language={language} />
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
            phase={t.nfcAssessment}
            description={t.nfcQuickQuestionnaire}
            language={language}
          />
          <NFCScale onComplete={handleNFCComplete} language={language} />
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
            phase={paradigm === 'oracle' ? t.oracle : t.critic}
            description={t.aiAssistedDiagnosis}
            caseNumber={currentCaseIndex + 1}
            totalCases={cases.length}
            language={language}
          />
          {currentCase && (
            <InterfaceComponent
              caseData={currentCase}
              onComplete={handleCaseComplete}
              accuracyLevel={accuracyLevel}
              language={language}
            />
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
            <p className="text-sm text-gray-600 mb-2">Your participant number (please note it down):</p>
            <p className="text-4xl font-bold font-mono text-blue-700 mb-3">{studentId}</p>
            <p className="text-sm text-gray-600">
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

function PhaseHeader({ phase, description, caseNumber, totalCases, language = 'ru' }) {
  const t = useTranslation(language);
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
            <div className="text-sm text-gray-600">{t.cases}</div>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {caseNumber && totalCases && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progress)}% {t.complete}</span>
            <span>{totalCases - caseNumber} {t.remaining}</span>
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
    firstName: '',
    lastName: '',
    age: '',
    gender: '',
    medicalSchool: '',
    yearOfStudy: '',
    language: 'ru',
  });

  const [consentGiven, setConsentGiven] = useState(false);

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Translations
  const t = useTranslation(formData.language);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!consentGiven) {
      showNotification('Please provide informed consent to participate', 'warning');
      return;
    }

    onSubmit(formData);
  };

  return (
    <>
      {NotificationComponent}
      <form onSubmit={handleSubmit} className="space-y-6">
      {/* Language Selector - PROMINENT PLACEMENT */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
        <label className="block text-lg font-bold text-gray-800 mb-3">
          🌐 Interface Language / Язык интерфейса
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, language: 'en' })}
            className={`p-4 rounded-lg font-semibold text-lg transition ${
              formData.language === 'en'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, language: 'ru' })}
            className={`p-4 rounded-lg font-semibold text-lg transition ${
              formData.language === 'ru'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-white text-gray-700 hover:bg-blue-100 border-2 border-gray-300'
            }`}
          >
            🇷🇺 Русский
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.firstNameLabel}</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t.firstNamePlaceholder}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.lastNameLabel}</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t.lastNamePlaceholder}
          />
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">{t.namePrivacyNote}</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t.ageLabel}</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            required
            min="18"
            max="65"
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder={t.agePlaceholder}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t.genderLabel}
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t.genderSelect}</option>
            <option value="Male">{t.genderMale}</option>
            <option value="Female">{t.genderFemale}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.medicalSchoolLabel}
        </label>
        <input
          type="text"
          name="medicalSchool"
          value={formData.medicalSchool}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder={t.medicalSchoolPlaceholder}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t.yearLabel}
        </label>
        <select
          name="yearOfStudy"
          value={formData.yearOfStudy}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{t.yearSelect || (formData.language === 'ru' ? 'Выберите курс...' : 'Select year...')}</option>
          <option value="1">{t.year1}</option>
          <option value="2">{t.year2}</option>
          <option value="3">{t.year3}</option>
          <option value="4">{t.year4}</option>
          <option value="5">{t.year5}</option>
          <option value="6">{t.year6}</option>
        </select>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
        <h3 className="font-bold text-gray-800 mb-3">{t.consentHeading}</h3>
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          {t.consentText}
        </p>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-medium text-gray-800">
            {t.consentCheckbox}
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
        {t.beginButton}
      </button>
    </form>
    </>
  );
}

