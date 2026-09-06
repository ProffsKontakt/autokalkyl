#!/usr/bin/env node
/**
 * Robust `prisma migrate deploy` for Kvittera.
 *
 * Handles the two states a database inherited from the old kalkyla.se app can be in:
 *  - P3009: the legacy `_prisma_migrations` table contains a failed migration → the table is dropped
 *           (the init migration drops the legacy schema anyway) and deploy is retried.
 *  - P3005: tables exist but there is no `_prisma_migrations` table (schema was applied by hand) →
 *           the init migration SQL is executed directly and then marked as applied (baseline).
 * On a fresh database or an already-migrated one this is a plain `prisma migrate deploy`.
 */
import { spawnSync } from "node:child_process";

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

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set – skipping migrations.");
  process.exit(1);
}

let attempt = run(["migrate", "deploy"]);
if (attempt.code === 0) process.exit(0);

if (attempt.output.includes("P3009")) {
  console.log("\n[migrate] Failed legacy migration detected (P3009). Dropping legacy migration history and retrying…");
  const drop = run(["db", "execute", "--stdin"], { input: 'DROP TABLE IF EXISTS "_prisma_migrations";\n' });
  if (drop.code !== 0) process.exit(drop.code);
  attempt = run(["migrate", "deploy"]);
  if (attempt.code === 0) process.exit(0);
}

if (attempt.output.includes("P3005")) {
  console.log("\n[migrate] Non-empty database without migration history (P3005). Applying the init migration directly and baselining…");
  const exec = run(["db", "execute", "--file", `prisma/migrations/${INIT_MIGRATION}/migration.sql`]);
  if (exec.code !== 0) process.exit(exec.code);
  const resolve = run(["migrate", "resolve", "--applied", INIT_MIGRATION]);
  if (resolve.code !== 0) process.exit(resolve.code);
  attempt = run(["migrate", "deploy"]);
  process.exit(attempt.code);
}

process.exit(attempt.code);
