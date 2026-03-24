/**
 * Global Providers
 * Wraps the entire application with necessary context providers
 */

'use client';

import { ReactNode } from 'react';
import { LoggerProvider } from '@/lib/contexts/LoggerContext';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <LoggerProvider>
      {children}
    </LoggerProvider>
  );
}
