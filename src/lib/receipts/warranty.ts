import { addMonths, addYears, addDays } from "date-fns";

/** Konsumentköplagen (2022:260): 3 års reklamationsrätt för privatpersoner. */
export const LEGAL_CLAIM_YEARS_PRIVATE = 3;
/** Köplagen: 2 år för näringsidkare. */
export const LEGAL_CLAIM_YEARS_BUSINESS = 2;
/** Bokföringslagen: verifikationer sparas i 7 år. */
export const RETENTION_YEARS = 7;

export function legalClaimDeadline(purchaseDate: Date | null | undefined, accountType: "PRIVATE" | "BUSINESS" = "PRIVATE"): Date | null {
  if (!purchaseDate) return null;
  return addYears(purchaseDate, accountType === "BUSINESS" ? LEGAL_CLAIM_YEARS_BUSINESS : LEGAL_CLAIM_YEARS_PRIVATE);
}

export function warrantyExpiry(purchaseDate: Date | null | undefined, warrantyMonths: number | null | undefined): Date | null {
  if (!purchaseDate || !warrantyMonths || warrantyMonths <= 0) return null;
  return addMonths(purchaseDate, warrantyMonths);
}

export function returnDeadline(purchaseDate: Date | null | undefined, returnDays: number | null | undefined): Date | null {
  if (!purchaseDate || !returnDays || returnDays <= 0) return null;
  return addDays(purchaseDate, returnDays);
}

export function retentionUntil(purchaseDate: Date | null | undefined, fallback: Date = new Date()): Date {
  return addYears(purchaseDate ?? fallback, RETENTION_YEARS);
}

export type CoverageStatus = "active" | "expiring" | "expired" | "unknown";

/** Combined coverage status: warranty if present, otherwise legal claim right. */
export function coverageStatus(
  purchaseDate: Date | null | undefined,
  warrantyExpiresAt: Date | null | undefined,
  accountType: "PRIVATE" | "BUSINESS" = "PRIVATE",
  now: Date = new Date(),
): { status: CoverageStatus; until: Date | null; kind: "warranty" | "legal" | null; daysLeft: number | null } {
  const legal = legalClaimDeadline(purchaseDate, accountType);
  const candidates: { until: Date; kind: "warranty" | "legal" }[] = [];
  if (warrantyExpiresAt) candidates.push({ until: warrantyExpiresAt, kind: "warranty" });
  if (legal) candidates.push({ until: legal, kind: "legal" });
  if (!candidates.length) return { status: "unknown", until: null, kind: null, daysLeft: null };
  // The longest coverage wins (rights are cumulative)
  candidates.sort((a, b) => b.until.getTime() - a.until.getTime());
  const best = candidates[0];
  const daysLeft = Math.round((best.until.getTime() - now.getTime()) / 86_400_000);
  const status: CoverageStatus = daysLeft < 0 ? "expired" : daysLeft <= 60 ? "expiring" : "active";
  return { status, until: best.until, kind: best.kind, daysLeft };
}
