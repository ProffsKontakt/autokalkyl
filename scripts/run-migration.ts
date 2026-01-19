// Run migration SQL via Neon serverless driver (bypasses port 5432 block)
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const migrationStatements = [
  // CreateEnum
  `CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ORG_ADMIN', 'CLOSER')`,

  // CreateTable Organization
  `CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#3B82F6',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1E40AF',
    "isProffsKontaktAffiliated" BOOLEAN NOT NULL DEFAULT false,
    "partnerCutPercent" DECIMAL(5,2),
    "marginAlertThreshold" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
  )`,

  // CreateTable User
  `CREATE TABLE "User" (
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
  )`,

  // CreateTable Session
  `CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
  )`,

  // CreateTable Account
  `CREATE TABLE "Account" (
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
  )`,

  // CreateTable VerificationToken
  `CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
  )`,

  // CreateTable PasswordResetToken
  `CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
  )`,

  // CreateIndex
  `CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug")`,
  `CREATE INDEX "Organization_slug_idx" ON "Organization"("slug")`,
  `CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`,
  `CREATE INDEX "User_orgId_idx" ON "User"("orgId")`,
  `CREATE INDEX "User_email_idx" ON "User"("email")`,
  `CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken")`,
  `CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId")`,
  `CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token")`,
  `CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token")`,
  `CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token")`,
  `CREATE INDEX "PasswordResetToken_token_idx" ON "PasswordResetToken"("token")`,
  `CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId")`,

  // AddForeignKey
  `ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
];

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Running migration via Neon serverless driver...');

  const sql = neon(connectionString);

  try {
    console.log('Executing ' + migrationStatements.length + ' statements...');

    for (let i = 0; i < migrationStatements.length; i++) {
      const stmt = migrationStatements[i];
      const preview = stmt.substring(0, 50).replace(/\n/g, ' ');
      console.log('[' + (i + 1) + '/' + migrationStatements.length + '] ' + preview + '...');

      try {
        await sql.query(stmt);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        // Ignore "already exists" errors for idempotency
        if (err.code === '42P07' || err.code === '42710' || err.message?.includes('already exists')) {
          console.log('  (already exists, skipping)');
        } else {
          throw error;
        }
      }
    }

    console.log('\n✓ Migration complete!');

    // Verify tables exist
    const tables = await sql.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' ORDER BY table_name');
    // Neon serverless returns rows directly from query()
    console.log('\nTables created:', (tables as Array<{ table_name: string }>).map((t) => t.table_name).join(', '));

  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
