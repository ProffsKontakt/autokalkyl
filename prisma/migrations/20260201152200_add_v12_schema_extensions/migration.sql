-- v1.2 Schema Extensions Migration
-- Phase 8: Schema & Migration Foundation
-- Adds HeatingType enum and Natagare peak calculation fields

-- CreateEnum
CREATE TYPE "HeatingType" AS ENUM ('BERGVARME', 'FJARRVARME', 'DIREKTVERKANDE', 'LUFT_LUFT_VP', 'LUFT_VATTEN_VP');

-- AlterTable: Add heatingType to Calculation (nullable for backward compatibility)
ALTER TABLE "Calculation" ADD COLUMN "heatingType" "HeatingType";

-- AlterTable: Add peak calculation fields to Natagare
ALTER TABLE "Natagare" ADD COLUMN "peakCalculationMethod" TEXT DEFAULT 'SIMPLE_MAX';
ALTER TABLE "Natagare" ADD COLUMN "nightDiscountPercent" DECIMAL(5,2) DEFAULT 50.00;
ALTER TABLE "Natagare" ADD COLUMN "peakNightStartHour" INTEGER DEFAULT 22;
ALTER TABLE "Natagare" ADD COLUMN "peakNightEndHour" INTEGER DEFAULT 6;

-- Backfill: Ensure all existing natagare records have default values
-- This is redundant if DEFAULT clause worked, but ensures consistency
UPDATE "Natagare"
SET "peakCalculationMethod" = 'SIMPLE_MAX',
    "nightDiscountPercent" = 50.00,
    "peakNightStartHour" = 22,
    "peakNightEndHour" = 6
WHERE "peakCalculationMethod" IS NULL;
