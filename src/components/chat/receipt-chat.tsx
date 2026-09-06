"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantAvatar, Composer, MessageList, NotConfiguredNotice, RECEIPT_SUGGESTED_PROMPTS, SuggestedPrompts, useChat } from "./chat-core";

export interface ReceiptChatProps {
  receiptId: string;
  receiptTitle: string;
  /** Pass `isAiConfigured()` from the page; when false the composer is replaced by a notice. */
  aiEnabled?: boolean;
  className?: string;
}

/**
 * Compact chat panel for the receipt detail page. The first message starts a new conversation
 * bound to the receipt; later messages continue it. Links out to the full chat page.
 */
export function ReceiptChat({ receiptId, receiptTitle, aiEnabled = true, className }: ReceiptChatProps) {
  const chat = useChat({ receiptId, initialMessages: [] });
  const streaming = chat.status === "streaming";
  const fullChatHref = chat.conversationId
    ? `/app/chatt?c=${encodeURIComponent(chat.conversationId)}`
    : `/app/chatt?receipt=${encodeURIComponent(receiptId)}`;

  const emptyState = (
    <div className="px-1 py-1">
      <p className="text-sm text-ink-600">Ställ en fråga om köpet – jag utgår från kvittot och letar upp villkor och bruksanvisning åt dig.</p>
      {aiEnabled ? <SuggestedPrompts compact prompts={RECEIPT_SUGGESTED_PROMPTS} onPick={(prompt) => void chat.send(prompt.text)} disabled={streaming} className="mt-3" /> : null}
    </div>
  );

  return (
    <section className={cn("flex flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card", className)} aria-label={`Fråga AI om ${receiptTitle}`}>
      <header className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <AssistantAvatar />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-ink-900">Fråga AI om kvittot</h3>
            <p className="truncate text-xs text-ink-500">{receiptTitle}</p>
          </div>
        </div>
        <Link href={fullChatHref} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-800">
          Öppna i chatten
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </header>

      <MessageList
        compact
        messages={chat.messages}
        streaming={streaming}
        activity={chat.activity}
        error={chat.error}
        canRetry={chat.canRetry}
        onRetry={() => void chat.retry()}
        onDismissError={chat.dismissError}
        emptyState={emptyState}
        className="max-h-80"
      />

      {aiEnabled ? (
        <Composer compact onSend={(text, attachments) => chat.send(text, attachments)} onAbort={chat.abort} streaming={streaming} placeholder="Fråga om det här kvittot…" />
      ) : (
        <NotConfiguredNotice compact />
      )}
    </section>
  );
}
