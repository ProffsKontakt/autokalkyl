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

/**
 * Seed default natagare for an organization.
 * Ellevio rates are verified from research.
 * Vattenfall/E.ON rates are placeholders with "(verifiera priser)" in name.
 */
async function seedDefaultNatagareForOrg(orgId: string) {
  const DEFAULT_NATAGARE = [
    {
      name: 'Ellevio',
      dayRateSekKw: 81.25,
      nightRateSekKw: 40.625, // Half of day rate
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
    {
      name: 'Vattenfall Eldistribution (verifiera priser)',
      dayRateSekKw: 75.0,
      nightRateSekKw: 37.5,
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
    {
      name: 'E.ON Energidistribution (verifiera priser)',
      dayRateSekKw: 70.0,
      nightRateSekKw: 35.0,
      dayStartHour: 6,
      dayEndHour: 22,
      isDefault: true,
      isActive: true,
    },
  ];

  console.log(`  Seeding default natagare for org: ${orgId}`);

  for (const natagare of DEFAULT_NATAGARE) {
    await prisma.natagare.upsert({
      where: { orgId_name: { orgId, name: natagare.name } },
      update: {},
      create: { ...natagare, orgId },
    });
  }

  console.log(`  Created ${DEFAULT_NATAGARE.length} default natagare`);
}

/**
 * Seed quarterly electricity price averages for all zones.
 * Uses realistic Swedish spot prices for current quarter.
 */
async function seedQuarterlyElectricityPrices() {
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;

  // Realistic Swedish electricity prices (öre/kWh)
  // SE3/SE4 typically higher than SE1/SE2 due to transmission constraints
  const QUARTERLY_PRICES = [
    { elomrade: 'SE1', avgDayPriceOre: 45.50, avgNightPriceOre: 32.00, avgPriceOre: 40.00 },
    { elomrade: 'SE2', avgDayPriceOre: 48.00, avgNightPriceOre: 34.50, avgPriceOre: 42.50 },
    { elomrade: 'SE3', avgDayPriceOre: 85.00, avgNightPriceOre: 52.00, avgPriceOre: 72.00 },
    { elomrade: 'SE4', avgDayPriceOre: 92.00, avgNightPriceOre: 58.00, avgPriceOre: 78.00 },
  ];

  console.log(`Seeding quarterly electricity prices for Q${quarter} ${year}...`);

  for (const price of QUARTERLY_PRICES) {
    await prisma.electricityPriceQuarterly.upsert({
      where: {
        elomrade_year_quarter: {
          elomrade: price.elomrade as 'SE1' | 'SE2' | 'SE3' | 'SE4',
          year,
          quarter,
        },
      },
      update: {
        avgDayPriceOre: price.avgDayPriceOre,
        avgNightPriceOre: price.avgNightPriceOre,
        avgPriceOre: price.avgPriceOre,
      },
      create: {
        elomrade: price.elomrade as 'SE1' | 'SE2' | 'SE3' | 'SE4',
        year,
        quarter,
        avgDayPriceOre: price.avgDayPriceOre,
        avgNightPriceOre: price.avgNightPriceOre,
        avgPriceOre: price.avgPriceOre,
      },
    });
  }

  console.log(`  Created quarterly prices for ${QUARTERLY_PRICES.length} zones`);
}

/**
 * Seed battery brands and configurations for an organization.
 */
async function seedBatteriesForOrg(orgId: string) {
  console.log(`  Seeding batteries for org: ${orgId}`);

  // Create Emaldo brand
  const emaldo = await prisma.batteryBrand.upsert({
    where: { orgId_name: { orgId, name: 'Emaldo' } },
    update: {},
    create: {
      orgId,
      name: 'Emaldo',
    },
  });

  // Create battery configurations
  const BATTERY_CONFIGS = [
    {
      name: 'Power Store 5',
      capacityKwh: 5.12,
      maxDischargeKw: 5.0,
      maxChargeKw: 5.0,
      chargeEfficiency: 0.95,
      dischargeEfficiency: 0.95,
      warrantyYears: 10,
      guaranteedCycles: 6000,
      degradationPerYear: 0.02,
      costPrice: 35000,
    },
    {
      name: 'Power Store 10',
      capacityKwh: 10.24,
      maxDischargeKw: 10.0,
      maxChargeKw: 10.0,
      chargeEfficiency: 0.95,
      dischargeEfficiency: 0.95,
      warrantyYears: 10,
      guaranteedCycles: 6000,
      degradationPerYear: 0.02,
      costPrice: 65000,
    },
    {
      name: 'Power Store 15',
      capacityKwh: 15.36,
      maxDischargeKw: 15.0,
      maxChargeKw: 15.0,
      chargeEfficiency: 0.95,
      dischargeEfficiency: 0.95,
      warrantyYears: 10,
      guaranteedCycles: 6000,
      degradationPerYear: 0.02,
      costPrice: 90000,
    },
  ];

  for (const config of BATTERY_CONFIGS) {
    await prisma.batteryConfig.upsert({
      where: { orgId_brandId_name: { orgId, brandId: emaldo.id, name: config.name } },
      update: {},
      create: {
        orgId,
        brandId: emaldo.id,
        ...config,
        isActive: true,
      },
    });
  }

  console.log(`  Created ${BATTERY_CONFIGS.length} battery configurations`);
}

async function main() {
  console.log('Seeding database...');

  // Seed global electricity prices first
  await seedQuarterlyElectricityPrices();

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

  // Seed default natagare for test org
  await seedDefaultNatagareForOrg(testOrg.id);

  // Seed batteries for test org
  await seedBatteriesForOrg(testOrg.id);

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
      installerFixedCut: 23000, // Fixed SEK amount to installer
      marginAlertThreshold: 24000, // Min margin in SEK before alert
    },
  });
  console.log('Created ProffsKontakt org:', proffsOrg.slug);

  // Seed default natagare for ProffsKontakt org
  await seedDefaultNatagareForOrg(proffsOrg.id);

  // Seed batteries for ProffsKontakt org
  await seedBatteriesForOrg(proffsOrg.id);

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
