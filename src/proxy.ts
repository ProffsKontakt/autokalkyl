import NextAuth from "next-auth";
import type { NextFetchEvent, NextRequest } from "next/server";
import { authConfig } from "@/lib/auth/auth.config";

/**
 * Route protection (Next.js 16 proxy).
 * - /app/* requires a session (redirects to /logga-in?next=...)
 * - Logged-in users are sent from auth pages to /app
 * Server Actions and Route Handlers verify the session again (defense in depth).
 */
type EdgeAuth = (request: NextRequest, event: NextFetchEvent) => Promise<Response | undefined>;
const authMiddleware = NextAuth(authConfig).auth as unknown as EdgeAuth;

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  const response = await authMiddleware(request, event);
  // Auth.js re-issues the session cookie on every request it inspects (rolling sessions). That lets an
  // in-flight prefetch response resurrect a session that a sign-out just cleared, so the proxy never
  // sets cookies – only the auth routes and server actions do.
  if (response instanceof Response) {
    response.headers.delete("set-cookie");
  }
  return response;
}

export const config = {
  matcher: ["/app/:path*", "/logga-in", "/registrera", "/glomt-losenord"],
};
