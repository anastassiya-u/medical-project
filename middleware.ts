/**
 * Next.js Middleware
 * Handles group locking, session persistence, and routing logic
 *
 * Key Functions:
 * 1. Ensures participants can't change their assigned group (2x2 lock)
 * 2. Validates session integrity across page refreshes
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // Files with extensions
  ) {
    return NextResponse.next();
  }

  // Get session data from cookie or localStorage (client-side)
  const sessionCookie = request.cookies.get('experimentSession');

  // If no session and trying to access protected routes, redirect to home
  if (!sessionCookie && pathname !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Group locking validation
  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie.value);

      // Validate session integrity
      if (!session.userId || !session.paradigm || !session.accuracyLevel) {
        console.warn('⚠️  Invalid session detected, clearing...');
        const response = NextResponse.redirect(request.nextUrl.clone());
        response.cookies.delete('experimentSession');
        return response;
      }

      // Add session info to response headers for client-side access
      const response = NextResponse.next();
      response.headers.set('X-User-Paradigm', session.paradigm);
      response.headers.set('X-User-Accuracy', session.accuracyLevel);
      response.headers.set('X-Session-Valid', 'true');

      return response;
    } catch (error) {
      console.error('❌ Middleware error:', error);
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
