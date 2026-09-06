import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { processReceipt } from "@/lib/receipts/pipeline";

export const runtime = "nodejs";
export const maxDuration = 120;

/** GET → { status, title, processingError } – used while a receipt is being interpreted. */
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const receipt = await prisma.receipt.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true, status: true, title: true, processingError: true, updatedAt: true, merchantName: true, totalAmount: true },
  });
  if (!receipt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Self-heal: if a receipt has been stuck in PROCESSING for > 3 minutes (function died), run it again inline.
  if (receipt.status === "PROCESSING" && Date.now() - receipt.updatedAt.getTime() > 3 * 60 * 1000) {
    const { status } = await processReceipt(id);
    return NextResponse.json({ id, status, title: receipt.title, processingError: null });
  }

  return NextResponse.json({
    id: receipt.id,
    status: receipt.status,
    title: receipt.title,
    merchantName: receipt.merchantName,
    totalAmount: receipt.totalAmount ? Number(receipt.totalAmount) : null,
    processingError: receipt.processingError,
  });
}
