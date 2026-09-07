"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown, MessageSquareText, Plus, ReceiptText, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { deleteConversationAction, type ConversationSummary } from "@/actions/chat";

const listDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "Europe/Stockholm",
});

function formatListDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : listDateFormatter.format(d);
}

function conversationHref(id: string): string {
  return `/app/chatt?c=${encodeURIComponent(id)}`;
}

function ConversationItems({
  conversations,
  selectedId,
  onDelete,
  onNavigate,
}: {
  conversations: ConversationSummary[];
  selectedId: string | null;
  onDelete: (conversation: ConversationSummary) => void;
  onNavigate: () => void;
}) {
  if (conversations.length === 0) {
    return <p className="px-3 py-6 text-center text-sm text-ink-500">Inga konversationer ännu. Ställ din första fråga!</p>;
  }
  return (
    <ul className="space-y-0.5">
      {conversations.map((conversation) => {
        const active = conversation.id === selectedId;
        return (
          <li key={conversation.id} className={cn("group flex items-start gap-1 rounded-xl transition-colors", active ? "bg-brand-50" : "hover:bg-ink-50")}>
            <Link href={conversationHref(conversation.id)} onClick={onNavigate} aria-current={active ? "page" : undefined} className="min-w-0 flex-1 rounded-xl px-3 py-2.5">
              <span className={cn("line-clamp-2 text-sm font-medium", active ? "text-brand-900" : "text-ink-800")}>{conversation.title}</span>
              <span className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-400">
                {conversation.receiptId ? <ReceiptText className="h-3.5 w-3.5 text-brand-600" role="img" aria-label="Kopplad till ett kvitto" /> : null}
                <time dateTime={conversation.updatedAt}>{formatListDate(conversation.updatedAt)}</time>
              </span>
            </Link>
            <button
              type="button"
              onClick={() => onDelete(conversation)}
              aria-label={`Radera konversationen ${conversation.title}`}
              className="mr-1 mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition-opacity hover:bg-red-50 hover:text-red-700 focus-visible:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The user's conversations: a sticky list on desktop and a collapsible picker on mobile,
 * with "Ny konversation" and delete (with confirmation).
 */
export function ConversationList({ conversations, selectedId }: { conversations: ConversationSummary[]; selectedId: string | null }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState<ConversationSummary | null>(null);
  const [busy, setBusy] = React.useState(false);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  async function confirmDelete() {
    if (!pending) return;
    setBusy(true);
    try {
      const result = await deleteConversationAction(pending.id);
      if (result.ok) {
        const wasSelected = pending.id === selectedId;
        toast.success("Konversationen är raderad");
        setPending(null);
        if (wasSelected) router.push("/app/chatt");
        else router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setBusy(false);
    }
  }

  const items = <ConversationItems conversations={conversations} selectedId={selectedId} onDelete={setPending} onNavigate={() => setOpen(false)} />;

  return (
    <>
      {/* Desktop: sticky side list */}
      <aside
        className="hidden lg:flex lg:h-full lg:w-72 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:rounded-2xl lg:border lg:border-ink-200/80 lg:bg-white lg:shadow-card"
        aria-label="Konversationer"
      >
        <div className="border-b border-ink-100 p-3">
          <ButtonLink href="/app/chatt" variant={selectedId ? "primary" : "outline"} className="w-full">
            <Plus className="h-4 w-4" aria-hidden />
            Ny konversation
          </ButtonLink>
        </div>
        <div className="flex items-center justify-between px-4 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          <span>Tidigare</span>
          <span>{conversations.length}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">{items}</div>
      </aside>

      {/* Mobile: collapsible picker + new button */}
      <div className="flex items-stretch gap-2 lg:hidden">
        <details open={open} onToggle={(event) => setOpen(event.currentTarget.open)} className="min-w-0 flex-1 rounded-2xl border border-ink-200/80 bg-white shadow-card">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 items-center gap-2">
              <MessageSquareText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              <span className="truncate">{selected ? selected.title : `Konversationer (${conversations.length})`}</span>
            </span>
            <ChevronDown className={cn("h-4 w-4 shrink-0 text-ink-400 transition-transform", open && "rotate-180")} aria-hidden />
          </summary>
          <div className="max-h-72 overflow-y-auto border-t border-ink-100 p-2">{items}</div>
        </details>
        <ButtonLink href="/app/chatt" variant="primary" aria-label="Ny konversation" className="shrink-0 px-4">
          <Plus className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Ny</span>
        </ButtonLink>
      </div>

      <Dialog open={pending !== null} onClose={() => (busy ? undefined : setPending(null))} title="Radera konversationen?">
        <p className="text-sm text-ink-600">
          <span className="font-semibold text-ink-900">{pending?.title}</span> och alla meddelanden i den tas bort. Det går inte att ångra.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setPending(null)} disabled={busy}>
            Avbryt
          </Button>
          <Button type="button" variant="danger" onClick={confirmDelete} loading={busy}>
            Radera
          </Button>
        </div>
      </Dialog>
    </>
  );
}
