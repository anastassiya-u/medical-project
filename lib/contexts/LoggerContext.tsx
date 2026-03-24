/**
 * LoggerContext - Global Context for Event Logging
 * Makes logger instance available to all components
 * Automatically initializes with user session data
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import logger from '../logger';

interface LoggerContextType {
  logger: typeof logger;
  isInitialized: boolean;
  userId: string | null;
  sessionId: string | null;
}

const LoggerContext = createContext<LoggerContextType | undefined>(undefined);

export function LoggerProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Restore logger state from localStorage
    try {
      const savedSession = localStorage.getItem('experimentSession');
      if (savedSession) {
        const session = JSON.parse(savedSession);

        if (session.userId) {
          logger.init({
            userId: session.userId,
            sessionId: session.sessionId,
            paradigm: session.paradigm,
            accuracyLevel: session.accuracyLevel,
          });

          setUserId(session.userId);
          setSessionId(session.sessionId);
          setIsInitialized(true);

          console.log('✅ Logger restored from session');
        }
      }
    } catch (error) {
      console.error('❌ Failed to restore logger:', error);
    }
  }, []);

  const value = {
    logger,
    isInitialized,
    userId,
    sessionId,
  };

  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  );
}

/**
 * Hook to access logger in any component
 * Usage: const { logger } = useLogger();
 */
export function useLogger() {
  const context = useContext(LoggerContext);

  if (context === undefined) {
    throw new Error('useLogger must be used within a LoggerProvider');
  }

  return context;
}

/**
 * Hook to ensure logger is initialized before rendering
 * Usage: const isReady = useLoggerReady();
 */
export function useLoggerReady() {
  const { isInitialized } = useLogger();
  return isInitialized;
}
