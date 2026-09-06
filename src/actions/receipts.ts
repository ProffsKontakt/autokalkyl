"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { audit } from "@/lib/audit";
import { processReceipt } from "@/lib/receipts/pipeline";
import { retentionUntil, returnDeadline, warrantyExpiry } from "@/lib/receipts/warranty";
import { receiptUpdateSchema, type ReceiptUpdateInput } from "@/lib/receipts/schema";
import { dbRateLimit } from "@/lib/rate-limit";
import { PROCESSING_STALE_MS } from "@/lib/receipts/pipeline";
import type { ActionResult } from "./auth";


async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user;
}

function decimal(n: number | null | undefined): Prisma.Decimal | null | undefined {
  if (n === undefined) return undefined;
  return n === null ? null : new Prisma.Decimal(Math.round(n * 100) / 100);
}

/** Maps errors to messages that are safe to show; everything else is logged and generic. */
function friendlyError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return "Du måste vara inloggad.";
    if (/hittades inte|Vänta tills|papperskorgen|Ogiltig/.test(error.message)) return error.message;
  }
  console.error("[receipts] action failed", error);
  return "Något gick fel. Försök igen.";
}

async function ownedReceipt(userId: string, id: string) {
  const receipt = await prisma.receipt.findFirst({ where: { id, userId }, select: { id: true, purchaseDate: true, createdAt: true, updatedAt: true, deletedAt: true, status: true } });
  if (!receipt) throw new Error("Kvittot hittades inte.");
  return receipt;
}

function isBeingProcessed(receipt: { status: string; updatedAt: Date }): boolean {
  return receipt.status === "PROCESSING" && Date.now() - receipt.updatedAt.getTime() < PROCESSING_STALE_MS;
}

/** Updates receipt fields and (optionally) replaces the item list. */
export async function updateReceiptAction(id: string, input: ReceiptUpdateInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const existing = await ownedReceipt(user.id, id);
    if (isBeingProcessed(existing)) return { ok: false, error: "Vänta tills tolkningen är klar innan du redigerar." };
    const parsed = receiptUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
    const d = parsed.data;
    const current = await prisma.receipt.findUniqueOrThrow({ where: { id }, select: { purchaseDate: true, warrantyMonths: true, returnDeadline: true } });
    const purchaseDate = d.purchaseDate === undefined ? current.purchaseDate : d.purchaseDate;
    const warrantyMonths =
      d.warrantyMonths === undefined ? current.warrantyMonths : d.warrantyMonths && d.warrantyMonths > 0 ? Math.round(d.warrantyMonths) : null;
    const dateChanged = d.purchaseDate !== undefined;

    await prisma.$transaction(async (tx) => {
      await tx.receipt.update({
        where: { id },
        data: {
          title: d.title ?? undefined,
          merchantName: d.merchantName,
          merchantOrgNumber: d.merchantOrgNumber,
          merchantAddress: d.merchantAddress,
          purchaseDate: d.purchaseDate,
          totalAmount: decimal(d.totalAmount),
          vatAmount: decimal(d.vatAmount),
          currency: d.currency,
          category: d.category,
          paymentMethod: d.paymentMethod,
          receiptNumber: d.receiptNumber,
          notes: d.notes,
          tags: d.tags,
          warrantyMonths,
          warrantyExpiresAt: d.warrantyMonths !== undefined || dateChanged ? warrantyExpiry(purchaseDate, warrantyMonths) : undefined,
          warrantyNotes: d.warrantyNotes,
          returnDeadline: d.returnDays !== undefined ? returnDeadline(purchaseDate, d.returnDays) : dateChanged ? (current.returnDeadline ? returnDeadline(purchaseDate, d.returnDays ?? null) : null) : undefined,
          retentionUntil: dateChanged ? retentionUntil(purchaseDate) : undefined,
          status: "READY",
          processingError: null,
        },
      });
      if (d.items) {
        await tx.receiptItem.deleteMany({ where: { receiptId: id } });
        if (d.items.length) {
          await tx.receiptItem.createMany({
            data: d.items.map((item, position) => ({
              receiptId: id,
              position,
              name: item.name,
              quantity: new Prisma.Decimal(item.quantity && item.quantity > 0 ? item.quantity : 1),
              unitPrice: decimal(item.unitPrice) ?? null,
              totalPrice: decimal(item.totalPrice) ?? null,
              articleNumber: item.articleNumber ?? null,
              brand: item.brand ?? null,
              model: item.model ?? null,
              serialNumber: item.serialNumber ?? null,
              warrantyMonths: item.warrantyMonths && item.warrantyMonths > 0 ? Math.round(item.warrantyMonths) : null,
            })),
          });
        }
      }
    });

    await audit(user.id, "receipt.updated", { receiptId: id, details: { fields: Object.keys(input) } });
    revalidatePath(`/app/kvitton/${id}`);
    revalidatePath("/app/kvitton");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

/** Creates a receipt without a file (manual entry). Redirects to the new receipt. */
export async function createManualReceiptAction(input: ReceiptUpdateInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const parsed = receiptUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
    const d = parsed.data;
    const warrantyMonths = d.warrantyMonths && d.warrantyMonths > 0 ? Math.round(d.warrantyMonths) : null;
    const purchaseDate = d.purchaseDate ?? null;
    const receipt = await prisma.receipt.create({
      data: {
        userId: user.id,
        source: "MANUAL",
        status: "READY",
        title: d.title ?? d.merchantName ?? "Manuellt kvitto",
        merchantName: d.merchantName ?? null,
        merchantOrgNumber: d.merchantOrgNumber ?? null,
        merchantAddress: d.merchantAddress ?? null,
        purchaseDate,
        totalAmount: decimal(d.totalAmount) ?? null,
        vatAmount: decimal(d.vatAmount) ?? null,
        currency: d.currency ?? "SEK",
        category: d.category ?? null,
        paymentMethod: d.paymentMethod ?? null,
        receiptNumber: d.receiptNumber ?? null,
        notes: d.notes ?? null,
        tags: d.tags ?? [],
        warrantyMonths,
        warrantyExpiresAt: warrantyExpiry(purchaseDate, warrantyMonths),
        warrantyNotes: d.warrantyNotes ?? null,
        returnDeadline: returnDeadline(purchaseDate, d.returnDays ?? null),
        retentionUntil: retentionUntil(purchaseDate),
        items: d.items?.length
          ? {
              create: d.items.map((item, position) => ({
                position,
                name: item.name,
                quantity: new Prisma.Decimal(item.quantity && item.quantity > 0 ? item.quantity : 1),
                unitPrice: decimal(item.unitPrice) ?? null,
                totalPrice: decimal(item.totalPrice) ?? null,
                articleNumber: item.articleNumber ?? null,
                brand: item.brand ?? null,
                model: item.model ?? null,
                serialNumber: item.serialNumber ?? null,
                warrantyMonths: item.warrantyMonths && item.warrantyMonths > 0 ? Math.round(item.warrantyMonths) : null,
              })),
            }
          : undefined,
      },
      select: { id: true },
    });
    await audit(user.id, "receipt.created", { receiptId: receipt.id, details: { source: "MANUAL" } });
    revalidatePath("/app/kvitton");
    revalidatePath("/app");
    return { ok: true, data: { id: receipt.id } };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

export async function deleteReceiptAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    await prisma.receipt.update({ where: { id }, data: { deletedAt: new Date() } });
    await audit(user.id, "receipt.deleted", { receiptId: id });
    revalidatePath(`/app/kvitton/${id}`);
    revalidatePath("/app/kvitton");
    revalidatePath("/app/papperskorg");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

export async function restoreReceiptAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    await prisma.receipt.update({ where: { id }, data: { deletedAt: null } });
    await audit(user.id, "receipt.restored", { receiptId: id });
    revalidatePath(`/app/kvitton/${id}`);
    revalidatePath("/app/kvitton");
    revalidatePath("/app/papperskorg");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

/** Permanently deletes a receipt that is in the trash. */
export async function purgeReceiptAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const receipt = await ownedReceipt(user.id, id);
    if (!receipt.deletedAt) return { ok: false, error: "Flytta kvittot till papperskorgen först." };
    await audit(user.id, "receipt.purged", { receiptId: null, details: { id } });
    await prisma.receipt.delete({ where: { id } });
    revalidatePath("/app/kvitton");
    revalidatePath("/app/papperskorg");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

/** Re-runs AI extraction (e.g. after a failure or when the key was added later). */
export async function reprocessReceiptAction(id: string): Promise<ActionResult<{ status: string }>> {
  try {
    const user = await requireUser();
    const existing = await ownedReceipt(user.id, id);
    if (isBeingProcessed(existing)) return { ok: true, data: { status: "PROCESSING" } };
    const rl = await dbRateLimit(user.id, "receipt.processed", 60, 60 * 60 * 1000);
    if (!rl.ok) return { ok: false, error: "Du har tolkat många kvitton på kort tid. Försök igen om en stund." };
    const { status } = await processReceipt(id);
    revalidatePath(`/app/kvitton/${id}`);
    revalidatePath("/app/kvitton");
    return { ok: true, data: { status } };
  } catch (error) {
    return { ok: false, error: friendlyError(error) };
  }
}

export async function deleteReceiptAndRedirect(id: string): Promise<void> {
  const result = await deleteReceiptAction(id);
  if (!result.ok) throw new Error(result.error);
  redirect("/app/kvitton");
}
