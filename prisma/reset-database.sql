-- RESET DATABASE for Kalkyla.se
-- This will DROP all tables and recreate them fresh
-- WARNING: All data will be lost!

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS "CalculationVariant" CASCADE;
DROP TABLE IF EXISTS "CalculationView" CASCADE;
DROP TABLE IF EXISTS "CalculationBattery" CASCADE;
DROP TABLE IF EXISTS "Calculation" CASCADE;
DROP TABLE IF EXISTS "ElectricityPriceQuarterly" CASCADE;
DROP TABLE IF EXISTS "ElectricityPrice" CASCADE;
DROP TABLE IF EXISTS "Natagare" CASCADE;
DROP TABLE IF EXISTS "BatteryConfig" CASCADE;
DROP TABLE IF EXISTS "BatteryBrand" CASCADE;
DROP TABLE IF EXISTS "PasswordResetToken" CASCADE;
DROP TABLE IF EXISTS "VerificationToken" CASCADE;
DROP TABLE IF EXISTS "Account" CASCADE;
DROP TABLE IF EXISTS "Session" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;

-- Drop enums
DROP TYPE IF EXISTS "CalculationStatus" CASCADE;
DROP TYPE IF EXISTS "Elomrade" CASCADE;
DROP TYPE IF EXISTS "Role" CASCADE;

-- Now recreate everything fresh

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'CLOSER');
CREATE TYPE "Elomrade" AS ENUM ('SE1', 'SE2', 'SE3', 'SE4');
CREATE TYPE "CalculationStatus" AS ENUM ('DRAFT', 'COMPLETE', 'ARCHIVED');

-- CreateTable Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "isProffsKontaktAffiliated" BOOLEAN NOT NULL DEFAULT false,
    "installerFixedCut" DECIMAL(10,2),
    "marginAlertThreshold" DECIMAL(10,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable User
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CLOSER',
    "orgId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable Session
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable Account
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable VerificationToken
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable PasswordResetToken
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable BatteryBrand
CREATE TABLE "BatteryBrand" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "orgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "BatteryBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable BatteryConfig
CREATE TABLE "BatteryConfig" (
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
);

-- CreateTable Natagare
CREATE TABLE "Natagare" (
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
);

-- CreateTable ElectricityPrice
CREATE TABLE "ElectricityPrice" (
    "id" TEXT NOT NULL,
    "elomrade" "Elomrade" NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "priceOre" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ElectricityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable ElectricityPriceQuarterly
CREATE TABLE "ElectricityPriceQuarterly" (
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
);

-- CreateTable Calculation
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "status" "CalculationStatus" NOT NULL DEFAULT 'DRAFT',
    "customerName" TEXT NOT NULL,
    "postalCode" TEXT,
    "elomrade" "Elomrade" NOT NULL,
    "natagareId" TEXT NOT NULL,
    "annualConsumptionKwh" DECIMAL(10,2) NOT NULL,
    "consumptionProfile" JSONB NOT NULL,
    "results" JSONB,
    "shareCode" TEXT,
    "shareExpiresAt" TIMESTAMP(3),
    "sharePassword" TEXT,
    "shareCreatedAt" TIMESTAMP(3),
    "shareIsActive" BOOLEAN NOT NULL DEFAULT true,
    "customGreeting" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalculationBattery
CREATE TABLE "CalculationBattery" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "batteryConfigId" TEXT NOT NULL,
    "totalPriceExVat" DECIMAL(10,2) NOT NULL,
    "installationCost" DECIMAL(10,2) NOT NULL,
    "results" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CalculationBattery_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalculationView
CREATE TABLE "CalculationView" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userAgent" TEXT,
    "ipHash" TEXT,
    CONSTRAINT "CalculationView_pkey" PRIMARY KEY ("id")
);

-- CreateTable CalculationVariant
CREATE TABLE "CalculationVariant" (
    "id" TEXT NOT NULL,
    "calculationId" TEXT NOT NULL,
    "consumptionProfile" JSONB NOT NULL,
    "annualConsumptionKwh" DECIMAL(10,2) NOT NULL,
    "results" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CalculationVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Organization_slug_idx" ON "Organization"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_orgId_idx" ON "User"("orgId");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");
CREATE INDEX "BatteryBrand_orgId_idx" ON "BatteryBrand"("orgId");
CREATE UNIQUE INDEX "BatteryBrand_orgId_name_key" ON "BatteryBrand"("orgId", "name");
CREATE INDEX "BatteryConfig_orgId_idx" ON "BatteryConfig"("orgId");
CREATE INDEX "BatteryConfig_brandId_idx" ON "BatteryConfig"("brandId");
CREATE UNIQUE INDEX "BatteryConfig_orgId_brandId_name_key" ON "BatteryConfig"("orgId", "brandId", "name");
CREATE INDEX "Natagare_orgId_idx" ON "Natagare"("orgId");
CREATE UNIQUE INDEX "Natagare_orgId_name_key" ON "Natagare"("orgId", "name");
CREATE INDEX "ElectricityPrice_elomrade_date_idx" ON "ElectricityPrice"("elomrade", "date");
CREATE INDEX "ElectricityPrice_date_idx" ON "ElectricityPrice"("date");
CREATE UNIQUE INDEX "ElectricityPrice_elomrade_date_hour_key" ON "ElectricityPrice"("elomrade", "date", "hour");
CREATE INDEX "ElectricityPriceQuarterly_elomrade_idx" ON "ElectricityPriceQuarterly"("elomrade");
CREATE UNIQUE INDEX "ElectricityPriceQuarterly_elomrade_year_quarter_key" ON "ElectricityPriceQuarterly"("elomrade", "year", "quarter");
CREATE UNIQUE INDEX "Calculation_shareCode_key" ON "Calculation"("shareCode");
CREATE INDEX "Calculation_orgId_idx" ON "Calculation"("orgId");
CREATE INDEX "Calculation_createdBy_idx" ON "Calculation"("createdBy");
CREATE INDEX "Calculation_shareCode_idx" ON "Calculation"("shareCode");
CREATE INDEX "CalculationBattery_calculationId_idx" ON "CalculationBattery"("calculationId");
CREATE UNIQUE INDEX "CalculationBattery_calculationId_batteryConfigId_key" ON "CalculationBattery"("calculationId", "batteryConfigId");
CREATE INDEX "CalculationView_calculationId_idx" ON "CalculationView"("calculationId");
CREATE INDEX "CalculationView_viewedAt_idx" ON "CalculationView"("viewedAt");
CREATE INDEX "CalculationVariant_calculationId_idx" ON "CalculationVariant"("calculationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatteryBrand" ADD CONSTRAINT "BatteryBrand_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatteryConfig" ADD CONSTRAINT "BatteryConfig_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "BatteryBrand"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BatteryConfig" ADD CONSTRAINT "BatteryConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Natagare" ADD CONSTRAINT "Natagare_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_natagareId_fkey" FOREIGN KEY ("natagareId") REFERENCES "Natagare"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalculationBattery" ADD CONSTRAINT "CalculationBattery_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculationBattery" ADD CONSTRAINT "CalculationBattery_batteryConfigId_fkey" FOREIGN KEY ("batteryConfigId") REFERENCES "BatteryConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CalculationView" ADD CONSTRAINT "CalculationView_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CalculationVariant" ADD CONSTRAINT "CalculationVariant_calculationId_fkey" FOREIGN KEY ("calculationId") REFERENCES "Calculation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- SEED SUPER ADMIN
-- ============================================================================

INSERT INTO "User" (
    "id", "email", "passwordHash", "name", "role", "orgId", "isActive", "createdAt", "updatedAt"
) VALUES (
    'clsuperadmin001',
    'admin@kalkyla.se',
    '$2b$10$Ii3Pibbz8GMNwTN2QTsgl.rlLm06ZuOgnjTeehVLb94r4FfCxZ4Du',
    'Super Admin',
    'SUPER_ADMIN',
    NULL,
    true,
    NOW(),
    NOW()
);

-- Login: admin@kalkyla.se / admin123
