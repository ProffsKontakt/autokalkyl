import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration used by proxy.ts for route protection.
 * The credentials provider (needs bcrypt + database) lives in auth.ts.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/logga-in",
    error: "/logga-in",
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const path = nextUrl.pathname;
      const isApp = path.startsWith("/app");
      const isAuthPage =
        path.startsWith("/logga-in") || path.startsWith("/registrera") || path.startsWith("/glomt-losenord");

      if (isApp) {
        if (isLoggedIn) return true;
        const loginUrl = new URL("/logga-in", nextUrl);
        loginUrl.searchParams.set("next", path + nextUrl.search);
        return Response.redirect(loginUrl);
      }
      if (isLoggedIn && isAuthPage) {
        return Response.redirect(new URL("/app", nextUrl));
      }
      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
