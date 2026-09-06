import sharp from "sharp";
import { createHash } from "node:crypto";
import type { FileKind } from "@prisma/client";

export const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB per file
export const MAX_FILES_PER_RECEIPT = 8;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic", "image/heif", "image/avif", "image/tiff", "image/bmp"];
export const ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, "application/pdf", "text/html", "text/plain"];

export interface PreparedFile {
  kind: FileKind;
  mimeType: string;
  data: Buffer;
  thumbnail: Buffer | null;
  width: number | null;
  height: number | null;
  byteSize: number;
  sha256: string;
  originalName: string | null;
}

export function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function kindForMime(mimeType: string): FileKind | null {
  const m = mimeType.toLowerCase().split(";")[0].trim();
  if (ALLOWED_IMAGE_TYPES.includes(m)) return "IMAGE";
  if (m === "application/pdf") return "PDF";
  if (m === "text/html") return "EMAIL_HTML";
  if (m === "text/plain") return "EMAIL_TEXT";
  return null;
}

/**
 * Normalises an uploaded file for storage:
 * - Images: auto-rotate (EXIF), cap at 2200px on the long edge, re-encode as JPEG (q85), build a 480px thumbnail.
 * - PDF/HTML/text: stored as-is.
 */
export async function prepareFile(input: { data: Buffer; mimeType: string; originalName?: string | null }): Promise<PreparedFile> {
  const kind = kindForMime(input.mimeType);
  if (!kind) throw new Error(`Filtypen stöds inte: ${input.mimeType}`);
  if (input.data.byteLength === 0) throw new Error("Filen är tom.");
  if (input.data.byteLength > MAX_FILE_BYTES) throw new Error("Filen är för stor (max 15 MB).");

  if (kind === "IMAGE") {
    const pipeline = sharp(input.data, { failOn: "none", limitInputPixels: 80_000_000 }).rotate();
    const meta = await pipeline.metadata();
    const data = await pipeline
      .clone()
      .resize({ width: 2200, height: 2200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
    const thumbnail = await sharp(data)
      .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 72 })
      .toBuffer();
    const finalMeta = await sharp(data).metadata();
    return {
      kind,
      mimeType: "image/jpeg",
      data,
      thumbnail,
      width: finalMeta.width ?? meta.width ?? null,
      height: finalMeta.height ?? meta.height ?? null,
      byteSize: data.byteLength,
      sha256: sha256(data),
      originalName: input.originalName ?? null,
    };
  }

  return {
    kind,
    mimeType: kind === "PDF" ? "application/pdf" : kind === "EMAIL_HTML" ? "text/html" : "text/plain",
    data: input.data,
    thumbnail: null,
    width: null,
    height: null,
    byteSize: input.data.byteLength,
    sha256: sha256(input.data),
    originalName: input.originalName ?? null,
  };
}

/** Very small HTML → text conversion for e-receipts (no external deps). */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6]|table|section)>/gi, "\n")
    .replace(/<td[^>]*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}
