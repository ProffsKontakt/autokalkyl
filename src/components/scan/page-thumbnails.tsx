"use client";

import * as React from "react";
import { FileText, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { formatBytes } from "@/lib/utils";
import { MAX_PAGES, type ScanPage } from "./types";

export interface PageThumbnailsProps {
  pages: ScanPage[];
  disabled?: boolean;
  onRemove: (id: string) => void;
}

export function PageThumbnails({ pages, disabled = false, onRemove }: PageThumbnailsProps) {
  const reduceMotion = useReducedMotion();

  return (
    <section aria-labelledby="scan-pages-heading" className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="scan-pages-heading" className="text-base font-semibold text-ink-900">
          Sidor{" "}
          <span className="font-normal text-ink-500" aria-live="polite">
            ({pages.length}/{MAX_PAGES})
          </span>
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink-500">Flera sidor? Fota alla sidor av samma kvitto innan du sparar.</p>

      {pages.length ? (
        <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8" aria-label="Sidor i kvittot">
          <AnimatePresence initial={false}>
            {pages.map((page, index) => (
              <motion.li
                key={page.id}
                layout={!reduceMotion}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative aspect-[3/4] overflow-hidden rounded-xl border border-ink-200 bg-ink-50"
              >
                {page.kind === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview; next/image cannot optimise blob: URLs
                  <img src={page.previewUrl} alt={`Sida ${index + 1}: ${page.name}`} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-1 text-center">
                    <FileText className="h-6 w-6 text-brand-600" aria-hidden />
                    <span className="line-clamp-2 text-[10px] font-medium leading-tight text-ink-700">{page.name}</span>
                    <span className="sr-only">Sida {index + 1}, PDF</span>
                  </div>
                )}
                <span className="absolute left-1.5 top-1.5 rounded-full bg-ink-950/75 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-white" aria-hidden>
                  {index + 1}
                </span>
                <span className="absolute bottom-1 left-1.5 rounded bg-ink-950/60 px-1 py-0.5 text-[10px] leading-none text-white" aria-hidden>
                  {formatBytes(page.size)}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(page.id)}
                  disabled={disabled}
                  aria-label={`Ta bort sida ${index + 1}`}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink-700 shadow-soft transition-colors hover:bg-danger hover:text-white disabled:opacity-50"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
          Inga sidor än – de dyker upp här när du fotat eller valt en fil.
        </p>
      )}
    </section>
  );
}
