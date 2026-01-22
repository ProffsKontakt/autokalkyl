'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth/auth';
import { hasPermission, PERMISSIONS, Role } from '@/lib/auth/permissions';
import { fetchAndStorePrices } from '@/lib/electricity/fetch-prices';
import { calculateQuarterlyAverages, getLatestQuarterlyAverages, getQuarterlyAveragesForElomrade } from '@/lib/electricity/quarterly-averages';
import { Elomrade } from '@prisma/client';

/**
 * Get quarterly prices for display in calculation builder.
 * Requires ELPRICES_VIEW permission.
 */
export async function getQuarterlyPrices() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.ELPRICES_VIEW)) {
    return { error: 'Du har inte behörighet' };
  }

  try {
    const prices = await getLatestQuarterlyAverages();
    return { prices };
  } catch (error) {
    console.error('Failed to get quarterly prices:', error);
    return { error: 'Kunde inte hämta elpriser' };
  }
}

/**
 * Get historical quarterly prices for a specific elomrade.
 */
export async function getQuarterlyPricesForArea(elomrade: Elomrade, count = 8) {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.ELPRICES_VIEW)) {
    return { error: 'Du har inte behörighet' };
  }

  try {
    const prices = await getQuarterlyAveragesForElomrade(elomrade, count);
    return { prices: prices.map(p => ({
      year: p.year,
      quarter: p.quarter,
      avgDayPriceOre: Number(p.avgDayPriceOre),
      avgNightPriceOre: Number(p.avgNightPriceOre),
      avgPriceOre: Number(p.avgPriceOre),
    })) };
  } catch (error) {
    console.error('Failed to get quarterly prices:', error);
    return { error: 'Kunde inte hämta elpriser' };
  }
}

/**
 * Fetch prices for today (can be called by automated job).
 * Requires ELPRICES_MANAGE permission.
 */
export async function fetchTodaysPrices() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.ELPRICES_MANAGE)) {
    return { error: 'Du har inte behörighet' };
  }

  const result = await fetchAndStorePrices(new Date());

  if (result.success) {
    revalidatePath('/dashboard/electricity');
    return { success: true, count: result.count };
  }

  return { error: result.error || 'Kunde inte hämta elpriser' };
}

/**
 * Recalculate quarterly averages for current quarter.
 * Requires ELPRICES_MANAGE permission.
 */
export async function recalculateQuarterlyAverages() {
  const session = await auth();
  if (!session?.user) {
    return { error: 'Ej inloggad' };
  }

  const role = session.user.role as Role;
  if (!hasPermission(role, PERMISSIONS.ELPRICES_MANAGE)) {
    return { error: 'Du har inte behörighet' };
  }

  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.floor(now.getMonth() / 3) + 1;

  const areas: Elomrade[] = ['SE1', 'SE2', 'SE3', 'SE4'];
  const results = [];

  for (const area of areas) {
    const result = await calculateQuarterlyAverages(area, year, quarter);
    results.push({ area, ...result });
  }

  revalidatePath('/dashboard/electricity');

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    return { error: `Misslyckades för: ${failures.map(f => f.area).join(', ')}` };
  }

  return { success: true };
}
