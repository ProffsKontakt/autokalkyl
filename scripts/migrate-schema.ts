/**
 * Database Migration Script
 *
 * Uses Neon serverless driver (WebSocket/HTTPS) to push schema changes,
 * bypassing port 5432 which may be blocked on some networks.
 *
 * Run: npx tsx scripts/migrate-schema.ts
 */

import { neon, neonConfig } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Enable WebSocket for Node.js
if (typeof globalThis.WebSocket === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ws = require('ws');
  neonConfig.webSocketConstructor = ws;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL not found in environment');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function migrate() {
  console.log('Starting schema migration via Neon serverless driver...\n');

  try {
    // Check if Elomrade enum exists
    const enumCheck = await sql`
      SELECT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'Elomrade'
      ) as exists
    `;

    if (!enumCheck[0].exists) {
      console.log('Creating Elomrade enum...');
      await sql`CREATE TYPE "Elomrade" AS ENUM ('SE1', 'SE2', 'SE3', 'SE4')`;
      console.log('  ✓ Elomrade enum created');
    } else {
      console.log('  ✓ Elomrade enum already exists');
    }

    // Create BatteryBrand table
    console.log('\nCreating BatteryBrand table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "BatteryBrand" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "logoUrl" TEXT,
        "orgId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "BatteryBrand_pkey" PRIMARY KEY ("id")
      )
    `;

    // Add unique constraint if not exists
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'BatteryBrand_orgId_name_key'
        ) THEN
          ALTER TABLE "BatteryBrand" ADD CONSTRAINT "BatteryBrand_orgId_name_key" UNIQUE ("orgId", "name");
        END IF;
      END $$
    `;

    // Add foreign key if not exists
    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'BatteryBrand_orgId_fkey'
        ) THEN
          ALTER TABLE "BatteryBrand" ADD CONSTRAINT "BatteryBrand_orgId_fkey"
            FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    // Create index
    await sql`CREATE INDEX IF NOT EXISTS "BatteryBrand_orgId_idx" ON "BatteryBrand"("orgId")`;
    console.log('  ✓ BatteryBrand table created');

    // Create BatteryConfig table
    console.log('\nCreating BatteryConfig table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "BatteryConfig" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "brandId" TEXT NOT NULL,
        "orgId" TEXT NOT NULL,
        "capacityKwh" DECIMAL(10,2) NOT NULL,
        "maxDischargeKw" DECIMAL(10,2) NOT NULL,
        "maxChargeKw" DECIMAL(10,2) NOT NULL,
        "chargeEfficiency" DECIMAL(5,2) NOT NULL,
        "dischargeEfficiency" DECIMAL(5,2) NOT NULL,
        "warrantyYears" INTEGER NOT NULL,
        "guaranteedCycles" INTEGER NOT NULL,
        "degradationPerYear" DECIMAL(5,2) NOT NULL,
        "costPrice" DECIMAL(10,2) NOT NULL,
        "isExtensionCabinet" BOOLEAN NOT NULL DEFAULT false,
        "isNewStack" BOOLEAN NOT NULL DEFAULT true,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "BatteryConfig_pkey" PRIMARY KEY ("id")
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'BatteryConfig_orgId_brandId_name_key'
        ) THEN
          ALTER TABLE "BatteryConfig" ADD CONSTRAINT "BatteryConfig_orgId_brandId_name_key" UNIQUE ("orgId", "brandId", "name");
        END IF;
      END $$
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'BatteryConfig_brandId_fkey'
        ) THEN
          ALTER TABLE "BatteryConfig" ADD CONSTRAINT "BatteryConfig_brandId_fkey"
            FOREIGN KEY ("brandId") REFERENCES "BatteryBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'BatteryConfig_orgId_fkey'
        ) THEN
          ALTER TABLE "BatteryConfig" ADD CONSTRAINT "BatteryConfig_orgId_fkey"
            FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    await sql`CREATE INDEX IF NOT EXISTS "BatteryConfig_orgId_idx" ON "BatteryConfig"("orgId")`;
    await sql`CREATE INDEX IF NOT EXISTS "BatteryConfig_brandId_idx" ON "BatteryConfig"("brandId")`;
    console.log('  ✓ BatteryConfig table created');

    // Create Natagare table
    console.log('\nCreating Natagare table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "Natagare" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "dayRateSekKw" DECIMAL(10,4) NOT NULL,
        "nightRateSekKw" DECIMAL(10,4) NOT NULL,
        "dayStartHour" INTEGER NOT NULL DEFAULT 6,
        "dayEndHour" INTEGER NOT NULL DEFAULT 22,
        "orgId" TEXT NOT NULL,
        "isDefault" BOOLEAN NOT NULL DEFAULT false,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "Natagare_pkey" PRIMARY KEY ("id")
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Natagare_orgId_name_key'
        ) THEN
          ALTER TABLE "Natagare" ADD CONSTRAINT "Natagare_orgId_name_key" UNIQUE ("orgId", "name");
        END IF;
      END $$
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'Natagare_orgId_fkey'
        ) THEN
          ALTER TABLE "Natagare" ADD CONSTRAINT "Natagare_orgId_fkey"
            FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$
    `;

    await sql`CREATE INDEX IF NOT EXISTS "Natagare_orgId_idx" ON "Natagare"("orgId")`;
    console.log('  ✓ Natagare table created');

    // Create ElectricityPrice table
    console.log('\nCreating ElectricityPrice table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "ElectricityPrice" (
        "id" TEXT NOT NULL,
        "elomrade" "Elomrade" NOT NULL,
        "date" DATE NOT NULL,
        "hour" INTEGER NOT NULL,
        "priceOre" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "ElectricityPrice_pkey" PRIMARY KEY ("id")
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ElectricityPrice_elomrade_date_hour_key'
        ) THEN
          ALTER TABLE "ElectricityPrice" ADD CONSTRAINT "ElectricityPrice_elomrade_date_hour_key" UNIQUE ("elomrade", "date", "hour");
        END IF;
      END $$
    `;

    await sql`CREATE INDEX IF NOT EXISTS "ElectricityPrice_elomrade_date_idx" ON "ElectricityPrice"("elomrade", "date")`;
    await sql`CREATE INDEX IF NOT EXISTS "ElectricityPrice_date_idx" ON "ElectricityPrice"("date")`;
    console.log('  ✓ ElectricityPrice table created');

    // Create ElectricityPriceQuarterly table
    console.log('\nCreating ElectricityPriceQuarterly table...');
    await sql`
      CREATE TABLE IF NOT EXISTS "ElectricityPriceQuarterly" (
        "id" TEXT NOT NULL,
        "elomrade" "Elomrade" NOT NULL,
        "year" INTEGER NOT NULL,
        "quarter" INTEGER NOT NULL,
        "avgDayPriceOre" DECIMAL(10,2) NOT NULL,
        "avgNightPriceOre" DECIMAL(10,2) NOT NULL,
        "avgPriceOre" DECIMAL(10,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "ElectricityPriceQuarterly_pkey" PRIMARY KEY ("id")
      )
    `;

    await sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'ElectricityPriceQuarterly_elomrade_year_quarter_key'
        ) THEN
          ALTER TABLE "ElectricityPriceQuarterly" ADD CONSTRAINT "ElectricityPriceQuarterly_elomrade_year_quarter_key" UNIQUE ("elomrade", "year", "quarter");
        END IF;
      END $$
    `;

    await sql`CREATE INDEX IF NOT EXISTS "ElectricityPriceQuarterly_elomrade_idx" ON "ElectricityPriceQuarterly"("elomrade")`;
    console.log('  ✓ ElectricityPriceQuarterly table created');

    console.log('\n✅ Migration complete!\n');

    // Verify tables exist
    console.log('Verifying tables...');
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('BatteryBrand', 'BatteryConfig', 'Natagare', 'ElectricityPrice', 'ElectricityPriceQuarterly')
      ORDER BY table_name
    `;

    console.log('Created tables:');
    for (const table of tables) {
      console.log(`  ✓ ${table.table_name}`);
    }

    if (tables.length === 5) {
      console.log('\n✅ All Phase 2 tables created successfully!');
    } else {
      console.log(`\n⚠️  Expected 5 tables, found ${tables.length}`);
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
