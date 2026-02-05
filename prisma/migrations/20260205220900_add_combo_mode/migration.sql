-- Phase 17: Multi-battery combo mode
-- Add comboMode to Calculation and quantity to CalculationBattery

-- AlterTable: Add comboMode to Calculation (nullable for backward compatibility)
ALTER TABLE "Calculation" ADD COLUMN "comboMode" TEXT DEFAULT 'jamfora';

-- AlterTable: Add quantity to CalculationBattery
ALTER TABLE "CalculationBattery" ADD COLUMN "quantity" INTEGER NOT NULL DEFAULT 1;
