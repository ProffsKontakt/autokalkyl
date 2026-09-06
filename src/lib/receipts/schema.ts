import { z } from "zod";
import { RECEIPT_CATEGORIES } from "@/lib/ai/knowledge";

/**
 * Validation schema for receipt create/update input.
 *
 * Lives outside src/actions because a "use server" module may only export async functions;
 * consumers import `ReceiptUpdateInput` from here (a 'use server' module may only export async functions).
 *
 * Field semantics: `undefined` = leave unchanged, `null`/"" = clear.
 */
const optionalText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null(), z.undefined()])
    .transform((v) => (v === undefined ? undefined : v && v.length ? v : null));

const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return undefined;
    if (v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(String(v).replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : null;
  });

const optionalDate = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === undefined) return undefined;
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });

export const receiptItemInputSchema = z.object({
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
  currency: z.string().trim().toUpperCase().length(3).optional(),
  category: z.enum(RECEIPT_CATEGORIES).nullable().optional(),
  paymentMethod: optionalText(60),
  receiptNumber: optionalText(100),
  notes: optionalText(4000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  warrantyMonths: optionalNumber,
  warrantyNotes: optionalText(2000),
  returnDays: optionalNumber,
  items: z.array(receiptItemInputSchema).max(200).optional(),
});

export type ReceiptUpdateInput = z.input<typeof receiptUpdateSchema>;
