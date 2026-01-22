import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible Auth.js configuration.
 *
 * This config is used by middleware (runs on Edge runtime) for route protection.
 * Credentials provider and database operations are in auth.ts (Node.js runtime only).
 */
export const authConfig = {
  // Trust the host header from Vercel's proxy
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');
      const isOnAuth =
        nextUrl.pathname.startsWith('/login') ||
        nextUrl.pathname.startsWith('/forgot-password');

      if (isOnDashboard || isOnAdmin) {
        return isLoggedIn;
      }
      if (isLoggedIn && isOnAuth) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Added in auth.ts (credentials not edge-compatible)
} satisfies NextAuthConfig;
