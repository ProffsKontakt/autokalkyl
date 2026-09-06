/**
 * Google sign-in is optional: the button and the provider only exist when both variables are set.
 * Accepts the Auth.js default names (AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET) as well.
 */
export function googleOAuthConfig(): { clientId: string; clientSecret: string } | null {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim() || process.env.AUTH_GOOGLE_ID?.trim() || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim() || process.env.AUTH_GOOGLE_SECRET?.trim() || "";
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

export function isGoogleLoginEnabled(): boolean {
  return googleOAuthConfig() !== null;
}
