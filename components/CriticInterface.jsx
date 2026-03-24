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

import { useState, useEffect } from 'react';
import logger from '../lib/logger';

export default function CriticInterface({ caseData, onComplete }) {
  // UI State
  const [hypothesis, setHypothesis] = useState('');
  const [hypothesisSubmitted, setHypothesisSubmitted] = useState(false);
  const [confidencePre, setConfidencePre] = useState(null);
  const [confidencePost, setConfidencePost] = useState(null);
  const [finalDiagnosis, setFinalDiagnosis] = useState('');
  const [revisedHypothesis, setRevisedHypothesis] = useState(false);

  // Progressive Reveal State
  const [revealedPanels, setRevealedPanels] = useState([]);
  const [activePanel, setActivePanel] = useState(null);

  // Evidence panels (partiality stages)
  const availablePanels = [
    { id: 'symptoms', label: 'Show Symptom Analysis', icon: '🩺' },
    { id: 'labs', label: 'Show Lab Results', icon: '🧪' },
    { id: 'vitals', label: 'Show Vital Signs History', icon: '📈' },
    { id: 'differential', label: 'Compare Differential Diagnosis', icon: '🔬' },
  ];

  // Initialize case
  useEffect(() => {
    logger.startCase(caseData.id, caseData.order);
  }, [caseData]);

  // Handle hypothesis submission
  const handleSubmitHypothesis = async () => {
    if (hypothesis.length < 3) {
      alert('Please enter a diagnosis (at least 3 characters)');
      return;
    }

    setHypothesisSubmitted(true);
    await logger.submitHypothesis(hypothesis);

    // Log AI output viewed (for Critic, this happens after hypothesis)
    await logger.viewAIOutput(
      caseData.aiRecommendation,
      caseData.correctDiagnosis,
      caseData.isFoil
    );
  };

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

  // Handle final diagnosis submission
  const handleSubmitFinal = async () => {
    if (!confidencePost) {
      alert('Please rate your final confidence');
      return;
    }

    const diagnosisToSubmit = revisedHypothesis ? finalDiagnosis : hypothesis;

    if (revisedHypothesis && finalDiagnosis !== hypothesis) {
      await logger.reviseHypothesis(
        finalDiagnosis,
        'User revised after seeing contrastive evidence'
      );
    }

    await logger.submitFinalDiagnosis(diagnosisToSubmit);
    onComplete();
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Case Presentation */}
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
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

      {/* HYPOTHESIS LOCK: Must enter diagnosis first */}
      {!hypothesisSubmitted ? (
        <div className="bg-purple-50 rounded-lg shadow-md p-6 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">💭</span>
            <h3 className="text-xl font-bold text-purple-800">
              Enter Your Diagnosis First
            </h3>
          </div>
          <p className="text-gray-700 mb-4">
            Before viewing the AI's analysis, formulate your own hypothesis based on the
            clinical presentation.
          </p>

          <textarea
            value={hypothesis}
            onChange={(e) => setHypothesis(e.target.value)}
            placeholder="Enter your diagnosis here (e.g., Community-Acquired Pneumonia)"
            className="w-full p-4 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
            rows={3}
          />

          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">
              How confident are you in your diagnosis?
            </p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleConfidenceRating(rating, 'pre')}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    confidencePre === rating
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              1 = Not confident • 5 = Very confident
            </p>
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
            Submit My Hypothesis →
          </button>
        </div>
      ) : (
        <>
          {/* CONTRASTIVE EVIDENCE: After hypothesis submitted */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg shadow-md p-6 border border-purple-200">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-800">
                You diagnosed: <span className="text-purple-700">{hypothesis}</span>
              </h3>
              <p className="text-gray-600 mt-2">
                Let's evaluate the evidence for and against your hypothesis...
              </p>
            </div>

            {/* Initial Contrastive Evidence (Always Visible) */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* SUPPORTS Column */}
              <div className="bg-green-50 rounded-lg p-4 border-2 border-green-300">
                <h4 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✓</span>
                  SUPPORTS Your Hypothesis
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {caseData.contrastiveEvidence.supporting.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CHALLENGES Column */}
              <div className="bg-red-50 rounded-lg p-4 border-2 border-red-300">
                <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✗</span>
                  CHALLENGES Your Hypothesis
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  {caseData.contrastiveEvidence.challenging.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* PROGRESSIVE REVEAL BUTTONS (Partiality Mechanism) */}
            <div className="bg-white rounded-lg p-4 border border-gray-300">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Click to reveal additional evidence:
              </p>
              <div className="flex flex-wrap gap-3">
                {availablePanels.map((panel) => (
                  <button
                    key={panel.id}
                    onClick={() => handleRevealPanel(panel.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                      revealedPanels.includes(panel.id)
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <span>{panel.icon}</span>
                    <span>
                      {revealedPanels.includes(panel.id) ? '✓' : ''} {panel.label}
                    </span>
                  </button>
                ))}
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
                      <p>
                        <strong>WBC:</strong> {caseData.labs?.wbc || 'Pending'}
                      </p>
                      <p>
                        <strong>Hemoglobin:</strong> {caseData.labs?.hemoglobin || 'Pending'}
                      </p>
                      <p>
                        <strong>Platelets:</strong> {caseData.labs?.platelets || 'Pending'}
                      </p>
                      <p>
                        <strong>CRP:</strong> {caseData.labs?.crp || 'Pending'}
                      </p>
                    </div>
                  )}
                  {panelId === 'vitals' && (
                    <div>
                      <p className="mb-2">
                        <strong>Trend over last 24 hours:</strong>
                      </p>
                      <p className="text-xs text-gray-600">
                        [Chart would show temperature, BP, HR trends here]
                      </p>
                    </div>
                  )}
                  {panelId === 'differential' && (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="p-2 text-left">Diagnosis</th>
                          <th className="p-2 text-left">Match</th>
                          <th className="p-2 text-left">Key Differentiator</th>
                        </tr>
                      </thead>
                      <tbody>
                        {caseData.differentialComparison?.map((item, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-2">{item.diagnosis}</td>
                            <td className="p-2">{item.match}</td>
                            <td className="p-2">{item.differentiator}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {panelId === 'symptoms' && (
                    <p className="text-gray-700">
                      {caseData.symptomAnalysis || 'Detailed symptom analysis...'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* FINAL DECISION */}
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-300">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Final Decision
            </h3>

            {!revisedHypothesis ? (
              <div className="space-y-4">
                <p className="text-gray-700">
                  Would you like to revise your diagnosis after reviewing the evidence?
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setRevisedHypothesis(false)}
                    className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition"
                  >
                    Keep My Diagnosis: {hypothesis}
                  </button>
                  <button
                    onClick={handleReviseHypothesis}
                    className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition"
                  >
                    Revise Diagnosis
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Original diagnosis: <span className="font-medium">{hypothesis}</span>
                </p>
                <textarea
                  value={finalDiagnosis}
                  onChange={(e) => setFinalDiagnosis(e.target.value)}
                  placeholder="Enter your revised diagnosis"
                  className="w-full p-4 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-lg"
                  rows={2}
                />
              </div>
            )}

            {/* Post-Confidence Rating */}
            <div className="mt-6">
              <p className="text-sm text-gray-600 mb-2">
                How confident are you now in your final diagnosis?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleConfidenceRating(rating, 'post')}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      confidencePost === rating
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {rating}
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
              Submit Final Diagnosis →
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
  );
}
