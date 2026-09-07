import { describe, expect, it } from "vitest";
import {
  LEGAL_CLAIM_YEARS_BUSINESS,
  LEGAL_CLAIM_YEARS_PRIVATE,
  RETENTION_YEARS,
  coverageStatus,
  legalClaimDeadline,
  retentionUntil,
  returnDeadline,
  warrantyExpiry,
} from "@/lib/receipts/warranty";

/** Noon UTC so that a DST shift in the host time zone can never move the calendar date. */
function utc(iso: string): Date {
  return new Date(`${iso}T12:00:00.000Z`);
}

function isoDate(date: Date | null): string | null {
  return date ? date.toISOString().slice(0, 10) : null;
}

const PURCHASE = utc("2024-01-15");

describe("constants", () => {
  it("reflects Swedish consumer law", () => {
    expect(LEGAL_CLAIM_YEARS_PRIVATE).toBe(3);
    expect(LEGAL_CLAIM_YEARS_BUSINESS).toBe(2);
    expect(RETENTION_YEARS).toBe(7);
  });
});

describe("legalClaimDeadline", () => {
  it("gives private customers three years of reklamationsrätt", () => {
    expect(isoDate(legalClaimDeadline(PURCHASE, "PRIVATE"))).toBe("2027-01-15");
  });

  it("defaults to the private rules", () => {
    expect(isoDate(legalClaimDeadline(PURCHASE))).toBe("2027-01-15");
  });

  it("gives businesses two years", () => {
    expect(isoDate(legalClaimDeadline(PURCHASE, "BUSINESS"))).toBe("2026-01-15");
  });

  it("returns null without a purchase date", () => {
    expect(legalClaimDeadline(null)).toBeNull();
    expect(legalClaimDeadline(undefined, "BUSINESS")).toBeNull();
  });
});

describe("warrantyExpiry", () => {
  it("adds the warranty months to the purchase date", () => {
    expect(isoDate(warrantyExpiry(PURCHASE, 24))).toBe("2026-01-15");
    expect(isoDate(warrantyExpiry(utc("2024-01-31"), 1))).toBe("2024-02-29");
  });

  it("returns null for missing or non-positive warranties", () => {
    expect(warrantyExpiry(PURCHASE, null)).toBeNull();
    expect(warrantyExpiry(PURCHASE, undefined)).toBeNull();
    expect(warrantyExpiry(PURCHASE, 0)).toBeNull();
    expect(warrantyExpiry(PURCHASE, -6)).toBeNull();
    expect(warrantyExpiry(null, 24)).toBeNull();
  });
});

describe("returnDeadline", () => {
  it("adds the number of days of öppet köp", () => {
    expect(isoDate(returnDeadline(PURCHASE, 30))).toBe("2024-02-14");
    expect(isoDate(returnDeadline(utc("2024-12-25"), 14))).toBe("2025-01-08");
  });

  it("returns null when there is no return window", () => {
    expect(returnDeadline(PURCHASE, 0)).toBeNull();
    expect(returnDeadline(PURCHASE, null)).toBeNull();
    expect(returnDeadline(null, 30)).toBeNull();
  });
});

describe("retentionUntil", () => {
  it("keeps receipts for seven years from the purchase date", () => {
    expect(isoDate(retentionUntil(PURCHASE))).toBe("2031-01-15");
  });

  it("falls back to the given date when the purchase date is unknown", () => {
    expect(isoDate(retentionUntil(null, utc("2026-09-06")))).toBe("2033-09-06");
    expect(isoDate(retentionUntil(undefined, utc("2020-02-29")))).toBe("2027-02-28");
  });

  it("falls back to today by default", () => {
    const before = new Date();
    const until = retentionUntil(null);
    const after = new Date();
    expect(until.getTime()).toBeGreaterThanOrEqual(before.getTime() + RETENTION_YEARS * 365 * 86_400_000);
    expect(until.getTime()).toBeLessThanOrEqual(after.getTime() + (RETENTION_YEARS * 365 + 2) * 86_400_000);
  });
});

describe("coverageStatus", () => {
  it("is unknown without a purchase date or warranty", () => {
    expect(coverageStatus(null, null)).toEqual({ status: "unknown", until: null, kind: null, daysLeft: null });
  });

  it("is active while the legal claim period has plenty of time left", () => {
    const now = utc("2024-02-15");
    const result = coverageStatus(PURCHASE, null, "PRIVATE", now);
    expect(result.status).toBe("active");
    expect(result.kind).toBe("legal");
    expect(isoDate(result.until)).toBe("2027-01-15");
    expect(result.daysLeft).toBe(1065);
  });

  it("is expiring when 60 days or fewer remain", () => {
    const sixty = coverageStatus(PURCHASE, null, "PRIVATE", utc("2026-11-16"));
    expect(sixty.daysLeft).toBe(60);
    expect(sixty.status).toBe("expiring");

    const one = coverageStatus(PURCHASE, null, "PRIVATE", utc("2027-01-14"));
    expect(one.daysLeft).toBe(1);
    expect(one.status).toBe("expiring");

    const today = coverageStatus(PURCHASE, null, "PRIVATE", utc("2027-01-15"));
    expect(today.daysLeft).toBe(0);
    expect(today.status).toBe("expiring");
  });

  it("is still active at 61 days", () => {
    const result = coverageStatus(PURCHASE, null, "PRIVATE", utc("2026-11-15"));
    expect(result.daysLeft).toBe(61);
    expect(result.status).toBe("active");
  });

  it("is expired once the deadline has passed", () => {
    const result = coverageStatus(PURCHASE, null, "PRIVATE", utc("2028-03-01"));
    expect(result.status).toBe("expired");
    expect(result.kind).toBe("legal");
    expect(result.daysLeft).toBeLessThan(0);
  });

  it("uses the two-year period for business accounts", () => {
    const result = coverageStatus(PURCHASE, null, "BUSINESS", utc("2024-02-15"));
    expect(isoDate(result.until)).toBe("2026-01-15");
    expect(result.kind).toBe("legal");
  });

  it("lets the longest coverage win – a long warranty beats the legal period", () => {
    const fiveYearWarranty = utc("2029-01-15");
    const result = coverageStatus(PURCHASE, fiveYearWarranty, "PRIVATE", utc("2024-02-15"));
    expect(result.kind).toBe("warranty");
    expect(isoDate(result.until)).toBe("2029-01-15");
    expect(result.status).toBe("active");
  });

  it("lets the longest coverage win – the legal period beats a short warranty", () => {
    const oneYearWarranty = utc("2025-01-15");
    const result = coverageStatus(PURCHASE, oneYearWarranty, "PRIVATE", utc("2025-06-01"));
    expect(result.kind).toBe("legal");
    expect(isoDate(result.until)).toBe("2027-01-15");
    expect(result.status).toBe("active");
  });

  it("uses the warranty alone when the purchase date is unknown", () => {
    const warranty = utc("2026-10-01");
    const result = coverageStatus(null, warranty, "PRIVATE", utc("2026-09-06"));
    expect(result).toEqual({ status: "expiring", until: warranty, kind: "warranty", daysLeft: 25 });
  });
});
