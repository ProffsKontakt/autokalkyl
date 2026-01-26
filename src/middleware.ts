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
     * Only match protected routes for performance.
     * Public routes (landing page, kalkyl wizard, share links) are skipped entirely.
     *
     * Protected routes:
     * - /dashboard/* (user dashboard)
     * - /admin/* (super admin)
     * - /login, /forgot-password, /reset-password (auth pages)
     * - /api/* (except /api/auth and /api/public)
     */
    '/dashboard/:path*',
    '/admin/:path*',
    '/login',
    '/forgot-password',
    '/reset-password/:path*',
    '/api/((?!auth|public).*)',
  ],
};
