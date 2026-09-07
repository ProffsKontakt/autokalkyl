import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { toNumber } from "@/lib/utils";
import { coverageStatus } from "./warranty";

export interface ReceiptListFilters {
  q?: string;
  category?: string;
  from?: string; // YYYY-MM-DD
  to?: string;
  status?: "all" | "needs_review" | "trash";
  sort?: "date_desc" | "date_asc" | "amount_desc" | "amount_asc";
  page?: number;
  pageSize?: number;
}

export const receiptListSelect = {
  id: true,
  status: true,
  source: true,
  title: true,
  merchantName: true,
  purchaseDate: true,
  totalAmount: true,
  currency: true,
  category: true,
  warrantyMonths: true,
  warrantyExpiresAt: true,
  returnDeadline: true,
  deletedAt: true,
  createdAt: true,
  processingError: true,
  files: { select: { id: true, kind: true, thumbnail: false }, orderBy: { position: "asc" as const }, take: 1 },
} satisfies Prisma.ReceiptSelect;

export type ReceiptListRow = Prisma.ReceiptGetPayload<{ select: typeof receiptListSelect }>;

/** Serialisable row for client components (Decimal → number, Date → ISO). */
export interface ReceiptCard {
  id: string;
  status: ReceiptListRow["status"];
  source: ReceiptListRow["source"];
  title: string;
  merchantName: string | null;
  purchaseDate: string | null;
  totalAmount: number | null;
  currency: string;
  category: string | null;
  warrantyExpiresAt: string | null;
  returnDeadline: string | null;
  deletedAt: string | null;
  createdAt: string;
  processingError: string | null;
  thumbnailFileId: string | null;
  thumbnailKind: ReceiptListRow["files"][number]["kind"] | null;
}

export function toReceiptCard(r: ReceiptListRow): ReceiptCard {
  return {
    id: r.id,
    status: r.status,
    source: r.source,
    title: r.title ?? r.merchantName ?? "Kvitto",
    merchantName: r.merchantName,
    purchaseDate: r.purchaseDate ? r.purchaseDate.toISOString().slice(0, 10) : null,
    totalAmount: toNumber(r.totalAmount),
    currency: r.currency,
    category: r.category,
    warrantyExpiresAt: r.warrantyExpiresAt ? r.warrantyExpiresAt.toISOString().slice(0, 10) : null,
    returnDeadline: r.returnDeadline ? r.returnDeadline.toISOString().slice(0, 10) : null,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
    processingError: r.processingError,
    thumbnailFileId: r.files[0]?.id ?? null,
    thumbnailKind: r.files[0]?.kind ?? null,
  };
}

function textFilter(term: string): Prisma.ReceiptWhereInput {
  const mode = "insensitive" as const;
  return {
    OR: [
      { title: { contains: term, mode } },
      { merchantName: { contains: term, mode } },
      { category: { contains: term, mode } },
      { notes: { contains: term, mode } },
      { receiptNumber: { contains: term, mode } },
      { ocrText: { contains: term, mode } },
      { tags: { has: term } },
      {
        items: {
          some: {
            OR: [
              { name: { contains: term, mode } },
              { brand: { contains: term, mode } },
              { model: { contains: term, mode } },
              { articleNumber: { contains: term, mode } },
              { serialNumber: { contains: term, mode } },
            ],
          },
        },
      },
    ],
  };
}

export function buildReceiptWhere(userId: string, f: ReceiptListFilters): Prisma.ReceiptWhereInput {
  const where: Prisma.ReceiptWhereInput = { userId };
  if (f.status === "trash") where.deletedAt = { not: null };
  else where.deletedAt = null;
  if (f.status === "needs_review") where.status = { in: ["NEEDS_REVIEW", "FAILED"] };
  if (f.category) where.category = f.category;
  if (f.from || f.to) {
    where.purchaseDate = {
      ...(f.from ? { gte: new Date(f.from) } : {}),
      ...(f.to ? { lte: new Date(f.to) } : {}),
    };
  }
  const terms = (f.q ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 6);
  if (terms.length) where.AND = terms.map(textFilter);
  return where;
}

function orderBy(sort: ReceiptListFilters["sort"]): Prisma.ReceiptOrderByWithRelationInput[] {
  switch (sort) {
    case "date_asc":
      return [{ purchaseDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }];
    case "amount_desc":
      return [{ totalAmount: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
    case "amount_asc":
      return [{ totalAmount: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }];
    default:
      return [{ purchaseDate: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }];
  }
}

export async function listReceipts(userId: string, filters: ReceiptListFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24));
  const where = buildReceiptWhere(userId, filters);
  const [rows, total] = await Promise.all([
    prisma.receipt.findMany({ where, select: receiptListSelect, orderBy: orderBy(filters.sort), skip: (page - 1) * pageSize, take: pageSize }),
    prisma.receipt.count({ where }),
  ]);
  return { items: rows.map(toReceiptCard), total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) };
}

export interface DashboardStats {
  receiptCount: number;
  monthTotal: number;
  yearTotal: number;
  needsReview: number;
  expiringSoon: number;
  processing: number;
}

export async function dashboardStats(userId: string, accountType: "PRIVATE" | "BUSINESS" = "PRIVATE"): Promise<DashboardStats> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const [receiptCount, month, year, needsReview, processing, withDates] = await Promise.all([
    prisma.receipt.count({ where: { userId, deletedAt: null } }),
    prisma.receipt.aggregate({ where: { userId, deletedAt: null, purchaseDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.receipt.aggregate({ where: { userId, deletedAt: null, purchaseDate: { gte: yearStart } }, _sum: { totalAmount: true } }),
    prisma.receipt.count({ where: { userId, deletedAt: null, status: { in: ["NEEDS_REVIEW", "FAILED"] } } }),
    prisma.receipt.count({ where: { userId, deletedAt: null, status: "PROCESSING" } }),
    prisma.receipt.findMany({
      where: { userId, deletedAt: null, purchaseDate: { not: null } },
      select: { purchaseDate: true, warrantyExpiresAt: true },
    }),
  ]);
  const expiringSoon = withDates.filter((r) => coverageStatus(r.purchaseDate, r.warrantyExpiresAt, accountType, now).status === "expiring").length;
  return {
    receiptCount,
    monthTotal: toNumber(month._sum.totalAmount) ?? 0,
    yearTotal: toNumber(year._sum.totalAmount) ?? 0,
    needsReview,
    expiringSoon,
    processing,
  };
}

export async function listCategories(userId: string): Promise<string[]> {
  const rows = await prisma.receipt.findMany({
    where: { userId, deletedAt: null, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
    orderBy: { category: "asc" },
  });
  return rows.map((r) => r.category!).filter(Boolean);
}
