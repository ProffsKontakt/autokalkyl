import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatTone = "neutral" | "brand" | "warning" | "danger";

const ICON_TONES: Record<StatTone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  brand: "bg-brand-100 text-brand-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-red-100 text-red-700",
};

export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  /** When set the whole card becomes a link. */
  href?: string;
  tone?: StatTone;
  /** Highlight the card (e.g. when something needs attention). */
  emphasis?: boolean;
  className?: string;
}

/** Compact key figure for the dashboard. */
export function StatCard({ label, value, hint, icon: Icon, href, tone = "neutral", emphasis = false, className }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", ICON_TONES[tone])}>
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {href ? <ArrowUpRight className="h-4 w-4 text-ink-300 transition-colors group-hover:text-brand-600" aria-hidden /> : null}
      </div>
      <div className="mt-3 min-w-0">
        <div className="truncate text-xl font-bold tabular-nums tracking-tight text-ink-900 sm:text-2xl">{value}</div>
        <div className="mt-0.5 text-[13px] font-medium text-ink-500">{label}</div>
        {hint ? <div className="mt-1 text-xs text-ink-400">{hint}</div> : null}
      </div>
    </>
  );
  const classes = cn(
    "group flex h-full flex-col rounded-2xl border bg-white p-4 shadow-card transition-all duration-200",
    emphasis ? "border-amber-200 bg-amber-50/40" : "border-ink-200/80",
    href && "hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-soft",
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
