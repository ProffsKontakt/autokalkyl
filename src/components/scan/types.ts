/** Shared types and helpers for the scan/upload flow (client only). */

export type ScanMode = "camera" | "upload";
export type PageOrigin = "camera" | "file";
export type PageKind = "image" | "pdf";

export interface ScanPage {
  id: string;
  file: File;
  kind: PageKind;
  origin: PageOrigin;
  /** Object URL for the thumbnail – empty for PDF. Revoke with `releasePage` when removed. */
  previewUrl: string;
  name: string;
  size: number;
}

/** Mirrors the server limits in src/lib/receipts/files.ts (that module is server-only). */
export const MAX_PAGES = 8;
export const MAX_FILE_BYTES = 4 * 1024 * 1024;
export const MAX_REQUEST_BYTES = 4.2 * 1024 * 1024;

const EXTENSION_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  pdf: "application/pdf",
};

function extensionOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Resolves the MIME type, guessing from the extension when the browser reports none (common for HEIC). */
export function resolveMimeType(file: File): string {
  const type = (file.type || "").toLowerCase().split(";")[0].trim();
  if (type && type !== "application/octet-stream") return type;
  return EXTENSION_MIME[extensionOf(file.name)] ?? "";
}

export function kindOf(file: File): PageKind | null {
  const type = resolveMimeType(file);
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "image";
  return null;
}

/** Returns a File with a correct MIME type set, so the server can validate it. */
export function normalizeFile(file: File): File {
  const type = resolveMimeType(file);
  if (!type || type === file.type) return file;
  try {
    return new File([file], file.name, { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}

let counter = 0;
export function newPageId(): string {
  counter += 1;
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `page-${Date.now().toString(36)}-${counter}`;
}

export function createPage(input: File, origin: PageOrigin): ScanPage | null {
  const kind = kindOf(input);
  if (!kind) return null;
  const file = normalizeFile(input);
  return {
    id: newPageId(),
    file,
    kind,
    origin,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : "",
    name: file.name || (kind === "pdf" ? "kvitto.pdf" : "kvitto.jpg"),
    size: file.size,
  };
}

export function releasePage(page: ScanPage): void {
  if (page.previewUrl) {
    try {
      URL.revokeObjectURL(page.previewUrl);
    } catch {
      // ignore – the URL may already be revoked
    }
  }
}

/** Human-friendly description of the accepted file types (used in hints and errors). */
export const ACCEPTED_TYPES_LABEL = "JPG, PNG, HEIC, WebP eller PDF";
