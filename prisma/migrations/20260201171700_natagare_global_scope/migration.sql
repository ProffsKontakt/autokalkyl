-- Phase 9: Natagare Global Scope Migration
-- Enables centralized natagare management with approval workflow
-- Migrates existing org-scoped natagare to global scope where possible

-- CreateEnum: ApprovalStatus for workflow tracking
CREATE TYPE "ApprovalStatus" AS ENUM ('APPROVED', 'PENDING', 'REJECTED', 'DUPLICATE_REVIEW');

-- AlterTable: Add global scope and approval workflow fields
ALTER TABLE "Natagare" ADD COLUMN "globalScope" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Natagare" ADD COLUMN "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'APPROVED';
ALTER TABLE "Natagare" ADD COLUMN "requestedByOrgId" TEXT;
ALTER TABLE "Natagare" ADD COLUMN "approvedAt" TIMESTAMP(3);
ALTER TABLE "Natagare" ADD COLUMN "approvedByUserId" TEXT;

-- AlterTable: Make orgId nullable (global natagare have null orgId)
ALTER TABLE "Natagare" ALTER COLUMN "orgId" DROP NOT NULL;

-- CreateIndex: approvalStatus for dashboard queries
CREATE INDEX "Natagare_approvalStatus_idx" ON "Natagare"("approvalStatus");

-- AddForeignKey: approvedByUserId -> User
ALTER TABLE "Natagare" ADD CONSTRAINT "Natagare_approvedByUserId_fkey" FOREIGN KEY ("approvedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Migration: Flag duplicates and migrate unique natagare to global scope
-- Step 1: Identify natagare names that exist in multiple organizations
-- These need manual review by Super Admin
UPDATE "Natagare" n1
SET "approvalStatus" = 'DUPLICATE_REVIEW'
FROM (
  SELECT name
  FROM "Natagare"
  GROUP BY name
  HAVING COUNT(DISTINCT "orgId") > 1
) AS duplicates
WHERE n1.name = duplicates.name;

-- Step 2: For non-duplicate natagare, migrate the oldest one (by createdAt) to global scope
-- This becomes the canonical global version
WITH ranked AS (
  SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY "createdAt" ASC) as rn
  FROM "Natagare"
  WHERE "approvalStatus" = 'APPROVED'
)
UPDATE "Natagare" n
SET
  "globalScope" = true,
  "orgId" = NULL
FROM ranked r
WHERE n.id = r.id AND r.rn = 1 AND n."approvalStatus" = 'APPROVED';

-- Step 3: Mark remaining same-name natagare (non-first) as duplicates for review
-- These are org-specific copies that need Super Admin decision
UPDATE "Natagare"
SET "approvalStatus" = 'DUPLICATE_REVIEW'
WHERE "globalScope" = false
  AND "approvalStatus" = 'APPROVED'
  AND name IN (SELECT name FROM "Natagare" WHERE "globalScope" = true);
