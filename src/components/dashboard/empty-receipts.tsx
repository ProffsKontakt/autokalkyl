import { Camera, PencilLine } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Line-art illustration: a receipt with a green check badge, drawn in `currentColor`
 * strokes so it can be tinted with text-* classes. Static SVG – safe in Server Components.
 */
export function ReceiptIllustration({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 200 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* ground shadow */}
      <path d="M44 138 Q100 150 156 138" opacity="0.25" strokeDasharray="3 5" />
      {/* receipt with torn edge */}
      <path d="M62 22 H138 V118 l-7.6 -6 -7.6 6 -7.6 -6 -7.6 6 -7.6 -6 -7.6 6 -7.6 -6 -7.6 6 -7.6 -6 -7.6 6 Z" className="fill-white" />
      <path d="M76 40 H108" />
      <path d="M76 54 H124" />
      <path d="M76 68 H116" />
      <path d="M76 82 H100" />
      <path d="M76 97 H124" strokeWidth={3.5} />
      {/* cartoon sparkles */}
      <path d="M38 48 v10 M33 53 h10" opacity="0.6" />
      <path d="M160 34 v8 M156 38 h8" opacity="0.6" />
      <circle cx="46" cy="98" r="2.5" opacity="0.5" />
      <circle cx="166" cy="72" r="2" opacity="0.5" />
      {/* green check badge */}
      <g className="animate-check-pop" style={{ transformBox: "fill-box", transformOrigin: "center", animationDelay: "250ms" }}>
        <circle cx="132" cy="108" r="17" fill="#1c6f61" stroke="#ffffff" strokeWidth={3} />
        <path d="M124 108.5 l5.5 5.5 l11 -12" stroke="#ffffff" strokeWidth={3.5} />
      </g>
    </svg>
  );
}

/** Empty state for a brand-new account: illustration, warm copy and the two ways to add a receipt. */
export function EmptyReceipts({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-white bg-paper px-6 text-center", compact ? "py-10" : "py-14", className)}>
      <ReceiptIllustration className="w-44 text-ink-800 sm:w-52" title="Ett kvitto med en grön bock" />
      <h3 className="mt-4 text-lg font-semibold text-ink-900">Inga kvitton ännu</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        Fota ditt första kvitto så sköter vi resten: butik, belopp, produkter och garanti fylls i automatiskt.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <ButtonLink href="/app/skanna" size="lg">
          <Camera className="h-5 w-5" aria-hidden />
          Skanna kvitto
        </ButtonLink>
        <ButtonLink href="/app/kvitton/ny" variant="outline" size="lg">
          <PencilLine className="h-5 w-5" aria-hidden />
          Lägg till manuellt
        </ButtonLink>
      </div>
    </div>
  );
}
