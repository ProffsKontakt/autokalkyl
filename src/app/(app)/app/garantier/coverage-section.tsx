import Link from "next/link";
import { ArrowRight, MessageCircleQuestion, type LucideIcon } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { CoverageChip, type CoverageInfo } from "@/components/receipts/status-badge";
import { cn, formatDate, formatMoney } from "@/lib/utils";

export interface CoverageEntry {
  id: string;
  title: string;
  merchantName: string | null;
  purchaseDate: Date;
  totalAmount: number | null;
  currency: string;
  warrantyMonths: number | null;
  warrantyExpiresAt: Date | null;
  legalDeadline: Date | null;
  coverage: CoverageInfo;
}

/** "Garanti 24 mån" / "Reklamationsrätt 3 år" */
export function coverageKindText(entry: CoverageEntry, legalYears: number): string {
  if (entry.coverage.kind === "warranty") return entry.warrantyMonths ? `Garanti ${entry.warrantyMonths} mån` : "Garanti";
  return `Reklamationsrätt ${legalYears} år`;
}

/** The "other" protection, when both a warranty and the legal claim right exist. */
function secondaryCoverageText(entry: CoverageEntry, now: Date): string | null {
  if (entry.coverage.kind === "legal" && entry.warrantyExpiresAt) {
    return `Garantin ${entry.warrantyExpiresAt.getTime() < now.getTime() ? "gick ut" : "gäller till"} ${formatDate(entry.warrantyExpiresAt)}`;
  }
  if (entry.coverage.kind === "warranty" && entry.legalDeadline) {
    return `Reklamationsrätt till ${formatDate(entry.legalDeadline)}`;
  }
  return null;
}

/** Share of the coverage period that has passed, 0–1. */
function elapsedFraction(entry: CoverageEntry, now: Date): number {
  const until = entry.coverage.until;
  if (!until) return 0;
  const total = until.getTime() - entry.purchaseDate.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - entry.purchaseDate.getTime()) / total));
}

const BAR_TONES: Record<CoverageInfo["status"], string> = {
  active: "bg-brand-500",
  expiring: "bg-amber-500",
  expired: "bg-ink-300",
  unknown: "bg-ink-300",
};

function CoverageRow({ entry, legalYears, now }: { entry: CoverageEntry; legalYears: number; now: Date }) {
  const secondary = secondaryCoverageText(entry, now);
  const expired = entry.coverage.status === "expired";
  const meta = [entry.merchantName, `Köpt ${formatDate(entry.purchaseDate)}`, entry.totalAmount !== null ? formatMoney(entry.totalAmount, entry.currency) : null].filter(Boolean).join(" · ");

  return (
    <li className={cn("rounded-2xl border bg-white p-4 shadow-card sm:p-5", expired ? "border-ink-200/60" : "border-ink-200/80")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug text-ink-900">
            <Link href={`/app/kvitton/${entry.id}`} className="hover:text-brand-700 hover:underline">
              {entry.title}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-sm text-ink-500">{meta}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge tone="neutral">{coverageKindText(entry, legalYears)}</Badge>
            <CoverageChip coverage={entry.coverage} showKind={false} />
          </div>
          {secondary ? <p className="mt-1.5 text-xs text-ink-500">{secondary}</p> : null}
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{expired ? "Gick ut" : "Gäller till"}</p>
          <p className={cn("text-base font-semibold tabular-nums", expired ? "text-ink-500" : "text-ink-900")}>{formatDate(entry.coverage.until)}</p>
        </div>
      </div>

      {!expired ? (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-ink-100" aria-hidden>
          <div className={cn("h-full rounded-full transition-all", BAR_TONES[entry.coverage.status])} style={{ width: `${Math.round(elapsedFraction(entry, now) * 100)}%` }} />
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t border-ink-100 pt-3 text-sm font-semibold">
        <Link href={`/app/kvitton/${entry.id}`} className="inline-flex items-center gap-1 text-ink-700 hover:text-ink-900">
          Visa kvitto
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
        <Link href={`/app/chatt?receipt=${encodeURIComponent(entry.id)}`} className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800">
          <MessageCircleQuestion className="h-4 w-4" aria-hidden />
          Fråga AI om garantin
        </Link>
      </div>
    </li>
  );
}

export interface CoverageSectionProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone: BadgeTone;
  entries: CoverageEntry[];
  legalYears: number;
  now: Date;
  emptyText: string;
  /** Render collapsed inside a <details> (used for the long list of expired items). */
  collapsible?: boolean;
}

export function CoverageSection({ id, title, description, icon: Icon, tone, entries, legalYears, now, emptyText, collapsible = false }: CoverageSectionProps) {
  const heading = (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-ink-500" aria-hidden />
      <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
      <Badge tone={entries.length ? tone : "neutral"}>{entries.length}</Badge>
    </div>
  );
  const body = entries.length ? (
    <ul role="list" className="space-y-3">
      {entries.map((entry) => (
        <CoverageRow key={entry.id} entry={entry} legalYears={legalYears} now={now} />
      ))}
    </ul>
  ) : (
    <p className="rounded-2xl border border-dashed border-ink-200 bg-white px-4 py-6 text-center text-sm text-ink-500">{emptyText}</p>
  );

  if (collapsible) {
    return (
      <section id={id} className="scroll-mt-20">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl py-1 [&::-webkit-details-marker]:hidden">
            <div>
              {heading}
              <p className="mt-0.5 text-sm text-ink-500">{description}</p>
            </div>
            <span className="text-sm font-semibold text-brand-700 group-open:hidden">Visa</span>
            <span className="hidden text-sm font-semibold text-brand-700 group-open:inline">Dölj</span>
          </summary>
          <div className="mt-3">{body}</div>
        </details>
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-20">
      {heading}
      <p className="mb-3 mt-0.5 text-sm text-ink-500">{description}</p>
      {body}
    </section>
  );
}
