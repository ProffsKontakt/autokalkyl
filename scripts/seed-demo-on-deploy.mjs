#!/usr/bin/env node
/**
 * Creates or refreshes the shared demo/test account as part of `vercel-build` (after the migrations,
 * before `next build`). The account is reset on every deploy so it always looks the same.
 *
 *  - Skipped when DATABASE_URL is missing (preview without a database) or DEMO_ACCOUNT=0.
 *  - Never fails the build: a seeding problem is printed loudly and the deployment continues.
 *
 * Credentials: DEMO_ACCOUNT_EMAIL / DEMO_ACCOUNT_PASSWORD (default demo@kvittera.se / Demo1234!).
 */
import { spawnSync } from "node:child_process";

if (!process.env.DATABASE_URL) {
  console.log("[demo] DATABASE_URL is not set – skipping the demo account.");
  process.exit(0);
}
if (process.env.DEMO_ACCOUNT === "0") {
  console.log("[demo] DEMO_ACCOUNT=0 – skipping the demo account.");
  process.exit(0);
}

console.log("[demo] Creating/refreshing the demo account …");
const result = spawnSync("npx", ["tsx", "scripts/seed-demo.ts"], {
  stdio: "inherit",
  env: process.env,
  shell: process.platform === "win32",
});
if (result.status !== 0) {
  console.warn("\n[demo] WARNING: the demo account could not be seeded (see the output above). The deployment continues without it.\n");
}
process.exit(0);
