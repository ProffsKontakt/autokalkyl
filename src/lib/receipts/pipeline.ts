import { Prisma, type ReceiptSource } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/audit";
import { AiNotConfiguredError, AiRefusalError, describeAiError, isAiConfigured } from "@/lib/ai/client";
import { extractReceipt, type ExtractionInput } from "@/lib/ai/extract";
import { htmlToText, prepareFile, MAX_FILES_PER_RECEIPT } from "./files";
import { retentionUntil, returnDeadline, warrantyExpiry } from "./warranty";

export interface IncomingFile {
  data: Buffer;
  mimeType: string;
  originalName?: string | null;
}

export interface CreateReceiptOptions {
  userId: string;
  source: ReceiptSource;
  files: IncomingFile[];
  email?: { from: string; subject?: string | null } | null;
  /** Free text (e.g. plain-text email body) that should also be considered by the extraction. */
  extraText?: string | null;
}

/**
 * Stores the receipt and its files (status PROCESSING). Extraction runs separately via processReceipt().
 */
export async function createReceipt(options: CreateReceiptOptions): Promise<{ id: string }> {
  const { userId, source, files } = options;
  if (!files.length) throw new Error("Minst en fil krävs.");
  if (files.length > MAX_FILES_PER_RECEIPT) throw new Error(`Max ${MAX_FILES_PER_RECEIPT} filer per kvitto.`);

  const prepared = [];
  for (const f of files) {
    prepared.push(await prepareFile(f));
  }

  const receipt = await prisma.receipt.create({
    data: {
      userId,
      source,
      status: "PROCESSING",
      title: options.email?.subject?.slice(0, 120) || null,
      emailFrom: options.email?.from ?? null,
      emailSubject: options.email?.subject ?? null,
      notes: null,
      retentionUntil: retentionUntil(null),
      files: {
        create: prepared.map((p, position) => ({
          kind: p.kind,
          mimeType: p.mimeType,
          byteSize: p.byteSize,
          sha256: p.sha256,
          data: new Uint8Array(p.data),
          thumbnail: p.thumbnail ? new Uint8Array(p.thumbnail) : null,
          width: p.width,
          height: p.height,
          originalName: p.originalName,
          position,
        })),
      },
    },
    select: { id: true },
  });

  if (options.extraText) {
    await prisma.receipt.update({
      where: { id: receipt.id },
      data: { ocrText: options.extraText.slice(0, 20000) },
    });
  }

  await audit(userId, "receipt.created", {
    receiptId: receipt.id,
    details: { source, files: prepared.map((p) => ({ kind: p.kind, bytes: p.byteSize })) },
  });
  return receipt;
}

/**
 * Runs AI extraction for a receipt and stores the result. Safe to re-run (idempotent overwrite of AI fields).
 * Never throws for AI failures – the receipt ends up NEEDS_REVIEW / FAILED with processingError set.
 */
export async function processReceipt(receiptId: string): Promise<{ status: string }> {
  const receipt = await prisma.receipt.findUnique({
    where: { id: receiptId },
    include: { files: { orderBy: { position: "asc" } } },
  });
  if (!receipt) return { status: "MISSING" };

  if (!isAiConfigured()) {
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status: "NEEDS_REVIEW",
        processingError: "AI-tolkning är inte aktiverad (ANTHROPIC_API_KEY saknas). Fyll i uppgifterna manuellt.",
        title: receipt.title ?? fallbackTitle(receipt.source, receipt.createdAt),
      },
    });
    return { status: "NEEDS_REVIEW" };
  }

  await prisma.receipt.update({ where: { id: receiptId }, data: { status: "PROCESSING", processingError: null } });

  const inputs: ExtractionInput[] = [];
  for (const f of receipt.files) {
    if (f.kind === "IMAGE") {
      inputs.push({ kind: "image", data: Buffer.from(f.data), mimeType: "image/jpeg" });
    } else if (f.kind === "PDF") {
      inputs.push({ kind: "pdf", data: Buffer.from(f.data) });
    } else if (f.kind === "EMAIL_HTML") {
      inputs.push({ kind: "text", text: htmlToText(Buffer.from(f.data).toString("utf8")).slice(0, 30000), label: "E-post (HTML)" });
    } else if (f.kind === "EMAIL_TEXT") {
      inputs.push({ kind: "text", text: Buffer.from(f.data).toString("utf8").slice(0, 30000), label: "E-post (text)" });
    }
  }
  if (receipt.emailSubject || receipt.emailFrom) {
    inputs.unshift({
      kind: "text",
      text: `Ämne: ${receipt.emailSubject ?? ""}\nFrån: ${receipt.emailFrom ?? ""}`,
      label: "E-postmeta",
    });
  }

  try {
    const result = await extractReceipt(inputs);
    const purchaseDate = result.purchase_date ? new Date(result.purchase_date) : null;
    const warrantyMonths = result.warranty_months && result.warranty_months > 0 ? Math.round(result.warranty_months) : null;

    await prisma.$transaction([
      prisma.receiptItem.deleteMany({ where: { receiptId } }),
      prisma.receipt.update({
        where: { id: receiptId },
        data: {
          status: result.is_receipt && result.confidence >= 0.5 ? "READY" : "NEEDS_REVIEW",
          processingError: result.is_receipt ? null : "Dokumentet ser inte ut som ett kvitto. Kontrollera uppgifterna.",
          title: result.title?.slice(0, 140) || receipt.title || fallbackTitle(receipt.source, receipt.createdAt),
          merchantName: result.merchant_name,
          merchantOrgNumber: result.merchant_org_number,
          merchantAddress: result.merchant_address,
          purchaseDate,
          totalAmount: toDecimal(result.total_amount),
          vatAmount: toDecimal(result.vat_amount),
          currency: result.currency || "SEK",
          category: result.category,
          paymentMethod: result.payment_method,
          receiptNumber: result.receipt_number,
          ocrText: result.ocr_text?.slice(0, 40000) || receipt.ocrText,
          aiSummary: result.summary,
          aiConfidence: result.confidence,
          warrantyMonths,
          warrantyExpiresAt: warrantyExpiry(purchaseDate, warrantyMonths),
          warrantyNotes: result.warranty_notes,
          returnDeadline: returnDeadline(purchaseDate, result.return_days),
          retentionUntil: retentionUntil(purchaseDate, receipt.createdAt),
          items: {
            create: result.items.slice(0, 200).map((item, position) => ({
              position,
              name: item.name.slice(0, 300),
              quantity: new Prisma.Decimal(item.quantity),
              unitPrice: toDecimal(item.unit_price),
              totalPrice: toDecimal(item.total_price),
              articleNumber: item.article_number?.slice(0, 100) ?? null,
              brand: item.brand?.slice(0, 100) ?? null,
              model: item.model?.slice(0, 150) ?? null,
              serialNumber: item.serial_number?.slice(0, 100) ?? null,
              warrantyMonths: item.warranty_months && item.warranty_months > 0 ? Math.round(item.warranty_months) : null,
              category: item.category,
            })),
          },
        },
      }),
    ]);

    await audit(receipt.userId, "receipt.processed", {
      receiptId,
      details: { confidence: result.confidence, items: result.items.length, isReceipt: result.is_receipt },
    });
    return { status: result.is_receipt ? "READY" : "NEEDS_REVIEW" };
  } catch (error) {
    const message = describeAiError(error);
    const status = error instanceof AiNotConfiguredError || error instanceof AiRefusalError ? "NEEDS_REVIEW" : "NEEDS_REVIEW";
    console.error("[receipt] processing failed", receiptId, error);
    await prisma.receipt.update({
      where: { id: receiptId },
      data: {
        status,
        processingError: `Automatisk tolkning misslyckades: ${message} Du kan fylla i uppgifterna manuellt eller försöka igen.`,
        title: receipt.title ?? fallbackTitle(receipt.source, receipt.createdAt),
      },
    });
    return { status };
  }
}

function toDecimal(value: number | null | undefined): Prisma.Decimal | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return new Prisma.Decimal(Math.round(value * 100) / 100);
}

function fallbackTitle(source: ReceiptSource, createdAt: Date): string {
  const d = createdAt.toISOString().slice(0, 10);
  return source === "EMAIL" ? `Kvitto via e-post ${d}` : `Kvitto ${d}`;
}

/**
 * Creates and immediately processes a receipt. Used by the inbound-email endpoint and tests.
 */
export async function createAndProcessReceipt(options: CreateReceiptOptions): Promise<{ id: string; status: string }> {
  const { id } = await createReceipt(options);
  const { status } = await processReceipt(id);
  return { id, status };
}
