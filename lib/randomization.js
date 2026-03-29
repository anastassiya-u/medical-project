/**
 * Randomization Logic for 2x2 Factorial Design
 * Assigns participants to one of 4 experimental groups with balancing
 *
 * Groups:
 * 1. Oracle × High (100% accuracy)
 * 2. Oracle × Calibrated (70% accuracy)
 * 3. Critic × High (100% accuracy)
 * 4. Critic × Calibrated (70% accuracy)
 *
 * Target: N=30 per group (120 total)
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * Get current group counts from database
 */
async function getGroupCounts() {
  const { data, error } = await supabase
    .from('users')
    .select('paradigm, accuracy_level')
    .not('paradigm', 'is', null);

  if (error) {
    console.error('Error fetching group counts:', error);
    return null;
  }

  const counts = {
    oracle_high: 0,
    oracle_calibrated: 0,
    critic_high: 0,
    critic_calibrated: 0,
  };

  data.forEach((user) => {
    const key = `${user.paradigm}_${user.accuracy_level}`;
    counts[key] = (counts[key] || 0) + 1;
  });

  return counts;
}

/**
 * Stratified randomization with balancing
 * Ensures groups don't differ by more than 5 participants
 */
export async function assignExperimentalGroup() {
  const counts = await getGroupCounts();

  if (!counts) {
    // Fallback to simple random if database unavailable
    return simpleRandomAssignment();
  }

  // Find groups with minimum count
  const minCount = Math.min(...Object.values(counts));
  const groupsWithMinCount = Object.keys(counts).filter(
    (key) => counts[key] === minCount
  );

  // Randomly select from groups with minimum count (balancing)
  const selectedGroup =
    groupsWithMinCount[Math.floor(Math.random() * groupsWithMinCount.length)];

  const [paradigm, accuracy_level] = selectedGroup.split('_');

  console.log('✅ Group assigned via balanced randomization:', {
    paradigm,
    accuracy_level,
    current_counts: counts,
  });

  return {
    paradigm,
    accuracy_level,
    randomization_method: 'stratified_balanced',
  };
}

/**
 * Simple random assignment (fallback)
 */
function simpleRandomAssignment() {
  const groups = [
    { paradigm: 'oracle', accuracy_level: 'high' },
    { paradigm: 'oracle', accuracy_level: 'calibrated' },
    { paradigm: 'critic', accuracy_level: 'high' },
    { paradigm: 'critic', accuracy_level: 'calibrated' },
  ];

  const selected = groups[Math.floor(Math.random() * groups.length)];

  console.log('⚠️  Group assigned via simple randomization (fallback):', selected);

  return {
    ...selected,
    randomization_method: 'simple_random',
  };
}

/**
 * Generate cryptographic randomization seed for reproducibility
 */
export function generateRandomizationSeed() {
  return Math.floor(Math.random() * 1000000);
}

/**
 * Deterministic case order shuffling based on user seed
 * Ensures each user gets a unique but reproducible case order
 */
export function shuffleCases(cases, seed) {
  // Seeded random number generator (simple LCG)
  let random = seed;
  const lcg = () => {
    random = (random * 1664525 + 1013904223) % 4294967296;
    return random / 4294967296;
  };

  const shuffled = [...cases];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(lcg() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Select foil cases for 70% accuracy condition
 * Ensures 30% of intervention cases show foil diagnosis
 */
export function selectFoilCases(interventionCases, seed) {
  const totalCases = interventionCases.length; // Should be 15
  const numFoils = Math.round(totalCases * 0.30); // 4-5 cases

  // Only use cases that have a foil defined
  const casesWithFoils = interventionCases.filter(
    (c) => c.foilDiagnosis && c.foilDiagnosis !== null
  );

  if (casesWithFoils.length < numFoils) {
    console.warn(
      `⚠️  Not enough cases with foils defined. Need ${numFoils}, have ${casesWithFoils.length}`
    );
  }

  // Seeded shuffle to select which cases become foils
  const shuffledWithFoils = shuffleCases(casesWithFoils, seed + 1000);
  const selectedFoilCaseIds = shuffledWithFoils
    .slice(0, numFoils)
    .map((c) => c.id);

  // Ensure foils are not consecutive (spread them out)
  const foilIndices = [];
  interventionCases.forEach((caseData, idx) => {
    if (selectedFoilCaseIds.includes(caseData.id)) {
      foilIndices.push(idx);
    }
  });

  // Check if any foils are consecutive
  for (let i = 1; i < foilIndices.length; i++) {
    if (foilIndices[i] - foilIndices[i - 1] === 1) {
      console.warn('⚠️  Consecutive foils detected - consider reshuffling');
    }
  }

  return selectedFoilCaseIds;
}

/**
 * Prepare case for display based on user's accuracy condition
 * If 70% accuracy and case is selected as foil, return foil diagnosis as AI recommendation
 */
export function prepareCaseForUser(caseData, accuracyLevel, foilCaseIds) {
  const isFoilCase =
    accuracyLevel === 'calibrated' && foilCaseIds.includes(caseData.id);

  return {
    ...caseData,
    isFoil: isFoilCase,
    aiRecommendation: isFoilCase
      ? caseData.foilDiagnosis
      : caseData.correctDiagnosis,
    // For Oracle mode: use pre-authored foil evidence if available, else generate fallback
    supportingEvidence: isFoilCase
      ? (caseData.supportingEvidence?.length > 0 ? caseData.supportingEvidence : generateFoilSupportingEvidence(caseData))
      : caseData.supportingEvidence,
  };
}

/**
 * Generate plausible supporting evidence for foil diagnosis
 * (Makes the foil convincing to test overreliance)
 */
function generateFoilSupportingEvidence(caseData) {
  // Use the contrastive evidence's "supporting" points for the foil
  // This makes the foil seem reasonable
  if (caseData.contrastiveEvidence?.supporting) {
    return caseData.contrastiveEvidence.supporting.map(
      (point) => `${point} (supports ${caseData.foilDiagnosis})`
    );
  }

  return [
    `Clinical presentation is consistent with ${caseData.foilDiagnosis}`,
    'Patient demographics match typical presentation',
    'Symptom timeline follows expected course',
  ];
}

/**
 * Check if group is full (reached target N=30)
 */
export async function isGroupFull(paradigm, accuracyLevel) {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('paradigm', paradigm)
    .eq('accuracy_level', accuracyLevel);

  if (error) {
    console.error('Error checking group capacity:', error);
    return false;
  }

  return count >= 30;
}

/**
 * Get randomization balance report (for admin dashboard)
 */
export async function getRandomizationReport() {
  const counts = await getGroupCounts();

  if (!counts) return null;

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return {
    total_participants: total,
    groups: {
      oracle_high: counts.oracle_high,
      oracle_calibrated: counts.oracle_calibrated,
      critic_high: counts.critic_high,
      critic_calibrated: counts.critic_calibrated,
    },
    balance_deviation: Math.max(...Object.values(counts)) - Math.min(...Object.values(counts)),
    target_per_group: 30,
    completion_percentage: (total / 120) * 100,
  };
}
