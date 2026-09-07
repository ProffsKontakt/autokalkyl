"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, MessageCircleQuestion, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { Button, ButtonLink, Dialog } from "@/components/ui";
import { deleteReceiptAction } from "@/actions/receipts";
import { cn } from "@/lib/utils";
import { fileLabel, fileUrl, receiptHref, type ReceiptDetailFile } from "./types";

/** Header actions: edit, ask AI, download originals and delete (with confirmation). */
export function ReceiptActions({ receiptId, files, isDeleted }: { receiptId: string; files: ReceiptDetailFile[]; isDeleted: boolean }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const menuRef = React.useRef<HTMLDivElement>(null);
  const toggleRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  function confirmDelete() {
    startTransition(async () => {
      const result = await deleteReceiptAction(receiptId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Kvittot ligger nu i papperskorgen.");
      setConfirmOpen(false);
      router.push("/app/kvitton");
    });
  }

  const menuItem = "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-800 hover:bg-ink-50 focus:bg-ink-50 focus:outline-none";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ButtonLink href={receiptHref(receiptId, true)} variant="outline" size="sm">
        <PencilLine className="h-4 w-4" aria-hidden />
        Redigera
      </ButtonLink>
      <ButtonLink href="#fraga-ai" variant="primary" size="sm">
        <MessageCircleQuestion className="h-4 w-4" aria-hidden />
        Fråga AI
      </ButtonLink>
      <div ref={menuRef} className="relative">
        <Button
          ref={toggleRef}
          type="button"
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Fler åtgärder"
        >
          <MoreHorizontal className="h-4 w-4" aria-hidden />
        </Button>
        <div
          role="menu"
          aria-label="Fler åtgärder"
          className={cn(
            "absolute right-0 z-20 mt-2 w-64 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card",
            menuOpen ? "animate-fade-up" : "hidden",
          )}
        >
          {files.length ? (
            files.map((file, index) => (
              <a key={file.id} role="menuitem" href={fileUrl(file.id, { download: true })} className={menuItem} onClick={() => setMenuOpen(false)}>
                <Download className="h-4 w-4 text-ink-500" aria-hidden />
                {files.length === 1 ? "Ladda ner original" : `Ladda ner ${fileLabel(file, index, files.length).toLowerCase()}`}
              </a>
            ))
          ) : (
            <span className="block px-3 py-2 text-sm text-ink-400">Inget original att ladda ner</span>
          )}
          {!isDeleted ? (
            <>
              <div className="my-1 border-t border-ink-100" role="separator" />
              <button
                type="button"
                role="menuitem"
                className={cn(menuItem, "text-red-700 hover:bg-red-50 focus:bg-red-50")}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
                Ta bort
              </button>
            </>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmOpen} onClose={() => (pending ? undefined : setConfirmOpen(false))} title="Flytta till papperskorgen?">
        <p className="text-sm text-ink-600">Kvittot hamnar i papperskorgen och kan återställas därifrån. Originalfilerna följer med.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setConfirmOpen(false)} disabled={pending}>
            Avbryt
          </Button>
          <Button type="button" variant="danger" onClick={confirmDelete} loading={pending}>
            {pending ? null : <Trash2 className="h-4 w-4" aria-hidden />}
            Ta bort
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
