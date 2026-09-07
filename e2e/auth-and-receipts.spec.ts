import { expect, test, type Page } from "@playwright/test";
import { loginUser, makeReceiptPng, registerUser, waitForProcessing, INBOUND_ADDRESS_RE, type TestUser } from "./helpers";

/** Swedish money formatting: "1 299,5 kr" with a non-breaking or ordinary space. */
const MONEY_1299_50 = /1[\s\u00a0\u202f]299,5(?:0)?[\s\u00a0\u202f]kr/;

test.describe.configure({ mode: "serial" });

test.describe("Konto och kvitton", () => {
  let page: Page;
  let user: TestUser;
  let uploadedId: string;
  let manualId: string;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    page = await context.newPage();
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("registrering skapar ett konto och landar på översikten", async () => {
    user = await registerUser(page, { name: "Test Testsson", email: `test+${Date.now()}@example.com` });
    await expect(page).toHaveURL(/\/app(?:\?.*)?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
    await expect(page.getByRole("main")).toContainText(/kvitton/i);
  });

  test("kvittolistan är tom för ett nytt konto", async () => {
    await page.goto("/app/kvitton");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Kvitton");
    await expect(page.getByRole("heading", { name: "Inga kvitton ännu" })).toBeVisible();
    await expect(page.locator("main article")).toHaveCount(0);
  });

  test("uppladdning via API skapar ett kvitto som bearbetas", async () => {
    const png = await makeReceiptPng();
    const response = await page.request.post("/api/receipts/upload", {
      multipart: {
        files: { name: "kvitto.png", mimeType: "image/png", buffer: png },
        source: "UPLOAD",
      },
    });
    expect(response.status(), await response.text()).toBe(201);
    const body = (await response.json()) as { id: string; status: string };
    expect(body.id).toMatch(/^[A-Za-z0-9_-]{8,}$/);
    expect(body.status).toBe("PROCESSING");
    uploadedId = body.id;
  });

  test("kvittosidan visar bearbetning eller granskningsläge", async () => {
    await page.goto(`/app/kvitton/${uploadedId}`);
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toBeVisible();
    await expect(title).not.toBeEmpty();
    await expect(page.getByRole("link", { name: "Alla kvitton" })).toBeVisible();

    // Extraction runs in the background after the upload response. Without an AI key the
    // receipt lands in NEEDS_REVIEW almost immediately; with one it may stay PROCESSING for a while.
    const final = await waitForProcessing(page.request, uploadedId, 20_000);
    await page.goto(`/app/kvitton/${uploadedId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const main = page.getByRole("main");
    if (final.status === "PROCESSING") {
      await expect(main).toContainText(/Läser av kvittot|Hittar butik|Letar efter varor|Kollar garantivillkor|Snart klart|Bearbetas/);
    } else if (final.status === "NEEDS_REVIEW" || final.status === "FAILED") {
      const notice = main.getByRole("status").filter({ hasText: /Kontrollera uppgifterna|Kvittot kunde inte tolkas/ });
      await expect(notice).toBeVisible();
      if (final.processingError) await expect(notice).toContainText(final.processingError.slice(0, 40));
    } else {
      expect(final.status).toBe("READY");
      await expect(main).not.toContainText(/Läser av kvittot/);
    }
  });

  test("kvittolistan visar det uppladdade kvittot", async () => {
    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Inga kvitton ännu" })).toHaveCount(0);
    const card = page.locator("main article").first();
    await expect(card.getByRole("link").first()).toHaveAttribute("href", `/app/kvitton/${uploadedId}`);
  });

  test("ett kvitto kan läggas till för hand", async () => {
    await page.goto("/app/kvitton/ny");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Lägg till kvitto för hand");

    await page.getByLabel("Titel", { exact: true }).fill("Ny TV till vardagsrummet");
    await page.getByLabel("Butik", { exact: true }).fill("Elgiganten Testbutik");
    await page.getByLabel("Inköpsdatum", { exact: true }).fill("2026-08-15");
    await page.getByLabel("Totalbelopp", { exact: true }).fill("1 299,50");
    await page.getByRole("button", { name: "Spara kvitto" }).click();

    await page.waitForURL(/\/app\/kvitton\/(?!ny(?:[/?]|$))[A-Za-z0-9_-]+(?:\?.*)?$/);
    manualId = page.url().split("/app/kvitton/")[1].split(/[?#]/)[0];
    expect(manualId).not.toBe(uploadedId);

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ny TV till vardagsrummet");
    await expect(page.getByRole("main")).toContainText("Elgiganten Testbutik");
    await expect(page.getByRole("main")).toContainText(MONEY_1299_50);
    await expect(page.getByRole("main")).toContainText("Manuellt");
  });

  test("kvittolistan visar båda kvittona", async () => {
    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(2);
    await expect(page.getByRole("main")).toContainText("Elgiganten Testbutik");
  });

  test("sökning hittar det manuella kvittot", async () => {
    await page.goto("/app/kvitton?q=Testbutik");
    await expect(page.locator("main article")).toHaveCount(1);
    await expect(page.locator("main article").first()).toContainText("Elgiganten Testbutik");
  });

  test("garantisidan laddar", async () => {
    await page.goto("/app/garantier");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Garantier");
    await expect(page.getByRole("main")).toContainText(/Testbutik|garanti|reklamationsrätt/i);
  });

  test("inställningar visar den personliga kvittoadressen", async () => {
    await page.goto("/app/installningar");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const html = await page.content();
    const match = html.match(INBOUND_ADDRESS_RE);
    expect(match, "the settings page should show a kvitto-…@… address").not.toBeNull();
    expect(match![0]).toContain("kvitto-");
    expect(match![0]).toContain("@");
  });

  test("CSV-export innehåller kvittona", async () => {
    const response = await page.request.get("/api/receipts/export");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/csv");
    expect(response.headers()["content-disposition"]).toMatch(/attachment/);
    const csv = await response.text();
    expect(csv).toContain("Butik");
    expect(csv).toContain("Elgiganten Testbutik");
  });

  test("utloggning stänger sessionen", async () => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Logga ut" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/app"));

    await page.goto("/app");
    await expect(page).toHaveURL(/\/logga-in/);
  });

  test("inloggning fungerar med samma uppgifter", async () => {
    await loginUser(page, user);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Test");
    await page.goto(`/app/kvitton/${manualId}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ny TV till vardagsrummet");
  });

  test("fel lösenord avvisas", async () => {
    await page.goto("/app");
    await page.getByRole("button", { name: "Logga ut" }).click();
    await page.waitForURL((url) => !url.pathname.startsWith("/app"));

    await page.goto("/logga-in");
    await page.getByLabel("E-post", { exact: true }).fill(user.email);
    await page.getByLabel("Lösenord", { exact: true }).fill("FelLosenord999!");
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    await expect(page).toHaveURL(/\/logga-in/);
    await expect(page.getByRole("alert")).toBeVisible();
  });
});
