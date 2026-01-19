import 'next-auth';
import 'next-auth/jwt';

/**
 * Type augmentation for Auth.js (NextAuth v5).
 *
 * Extends the default types to include our custom claims:
 * - role: User's role in the system (SUPER_ADMIN, ORG_ADMIN, CLOSER)
 * - orgId: Organization ID for tenant scoping (null for platform admins)
 * - orgSlug: Organization slug for URL routing
 */

declare module 'next-auth' {
  interface User {
    role: string;
    orgId: string | null;
    orgSlug: string | null;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      orgId: string | null;
      orgSlug: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: string;
    orgId: string | null;
    orgSlug: string | null;
  }
}
