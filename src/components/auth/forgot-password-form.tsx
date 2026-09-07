"use client";

import { useActionState, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { requestPasswordResetAction, type ActionResult } from "@/actions/auth";
import { Button, ButtonLink, Checkmark, Input, Label } from "@/components/ui";
import { FormNotice } from "./form-notice";

/**
 * Outer wrapper owns a key so "Försök med en annan adress" can remount the inner form
 * and clear the action state (useActionState has no reset of its own).
 */
export function ForgotPasswordForm() {
  const [attempt, setAttempt] = useState(0);
  return <ForgotPasswordFormInner key={attempt} onRetry={() => setAttempt((value) => value + 1)} />;
}

function ForgotPasswordFormInner({ onRetry }: { onRetry: () => void }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(requestPasswordResetAction, null);
  const [email, setEmail] = useState("");
  const reduceMotion = useReducedMotion();
  const id = useId();

  const error = state && !state.ok ? state.error : null;

  if (state?.ok) {
    return (
      <motion.div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center py-2 text-center"
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
      >
        <Checkmark size={96} label="Skickat" />
        <h2 className="mt-5 text-xl font-bold text-ink-900">Kolla din inkorg</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-600">
          Om adressen finns skickar vi en länk till{" "}
          <strong className="font-semibold text-ink-900">{email.trim().toLowerCase()}</strong> inom någon minut. Länken är giltig i
          60 minuter.
        </p>
        <p className="mt-4 text-xs leading-relaxed text-ink-500">Inget mail? Kolla skräpposten, eller kontrollera att du skrev rätt adress.</p>
        <div className="mt-6 flex w-full flex-col gap-2">
          <ButtonLink href="/logga-in" variant="outline" size="lg" className="w-full">
            Tillbaka till inloggningen
          </ButtonLink>
          <Button type="button" variant="ghost" onClick={onRetry}>
            Försök med en annan adress
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
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

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Skickar…" : "Skicka återställningslänk"}
      </Button>
    </form>
  );
}
