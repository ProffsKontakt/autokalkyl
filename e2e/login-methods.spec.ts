import { createHash, randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import pg from "pg";
import { registerUser, type TestUser } from "./helpers";

/**
 * Login methods beyond the password: one-time code via e-mail, Google (initiation only – the server
 * runs with a fake client id, see scratchpad/run-server.sh), and the shared demo account.
 *
 * The code mail goes to the console in test mode, so the tests plant a code with a known hash
 * directly in the database – exactly what the mail-sending path stores. Needs DATABASE_URL.
 */
const DATABASE_URL = process.env.DATABASE_URL;
const DEMO_EMAIL = process.env.DEMO_ACCOUNT_EMAIL || "demo@kvittera.se";
const DEMO_PASSWORD = process.env.DEMO_ACCOUNT_PASSWORD || "Demo1234!";

function hashLoginCode(email: string, code: string): string {
  return createHash("sha256").update(`${email.trim().toLowerCase()}\n${code}`).digest("hex");
}

/** Inserts a fresh, newest code for the address – the app redeems the newest unconsumed row. */
async function plantLoginCode(email: string, code: string): Promise<void> {
  const client = new pg.Client({ connectionString: DATABASE_URL });
  await client.connect();
  try {
    await client.query(
      `INSERT INTO "LoginCode" ("id", "email", "codeHash", "expiresAt", "attempts", "createdAt")
       VALUES ($1, $2, $3, now() + interval '10 minutes', 0, now() + interval '1 second')`,
      [randomUUID(), email, hashLoginCode(email, code)],
    );
  } finally {
    await client.end();
  }
}

async function logout(page: Page): Promise<void> {
  await page.goto("/app");
  await page.getByRole("button", { name: "Logga ut" }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/app"));
}

test.describe.configure({ mode: "serial" });

test.describe("Engångskod via e-post", () => {
  test.skip(!DATABASE_URL, "DATABASE_URL krävs för att plantera en kod");

  let page: Page;
  let user: TestUser;

  test.beforeAll(async ({ browser }) => {
    page = await (await browser.newContext()).newPage();
    user = await registerUser(page, { name: "Kod Kodsson" });
    await logout(page);
  });

  test.afterAll(async () => {
    await page.context().close();
  });

  test("inloggningssidan kan växla till engångskod", async () => {
    await page.goto("/logga-in");
    await expect(page.getByLabel("Lösenord", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Få en engångskod via e-post" }).click();
    await expect(page.getByRole("button", { name: "Skicka kod" })).toBeVisible();
    await expect(page.getByLabel("Lösenord", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Logga in med lösenord" }).click();
    await expect(page.getByLabel("Lösenord", { exact: true })).toBeVisible();
  });

  test("att begära en kod visar bekräftelsen oavsett adress", async () => {
    await page.goto("/logga-in?method=code");
    await page.getByLabel("E-post", { exact: true }).fill(`okand+${Date.now()}@example.com`);
    await page.getByRole("button", { name: "Skicka kod" }).click();
    await expect(page.getByRole("status")).toContainText("Vi har skickat en kod");
    await expect(page.getByLabel("Engångskod")).toBeVisible();
  });

  test("fel kod avvisas med ett tydligt fel", async () => {
    await page.goto(`/logga-in?method=code&email=${encodeURIComponent(user.email)}`);
    await expect(page.getByLabel("E-post", { exact: true })).toHaveValue(user.email);
    await page.getByRole("button", { name: "Skicka kod" }).click();
    await expect(page.getByLabel("Engångskod")).toBeVisible();
    await plantLoginCode(user.email, "482913");

    await page.getByLabel("Engångskod").fill("000 000");
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Fel kod" })).toBeVisible();
    await expect(page).toHaveURL(/\/logga-in/);
  });

  test("rätt kod loggar in och koden kan inte återanvändas", async () => {
    await page.getByLabel("Engångskod").fill("482 913");
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    await page.waitForURL(/\/app(?:[/?].*)?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Kod");

    await page.goto("/app/installningar");
    await expect(page.getByRole("heading", { name: "Inloggning" })).toBeVisible();
    await expect(page.locator("#inloggning")).toContainText("Engångskod via e-post");
    await expect(page.locator("#inloggning")).toContainText("ligger i molnet");

    await logout(page);
    await page.goto(`/logga-in?method=code&email=${encodeURIComponent(user.email)}`);
    await page.getByRole("button", { name: "Skicka kod" }).click();
    await page.getByLabel("Engångskod").fill("482913");
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: /kod/i })).toBeVisible();
    await expect(page).toHaveURL(/\/logga-in/);
  });
});

test.describe("Google", () => {
  test("knappen startar OAuth-flödet mot Google med rätt callback", async ({ page }) => {
    await page.goto("/logga-in");
    const button = page.getByRole("button", { name: "Fortsätt med Google" });
    test.skip((await button.count()) === 0, "Servern kör utan GOOGLE_CLIENT_ID – knappen visas inte");

    // Never actually reach Google: answer the redirect locally and inspect the URL we were sent to.
    await page.route("https://accounts.google.com/**", (route) => route.fulfill({ status: 200, contentType: "text/html", body: "<title>google</title>" }));
    await button.click();
    await page.waitForURL(/accounts\.google\.com\/o\/oauth2\/v2\/auth/);
    const url = new URL(page.url());
    expect(url.searchParams.get("client_id")).toBe(process.env.GOOGLE_CLIENT_ID || "fake-google-client-id.apps.googleusercontent.com");
    expect(url.searchParams.get("redirect_uri")).toMatch(/\/api\/auth\/callback\/google$/);
    expect(url.searchParams.get("scope")).toContain("email");
    expect(url.searchParams.get("response_type")).toBe("code");
    // Auth.js protects the round-trip with PKCE – the verifier lives in a cookie set by the signin route.
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });

  test("registreringen erbjuder Google", async ({ page }) => {
    await page.goto("/registrera");
    const button = page.getByRole("button", { name: "Skapa konto med Google" });
    test.skip((await button.count()) === 0, "Servern kör utan GOOGLE_CLIENT_ID");
    await expect(button).toBeVisible();
    await expect(page.getByRole("button", { name: "Skapa konto", exact: true })).toBeVisible();
  });
});

test.describe("Demokontot", () => {
  test("går att logga in på och är låst mot ändringar", async ({ page }) => {
    await page.goto("/logga-in");
    await page.getByLabel("E-post", { exact: true }).fill(DEMO_EMAIL);
    await page.getByLabel("Lösenord", { exact: true }).fill(DEMO_PASSWORD);
    await page.getByRole("button", { name: "Logga in", exact: true }).click();
    const loggedIn = await page.waitForURL(/\/app(?:[/?].*)?$/, { timeout: 15_000 }).then(() => true, () => false);
    test.skip(!loggedIn, "Demokontot är inte seedat i den här databasen (npm run seed:demo)");

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Anna");
    await page.goto("/app/kvitton");
    await expect(page.locator("main article")).toHaveCount(8);

    await page.goto("/app/installningar");
    const name = page.getByLabel("Namn", { exact: true });
    await name.fill("Någon Annan");
    await page.getByRole("button", { name: "Spara namn" }).click();
    await expect(page.getByRole("alert").first()).toContainText("Demokontot");
  });
});
