/**
 * AI Evaluator - AWS Bedrock Integration
 * Dynamically generates contrastive evidence based on user's hypothesis
 *
 * Handles two modes:
 * 1. ACCURATE MODE (100% groups): Provides correct medical evaluation
 * 2. FOIL MODE (70% groups): Makes professional diagnostic errors to test critical thinking
 *
 * Uses AWS Bedrock with GPT-OSS-20B model (open-source, cost-effective)
 */

import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// Initialize AWS Bedrock client (SERVER-SIDE ONLY)
// These credentials are NOT exposed to the browser
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Detect language of text based on character script
 * @param {string} text - Text to analyze
 * @returns {'russian' | 'english'} Detected language
 */
function detectLanguage(text) {
  // Check for Cyrillic characters (Russian alphabet: U+0400 to U+04FF)
  const hasCyrillic = /[\u0400-\u04FF]/.test(text);

  // If contains Cyrillic, it's Russian (even if mixed with Latin medical terms)
  if (hasCyrillic) {
    return 'russian';
  }

  // Otherwise default to English
  return 'english';
}

/**
 * Main evaluation function
 * @param {Object} params
 * @param {Object} params.caseData - Full clinical case data
 * @param {string} params.userHypothesis - Student's diagnosis
 * @param {string} params.accuracyLevel - 'high' (100%) or 'calibrated' (70%)
 * @param {boolean} params.isFoilCase - Is this a foil case (intentional error)?
 * @returns {Promise<Object>} Evidence evaluation
 */
export async function evaluateHypothesis({
  caseData,
  userHypothesis,
  accuracyLevel,
  isFoilCase,
}) {
  try {
    // Determine which mode to use
    const isIntentionalError = accuracyLevel === 'calibrated' && isFoilCase;

    // Detect hypothesis language
    const hypothesisLanguage = detectLanguage(userHypothesis);
    const responseLanguage = hypothesisLanguage === 'russian' ? 'Russian' : 'English';

    console.log('🌐 Hypothesis Language Detected:', {
      hypothesis: userHypothesis,
      detectedLanguage: hypothesisLanguage,
      responseLanguage: responseLanguage,
    });

    const systemPrompt = isIntentionalError
      ? `You are a medical AI that makes subtle, professional diagnostic errors to test student critical thinking. Your errors should be plausible and require careful clinical reasoning to detect. IMPORTANT: Respond entirely in ${responseLanguage}.`
      : `You are an expert medical educator providing accurate, evidence-based clinical case evaluation. Your goal is to help students learn through balanced, objective analysis. IMPORTANT: Respond entirely in ${responseLanguage}.`;

    const userPrompt = isIntentionalError
      ? buildFoilPrompt(caseData, userHypothesis, hypothesisLanguage)
      : buildAccuratePrompt(caseData, userHypothesis, hypothesisLanguage);

    console.log('🤖 Calling AWS Bedrock (GPT-OSS-20B):', {
      mode: isIntentionalError ? 'FOIL' : 'ACCURATE',
      hypothesis: userHypothesis,
      correct: caseData.correctDiagnosis,
      language: responseLanguage,
    });

    // Construct the prompt combining system and user prompts
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object.`;

    // Prepare request for AWS Bedrock (OpenAI-compatible format)
    const requestBody = {
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `${userPrompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanations, just the JSON object. Use ${responseLanguage} for all text content in the JSON.`,
        },
      ],
      max_tokens: 1500,
      temperature: isIntentionalError ? 0.7 : 0.3,
    };

    const command = new InvokeModelCommand({
      modelId: 'openai.gpt-oss-20b-1:0', // GPT-OSS-20B (cost-effective open-source model)
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody),
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // Extract the text content from GPT response (OpenAI format)
    const textContent = responseBody.choices[0].message.content;

    // Parse JSON from the response
    let evaluation;
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      evaluation = JSON.parse(jsonMatch ? jsonMatch[0] : textContent);
    } catch (parseError) {
      console.error('Failed to parse AI response:', textContent);
      throw new Error('AI returned invalid JSON format');
    }

    // Log the AI response for research analysis
    console.log('✅ AWS Bedrock Evaluation (GPT-OSS-20B):', {
      hypothesis: userHypothesis,
      isFoil: isIntentionalError,
      supporting: evaluation.supporting?.length || 0,
      challenging: evaluation.challenging?.length || 0,
    });

    return {
      supporting: evaluation.supporting || [],
      challenging: evaluation.challenging || [],
      aiRecommendation: evaluation.ai_recommendation || caseData.correctDiagnosis,
      isFoil: isIntentionalError,
      correctDiagnosis: caseData.correctDiagnosis,
      model: 'gpt-oss-20b',
    };
  } catch (error) {
    console.error('❌ AWS Bedrock API Error:', error);

    // Fallback to static evidence if API fails
    return {
      supporting: caseData.contrastiveEvidence?.supporting || [
        'Unable to generate dynamic evidence due to API error.',
        'Please review case data manually.',
      ],
      challenging: caseData.contrastiveEvidence?.challenging || [
        'API error occurred. Evidence unavailable.',
      ],
      aiRecommendation: caseData.aiRecommendation || caseData.correctDiagnosis,
      error: error.message,
      fallback: true,
    };
  }
}

/**
 * Build accurate evaluation prompt (100% accuracy groups)
 */
function buildAccuratePrompt(caseData, userHypothesis, hypothesisLanguage) {
  const languageInstruction = hypothesisLanguage === 'russian'
    ? `\n\nВАЖНО: Весь ваш ответ должен быть на РУССКОМ языке. Используйте медицинскую терминологию на русском. Студент написал гипотезу на русском, поэтому ваша оценка тоже должна быть на русском.`
    : `\n\nIMPORTANT: Your entire response must be in ENGLISH. Use English medical terminology. The student wrote their hypothesis in English, so your evaluation should also be in English.`;

  return `You are an expert medical educator evaluating a medical student's diagnosis.

CLINICAL CASE:
Patient: ${caseData.patient.age}yo ${caseData.patient.gender}, ${caseData.patient.ethnicity}
Chief Complaint: ${caseData.chiefComplaint}
History: ${caseData.history}
Physical Exam: ${caseData.physicalExam}

Vital Signs:
- Temperature: ${caseData.vitals.temperature}
- Blood Pressure: ${caseData.vitals.bloodPressure}
- Heart Rate: ${caseData.vitals.heartRate}
- Respiratory Rate: ${caseData.vitals.respiratoryRate}
- O₂ Saturation: ${caseData.vitals.oxygenSaturation}

${caseData.labs ? `Laboratory Results:\n${Object.entries(caseData.labs).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` : ''}
${caseData.imaging ? `Imaging: ${caseData.imaging}` : ''}

CORRECT DIAGNOSIS: ${caseData.correctDiagnosis}
STUDENT'S HYPOTHESIS: "${userHypothesis}"

YOUR TASK: Generate evidence-based evaluation of the student's hypothesis.

INSTRUCTIONS:
1. Generate 3-5 clinical facts that SUPPORT the student's hypothesis
2. Generate 3-5 clinical facts that CHALLENGE the student's hypothesis
3. Base your evaluation ONLY on the clinical data provided above
4. If the student's hypothesis matches or is close to the correct diagnosis, provide more supporting evidence
5. If the student's hypothesis is incorrect or incomplete, emphasize challenging evidence
6. Use specific values from the case (e.g., "WBC 12.8 x10³/μL indicates...")
7. Be objective and educational
8. DO NOT fabricate data not present in the case

FORMAT YOUR RESPONSE AS JSON:
{
  "supporting": [
    "Clinical fact that supports student's hypothesis with specific reference",
    "Another supporting fact with data",
    "..."
  ],
  "challenging": [
    "Clinical fact that challenges student's hypothesis",
    "Another challenging point",
    "..."
  ],
  "correct_diagnosis": "${caseData.correctDiagnosis}"
}

CRITICAL: Be medically accurate. Help the student learn through balanced analysis.${languageInstruction}`;
}

/**
 * Build foil prompt (70% accuracy groups - intentional error)
 */
function buildFoilPrompt(caseData, userHypothesis, hypothesisLanguage) {
  const languageInstruction = hypothesisLanguage === 'russian'
    ? `\n\nВАЖНО: Весь ваш ответ должен быть на РУССКОМ языке.`
    : `\n\nIMPORTANT: Your entire response must be in ENGLISH.`;

  return `You are a medical AI making a subtle diagnostic error to test student critical thinking.

CLINICAL CASE:
Patient: ${caseData.patient.age}yo ${caseData.patient.gender}, ${caseData.patient.ethnicity}
Chief Complaint: ${caseData.chiefComplaint}
History: ${caseData.history}
Physical Exam: ${caseData.physicalExam}

Vital Signs:
- Temperature: ${caseData.vitals.temperature}
- Blood Pressure: ${caseData.vitals.bloodPressure}
- Heart Rate: ${caseData.vitals.heartRate}
- Respiratory Rate: ${caseData.vitals.respiratoryRate}
- O₂ Saturation: ${caseData.vitals.oxygenSaturation}

${caseData.labs ? `Laboratory Results:\n${Object.entries(caseData.labs).map(([key, value]) => `- ${key}: ${value}`).join('\n')}` : ''}
${caseData.imaging ? `Imaging: ${caseData.imaging}` : ''}

CORRECT DIAGNOSIS (SECRET - DO NOT REVEAL): ${caseData.correctDiagnosis}
YOUR RECOMMENDATION (FOIL): ${caseData.foilDiagnosis}
STUDENT SAID: "${userHypothesis}"

YOUR TASK: Generate evidence that makes ${caseData.foilDiagnosis} seem plausible BUT is actually wrong.

STRATEGY FOR PROFESSIONAL ERROR:
1. Emphasize clinical features that OVERLAP between ${caseData.foilDiagnosis} and ${caseData.correctDiagnosis}
2. Downplay or OMIT the KEY DIFFERENTIATOR that would rule out ${caseData.foilDiagnosis}
3. Make the error look professional and medically sound (not obviously wrong)
4. Good students should be able to catch this if they carefully review the data
5. If student diagnosed the correct answer, subtly question it or downplay confirmatory findings

EXAMPLE:
If foil is "Bronchitis" but correct is "Pneumonia" (X-ray shows infiltrate):
✓ Supporting: "Productive cough and fever are consistent with lower respiratory infection"
✓ Supporting: "Symptoms duration matches typical Bronchitis timeline"
✗ Challenging: "Symptoms could also indicate other respiratory conditions"
OMIT: "Chest X-ray infiltrate rules out Bronchitis" ← THIS IS THE KEY YOU HIDE

FORMAT YOUR RESPONSE AS JSON:
{
  "supporting": [
    "Evidence that makes foil diagnosis seem reasonable (emphasize overlap)",
    "Another plausible point",
    "..."
  ],
  "challenging": [
    "Subtle hint that something might be wrong",
    "Mild doubt (but not strong enough to reject foil)",
    "..."
  ],
  "ai_recommendation": "${caseData.foilDiagnosis}"
}

CRITICAL: Make error subtle, professional, and detectable by careful students.${languageInstruction}`;
}
