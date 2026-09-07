import { describe, expect, it } from "vitest";
import { buildReceiptWhere } from "@/lib/receipts/queries";

const USER = "user_123";

describe("buildReceiptWhere", () => {
  it("always scopes to the user and excludes trashed receipts by default", () => {
    expect(buildReceiptWhere(USER, {})).toEqual({ userId: USER, deletedAt: null });
    expect(buildReceiptWhere(USER, { status: "all" })).toEqual({ userId: USER, deletedAt: null });
  });

  it("shows only trashed receipts for the trash view", () => {
    const where = buildReceiptWhere(USER, { status: "trash" });
    expect(where.userId).toBe(USER);
    expect(where.deletedAt).toEqual({ not: null });
    expect(where.status).toBeUndefined();
  });

  it("limits the review view to receipts that need attention", () => {
    const where = buildReceiptWhere(USER, { status: "needs_review" });
    expect(where.deletedAt).toBeNull();
    expect(where.status).toEqual({ in: ["NEEDS_REVIEW", "FAILED"] });
  });

  it("filters by category", () => {
    expect(buildReceiptWhere(USER, { category: "Elektronik" }).category).toBe("Elektronik");
    expect(buildReceiptWhere(USER, { category: "" }).category).toBeUndefined();
  });

  it("builds an inclusive purchase date range", () => {
    const both = buildReceiptWhere(USER, { from: "2026-01-01", to: "2026-01-31" });
    expect(both.purchaseDate).toEqual({ gte: new Date("2026-01-01"), lte: new Date("2026-01-31") });

    const fromOnly = buildReceiptWhere(USER, { from: "2026-01-01" });
    expect(fromOnly.purchaseDate).toEqual({ gte: new Date("2026-01-01") });

    const toOnly = buildReceiptWhere(USER, { to: "2026-12-31" });
    expect(toOnly.purchaseDate).toEqual({ lte: new Date("2026-12-31") });

    expect(buildReceiptWhere(USER, {}).purchaseDate).toBeUndefined();
  });

  it("turns each search term into a case-insensitive OR across the searchable fields", () => {
    const where = buildReceiptWhere(USER, { q: "  Elgiganten   tv " });
    expect(Array.isArray(where.AND)).toBe(true);
    const and = where.AND as { OR: unknown[] }[];
    expect(and).toHaveLength(2);

    const first = and[0].OR;
    expect(first).toContainEqual({ title: { contains: "Elgiganten", mode: "insensitive" } });
    expect(first).toContainEqual({ merchantName: { contains: "Elgiganten", mode: "insensitive" } });
    expect(first).toContainEqual({ ocrText: { contains: "Elgiganten", mode: "insensitive" } });
    expect(first).toContainEqual({ receiptNumber: { contains: "Elgiganten", mode: "insensitive" } });
    expect(first).toContainEqual({ tags: { has: "Elgiganten" } });
    expect(first).toContainEqual({
      items: {
        some: {
          OR: [
            { name: { contains: "Elgiganten", mode: "insensitive" } },
            { brand: { contains: "Elgiganten", mode: "insensitive" } },
            { model: { contains: "Elgiganten", mode: "insensitive" } },
            { articleNumber: { contains: "Elgiganten", mode: "insensitive" } },
            { serialNumber: { contains: "Elgiganten", mode: "insensitive" } },
          ],
        },
      },
    });
    expect(and[1].OR).toContainEqual({ title: { contains: "tv", mode: "insensitive" } });
  });

  it("ignores empty queries and caps the number of terms at six", () => {
    expect(buildReceiptWhere(USER, { q: "   " }).AND).toBeUndefined();
    expect(buildReceiptWhere(USER, { q: undefined }).AND).toBeUndefined();
    const many = buildReceiptWhere(USER, { q: "a b c d e f g h" });
    expect(many.AND).toHaveLength(6);
  });

  it("combines every filter into one where clause", () => {
    const where = buildReceiptWhere(USER, { status: "needs_review", category: "Kläder", from: "2026-03-01", q: "jacka" });
    expect(where).toMatchObject({
      userId: USER,
      deletedAt: null,
      status: { in: ["NEEDS_REVIEW", "FAILED"] },
      category: "Kläder",
      purchaseDate: { gte: new Date("2026-03-01") },
    });
    expect(where.AND).toHaveLength(1);
  });
});
