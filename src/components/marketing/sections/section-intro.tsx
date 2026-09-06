import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/marketing/reveal";

export function SectionIntro({
  eyebrow,
  title,
  lead,
  align = "center",
  dark = false,
  className,
  titleAs: Heading = "h2",
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
  titleAs?: "h1" | "h2" | "h3";
}) {
  return (
    <Reveal className={cn("flex flex-col gap-4", align === "center" ? "items-center text-center" : "items-start text-left", className)}>
      {eyebrow ? (
        <span className={cn("inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider", dark ? "text-brand-300" : "text-brand-700")}>
          <span className={cn("h-px w-6", dark ? "bg-brand-400" : "bg-brand-500")} aria-hidden />
          {eyebrow}
        </span>
      ) : null}
      <Heading className={cn("max-w-2xl text-balance text-3xl font-bold tracking-tight sm:text-4xl", dark ? "text-white" : "text-ink-900")}>{title}</Heading>
      {lead ? <p className={cn("max-w-2xl text-pretty text-lg", dark ? "text-ink-300" : "text-ink-600")}>{lead}</p> : null}
    </Reveal>
  );
}
