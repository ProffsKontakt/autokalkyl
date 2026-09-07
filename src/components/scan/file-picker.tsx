"use client";

import * as React from "react";
import { FileUp, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ACCEPTED_TYPES_LABEL, MAX_PAGES } from "./types";

export interface FilePickerProps {
  pageCount: number;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
}

function hasFiles(dataTransfer: DataTransfer | null): boolean {
  return !!dataTransfer && Array.from(dataTransfer.types).includes("Files");
}

export function FilePicker({ pageCount, disabled = false, onFiles }: FilePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const depthRef = React.useRef(0);
  const [dragging, setDragging] = React.useState(false);

  const full = pageCount >= MAX_PAGES;
  const inactive = disabled || full;

  const openPicker = () => {
    if (!inactive) inputRef.current?.click();
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length) onFiles(files);
  };

  const onDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    depthRef.current += 1;
    setDragging(true);
  };

  const onDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = inactive ? "none" : "copy";
  };

  const onDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    depthRef.current = Math.max(0, depthRef.current - 1);
    if (depthRef.current === 0) setDragging(false);
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!hasFiles(event.dataTransfer)) return;
    event.preventDefault();
    depthRef.current = 0;
    setDragging(false);
    if (inactive) return;
    const files = Array.from(event.dataTransfer.files);
    if (files.length) onFiles(files);
  };

  // Desktop convenience: paste an image from the clipboard (Ctrl+V) while this mode is open.
  React.useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      if (inactive) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = Array.from(event.clipboardData?.files ?? []);
      if (!files.length) return;
      event.preventDefault();
      onFiles(files);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [inactive, onFiles]);

  return (
    <div
      onClick={openPicker}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-white px-6 py-10 text-center transition-colors sm:py-14",
        dragging && !inactive ? "border-brand-500 bg-brand-50" : "border-ink-200",
        inactive ? "opacity-70" : "cursor-pointer hover:border-ink-300",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={inactive}
        onChange={handleInput}
        onClick={(event) => event.stopPropagation()}
      />

      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Images className="h-8 w-8" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold text-ink-900">{full ? `Max ${MAX_PAGES} sidor per kvitto` : "Välj bilder eller PDF"}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink-500">
        {full ? (
          "Ta bort en sida om du vill lägga till en annan – eller spara kvittot som det är."
        ) : (
          <>
            <span className="sm:hidden">Välj bilder eller en PDF från din mobil.</span>
            <span className="hidden sm:inline">Dra och släpp filerna här, eller välj dem från din dator.</span>
          </>
        )}
      </p>

      <Button
        type="button"
        size="lg"
        className="mt-5"
        disabled={inactive}
        onClick={(event) => {
          event.stopPropagation();
          openPicker();
        }}
      >
        <FileUp className="h-5 w-5" aria-hidden />
        Välj filer
      </Button>

      <p className="mt-4 text-xs text-ink-400">
        {ACCEPTED_TYPES_LABEL} · max 4 MB per fil · upp till {MAX_PAGES} sidor per kvitto
      </p>
      <p className="mt-1 hidden text-xs text-ink-400 sm:block">Tips: du kan också klistra in en bild med Ctrl+V.</p>

      {dragging && !inactive ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-brand-50/90 text-base font-semibold text-brand-800">
          Släpp för att lägga till
        </div>
      ) : null}
    </div>
  );
}
