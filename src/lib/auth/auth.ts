import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { validateCredentials, loginSchema } from './credentials';

/**
 * Main Auth.js configuration with credentials provider.
 *
 * Uses JWT strategy (not database sessions) for:
 * - Stateless authentication (works well with serverless)
 * - Custom claims (role, orgId, orgSlug) in token
 *
 * Note: PrismaAdapter is intentionally not used. The adapter is for OAuth
 * providers that need to link/store accounts. With credentials-only auth,
 * we handle user lookup in validateCredentials() and store claims in JWT.
 *
 * The JWT token contains:
 * - sub: user id
 * - role: user role (SUPER_ADMIN, ORG_ADMIN, CLOSER)
 * - orgId: organization id (null for SUPER_ADMIN)
 * - orgSlug: organization slug for URL routing
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return validateCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        // First-time login: copy user data to token
        token.role = user.role;
        token.orgId = user.orgId;
        token.orgSlug = user.orgSlug;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.orgId = token.orgId as string | null;
        session.user.orgSlug = token.orgSlug as string | null;
      }
      return session;
    },
  },
});
