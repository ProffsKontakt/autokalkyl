import { prisma } from '@/lib/db/client';
import { Elomrade } from '@prisma/client';

/**
 * Calculate quarterly averages from hourly price data.
 * Day hours: 06:00-21:59 (hours 6-21)
 * Night hours: 22:00-05:59 (hours 22-23, 0-5)
 */
export async function calculateQuarterlyAverages(
  elomrade: Elomrade,
  year: number,
  quarter: number
): Promise<{ success: boolean; error?: string }> {
  // Calculate date range for quarter
  const startMonth = (quarter - 1) * 3; // Q1=0, Q2=3, Q3=6, Q4=9
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0); // Last day of quarter

  const prices = await prisma.electricityPrice.findMany({
    where: {
      elomrade,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  if (prices.length === 0) {
    return { success: false, error: 'No price data for this period' };
  }

  // Split into day (6-21) and night (22-23, 0-5) hours
  const dayPrices = prices.filter(p => p.hour >= 6 && p.hour < 22);
  const nightPrices = prices.filter(p => p.hour < 6 || p.hour >= 22);

  const avg = (arr: typeof prices) =>
    arr.length > 0
      ? arr.reduce((sum, p) => sum + Number(p.priceOre), 0) / arr.length
      : 0;

  const avgDayPriceOre = avg(dayPrices);
  const avgNightPriceOre = avg(nightPrices);
  const avgPriceOre = avg(prices);

  await prisma.electricityPriceQuarterly.upsert({
    where: {
      elomrade_year_quarter: { elomrade, year, quarter },
    },
    update: {
      avgDayPriceOre,
      avgNightPriceOre,
      avgPriceOre,
    },
    create: {
      elomrade,
      year,
      quarter,
      avgDayPriceOre,
      avgNightPriceOre,
      avgPriceOre,
    },
  });

  return { success: true };
}

/**
 * Get quarterly averages for display.
 * Returns last 4 quarters for a given elomrade.
 */
export async function getQuarterlyAveragesForElomrade(elomrade: Elomrade, count = 4) {
  return prisma.electricityPriceQuarterly.findMany({
    where: { elomrade },
    orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    take: count,
  });
}

/**
 * Get all quarterly averages for all elomraden.
 * Returns most recent quarter's data for each area.
 */
export async function getLatestQuarterlyAverages() {
  const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];
  const results: Record<Elomrade, { avgDayPriceOre: number; avgNightPriceOre: number; avgPriceOre: number; year: number; quarter: number } | null> = {
    SE1: null,
    SE2: null,
    SE3: null,
    SE4: null,
  };

  for (const area of areas) {
    const latest = await prisma.electricityPriceQuarterly.findFirst({
      where: { elomrade: area },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });
    if (latest) {
      results[area] = {
        avgDayPriceOre: Number(latest.avgDayPriceOre),
        avgNightPriceOre: Number(latest.avgNightPriceOre),
        avgPriceOre: Number(latest.avgPriceOre),
        year: latest.year,
        quarter: latest.quarter,
      };
    }
  }

  return results;
}
