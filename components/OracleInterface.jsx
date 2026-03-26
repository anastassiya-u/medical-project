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

export default function OracleInterface({ caseData, onComplete }) {
  // UI State
  const [confidence, setConfidence] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [userAgreesWithAI, setUserAgreesWithAI] = useState(null);

  // Notifications
  const { showNotification, NotificationComponent } = useNotification();

  // Track if case has been initialized (prevent duplicate logging)
  const caseInitialized = useRef(false);
  const currentCaseId = useRef(null);

  // Reset state when case changes (critical for multi-case flow)
  useEffect(() => {
    setConfidence(null);
    setFinalDiagnosis('');
    setUserAgreesWithAI(null);
    caseInitialized.current = false;
    currentCaseId.current = null;
  }, [caseData.id]);

  // Handle final diagnosis submission - MUST be defined before useEffect that uses it
  const handleSubmitFinal = useCallback(async () => {
    if (!confidence) {
      showNotification('Please rate your confidence before submitting', 'warning');
      return;
    }

    if (!finalDiagnosis) {
      showNotification('Please enter your diagnosis', 'warning');
      return;
    }

    await logger.submitFinalDiagnosis(finalDiagnosis);
    onComplete();
  }, [confidence, finalDiagnosis, showNotification, onComplete]);

  // Initialize case
  useEffect(() => {
    // Prevent duplicate initialization on re-renders
    if (caseInitialized.current && currentCaseId.current === caseData.id) {
      return;
    }

    const initCase = async () => {
      caseInitialized.current = true;
      currentCaseId.current = caseData.id;

      await logger.startCase(caseData.id, caseData.order);

      // In Oracle mode, AI output is shown immediately
      await logger.viewAIOutput(
        caseData.aiRecommendation,
        caseData.correctDiagnosis,
        caseData.isFoil
      );
    };

    initCase();

    // Keyboard shortcuts
    const handleKeyPress = (e) => {
      // Ctrl+Enter to submit (if ready)
      if (e.key === 'Enter' && e.ctrlKey && confidence && finalDiagnosis) {
        handleSubmitFinal();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [caseData, confidence, finalDiagnosis, handleSubmitFinal]);

  // Handle agreement with AI
  const handleAgreeWithAI = (agrees) => {
    setUserAgreesWithAI(agrees);
    if (agrees) {
      setFinalDiagnosis(caseData.aiRecommendation);
    } else {
      setFinalDiagnosis(''); // User must enter alternative
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Clinical Case</h2>
        <div className="space-y-3 text-gray-700">
          <p>
            <strong>Patient:</strong> {caseData.patient.age}yo {caseData.patient.gender},{' '}
            {caseData.patient.ethnicity}
          </p>
          <p>
            <strong>Chief Complaint:</strong> {caseData.chiefComplaint}
          </p>
          <p>
            <strong>History:</strong> {caseData.history}
          </p>
          <p>
            <strong>Physical Exam:</strong> {caseData.physicalExam}
          </p>
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <strong className="block mb-2">Vital Signs:</strong>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span>Temp: {caseData.vitals.temperature}</span>
              <span>BP: {caseData.vitals.bloodPressure}</span>
              <span>HR: {caseData.vitals.heartRate}</span>
              <span>RR: {caseData.vitals.respiratoryRate}</span>
              <span>O₂ Sat: {caseData.vitals.oxygenSaturation}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI RECOMMENDATION (Immediate, Authoritative) */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-white rounded-full p-4">
            <span className="text-5xl">🤖</span>
          </div>
          <div>
            <h3 className="text-3xl font-bold">AI RECOMMENDATION</h3>
            {/* RESEARCH DESIGN: Confidence level hidden to prevent blind trust/authority bias */}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border-2 border-white/30">
          <p className="text-4xl font-bold mb-2">{caseData.aiRecommendation}</p>
          <p className="text-blue-100 text-sm">
            Based on clinical presentation and diagnostic criteria
          </p>
        </div>
      </div>

      {/* UNILATERAL EXPLANATION (Only Supporting Evidence) */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-300">
        <h3 className="text-2xl font-bold text-blue-800 mb-4 flex items-center gap-3">
          <span className="text-3xl">✓</span>
          Why This Diagnosis?
        </h3>

        <div className="space-y-4">
          {/* Supporting Evidence (All visible at once - no partiality) */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3 text-lg">
              Clinical Evidence Supporting This Diagnosis:
            </h4>
            <ul className="space-y-3">
              {caseData.supportingEvidence.map((item, idx) => (
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
                Laboratory Findings
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">WBC:</span>{' '}
                  <span className="text-gray-900">{caseData.labs.wbc}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Hemoglobin:</span>{' '}
                  <span className="text-gray-900">{caseData.labs.hemoglobin}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Platelets:</span>{' '}
                  <span className="text-gray-900">{caseData.labs.platelets}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">CRP:</span>{' '}
                  <span className="text-gray-900">{caseData.labs.crp}</span>
                </div>
              </div>
            </div>
          )}

          {/* Imaging Results (All visible immediately) */}
          {caseData.imaging && (
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-300">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">🔬</span>
                Imaging Studies
              </h4>
              <p className="text-gray-800">{caseData.imaging}</p>
            </div>
          )}

          {/* Clinical Reasoning (Process Explanation) */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-3 text-lg">
              Clinical Reasoning:
            </h4>
            <p className="text-gray-800 leading-relaxed">
              {caseData.clinicalReasoning}
            </p>
          </div>
        </div>
      </div>

      {/* USER DECISION */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Your Decision</h3>

        {/* Agreement Options */}
        {userAgreesWithAI === null && (
          <div className="space-y-4">
            <p className="text-gray-700">
              Do you agree with the AI's recommendation?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => handleAgreeWithAI(true)}
                className="flex-1 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
              >
                <span>✓</span>
                <span>Agree: {caseData.aiRecommendation}</span>
              </button>
              <button
                onClick={() => handleAgreeWithAI(false)}
                className="flex-1 py-4 bg-gray-600 text-white rounded-lg font-bold text-lg hover:bg-gray-700 transition flex items-center justify-center gap-2"
              >
                <span>✗</span>
                <span>Disagree (Enter Alternative)</span>
              </button>
            </div>
          </div>
        )}

        {/* If User Disagrees - Enter Alternative Diagnosis */}
        {userAgreesWithAI === false && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              AI recommended: <span className="font-medium">{caseData.aiRecommendation}</span>
            </p>
            <textarea
              value={finalDiagnosis}
              onChange={(e) => setFinalDiagnosis(e.target.value)}
              placeholder="Enter your alternative diagnosis"
              className="w-full p-4 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg"
              rows={2}
            />
          </div>
        )}

        {/* Confidence Rating */}
        {userAgreesWithAI !== null && (
          <>
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                How confident are you in your final diagnosis?
              </p>
              <div className="flex gap-2">
                {[
                  { num: 1, label: 'Very Low' },
                  { num: 2, label: 'Low' },
                  { num: 3, label: 'Moderate' },
                  { num: 4, label: 'High' },
                  { num: 5, label: 'Very High' },
                ].map((item) => (
                  <button
                    key={item.num}
                    onClick={() => handleConfidenceRating(item.num)}
                    className={`flex-1 px-2 py-2 rounded-lg font-medium transition ${
                      confidence === item.num
                        ? 'bg-blue-600 text-white'
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
              disabled={!confidence || !finalDiagnosis}
              className={`mt-6 w-full py-4 rounded-lg font-bold text-lg transition ${
                confidence && finalDiagnosis
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Submit Final Diagnosis →
            </button>
          </>
        )}
      </div>

      {/* Design Note: Oracle shows AI as authoritative source */}
      <div className="text-center text-sm text-gray-500 py-4">
        <p>AI-Assisted Clinical Decision Support System</p>
      </div>
    </div>
    </>
  );
}
