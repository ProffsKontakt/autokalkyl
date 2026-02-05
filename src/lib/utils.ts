import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format decimal as percentage with max precision, auto-trim trailing zeros
 * @param decimal - Value between 0 and 1 (e.g., 0.902 for 90.2%)
 * @param maxDecimals - Maximum decimal places (default: 2)
 * @returns Formatted string with % symbol (e.g., "90.2%")
 */
export function formatPercentage(decimal: number, maxDecimals = 2): string {
  const percentage = decimal * 100
  return `${parseFloat(percentage.toFixed(maxDecimals))}%`
}
