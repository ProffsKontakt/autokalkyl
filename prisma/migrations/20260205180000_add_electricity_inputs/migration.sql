-- Phase 15: Customer Electricity Inputs Migration (CUST-01-04, ELEC-01-06)
-- Adds customer type, purchased electricity, electricity price, and solar production fields

-- AlterTable: Add customer type field
-- String type allows Super Admin to configure customer types without schema migration
ALTER TABLE "Calculation" ADD COLUMN "customerType" TEXT NOT NULL DEFAULT 'PRIVATPERSON';

-- AlterTable: Add purchased electricity fields (kopt el)
ALTER TABLE "Calculation" ADD COLUMN "koptElKwh" DECIMAL(10,2);
ALTER TABLE "Calculation" ADD COLUMN "koptElInputMode" TEXT DEFAULT 'annual';
ALTER TABLE "Calculation" ADD COLUMN "koptElMonthly" JSONB;

-- AlterTable: Add electricity price fields
ALTER TABLE "Calculation" ADD COLUMN "electricityPriceOreKwh" DECIMAL(10,2);
ALTER TABLE "Calculation" ADD COLUMN "electricityPriceInputMode" TEXT DEFAULT 'annual';
ALTER TABLE "Calculation" ADD COLUMN "electricityPriceMonthly" JSONB;

-- AlterTable: Add solar production fields
ALTER TABLE "Calculation" ADD COLUMN "hasSolar" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Calculation" ADD COLUMN "solarProductionKwh" DECIMAL(10,2);
ALTER TABLE "Calculation" ADD COLUMN "solarProductionInputMode" TEXT DEFAULT 'annual';
ALTER TABLE "Calculation" ADD COLUMN "solarProductionMonthly" JSONB;

-- AlterTable: Add self-consumption fields
ALTER TABLE "Calculation" ADD COLUMN "currentSelfConsumptionKwh" DECIMAL(10,2);
ALTER TABLE "Calculation" ADD COLUMN "projectedSelfConsumptionKwh" DECIMAL(10,2);
ALTER TABLE "Calculation" ADD COLUMN "selfConsumptionInputMode" TEXT DEFAULT 'kwh';

-- Note: All new fields are nullable except customerType and hasSolar which have defaults
-- Existing calculations will have NULL for optional fields, 'PRIVATPERSON' for customerType, false for hasSolar
