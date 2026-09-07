"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui";
import { restoreReceiptAction } from "@/actions/receipts";
import { formatDateTime } from "@/lib/utils";

/** Banner for receipts that are in the trash, with a one-click restore. */
export function TrashBanner({ receiptId, deletedAt }: { receiptId: string; deletedAt: string }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function restore() {
    startTransition(async () => {
      const result = await restoreReceiptAction(receiptId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Kvittot är återställt.");
      router.refresh();
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-ink-200 bg-ink-100 p-4 sm:flex-row sm:items-center sm:justify-between" role="status">
      <div className="flex items-start gap-3">
        <Trash2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-500" aria-hidden />
        <div>
          <p className="font-medium text-ink-900">Det här kvittot ligger i papperskorgen</p>
          <p className="text-sm text-ink-600">
            Flyttat {formatDateTime(deletedAt)}. Du kan återställa det här eller radera det permanent från{" "}
            <Link href="/app/papperskorg" className="font-medium text-brand-700 hover:underline">
              papperskorgen
            </Link>
            .
          </p>
        </div>
      </div>
      <Button type="button" variant="dark" size="sm" onClick={restore} loading={pending} className="shrink-0">
        {pending ? null : <RotateCcw className="h-4 w-4" aria-hidden />}
        Återställ
      </Button>
    </section>
  );
}
