import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type NoticeTone = "success" | "error" | "info";

const tones: Record<NoticeTone, { box: string; icon: LucideIcon }> = {
  success: { box: "border-brand-200 bg-brand-50 text-brand-900", icon: CheckCircle2 },
  error: { box: "border-red-200 bg-red-50 text-danger", icon: AlertCircle },
  info: { box: "border-ink-200 bg-ink-50 text-ink-800", icon: Info },
};

/** Compact status box above a form: success after a redirect, error from a server action, or an informational note. */
export function FormNotice({ tone = "info", children, className }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cn("flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm leading-relaxed", box, className)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
