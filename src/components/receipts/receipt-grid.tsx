import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReceiptCard as ReceiptCardData } from "@/lib/receipts/queries";
import { cn } from "@/lib/utils";
import { ReceiptCard } from "./receipt-card";

export interface ReceiptGridProps {
  receipts: ReceiptCardData[];
  accountType?: "PRIVATE" | "BUSINESS";
  /** Builds the link for a card. Return `null` for non-clickable cards. Defaults to the receipt page. */
  hrefFor?: (receipt: ReceiptCardData) => string | null;
  /** Optional footer per card (e.g. trash actions). */
  footerFor?: (receipt: ReceiptCardData) => React.ReactNode;
  className?: string;
}

/** Responsive card grid: 1 column on phones, 2 on tablets, 3 on desktop. */
export function ReceiptGrid({ receipts, accountType, hrefFor, footerFor, className }: ReceiptGridProps) {
  return (
    <ul role="list" className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {receipts.map((receipt, index) => (
        <li key={receipt.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
          <ReceiptCard receipt={receipt} accountType={accountType} href={hrefFor ? hrefFor(receipt) : undefined} footer={footerFor?.(receipt)} />
        </li>
      ))}
    </ul>
  );
}

export interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  /** Path of the page, e.g. "/app/kvitton". */
  pathname: string;
  /** Current query parameters (without `page`); preserved on every link. */
  params?: Record<string, string | undefined>;
  className?: string;
}

function pageHref(pathname: string, params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) sp.set(key, value);
  }
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

/** Pages to display: first, last, and a window around the current page, with gaps as `null`. */
function pageWindow(page: number, pages: number): (number | null)[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set<number>([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3, 4].forEach((p) => set.add(p));
  if (page >= pages - 2) [pages - 3, pages - 2, pages - 1].forEach((p) => set.add(p));
  const sorted = [...set].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(null);
    out.push(p);
  });
  return out;
}

/** Server-rendered pagination using plain links (`?page=`) so it works without JavaScript. */
export function Pagination({ page, pages, total, pageSize, pathname, params = {}, className }: PaginationProps) {
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const linkBase = "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-xl border px-3 text-sm font-semibold transition-colors";
  const idle = "border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50";
  const current = "border-brand-600 bg-brand-600 text-white";
  const disabled = "pointer-events-none border-ink-100 bg-ink-50 text-ink-300";

  return (
    <nav className={cn("flex flex-col items-center gap-3 sm:flex-row sm:justify-between", className)} aria-label="Sidor">
      <p className="text-sm text-ink-500">
        Visar {from}–{to} av {total}
      </p>
      <ul className="flex items-center gap-1.5">
        <li>
          <Link
            href={pageHref(pathname, params, page - 1)}
            className={cn(linkBase, page <= 1 ? disabled : idle)}
            aria-disabled={page <= 1 || undefined}
            tabIndex={page <= 1 ? -1 : undefined}
            aria-label="Föregående sida"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Föregående</span>
          </Link>
        </li>
        {pageWindow(page, pages).map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="px-1 text-ink-400" aria-hidden>
              …
            </li>
          ) : (
            <li key={p}>
              <Link href={pageHref(pathname, params, p)} className={cn(linkBase, p === page ? current : idle)} aria-current={p === page ? "page" : undefined} aria-label={`Sida ${p}`}>
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          <Link
            href={pageHref(pathname, params, page + 1)}
            className={cn(linkBase, page >= pages ? disabled : idle)}
            aria-disabled={page >= pages || undefined}
            tabIndex={page >= pages ? -1 : undefined}
            aria-label="Nästa sida"
          >
            <span className="hidden sm:inline">Nästa</span>
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Link>
        </li>
      </ul>
    </nav>
  );
}
