import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { googleOAuthConfig } from "./google";
import { LoginCodeError, normalizeLoginCode, type LoginCodeFailure } from "./login-code";
import { redeemLoginCode } from "./login-code-store";
import { findOrCreateVerifiedUser } from "./users";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const codeSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  code: z.string().min(1).max(32),
});

// bcrypt cost-12 hash of a random string. Compared against when the account (or its password) is missing so
// response time does not reveal which.
const DUMMY_HASH = "$2b$12$DqZISiMRf2q9cNfVGbGCsezLiuz4kd9ahISBMAVH5JtGUzQeYTqny";

const userSelect = { id: true, email: true, name: true, passwordHash: true, accountType: true, emailVerified: true } as const;

type DbUser = { id: string; email: string; name: string; accountType: "PRIVATE" | "BUSINESS" };

function toAuthUser(user: DbUser) {
  return { id: user.id, email: user.email, name: user.name, accountType: user.accountType };
}

/**
 * Carries the one-time-code failure reason out of `authorize()`. Auth.js only lets `CredentialsSignin`
 * subclasses through to the caller, and its `code` is deliberately public – none of the reasons reveal
 * whether an account exists.
 */
export class LoginCodeSignin extends CredentialsSignin {
  code: LoginCodeFailure;
  constructor(reason: LoginCodeFailure) {
    super();
    this.code = reason;
  }
}

export function loginCodeFailure(error: unknown): LoginCodeFailure | null {
  return error instanceof LoginCodeSignin ? error.code : null;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    id: "credentials",
    name: "Lösenord",
    credentials: {
      email: { label: "E-post", type: "email" },
      password: { label: "Lösenord", type: "password" },
    },
    async authorize(credentials) {
      const parsed = loginSchema.safeParse(credentials);
      if (!parsed.success) return null;
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: userSelect });
      const ok = await compare(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !user.passwordHash || !ok) return null;
      return toAuthUser(user);
    },
  }),
  Credentials({
    id: "email-code",
    name: "Engångskod",
    credentials: {
      email: { label: "E-post", type: "email" },
      code: { label: "Kod", type: "text" },
    },
    async authorize(credentials) {
      const parsed = codeSchema.safeParse(credentials);
      if (!parsed.success) throw new LoginCodeSignin("invalid");
      const code = normalizeLoginCode(parsed.data.code);
      if (!code) throw new LoginCodeSignin("invalid");
      try {
        await redeemLoginCode(parsed.data.email, code);
      } catch (error) {
        if (error instanceof LoginCodeError) throw new LoginCodeSignin(error.reason);
        throw error;
      }
      const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: userSelect });
      // Codes are only issued for existing accounts; a missing user here means the account was deleted meanwhile.
      if (!user) throw new LoginCodeSignin("expired");
      if (!user.emailVerified) await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      return toAuthUser(user);
    },
  }),
];

const google = googleOAuthConfig();
if (google) {
  providers.push(
    Google({
      clientId: google.clientId,
      clientSecret: google.clientSecret,
      // Explicit endpoints instead of OIDC discovery: one round-trip less per login and no dependency on
      // outbound discovery requests from the server.
      authorization: {
        url: "https://accounts.google.com/o/oauth2/v2/auth",
        params: { scope: "openid email profile", prompt: "select_account" },
      },
      token: "https://oauth2.googleapis.com/token",
      userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
    }),
  );
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  // Accept the legacy variable name from the kalkyla.se deployment as well as AUTH_SECRET.
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const email = typeof profile?.email === "string" ? profile.email.trim().toLowerCase() : "";
      // Linking by address is only safe when Google vouches for the address.
      if (!email || profile?.email_verified !== true) return "/logga-in?error=GoogleEmailUnverified";

      const ensured = await findOrCreateVerifiedUser({ email, name: typeof profile?.name === "string" ? profile.name : null });
      const key = { provider: "google", providerAccountId: account.providerAccountId };
      const link = await prisma.account.findUnique({ where: { provider_providerAccountId: key }, select: { userId: true } });
      if (!link) {
        await prisma.account.create({ data: { ...key, userId: ensured.id } });
      } else if (link.userId !== ensured.id) {
        // The address moved to another account (rare, e.g. a re-issued Workspace address) – follow the address.
        await prisma.account.update({ where: { provider_providerAccountId: key }, data: { userId: ensured.id } });
      }

      if (ensured.created) await audit(ensured.id, "auth.register", { details: { method: "google" } });
      else if (!link) await audit(ensured.id, "auth.google_linked");
      await audit(ensured.id, "auth.login", { details: { method: "google" } });
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      if (account?.provider === "google") {
        // Without a database adapter `user.id` is Google's subject id; the session must carry our user id.
        const email = typeof token.email === "string" ? token.email.trim().toLowerCase() : "";
        const dbUser = email ? await prisma.user.findUnique({ where: { email }, select: { id: true, name: true, accountType: true } }) : null;
        if (!dbUser) return null;
        token.sub = dbUser.id;
        token.name = dbUser.name;
        token.accountType = dbUser.accountType;
      } else if (user) {
        token.accountType = user.accountType;
      }
      // `unstable_update()` (e.g. after a profile rename) re-reads the user so the token – and
      // therefore the sidebar/avatar – reflects the change without a new login.
      if (trigger === "update" && token.sub) {
        const fresh = await prisma.user.findUnique({ where: { id: token.sub }, select: { name: true, accountType: true } });
        if (fresh) {
          token.name = fresh.name;
          token.accountType = fresh.accountType;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.accountType = (token.accountType as "PRIVATE" | "BUSINESS") ?? "PRIVATE";
      }
      return session;
    },
  },
});

/** Returns the current user id or throws – use in Server Actions / Route Handlers. */
export async function requireUserId(): Promise<string> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new Error("UNAUTHORIZED");
  return id;
}
