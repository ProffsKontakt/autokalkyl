"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Download, ExternalLink, FileText, Mail, Maximize2, ReceiptText, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { cn, formatBytes } from "@/lib/utils";
import { fileLabel, fileUrl, type ReceiptDetailFile } from "./types";

const ZOOM_STEPS = [1, 1.5, 2, 3] as const;

function nextZoom(current: number, direction: 1 | -1): number {
  const index = ZOOM_STEPS.findIndex((step) => step === current);
  const safe = index === -1 ? 0 : index;
  const next = Math.min(ZOOM_STEPS.length - 1, Math.max(0, safe + direction));
  return ZOOM_STEPS[next];
}

/** Index of the next/previous IMAGE file, wrapping around. */
function nextImageIndex(files: ReceiptDetailFile[], current: number, direction: 1 | -1): number {
  const images = files.map((file, index) => (file.kind === "IMAGE" ? index : -1)).filter((index) => index >= 0);
  if (images.length <= 1) return current;
  const position = images.indexOf(current);
  const next = (position + direction + images.length) % images.length;
  return images[next];
}

function FileIcon({ kind, className }: { kind: ReceiptDetailFile["kind"]; className?: string }) {
  if (kind === "PDF") return <FileText className={className} aria-hidden />;
  if (kind === "EMAIL_HTML" || kind === "EMAIL_TEXT") return <Mail className={className} aria-hidden />;
  return <ReceiptText className={className} aria-hidden />;
}

function EmptyOriginal() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-200 bg-white px-6 py-12 text-center">
      <svg viewBox="0 0 120 140" width="96" height="112" aria-hidden className="text-ink-300">
        <path d="M22 8h76v118l-9.5-6-9.5 6-9.5-6-9.5 6-9.5-6-9.5 6-9.5-6-9.5 6V8z" fill="white" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 32h48M36 48h48M36 64h30M36 92h48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        <circle cx="86" cy="98" r="14" fill="#eef7f5" stroke="#1c6f61" strokeWidth="3" />
        <path d="M79 98l5 5 9-10" fill="none" stroke="#1c6f61" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h3 className="mt-4 text-base font-semibold text-ink-900">Inget original bifogat</h3>
      <p className="mt-1 max-w-xs text-sm text-ink-500">Det här kvittot är inlagt för hand. Uppgifterna till höger är ändå ditt köpbevis.</p>
    </div>
  );
}

/**
 * Left-column viewer for a receipt's files: images (with lightbox + zoom),
 * PDFs (inline) and stored e-mails (sandboxed iframe).
 */
export function FileViewer({ files, title }: { files: ReceiptDetailFile[]; title: string }) {
  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);
  const [zoom, setZoom] = React.useState<number>(1);

  const safeIndex = Math.min(index, Math.max(0, files.length - 1));
  const file = files[safeIndex];
  const imageCount = files.filter((f) => f.kind === "IMAGE").length;

  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((current) => nextImageIndex(files, current, 1));
        setZoom(1);
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((current) => nextImageIndex(files, current, -1));
        setZoom(1);
      } else if (event.key === "+" || event.key === "=") {
        setZoom((current) => nextZoom(current, 1));
      } else if (event.key === "-") {
        setZoom((current) => nextZoom(current, -1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, files]);

  if (!file) return <EmptyOriginal />;

  const label = fileLabel(file, safeIndex, files.length);
  const alt = `${title} – ${label}`;
  const openLightbox = () => {
    setZoom(1);
    setLightbox(true);
  };
  const select = (i: number) => {
    setIndex(i);
    setZoom(1);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-ink-200/80 bg-white shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-sm">
            <FileIcon kind={file.kind} className="h-4 w-4 shrink-0 text-ink-500" />
            <span className="truncate font-medium text-ink-800">{file.originalName ?? label}</span>
            <span className="hidden shrink-0 text-ink-400 sm:inline">· {formatBytes(file.byteSize)}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {file.kind === "IMAGE" ? (
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={openLightbox} aria-label="Förstora bilden">
                <Maximize2 className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
            <a
              href={fileUrl(file.id, { download: true })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-700 transition-colors hover:bg-ink-100"
              aria-label={`Ladda ner ${label.toLowerCase()}`}
            >
              <Download className="h-4 w-4" aria-hidden />
            </a>
          </div>
        </div>

        {file.kind === "IMAGE" ? (
          <button type="button" onClick={openLightbox} className="group relative block w-full cursor-zoom-in bg-ink-100" aria-label="Förstora bilden">
            {/* eslint-disable-next-line @next/next/no-img-element -- private, auth-protected file route; next/image cannot optimise it */}
            <img src={fileUrl(file.id)} alt={alt} width={file.width ?? undefined} height={file.height ?? undefined} className="mx-auto max-h-[420px] w-auto max-w-full object-contain lg:max-h-[640px]" />
            <span className="pointer-events-none absolute inset-0 flex items-end justify-end p-3 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-900/80 px-3 py-1 text-xs font-medium text-white">
                <ZoomIn className="h-3.5 w-3.5" aria-hidden /> Förstora
              </span>
            </span>
          </button>
        ) : file.kind === "PDF" ? (
          <div className="bg-ink-100">
            <iframe src={fileUrl(file.id)} title={alt} className="h-[420px] w-full bg-white lg:h-[640px]" />
          </div>
        ) : (
          <div className="bg-ink-100">
            <iframe src={fileUrl(file.id)} title={alt} sandbox="" className="h-[420px] w-full bg-white lg:h-[640px]" />
          </div>
        )}

        {file.kind !== "IMAGE" ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink-100 px-4 py-2.5 text-sm">
            <a href={fileUrl(file.id)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
              <ExternalLink className="h-4 w-4" aria-hidden /> Öppna i ny flik
            </a>
            <a href={fileUrl(file.id, { download: true })} className="inline-flex items-center gap-1.5 font-medium text-brand-700 hover:underline">
              <Download className="h-4 w-4" aria-hidden /> Ladda ner
            </a>
            {file.kind !== "PDF" ? <span className="text-ink-400">Visas utan skript och länkar av säkerhetsskäl.</span> : null}
          </div>
        ) : null}
      </div>

      {files.length > 1 ? (
        <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filer på kvittot">
          {files.map((f, i) => {
            const thumbLabel = fileLabel(f, i, files.length);
            const active = i === safeIndex;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => select(i)}
                aria-pressed={active}
                aria-label={`Visa ${thumbLabel.toLowerCase()}`}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition-colors",
                  active ? "border-brand-600" : "border-ink-200 hover:border-ink-300",
                )}
              >
                {f.kind === "IMAGE" ? (
                  /* eslint-disable-next-line @next/next/no-img-element -- private thumbnail served by the file route */
                  <img src={fileUrl(f.id, { thumb: true })} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-ink-500">
                    <FileIcon kind={f.kind} className="h-6 w-6" />
                    <span className="text-[10px] font-semibold uppercase">{f.kind === "PDF" ? "PDF" : "Mejl"}</span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      <Dialog open={lightbox} onClose={() => setLightbox(false)} title={alt} className="max-w-[min(96vw,1100px)]">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => nextZoom(z, -1))} disabled={zoom === ZOOM_STEPS[0]} aria-label="Zooma ut">
            <ZoomOut className="h-4 w-4" aria-hidden />
          </Button>
          <span className="w-12 text-center text-sm tabular-nums text-ink-600" aria-live="polite">
            {Math.round(zoom * 100)} %
          </span>
          <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => setZoom((z) => nextZoom(z, 1))} disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]} aria-label="Zooma in">
            <ZoomIn className="h-4 w-4" aria-hidden />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setZoom(1)} disabled={zoom === 1}>
            <RotateCcw className="h-4 w-4" aria-hidden /> Återställ
          </Button>
          <div className="ml-auto flex items-center gap-2">
            {imageCount > 1 ? (
              <>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => select(nextImageIndex(files, safeIndex, -1))} aria-label="Föregående bild">
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </Button>
                <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => select(nextImageIndex(files, safeIndex, 1))} aria-label="Nästa bild">
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </>
            ) : null}
            <a href={fileUrl(file.id, { download: true })} className="inline-flex h-9 items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 text-sm font-semibold text-ink-900 hover:bg-ink-50">
              <Download className="h-4 w-4" aria-hidden /> Ladda ner
            </a>
          </div>
        </div>
        <div className="max-h-[75vh] overflow-auto rounded-xl bg-ink-100">
          {file.kind === "IMAGE" ? (
            /* eslint-disable-next-line @next/next/no-img-element -- private, auth-protected file route */
            <img
              src={fileUrl(file.id)}
              alt={alt}
              draggable={false}
              onClick={() => setZoom((z) => (z === 1 ? 2 : 1))}
              style={{ width: `${zoom * 100}%`, maxWidth: "none" }}
              className={cn("block select-none", zoom === 1 ? "cursor-zoom-in" : "cursor-zoom-out")}
            />
          ) : null}
        </div>
        <p className="mt-2 text-xs text-ink-400">Tips: piltangenterna byter bild, + och − zoomar.</p>
      </Dialog>
    </div>
  );
}
