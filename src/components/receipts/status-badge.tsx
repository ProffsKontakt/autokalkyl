import { AlertTriangle, CircleCheck, Loader2, PencilLine, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { ReceiptCard } from "@/lib/receipts/queries";
import type { CoverageStatus } from "@/lib/receipts/warranty";
import { cn, formatDate } from "@/lib/utils";

type ReceiptStatus = ReceiptCard["status"];

const STATUS: Record<ReceiptStatus, { tone: BadgeTone; label: string; icon: typeof Loader2; spin?: boolean }> = {
  PROCESSING: { tone: "neutral", label: "Bearbetas", icon: Loader2, spin: true },
  NEEDS_REVIEW: { tone: "warning", label: "Granska", icon: PencilLine },
  FAILED: { tone: "danger", label: "Misslyckades", icon: AlertTriangle },
  READY: { tone: "success", label: "Klart", icon: CircleCheck },
};

export function statusLabel(status: ReceiptStatus): string {
  return STATUS[status].label;
}

/**
 * Small pill describing the processing state of a receipt.
 * READY is silent by default – most receipts are ready and the badge would only add noise.
 */
export function StatusBadge({ status, showReady = false, className }: { status: ReceiptStatus; showReady?: boolean; className?: string }) {
  if (status === "READY" && !showReady) return null;
  const { tone, label, icon: Icon, spin } = STATUS[status];
  return (
    <Badge tone={tone} className={className}>
      <Icon className={cn("h-3.5 w-3.5", spin && "animate-spin")} aria-hidden />
      {label}
    </Badge>
  );
}

export interface CoverageInfo {
  status: CoverageStatus;
  until: Date | null;
  kind: "warranty" | "legal" | null;
  daysLeft: number | null;
}

/** "Garanti" / "Reklamationsrätt" */
export function coverageKindLabel(kind: CoverageInfo["kind"]): string {
  return kind === "warranty" ? "Garanti" : "Reklamationsrätt";
}

/** Human wording for the remaining time: "12 dagar kvar", "Går ut idag", "Gick ut 3 maj 2026". */
export function daysLeftLabel(coverage: Pick<CoverageInfo, "daysLeft" | "until">): string {
  const { daysLeft, until } = coverage;
  if (daysLeft === null) return "Okänt";
  if (daysLeft < 0) return `Gick ut ${formatDate(until)}`;
  if (daysLeft === 0) return "Går ut idag";
  if (daysLeft === 1) return "Går ut imorgon";
  if (daysLeft < 60) return `${daysLeft} dagar kvar`;
  const months = Math.round(daysLeft / 30.44);
  if (months < 24) return `${months} mån kvar`;
  return `${Math.floor(daysLeft / 365.25)} år kvar`;
}

const COVERAGE_TONE: Record<CoverageStatus, BadgeTone> = {
  active: "success",
  expiring: "warning",
  expired: "neutral",
  unknown: "neutral",
};

const COVERAGE_ICON: Record<CoverageStatus, typeof ShieldCheck> = {
  active: ShieldCheck,
  expiring: ShieldAlert,
  expired: ShieldX,
  unknown: ShieldX,
};

/** Chip summarising warranty / legal claim coverage: "Garanti · 12 dagar kvar". */
export function CoverageChip({ coverage, showKind = true, className }: { coverage: CoverageInfo; showKind?: boolean; className?: string }) {
  if (coverage.status === "unknown") return null;
  const Icon = COVERAGE_ICON[coverage.status];
  return (
    <Badge tone={COVERAGE_TONE[coverage.status]} className={className}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {showKind ? `${coverageKindLabel(coverage.kind)} · ` : null}
      {daysLeftLabel(coverage)}
    </Badge>
  );
}
