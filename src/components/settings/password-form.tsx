"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";
import { changePasswordAction, type ActionResult } from "@/actions/auth";
import { Button, FieldError, Hint, Label } from "@/components/ui";
import { FormNotice } from "@/components/auth/form-notice";
import { PasswordInput } from "@/components/auth/password-input";
import { PASSWORD_MIN_LENGTH, PasswordHint } from "@/components/auth/password-hint";

export function PasswordForm() {
  const id = useId();
  // Controlled so a typo in one field doesn't wipe the others on a failed submit.
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    const result = await changePasswordAction(prev, formData);
    if (result && result.ok) {
      setCurrent("");
      setPassword("");
      setConfirm("");
      toast.success("Lösenordet är ändrat");
    }
    return result;
  }, null);

  const error = state && !state.ok ? state.error : null;
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = current.length > 0 && password.length >= PASSWORD_MIN_LENGTH && confirm === password;

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div className="sm:max-w-sm">
        <Label htmlFor={`${id}-current`}>Nuvarande lösenord</Label>
        <PasswordInput
          id={`${id}-current`}
          name="current"
          autoComplete="current-password"
          required
          maxLength={128}
          value={current}
          onChange={(event) => setCurrent(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-password`}>Nytt lösenord</Label>
          <PasswordInput
            id={`${id}-password`}
            name="password"
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={`${id}-hint`}
          />
          <PasswordHint id={`${id}-hint`} length={password.length} />
        </div>
        <div>
          <Label htmlFor={`${id}-confirm`}>Upprepa nytt lösenord</Label>
          <PasswordInput
            id={`${id}-confirm`}
            name="confirm"
            autoComplete="new-password"
            required
            maxLength={128}
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={mismatch ? true : undefined}
          />
          <FieldError>{mismatch ? "Lösenorden matchar inte" : null}</FieldError>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Hint className="mt-0">Du förblir inloggad på den här enheten efter bytet.</Hint>
        <Button type="submit" loading={pending} disabled={!canSubmit} className="w-full sm:w-auto">
          {pending ? "Byter…" : "Byt lösenord"}
        </Button>
      </div>
    </form>
  );
}
