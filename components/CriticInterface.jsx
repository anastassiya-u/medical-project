/**
 * CriticInterface Component (Evaluative AI)
 * Implements hypothesis comparison table with progressive evidence reveal
 *
 * Key Features:
 * - Hypothesis comparison table (3 AI hypotheses + optional user row)
 * - Progressive reveal (partiality mechanism - de Jong et al., 2025)
 * - Mandatory typed final answer (equalizes effort with Oracle)
 * - SDT logging integration (Autonomy, Competence)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { useNotification } from './Notification';
import { useTranslation } from '../lib/translations';
import { getCaseField, getPatientGender, getPatientEthnicity, getRealVitals } from '../lib/case-field-helper';
import VitalsBlock from './VitalsBlock';

export default function CriticInterface({ caseData, onComplete, accuracyLevel, language = 'ru' }) {
  const t = useTranslation(language);

  // User's optional hypothesis row
  const [userRowHypothesis, setUserRowHypothesis] = useState('');
  const [userRowEvidence, setUserRowEvidence] = useState(null);
  const [generatingUserRow, setGeneratingUserRow] = useState(false);

  // Final answer (mandatory)
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [confidence, setConfidence] = useState(null);

  // Progressive Reveal State
  const [revealedPanels, setRevealedPanels] = useState([]);

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Prevent duplicate case initialization
  const caseInitialized = useRef(false);
  const currentCaseId = useRef(null);

  // Reset all state when case changes
  useEffect(() => {
    setUserRowHypothesis('');
    setUserRowEvidence(null);
    setGeneratingUserRow(false);
    setFinalDiagnosis('');
    setConfidence(null);
    setRevealedPanels([]);
    caseInitialized.current = false;
    currentCaseId.current = null;
  }, [caseData.id]);

  // Evidence panels (partiality stages)
  const availablePanels = [
    { id: 'symptoms', label: t.showSymptomAnalysis, icon: '🩺' },
    { id: 'labs', label: t.showLabResults, icon: '🧪' },
    { id: 'imaging', label: t.showImagingStudies, icon: '🔬' },
    { id: 'vitals', label: t.showVitalSigns, icon: '📈' },
  ];

  // Pre-filled hypotheses from case data
  const suggestedHypotheses = caseData.suggestedHypotheses || [];

  // Generate arguments for optional user row
  const handleGenerateUserRow = useCallback(async () => {
    if (userRowHypothesis.trim().length < 3) return;
    setGeneratingUserRow(true);
    try {
      const res = await fetch('/api/evaluate-hypothesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caseData,
          userHypothesis: userRowHypothesis.trim(),
          accuracyLevel: accuracyLevel || 'high',
          isFoilCase: caseData.isFoil || false,
          language,
        }),
      });
      const data = await res.json();
      // API returns { supporting: [...], challenging: [...] } directly
      const rawFor = data.supporting || data.evidenceFor || [];
      const rawAgainst = data.challenging || data.evidenceAgainst || [];
      if (rawFor.length > 0 || rawAgainst.length > 0) {
        // Equalise lengths: keep min(for, against) items from each
        const count = Math.min(rawFor.length, rawAgainst.length) || Math.max(rawFor.length, rawAgainst.length);
        setUserRowEvidence({
          argsFor: rawFor.slice(0, count),
          argsAgainst: rawAgainst.slice(0, count),
        });
        await logger.submitHypothesis(userRowHypothesis.trim());
      }
    } catch (err) {
      showNotification(language === 'ru' ? 'Ошибка генерации аргументов' : 'Error generating arguments', 'error');
    } finally {
      setGeneratingUserRow(false);
    }
  }, [userRowHypothesis, caseData, accuracyLevel, language, showNotification]);

  // Handle evidence panel reveal
  const handleRevealPanel = async (panelId) => {
    if (revealedPanels.includes(panelId)) {
      setRevealedPanels(revealedPanels.filter((id) => id !== panelId));
      await logger.closeEvidencePanel(panelId);
    } else {
      setRevealedPanels([...revealedPanels, panelId]);
      await logger.openEvidencePanel(panelId);
    }
  };

  // Submit final diagnosis
  const handleSubmitFinal = useCallback(async () => {
    if (!confidence) {
      showNotification(t.rateConfidenceWarning, 'warning');
      return;
    }
    if (!finalDiagnosis || finalDiagnosis.trim().length < 3) {
      showNotification(t.enterDiagnosisWarning, 'warning');
      return;
    }
    await logger.rateConfidence(confidence, 'post');
    await logger.submitFinalDiagnosis(finalDiagnosis.trim());
    onComplete();
  }, [confidence, finalDiagnosis, showNotification, onComplete, t]);

  // Initialize case (runs only when case changes)
  useEffect(() => {
    if (caseInitialized.current && currentCaseId.current === caseData.id) return;
    caseInitialized.current = true;
    currentCaseId.current = caseData.id;

    const initCase = async () => {
      // AI fields are written atomically in the INSERT to prevent TBD rows.
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
      if (e.key === 'Enter' && e.ctrlKey && confidence && finalDiagnosis.trim().length >= 3) {
        handleSubmitFinal();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [confidence, finalDiagnosis, handleSubmitFinal]);

  // Helper: get localized field from hypothesis object
  const getHypothesisField = (h, field) => {
    if (language === 'ru' && h[`${field}_ru`]) return h[`${field}_ru`];
    return h[field] || '';
  };

  return (
    <>
      {NotificationComponent}
      <div className="max-w-5xl mx-auto p-6 space-y-6">

        {/* Case Presentation */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
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

        {/* Progressive Reveal Panels */}
        <div className="bg-white rounded-lg shadow-md p-5 border border-gray-200">
          <p className="text-sm font-semibold text-gray-700 mb-3">{t.revealEvidence}</p>
          <div className="flex flex-wrap gap-3">
            {availablePanels.map((panel) => {
              const isRevealed = revealedPanels.includes(panel.id);
              return (
                <button
                  key={panel.id}
                  onClick={() => handleRevealPanel(panel.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 text-sm ${
                    isRevealed
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
                >
                  <span>{panel.icon}</span>
                  <span>
                    {isRevealed
                      ? `✓ ${panel.label.replace(/^(Show|Показать)\s+/i, '')} ${t.hideLabel}`
                      : panel.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Revealed evidence panels */}
          {revealedPanels.map((panelId) => (
            <div
              key={panelId}
              className="mt-4 bg-indigo-50 rounded-lg p-4 border border-indigo-200 animate-fadeIn"
            >
              <h4 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                <span>{availablePanels.find((p) => p.id === panelId)?.icon}</span>
                {availablePanels.find((p) => p.id === panelId)?.label}
              </h4>
              <div className="text-sm text-gray-700">
                {panelId === 'labs' && (
                  <div className="space-y-2">
                    {caseData.labs ? (
                      Object.entries(caseData.labs)
                        .filter(([key]) => key !== 'source')
                        .map(([key, value]) => (
                          <p key={key}>
                            <strong>{t[key] || key.replace(/([A-Z_])/g, ' $1').trim()}:</strong> {value}
                          </p>
                        ))
                    ) : (
                      <p className="text-gray-500 italic">{language === 'ru' ? 'Лабораторные данные недоступны' : 'Lab data unavailable'}</p>
                    )}
                  </div>
                )}
                {panelId === 'vitals' && (
                  <VitalsRevealPanel vitals={caseData.vitals} t={t} />
                )}
                {panelId === 'imaging' && (
                  <div>
                    {(caseData.imaging || caseData.imaging_ru) ? (
                      <p className="leading-relaxed">{getCaseField(caseData, 'imaging', language)}</p>
                    ) : (
                      <p className="text-gray-500 italic">{language === 'ru' ? 'Данные визуализации недоступны' : 'Imaging data unavailable'}</p>
                    )}
                  </div>
                )}
                {panelId === 'symptoms' && (
                  <div className="space-y-3">
                    <div>
                      <p className="font-semibold mb-1">{language === 'ru' ? 'Основная жалоба:' : 'Chief Complaint:'}</p>
                      <p>{getCaseField(caseData, 'chiefComplaint', language)}</p>
                    </div>
                    <div>
                      <p className="font-semibold mb-1">{language === 'ru' ? 'Физикальное обследование:' : 'Physical Examination:'}</p>
                      <p>{getCaseField(caseData, 'physicalExam', language)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Hypothesis Comparison Table */}
        <div className="bg-white rounded-lg shadow-md border border-purple-200 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span>🧠</span>
              {t.hypothesisComparison}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50 border-b border-purple-200">
                  <th className="px-4 py-3 text-left text-purple-800 font-semibold w-8">#</th>
                  <th className="px-4 py-3 text-left text-purple-800 font-semibold w-1/4">{t.hypothesisColumn}</th>
                  <th className="px-4 py-3 text-left text-green-800 font-semibold w-[37.5%]">
                    <span className="flex items-center gap-1">✓ {t.argsForColumn}</span>
                  </th>
                  <th className="px-4 py-3 text-left text-red-800 font-semibold w-[37.5%]">
                    <span className="flex items-center gap-1">✗ {t.argsAgainstColumn}</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {suggestedHypotheses.length > 0 ? (
                  suggestedHypotheses.map((h, i) => {
                    const label = ['A', 'B', 'C'][i] || String(i + 1);
                    const diagnosis = getHypothesisField(h, 'diagnosis');
                    const rawFor = getHypothesisField(h, 'argsFor');
                    const rawAgainst = getHypothesisField(h, 'argsAgainst');
                    // Equalise: show same number of bullets in both columns
                    const count = Array.isArray(rawFor) && Array.isArray(rawAgainst)
                      ? Math.min(rawFor.length, rawAgainst.length)
                      : 0;
                    const argsFor = Array.isArray(rawFor) ? rawFor.slice(0, count) : [];
                    const argsAgainst = Array.isArray(rawAgainst) ? rawAgainst.slice(0, count) : [];
                    return (
                      <tr key={h.id || i} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
                            {label}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top font-medium text-gray-900">
                          {diagnosis}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {Array.isArray(argsFor) && argsFor.length > 0 ? (
                            <ul className="space-y-1">
                              {argsFor.map((arg, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-gray-700">
                                  <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                                  <span>{arg}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic text-xs">{t.pendingMedicalData}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {Array.isArray(argsAgainst) && argsAgainst.length > 0 ? (
                            <ul className="space-y-1">
                              {argsAgainst.map((arg, idx) => (
                                <li key={idx} className="flex items-start gap-1.5 text-gray-700">
                                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                                  <span>{arg}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic text-xs">{t.pendingMedicalData}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* Placeholder rows when no data yet */
                  ['A', 'B', 'C'].map((label, i) => (
                    <tr key={label} className={`border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-4 align-top">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400 font-bold text-xs">
                          {label}
                        </span>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-40"></div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5"></div>
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="space-y-2">
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
                          <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}

                {/* Optional user row (+) */}
                <tr className="border-t-2 border-dashed border-purple-300 bg-purple-50">
                  <td className="px-4 py-4 align-top">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-sm">
                      +
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top" colSpan={userRowEvidence ? 1 : 3}>
                    <div className="space-y-2">
                      <p className="text-xs text-purple-700 font-medium">{t.optionalHypothesisHint}</p>
                      <textarea
                        value={userRowHypothesis}
                        onChange={(e) => setUserRowHypothesis(e.target.value)}
                        placeholder={t.addYourHypothesis}
                        className="w-full p-2 border border-purple-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-400 resize-none bg-white"
                        rows={2}
                      />
                      {userRowHypothesis.trim().length >= 3 && !userRowEvidence && (
                        <button
                          onClick={handleGenerateUserRow}
                          disabled={generatingUserRow}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            generatingUserRow
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {generatingUserRow ? (
                            <span className="flex items-center gap-2">
                              <span className="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                              {t.generatingArguments}
                            </span>
                          ) : (
                            t.generateArguments
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                  {userRowEvidence && (
                    <>
                      <td className="px-4 py-4 align-top">
                        <ul className="space-y-1">
                          {userRowEvidence.argsFor.map((arg, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-gray-700 text-sm">
                              <span className="text-green-600 mt-0.5 flex-shrink-0">•</span>
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <ul className="space-y-1">
                          {userRowEvidence.argsAgainst.map((arg, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-gray-700 text-sm">
                              <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                              <span>{arg}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Final Answer Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
          <h3 className="text-xl font-bold text-gray-800 mb-1">{t.yourFinalDiagnosisLabel}</h3>
          <p className="text-sm text-gray-500 mb-5">
            {language === 'ru'
              ? 'Изучив таблицу выше, введите ваш окончательный диагноз вручную.'
              : 'After reviewing the table above, type your final diagnosis below.'}
          </p>

          <textarea
            value={finalDiagnosis}
            onChange={(e) => setFinalDiagnosis(e.target.value)}
            placeholder={t.typeFinalDiagnosis}
            className="w-full p-4 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg resize-none"
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
                  onClick={() => setConfidence(item.num)}
                  className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                    confidence === item.num
                      ? 'bg-purple-600 text-white'
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

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.25s ease-out; }
      `}</style>
    </>
  );
}

const VITAL_KEYS = [
  { key: 'temperature',      tKey: 'temp'  },
  { key: 'bloodPressure',    tKey: 'bp'    },
  { key: 'heartRate',        tKey: 'hr'    },
  { key: 'respiratoryRate',  tKey: 'rr'    },
  { key: 'oxygenSaturation', tKey: 'o2sat' },
];

function VitalsRevealPanel({ vitals, t }) {
  const real = getRealVitals(vitals);
  if (!real) return (
    <p className="text-gray-500 italic text-sm">
      {t.vitalsNotProvided || 'Vital signs not provided in the case'}
    </p>
  );
  return (
    <div className="grid grid-cols-2 gap-2">
      {VITAL_KEYS.map(({ key, tKey }) =>
        real[key] ? (
          <div key={key} className={`bg-white p-2 rounded border${key === 'oxygenSaturation' ? ' col-span-2' : ''}`}>
            <span className="text-gray-600">{t[tKey]}:</span>{' '}
            <span className="font-medium">{real[key]}</span>
          </div>
        ) : null
      )}
    </div>
  );
}
