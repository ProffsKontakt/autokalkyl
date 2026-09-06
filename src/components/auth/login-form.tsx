"use client";

import { useActionState, useId, useState } from "react";
import { loginAction, type ActionResult } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { AuthLink } from "./auth-card";
import { FormNotice } from "./form-notice";
import { PasswordInput } from "./password-input";

export function LoginForm({
  next,
}: {
  /** Already-sanitised path to continue to after login (from ?next=). The action falls back to /app. */
  next?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(loginAction, null);
  // Controlled so the address survives a failed attempt (React resets uncontrolled forms after an action).
  const [email, setEmail] = useState("");
  const id = useId();

  const error = state && !state.ok ? state.error : null;

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div>
        <Label htmlFor={`${id}-email`}>E-post</Label>
        <Input
          id={`${id}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={254}
          placeholder="anna@exempel.se"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <Label htmlFor={`${id}-password`} className="mb-0">
            Lösenord
          </Label>
          <AuthLink href="/glomt-losenord" className="text-sm">
            Glömt lösenordet?
          </AuthLink>
        </div>
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="current-password"
          required
          maxLength={128}
          placeholder="Ditt lösenord"
          aria-invalid={error ? true : undefined}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Loggar in…" : "Logga in"}
      </Button>
    </form>
  );
}
