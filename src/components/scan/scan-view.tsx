"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Camera, Images, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/container";
import { cn } from "@/lib/utils";
import { compressImage } from "@/lib/client/image-compress";
import { CameraCapture } from "./camera-capture";
import { FilePicker } from "./file-picker";
import { PageThumbnails } from "./page-thumbnails";
import { SuccessOverlay } from "./success-overlay";
import { UploadError, uploadReceipt, type UploadFile } from "./upload-receipt";
import {
  ACCEPTED_TYPES_LABEL,
  MAX_FILE_BYTES,
  MAX_PAGES,
  MAX_REQUEST_BYTES,
  createPage,
  releasePage,
  type PageOrigin,
  type ScanMode,
  type ScanPage,
} from "./types";

type Phase =
  | { kind: "idle" }
  | { kind: "compressing"; done: number; total: number }
  | { kind: "uploading"; percent: number }
  | { kind: "success"; id: string; next: boolean }
  | { kind: "error"; message: string };

/** How long the success overlay stays before navigating / resetting. */
const SUCCESS_DELAY_MS = 1200;

function withJpgExtension(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").trim();
  return `${base || "kvitto"}.jpg`;
}

/** Compresses an image page (or validates a PDF) into what we send to the server. */
async function prepareForUpload(page: ScanPage): Promise<UploadFile> {
  if (page.kind === "pdf") {
    if (page.size > MAX_FILE_BYTES) throw new Error(`"${page.name}" är för stor (max 4 MB per fil).`);
    return { blob: page.file, name: page.name };
  }

  let result = await compressImage(page.file);
  let blob: Blob = result.dataUrl ? result.blob : page.file;
  let name = result.dataUrl ? withJpgExtension(page.name) : page.name;

  // A JPEG that was already small can grow slightly when re-encoded – keep whichever is smaller.
  if (result.dataUrl && page.file.type === "image/jpeg" && page.size <= blob.size) {
    blob = page.file;
    name = page.name;
  }

  if (blob.size > MAX_FILE_BYTES) {
    result = await compressImage(page.file, { maxSize: 1200, quality: 0.72 });
    if (result.dataUrl) {
      blob = result.blob;
      name = withJpgExtension(page.name);
    }
  }

  if (blob.size > MAX_FILE_BYTES) {
    throw new Error(`"${page.name}" är för stor även efter komprimering (max 4 MB per fil).`);
  }
  return { blob, name };
}

export interface ScanViewProps {
  initialMode: ScanMode;
}

export function ScanView({ initialMode }: ScanViewProps) {
  const router = useRouter();
  const [mode, setMode] = React.useState<ScanMode>(initialMode);
  const [pages, setPages] = React.useState<ScanPage[]>([]);
  const [phase, setPhase] = React.useState<Phase>({ kind: "idle" });
  const [lastSavedId, setLastSavedId] = React.useState<string | null>(null);
  /** Mirror of `pages` for event handlers – only ever read in handlers/effects, never during render. */
  const pagesRef = React.useRef<ScanPage[]>([]);

  const busy = phase.kind === "compressing" || phase.kind === "uploading" || phase.kind === "success";
  const showProgress = phase.kind === "compressing" || phase.kind === "uploading";

  const commitPages = React.useCallback((next: ScanPage[]) => {
    pagesRef.current = next;
    setPages(next);
  }, []);

  const addFiles = React.useCallback(
    (files: File[], origin: PageOrigin) => {
      const current = pagesRef.current;
      const room = MAX_PAGES - current.length;
      const accepted: ScanPage[] = [];
      let unsupported = 0;
      let tooLarge = 0;
      let skipped = 0;

      for (const file of files) {
        if (accepted.length >= room) {
          skipped += 1;
          continue;
        }
        if (file.size === 0) {
          unsupported += 1;
          continue;
        }
        const page = createPage(file, origin);
        if (!page) {
          unsupported += 1;
          continue;
        }
        if (page.kind === "pdf" && page.size > MAX_FILE_BYTES) {
          releasePage(page);
          tooLarge += 1;
          continue;
        }
        accepted.push(page);
      }

      if (accepted.length) {
        commitPages([...current, ...accepted]);
        setPhase((prev) => (prev.kind === "error" ? { kind: "idle" } : prev));
      }
      if (unsupported) {
        toast.error(unsupported === 1 ? `Filen stöds inte. Använd ${ACCEPTED_TYPES_LABEL}.` : `${unsupported} filer stöds inte. Använd ${ACCEPTED_TYPES_LABEL}.`);
      }
      if (tooLarge) {
        toast.error(tooLarge === 1 ? "PDF-filen är för stor (max 4 MB per fil)." : `${tooLarge} PDF-filer är för stora (max 4 MB per fil).`);
      }
      if (skipped) {
        toast.info(`Max ${MAX_PAGES} sidor per kvitto – ${skipped === 1 ? "en fil" : `${skipped} filer`} hoppades över.`);
      }
    },
    [commitPages],
  );

  const onCapture = React.useCallback((file: File) => addFiles([file], "camera"), [addFiles]);
  const onCameraFiles = React.useCallback((files: File[]) => addFiles(files, "camera"), [addFiles]);
  const onPickedFiles = React.useCallback((files: File[]) => addFiles(files, "file"), [addFiles]);

  const removePage = React.useCallback(
    (id: string) => {
      const current = pagesRef.current;
      const page = current.find((p) => p.id === id);
      if (!page) return;
      releasePage(page);
      commitPages(current.filter((p) => p.id !== id));
    },
    [commitPages],
  );

  const releaseAll = React.useCallback(() => {
    for (const page of pagesRef.current) releasePage(page);
  }, []);

  const clearPages = React.useCallback(() => {
    releaseAll();
    commitPages([]);
  }, [releaseAll, commitPages]);

  // Free object URLs when leaving the page.
  React.useEffect(() => releaseAll, [releaseAll]);

  // Warn before closing the tab with unsaved pages.
  React.useEffect(() => {
    if (pages.length === 0 || phase.kind === "success") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers need returnValue set to show the prompt.
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pages.length, phase.kind]);

  const save = React.useCallback(
    async (next: boolean) => {
      const snapshot = pagesRef.current;
      if (!snapshot.length) {
        toast.error("Lägg till minst en sida först.");
        return;
      }

      setPhase({ kind: "compressing", done: 0, total: snapshot.length });
      const files: UploadFile[] = [];
      try {
        for (let i = 0; i < snapshot.length; i += 1) {
          files.push(await prepareForUpload(snapshot[i]));
          setPhase({ kind: "compressing", done: i + 1, total: snapshot.length });
        }
      } catch (error) {
        const message = error instanceof Error && error.message ? error.message : "Bilderna kunde inte förberedas. Försök igen.";
        setPhase({ kind: "error", message });
        toast.error(message);
        return;
      }

      const totalBytes = files.reduce((sum, f) => sum + f.blob.size, 0);
      if (totalBytes > MAX_REQUEST_BYTES) {
        const message = "Filerna är för stora tillsammans (max 4 MB per kvitto). Ta bort någon sida eller spara kvittot i flera omgångar.";
        setPhase({ kind: "error", message });
        toast.error(message);
        return;
      }

      const source = snapshot.some((p) => p.origin === "camera") ? "SCAN" : "UPLOAD";
      setPhase({ kind: "uploading", percent: 0 });
      try {
        const result = await uploadReceipt({
          files,
          source,
          onProgress: (progress) => setPhase({ kind: "uploading", percent: progress.percent }),
        });
        router.prefetch(`/app/kvitton/${result.id}`);
        setPhase({ kind: "success", id: result.id, next });
      } catch (error) {
        const message = error instanceof UploadError ? error.message : "Uppladdningen misslyckades. Försök igen.";
        setPhase({ kind: "error", message });
        toast.error(message);
      }
    },
    [router],
  );

  // After the success moment: either go to the receipt or reset for the next one.
  React.useEffect(() => {
    if (phase.kind !== "success") return;
    const { id, next } = phase;
    const timer = window.setTimeout(() => {
      if (next) {
        clearPages();
        setLastSavedId(id);
        setPhase({ kind: "idle" });
        toast.success("Kvittot är sparat – fota nästa!");
      } else {
        router.push(`/app/kvitton/${id}`);
      }
    }, SUCCESS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [phase, clearPages, router]);

  const switchMode = React.useCallback(
    (next: ScanMode) => {
      if (!busy) setMode(next);
    },
    [busy],
  );

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next: ScanMode = mode === "camera" ? "upload" : "camera";
    switchMode(next);
    const el = document.getElementById(next === "camera" ? "scan-tab-camera" : "scan-tab-upload");
    el?.focus();
  };

  const progress =
    phase.kind === "compressing"
      ? Math.round((phase.done / Math.max(1, phase.total)) * 30)
      : phase.kind === "uploading"
        ? 30 + Math.round(phase.percent * 0.7)
        : phase.kind === "success"
          ? 100
          : 0;
  const progressLabel =
    phase.kind === "compressing"
      ? `Förbereder sida ${Math.min(phase.done + 1, phase.total)} av ${phase.total}…`
      : phase.kind === "uploading"
        ? phase.percent >= 100
          ? "Sparar kvittot…"
          : "Laddar upp…"
        : "Klart";

  const hasPages = pages.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Skanna kvitto"
        description="Fota kvittot eller ladda upp en bild eller PDF. Vi läser av butik, datum, belopp och garanti automatiskt."
      />

      <div role="tablist" aria-label="Sätt att lägga till kvittot" onKeyDown={onTabKeyDown} className="grid grid-cols-2 gap-1 rounded-xl bg-ink-100 p-1 sm:inline-flex">
        <ModeTab id="scan-tab-camera" active={mode === "camera"} disabled={busy} onClick={() => switchMode("camera")}>
          <Camera className="h-4 w-4" aria-hidden />
          Kamera
        </ModeTab>
        <ModeTab id="scan-tab-upload" active={mode === "upload"} disabled={busy} onClick={() => switchMode("upload")}>
          <Images className="h-4 w-4" aria-hidden />
          Från bilder/filer
        </ModeTab>
      </div>

      <div id="scan-panel" role="tabpanel" aria-labelledby={mode === "camera" ? "scan-tab-camera" : "scan-tab-upload"}>
        {mode === "camera" ? (
          <CameraCapture pageCount={pages.length} disabled={busy} onCapture={onCapture} onFiles={onCameraFiles} onSwitchToUpload={() => switchMode("upload")} />
        ) : (
          <FilePicker pageCount={pages.length} disabled={busy} onFiles={onPickedFiles} />
        )}
      </div>

      {lastSavedId && !hasPages && phase.kind === "idle" ? (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status">
          <span>Förra kvittot sparades och läses av nu.</span>
          <Link href={`/app/kvitton/${lastSavedId}`} className="inline-flex shrink-0 items-center gap-1 font-semibold hover:underline">
            Visa kvittot
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      ) : null}

      <PageThumbnails pages={pages} disabled={busy} onRemove={removePage} />

      {showProgress ? <ProgressPanel value={progress} label={progressLabel} /> : null}

      {phase.kind === "error" ? (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{phase.message}</span>
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => (hasPages ? void save(false) : setPhase({ kind: "idle" }))}>
            <RotateCcw className="h-4 w-4" aria-hidden />
            {hasPages ? "Försök igen" : "Okej"}
          </Button>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" size="lg" disabled={!hasPages || busy} onClick={() => void save(true)}>
          {mode === "camera" ? "Spara och skanna nästa" : "Spara och lägg till nästa"}
        </Button>
        <Button type="button" size="lg" disabled={!hasPages || busy} loading={showProgress} onClick={() => void save(false)}>
          {showProgress ? null : <Save className="h-5 w-5" aria-hidden />}
          Spara kvitto
        </Button>
      </div>

      <SuccessOverlay open={phase.kind === "success"} title="Kvittot är sparat!" description="Vi läser av det nu…" />
    </div>
  );
}

function ModeTab({
  id,
  active,
  disabled,
  onClick,
  children,
}: {
  id: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      id={id}
      aria-selected={active}
      aria-controls="scan-panel"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
        active ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function ProgressPanel({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-medium text-ink-900" aria-live="polite">
          {label}
        </span>
        <span className="tabular-nums text-ink-500">{value}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-300 ease-out" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
