"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button, type ButtonSize } from "@/components/ui";
import { cn } from "@/lib/utils";

/** The multicolour "G" – Google's sign-in branding guidelines ask for it next to the label. */
export function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5 shrink-0", className)} aria-hidden>
      <path fill="#EA4335" d="M12 5.04c1.7 0 3.23.59 4.43 1.73l3.3-3.3C17.75 1.6 15.1.5 12 .5 7.36.5 3.36 3.16 1.4 7.05l3.85 2.99C6.16 7.2 8.85 5.04 12 5.04z" />
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62l3.72 2.89c2.17-2.01 3.72-4.96 3.72-8.7z" />
      <path fill="#FBBC05" d="M5.25 14.46A6.98 6.98 0 0 1 4.88 12c0-.86.15-1.69.37-2.46L1.4 6.55A11.46 11.46 0 0 0 .5 12c0 1.85.44 3.6 1.22 5.15l3.53-2.69z" />
      <path fill="#34A853" d="M12 23.5c3.1 0 5.71-1.02 7.61-2.78l-3.72-2.89c-1.03.69-2.35 1.1-3.89 1.1-3.15 0-5.84-2.16-6.75-5.03L1.4 16.83C3.36 20.84 7.36 23.5 12 23.5z" />
    </svg>
  );
}

/**
 * Starts the Google OAuth flow. Uses the Auth.js client helper, which fetches the CSRF token and POSTs
 * to /api/auth/signin/google – a route the proxy does not touch, so the PKCE/state cookies survive.
 */
export function GoogleButton({
  next,
  label = "Fortsätt med Google",
  size = "lg",
  className,
}: {
  /** Same-origin path to continue to afterwards (defaults to /app). */
  next?: string;
  label?: string;
  size?: ButtonSize;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const redirectTo = next && next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      className={cn("w-full", className)}
      loading={pending}
      onClick={() => {
        setPending(true);
        void signIn("google", { redirectTo }).catch(() => setPending(false));
      }}
    >
      {pending ? null : <GoogleMark />}
      {label}
    </Button>
  );
}
