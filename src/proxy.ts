import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

/**
 * Route protection (Next.js 16 proxy).
 * - /app/* requires a session (redirects to /logga-in?next=...)
 * - Logged-in users are sent from auth pages to /app
 * Server Actions and Route Handlers verify the session again (defense in depth).
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/app/:path*", "/logga-in", "/registrera", "/glomt-losenord"],
};
