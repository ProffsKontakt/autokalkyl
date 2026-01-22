-- Fix missing tables for Kalkyla.se
-- Run this in Neon Console SQL Editor

-- CreateTable CalculationView
CREATE TABLE IF NOT EXISTS "CalculationView" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,
    CONSTRAINT "CalculationView_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalculationVariant
CREATE TABLE IF NOT EXISTS "CalculationVariant" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "consumptionProfile" JSONB NOT NULL,
    "annualConsumptionKwh" DECIMAL(10,2) NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalculationVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "CalculationView_calculationId_idx" ON "CalculationView"("calculationId");
CREATE INDEX IF NOT EXISTS "CalculationView_viewedAt_idx" ON "CalculationView"("viewedAt");
CREATE INDEX IF NOT EXISTS "CalculationVariant_calculationId_idx" ON "CalculationVariant"("calculationId");

-- AddForeignKey (use DO block to handle if already exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CalculationView_calculationId_fkey') THEN
        ALTER TABLE "CalculationView" ADD CONSTRAINT "CalculationView_calculationId_fkey"
        FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CalculationVariant_calculationId_fkey') THEN
        ALTER TABLE "CalculationVariant" ADD CONSTRAINT "CalculationVariant_calculationId_fkey"
        FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
