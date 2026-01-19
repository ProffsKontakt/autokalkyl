import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

/**
 * Next.js middleware for route protection.
 *
 * Uses Auth.js edge-compatible config to:
 * - Redirect unauthenticated users from /dashboard/* and /admin/* to /login
 * - Redirect authenticated users from /login to /dashboard
 * - Allow public routes to pass through
 *
 * IMPORTANT: This is the FIRST layer of defense only.
 * API routes and Server Actions MUST also verify authorization
 * for defense-in-depth (per security best practices).
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - public share links (/[org]/[code] pattern handled separately)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
