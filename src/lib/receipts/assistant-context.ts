import { prisma } from "@/lib/db/client";
import { formatDate, formatMoney, toNumber } from "@/lib/utils";
import { legalClaimDeadline } from "./warranty";

/** Compact receipt summaries for the assistant's search tool. */
export async function searchReceiptsForAssistant(
  userId: string,
  opts: { query: string; fromDate?: string; toDate?: string; limit?: number },
) {
  const q = opts.query.trim();
  const limit = Math.min(Math.max(opts.limit ?? 8, 1), 20);
  const terms = q.split(/\s+/).filter(Boolean).slice(0, 5);

  const receipts = await prisma.receipt.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(opts.fromDate ? { purchaseDate: { gte: new Date(opts.fromDate) } } : {}),
      ...(opts.toDate ? { purchaseDate: { lte: new Date(opts.toDate) } } : {}),
      ...(terms.length
        ? {
            AND: terms.map((term) => ({
              OR: [
                { title: { contains: term, mode: "insensitive" as const } },
                { merchantName: { contains: term, mode: "insensitive" as const } },
                { category: { contains: term, mode: "insensitive" as const } },
                { ocrText: { contains: term, mode: "insensitive" as const } },
                { aiSummary: { contains: term, mode: "insensitive" as const } },
                { notes: { contains: term, mode: "insensitive" as const } },
                { tags: { has: term } },
                {
                  items: {
                    some: {
                      OR: [
                        { name: { contains: term, mode: "insensitive" as const } },
                        { brand: { contains: term, mode: "insensitive" as const } },
                        { model: { contains: term, mode: "insensitive" as const } },
                        { articleNumber: { contains: term, mode: "insensitive" as const } },
                      ],
                    },
                  },
                },
              ],
            })),
          }
        : {}),
    },
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: { items: { orderBy: { position: "asc" }, take: 12 } },
  });

  return receipts.map((r) => ({
    receipt_id: r.id,
    title: r.title,
    merchant: r.merchantName,
    purchase_date: r.purchaseDate ? r.purchaseDate.toISOString().slice(0, 10) : null,
    total: toNumber(r.totalAmount),
    currency: r.currency,
    category: r.category,
    warranty_months: r.warrantyMonths,
    items: r.items.map((i) => ({
      name: i.name,
      brand: i.brand,
      model: i.model,
      article_number: i.articleNumber,
    })),
  }));
}

/** Full receipt details as readable text for the assistant (and for the "current receipt" context). */
export async function getReceiptForAssistant(userId: string, receiptId: string): Promise<string | null> {
  if (!receiptId) return null;
  const r = await prisma.receipt.findFirst({
    where: { id: receiptId, userId, deletedAt: null },
    include: { items: { orderBy: { position: "asc" } }, files: { select: { kind: true, mimeType: true, originalName: true } } },
  });
  if (!r) return null;

  const lines: string[] = [];
  lines.push(`Kvitto-id: ${r.id}`);
  lines.push(`Titel: ${r.title ?? "–"}`);
  lines.push(`Butik/leverantör: ${r.merchantName ?? "–"}${r.merchantOrgNumber ? ` (org.nr ${r.merchantOrgNumber})` : ""}`);
  if (r.merchantAddress) lines.push(`Adress: ${r.merchantAddress}`);
  lines.push(`Köpdatum: ${r.purchaseDate ? r.purchaseDate.toISOString().slice(0, 10) : "okänt"}`);
  lines.push(`Totalt: ${formatMoney(toNumber(r.totalAmount), r.currency)}${r.vatAmount ? ` (varav moms ${formatMoney(toNumber(r.vatAmount), r.currency)})` : ""}`);
  if (r.paymentMethod) lines.push(`Betalsätt: ${r.paymentMethod}`);
  if (r.receiptNumber) lines.push(`Kvitto-/ordernummer: ${r.receiptNumber}`);
  lines.push(`Kategori: ${r.category ?? "–"}`);
  lines.push(`Källa: ${r.source}${r.emailFrom ? ` (mail från ${r.emailFrom})` : ""}`);
  if (r.warrantyMonths) lines.push(`Garanti enligt kvittot: ${r.warrantyMonths} månader${r.warrantyExpiresAt ? `, till ${formatDate(r.warrantyExpiresAt)}` : ""}`);
  if (r.warrantyNotes) lines.push(`Garanti-/villkorstext på kvittot: ${r.warrantyNotes}`);
  if (r.returnDeadline) lines.push(`Öppet köp/bytesrätt till: ${formatDate(r.returnDeadline)}`);
  const claim = legalClaimDeadline(r.purchaseDate);
  if (claim) lines.push(`Lagstadgad reklamationsrätt (3 år, privatperson): till ${formatDate(claim)}`);
  if (r.notes) lines.push(`Användarens anteckningar: ${r.notes}`);
  if (r.tags.length) lines.push(`Taggar: ${r.tags.join(", ")}`);

  if (r.items.length) {
    lines.push("");
    lines.push("Produkter/rader:");
    for (const i of r.items) {
      const parts = [
        `- ${i.name}`,
        i.quantity && toNumber(i.quantity) !== 1 ? `${toNumber(i.quantity)} st` : null,
        i.totalPrice != null ? formatMoney(toNumber(i.totalPrice), r.currency) : null,
        i.brand ? `varumärke: ${i.brand}` : null,
        i.model ? `modell: ${i.model}` : null,
        i.articleNumber ? `artikelnr: ${i.articleNumber}` : null,
        i.serialNumber ? `serienr: ${i.serialNumber}` : null,
        i.warrantyMonths ? `garanti: ${i.warrantyMonths} mån` : null,
        i.productUrl ? `produktsida: ${i.productUrl}` : null,
        i.manualUrl ? `bruksanvisning: ${i.manualUrl}` : null,
      ].filter(Boolean);
      lines.push(parts.join(" | "));
    }
  }
  if (r.aiSummary) {
    lines.push("");
    lines.push(`Sammanfattning: ${r.aiSummary}`);
  }
  if (r.ocrText) {
    lines.push("");
    lines.push("Fullständig kvittotext:");
    lines.push(r.ocrText.slice(0, 6000));
  }
  lines.push("");
  lines.push(`Bilagor: ${r.files.map((f) => `${f.kind}${f.originalName ? ` (${f.originalName})` : ""}`).join(", ") || "inga"}`);
  return lines.join("\n");
}
