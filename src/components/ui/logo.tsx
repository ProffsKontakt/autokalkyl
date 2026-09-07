import Link from "next/link";
import { brand } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Brand mark: a receipt with a check. Inherits text color; the check is always brand green. */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} className={cn("shrink-0", className)} aria-hidden>
      <path
        d="M8 3h16a1 1 0 0 1 1 1v24l-2.6-1.8a1 1 0 0 0-1.15 0L18.6 28l-2.6-1.8-2.6 1.8-2.65-1.8a1 1 0 0 0-1.15 0L7 28V4a1 1 0 0 1 1-1z"
        fill="currentColor"
        opacity="0.92"
      />
      <path d="M11 9h10M11 13h7" stroke="white" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
      <circle cx="21" cy="20" r="7.5" fill="#1c6f61" stroke="white" strokeWidth="2" />
      <path d="m17.6 20.2 2.3 2.3 4.2-4.6" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, href = "/", light = false }: { className?: string; href?: string; light?: boolean }) {
  return (
    <Link href={href} className={cn("inline-flex items-center gap-2 font-bold tracking-tight", light ? "text-white" : "text-ink-900", className)} aria-label={`${brand.name} – startsida`}>
      <LogoMark className={light ? "text-white" : "text-ink-900"} />
      <span className="text-lg">{brand.name}</span>
    </Link>
  );
}
