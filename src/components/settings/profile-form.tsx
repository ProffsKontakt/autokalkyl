"use client";

import { useActionState, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProfileAction, type ActionResult } from "@/actions/auth";
import { Button, Hint, Input, Label } from "@/components/ui";
import { FormNotice } from "@/components/auth/form-notice";

export function ProfileForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const id = useId();
  // Controlled so the value survives a failed submit (React resets uncontrolled forms after an action).
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName.trim());

  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(async (prev, formData) => {
    const result = await updateProfileAction(prev, formData);
    if (result && result.ok) {
      const next = String(formData.get("name") ?? "").trim();
      setSavedName(next);
      setName(next);
      toast.success("Namnet är sparat");
      router.refresh();
    }
    return result;
  }, null);

  const error = state && !state.ok ? state.error : null;
  const trimmed = name.trim();
  const dirty = trimmed.length > 0 && trimmed !== savedName;

  return (
    <form action={formAction} className="space-y-4" aria-busy={pending}>
      {error ? <FormNotice tone="error">{error}</FormNotice> : null}

      <div>
        <Label htmlFor={`${id}-name`}>Namn</Label>
        <Input
          id={`${id}-name`}
          name="name"
          autoComplete="name"
          required
          maxLength={100}
          placeholder="Ditt namn"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={error ? true : undefined}
        />
        <Hint>Visas i appen och i mail från oss.</Hint>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={pending} disabled={!dirty}>
          {pending ? "Sparar…" : "Spara namn"}
        </Button>
      </div>
    </form>
  );
}
