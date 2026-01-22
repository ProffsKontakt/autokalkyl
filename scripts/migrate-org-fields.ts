// Migration: Update organization fields for margin calculation
import { neon, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

const migrationStatements = [
  // Rename partnerCutPercent to installerFixedCut and change precision
  `ALTER TABLE "Organization" DROP COLUMN IF EXISTS "partnerCutPercent"`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "installerFixedCut" DECIMAL(10,2)`,
  // Update marginAlertThreshold precision
  `ALTER TABLE "Organization" ALTER COLUMN "marginAlertThreshold" TYPE DECIMAL(10,2)`,
];

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  console.log('Running migration for organization fields...');
  const sql = neon(connectionString);

  try {
    for (let i = 0; i < migrationStatements.length; i++) {
      const stmt = migrationStatements[i];
      console.log('[' + (i + 1) + '/' + migrationStatements.length + '] ' + stmt.substring(0, 60) + '...');
      try {
        await sql.query(stmt);
      } catch (error: unknown) {
        const err = error as { code?: string; message?: string };
        if (err.message?.includes('already exists') || err.message?.includes('does not exist')) {
          console.log('  (already applied, skipping)');
        } else {
          throw error;
        }
      }
    }
    console.log('\n✓ Migration complete!');
  } catch (error) {
    console.error('✗ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
