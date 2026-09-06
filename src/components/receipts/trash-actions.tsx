"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { purgeReceiptAction, restoreReceiptAction } from "@/actions/receipts";

/** Restore / permanently delete buttons for a receipt in the trash. */
export function TrashActions({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [busy, setBusy] = React.useState<"restore" | "purge" | null>(null);

  async function restore() {
    setBusy("restore");
    try {
      const result = await restoreReceiptAction(id);
      if (result.ok) {
        toast.success("Kvittot är återställt", { description: "Du hittar det bland dina kvitton igen." });
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(null);
    }
  }

  async function purge() {
    setBusy("purge");
    try {
      const result = await purgeReceiptAction(id);
      if (result.ok) {
        toast.success("Kvittot är raderat permanent");
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button type="button" size="sm" variant="secondary" onClick={restore} loading={busy === "restore"} disabled={busy !== null} className="flex-1">
        {busy === "restore" ? null : <RotateCcw className="h-4 w-4" aria-hidden />}
        Återställ
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmOpen(true)} disabled={busy !== null} className="text-danger hover:bg-red-50 hover:text-red-700" aria-label={`Radera ${title} permanent`}>
        <Trash2 className="h-4 w-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Radera</span>
      </Button>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Radera permanent?">
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{title}</span> raderas för alltid, inklusive bilder och uppgifter. Det går inte att ångra.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={busy === "purge"}>
            Avbryt
          </Button>
          <Button type="button" variant="danger" onClick={purge} loading={busy === "purge"}>
            Radera permanent
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
