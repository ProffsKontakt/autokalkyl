-- Allow anonymous audit tombstones (e.g. account.deleted) to survive user deletion.
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_userId_fkey";
ALTER TABLE "AuditEvent" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
