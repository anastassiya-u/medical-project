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

    // Vital signs labels
    temp: 'Temp',
    bp: 'BP',
    hr: 'HR',
    rr: 'RR',
    o2sat: 'O₂ Sat',

    // Lab test labels
    wbc: 'WBC',
    hemoglobin: 'Hemoglobin',
    platelets: 'Platelets',
    crp: 'CRP',
    bilirubin_total: 'Bilirubin (Total)',
    alt: 'ALT',
    ast: 'AST',
    alkaline_phosphatase: 'Alkaline Phosphatase',

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
    nfcAssessment: 'Need for Cognition Assessment',
    nfcQuickQuestionnaire: 'Quick questionnaire about thinking preferences',
    nfcDescription: 'Please indicate how much you agree or disagree with each statement.',
    nfcProgress: 'completed',
    nfcContinue: 'Continue to AI-Assisted Cases',
    nfcExplanation: 'This scale helps us understand how different thinking styles interact with AI explanations.',
    stronglyDisagree: 'Strongly Disagree',
    disagreeLabel: 'Disagree',
    neutral: 'Neutral',
    agreeLabel: 'Agree',
    stronglyAgree: 'Strongly Agree',

    // NFC Questions (Q10, Q13, Q17 removed)
    nfcQ1: 'I would prefer complex problems to simple ones.',
    nfcQ2: 'I like to have the responsibility of handling situations that require a lot of thinking.',
    nfcQ3: 'Thinking does not bring me fun or pleasure.',
    nfcQ4: 'I would rather do something that requires little thinking than something that challenges my cognitive abilities.',
    nfcQ5: 'I really enjoy a task that involves coming up with new solutions to problems.',
    nfcQ6: 'I prefer to think about small, daily projects rather than long-term ones.',
    nfcQ7: 'I would prefer a task that is intellectual, difficult, and important to one that is somewhat important but does not require much thought.',
    nfcQ8: 'I find satisfaction in studying hard and for long hours.',
    nfcQ9: 'I only think as hard as I\'m expected to.',
    nfcQ11: 'I prefer to think about small, daily projects to long-term ones.',
    nfcQ12: 'I like the idea of relying on my thinking to be on the top.',
    nfcQ14: 'Learning new ways to think doesn\'t excite me very much.',
    nfcQ15: 'I prefer my life to be filled with puzzles that I must solve.',
    nfcQ16: 'The notion of thinking abstractly is appealing to me.',
    nfcQ18: 'I feel only relieved but not satisfied after completing a task that required a lot of cognitive effort.',

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
    studentIdTooShort: 'ID must be at least 3 characters',
    studentIdDuplicate: 'This Student ID is already registered',
    studentIdCheckError: 'Unable to verify ID. Please check your connection and try again.',

    // Loading
    evaluating: 'AI is evaluating your hypothesis...',
    loadingExperiment: 'Loading experiment...',

    // Evidence panels
    showLabResults: 'Show Lab Results',
    showImagingStudies: 'Show Imaging Studies',
    showVitalSigns: 'Show Vital Signs History',
    showDifferential: 'Compare Differential Diagnosis',
    showSymptomAnalysis: 'Show Symptom Analysis',
    hideLabel: '(Hide)',
    imagingResults: 'Imaging Results:',
    trendOver24h: 'Trend over last 24 hours:',
    chartPlaceholder: '[Chart would show temperature, BP, HR trends here]',

    // Hypothesis Comparison Table (new Critic interface)
    hypothesisComparison: 'Hypothesis Comparison',
    hypothesisColumn: 'Hypothesis',
    argsForColumn: 'Arguments For',
    argsAgainstColumn: 'Arguments Against',
    addYourHypothesis: 'Add your own hypothesis (optional)...',
    generateArguments: 'Generate arguments',
    generatingArguments: 'Generating...',
    optionalHypothesisHint: 'Optional: type a hypothesis to see AI arguments for it',
    yourFinalDiagnosisLabel: 'Your Final Diagnosis',
    typeFinalDiagnosis: 'Type your final diagnosis here...',
    pendingMedicalData: 'Medical data pending',

    // Shared final answer (Oracle + Critic)
    enterFinalDiagnosis: 'Type your final diagnosis',
    submitFinalDiagnosisButton: 'Submit Final Diagnosis',

    // Differential Diagnosis Table
    diagnosisColumn: 'Diagnosis',
    matchColumn: 'Match',
    keyDifferentiatorColumn: 'Key Differentiator',

    // Phase Headers
    preTest: 'Pre-Test',
    intervention: 'Intervention',
    postTest: 'Post-Test',
    oracle: 'Oracle',
    critic: 'Critic',
    cases: 'Cases',
    complete: 'Complete',
    remaining: 'remaining',
    baselineAssessment: 'Baseline assessment (no AI assistance)',
    aiAssistedDiagnosis: 'AI-assisted diagnosis',

    // Registration Form
    firstNameLabel: 'First Name',
    firstNamePlaceholder: 'e.g., Aibek',
    lastNameLabel: 'Last Name',
    lastNamePlaceholder: 'e.g., Seitkali',
    namePrivacyNote: 'Your name is used only to invite you for a brief follow-up interview. No one else will see your results.',
    ageLabel: 'Age',
    agePlaceholder: 'e.g., 22',
    genderLabel: 'Gender',
    genderSelect: 'Select...',
    genderMale: 'Male',
    genderFemale: 'Female',
    medicalSchoolLabel: 'Medical School',
    medicalSchoolPlaceholder: 'e.g., Astana Medical University',
    yearLabel: 'Year of Study',
    year1: '1st year',
    year2: '2nd year',
    year3: '3rd year',
    year4: '4th year',
    year5: '5th year',
    year6: '6th year',
    consentHeading: 'Informed Consent',
    consentText: 'I understand that this study involves diagnosing clinical cases with AI assistance. I consent to participate and understand that my data will be anonymized and used for research purposes. I can withdraw at any time.',
    consentCheckbox: 'I consent to participate in this research study',
    beginButton: 'Begin Experiment',
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

    // Vital signs labels
    temp: 'Темп',
    bp: 'АД',
    hr: 'ЧСС',
    rr: 'ЧД',
    o2sat: 'O₂ Сат',

    // Lab test labels
    wbc: 'Лейкоциты',
    hemoglobin: 'Гемоглобин',
    platelets: 'Тромбоциты',
    crp: 'СРБ',
    bilirubin_total: 'Билирубин (общий)',
    alt: 'АЛТ',
    ast: 'АСТ',
    alkaline_phosphatase: 'Щелочная фосфатаза',

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
    nfcAssessment: 'Оценка потребности в познании',
    nfcQuickQuestionnaire: 'Краткий опросник о стиле мышления',
    nfcDescription: 'Пожалуйста, укажите, насколько вы согласны или не согласны с каждым утверждением.',
    nfcProgress: 'завершено',
    nfcContinue: 'Перейти к заданиям с поддержкой ИИ',
    nfcExplanation: 'Этот опросник помогает нам понять, как различные стили мышления взаимодействуют с объяснениями ИИ.',
    stronglyDisagree: 'Полностью не согласен',
    disagreeLabel: 'Не согласен',
    neutral: 'Нейтрально',
    agreeLabel: 'Согласен',
    stronglyAgree: 'Полностью согласен',

    // NFC Questions (Q10, Q13, Q17 removed)
    nfcQ1: 'Я предпочитаю сложные задачи простым.',
    nfcQ2: 'Мне нравится брать на себя ответственность за решение задач, требующих глубокого размышления.',
    nfcQ3: 'Размышление не приносит мне удовольствия.',
    nfcQ4: 'Я скорее выберу задачу, которая требует минимальных умственных усилий, чем ту, которая бросает вызов моим когнитивным способностям.',
    nfcQ5: 'Мне действительно нравятся задачи, в которых нужно искать новые решения проблем.',
    nfcQ6: 'Я предпочитаю заниматься небольшими повседневными задачами, а не долгосрочными проектами.',
    nfcQ7: 'Я скорее выберу интеллектуально сложную и значимую задачу, чем менее важную, но простую.',
    nfcQ8: 'Я получаю удовлетворение от долгих и напряжённых учебных занятий.',
    nfcQ9: 'Я думаю ровно настолько, насколько от меня ожидается.',
    nfcQ11: 'Я предпочитаю небольшие повседневные задачи долгосрочным проектам.',
    nfcQ12: 'Мне нравится идея достигать успеха благодаря собственному мышлению.',
    nfcQ14: 'Изучение новых способов мышления меня не особенно привлекает.',
    nfcQ15: 'Мне нравится, когда в жизни есть задачи и загадки, которые нужно решать.',
    nfcQ16: 'Меня привлекает абстрактное мышление.',
    nfcQ18: 'После выполнения задачи, потребовавшей больших когнитивных усилий, я чувствую лишь облегчение, но не удовлетворение.',

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
    studentIdTooShort: 'ID должен содержать минимум 3 символа',
    studentIdDuplicate: 'Этот студенческий ID уже зарегистрирован',
    studentIdCheckError: 'Невозможно проверить ID. Пожалуйста, проверьте подключение и попробуйте снова.',

    // Loading
    evaluating: 'ИИ оценивает вашу гипотезу...',
    loadingExperiment: 'Загрузка эксперимента...',

    // Evidence panels
    showLabResults: 'Показать лабораторные результаты',
    showImagingStudies: 'Показать результаты визуализации',
    showVitalSigns: 'Показать историю жизненных показателей',
    showDifferential: 'Сравнить дифференциальный диагноз',
    showSymptomAnalysis: 'Показать анализ симптомов',
    hideLabel: '(Скрыть)',
    imagingResults: 'Результаты визуализации:',
    trendOver24h: 'Динамика за последние 24 часа:',
    chartPlaceholder: '[График покажет изменения температуры, АД, ЧСС]',

    // Hypothesis Comparison Table (new Critic interface)
    hypothesisComparison: 'Сравнение гипотез',
    hypothesisColumn: 'Гипотеза',
    argsForColumn: 'Аргументы ЗА',
    argsAgainstColumn: 'Аргументы ПРОТИВ',
    addYourHypothesis: 'Добавьте свою гипотезу (необязательно)...',
    generateArguments: 'Сгенерировать аргументы',
    generatingArguments: 'Генерирую...',
    optionalHypothesisHint: 'Необязательно: введите гипотезу, чтобы ИИ показал аргументы за и против',
    yourFinalDiagnosisLabel: 'Ваш окончательный диагноз',
    typeFinalDiagnosis: 'Введите ваш окончательный диагноз...',
    pendingMedicalData: 'Медицинские данные ожидаются',

    // Shared final answer (Oracle + Critic)
    enterFinalDiagnosis: 'Введите ваш окончательный диагноз',
    submitFinalDiagnosisButton: 'Отправить окончательный диагноз',

    // Differential Diagnosis Table
    diagnosisColumn: 'Диагноз',
    matchColumn: 'Соответствие',
    keyDifferentiatorColumn: 'Ключевой дифференциатор',

    // Phase Headers
    preTest: 'Предварительный тест',
    intervention: 'Вмешательство',
    postTest: 'Финальный тест',
    oracle: 'Оракул',
    critic: 'Критик',
    cases: 'Случаев',
    complete: 'Завершено',
    remaining: 'осталось',
    baselineAssessment: 'Базовая оценка (без помощи ИИ)',
    aiAssistedDiagnosis: 'Диагностика с помощью ИИ',

    // Registration Form
    firstNameLabel: 'Имя',
    firstNamePlaceholder: 'например, Айбек',
    lastNameLabel: 'Фамилия',
    lastNamePlaceholder: 'например, Сейткали',
    namePrivacyNote: 'Ваше имя используется только для приглашения на краткое интервью. Ваши результаты никто другой не увидит.',
    ageLabel: 'Возраст',
    agePlaceholder: 'например, 22',
    genderLabel: 'Пол',
    genderSelect: 'Выберите...',
    genderMale: 'Мужской',
    genderFemale: 'Женский',
    medicalSchoolLabel: 'Медицинский университет',
    medicalSchoolPlaceholder: 'например, Медицинский университет Астаны',
    yearLabel: 'Курс обучения',
    year1: '1-й курс',
    year2: '2-й курс',
    year3: '3-й курс',
    year4: '4-й курс',
    year5: '5-й курс',
    year6: '6-й курс',
    consentHeading: 'Информированное согласие',
    consentText: 'Я понимаю, что это исследование включает диагностику клинических случаев с помощью ИИ. Я даю согласие на участие и понимаю, что мои данные будут анонимизированы и использованы в исследовательских целях. Я могу отказаться от участия в любое время.',
    consentCheckbox: 'Я даю согласие на участие в этом исследовании',
    beginButton: 'Начать эксперимент',
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
