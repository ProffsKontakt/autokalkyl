"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Writes text to the clipboard. Falls back to a hidden textarea + execCommand where the async API is unavailable. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or non-secure context – try the legacy path below.
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.setAttribute("aria-hidden", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

const COPIED_RESET_MS = 2000;

function useCopy(value: string, message: string) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    const ok = await copyToClipboard(value);
    if (!ok) {
      toast.error("Kunde inte kopiera. Markera adressen och kopiera den manuellt.");
      return;
    }
    setCopied(true);
    toast.success(message);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), COPIED_RESET_MS);
  }

  return { copied, copy };
}

export function CopyButton({
  value,
  label = "Kopiera",
  copiedLabel = "Kopierad",
  message = "Kopierad",
  className,
  ...props
}: Omit<ComponentProps<typeof Button>, "onClick" | "children" | "value"> & {
  /** The text to copy. */
  value: string;
  label?: string;
  copiedLabel?: string;
  /** Toast text on success. */
  message?: string;
}) {
  const { copied, copy } = useCopy(value, message);
  return (
    <Button
      type="button"
      variant="outline"
      onClick={copy}
      className={cn(copied && "border-brand-300 bg-brand-50 text-brand-800", className)}
      {...props}
    >
      {copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  );
}

/** Read-only field with a copy button. Tapping the field selects the whole value so manual copying works too. */
export function CopyField({ id, label, value, message }: { id: string; label: string; value: string; message?: string }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        readOnly
        value={value}
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        onClick={(event) => event.currentTarget.select()}
        className={cn(inputClass, "select-all bg-ink-50 font-mono text-sm sm:text-[15px]")}
      />
      <CopyButton value={value} message={message} className="w-full sm:w-auto" />
    </div>
  );
}
