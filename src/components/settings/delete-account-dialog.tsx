"use client";

import { useActionState, useId, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteAccountAction, type ActionResult } from "@/actions/auth";
import { Button, Dialog, Input, Label } from "@/components/ui";
import { FormNotice } from "@/components/auth/form-notice";
import { PasswordInput } from "@/components/auth/password-input";

const CONFIRM_WORD = "RADERA";

export function DeleteAccountDialog({ email }: { email: string }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  // Own error state (instead of the action state) so a stale error never reappears when the dialog is reopened.
  const [error, setError] = useState<string | null>(null);

  const [, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    setError(null);
    const result = await deleteAccountAction(prev, formData);
    // On success the action signs the user out and redirects, so we only get back here on failure.
    if (result && !result.ok) {
      setError(result.error);
      toast.error(result.error);
    }
    return result;
  }, null);

  function openDialog() {
    setError(null);
    setPassword("");
    setConfirm("");
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  const ready = password.length > 0 && confirm.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={openDialog}
        className="w-full border-red-200 text-danger hover:border-red-300 hover:bg-red-50 sm:w-auto"
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        Radera mitt konto
      </Button>

      <Dialog open={open} onClose={close} title="Radera kontot permanent">
        <form action={formAction} className="space-y-4" aria-busy={pending}>
          <FormNotice tone="error">
            <strong>Det här går inte att ångra.</strong> Kontot <span className="font-medium">{email}</span> och allt som hör till det raderas
            för alltid: alla kvitton, bilder och PDF:er, garantier, chatthistorik och din kvittoadress.
          </FormNotice>

          {error ? <FormNotice tone="error">{error}</FormNotice> : null}

          <div>
            <Label htmlFor={`${id}-password`}>Ditt lösenord</Label>
            <PasswordInput
              id={`${id}-password`}
              name="password"
              autoComplete="current-password"
              required
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <div>
            <Label htmlFor={`${id}-confirm`}>
              Skriv <span className="font-mono">{CONFIRM_WORD}</span> för att bekräfta
            </Label>
            <Input
              id={`${id}-confirm`}
              name="confirm"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
              placeholder={CONFIRM_WORD}
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </div>

          <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Avbryt
            </Button>
            <Button type="submit" variant="danger" loading={pending} disabled={!ready}>
              {pending ? "Raderar…" : "Radera kontot för alltid"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
