import type { ReactNode } from "react";

/** "——— eller ———" between the Google button and the e-mail forms. */
export function AuthDivider({ children = "eller" }: { children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-ink-400" role="separator">
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
      <span>{children}</span>
      <span className="h-px flex-1 bg-ink-200" aria-hidden />
    </div>
  );
}
