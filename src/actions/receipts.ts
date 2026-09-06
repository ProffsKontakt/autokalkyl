"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { audit } from "@/lib/audit";
import { processReceipt } from "@/lib/receipts/pipeline";
import { retentionUntil, returnDeadline, warrantyExpiry } from "@/lib/receipts/warranty";
import { RECEIPT_CATEGORIES } from "@/lib/ai/knowledge";
import type { ActionResult } from "./auth";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((s) => (s.length ? s : null))
    .nullable()
    .optional();

const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  });

const optionalDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

const itemInput = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1).max(300),
  quantity: optionalNumber,
  unitPrice: optionalNumber,
  totalPrice: optionalNumber,
  articleNumber: optionalText(100),
  brand: optionalText(100),
  model: optionalText(150),
  serialNumber: optionalText(100),
  warrantyMonths: optionalNumber,
});

export const receiptUpdateSchema = z.object({
  title: optionalText(140),
  merchantName: optionalText(150),
  merchantOrgNumber: optionalText(30),
  merchantAddress: optionalText(300),
  purchaseDate: optionalDate,
  totalAmount: optionalNumber,
  vatAmount: optionalNumber,
  currency: z.string().trim().toUpperCase().length(3).default("SEK"),
  category: z.enum(RECEIPT_CATEGORIES).nullable().optional(),
  paymentMethod: optionalText(60),
  receiptNumber: optionalText(100),
  notes: optionalText(4000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  warrantyMonths: optionalNumber,
  warrantyNotes: optionalText(2000),
  returnDays: optionalNumber,
  items: z.array(itemInput).max(200).optional(),
});

export type ReceiptUpdateInput = z.input<typeof receiptUpdateSchema>;

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user;
}

function decimal(n: number | null): Prisma.Decimal | null {
  return n === null ? null : new Prisma.Decimal(Math.round(n * 100) / 100);
}

async function ownedReceipt(userId: string, id: string) {
  const receipt = await prisma.receipt.findFirst({ where: { id, userId }, select: { id: true, purchaseDate: true, createdAt: true, deletedAt: true, status: true } });
  if (!receipt) throw new Error("Kvittot hittades inte.");
  return receipt;
}

/** Updates receipt fields and (optionally) replaces the item list. */
export async function updateReceiptAction(id: string, input: ReceiptUpdateInput): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    const parsed = receiptUpdateSchema.safeParse(input);
    if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
    const d = parsed.data;
    const warrantyMonths = d.warrantyMonths && d.warrantyMonths > 0 ? Math.round(d.warrantyMonths) : null;

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
          category: d.category ?? null,
          paymentMethod: d.paymentMethod,
          receiptNumber: d.receiptNumber,
          notes: d.notes,
          tags: d.tags,
          warrantyMonths,
          warrantyExpiresAt: warrantyExpiry(d.purchaseDate, warrantyMonths),
          warrantyNotes: d.warrantyNotes,
          returnDeadline: returnDeadline(d.purchaseDate, d.returnDays),
          retentionUntil: retentionUntil(d.purchaseDate),
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
              unitPrice: decimal(item.unitPrice),
              totalPrice: decimal(item.totalPrice),
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
    return { ok: false, error: error instanceof Error ? error.message : "Något gick fel." };
  }
}

/** Creates a receipt without a file (manual entry). Redirects to the new receipt. */
export async function createManualReceiptAction(input: ReceiptUpdateInput): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser();
  const parsed = receiptUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Ogiltiga uppgifter." };
  const d = parsed.data;
  const warrantyMonths = d.warrantyMonths && d.warrantyMonths > 0 ? Math.round(d.warrantyMonths) : null;
  const receipt = await prisma.receipt.create({
    data: {
      userId: user.id,
      source: "MANUAL",
      status: "READY",
      title: d.title ?? d.merchantName ?? "Manuellt kvitto",
      merchantName: d.merchantName,
      purchaseDate: d.purchaseDate,
      totalAmount: decimal(d.totalAmount),
      vatAmount: decimal(d.vatAmount),
      currency: d.currency,
      category: d.category ?? null,
      paymentMethod: d.paymentMethod,
      receiptNumber: d.receiptNumber,
      notes: d.notes,
      tags: d.tags ?? [],
      warrantyMonths,
      warrantyExpiresAt: warrantyExpiry(d.purchaseDate, warrantyMonths),
      warrantyNotes: d.warrantyNotes,
      returnDeadline: returnDeadline(d.purchaseDate, d.returnDays),
      retentionUntil: retentionUntil(d.purchaseDate),
      items: d.items?.length
        ? {
            create: d.items.map((item, position) => ({
              position,
              name: item.name,
              quantity: new Prisma.Decimal(item.quantity && item.quantity > 0 ? item.quantity : 1),
              unitPrice: decimal(item.unitPrice),
              totalPrice: decimal(item.totalPrice),
              articleNumber: item.articleNumber ?? null,
              brand: item.brand ?? null,
              model: item.model ?? null,
              serialNumber: item.serialNumber ?? null,
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
}

export async function deleteReceiptAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    await prisma.receipt.update({ where: { id }, data: { deletedAt: new Date() } });
    await audit(user.id, "receipt.deleted", { receiptId: id });
    revalidatePath("/app/kvitton");
    revalidatePath("/app");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Något gick fel." };
  }
}

export async function restoreReceiptAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    await prisma.receipt.update({ where: { id }, data: { deletedAt: null } });
    await audit(user.id, "receipt.restored", { receiptId: id });
    revalidatePath("/app/kvitton");
    revalidatePath(`/app/kvitton/${id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Något gick fel." };
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
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Något gick fel." };
  }
}

/** Re-runs AI extraction (e.g. after a failure or when the key was added later). */
export async function reprocessReceiptAction(id: string): Promise<ActionResult<{ status: string }>> {
  try {
    const user = await requireUser();
    await ownedReceipt(user.id, id);
    const { status } = await processReceipt(id);
    revalidatePath(`/app/kvitton/${id}`);
    revalidatePath("/app/kvitton");
    return { ok: true, data: { status } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Något gick fel." };
  }
}

export async function deleteReceiptAndRedirect(id: string): Promise<void> {
  const result = await deleteReceiptAction(id);
  if (!result.ok) throw new Error(result.error);
  redirect("/app/kvitton");
}
