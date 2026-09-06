"use client";

import { useEffect } from "react";
import { Button, ButtonLink } from "@/components/ui/button";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-ink-900">Något gick fel</h1>
      <p className="mt-2 max-w-md text-ink-500">Ett oväntat fel uppstod. Försök igen – dina kvitton är säkra.</p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Försök igen</Button>
        <ButtonLink href="/app" variant="outline">Till översikten</ButtonLink>
      </div>
    </div>
  );
}
