/**
 * Backfill electricity prices from Nord Pool via mgrey.se API.
 *
 * Usage:
 *   npx tsx scripts/backfill-electricity.ts
 *   npx tsx scripts/backfill-electricity.ts --days 90
 *   npx tsx scripts/backfill-electricity.ts --from 2025-01-01 --to 2025-03-31
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { fetchPricesForDateRange } from '../src/lib/electricity/fetch-prices';
import { calculateQuarterlyAverages } from '../src/lib/electricity/quarterly-averages';
import { Elomrade } from '@prisma/client';

async function main() {
  const args = process.argv.slice(2);

  let startDate: Date;
  let endDate: Date = new Date();

  // Parse arguments
  const daysIndex = args.indexOf('--days');
  const fromIndex = args.indexOf('--from');
  const toIndex = args.indexOf('--to');

  if (daysIndex !== -1) {
    const days = parseInt(args[daysIndex + 1], 10) || 90;
    startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
  } else if (fromIndex !== -1) {
    startDate = new Date(args[fromIndex + 1]);
    if (toIndex !== -1) {
      endDate = new Date(args[toIndex + 1]);
    }
  } else {
    // Default: last 90 days (covers current quarter)
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
  }

  console.log(`\n🔌 Electricity Price Backfill`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`From: ${startDate.toISOString().split('T')[0]}`);
  console.log(`To:   ${endDate.toISOString().split('T')[0]}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  // Fetch prices
  console.log('📥 Fetching daily prices from Nord Pool...\n');

  let lastProgressLine = '';
  const result = await fetchPricesForDateRange(
    startDate,
    endDate,
    (date, res) => {
      const dateStr = date.toISOString().split('T')[0];
      const status = res.success ? '✓' : '✗';
      const msg = res.success ? `${res.count} records` : res.error;

      // Clear previous line and print new one
      if (lastProgressLine) {
        process.stdout.write('\r' + ' '.repeat(lastProgressLine.length) + '\r');
      }
      lastProgressLine = `  ${status} ${dateStr}: ${msg}`;
      process.stdout.write(lastProgressLine);
    }
  );

  // New line after progress
  console.log('\n');

  console.log(`📊 Fetch Summary:`);
  console.log(`   Total days:      ${result.totalDays}`);
  console.log(`   Successful:      ${result.successfulDays}`);
  console.log(`   Total records:   ${result.totalRecords}`);
  console.log('');

  // Calculate quarterly averages
  console.log('📈 Calculating quarterly averages...\n');

  const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];
  const quarters = getQuartersInRange(startDate, endDate);

  for (const { year, quarter } of quarters) {
    console.log(`   Q${quarter} ${year}:`);
    for (const area of areas) {
      const res = await calculateQuarterlyAverages(area, year, quarter);
      if (res.success) {
        console.log(`      ${area}: dag=${res.avgDay?.toFixed(1)} ore, natt=${res.avgNight?.toFixed(1)} ore`);
      } else {
        console.log(`      ${area}: ✗ ${res.error || 'No data'}`);
      }
    }
    console.log('');
  }

  console.log('✅ Backfill complete!\n');
}

function getQuartersInRange(start: Date, end: Date): { year: number; quarter: number }[] {
  const quarters: { year: number; quarter: number }[] = [];
  const seen = new Set<string>();

  const current = new Date(start);
  while (current <= end) {
    const year = current.getFullYear();
    const quarter = Math.floor(current.getMonth() / 3) + 1;
    const key = `${year}-${quarter}`;

    if (!seen.has(key)) {
      seen.add(key);
      quarters.push({ year, quarter });
    }

    current.setMonth(current.getMonth() + 1);
  }

  return quarters;
}

main().catch(console.error);
