import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { cn } from "@/lib/utils";

export type SettingsSectionTone = "default" | "danger";

/**
 * One settings block: a Card with an icon, a real <h2> (the page owns the <h1>) and an anchor id
 * so other parts of the app can deep-link, e.g. /app/installningar#kvittoadress.
 */
export function SettingsSection({
  id,
  icon: Icon,
  title,
  description,
  aside,
  tone = "default",
  className,
  children,
}: {
  id: string;
  icon: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  /** Rendered top-right in the header, e.g. a Badge. */
  aside?: ReactNode;
  tone?: SettingsSectionTone;
  className?: string;
  children: ReactNode;
}) {
  const headingId = `${id}-heading`;
  const danger = tone === "danger";
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-20 lg:scroll-mt-6">
      <Card className={cn(danger && "border-red-200", className)}>
        <CardHeader>
          <div className="flex items-start gap-3 sm:gap-4">
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                danger ? "bg-red-50 text-danger" : "bg-brand-50 text-brand-700",
              )}
              aria-hidden
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id={headingId} className="text-lg font-semibold tracking-tight text-ink-900">
                {title}
              </h2>
              {description ? <p className="mt-0.5 text-sm text-ink-500">{description}</p> : null}
            </div>
            {aside ? <div className="shrink-0">{aside}</div> : null}
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </section>
  );
}
