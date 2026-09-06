"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ReceiptText, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Composer,
  DEFAULT_SUGGESTED_PROMPTS,
  MessageList,
  NotConfiguredNotice,
  RECEIPT_SUGGESTED_PROMPTS,
  SuggestedPrompts,
  useChat,
  type ChatMessageData,
  type ComposerHandle,
  type SuggestedPrompt,
} from "./chat-core";

export interface ChatClientProps {
  /** Existing conversation to continue; omit to start a new one on the first message. */
  conversationId?: string | null;
  /** Messages loaded from the database (id, role, text, createdAt, optional sources). */
  initialMessages?: ChatMessageData[];
  /** Bind new conversations to this receipt. */
  receiptId?: string | null;
  /** Shown as a context chip: "Om kvittot: {title}". */
  receiptTitle?: string | null;
  /** When false, history is shown but the composer is replaced by an informative card. */
  aiEnabled?: boolean;
  className?: string;
}

function chatUrl(conversationId: string): string {
  return `/app/chatt?c=${encodeURIComponent(conversationId)}`;
}

/**
 * The full chat experience for /app/chatt. Streams answers from /api/chat, shows what the
 * assistant is doing (searching receipts, the web, reading pages), sources and errors.
 * The page keys this component by conversation so switching threads resets the state.
 */
export function ChatClient({ conversationId = null, initialMessages = [], receiptId = null, receiptTitle = null, aiEnabled = true, className }: ChatClientProps) {
  const router = useRouter();
  const composerRef = React.useRef<ComposerHandle>(null);

  const chat = useChat({
    conversationId,
    receiptId,
    initialMessages,
    onConversationCreated: (id) => {
      // Keep the URL in sync right away so a reload lands in the same conversation.
      window.history.replaceState(null, "", chatUrl(id));
    },
    onDone: ({ conversationId: id, isNew }) => {
      // Refresh the server-rendered sidebar (titles, order) – and mount the new conversation properly.
      if (isNew) router.replace(chatUrl(id), { scroll: false });
      else router.refresh();
    },
  });

  const streaming = chat.status === "streaming";

  function pickPrompt(prompt: SuggestedPrompt) {
    if (prompt.fill) composerRef.current?.insert(prompt.text);
    else void chat.send(prompt.text);
  }

  const prompts = receiptTitle ? RECEIPT_SUGGESTED_PROMPTS : DEFAULT_SUGGESTED_PROMPTS;

  const emptyState = (
    <div className="mx-auto flex max-w-xl flex-col items-center px-2 py-6 text-center sm:py-10">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
        <Sparkles className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">{receiptTitle ? "Vad vill du veta om köpet?" : "Hej! Vad kan jag hjälpa dig med?"}</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        {receiptTitle
          ? "Jag utgår från kvittot och letar upp garantivillkor, bruksanvisning och hur du reklamerar om något krånglar."
          : "Jag hittar rätt kvitto bland dina sparade, kollar garanti och reklamationsrätt och letar upp bruksanvisningar och support för just din produkt."}
      </p>
      {aiEnabled ? <SuggestedPrompts prompts={prompts} onPick={pickPrompt} disabled={streaming} className="mt-6" /> : null}
    </div>
  );

  return (
    <section className={cn("flex min-h-0 flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card", className)} aria-label="AI-assistent">
      {receiptTitle ? (
        <header className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5 sm:px-4">
          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-brand-50 py-1 pl-2.5 pr-3 text-sm text-brand-800">
            <ReceiptText className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            <span className="shrink-0 text-brand-700">Om kvittot:</span>
            {receiptId ? (
              <Link href={`/app/kvitton/${encodeURIComponent(receiptId)}`} className="truncate font-semibold text-brand-900 hover:underline">
                {receiptTitle}
              </Link>
            ) : (
              <span className="truncate font-semibold text-brand-900">{receiptTitle}</span>
            )}
          </span>
        </header>
      ) : null}

      <MessageList
        messages={chat.messages}
        streaming={streaming}
        activity={chat.activity}
        error={chat.error}
        canRetry={chat.canRetry}
        onRetry={() => void chat.retry()}
        onDismissError={chat.dismissError}
        emptyState={emptyState}
        className="flex-1"
      />

      {aiEnabled ? (
        <Composer
          ref={composerRef}
          onSend={(text, attachments) => chat.send(text, attachments)}
          onAbort={chat.abort}
          streaming={streaming}
          placeholder={receiptTitle ? "Fråga om det här köpet…" : "Fråga om ett kvitto, en garanti eller ett problem…"}
        />
      ) : (
        <NotConfiguredNotice />
      )}
    </section>
  );
}
