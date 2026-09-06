import { expect, test } from "@playwright/test";
import { INBOUND_SECRET, makeReceiptPng, postmarkPayload, readInboundAddress, registerUser } from "./helpers";

const ENDPOINT = "/api/inbound/email";

test.describe("Inkommande kvitton via e-post", () => {
  test("avvisar anrop utan hemlighet", async ({ request }) => {
    const png = await makeReceiptPng(64, 64);
    const response = await request.post(ENDPOINT, { data: postmarkPayload("kvitto-okand@in.example.com", png) });
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ error: "Unauthorized" });
  });

  test("avvisar en felaktig hemlighet", async ({ request }) => {
    const png = await makeReceiptPng(64, 64);
    const response = await request.post(ENDPOINT, {
      headers: { "x-inbound-secret": `${INBOUND_SECRET}-fel` },
      data: postmarkPayload("kvitto-okand@in.example.com", png),
    });
    expect(response.status()).toBe(401);
  });

  test("släpper mail till okända mottagare utan att låta leverantören försöka igen", async ({ request }) => {
    const png = await makeReceiptPng();
    const response = await request.post(ENDPOINT, {
      headers: { "x-inbound-secret": INBOUND_SECRET },
      data: postmarkPayload("kvitto-finnsinte00@in.example.com", png),
    });
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "unknown_recipient" });
  });

  test("accepterar hemligheten som ?secret= och som Bearer-token", async ({ request }) => {
    const png = await makeReceiptPng();
    const viaQuery = await request.post(`${ENDPOINT}?secret=${encodeURIComponent(INBOUND_SECRET)}`, {
      data: postmarkPayload("kvitto-finnsinte01@in.example.com", png),
    });
    expect(viaQuery.status()).toBe(200);
    await expect(viaQuery.json()).resolves.toMatchObject({ reason: "unknown_recipient" });

    const viaBearer = await request.post(ENDPOINT, {
      headers: { authorization: `Bearer ${INBOUND_SECRET}` },
      data: postmarkPayload("kvitto-finnsinte02@in.example.com", png),
    });
    expect(viaBearer.status()).toBe(200);
    await expect(viaBearer.json()).resolves.toMatchObject({ reason: "unknown_recipient" });
  });

  test("ett mailat kvitto hamnar hos rätt användare", async ({ page }) => {
    await registerUser(page, { email: `inbound+${Date.now()}@example.com` });
    const address = await readInboundAddress(page);
    expect(address).toMatch(/^kvitto-[a-z0-9]+@/);

    const png = await makeReceiptPng();
    const response = await page.request.post(ENDPOINT, {
      headers: { "x-inbound-secret": INBOUND_SECRET },
      data: postmarkPayload(address, png),
    });
    expect(response.status(), await response.text()).toBe(200);
    const body = (await response.json()) as { ok: boolean; receiptId?: string; status?: string };
    expect(body.ok).toBe(true);
    expect(body.receiptId).toMatch(/^[A-Za-z0-9_-]{8,}$/);
    expect(["PROCESSING", "READY", "NEEDS_REVIEW", "FAILED"]).toContain(body.status);

    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article").first().getByRole("link").first()).toHaveAttribute("href", `/app/kvitton/${body.receiptId}`);

    await page.goto(`/app/kvitton/${body.receiptId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("main")).toContainText("E-post");
  });

  test("plus-adressering och versaler i adressen fungerar", async ({ page }) => {
    await registerUser(page, { email: `inbound-plus+${Date.now()}@example.com` });
    const address = await readInboundAddress(page);
    const [local, domain] = address.split("@");
    const tagged = `${local}+elgiganten@${domain}`.toUpperCase();

    const png = await makeReceiptPng(240, 320, 11);
    const response = await page.request.post(ENDPOINT, {
      headers: { "x-inbound-secret": INBOUND_SECRET },
      data: postmarkPayload(tagged, png, { Subject: "Orderbekräftelse 4711" }),
    });
    expect(response.status(), await response.text()).toBe(200);
    const body = (await response.json()) as { ok: boolean; receiptId?: string };
    expect(body.ok).toBe(true);

    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(1);
  });

  test("ett mail utan bild, PDF eller text avvisas som tomt", async ({ page }) => {
    await registerUser(page, { email: `inbound-empty+${Date.now()}@example.com` });
    const address = await readInboundAddress(page);

    const response = await page.request.post(ENDPOINT, {
      headers: { "x-inbound-secret": INBOUND_SECRET },
      data: postmarkPayload(address, Buffer.alloc(0), { Attachments: [], TextBody: "", HtmlBody: "" }),
    });
    expect(response.status()).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: false, reason: "no_content" });

    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(0);
  });
});
