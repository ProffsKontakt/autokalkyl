import { expect, test } from "@playwright/test";
import { uniqueEmail } from "./helpers";

test.describe("Marknadssidor", () => {
  test("startsidan visar hero och huvudmeny", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Alla dina kvitton");

    const nav = page.getByRole("navigation", { name: "Huvudmeny" });
    await expect(nav.getByRole("link", { name: "Så funkar det" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Garantier & rättigheter" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Säkerhet" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "För företag" })).toHaveAttribute("href", "/foretag");

    const header = page.locator("header").first();
    const login = header.getByRole("link", { name: "Logga in", exact: true }).filter({ visible: true });
    await expect(login).toHaveCount(1);
    await expect(login).toHaveAttribute("href", "/logga-in");
    const signup = header.getByRole("link", { name: "Kom igång gratis" }).filter({ visible: true });
    await expect(signup).toHaveCount(1);
    await expect(signup).toHaveAttribute("href", "/registrera");
  });

  test("huvudmenyns länkar leder rätt", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Huvudmeny" }).getByRole("link", { name: "För företag" }).click();
    await page.waitForURL(/\/foretag$/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.locator("header").first().getByRole("link", { name: "Logga in", exact: true }).filter({ visible: true }).click();
    await page.waitForURL(/\/logga-in$/);
    await expect(page.getByRole("button", { name: "Logga in", exact: true })).toBeVisible();
  });

  test("väntelistan för företag tar emot en anmälan", async ({ page }) => {
    await page.goto("/foretag");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const email = uniqueEmail("foretag");
    await page.getByLabel("Namn", { exact: true }).fill("Företagaren Testsson");
    await page.getByLabel("E-post", { exact: true }).fill(email);
    await page.getByLabel(/^Företag/).fill("Testbolaget AB");
    await page.getByLabel(/^Meddelande/).fill("Vi använder Fortnox och har cirka 200 kvitton i månaden.");
    await page.getByRole("button", { name: "Ställ mig i kön" }).click();

    await expect(page.getByRole("heading", { name: /du står i kön/i })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: /står i kön/ })).toContainText(email.toLowerCase());
    await expect(page.getByRole("link", { name: "Skapa ett privat konto" })).toHaveAttribute("href", "/registrera");
  });

  test("integritetspolicy och användarvillkor går att läsa", async ({ page }) => {
    const privacy = await page.goto("/integritet");
    expect(privacy?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Integritetspolicy");

    const terms = await page.goto("/villkor");
    expect(terms?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Användarvillkor");
  });

  test("okänd adress ger en svensk 404-sida", async ({ page }) => {
    const response = await page.goto("/finns-inte");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Sidan hittades inte");
    await expect(page.getByRole("link", { name: "Till startsidan" })).toHaveAttribute("href", "/");
  });
});
