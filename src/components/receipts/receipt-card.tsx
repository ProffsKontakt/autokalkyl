import * as React from "react";
import Link from "next/link";
import { FileText, Mail, Receipt as ReceiptIcon, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import type { ReceiptCard as ReceiptCardData } from "@/lib/receipts/queries";
import { coverageStatus } from "@/lib/receipts/warranty";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { CoverageChip, StatusBadge } from "./status-badge";

export interface ReceiptCardProps {
  receipt: ReceiptCardData;
  /** Used to compute the legal claim period (3 years private, 2 years business). */
  accountType?: "PRIVATE" | "BUSINESS";
  /** Link target. Defaults to the receipt page; pass `null` for a non-clickable card (e.g. in the trash). */
  href?: string | null;
  /** Extra content rendered below the details, e.g. trash actions. */
  footer?: React.ReactNode;
  className?: string;
}

function Thumbnail({ receipt }: { receipt: ReceiptCardData }) {
  if (receipt.thumbnailFileId && receipt.thumbnailKind === "IMAGE") {
    return (
      // The file route is owner-authenticated, so the image optimizer (which fetches server-side
      // without the user's cookies) cannot be used – a plain, lazily loaded <img> is correct here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/api/files/${receipt.thumbnailFileId}?thumb=1`}
        alt=""
        loading="lazy"
        decoding="async"
        className="h-full w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.03]"
      />
    );
  }
  const kind = receipt.thumbnailKind;
  const isEmail = kind === "EMAIL_HTML" || kind === "EMAIL_TEXT" || receipt.source === "EMAIL";
  const Icon = kind === "PDF" ? FileText : isEmail ? Mail : ReceiptIcon;
  const label = kind === "PDF" ? "PDF" : isEmail ? "E-post" : receipt.source === "MANUAL" ? "Manuellt" : "Kvitto";
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-ink-400">
      <Icon className="h-9 w-9" strokeWidth={1.5} aria-hidden />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/**
 * Card used in grids on the dashboard, the receipt list and the trash.
 * Renders as a single stretched link so the whole card is clickable while the
 * markup stays accessible (one anchor, descriptive text inside it).
 */
export function ReceiptCard({ receipt, accountType = "PRIVATE", href, footer, className }: ReceiptCardProps) {
  const target = href === undefined ? `/app/kvitton/${receipt.id}` : href;
  const coverage = receipt.purchaseDate
    ? coverageStatus(new Date(receipt.purchaseDate), receipt.warrantyExpiresAt ? new Date(receipt.warrantyExpiresAt) : null, accountType)
    : null;
  const processing = receipt.status === "PROCESSING";
  const meta = [receipt.merchantName, receipt.purchaseDate ? formatDate(receipt.purchaseDate) : null].filter(Boolean).join(" · ");

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card transition-all duration-200",
        target && "hover:-translate-y-0.5 hover:shadow-soft focus-within:ring-2 focus-within:ring-brand-300",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-ink-100">
        <Thumbnail receipt={receipt} />
        {processing ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 backdrop-blur-[1px]">
            <Spinner label="Läser kvittot…" className="rounded-full bg-white px-3 py-1.5 text-ink-700 shadow-soft" />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink-900">
            {target ? (
              <Link href={target} className="after:absolute after:inset-0 after:content-[''] focus:outline-none">
                {receipt.title}
              </Link>
            ) : (
              receipt.title
            )}
          </h3>
          <span className="shrink-0 whitespace-nowrap text-[15px] font-semibold tabular-nums text-ink-900">{formatMoney(receipt.totalAmount, receipt.currency)}</span>
        </div>

        {meta ? <p className="truncate text-sm text-ink-500">{meta}</p> : processing ? <p className="text-sm text-ink-400">Uppgifter fylls i automatiskt</p> : null}

        {receipt.deletedAt ? (
          <p className="flex items-center gap-1.5 text-xs text-ink-500">
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Raderades {formatDate(receipt.deletedAt)}
          </p>
        ) : null}

        {receipt.category || receipt.status !== "READY" || coverage?.status === "expiring" ? (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {receipt.category ? <Badge tone="brand">{receipt.category}</Badge> : null}
            <StatusBadge status={receipt.status} />
            {coverage?.status === "expiring" ? <CoverageChip coverage={coverage} /> : null}
          </div>
        ) : null}
      </div>

      {footer ? <div className="relative z-10 border-t border-ink-100 bg-ink-50/60 px-4 py-3">{footer}</div> : null}
    </article>
  );
}
