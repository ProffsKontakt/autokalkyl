import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/audit";
import { describeAiError, isAiConfigured } from "@/lib/ai/client";
import { runAssistant, type AssistantEvent } from "@/lib/ai/assistant";
import { dbRateLimit, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

const bodySchema = z.object({
  conversationId: z.string().min(1).optional(),
  receiptId: z.string().min(1).optional(),
  text: z.string().trim().min(1).max(8000),
  attachments: z
    .array(
      z.object({
        mimeType: z.enum(["image/jpeg", "image/png", "image/webp", "image/gif"]),
        // Vercel rejects request bodies over 4.5 MB – clients downscale to ~1280 px before sending.
        data: z.string().min(1).max(1_500_000),
      }),
    )
    .max(3)
    .optional(),
});

/**
 * POST { conversationId?, receiptId?, text, attachments? }
 * → application/x-ndjson stream of AssistantEvent lines. First line is { type: "conversation", id }.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });
  const userId = session.user.id;
  const accountType = session.user.accountType ?? "PRIVATE";

  const rl = rateLimit(`chat:${userId}`, 40, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Du har skickat många frågor på kort tid. Vänta en stund." }, { status: 429 });
  const dbRl = await dbRateLimit(userId, "chat.message", 60, 60 * 60 * 1000);
  if (!dbRl.ok) return NextResponse.json({ error: "Du har nått gränsen för antal frågor per timme. Försök igen om en stund." }, { status: 429 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Ogiltig förfrågan." }, { status: 400 });
  const { text, attachments } = parsed.data;
  const attachmentBytes = (attachments ?? []).reduce((sum, a) => sum + a.data.length, 0);
  if (attachmentBytes > 3_600_000) return NextResponse.json({ error: "Bilderna är för stora. Skicka färre eller mindre bilder." }, { status: 413 });

  if (!isAiConfigured()) {
    return NextResponse.json({ error: "AI-assistenten är inte aktiverad (ANTHROPIC_API_KEY saknas)." }, { status: 503 });
  }

  // Resolve or create the conversation (must belong to the user)
  let conversationId = parsed.data.conversationId ?? null;
  let receiptId = parsed.data.receiptId ?? null;
  if (receiptId) {
    const owned = await prisma.receipt.findFirst({ where: { id: receiptId, userId, deletedAt: null }, select: { id: true } });
    if (!owned) receiptId = null;
  }
  if (conversationId) {
    const conv = await prisma.conversation.findFirst({ where: { id: conversationId, userId }, select: { id: true, receiptId: true } });
    if (!conv) return NextResponse.json({ error: "Konversationen hittades inte." }, { status: 404 });
    receiptId = receiptId ?? conv.receiptId;
  } else {
    const conv = await prisma.conversation.create({
      data: { userId, receiptId, title: text.slice(0, 80) },
      select: { id: true },
    });
    conversationId = conv.id;
  }
  const convId = conversationId;

  await audit(userId, "chat.message", { receiptId, details: { conversationId: convId, length: text.length, images: attachments?.length ?? 0 } });

  const encoder = new TextEncoder();
  let closed = false;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: AssistantEvent | { type: "conversation"; id: string }) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          closed = true;
        }
      };
      send({ type: "conversation", id: convId });
      try {
        await runAssistant({
          userId,
          accountType,
          conversationId: convId,
          receiptId,
          userText: text,
          attachments,
          emit: send,
          signal: request.signal,
        });
      } catch (error) {
        console.error("[chat] failed", error);
        send({ type: "error", message: describeAiError(error) });
      } finally {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {}
        }
      }
    },
    cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
