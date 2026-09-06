import { describe, expect, it } from "vitest";
import { cn, daysUntil, formatBytes, formatDate, formatDateTime, formatMoney, toISODate, toNumber, truncate } from "@/lib/utils";

/** Intl uses non-breaking (U+00A0) or narrow (U+202F) spaces; accept any of them. */
const SP = "[\\s\\u00a0\\u202f]";

function shiftDays(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

describe("formatMoney", () => {
  it("formats SEK the Swedish way with a thin-space thousands separator and kr", () => {
    expect(formatMoney(1299)).toMatch(new RegExp(`^1${SP}299${SP}kr$`));
    expect(formatMoney(1299.5)).toMatch(new RegExp(`^1${SP}299,5${SP}kr$`));
    expect(formatMoney(1299.55)).toMatch(new RegExp(`^1${SP}299,55${SP}kr$`));
    expect(formatMoney(49)).toMatch(new RegExp(`^49${SP}kr$`));
    expect(formatMoney(0)).toMatch(new RegExp(`^0${SP}kr$`));
  });

  it("rounds to at most two decimals", () => {
    expect(formatMoney(19.999)).toMatch(new RegExp(`^20${SP}kr$`));
    expect(formatMoney(0.125)).toMatch(new RegExp(`^0,1[23]${SP}kr$`));
  });

  it("accepts numeric strings", () => {
    expect(formatMoney("199")).toMatch(new RegExp(`^199${SP}kr$`));
    expect(formatMoney("1299.5")).toMatch(new RegExp(`^1${SP}299,5${SP}kr$`));
  });

  it("uses a proper minus sign for negative amounts", () => {
    expect(formatMoney(-1299)).toMatch(new RegExp(`^[-\\u2212]1${SP}299${SP}kr$`));
  });

  it("shows a dash for missing or invalid values", () => {
    expect(formatMoney(null)).toBe("–");
    expect(formatMoney(undefined)).toBe("–");
    expect(formatMoney("")).toBe("–");
    expect(formatMoney("abc")).toBe("–");
    expect(formatMoney(Number.NaN)).toBe("–");
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe("–");
  });

  it("formats other currencies with Intl and falls back for invalid codes", () => {
    const eur = formatMoney(10, "EUR");
    expect(eur).toContain("€");
    expect(eur).toMatch(/10/);
    expect(formatMoney(1234.5, "USD")).toMatch(new RegExp(`1${SP}234,50`));
    expect(formatMoney(10, "kr")).toBe("10.00 kr");
  });
});

describe("toNumber", () => {
  it("parses Swedish formatted amounts", () => {
    expect(toNumber("1 299,50")).toBe(1299.5);
    expect(toNumber("1 299,50")).toBe(1299.5);
    expect(toNumber("1299.50")).toBe(1299.5);
    expect(toNumber(" 49 ")).toBe(49);
    expect(toNumber("-12,5")).toBe(-12.5);
  });

  it("passes numbers through and rejects non-finite values", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(0)).toBe(0);
    expect(toNumber(Number.NaN)).toBeNull();
    expect(toNumber(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("handles Prisma Decimal-like objects", () => {
    expect(toNumber({ toNumber: () => 12.5 })).toBe(12.5);
    expect(toNumber({ toNumber: () => Number.NaN })).toBeNull();
  });

  it("returns null for null, undefined, garbage and unsupported types", () => {
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("12 kr")).toBeNull();
    expect(toNumber(true)).toBeNull();
    expect(toNumber({})).toBeNull();
  });
});

describe("daysUntil", () => {
  it("counts whole days from today, ignoring the time of day", () => {
    expect(daysUntil(new Date())).toBe(0);
    expect(daysUntil(shiftDays(1))).toBe(1);
    expect(daysUntil(shiftDays(-1))).toBe(-1);
    expect(daysUntil(shiftDays(10))).toBe(10);
    const lateTonight = new Date();
    lateTonight.setHours(23, 59, 0, 0);
    expect(daysUntil(lateTonight)).toBe(0);
  });

  it("accepts ISO strings", () => {
    const target = shiftDays(30);
    target.setHours(12, 0, 0, 0);
    expect(daysUntil(target.toISOString())).toBe(30);
  });

  it("returns null for missing or invalid dates", () => {
    expect(daysUntil(null)).toBeNull();
    expect(daysUntil(undefined)).toBeNull();
    expect(daysUntil("inte ett datum")).toBeNull();
  });
});

describe("formatDate / formatDateTime / toISODate", () => {
  it("formats dates in Swedish", () => {
    const date = new Date("2026-09-06T12:00:00Z");
    expect(formatDate(date)).toMatch(/^6 sep\.? 2026$/);
    expect(formatDate("2026-09-06")).toMatch(/2026/);
    expect(formatDateTime(date)).toMatch(/2026/);
    expect(formatDateTime(date)).toMatch(/\d{2}:\d{2}/);
  });

  it("returns a dash for missing or invalid dates", () => {
    expect(formatDate(null)).toBe("–");
    expect(formatDate("nope")).toBe("–");
    expect(formatDateTime(undefined)).toBe("–");
  });

  it("produces YYYY-MM-DD for inputs and exports", () => {
    expect(toISODate(new Date("2026-09-06T12:00:00Z"))).toBe("2026-09-06");
    expect(toISODate("2026-01-02T00:00:00Z")).toBe("2026-01-02");
    expect(toISODate(null)).toBe("");
    expect(toISODate("nope")).toBe("");
  });
});

describe("formatBytes", () => {
  it("picks a sensible unit", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 kB");
    expect(formatBytes(1536 * 1024)).toBe("1.5 MB");
  });
});

describe("truncate", () => {
  it("keeps short strings and shortens long ones with an ellipsis", () => {
    expect(truncate("kort", 10)).toBe("kort");
    expect(truncate("exakt tio!", 10)).toBe("exakt tio!");
    const long = truncate("Det här är en ganska lång titel på ett kvitto", 12);
    expect(long.endsWith("…")).toBe(true);
    expect(long.length).toBeLessThanOrEqual(12);
    expect(long).toBe("Det här är…");
  });
});

describe("cn", () => {
  it("merges conditional classes and resolves Tailwind conflicts", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-ink-900", false && "hidden", undefined, "font-bold")).toBe("text-ink-900 font-bold");
    expect(cn(["rounded-xl", { "bg-white": true, "bg-black": false }])).toBe("rounded-xl bg-white");
  });
});
