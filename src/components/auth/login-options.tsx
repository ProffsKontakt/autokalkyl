"use client";

import { useState } from "react";
import { AuthDivider } from "./auth-divider";
import { GoogleButton } from "./google-button";
import { LoginCodeForm } from "./login-code-form";
import { LoginForm } from "./login-form";

export type LoginMode = "password" | "code";

/** Google (when configured) on top, then either the password form or the one-time-code flow. */
export function LoginOptions({
  next,
  googleEnabled,
  initialMode = "password",
  initialEmail,
}: {
  next?: string;
  googleEnabled: boolean;
  initialMode?: LoginMode;
  initialEmail?: string;
}) {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const switchClass = "font-medium text-brand-700 underline-offset-4 transition-colors hover:text-brand-800 hover:underline";

  return (
    <div className="space-y-5">
      {googleEnabled ? (
        <>
          <GoogleButton next={next} />
          <AuthDivider>eller med e-post</AuthDivider>
        </>
      ) : null}

      {mode === "password" ? <LoginForm next={next} /> : <LoginCodeForm next={next} initialEmail={initialEmail} />}

      <p className="text-center text-sm text-ink-600">
        {mode === "password" ? (
          <>
            Ny enhet eller inget lösenord till hands?{" "}
            <button type="button" onClick={() => setMode("code")} className={switchClass}>
              Få en engångskod via e-post
            </button>
          </>
        ) : (
          <>
            Hellre lösenord?{" "}
            <button type="button" onClick={() => setMode("password")} className={switchClass}>
              Logga in med lösenord
            </button>
          </>
        )}
      </p>
    </div>
  );
}
