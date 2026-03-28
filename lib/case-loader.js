/**
 * Dynamic Case Loader
 * Loads appropriate cases file based on user's language preference
 */

import casesEnglish from '../src/data/cases.json';
import casesRussian from '../src/data/cases_russian.json';

/**
 * Get cases data for specified language
 * @param {string} language - 'en' or 'ru'
 * @returns {Object} Cases data object
 */
export function getCasesData(language = 'en') {
  if (language === 'ru') {
    return casesRussian;
  }
  return casesEnglish;
}

/**
 * Get specific case by ID in specified language
 * @param {string} caseId - Case ID (e.g., 'PRE_001')
 * @param {string} language - 'en' or 'ru'
 * @returns {Object|null} Case object or null if not found
 */
export function getCaseById(caseId, language = 'en') {
  const data = getCasesData(language);
  return data.cases.find(c => c.id === caseId) || null;
}

/**
 * Get cases by phase
 * @param {string} phase - 'pre-test', 'intervention', or 'post-test'
 * @param {string} language - 'en' or 'ru'
 * @returns {Array} Array of case objects
 */
export function getCasesByPhase(phase, language = 'en') {
  const data = getCasesData(language);
  return data.cases.filter(c => c.phase === phase);
}
