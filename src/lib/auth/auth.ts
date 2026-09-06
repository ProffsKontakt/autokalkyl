import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/db/client";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-post", type: "email" },
        password: { label: "Lösenord", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
          select: { id: true, email: true, name: true, passwordHash: true, accountType: true },
        });
        if (!user) {
          // Constant-time-ish: still hash-compare against a dummy to reduce timing leaks
          await compare(parsed.data.password, "$2b$12$DqZISiMRf2q9cNfVGbGCsezLiuz4kd9ahISBMAVH5JtGUzQeYTqny");
          return null;
        }
        const ok = await compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name, accountType: user.accountType };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
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
