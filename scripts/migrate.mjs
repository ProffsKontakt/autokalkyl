#!/usr/bin/env node
/**
 * Robust `prisma migrate deploy` for Kvittera.
 *
 * Normal path: plain `prisma migrate deploy` (fresh database, or already migrated).
 *
 * One-time legacy path – ONLY when the database still contains the old kalkyla.se schema
 * (a "Calculation" table) and no Kvittera tables yet:
 *  - P3009: the legacy `_prisma_migrations` table contains a failed migration → the table is dropped
 *           and deploy is retried (the init migration drops the legacy schema anyway).
 *  - P3005: tables exist but there is no `_prisma_migrations` table (schema was applied by hand) →
 *           the init migration SQL is executed directly and then marked as applied (baseline).
 *
 * Once Kvittera tables exist, P3009/P3005 are treated as real errors that a human must resolve
 * (`prisma migrate resolve --rolled-back <name>` etc.). This script never drops Kvittera data.
 */
import { spawnSync } from "node:child_process";
import pg from "pg";

const INIT_MIGRATION = "20260906000000_init_kvittera";

function run(args, { input } = {}) {
  const result = spawnSync("npx", ["prisma", ...args], {
    encoding: "utf8",
    input,
    env: process.env,
    shell: process.platform === "win32",
  });
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  process.stdout.write(output);
  return { code: result.status ?? 1, output };
}

async function inspectDatabase(url) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    const { rows } = await client.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()`,
    );
    const names = new Set(rows.map((r) => r.table_name));
    return {
      hasLegacy: names.has("Calculation") || names.has("BatteryConfig") || names.has("Natagare"),
      hasKvittera: names.has("Receipt") || names.has("ReceiptFile") || names.has("WaitlistEntry"),
      hasHistory: names.has("_prisma_migrations"),
    };
  } finally {
    await client.end();
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  if (process.env.VERCEL) {
    // Preview builds without a database configured should still build; the app will report the
    // missing DATABASE_URL at runtime instead of failing the deployment.
    console.warn("[migrate] DATABASE_URL is not set in this Vercel environment – skipping migrations.");
    process.exit(0);
  }
  console.error("[migrate] DATABASE_URL is not set.");
  process.exit(1);
}

let attempt = run(["migrate", "deploy"]);
if (attempt.code === 0) process.exit(0);

const isP3009 = attempt.output.includes("P3009");
const isP3005 = attempt.output.includes("P3005");
if (!isP3009 && !isP3005) process.exit(attempt.code);

const state = await inspectDatabase(url);
const legacyOnly = state.hasLegacy && !state.hasKvittera;
if (!legacyOnly) {
  console.error(
    `\n[migrate] ${isP3009 ? "P3009 (failed migration)" : "P3005 (non-empty database without history)"} on a database that ` +
      (state.hasKvittera ? "already contains Kvittera tables" : "does not contain the legacy kalkyla schema") +
      ". Refusing to reset automatically – resolve manually with `prisma migrate resolve` / `prisma migrate status`.",
  );
  process.exit(attempt.code);
}

if (isP3009) {
  console.log("\n[migrate] Legacy kalkyla database with a failed migration record (P3009). Dropping legacy migration history and retrying…");
  const drop = run(["db", "execute", "--stdin"], { input: 'DROP TABLE IF EXISTS "_prisma_migrations";\n' });
  if (drop.code !== 0) process.exit(drop.code);
  attempt = run(["migrate", "deploy"]);
  if (attempt.code === 0) process.exit(0);
  if (!attempt.output.includes("P3005")) process.exit(attempt.code);
}

console.log("\n[migrate] Legacy kalkyla database without migration history (P3005). Applying the init migration directly and baselining…");
const exec = run(["db", "execute", "--file", `prisma/migrations/${INIT_MIGRATION}/migration.sql`]);
if (exec.code !== 0) process.exit(exec.code);
const resolve = run(["migrate", "resolve", "--applied", INIT_MIGRATION]);
if (resolve.code !== 0) process.exit(resolve.code);
attempt = run(["migrate", "deploy"]);
process.exit(attempt.code);
