"use client";

import { useActionState, useId, useState } from "react";
import { resetPasswordAction, type ActionResult } from "@/actions/auth";
import { Button, FieldError, Label } from "@/components/ui";
import { FormNotice } from "./form-notice";
import { PasswordHint, PASSWORD_MIN_LENGTH } from "./password-hint";
import { PasswordInput } from "./password-input";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(resetPasswordAction, null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Only nag about a mismatch once the user has left the confirm field or tried to submit.
  const [confirmTouched, setConfirmTouched] = useState(false);
  const id = useId();

  const error = state && !state.ok ? state.error : null;
  const mismatch = password !== confirm;
  const confirmError = confirmTouched && confirm.length > 0 && mismatch ? "Lösenorden matchar inte." : null;

  return (
    <form
      action={formAction}
      className="space-y-4"
      aria-busy={pending}
      onSubmit={(event) => {
        // Cheap client-side guard; the server checks the same thing.
        if (mismatch) {
          event.preventDefault();
          setConfirmTouched(true);
        }
      }}
    >
      <input type="hidden" name="token" value={token} />

      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div>
        <Label htmlFor={`${id}-password`}>Nytt lösenord</Label>
        <PasswordInput
          id={`${id}-password`}
          name="password"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          placeholder="Minst 8 tecken"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={`${id}-password-hint`}
        />
        <PasswordHint id={`${id}-password-hint`} length={password.length} />
      </div>

      <div>
        <Label htmlFor={`${id}-confirm`}>Upprepa lösenordet</Label>
        <PasswordInput
          id={`${id}-confirm`}
          name="confirm"
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          placeholder="Samma lösenord igen"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          onBlur={() => setConfirmTouched(true)}
          aria-invalid={confirmError ? true : undefined}
        />
        <FieldError>{confirmError}</FieldError>
      </div>

      <Button type="submit" size="lg" className="w-full" loading={pending}>
        {pending ? "Sparar…" : "Spara nytt lösenord"}
      </Button>
    </form>
  );
}
