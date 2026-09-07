import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests against a running app (the server is started externally, e.g. `npm run dev`
 * with a local Postgres). Point BASE_URL at it; INBOUND_EMAIL_SECRET must match the server's.
 *
 * The browser is the preinstalled Chromium in /opt/pw-browsers – no `playwright install` needed.
 */
const baseURL = process.env.BASE_URL || "http://localhost:3001";
const executablePath = process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium";

export default defineConfig({
  testDir: "e2e",
  outputDir: "test-results",
  // The specs share one dev server and one database; run files one at a time.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 90_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    locale: "sv-SE",
    timezoneId: "Europe/Stockholm",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { executablePath },
      },
    },
  ],
});
