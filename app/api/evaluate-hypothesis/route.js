/**
 * API Route: /api/evaluate-hypothesis
 * Server-side endpoint for AI hypothesis evaluation
 * Protects AWS credentials from browser exposure
 */

import { NextResponse } from 'next/server';
import { evaluateHypothesis } from '../../../lib/ai-evaluator';

export async function POST(request) {
  try {
    // Parse request body
    const body = await request.json();
    const { caseData, userHypothesis, accuracyLevel, isFoilCase, language } = body;

    // Validate required fields
    if (!caseData || !userHypothesis || !accuracyLevel) {
      return NextResponse.json(
        { error: 'Missing required fields: caseData, userHypothesis, accuracyLevel' },
        { status: 400 }
      );
    }

    console.log('📡 API: Evaluating hypothesis (server-side):', {
      hypothesis: userHypothesis,
      accuracyLevel,
      isFoilCase,
      uiLanguage: language,
    });

    // Call AI evaluator (server-side only - AWS credentials not exposed)
    // One automatic retry on transient failure before surfacing an error to the client.
    let evaluation;
    try {
      evaluation = await evaluateHypothesis({
        caseData,
        userHypothesis,
        accuracyLevel,
        isFoilCase,
        uiLanguage: language,
      });
    } catch (firstError) {
      console.warn('⚠️ First attempt failed, retrying once:', firstError.message);
      evaluation = await evaluateHypothesis({
        caseData,
        userHypothesis,
        accuracyLevel,
        isFoilCase,
        uiLanguage: language,
      });
    }

    return NextResponse.json(evaluation);
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        error: 'AI evaluation failed',
        message: error.message,
        fallback: true,
      },
      { status: 500 }
    );
  }
}

// Prevent this API route from being cached
export const dynamic = 'force-dynamic';
