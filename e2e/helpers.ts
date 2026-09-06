import { expect, type APIRequestContext, type Page } from "@playwright/test";
import sharp from "sharp";

export const TEST_PASSWORD = "Testlosen123!";
export const INBOUND_SECRET = process.env.INBOUND_EMAIL_SECRET || "test-secret";

/** Matches a personal inbound address such as kvitto-ab12cd34ef@in.kvittera.se (also with plus-suffix). */
export const INBOUND_ADDRESS_RE = /kvitto-[a-z0-9]+(?:\+[a-z0-9._-]+)?@[a-z0-9.-]+\.[a-z]{2,}/i;

export interface TestUser {
  name: string;
  email: string;
  password: string;
}

/** Unique e-mail per run so tests never collide with earlier data in the same database. */
export function uniqueEmail(prefix = "test"): string {
  return `${prefix}+${Date.now()}${Math.random().toString(36).slice(2, 6)}@example.com`;
}

/**
 * Registers a private account through the UI and waits for the dashboard.
 * The registration action signs the user in and redirects to /app?welcome=1.
 */
export async function registerUser(page: Page, overrides: Partial<TestUser> = {}): Promise<TestUser> {
  const user: TestUser = { name: "Test Testsson", email: uniqueEmail(), password: TEST_PASSWORD, ...overrides };
  await page.goto("/registrera");
  await page.getByLabel("Namn", { exact: true }).fill(user.name);
  await page.getByLabel("E-post", { exact: true }).fill(user.email);
  await page.getByLabel("Lösenord", { exact: true }).fill(user.password);
  await page.getByRole("checkbox", { name: /Jag godkänner/ }).check();
  await page.getByRole("button", { name: "Skapa konto" }).click();
  await page.waitForURL(/\/app(?:\?.*)?$/);
  return user;
}

/** Logs in through /logga-in and waits for the app. */
export async function loginUser(page: Page, user: Pick<TestUser, "email" | "password">): Promise<void> {
  await page.goto("/logga-in");
  await page.getByLabel("E-post", { exact: true }).fill(user.email);
  await page.getByLabel("Lösenord", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Logga in", exact: true }).click();
  await page.waitForURL(/\/app(?:[/?].*)?$/);
}

/**
 * Reads the user's personal inbound e-mail address from the settings page.
 * The address may be rendered as text, as a mailto: link or inside a read-only input – the
 * server-rendered HTML contains it in every case. Help text may also show an example address,
 * so the most frequently occurring one wins (the real address appears in text, link and payload).
 */
export async function readInboundAddress(page: Page): Promise<string> {
  await page.goto("/app/installningar");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const html = await page.content();
  const counts = new Map<string, number>();
  for (const match of html.matchAll(new RegExp(INBOUND_ADDRESS_RE.source, "gi"))) {
    const address = match[0].toLowerCase().replace(/\+[^@]*@/, "@");
    counts.set(address, (counts.get(address) ?? 0) + 1);
  }
  const best = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  expect(best, "settings page should show the personal kvitto-… address").toBeTruthy();
  return best!;
}

/**
 * Generates a PNG that looks like a photographed receipt: a light paper strip with dark "text"
 * lines on a noisy background. The noise keeps the file well above the 12 KB threshold below
 * which the inbound parser treats images as logos/signatures.
 */
export async function makeReceiptPng(width = 240, height = 320, seed = 7): Promise<Buffer> {
  const channels = 3;
  const raw = Buffer.alloc(width * height * channels);
  let state = seed >>> 0;
  const rand = () => {
    // xorshift32 – deterministic noise so every run produces the same bytes
    state ^= state << 13;
    state >>>= 0;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 0xffffffff;
  };
  const paperLeft = Math.floor(width * 0.15);
  const paperRight = Math.floor(width * 0.85);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const onPaper = x >= paperLeft && x <= paperRight && y > 10 && y < height - 10;
      const textLine = onPaper && y % 18 < 4 && x > paperLeft + 12 && x < paperRight - 12 && rand() > 0.35;
      const base = onPaper ? (textLine ? 40 : 235) : 90;
      const noise = Math.floor((rand() - 0.5) * 60);
      const v = Math.max(0, Math.min(255, base + noise));
      raw[i] = v;
      raw[i + 1] = v;
      raw[i + 2] = v;
    }
  }
  return sharp(raw, { raw: { width, height, channels } }).png({ compressionLevel: 6 }).toBuffer();
}

export interface ReceiptStatus {
  id: string;
  status: "PROCESSING" | "READY" | "NEEDS_REVIEW" | "FAILED";
  title: string | null;
  merchantName: string | null;
  totalAmount: number | null;
  processingError: string | null;
}

/** Polls the status endpoint until the receipt leaves PROCESSING (or the timeout passes). */
export async function waitForProcessing(request: APIRequestContext, receiptId: string, timeoutMs = 20_000): Promise<ReceiptStatus> {
  const deadline = Date.now() + timeoutMs;
  let last: ReceiptStatus | null = null;
  while (Date.now() < deadline) {
    const res = await request.get(`/api/receipts/${receiptId}/status`);
    expect(res.status(), "status endpoint should be reachable for the owner").toBe(200);
    last = (await res.json()) as ReceiptStatus;
    if (last.status !== "PROCESSING") return last;
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  expect(last, "status endpoint should have answered at least once").not.toBeNull();
  return last!;
}

/** Postmark-style inbound webhook payload with one PNG attachment. */
export function postmarkPayload(to: string, png: Buffer, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    FromName: "Elgiganten",
    MessageStream: "inbound",
    From: "Elgiganten <noreply@elgiganten.example>",
    FromFull: { Email: "noreply@elgiganten.example", Name: "Elgiganten", MailboxHash: "" },
    To: to,
    ToFull: [{ Email: to, Name: "", MailboxHash: "" }],
    Cc: "",
    CcFull: [],
    Bcc: "",
    BccFull: [],
    OriginalRecipient: to,
    Subject: "Ditt kvitto från Elgiganten",
    MessageID: `e2e-${Date.now()}@example.com`,
    Date: new Date().toUTCString(),
    TextBody: "Tack för ditt köp! Kvittot finns som bilaga.",
    HtmlBody: "<p>Tack för ditt köp! Kvittot finns som bilaga.</p>",
    Headers: [],
    Attachments: [
      {
        Name: "kvitto.png",
        Content: png.toString("base64"),
        ContentType: "image/png",
        ContentLength: png.byteLength,
      },
    ],
    ...overrides,
  };
}
