/**
 * Dynamic Case Loader
 * Loads appropriate cases file based on user's language preference
 */

import casesRaw from '../src/data/cases_18_final.json';

// Wrap raw array in {cases: [...]} so callers can use data.cases consistently
const cases = Array.isArray(casesRaw) ? { cases: casesRaw } : casesRaw;

export function getCasesData() {
  return cases;
}

/**
 * Get specific case by ID in specified language
 * @param {string} caseId - Case ID (e.g., 'PRE_001')
 * @param {string} language - 'en' or 'ru'
 * @returns {Object|null} Case object or null if not found
 */
export function getCaseById(caseId) {
  const data = getCasesData();
  return data.cases.find(c => c.id === caseId) || null;
}

export function getCasesByPhase(phase) {
  const data = getCasesData();
  return data.cases.filter(c => c.phase === phase);
}
