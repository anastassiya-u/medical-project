/**
 * OracleInterface Component (Directive XAI)
 * Implements recommend-and-defend paradigm with unilateral explanations
 *
 * Key Features:
 * - Immediate AI recommendation (no hypothesis required)
 * - Unilateral explanation (only supporting evidence)
 * - No progressive reveal (all evidence shown at once)
 * - Authority-style presentation (confirmation bias layout)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { useNotification } from './Notification';
import { useTranslation } from '../lib/translations';
import { getCaseField, getPatientGender, getPatientEthnicity } from '../lib/case-field-helper';
import VitalsBlock from './VitalsBlock';

export default function OracleInterface({ caseData, onComplete, language = 'ru' }) {
  // Get translations
  const t = useTranslation(language);
  // UI State
  const [confidence, setConfidence] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Track if case has been initialized (prevent duplicate logging)
  const caseInitialized = useRef(false);
  const currentCaseId = useRef(null);

  // Reset state when case changes (critical for multi-case flow)
  useEffect(() => {
    setConfidence(null);
    setFinalDiagnosis('');
    caseInitialized.current = false;
    currentCaseId.current = null;
  }, [caseData.id]);

  // Handle final diagnosis submission - MUST be defined before useEffect that uses it
  const handleSubmitFinal = useCallback(async () => {
    if (!confidence) {
      showNotification(t.rateConfidenceWarning, 'warning');
      return;
    }

    if (!finalDiagnosis) {
      showNotification(t.enterDiagnosisWarning, 'warning');
      return;
    }

    await logger.submitFinalDiagnosis(finalDiagnosis);
    onComplete();
  }, [confidence, finalDiagnosis, showNotification, onComplete]);

  // Initialize case (runs only when case changes)
  useEffect(() => {
    if (caseInitialized.current && currentCaseId.current === caseData.id) return;

    caseInitialized.current = true;
    currentCaseId.current = caseData.id;

    const initCase = async () => {
      // AI fields written atomically in the INSERT to prevent TBD rows.
      // Diagnosis label only — not the long explanatory sentence.
      const aiLabel = caseData.isFoil
        ? getCaseField(caseData, 'foilDiagnosis', language)
        : getCaseField(caseData, 'correctDiagnosis', language);
      await logger.startCase(caseData.id, caseData.order, {
        aiRecommendation: aiLabel,
        correctDiagnosis: getCaseField(caseData, 'correctDiagnosis', language),
        isFoil: caseData.isFoil || false,
      });
      // viewAIOutput now only writes timestamp_ai_output_viewed
      await logger.viewAIOutput(aiLabel, getCaseField(caseData, 'correctDiagnosis', language), caseData.isFoil || false);
    };

    initCase();
  }, [caseData]);

  // Keyboard shortcut: Ctrl+Enter to submit (separate effect so it stays current)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && e.ctrlKey && confidence && finalDiagnosis) {
        handleSubmitFinal();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [confidence, finalDiagnosis, handleSubmitFinal]);

  // Handle confidence rating
  const handleConfidenceRating = async (rating) => {
    setConfidence(rating);
    await logger.rateConfidence(rating, 'post');
  };

  return (
    <>
      {NotificationComponent}
      <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Case Presentation */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.clinicalCase}</h2>
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>{t.patient}:</strong> {caseData.patient.age}{language === 'ru' ? ' лет' : 'yo'} {getPatientGender(caseData.patient, language)}
            {getPatientEthnicity(caseData.patient, language) && `, ${getPatientEthnicity(caseData.patient, language)}`}
          </p>
          <p>
            <strong>{t.chiefComplaint}:</strong> {getCaseField(caseData, 'chiefComplaint', language)}
          </p>
          <p>
            <strong>{t.history}:</strong> {getCaseField(caseData, 'history', language)}
          </p>
          <p>
            <strong>{t.physicalExam}:</strong> {getCaseField(caseData, 'physicalExam', language)}
          </p>
          <VitalsBlock vitals={caseData.vitals} t={t} language={language} />
        </div>
      </div>

      {/* AI RECOMMENDATION (Immediate, Authoritative) */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white rounded-full p-4">
            <span className="text-5xl">🤖</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold">{t.aiRecommendation}</h3>
            {/* RESEARCH DESIGN: Confidence level hidden to prevent blind trust/authority bias */}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/30">
          <p className="text-4xl font-bold mb-2">
            {caseData.isFoil
              ? getCaseField(caseData, 'foilDiagnosis', language)
              : getCaseField(caseData, 'correctDiagnosis', language)}
          </p>
          <p className="text-blue-100 text-sm">
            {t.basedOnClinical}
          </p>
        </div>
      </div>

      {/* UNILATERAL EXPLANATION (Only Supporting Evidence) */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-300">
        <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-3">
          <span className="text-3xl">✓</span>
          {t.whyThisDiagnosis}
        </h3>

        <div className="space-y-4">
          {/* Supporting Evidence (All visible at once - no partiality) */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3 text-lg">
              {t.clinicalEvidence}
            </h4>
            <ul className="space-y-3">
              {((language === 'ru' && caseData.supportingEvidence_ru)
                ? caseData.supportingEvidence_ru
                : caseData.supportingEvidence
              ).map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-blue-600 text-xl mt-0.5">✓</span>
                  <span className="text-gray-800">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Lab Results (All visible immediately) */}
          {caseData.labs && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-300">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🧪</span>
                {t.laboratoryFindings}
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {Object.entries(caseData.labs)
                  .filter(([key]) => key !== 'source')
                  .map(([key, value]) => (
                    <div key={key}>
                      <span className="font-medium text-gray-700">
                        {t[key] || key.replace(/([A-Z_])/g, ' $1').trim()}:
                      </span>{' '}
                      <span className="text-gray-900">{value}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Imaging Results (All visible immediately) */}
          {(caseData.imaging || caseData.imaging_ru) && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-300">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                {t.imagingStudies}
              </h4>
              <p className="text-gray-800">{getCaseField(caseData, 'imaging', language)}</p>
            </div>
          )}

          {/* Clinical Reasoning (Process Explanation) */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3 text-lg">
              {t.clinicalReasoning}
            </h4>
            <p className="text-gray-800 leading-relaxed">
              {(language === 'ru' && caseData.clinicalReasoning_ru)
                ? caseData.clinicalReasoning_ru
                : caseData.clinicalReasoning}
            </p>
          </div>
        </div>
      </div>

      {/* USER DECISION */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{t.yourFinalDiagnosisLabel}</h3>
        <p className="text-sm text-gray-500 mb-5">
          {language === 'ru'
            ? 'Ознакомившись с рекомендацией ИИ, введите ваш окончательный диагноз вручную.'
            : 'After reviewing the AI recommendation above, type your final diagnosis below.'}
        </p>

        <textarea
          value={finalDiagnosis}
          onChange={(e) => setFinalDiagnosis(e.target.value)}
          placeholder={t.typeFinalDiagnosis}
          className="w-full p-4 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg resize-none"
          rows={2}
        />

        {/* Confidence Rating */}
        <div className="mt-5">
          <p className="text-sm text-gray-600 mb-2">{t.howConfident}</p>
          <div className="flex gap-2">
            {[
              { num: 1, label: t.veryLow },
              { num: 2, label: t.low },
              { num: 3, label: t.moderate },
              { num: 4, label: t.high },
              { num: 5, label: t.veryHigh },
            ].map((item) => (
              <button
                key={item.num}
                onClick={() => handleConfidenceRating(item.num)}
                className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                  confidence === item.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <div className="text-lg">{item.num}</div>
                <div className="text-xs">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmitFinal}
          disabled={!confidence || finalDiagnosis.trim().length < 3}
          className={`mt-6 w-full py-4 rounded-lg font-bold text-lg transition ${
            confidence && finalDiagnosis.trim().length >= 3
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t.submitFinalDiagnosisButton} → <span className="text-sm font-normal opacity-75">(Ctrl+Enter)</span>
        </button>
      </div>

      {/* Design Note: Oracle shows AI as authoritative source */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>AI-Assisted Clinical Decision Support System</p>
      </div>
    </div>
    </>
  );
}
