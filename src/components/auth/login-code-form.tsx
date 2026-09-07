"use client";

import { useActionState, useId, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { requestLoginCodeAction, verifyLoginCodeAction, type ActionResult } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";
import { FormNotice } from "./form-notice";

type Sent = { email: string; round: number };

/**
 * Passwordless login in two steps: address → six-digit code from the e-mail.
 * The code step is keyed per round so "Byt e-postadress" starts clean.
 */
export function LoginCodeForm({ next, initialEmail = "" }: { next?: string; initialEmail?: string }) {
  const [sent, setSent] = useState<Sent | null>(null);
  if (sent) {
    return <CodeStep key={sent.round} email={sent.email} next={next} onChangeEmail={() => setSent(null)} />;
  }
  return <EmailStep initialEmail={initialEmail} onSent={(email) => setSent({ email, round: Date.now() })} />;
}

function EmailStep({ initialEmail, onSent }: { initialEmail: string; onSent: (email: string) => void }) {
  const id = useId();
  const [email, setEmail] = useState(initialEmail);
  const [state, formAction, pending] = useActionState<ActionResult<{ email: string }> | null, FormData>(async (prev, formData) => {
    const result = await requestLoginCodeAction(prev, formData);
    if (result.ok && result.data) onSent(result.data.email);
    return result;
  }, null);
  const error = state && !state.ok ? state.error : null;

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
          aria-describedby={`${id}-help`}
        />
        <p id={`${id}-help`} className="mt-1.5 text-sm text-ink-500">
          Vi mailar en sexsiffrig kod som gäller i tio minuter. Inget lösenord behövs.
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Skickar…" : "Skicka kod"}
      </Button>
    </form>
  );
}

function CodeStep({ email, next, onChangeEmail }: { email: string; next?: string; onChangeEmail: () => void }) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [code, setCode] = useState("");
  const [verifyState, verifyAction, verifying] = useActionState<ActionResult | null, FormData>(verifyLoginCodeAction, null);
  const [resendState, resendAction, resending] = useActionState<ActionResult<{ email: string }> | null, FormData>(requestLoginCodeAction, null);

  const error = verifyState && !verifyState.ok ? verifyState.error : null;
  const resendError = resendState && !resendState.ok ? resendState.error : null;
  const resent = Boolean(resendState?.ok);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <FormNotice tone="success" className="mb-4">
        Vi har skickat en kod till <strong className="font-semibold">{email}</strong>. Inget mail? Kolla skräpposten.
      </FormNotice>

      <form action={verifyAction} className="space-y-4" aria-busy={verifying}>
        <input type="hidden" name="email" value={email} />
        {next ? <input type="hidden" name="next" value={next} /> : null}
        {error ? <FormNotice tone="error">{error}</FormNotice> : null}

        <div>
          <Label htmlFor={`${id}-code`}>Engångskod</Label>
          <Input
            id={`${id}-code`}
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={7}
            required
            placeholder="123 456"
            className="text-center text-2xl font-semibold tracking-[0.4em]"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/[^\d ]/g, ""))}
            aria-invalid={error ? true : undefined}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" loading={verifying}>
          {verifying ? "Loggar in…" : "Logga in"}
        </Button>
      </form>

      <div className="mt-4 flex flex-col items-center gap-1 text-sm">
        <form action={resendAction}>
          <input type="hidden" name="email" value={email} />
          <Button type="submit" variant="ghost" size="sm" loading={resending}>
            {resending ? "Skickar…" : "Skicka en ny kod"}
          </Button>
        </form>
        {resent ? (
          <p role="status" className="text-brand-700">
            En ny kod är på väg – den gamla slutar gälla.
          </p>
        ) : null}
        {resendError ? (
          <p role="alert" className="text-danger">
            {resendError}
          </p>
        ) : null}
        <button type="button" onClick={onChangeEmail} className="font-medium text-brand-700 underline-offset-4 hover:underline">
          Byt e-postadress
        </button>
      </div>
    </motion.div>
  );
}
