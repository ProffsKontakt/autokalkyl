"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import type { ActionResult } from "./auth";

export interface ConversationSummary {
  id: string;
  title: string;
  receiptId: string | null;
  updatedAt: string;
}

export async function listConversationsAction(): Promise<ConversationSummary[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const rows = await prisma.conversation.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: { id: true, title: true, receiptId: true, updatedAt: true },
  });
  return rows.map((r) => ({ id: r.id, title: r.title ?? "Ny konversation", receiptId: r.receiptId, updatedAt: r.updatedAt.toISOString() }));
}

export async function deleteConversationAction(id: string): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Du måste vara inloggad." };
  const conv = await prisma.conversation.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!conv) return { ok: false, error: "Konversationen hittades inte." };
  await prisma.conversation.delete({ where: { id } });
  revalidatePath("/app/chatt");
  return { ok: true };
}
