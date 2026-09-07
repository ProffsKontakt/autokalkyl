import type { AnchorHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type AnchorButtonVariant = "primary" | "outline";
type AnchorButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-200 select-none whitespace-nowrap active:scale-[0.98] aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<AnchorButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-soft",
  outline: "border border-ink-200 bg-white text-ink-900 hover:border-ink-300 hover:bg-ink-50",
};

const sizes: Record<AnchorButtonSize, string> = {
  sm: "h-9 px-3.5 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
};

/**
 * A plain <a> that looks like Button. Used where Next's Link is the wrong tool:
 * mailto: links, file downloads and API routes (Link would prefetch the CSV export on hover).
 */
export function AnchorButton({
  variant = "primary",
  size = "md",
  className,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { variant?: AnchorButtonVariant; size?: AnchorButtonSize }) {
  return <a className={cn(base, variants[variant], sizes[size], className)} {...props} />;
}
