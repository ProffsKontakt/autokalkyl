import { prisma } from '@/lib/db/client';
import { Elomrade } from '@prisma/client';
import { MgreyResponse } from './types';

const MGREY_API_URL = 'https://mgrey.se/espot';

/**
 * Fetch electricity prices for a specific date from mgrey.se API.
 * Stores prices in the database (upserts to handle re-runs).
 *
 * @param date - Date to fetch prices for
 * @returns Number of price records stored
 */
export async function fetchAndStorePrices(date: Date): Promise<{ success: boolean; count?: number; error?: string }> {
  const dateStr = date.toISOString().split('T')[0];

  try {
    const response = await fetch(`${MGREY_API_URL}?format=json&date=${dateStr}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }

    const data: MgreyResponse = await response.json();

    // Check if data has expected structure
    if (!data.SE1 || !Array.isArray(data.SE1)) {
      return { success: false, error: 'Invalid API response format' };
    }

    const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];
    const records = areas.flatMap(area =>
      data[area].map(price => ({
        elomrade: area,
        date: new Date(data.date),
        hour: price.hour,
        priceOre: price.price_sek, // mgrey.se returns ore/kWh despite "price_sek" name
      }))
    );

    // Upsert all records in a transaction
    await prisma.$transaction(
      records.map(record =>
        prisma.electricityPrice.upsert({
          where: {
            elomrade_date_hour: {
              elomrade: record.elomrade,
              date: record.date,
              hour: record.hour,
            },
          },
          update: { priceOre: record.priceOre },
          create: record,
        })
      )
    );

    return { success: true, count: records.length };
  } catch (error) {
    console.error('Failed to fetch electricity prices:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Fetch prices for a date range (backfill).
 * Fetches one day at a time with a small delay to be respectful to the API.
 */
export async function fetchPricesForDateRange(
  startDate: Date,
  endDate: Date,
  onProgress?: (date: Date, result: { success: boolean; count?: number; error?: string }) => void
): Promise<{ totalDays: number; successfulDays: number; totalRecords: number }> {
  const results = {
    totalDays: 0,
    successfulDays: 0,
    totalRecords: 0,
  };

  const current = new Date(startDate);
  while (current <= endDate) {
    results.totalDays++;

    const result = await fetchAndStorePrices(new Date(current));

    if (result.success) {
      results.successfulDays++;
      results.totalRecords += result.count || 0;
    }

    if (onProgress) {
      onProgress(new Date(current), result);
    }

    // Move to next day
    current.setDate(current.getDate() + 1);

    // Small delay to be respectful to the API (100ms)
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Get stored prices for a specific date and elomrade.
 */
export async function getStoredPrices(elomrade: Elomrade, date: Date) {
  return prisma.electricityPrice.findMany({
    where: {
      elomrade,
      date,
    },
    orderBy: { hour: 'asc' },
  });
}
