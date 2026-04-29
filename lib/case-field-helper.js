/**
 * Helper functions to get localized case fields
 * Supports dual-language case data structure
 */

/**
 * Get localized field value from case data
 * @param {Object} caseData - Case object
 * @param {string} field - Field name (e.g., 'chiefComplaint', 'history')
 * @param {string} language - 'en' or 'ru'
 * @returns {string} Localized field value
 */
export function getCaseField(caseData, field, language = 'en') {
  if (!caseData) return '';

  // If Russian requested and _ru field exists, use it
  if (language === 'ru' && caseData[`${field}_ru`]) {
    return caseData[`${field}_ru`];
  }

  // Return English field if populated; fall back to _ru if English is empty
  return caseData[field] || caseData[`${field}_ru`] || '';
}

/**
 * Get patient gender in appropriate language
 * @param {Object} patient - Patient object
 * @param {string} language - 'en' or 'ru'
 * @returns {string} Localized gender
 */
export function getPatientGender(patient, language = 'en') {
  if (!patient) return '';

  if (language === 'ru' && patient.gender_ru) {
    return patient.gender_ru;
  }

  return patient.gender || '';
}

/**
 * Get patient ethnicity in appropriate language
 * @param {Object} patient - Patient object
 * @param {string} language - 'en' or 'ru'
 * @returns {string} Localized ethnicity
 */
export function getPatientEthnicity(patient, language = 'en') {
  if (!patient) return '';

  // Skip ethnicity display in Russian (sounds too clinical/anthropological)
  if (language === 'ru') {
    return '';
  }

  return patient.ethnicity || '';
}
