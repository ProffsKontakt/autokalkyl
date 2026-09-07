import type { Prisma } from "@prisma/client";
import { toNumber } from "@/lib/utils";
import { coverageStatus, legalClaimDeadline } from "@/lib/receipts/warranty";
import { amountToInput, type ReceiptFormItem, type ReceiptFormValues } from "./form-values";
import type { AccountTypeValue, ReceiptDetail, ReceiptDetailFile, ReceiptDetailItem } from "./types";

/**
 * Include used by the detail page. Binary columns (`data`, `thumbnail`) are
 * deliberately never selected – files are streamed via /api/files/[id].
 */
export const receiptDetailInclude = {
  items: { orderBy: { position: "asc" as const } },
  files: {
    select: { id: true, kind: true, mimeType: true, originalName: true, width: true, height: true, byteSize: true, position: true },
    orderBy: { position: "asc" as const },
  },
} satisfies Prisma.ReceiptInclude;

export type ReceiptDetailRow = Prisma.ReceiptGetPayload<{ include: typeof receiptDetailInclude }>;

function isoDate(date: Date | null | undefined): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

function iso(date: Date | null | undefined): string | null {
  return date ? date.toISOString() : null;
}

function toItem(item: ReceiptDetailRow["items"][number]): ReceiptDetailItem {
  return {
    id: item.id,
    position: item.position,
    name: item.name,
    quantity: toNumber(item.quantity) ?? 1,
    unitPrice: toNumber(item.unitPrice),
    totalPrice: toNumber(item.totalPrice),
    articleNumber: item.articleNumber,
    brand: item.brand,
    model: item.model,
    serialNumber: item.serialNumber,
    productUrl: item.productUrl,
    manualUrl: item.manualUrl,
    warrantyMonths: item.warrantyMonths,
    category: item.category,
  };
}

function toFile(file: ReceiptDetailRow["files"][number]): ReceiptDetailFile {
  return {
    id: file.id,
    kind: file.kind,
    mimeType: file.mimeType,
    originalName: file.originalName,
    width: file.width,
    height: file.height,
    byteSize: file.byteSize,
    position: file.position,
  };
}

/** Converts a Prisma row (Decimals, Dates) into the JSON-safe detail shape. */
export function toReceiptDetail(row: ReceiptDetailRow, accountType: AccountTypeValue): ReceiptDetail {
  const coverage = coverageStatus(row.purchaseDate, row.warrantyExpiresAt, accountType);
  return {
    id: row.id,
    status: row.status,
    source: row.source,
    accountType,
    title: row.title ?? row.merchantName ?? "Kvitto",
    merchantName: row.merchantName,
    merchantOrgNumber: row.merchantOrgNumber,
    merchantAddress: row.merchantAddress,
    purchaseDate: isoDate(row.purchaseDate),
    totalAmount: toNumber(row.totalAmount),
    vatAmount: toNumber(row.vatAmount),
    currency: row.currency,
    category: row.category,
    paymentMethod: row.paymentMethod,
    receiptNumber: row.receiptNumber,
    notes: row.notes,
    tags: row.tags,
    ocrText: row.ocrText,
    aiSummary: row.aiSummary,
    aiConfidence: row.aiConfidence,
    processingError: row.processingError,
    warrantyMonths: row.warrantyMonths,
    warrantyExpiresAt: isoDate(row.warrantyExpiresAt),
    warrantyNotes: row.warrantyNotes,
    returnDeadline: isoDate(row.returnDeadline),
    legalClaimDeadline: isoDate(legalClaimDeadline(row.purchaseDate, accountType)),
    coverage: {
      status: coverage.status,
      until: isoDate(coverage.until),
      kind: coverage.kind,
      daysLeft: coverage.daysLeft,
    },
    emailFrom: row.emailFrom,
    emailSubject: row.emailSubject,
    retentionUntil: isoDate(row.retentionUntil),
    deletedAt: iso(row.deletedAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map(toItem),
    files: row.files.map(toFile),
  };
}

/** Days between purchase date and return deadline (the form edits "days", the DB stores a date). */
function returnDaysFrom(purchaseDate: string | null, returnDeadline: string | null): string {
  if (!purchaseDate || !returnDeadline) return "";
  const diff = Math.round((Date.parse(returnDeadline) - Date.parse(purchaseDate)) / 86_400_000);
  return diff > 0 ? String(diff) : "";
}

/** Initial values for `ReceiptForm` in edit mode. */
export function toFormValues(detail: ReceiptDetail): ReceiptFormValues {
  const items: ReceiptFormItem[] = detail.items.map((item) => ({
    key: item.id,
    name: item.name,
    quantity: amountToInput(item.quantity, 3),
    unitPrice: amountToInput(item.unitPrice),
    totalPrice: amountToInput(item.totalPrice),
    articleNumber: item.articleNumber ?? "",
    brand: item.brand ?? "",
    model: item.model ?? "",
    serialNumber: item.serialNumber ?? "",
    warrantyMonths: item.warrantyMonths ? String(item.warrantyMonths) : "",
  }));
  return {
    title: detail.title,
    merchantName: detail.merchantName ?? "",
    merchantOrgNumber: detail.merchantOrgNumber ?? "",
    merchantAddress: detail.merchantAddress ?? "",
    purchaseDate: detail.purchaseDate ?? "",
    totalAmount: amountToInput(detail.totalAmount),
    vatAmount: amountToInput(detail.vatAmount),
    currency: detail.currency,
    category: detail.category ?? "",
    paymentMethod: detail.paymentMethod ?? "",
    receiptNumber: detail.receiptNumber ?? "",
    notes: detail.notes ?? "",
    tags: detail.tags.join(", "),
    warrantyMonths: detail.warrantyMonths ? String(detail.warrantyMonths) : "",
    warrantyNotes: detail.warrantyNotes ?? "",
    returnDays: returnDaysFrom(detail.purchaseDate, detail.returnDeadline),
    items,
  };
}
