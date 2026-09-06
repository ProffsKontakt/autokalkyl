import { prisma } from "@/lib/db/client";
import { toNumber } from "@/lib/utils";

/** Excel-safe CSV cell: quotes when needed and neutralises formula injection (=, +, -, @, tab, CR). */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[";\n\r']/.test(s) || s.startsWith("'")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Exports all (non-deleted) receipts as a semicolon-separated CSV (Excel-friendly in Swedish locale, UTF-8 BOM).
 */
export async function exportReceiptsCsv(userId: string): Promise<string> {
  const receipts = await prisma.receipt.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
    include: { items: { orderBy: { position: "asc" } } },
  });
  const header = [
    "Kvitto-id",
    "Titel",
    "Butik",
    "Org.nr",
    "Köpdatum",
    "Belopp",
    "Moms",
    "Valuta",
    "Kategori",
    "Betalsätt",
    "Kvittonummer",
    "Garanti (mån)",
    "Garanti till",
    "Öppet köp till",
    "Källa",
    "Produkter",
    "Anteckningar",
    "Registrerad",
  ];
  const lines = [header.join(";")];
  for (const r of receipts) {
    const products = r.items
      .map((i) => [i.name, i.brand, i.model, i.articleNumber ? `art.nr ${i.articleNumber}` : null].filter(Boolean).join(" "))
      .join(" | ");
    lines.push(
      [
        r.id,
        r.title,
        r.merchantName,
        r.merchantOrgNumber,
        r.purchaseDate,
        toNumber(r.totalAmount)?.toFixed(2).replace(".", ","),
        toNumber(r.vatAmount)?.toFixed(2).replace(".", ","),
        r.currency,
        r.category,
        r.paymentMethod,
        r.receiptNumber,
        r.warrantyMonths,
        r.warrantyExpiresAt,
        r.returnDeadline,
        r.source,
        products,
        r.notes,
        r.createdAt.toISOString(),
      ]
        .map(csvCell)
        .join(";"),
    );
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}
