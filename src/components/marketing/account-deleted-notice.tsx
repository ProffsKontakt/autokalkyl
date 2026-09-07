import { CheckCircle2 } from "lucide-react";
import { Container } from "@/components/ui/container";

/**
 * Confirmation shown on the landing page after `deleteAccountAction` signs the user out
 * with `redirectTo: "/?deleted=1"` – otherwise the redirect gives no feedback at all.
 */
export function AccountDeletedNotice() {
  return (
    <Container className="pt-6">
      <div role="status" className="flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-brand-900 animate-fade-up">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1">
          <span className="font-semibold">Ditt konto och alla dina uppgifter är raderade.</span> Tack för att du provade – du är välkommen tillbaka när som helst.
        </p>
      </div>
    </Container>
  );
}
