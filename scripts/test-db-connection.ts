// Test script to verify Neon database connection via serverless driver
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import 'dotenv/config';

// Enable WebSocket for Node.js
neonConfig.webSocketConstructor = ws;

async function testConnection() {
  const connString = process.env.DATABASE_URL;
  console.log('Testing Neon connection via serverless driver...');
  console.log('Connection string exists:', !!connString);
  console.log('Connection string (redacted):', connString?.replace(/:[^:@]+@/, ':****@'));

  if (!connString) {
    console.error('DATABASE_URL not set!');
    process.exit(1);
  }

  // Prisma 7 pattern: pass connectionString directly to adapter
  const adapter = new PrismaNeon({ connectionString: connString });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Attempting Prisma query...');
    const result = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✓ Prisma connection successful!');
    console.log('Result:', result);

    // Check existing tables
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    ` as Array<{ table_name: string }>;
    console.log('Existing tables:', tables.length === 0 ? 'None (empty database)' : tables.map(t => t.table_name));

  } catch (error) {
    console.error('✗ Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
