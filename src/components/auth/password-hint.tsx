import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const PASSWORD_MIN_LENGTH = 8;

/** Live hint under a new-password field: grey "Minst 8 tecken" that turns green with a check once the length is reached. */
export function PasswordHint({ id, length }: { id: string; length: number }) {
  const ok = length >= PASSWORD_MIN_LENGTH;
  return (
    <p id={id} className={cn("mt-1.5 flex items-center gap-1.5 text-sm transition-colors", ok ? "text-brand-700" : "text-ink-500")} aria-live="polite">
      {ok ? <Check className="h-4 w-4" aria-hidden /> : null}
      {ok ? "Bra – minst 8 tecken" : `Minst ${PASSWORD_MIN_LENGTH} tecken. Gärna en fras du kommer ihåg.`}
    </p>
  );
}
