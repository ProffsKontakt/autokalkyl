import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { isAiConfigured } from "@/lib/ai/client";
import { listConversationsAction } from "@/actions/chat";
import { ChatClient } from "@/components/chat/chat-client";
import { ConversationList } from "@/components/chat/conversation-list";
import type { ChatMessageData, ChatSource } from "@/components/chat/chat-core";

export const metadata: Metadata = { title: "Fråga AI" };

const PATH = "/app/chatt";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function isSource(value: unknown): value is ChatSource {
  if (!value || typeof value !== "object") return false;
  const v = value as { title?: unknown; url?: unknown };
  return typeof v.url === "string" && /^https?:\/\//i.test(v.url);
}

/** Maps a stored ChatMessage row to the JSON-safe shape the client renders (sources and image markers come from `content`). */
function toMessageData(message: { id: string; role: "USER" | "ASSISTANT"; text: string; content: unknown; createdAt: Date }): ChatMessageData {
  const blocks: unknown[] = Array.isArray(message.content) ? message.content : [];
  let sources: ChatSource[] = [];
  let imageCount = 0;
  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const b = block as { type?: unknown; items?: unknown };
    if (b.type === "sources" && Array.isArray(b.items)) {
      sources = b.items.filter(isSource).map((s) => ({ title: typeof s.title === "string" && s.title ? s.title : s.url, url: s.url }));
    } else if (b.type === "image" || b.type === "image_omitted") {
      imageCount += 1;
    }
  }
  return {
    id: message.id,
    role: message.role === "USER" ? "user" : "assistant",
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    sources: sources.length ? sources : undefined,
    imageCount: imageCount || undefined,
  };
}

export default async function ChatPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/logga-in?next=${encodeURIComponent(PATH)}`);
  const userId = session.user.id;

  const params = await searchParams;
  const conversationParam = first(params.c);
  const receiptParam = first(params.receipt);

  const [conversations, selected] = await Promise.all([
    listConversationsAction(),
    conversationParam
      ? prisma.conversation.findFirst({
          where: { id: conversationParam, userId },
          select: {
            id: true,
            title: true,
            receiptId: true,
            receipt: { select: { id: true, title: true, merchantName: true, deletedAt: true } },
            messages: {
              orderBy: { createdAt: "asc" },
              select: { id: true, role: true, text: true, content: true, createdAt: true },
            },
          },
        })
      : null,
  ]);
  // Unknown or someone else's conversation → start fresh instead of leaking anything.
  if (conversationParam && !selected) redirect(PATH);

  let receipt: { id: string; title: string; deleted: boolean } | null = null;
  if (selected?.receipt) {
    receipt = {
      id: selected.receipt.id,
      title: selected.receipt.title ?? selected.receipt.merchantName ?? "Kvitto",
      deleted: selected.receipt.deletedAt !== null,
    };
  } else if (!selected && receiptParam) {
    const row = await prisma.receipt.findFirst({
      where: { id: receiptParam, userId, deletedAt: null },
      select: { id: true, title: true, merchantName: true },
    });
    if (row) receipt = { id: row.id, title: row.title ?? row.merchantName ?? "Kvitto", deleted: false };
  }

  const initialMessages = selected ? selected.messages.map(toMessageData) : [];
  const aiEnabled = isAiConfigured();
  // Keying by conversation resets the chat state when the user switches thread.
  const chatKey = selected ? selected.id : `new:${receipt?.id ?? ""}`;

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-5.5rem)] lg:flex-row lg:gap-6">
      <ConversationList conversations={conversations} selectedId={selected?.id ?? null} />

      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">Fråga AI</h1>
          <p className="hidden text-sm text-ink-500 sm:block">Hitta rätt kvitto, kolla garantin och få hjälp när något krånglar.</p>
        </div>

        <ChatClient
          key={chatKey}
          conversationId={selected?.id ?? null}
          initialMessages={initialMessages}
          receiptId={receipt && !receipt.deleted ? receipt.id : null}
          receiptTitle={receipt?.title ?? null}
          aiEnabled={aiEnabled}
          className="h-[calc(100dvh-20rem)] min-h-[22rem] lg:h-auto lg:min-h-0 lg:flex-1"
        />
      </div>
    </div>
  );
}
