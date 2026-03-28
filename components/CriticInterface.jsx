/**
 * CriticInterface Component (Evaluative AI)
 * Implements hypothesis-driven evaluation with progressive evidence reveal
 *
 * Key Features:
 * - Mandatory hypothesis input (blocks AI output)
 * - Contrastive evidence structure (FOR / AGAINST)
 * - Progressive reveal (partiality mechanism - de Jong et al., 2025)
 * - SDT logging integration (Autonomy, Competence)
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import logger from '../lib/logger';
import { useNotification } from './Notification';
import { useTranslation } from '../lib/translations';
import { getCaseField, getPatientGender, getPatientEthnicity } from '../lib/case-field-helper';

export default function CriticInterface({ caseData, onComplete, accuracyLevel, language = 'ru' }) {
  // Get translations
  const t = useTranslation(language);
  // UI State
  const [hypothesis, setHypothesis] = useState('');
  const [hypothesisSubmitted, setHypothesisSubmitted] = useState(false);
  const [confidencePre, setConfidencePre] = useState(null);
  const [confidencePost, setConfidencePost] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [revisedHypothesis, setRevisedHypothesis] = useState(false);
  const [revisionLogged, setRevisionLogged] = useState(false);

  // AI Evaluation State (NEW - for dynamic evidence)
  const [dynamicEvidence, setDynamicEvidence] = useState(null);
  const [loadingEvidence, setLoadingEvidence] = useState(false);

  // Progressive Reveal State
  const [revealedPanels, setRevealedPanels] = useState([]);
  const [activePanel, setActivePanel] = useState(null);

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Track if case has been initialized (prevent duplicate logging)
  const caseInitialized = useRef(false);
  const currentCaseId = useRef(null);

  // Reset state when case changes (critical for multi-case flow)
  useEffect(() => {
    setHypothesis('');
    setHypothesisSubmitted(false);
    setConfidencePre(null);
    setConfidencePost(null);
    setFinalDiagnosis('');
    setRevisedHypothesis(false);
    setRevisionLogged(false);
    setDynamicEvidence(null);
    setLoadingEvidence(false);
    setRevealedPanels([]);
    setActivePanel(null);
    caseInitialized.current = false;
    currentCaseId.current = null;
  }, [caseData.id]);

  // Evidence panels (partiality stages)
  const availablePanels = [
    { id: 'symptoms', label: t.showSymptomAnalysis, icon: '🩺' },
    { id: 'labs', label: t.showLabResults, icon: '🧪' },
    { id: 'vitals', label: t.showVitalSigns, icon: '📈' },
    { id: 'differential', label: t.showDifferential, icon: '🔬' },
  ];

  // Handle hypothesis submission - MUST be defined before useEffect that uses it
  const handleSubmitHypothesis = useCallback(async () => {
    if (hypothesis.length < 3) {
      showNotification(t.enterDiagnosisWarning, 'warning');
      return;
    }

    setHypothesisSubmitted(true);
    await logger.submitHypothesis(hypothesis);

    // Generate dynamic evidence using GPT-4 (via secure API route)
    setLoadingEvidence(true);
    try {
      console.log('🤖 Requesting AI evaluation for hypothesis:', hypothesis);

      // Call server-side API route (protects AWS credentials)
      const response = await fetch('/api/evaluate-hypothesis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseData,
          userHypothesis: hypothesis,
          accuracyLevel: accuracyLevel || 'high',
          isFoilCase: caseData.isFoil || false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const evidence = await response.json();
      setDynamicEvidence(evidence);

      // Log AI output viewed (for Critic, this happens after hypothesis)
      await logger.viewAIOutput(
        evidence.aiRecommendation || caseData.aiRecommendation,
        caseData.correctDiagnosis,
        evidence.isFoil || caseData.isFoil
      );

      console.log('✅ Dynamic evidence generated:', {
        supporting: evidence.supporting.length,
        challenging: evidence.challenging.length,
      });
    } catch (error) {
      console.error('Failed to generate dynamic evidence:', error);
      showNotification('AI evaluation in progress... Using fallback evidence.', 'info', 3000);

      // Fallback to static evidence if API fails (use Russian if available)
      const fallbackSupporting = language === 'ru' && caseData.contrastiveEvidence_ru
        ? caseData.contrastiveEvidence_ru.supporting
        : (caseData.contrastiveEvidence?.supporting || [
            'Dynamic evidence generation is temporarily unavailable.',
            'Please review the case data carefully.',
          ]);

      const fallbackChallenging = language === 'ru' && caseData.contrastiveEvidence_ru
        ? caseData.contrastiveEvidence_ru.challenging
        : (caseData.contrastiveEvidence?.challenging || [
            'Consider alternative diagnoses based on clinical presentation.',
          ]);

      setDynamicEvidence({
        supporting: fallbackSupporting,
        challenging: fallbackChallenging,
        aiRecommendation: getCaseField(caseData, 'aiRecommendation', language) || caseData.aiRecommendation,
        fallback: true,
      });

      // Still log AI output even with fallback
      await logger.viewAIOutput(
        caseData.aiRecommendation,
        caseData.correctDiagnosis,
        caseData.isFoil
      );
    } finally {
      setLoadingEvidence(false);
    }
  }, [hypothesis, showNotification, caseData, accuracyLevel]);

  // Handle final diagnosis submission - MUST be defined before useEffect that uses it
  const handleSubmitFinal = useCallback(async () => {
    if (!confidencePost) {
      showNotification(t.rateConfidenceWarningFinal, 'warning');
      return;
    }

    const diagnosisToSubmit = revisedHypothesis ? finalDiagnosis : hypothesis;

    // Log revision only once
    if (revisedHypothesis && finalDiagnosis !== hypothesis && !revisionLogged) {
      await logger.reviseHypothesis(
        finalDiagnosis,
        'User revised after seeing contrastive evidence'
      );
      setRevisionLogged(true);
    }

    await logger.submitFinalDiagnosis(diagnosisToSubmit);
    onComplete();
  }, [confidencePost, revisedHypothesis, finalDiagnosis, hypothesis, revisionLogged, showNotification, onComplete]);

  // Initialize case
  useEffect(() => {
    // Prevent duplicate initialization on re-renders
    if (!caseInitialized.current || currentCaseId.current !== caseData.id) {
      caseInitialized.current = true;
      currentCaseId.current = caseData.id;
      logger.startCase(caseData.id, caseData.order);
    }

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Enter key to submit (if ready)
      if (e.key === 'Enter' && e.ctrlKey) {
        if (!hypothesisSubmitted && hypothesis && confidencePre) {
          handleSubmitHypothesis();
        } else if (hypothesisSubmitted && confidencePost) {
          handleSubmitFinal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [caseData, hypothesisSubmitted, hypothesis, confidencePre, confidencePost, handleSubmitHypothesis, handleSubmitFinal]);

  // Handle evidence panel reveal
  const handleRevealPanel = async (panelId) => {
    if (revealedPanels.includes(panelId)) {
      // Close panel
      setActivePanel(null);
      await logger.closeEvidencePanel(panelId);
    } else {
      // Open panel
      setRevealedPanels([...revealedPanels, panelId]);
      setActivePanel(panelId);
      await logger.openEvidencePanel(panelId);
    }
  };

  // Handle confidence rating
  const handleConfidenceRating = async (rating, stage) => {
    if (stage === 'pre') {
      setConfidencePre(rating);
    } else {
      setConfidencePost(rating);
    }
    await logger.rateConfidence(rating, stage);
  };

  // Handle hypothesis revision
  const handleReviseHypothesis = () => {
    setRevisedHypothesis(true);
    setFinalDiagnosis(hypothesis); // Pre-fill with original
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
        </div>
      </div>

      {/* HYPOTHESIS LOCK: Must enter diagnosis first */}
      {!hypothesisSubmitted ? (
        <div className="bg-purple-50 rounded-lg shadow-md p-6 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">💭</span>
            <h3 className="text-xl font-bold text-purple-800">
              {t.enterDiagnosis}
            </h3>
          </div>
          <p className="text-gray-700 mb-3">
            {t.beforeViewing}
          </p>
          <div className="bg-indigo-100 border-l-4 border-indigo-600 p-3 mb-4">
            <p className="text-sm text-indigo-900">
              <strong>{t.whyEnter}</strong> {t.whyExplanation}
            </p>
          </div>

          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder={t.enterDiagnosisPlaceholder}
            className="w-full p-4 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            rows={3}
          />

          <div className="mt-4">
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
                  onClick={() => handleConfidenceRating(item.num, 'pre')}
                  className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                    confidencePre === item.num
                      ? 'bg-purple-600 text-white'
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
            onClick={handleSubmitHypothesis}
            disabled={!hypothesis || !confidencePre}
            className={`mt-6 w-full py-3 rounded-lg font-bold text-lg transition ${
              hypothesis && confidencePre
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {t.submitHypothesis} → <span className="text-sm font-normal opacity-75">(Ctrl+Enter)</span>
          </button>
        </div>
      ) : (
        <>
          {/* CONTRASTIVE EVIDENCE: After hypothesis submitted */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 border border-purple-200">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                {t.youDiagnosed} <span className="text-purple-700">{hypothesis}</span>
              </h3>
              <p className="text-gray-600 mt-2">
                {t.evaluateEvidence}
              </p>
            </div>

            {/* Dynamic Contrastive Evidence (NEW - GPT-4 Generated) */}
            {loadingEvidence ? (
              <div className="bg-white rounded-lg p-8 text-center border-2 border-indigo-300">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">
                  {t.evaluating}
                </p>
              </div>
            ) : dynamicEvidence ? (
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* SUPPORTS Column - NOW DYNAMIC */}
                <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                  <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✓</span>
                    {t.supports}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {dynamicEvidence.supporting.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CHALLENGES Column - NOW DYNAMIC */}
                <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                  <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                    <span className="text-2xl">✗</span>
                    {t.challenges}
                  </h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {dynamicEvidence.challenging.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-red-600 mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}

            {/* PROGRESSIVE REVEAL BUTTONS (Partiality Mechanism) */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {t.revealEvidence}
              </p>
              <div className="flex flex-wrap gap-3">
                {availablePanels.map((panel) => {
                  const isRevealed = revealedPanels.includes(panel.id);
                  return (
                    <button
                      key={panel.id}
                      onClick={() => handleRevealPanel(panel.id)}
                      className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                        isRevealed
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
            </div>

            {/* REVEALED EVIDENCE PANELS */}
            {revealedPanels.map((panelId) => (
              <div
                key={panelId}
                className="mt-4 bg-white rounded-lg p-5 border-2 border-indigo-300 animate-fadeIn"
              >
                <h4 className="font-bold text-indigo-800 mb-3 text-lg flex items-center gap-2">
                  <span>
                    {availablePanels.find((p) => p.id === panelId)?.icon}
                  </span>
                  {availablePanels.find((p) => p.id === panelId)?.label}
                </h4>
                <div className="text-sm text-gray-700">
                  {/* Render panel-specific content */}
                  {panelId === 'labs' && (
                    <div className="space-y-2">
                      {caseData.labs ? (
                        Object.entries(caseData.labs)
                          .filter(([key]) => key !== 'source') // Exclude metadata
                          .map(([key, value]) => {
                            const labName = t[key] || key.replace(/([A-Z_])/g, ' $1').trim();
                            return (
                              <p key={key}>
                                <strong>{labName}:</strong> {value}
                              </p>
                            );
                          })
                      ) : (
                        <p className="text-gray-500 italic">
                          {language === 'ru' ? 'Лабораторные данные недоступны' : 'Lab data unavailable'}
                        </p>
                      )}
                    </div>
                  )}
                  {panelId === 'vitals' && (
                    <div>
                      <p className="mb-3 text-gray-700">
                        <strong>{language === 'ru' ? 'Текущие показатели:' : 'Current vitals:'}</strong>
                      </p>
                      {caseData.vitals ? (
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">{t.temp}:</span>
                            <span className="ml-2 font-medium">{caseData.vitals.temperature}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">{t.bp}:</span>
                            <span className="ml-2 font-medium">{caseData.vitals.bloodPressure}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">{t.hr}:</span>
                            <span className="ml-2 font-medium">{caseData.vitals.heartRate}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded">
                            <span className="text-gray-600">{t.rr}:</span>
                            <span className="ml-2 font-medium">{caseData.vitals.respiratoryRate}</span>
                          </div>
                          <div className="bg-gray-50 p-2 rounded col-span-2">
                            <span className="text-gray-600">{t.o2sat}:</span>
                            <span className="ml-2 font-medium">{caseData.vitals.oxygenSaturation}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-500 italic text-sm">
                          {language === 'ru' ? 'Жизненные показатели недоступны' : 'Vital signs unavailable'}
                        </p>
                      )}
                      <p className="mt-3 text-xs text-gray-500">
                        {language === 'ru'
                          ? '* Динамические данные за 24 часа не зафиксированы в данном клиническом случае'
                          : '* 24-hour trend data not recorded for this case'}
                      </p>
                    </div>
                  )}
                  {panelId === 'differential' && (
                    <div>
                      {(language === 'ru' && caseData.differentialComparison_ru) || caseData.differentialComparison ? (
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="p-2 text-left">{t.diagnosisColumn}</th>
                              <th className="p-2 text-left">{t.matchColumn}</th>
                              <th className="p-2 text-left">{t.keyDifferentiatorColumn}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {((language === 'ru' && caseData.differentialComparison_ru)
                              ? caseData.differentialComparison_ru
                              : caseData.differentialComparison
                            )?.map((item, idx) => (
                              <tr key={idx} className="border-t">
                                <td className="p-2 font-medium">{item.diagnosis}</td>
                                <td className="p-2">
                                  <span className={`px-2 py-1 rounded ${
                                    parseInt(item.match) >= 80 ? 'bg-green-100 text-green-800' :
                                    parseInt(item.match) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {item.match}
                                  </span>
                                </td>
                                <td className="p-2 text-gray-700">{item.differentiator}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="text-gray-500 italic text-sm">
                          {language === 'ru'
                            ? 'Дифференциальный диагноз недоступен для данного случая'
                            : 'Differential diagnosis unavailable for this case'}
                        </p>
                      )}
                    </div>
                  )}
                  {panelId === 'symptoms' && (
                    <div className="space-y-3">
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {language === 'ru' ? 'Основная жалоба:' : 'Chief Complaint:'}
                        </p>
                        <p className="text-gray-700 text-sm">
                          {getCaseField(caseData, 'chiefComplaint', language)}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {language === 'ru' ? 'Ключевые симптомы:' : 'Key Symptoms:'}
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                          {getCaseField(caseData, 'history', language)
                            .split('.')
                            .filter(s => s.trim().length > 10)
                            .slice(0, 4)
                            .map((symptom, idx) => (
                              <li key={idx}>{symptom.trim()}</li>
                            ))}
                        </ul>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 mb-1">
                          {language === 'ru' ? 'Физикальное обследование:' : 'Physical Examination:'}
                        </p>
                        <p className="text-gray-700 text-sm">
                          {getCaseField(caseData, 'physicalExam', language)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FINAL DECISION */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {t.finalDecision}
            </h3>

            {!revisedHypothesis ? (
              <div className="space-y-4">
                <p className="text-gray-700">
                  {t.wouldYouLikeToRevise}
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setRevisedHypothesis(false)}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                  >
                    {t.keepDiagnosis} {hypothesis}
                  </button>
                  <button
                    onClick={handleReviseHypothesis}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
                  >
                    {t.reviseDiagnosis}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {t.originalDiagnosis} <span className="font-medium">{hypothesis}</span>
                </p>
                <textarea
                  value={finalDiagnosis}
                  onChange={(e) => setFinalDiagnosis(e.target.value)}
                  placeholder={t.enterRevised}
                  className="w-full p-4 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg"
                  rows={2}
                />
              </div>
            )}

            {/* Post-Confidence Rating */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                {t.howConfident}
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
                    onClick={() => handleConfidenceRating(item.num, 'post')}
                    className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                      confidencePost === item.num
                        ? 'bg-indigo-600 text-white'
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
              onClick={handleSubmitFinal}
              disabled={!confidencePost}
              className={`mt-6 w-full py-4 rounded-lg font-bold text-lg transition ${
                confidencePost
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {t.submitFinal} → <span className="text-sm font-normal opacity-75">(Ctrl+Enter)</span>
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
    </>
  );
}
