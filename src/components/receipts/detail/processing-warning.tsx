"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, PencilLine, RefreshCw } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui";
import { reprocessReceiptAction } from "@/actions/receipts";
import type { ReceiptStatusValue } from "./types";

/** Warning card shown when extraction failed or needs a human look. */
export function ProcessingWarning({
  receiptId,
  status,
  error,
  canReprocess,
  editHref,
}: {
  receiptId: string;
  status: Extract<ReceiptStatusValue, "NEEDS_REVIEW" | "FAILED">;
  error: string | null;
  /** False for manual receipts without a file – there is nothing to re-read. */
  canReprocess: boolean;
  editHref: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const title = status === "FAILED" ? "Kvittot kunde inte tolkas" : "Kontrollera uppgifterna";
  const fallback =
    status === "FAILED"
      ? "Vi kunde inte läsa av kvittot automatiskt. Du kan försöka igen eller fylla i uppgifterna själv – kvittot är sparat oavsett."
      : "AI:n var osäker på några uppgifter. Titta igenom butik, datum och belopp och rätta det som blivit fel.";

  function reprocess() {
    startTransition(async () => {
      const result = await reprocessReceiptAction(receiptId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const next = result.data?.status;
      if (next === "READY") toast.success("Kvittot är tolkat.");
      else if (next === "NEEDS_REVIEW") toast.warning("Kvittot är tolkat men behöver en titt.");
      else if (next === "PROCESSING") toast.info("Kvittot tolkas redan – vi uppdaterar sidan strax.");
      else toast.error("Det gick tyvärr inte att tolka kvittot den här gången heller.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6" role="status">
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-amber-900">{title}</h2>
          <p className="mt-1 text-sm text-amber-900/80">{error ?? fallback}</p>
          {error ? <p className="mt-1 text-sm text-amber-900/70">{fallback}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            {canReprocess ? (
              <Button type="button" variant="dark" size="sm" onClick={reprocess} loading={pending}>
                {pending ? null : <RefreshCw className="h-4 w-4" aria-hidden />}
                {pending ? "Tolkar kvittot igen…" : "Tolka igen"}
              </Button>
            ) : null}
            <ButtonLink href={editHref} variant="outline" size="sm">
              <PencilLine className="h-4 w-4" aria-hidden />
              Redigera
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
