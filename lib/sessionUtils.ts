/**
 * Session Utilities
 * Helper functions for managing experimental session state
 * Works in tandem with middleware.ts for group locking
 *
 * Note: post-test is deployed as a separate application — no post-test helpers here.
 */

/**
 * Save session to both localStorage and cookie
 * Cookie is used by middleware, localStorage for client state
 */
export function saveSession(sessionData: Record<string, any>) {
  // Save to localStorage
  localStorage.setItem('experimentSession', JSON.stringify(sessionData));

  // Save to cookie (for middleware access)
  document.cookie = `experimentSession=${JSON.stringify(sessionData)}; path=/; max-age=${60 * 60 * 24 * 14}`; // 14 days

  console.log('💾 Session saved:', sessionData);
}

/**
 * Load session from localStorage
 */
export function loadSession(): Record<string, any> | null {
  try {
    const saved = localStorage.getItem('experimentSession');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('❌ Failed to load session:', error);
    return null;
  }
}

/**
 * Clear session (logout/reset)
 */
export function clearSession() {
  localStorage.removeItem('experimentSession');
  document.cookie = 'experimentSession=; path=/; max-age=0';
  console.log('🗑️  Session cleared');
}

/**
 * Validate session integrity
 * Ensures all required fields are present
 */
export function validateSession(session: Record<string, any>): boolean {
  const requiredFields = ['userId', 'paradigm', 'accuracyLevel', 'randomizationSeed'];

  for (const field of requiredFields) {
    if (!session[field]) {
      console.error(`❌ Session validation failed: missing ${field}`);
      return false;
    }
  }

  return true;
}

/**
 * Format session data for display (debugging)
 */
export function formatSessionInfo(session: Record<string, any>): string {
  return `
    User ID: ${session.userId}
    Paradigm: ${session.paradigm}
    Accuracy: ${session.accuracyLevel}
    Phase: ${session.currentPhase}
    Case: ${session.currentCaseIndex + 1}
    Seed: ${session.randomizationSeed}
  `.trim();
}

/**
 * Lock group assignment (prevents changes)
 * This works with middleware.ts to enforce immutability
 */
export function lockGroupAssignment(session: Record<string, any>): Record<string, any> {
  return {
    ...session,
    groupLocked: true,
    lockedAt: new Date().toISOString(),
  };
}

/**
 * Check if group is locked
 */
export function isGroupLocked(session: Record<string, any>): boolean {
  return session.groupLocked === true;
}
