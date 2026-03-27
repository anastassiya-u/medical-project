/**
 * Translations for Russian/English Interface
 * Used across all components for internationalization
 */

export const translations = {
  en: {
    // Common
    clinicalCase: 'Clinical Case',
    patient: 'Patient',
    chiefComplaint: 'Chief Complaint',
    history: 'History',
    physicalExam: 'Physical Exam',
    vitalSigns: 'Vital Signs',
    laboratoryResults: 'Laboratory Results',
    imaging: 'Imaging',

    // CriticInterface
    enterDiagnosis: 'Enter Your Diagnosis First',
    beforeViewing: 'Before viewing the AI\'s analysis, formulate your own hypothesis based on the clinical presentation.',
    whyEnter: '🎯 Why enter your diagnosis first?',
    whyExplanation: 'Research shows that forming your own hypothesis before seeing AI recommendations helps you learn better, think critically, and avoid blindly accepting AI suggestions.',
    enterDiagnosisPlaceholder: 'Enter your diagnosis here (e.g., Community-Acquired Pneumonia)',
    submitHypothesis: 'Submit My Hypothesis',
    youDiagnosed: 'You diagnosed:',
    evaluateEvidence: 'Let\'s evaluate the evidence for and against your hypothesis...',
    supports: 'SUPPORTS Your Hypothesis',
    challenges: 'CHALLENGES Your Hypothesis',
    revealEvidence: 'Click to reveal additional evidence:',
    finalDecision: 'Final Decision',
    keepDiagnosis: 'Keep My Diagnosis:',
    reviseDiagnosis: 'Revise Diagnosis',
    howConfident: 'How confident are you now in your final diagnosis?',
    howConfidentPre: 'How confident are you in your diagnosis?',
    submitFinal: 'Submit Final Diagnosis',
    wouldYouLikeToRevise: 'Would you like to revise your diagnosis after reviewing the evidence?',
    originalDiagnosis: 'Original diagnosis:',
    enterRevised: 'Enter your revised diagnosis',

    // Oracle Interface
    aiRecommendation: 'AI RECOMMENDATION',
    basedOnClinical: 'Based on clinical presentation and diagnostic criteria',
    whyThisDiagnosis: 'Why This Diagnosis?',
    clinicalEvidence: 'Clinical Evidence Supporting This Diagnosis:',
    laboratoryFindings: 'Laboratory Findings',
    imagingStudies: 'Imaging Studies',
    clinicalReasoning: 'Clinical Reasoning:',
    yourDecision: 'Your Decision',
    doYouAgree: 'Do you agree with the AI\'s recommendation?',
    agree: 'Agree:',
    disagree: 'Disagree (Enter Alternative)',
    aiRecommended: 'AI recommended:',
    enterAlternative: 'Enter your alternative diagnosis',

    // NoAI Interface
    yourDiagnosis: 'Your Diagnosis',
    basedOnPresentation: 'Based on the clinical presentation, enter your diagnosis.',
    enterYourDiagnosis: 'Enter your diagnosis (e.g., Community-Acquired Pneumonia)',
    submitDiagnosis: 'Submit Diagnosis',
    noAINote: 'Note:',
    noAIMessage: 'This is an independent assessment. AI assistance is not available for this case.',

    // NFC Scale
    nfcTitle: 'Thinking Preferences Questionnaire',
    nfcDescription: 'Please indicate how much you agree or disagree with each statement.',
    nfcProgress: 'completed',
    nfcContinue: 'Continue to AI-Assisted Cases',
    nfcExplanation: 'This scale helps us understand how different thinking styles interact with AI explanations.',
    stronglyDisagree: 'Strongly Disagree',
    disagreeLabel: 'Disagree',
    neutral: 'Neutral',
    agreeLabel: 'Agree',
    stronglyAgree: 'Strongly Agree',

    // Confidence levels
    veryLow: 'Very Low',
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    veryHigh: 'Very High',

    // Notifications
    enterDiagnosisWarning: 'Please enter a diagnosis (at least 3 characters)',
    rateConfidenceWarning: 'Please rate your confidence before submitting',
    rateConfidenceWarningFinal: 'Please rate your final confidence before submitting',
    answerAllQuestions: 'Please answer all questions',

    // Loading
    evaluating: 'AI is evaluating your hypothesis...',
    loadingExperiment: 'Loading experiment...',

    // Evidence panels
    showLabResults: 'Show Lab Results',
    showVitalSigns: 'Show Vital Signs History',
    showDifferential: 'Compare Differential Diagnosis',
    showSymptomAnalysis: 'Show Symptom Analysis',
    hideLabel: '(Hide)',
  },

  ru: {
    // Common
    clinicalCase: 'Клинический случай',
    patient: 'Пациент',
    chiefComplaint: 'Основная жалоба',
    history: 'История',
    physicalExam: 'Физический осмотр',
    vitalSigns: 'Жизненные показатели',
    laboratoryResults: 'Лабораторные результаты',
    imaging: 'Визуализация',

    // CriticInterface
    enterDiagnosis: 'Сначала введите ваш диагноз',
    beforeViewing: 'Прежде чем просматривать анализ ИИ, сформулируйте собственную гипотезу на основе клинической картины.',
    whyEnter: '🎯 Зачем сначала вводить диагноз?',
    whyExplanation: 'Исследования показывают, что формирование собственной гипотезы перед просмотром рекомендаций ИИ помогает лучше учиться, критически мыслить и избегать слепого принятия предложений ИИ.',
    enterDiagnosisPlaceholder: 'Введите ваш диагноз здесь (например, Внебольничная пневмония)',
    submitHypothesis: 'Отправить мою гипотезу',
    youDiagnosed: 'Ваш диагноз:',
    evaluateEvidence: 'Давайте оценим доказательства за и против вашей гипотезы...',
    supports: 'ПОДДЕРЖИВАЕТ вашу гипотезу',
    challenges: 'ОСПАРИВАЕТ вашу гипотезу',
    revealEvidence: 'Нажмите, чтобы раскрыть дополнительные доказательства:',
    finalDecision: 'Окончательное решение',
    keepDiagnosis: 'Оставить мой диагноз:',
    reviseDiagnosis: 'Изменить диагноз',
    howConfident: 'Насколько вы уверены в своем окончательном диагнозе?',
    howConfidentPre: 'Насколько вы уверены в своем диагнозе?',
    submitFinal: 'Отправить окончательный диагноз',
    wouldYouLikeToRevise: 'Хотите ли вы пересмотреть свой диагноз после изучения доказательств?',
    originalDiagnosis: 'Первоначальный диагноз:',
    enterRevised: 'Введите ваш пересмотренный диагноз',

    // Oracle Interface
    aiRecommendation: 'РЕКОМЕНДАЦИЯ ИИ',
    basedOnClinical: 'На основе клинической картины и диагностических критериев',
    whyThisDiagnosis: 'Почему этот диагноз?',
    clinicalEvidence: 'Клинические доказательства, подтверждающие этот диагноз:',
    laboratoryFindings: 'Лабораторные находки',
    imagingStudies: 'Исследования визуализации',
    clinicalReasoning: 'Клиническое обоснование:',
    yourDecision: 'Ваше решение',
    doYouAgree: 'Вы согласны с рекомендацией ИИ?',
    agree: 'Согласен:',
    disagree: 'Не согласен (введите альтернативу)',
    aiRecommended: 'ИИ рекомендовал:',
    enterAlternative: 'Введите ваш альтернативный диагноз',

    // NoAI Interface
    yourDiagnosis: 'Ваш диагноз',
    basedOnPresentation: 'На основе клинической картины введите ваш диагноз.',
    enterYourDiagnosis: 'Введите ваш диагноз (например, Внебольничная пневмония)',
    submitDiagnosis: 'Отправить диагноз',
    noAINote: 'Примечание:',
    noAIMessage: 'Это независимая оценка. Помощь ИИ недоступна для этого случая.',

    // NFC Scale
    nfcTitle: 'Опросник когнитивных предпочтений',
    nfcDescription: 'Пожалуйста, укажите, насколько вы согласны или не согласны с каждым утверждением.',
    nfcProgress: 'завершено',
    nfcContinue: 'Продолжить к случаям с ИИ',
    nfcExplanation: 'Этот опросник помогает нам понять, как различные стили мышления взаимодействуют с объяснениями ИИ.',
    stronglyDisagree: 'Полностью не согласен',
    disagreeLabel: 'Не согласен',
    neutral: 'Нейтрально',
    agreeLabel: 'Согласен',
    stronglyAgree: 'Полностью согласен',

    // Confidence levels
    veryLow: 'Очень низкая',
    low: 'Низкая',
    moderate: 'Средняя',
    high: 'Высокая',
    veryHigh: 'Очень высокая',

    // Notifications
    enterDiagnosisWarning: 'Пожалуйста, введите диагноз (минимум 3 символа)',
    rateConfidenceWarning: 'Пожалуйста, оцените вашу уверенность перед отправкой',
    rateConfidenceWarningFinal: 'Пожалуйста, оцените вашу окончательную уверенность перед отправкой',
    answerAllQuestions: 'Пожалуйста, ответьте на все вопросы',

    // Loading
    evaluating: 'ИИ оценивает вашу гипотезу...',
    loadingExperiment: 'Загрузка эксперимента...',

    // Evidence panels
    showLabResults: 'Показать лабораторные результаты',
    showVitalSigns: 'Показать историю жизненных показателей',
    showDifferential: 'Сравнить дифференциальный диагноз',
    showSymptomAnalysis: 'Показать анализ симптомов',
    hideLabel: '(Скрыть)',
  },
};

/**
 * Hook to get translations for a specific language
 * @param {string} language - 'en' or 'ru'
 * @returns {Object} Translation object
 */
export function useTranslation(language = 'en') {
  return translations[language] || translations.en;
}

/**
 * Get translation for a specific key
 * @param {string} key - Translation key
 * @param {string} language - 'en' or 'ru'
 * @returns {string} Translated text
 */
export function t(key, language = 'en') {
  return translations[language]?.[key] || translations.en[key] || key;
}
