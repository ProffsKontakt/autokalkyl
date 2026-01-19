// Verify tables were created
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

neonConfig.webSocketConstructor = ws;

async function verifyTables() {
  const connectionString = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  try {
    // Try to count organizations (should be 0)
    const orgCount = await prisma.organization.count();
    console.log('✓ Organization table exists, count:', orgCount);

    // Try to count users (should be 0)
    const userCount = await prisma.user.count();
    console.log('✓ User table exists, count:', userCount);

    // Try to count sessions (should be 0)
    const sessionCount = await prisma.session.count();
    console.log('✓ Session table exists, count:', sessionCount);

    console.log('\n✓ All tables verified! Database is ready.');

  } catch (error) {
    console.error('✗ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyTables();
