/**
 * Demo/test account seeder (the shared "Anna Andersson" account, product videos, screenshots, e2e).
 *
 * Creates the demo user (default demo@kvittera.se / Demo1234!, override with DEMO_ACCOUNT_EMAIL /
 * DEMO_ACCOUNT_PASSWORD) with 8 realistic Swedish receipts – receipt photos, an invoice PDF and an HTML
 * e-receipt – plus one assistant conversation and audit events.
 *
 * The receipt files are pre-rendered fixtures in scripts/demo/fixtures (committed), so seeding needs no
 * browser and runs during `vercel-build` (scripts/seed-demo-on-deploy.mjs). Regenerate the fixtures
 * after editing scripts/demo/receipts.ts with `npm run demo:render` (headless Chromium).
 *
 * Idempotent: an existing demo user is deleted (cascades to receipts, files, conversations) and
 * recreated with the same fixed id, so open sessions on the demo account survive a redeploy.
 *
 *   DATABASE_URL=... npx tsx scripts/seed-demo.ts             (or: npm run seed:demo)
 *   npx tsx scripts/seed-demo.ts --render                     (or: npm run demo:render)
 *
 * Chromium (render only): /opt/pw-browsers/chromium by default; override with PLAYWRIGHT_CHROMIUM_PATH.
 */
import "dotenv/config";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { DEMO_USER_ID, demoAccountEmail, demoAccountPassword } from "@/lib/auth/demo";
import { prepareFile } from "@/lib/receipts/files";
import type { CreateReceiptOptions, IncomingFile } from "@/lib/receipts/pipeline";
import { retentionUntil, returnDeadline, warrantyExpiry } from "@/lib/receipts/warranty";
import { DEMO_CONVERSATION, DEMO_RECEIPTS, DEMO_USER, renderHtml, renderText, vatTotal, type DemoReceipt } from "./demo/receipts";

const DEFAULT_CHROMIUM = "/opt/pw-browsers/chromium";
const FIXTURE_DIR = path.resolve("scripts/demo/fixtures");

type CreateReceiptFn = (options: CreateReceiptOptions) => Promise<{ id: string }>;

// -----------------------------------------------------------------------------
// Fixtures (pre-rendered receipt files)
// -----------------------------------------------------------------------------

interface FixtureFile {
  /** File name inside scripts/demo/fixtures. */
  name: string;
  mimeType: string;
  /** Name the "user" uploaded/received the file under. */
  originalName: string;
}

/** PNG for thermal receipts, PDF for the invoice, PNG + the raw HTML for the e-receipt. */
function fixtureFiles(r: DemoReceipt): FixtureFile[] {
  const base = `${r.purchaseDate}-${r.key}`;
  if (r.layout === "invoice") {
    return [{ name: `${r.key}.pdf`, mimeType: "application/pdf", originalName: `faktura-${r.receiptNumber}.pdf` }];
  }
  const files: FixtureFile[] = [{ name: `${r.key}.png`, mimeType: "image/png", originalName: `${base}.png` }];
  if (r.layout === "email") files.push({ name: `${r.key}.html`, mimeType: "text/html", originalName: `${base}.html` });
  return files;
}

async function loadFixtures(r: DemoReceipt): Promise<IncomingFile[]> {
  const files: IncomingFile[] = [];
  for (const f of fixtureFiles(r)) {
    let data: Buffer;
    try {
      data = await readFile(path.join(FIXTURE_DIR, f.name));
    } catch {
      throw new Error(`Missing demo fixture ${f.name}. Run "npm run demo:render" (needs Chromium) and commit scripts/demo/fixtures.`);
    }
    files.push({ data, mimeType: f.mimeType, originalName: f.originalName });
  }
  return files;
}

/** Renders every receipt with headless Chromium and writes the fixtures. Only needed after editing the demo data. */
async function renderFixtures(): Promise<void> {
  const { chromium } = await import("playwright-core");
  const configured = process.env.PLAYWRIGHT_CHROMIUM_PATH?.trim() || DEFAULT_CHROMIUM;
  const executablePath = existsSync(configured) ? configured : chromium.executablePath();
  const browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage({ viewport: { width: 800, height: 1400 }, deviceScaleFactor: 1 });
    await mkdir(FIXTURE_DIR, { recursive: true });
    for (const r of DEMO_RECEIPTS) {
      const html = renderHtml(r);
      await page.setContent(html, { waitUntil: "load" });
      for (const f of fixtureFiles(r)) {
        let data: Buffer;
        if (f.mimeType === "application/pdf") {
          data = Buffer.from(await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: false }));
        } else if (f.mimeType === "text/html") {
          data = Buffer.from(html, "utf8");
        } else {
          data = Buffer.from(await page.screenshot({ fullPage: true, type: "png" }));
        }
        await writeFile(path.join(FIXTURE_DIR, f.name), data);
        console.log(`[render] ${f.name}  ${(data.byteLength / 1024).toFixed(0)} kB`);
      }
    }
  } finally {
    await browser.close();
  }
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
  if (process.argv.includes("--render")) {
    await renderFixtures();
    return;
  }
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");

  const email = demoAccountEmail();
  const password = demoAccountPassword();

  // 1. Remove any previous demo user (cascades). Audit rows only null out userId, so delete them explicitly.
  const previous = await prisma.user.findMany({
    where: { OR: [{ id: DEMO_USER_ID }, { email }, { inboundToken: DEMO_USER.inboundToken }] },
    select: { id: true, email: true },
  });
  for (const u of previous) {
    await prisma.auditEvent.deleteMany({ where: { userId: u.id } });
    await prisma.user.delete({ where: { id: u.id } });
    console.log(`[seed] Removed existing user ${u.email}`);
  }

  const user = await prisma.user.create({
    data: {
      id: DEMO_USER_ID,
      email,
      emailVerified: new Date(DEMO_USER.createdAt),
      name: DEMO_USER.name,
      passwordHash: await hash(password, 12),
      accountType: DEMO_USER.accountType,
      inboundToken: DEMO_USER.inboundToken,
      createdAt: new Date(DEMO_USER.createdAt),
    },
    select: { id: true, email: true },
  });
  console.log(`[seed] Created user ${user.email} (${user.id})`);

  // 2. Store the pre-rendered receipts through the normal pipeline (normalised images + thumbnails).
  const createReceipt = await loadCreateReceipt();
  const receiptIds = new Map<string, string>();
  for (const r of DEMO_RECEIPTS) {
    const files = await loadFixtures(r);
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
  console.log(`  User:       ${email}  (password: ${password})`);
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
    if (process.env.DATABASE_URL) await prisma.$disconnect();
  });
