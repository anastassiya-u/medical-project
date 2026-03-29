/**
 * NoAIInterface Component
 * Used for Pre-Test and Post-Test phases (no AI assistance)
 * Measures baseline and learning gain
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { useNotification } from './Notification';
import { useTranslation } from '../lib/translations';
import { getCaseField, getPatientGender, getPatientEthnicity } from '../lib/case-field-helper';

export default function NoAIInterface({ caseData, onComplete, language = 'ru' }) {
  // Get translations
  const t = useTranslation(language);
  const [diagnosis, setDiagnosis] = useState('');
  const [confidence, setConfidence] = useState(null);
  const [startTime, setStartTime] = useState(null);

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Track if case has been initialized (prevent duplicate logging)
  const caseInitialized = useRef(false);
  const currentCaseId = useRef(null);

  // Reset state when case changes (critical for multi-case flow)
  useEffect(() => {
    setDiagnosis('');
    setConfidence(null);
    setStartTime(null);
    caseInitialized.current = false;
    currentCaseId.current = null;
  }, [caseData.id]);

  // Define handleSubmit BEFORE useEffect that references it
  const handleSubmit = useCallback(async () => {
    if (!diagnosis || !confidence) {
      showNotification(t.rateConfidenceWarning, 'warning');
      return;
    }

    const taskTime = Math.round((Date.now() - startTime) / 1000);

    // FIX: Log confidence rating before submitting diagnosis
    await logger.rateConfidence(confidence, 'pre');

    // Log as a no-AI case
    await logger.submitFinalDiagnosis(diagnosis);

    onComplete();
  }, [diagnosis, confidence, startTime, showNotification, onComplete]);

  // Initialize case (runs only when case changes)
  useEffect(() => {
    if (caseInitialized.current && currentCaseId.current === caseData.id) return;
    caseInitialized.current = true;
    currentCaseId.current = caseData.id;
    setStartTime(Date.now());
    logger.startCase(caseData.id, caseData.order);
  }, [caseData]);

  // Keyboard shortcut: Ctrl+Enter to submit (separate effect so it stays current)
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && e.ctrlKey && diagnosis && confidence) {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [diagnosis, confidence, handleSubmit]);

  return (
    <>
      {NotificationComponent}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Case Presentation */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-gray-500">
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
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <strong className="block mb-2">{t.vitalSigns}:</strong>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>{t.temp}: {caseData.vitals.temperature}</span>
              <span>{t.bp}: {caseData.vitals.bloodPressure}</span>
              <span>{t.hr}: {caseData.vitals.heartRate}</span>
              <span>{t.rr}: {caseData.vitals.respiratoryRate}</span>
              <span>{t.o2sat}: {caseData.vitals.oxygenSaturation}</span>
            </div>
          </div>

          {/* Show labs and imaging if available */}
          {caseData.labs && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-3">
              <strong className="block mb-2">{t.laboratoryResults}:</strong>
              <div className="text-sm space-y-1">
                {Object.entries(caseData.labs).map(([key, value]) => {
                  // Map lab keys to translation keys
                  const labName = t[key] || key.replace(/([A-Z])/g, ' $1').trim();
                  return (
                    <p key={key}>
                      <span className="font-medium">
                        {labName}:
                      </span>{' '}
                      {value}
                    </p>
                  );
                })}
              </div>
            </div>
          )}

          {(caseData.imaging || caseData.imaging_ru) && (
            <div className="bg-gray-50 p-4 rounded border border-gray-200 mt-3">
              <strong className="block mb-2">{t.imaging}:</strong>
              <p className="text-sm">{getCaseField(caseData, 'imaging', language)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis Input (No AI Assistance) */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">📝</span>
          <h3 className="text-xl font-bold text-gray-800">{t.yourDiagnosis}</h3>
        </div>
        <p className="text-gray-600 mb-4">
          {t.basedOnPresentation}
        </p>

        <textarea
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder={t.enterYourDiagnosis}
          className="w-full p-4 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent text-lg mb-4"
          rows={3}
        />

        {/* Confidence Rating */}
        <div>
          <p className="text-sm text-gray-600 mb-2">
            {t.howConfidentPre}
          </p>
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
                onClick={() => setConfidence(item.num)}
                className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                  confidence === item.num
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <div className="text-lg">{item.num}</div>
                <div className="text-xs">{item.label}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!diagnosis || !confidence}
          className={`mt-6 w-full py-4 rounded-lg font-bold text-lg transition ${
            diagnosis && confidence
              ? 'bg-gray-700 text-white hover:bg-gray-800'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {t.submitDiagnosis} →
        </button>
      </div>

      {/* No AI Notice */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
        <p className="text-sm text-blue-800">
          <strong>{t.noAINote}</strong> {t.noAIMessage}
        </p>
      </div>
    </div>
    </>
  );
}
