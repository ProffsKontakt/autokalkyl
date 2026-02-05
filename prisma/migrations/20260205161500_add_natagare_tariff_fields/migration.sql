-- Phase 14: Natagare Tariff Fields Migration (NATA-12, NATA-13)
-- Adds overforingsavgift (transfer fee) and high-load timing configuration

-- AlterTable: Add Phase 14 transfer fee field (NATA-12)
-- Overforingsavgift in ore per kWh (100 ore = 1 SEK)
ALTER TABLE "Natagare" ADD COLUMN "overforingsavgiftOreKwh" DECIMAL(10,2) DEFAULT 7.00;

-- AlterTable: Add Phase 14 high-load timing fields (NATA-13)
-- High-load hours for effect tariff (distinct from night discount hours)
ALTER TABLE "Natagare" ADD COLUMN "highLoadStartHour" INTEGER DEFAULT 7;
ALTER TABLE "Natagare" ADD COLUMN "highLoadEndHour" INTEGER DEFAULT 20;
ALTER TABLE "Natagare" ADD COLUMN "isWinterOnlyHighLoad" BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing records with defaults
-- Ensures all natagare have sensible values for new fields
UPDATE "Natagare" SET
  "overforingsavgiftOreKwh" = 7.00,
  "highLoadStartHour" = 7,
  "highLoadEndHour" = 20,
  "isWinterOnlyHighLoad" = false
WHERE "overforingsavgiftOreKwh" IS NULL;
