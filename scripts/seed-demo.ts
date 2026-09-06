/**
 * Demo-data seeder (product videos, screenshots, manual testing).
 *
 * Creates the demo user "Anna Andersson" (demo@kvittera.se / Demo1234!) with 8 realistic Swedish
 * receipts – rendered as receipt images / an invoice PDF / an HTML e-receipt with headless Chromium –
 * plus one assistant conversation and audit events.
 *
 * Idempotent: an existing demo user is deleted (cascades to receipts, files, conversations) and
 * recreated. All demo data is deterministic (see scripts/demo/receipts.ts).
 *
 *   DATABASE_URL=... npx tsx scripts/seed-demo.ts        (or: npm run seed:demo)
 *
 * Chromium: uses /opt/pw-browsers/chromium by default; override with PLAYWRIGHT_CHROMIUM_PATH.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { hash } from "bcryptjs";
import { chromium, type Browser, type Page } from "playwright-core";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { prepareFile } from "@/lib/receipts/files";
import type { CreateReceiptOptions, IncomingFile } from "@/lib/receipts/pipeline";
import { retentionUntil, returnDeadline, warrantyExpiry } from "@/lib/receipts/warranty";
import { DEMO_CONVERSATION, DEMO_RECEIPTS, DEMO_USER, renderHtml, renderText, vatTotal, type DemoReceipt } from "./demo/receipts";

const DEFAULT_CHROMIUM = "/opt/pw-browsers/chromium";

type CreateReceiptFn = (options: CreateReceiptOptions) => Promise<{ id: string }>;

// -----------------------------------------------------------------------------
// Rendering
// -----------------------------------------------------------------------------

async function launchBrowser(): Promise<Browser> {
  const configured = process.env.PLAYWRIGHT_CHROMIUM_PATH?.trim() || DEFAULT_CHROMIUM;
  const executablePath = existsSync(configured) ? configured : chromium.executablePath();
  return chromium.launch({ executablePath, args: ["--no-sandbox"] });
}

/** Renders the files for one receipt: PNG (thermal/e-mail), PDF (invoice), plus the raw HTML for e-mails. */
async function renderFiles(page: Page, r: DemoReceipt): Promise<IncomingFile[]> {
  const html = renderHtml(r);
  const base = `${r.purchaseDate}-${r.key}`;
  await page.setContent(html, { waitUntil: "load" });

  if (r.layout === "invoice") {
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: false });
    return [{ data: Buffer.from(pdf), mimeType: "application/pdf", originalName: `faktura-${r.receiptNumber}.pdf` }];
  }

  const png = await page.screenshot({ fullPage: true, type: "png" });
  const files: IncomingFile[] = [{ data: Buffer.from(png), mimeType: "image/png", originalName: `${base}.png` }];
  if (r.layout === "email") {
    files.push({ data: Buffer.from(html, "utf8"), mimeType: "text/html", originalName: `${base}.html` });
  }
  return files;
}

// -----------------------------------------------------------------------------
// Storage
// -----------------------------------------------------------------------------

/** Prefers the real pipeline (normalised files + thumbnails). Falls back to prepareFile() + prisma if the module cannot be loaded. */
async function loadCreateReceipt(): Promise<CreateReceiptFn> {
  try {
    const mod = await import("@/lib/receipts/pipeline");
    return mod.createReceipt;
  } catch (error) {
    console.warn("[seed] Could not load src/lib/receipts/pipeline.ts – storing files directly.", error instanceof Error ? error.message : error);
    return createReceiptDirect;
  }
}

async function createReceiptDirect(options: CreateReceiptOptions): Promise<{ id: string }> {
  const prepared = [];
  for (const f of options.files) prepared.push(await prepareFile(f));
  return prisma.receipt.create({
    data: {
      userId: options.userId,
      source: options.source,
      status: "PROCESSING",
      title: options.email?.subject ?? null,
      emailFrom: options.email?.from ?? null,
      emailSubject: options.email?.subject ?? null,
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
}

function money(value: number): Prisma.Decimal {
  return new Prisma.Decimal(value.toFixed(2));
}

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

/** Fills in the "extracted" fields and line items, marking the receipt READY. */
async function finishReceipt(id: string, r: DemoReceipt): Promise<void> {
  const purchaseDate = utcDate(r.purchaseDate);
  await prisma.receipt.update({
    where: { id },
    data: {
      status: "READY",
      processingError: null,
      createdAt: new Date(r.scannedAt),
      title: r.title,
      merchantName: r.merchant.name,
      merchantOrgNumber: r.merchant.orgNumber,
      merchantAddress: r.merchant.address,
      purchaseDate,
      totalAmount: money(r.totalAmount),
      vatAmount: money(vatTotal(r)),
      currency: "SEK",
      category: r.category,
      paymentMethod: r.paymentMethod,
      receiptNumber: r.receiptNumber,
      ocrText: renderText(r),
      aiSummary: r.aiSummary,
      aiConfidence: r.aiConfidence,
      warrantyMonths: r.warrantyMonths,
      warrantyExpiresAt: warrantyExpiry(purchaseDate, r.warrantyMonths),
      warrantyNotes: r.warrantyNotes,
      returnDeadline: returnDeadline(purchaseDate, r.returnDays),
      retentionUntil: retentionUntil(purchaseDate),
      tags: r.tags,
      emailFrom: r.email?.from ?? null,
      emailSubject: r.email?.subject ?? null,
      items: {
        deleteMany: {},
        create: r.items.map((item, position) => ({
          position,
          name: item.name,
          quantity: new Prisma.Decimal(item.quantity.toFixed(3)),
          unitPrice: money(item.unitPrice),
          totalPrice: money(item.totalPrice),
          articleNumber: item.articleNumber ?? null,
          brand: item.brand ?? null,
          model: item.model ?? null,
          serialNumber: item.serialNumber ?? null,
          warrantyMonths: item.warrantyMonths ?? null,
          category: item.category ?? null,
        })),
      },
    },
  });
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  // 1. Remove any previous demo user (cascades). Audit rows only null out userId, so delete them explicitly.
  const previous = await prisma.user.findMany({
    where: { OR: [{ email: DEMO_USER.email }, { inboundToken: DEMO_USER.inboundToken }] },
    select: { id: true, email: true },
  });
  for (const u of previous) {
    await prisma.auditEvent.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`[seed] Removed existing user ${u.email}`);
  }

  const user = await prisma.user.create({
    data: {
      email: DEMO_USER.email,
      name: DEMO_USER.name,
      passwordHash: await hash(DEMO_USER.password, 12),
      accountType: DEMO_USER.accountType,
      inboundToken: DEMO_USER.inboundToken,
      createdAt: new Date(DEMO_USER.createdAt),
    },
    select: { id: true, email: true },
  });
  console.log(`[seed] Created user ${user.email} (${user.id})`);

  // 2. Render + store receipts.
  const createReceipt = await loadCreateReceipt();
  const receiptIds = new Map<string, string>();
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 1400 }, deviceScaleFactor: 1 });
    for (const r of DEMO_RECEIPTS) {
      const files = await renderFiles(page, r);
      const { id } = await createReceipt({
        userId: user.id,
        source: r.source,
        files,
        email: r.email ? { from: r.email.from, subject: r.email.subject } : null,
      });
      await finishReceipt(id, r);
      receiptIds.set(r.key, id);
      console.log(`[seed] Receipt ${id}  ${r.title}  (${files.map((f) => f.mimeType).join(", ")})`);
    }
  } finally {
    await browser.close();
  }

  // 3. Conversation about the TV receipt.
  const tvReceiptId = receiptIds.get(DEMO_CONVERSATION.receiptKey);
  if (!tvReceiptId) throw new Error(`Receipt "${DEMO_CONVERSATION.receiptKey}" was not created.`);
  const lastMessageAt = DEMO_CONVERSATION.messages[DEMO_CONVERSATION.messages.length - 1].at;
  const conversation = await prisma.conversation.create({
    data: {
      userId: user.id,
      receiptId: tvReceiptId,
      title: DEMO_CONVERSATION.title,
      createdAt: new Date(DEMO_CONVERSATION.createdAt),
      updatedAt: new Date(lastMessageAt),
      messages: {
        create: DEMO_CONVERSATION.messages.map((m) => {
          const content: Prisma.InputJsonValue = m.sources ? [{ type: "text", text: m.text }, { type: "sources", items: m.sources }] : [{ type: "text", text: m.text }];
          return { role: m.role, text: m.text, content, createdAt: new Date(m.at) };
        }),
      },
    },
    select: { id: true },
  });

  // 4. Audit trail (replaces whatever the pipeline logged with deterministic, correctly dated rows).
  await prisma.auditEvent.deleteMany({ where: { userId: user.id } });
  const audits: Prisma.AuditEventCreateManyInput[] = [
    { userId: user.id, action: "auth.register", details: { accountType: DEMO_USER.accountType }, createdAt: new Date(DEMO_USER.createdAt) },
  ];
  for (const r of DEMO_RECEIPTS) {
    const receiptId = receiptIds.get(r.key);
    if (!receiptId) continue;
    const files = await prisma.receiptFile.findMany({ where: { receiptId }, orderBy: { position: "asc" }, select: { kind: true, byteSize: true } });
    const createdAt = new Date(r.scannedAt);
    audits.push({
      userId: user.id,
      receiptId,
      action: "receipt.created",
      details: { source: r.source, files: files.map((f) => ({ kind: f.kind, bytes: f.byteSize })) },
      createdAt,
    });
    audits.push({
      userId: user.id,
      receiptId,
      action: "receipt.processed",
      details: { confidence: r.aiConfidence, items: r.items.length, isReceipt: true },
      createdAt: new Date(createdAt.getTime() + 28_000),
    });
  }
  await prisma.auditEvent.createMany({ data: audits });

  // 5. Summary
  const rows = await prisma.receipt.findMany({
    where: { userId: user.id },
    orderBy: { purchaseDate: "asc" },
    select: { id: true, title: true, status: true, source: true, purchaseDate: true, totalAmount: true, _count: { select: { files: true, items: true } } },
  });
  console.log("\nDemo data ready");
  console.log(`  User:       ${DEMO_USER.email}  (password: ${DEMO_USER.password})`);
  console.log(`  Inbound:    ${DEMO_USER.inboundToken}@…`);
  console.log(`  Chat:       ${conversation.id}  "${DEMO_CONVERSATION.title}"`);
  console.log(`  Receipts (${rows.length}):`);
  for (const row of rows) {
    const date = row.purchaseDate?.toISOString().slice(0, 10) ?? "-";
    console.log(`    ${row.id}  ${date}  ${String(row.totalAmount).padStart(10)} kr  ${row.status}  ${row.source.padEnd(6)}  ${row.title}  [${row._count.files} filer, ${row._count.items} rader]`);
  }
  console.log(`  Audit rows: ${audits.length}`);
}

main()
  .then(() => {
    process.exitCode = 0;
  })
  .catch((error) => {
    console.error("[seed] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
