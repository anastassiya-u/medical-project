/**
 * NFCScale Component
 * 15-item Need for Cognition scale (Cacioppo et al., 1984)
 * Measures tendency to engage in analytical thinking
 */

'use client';

import { useState } from 'react';
import { useTranslation } from '../lib/translations';

const NFC_ITEMS = [
  { id: 'q1_complex_problems',      textKey: 'nfcQ1',  reverse: false },
  { id: 'q2_responsibility_thinking',textKey: 'nfcQ2',  reverse: false },
  { id: 'q3_thinking_not_fun',       textKey: 'nfcQ3',  reverse: true  },
  { id: 'q4_prefer_simple',          textKey: 'nfcQ4',  reverse: true  },
  { id: 'q5_intellectual_challenge', textKey: 'nfcQ5',  reverse: false },
  { id: 'q6_deep_thinking',          textKey: 'nfcQ6',  reverse: true  },
  { id: 'q7_prefer_easy',            textKey: 'nfcQ7',  reverse: false },
  { id: 'q8_abstract_problems',      textKey: 'nfcQ8',  reverse: false },
  { id: 'q9_enjoy_puzzles',          textKey: 'nfcQ9',  reverse: true  },
  { id: 'q11_cognitive_effort',      textKey: 'nfcQ11', reverse: true  },
  { id: 'q12_prefer_straightforward',textKey: 'nfcQ12', reverse: false },
  { id: 'q14_avoid_situations',      textKey: 'nfcQ14', reverse: true  },
  { id: 'q15_deliberation',          textKey: 'nfcQ15', reverse: false },
  { id: 'q16_minimal_effort',        textKey: 'nfcQ16', reverse: false },
  { id: 'q18_prefer_little_thought', textKey: 'nfcQ18', reverse: true  },
];

export default function NFCScale({ onComplete, language = 'ru' }) {
  const t = useTranslation(language);
  const [responses, setResponses] = useState({});

  const handleResponse = (itemId, rating) => {
    setResponses({ ...responses, [itemId]: rating });
  };

  const handleSubmit = () => {
    // Check if all items answered
    if (Object.keys(responses).length < NFC_ITEMS.length) {
      alert(t.answerAllQuestions);
      return;
    }

    onComplete(responses);
  };

  const progress = (Object.keys(responses).length / NFC_ITEMS.length) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          {t.nfcTitle}
        </h2>
        <p className="text-gray-600 mb-4">
          {t.nfcDescription}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600">
          {Object.keys(responses).length} / {NFC_ITEMS.length} {t.nfcProgress}
        </p>
      </div>

      <div className="space-y-8">
        {NFC_ITEMS.map((item, idx) => (
          <div
            key={item.id}
            className={`p-6 rounded-lg border-2 transition ${
              responses[item.id]
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                {idx + 1}
              </div>
              <p className="text-gray-800 text-lg leading-relaxed">{t[item.textKey]}</p>
            </div>

            <div className="ml-12">
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: 1, label: t.stronglyDisagree },
                  { value: 2, label: t.disagreeLabel },
                  { value: 3, label: t.neutral },
                  { value: 4, label: t.agreeLabel },
                  { value: 5, label: t.stronglyAgree },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleResponse(item.id, option.value)}
                    className={`py-3 px-2 rounded-lg font-medium text-sm transition ${
                      responses[item.id] === option.value
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <div className="font-bold text-lg mb-1">{option.value}</div>
                    <div className="text-xs">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={Object.keys(responses).length < NFC_ITEMS.length}
        className={`mt-8 w-full py-4 rounded-lg font-bold text-lg transition ${
          Object.keys(responses).length === NFC_ITEMS.length
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {t.nfcContinue} →
      </button>

      <div className="mt-6 bg-gray-50 p-4 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          {t.nfcExplanation}
        </p>
      </div>
    </div>
  );
}
