/**
 * Main Entry Point - Next.js App Router
 * Renders the SessionOrchestrator which manages entire experimental flow
 */

import SessionOrchestrator from '@/components/SessionOrchestrator';

export default function Home() {
  return <SessionOrchestrator />;
}
