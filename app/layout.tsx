/**
 * Root Layout - Next.js App Router
 * Wraps entire application with providers and global styles
 */

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: 'Oracle vs. Critic Experiment | Medical Education Research',
  description: 'AI-assisted clinical decision making study for medical students in Kazakhstan',
  keywords: ['medical education', 'AI explanability', 'XAI', 'Kazakhstan', 'clinical decision support'],
  authors: [{ name: 'Medical Education Research Team' }],
  robots: 'noindex, nofollow', // Don't index experiment platform
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className}>
        <Providers>
          {/* Global Header (Optional) */}
          <header className="bg-white border-b border-gray-200 py-3 px-6 no-print">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  AI
                </div>
                <div>
                  <h1 className="text-sm font-bold text-gray-800">
                    Medical AI Research
                  </h1>
                  <p className="text-xs text-gray-500">Kazakhstan Study</p>
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Version 1.0
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="min-h-[calc(100vh-64px)]">
            {children}
          </main>

          {/* Global Footer (Optional) */}
          <footer className="bg-gray-100 border-t border-gray-200 py-4 px-6 text-center text-xs text-gray-600 no-print">
            <p>
              This is a research study. Your data is anonymized and will be used for academic purposes only.
            </p>
            <p className="mt-1">
              Contact: <a href="mailto:research@meduni.kz" className="text-blue-600 hover:underline">research@meduni.kz</a>
            </p>
          </footer>
        </Providers>

        {/* Performance Monitoring (Optional) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(e) {
                  console.error('Global error:', e.error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
