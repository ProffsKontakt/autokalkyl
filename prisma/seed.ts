import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { neonConfig } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Enable WebSocket for Node.js
import ws from 'ws';
neonConfig.webSocketConstructor = ws;

// Use Neon adapter (port 5432 blocked, use serverless driver)
const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create Super Admin
  const superAdminPassword = await bcrypt.hash('superadmin123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@kalkyla.se' },
    update: {},
    create: {
      email: 'admin@kalkyla.se',
      name: 'Super Admin',
      passwordHash: superAdminPassword,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });
  console.log('Created Super Admin:', superAdmin.email);

  // Create a test organization
  const testOrg = await prisma.organization.upsert({
    where: { slug: 'test-solar' },
    update: {},
    create: {
      name: 'Test Solar AB',
      slug: 'test-solar',
      primaryColor: '#3B82F6',
      secondaryColor: '#1E40AF',
      isProffsKontaktAffiliated: false,
    },
  });
  console.log('Created test organization:', testOrg.slug);

  // Create Org Admin for test org
  const orgAdminPassword = await bcrypt.hash('orgadmin123', 12);
  const orgAdmin = await prisma.user.upsert({
    where: { email: 'admin@test-solar.se' },
    update: {},
    create: {
      email: 'admin@test-solar.se',
      name: 'Test Org Admin',
      passwordHash: orgAdminPassword,
      role: 'ORG_ADMIN',
      orgId: testOrg.id,
      isActive: true,
    },
  });
  console.log('Created Org Admin:', orgAdmin.email);

  // Create Closer for test org
  const closerPassword = await bcrypt.hash('closer123', 12);
  const closer = await prisma.user.upsert({
    where: { email: 'closer@test-solar.se' },
    update: {},
    create: {
      email: 'closer@test-solar.se',
      name: 'Test Closer',
      passwordHash: closerPassword,
      role: 'CLOSER',
      orgId: testOrg.id,
      isActive: true,
    },
  });
  console.log('Created Closer:', closer.email);

  // Create a ProffsKontakt-affiliated org
  const proffsOrg = await prisma.organization.upsert({
    where: { slug: 'proffs-partner' },
    update: {},
    create: {
      name: 'ProffsKontakt Partner AB',
      slug: 'proffs-partner',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      isProffsKontaktAffiliated: true,
      partnerCutPercent: 15,
      marginAlertThreshold: 20,
    },
  });
  console.log('Created ProffsKontakt org:', proffsOrg.slug);

  console.log('Seeding complete!');
  console.log('');
  console.log('Test accounts:');
  console.log('  Super Admin: admin@kalkyla.se / superadmin123');
  console.log('  Org Admin:   admin@test-solar.se / orgadmin123');
  console.log('  Closer:      closer@test-solar.se / closer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
