import { ChevronDown, ScanText } from "lucide-react";

/** Collapsible with the raw text the AI read from the receipt – handy for searching and double-checking. */
export function OcrText({ text }: { text: string | null }) {
  if (!text || !text.trim()) return null;
  const lines = text.split(/\r?\n/).length;
  return (
    <details className="group rounded-2xl border border-ink-200/80 bg-white shadow-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 [&::-webkit-details-marker]:hidden sm:px-6">
        <span className="flex items-center gap-2">
          <ScanText className="h-5 w-5 text-brand-600" aria-hidden />
          <span className="text-base font-semibold text-ink-900">Fullständig kvittotext</span>
          <span className="text-sm text-ink-400">
            {lines} {lines === 1 ? "rad" : "rader"}
          </span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t border-ink-100 px-5 py-4 sm:px-6">
        <p className="mb-3 text-sm text-ink-500">Så här läste AI:n kvittot. Texten används när du söker bland dina kvitton.</p>
        <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-ink-50 p-4 font-mono text-xs leading-relaxed text-ink-800">{text}</pre>
      </div>
    </details>
  );
}
