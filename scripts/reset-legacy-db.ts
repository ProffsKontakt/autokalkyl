/**
 * One-off helper: wipes the legacy kalkyla.se schema AND the Prisma migration history so that
 * `prisma migrate deploy` starts from the Kvittera init migration on a clean slate.
 *
 * Normally NOT needed – the init migration already drops legacy tables. Use this only if
 * `prisma migrate deploy` complains about failed/unknown migrations in `_prisma_migrations`.
 *
 *   DATABASE_URL=... npx tsx scripts/reset-legacy-db.ts
 */
import "dotenv/config";
import { Client } from "pg";

const LEGACY_TABLES = [
  "LeadCompanyMatch", "Lead", "Company", "CalculationVariant", "CalculationView", "CalculationBattery",
  "Calculation", "ElectricityPriceQuarterly", "ElectricityPrice", "Natagare", "BatteryConfig", "BatteryBrand",
  "PasswordResetToken", "VerificationToken", "Account", "Session", "User", "Organization",
];
const LEGACY_TYPES = ["Role", "Elomrade", "CalculationStatus", "PropertyType", "InterestType", "BudgetRange", "Timeline", "LeadStatus", "HeatingType", "ApprovalStatus"];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  if (process.env.CONFIRM_RESET !== "yes") {
    console.error("Refusing to run without CONFIRM_RESET=yes – this drops the legacy schema and migration history.");
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    for (const t of LEGACY_TABLES) await client.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);
    for (const t of LEGACY_TYPES) await client.query(`DROP TYPE IF EXISTS "${t}" CASCADE`);
    await client.query(`DROP TABLE IF EXISTS "_prisma_migrations"`);
    console.log("Legacy schema and migration history removed. Now run: npx prisma migrate deploy");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
