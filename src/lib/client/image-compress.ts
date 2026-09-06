/**
 * Client-side image compression for receipt uploads.
 *
 * Decodes the image (createImageBitmap with EXIF orientation applied, falling back to an
 * <img> element), scales it so the long edge is at most `maxSize` px and re-encodes it as JPEG.
 * Non-images (PDF etc.) and images the browser cannot decode (e.g. HEIC outside Safari) are
 * passed through untouched so the server can handle them.
 */

export interface CompressImageOptions {
  /** Maximum length of the long edge in pixels. Default 1600. */
  maxSize?: number;
  /** JPEG quality 0–1. Default 0.85. */
  quality?: number;
}

export interface CompressImageResult {
  /** Compressed JPEG, or the original file when it could not be processed. */
  blob: Blob;
  /** `data:image/jpeg;base64,…` preview, empty when the file was passed through. */
  dataUrl: string;
  /** Output width in pixels, 0 when passed through. */
  width: number;
  /** Output height in pixels, 0 when passed through. */
  height: number;
}

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|bmp|tiff?|avif|heic|heif)$/i;

/** True if the file looks like an image – by MIME type, or by extension when the browser reports none. */
export function isImageFile(file: File): boolean {
  if (file.type) return file.type.toLowerCase().startsWith("image/");
  return IMAGE_EXTENSIONS.test(file.name);
}

type DecodedImage = { source: CanvasImageSource; width: number; height: number; release: () => void };

async function decodeWithBitmap(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    release: () => bitmap.close(),
  };
}

function decodeWithImg(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const cleanup = () => URL.revokeObjectURL(url);
    img.onload = () => {
      if (!img.naturalWidth || !img.naturalHeight) {
        cleanup();
        reject(new Error("Bilden saknar dimensioner."));
        return;
      }
      resolve({ source: img, width: img.naturalWidth, height: img.naturalHeight, release: cleanup });
    };
    img.onerror = () => {
      cleanup();
      reject(new Error("Bilden kunde inte avkodas."));
    };
    img.src = url;
  });
}

async function decode(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await decodeWithBitmap(file);
    } catch {
      // Older browsers throw on the `from-image` option or cannot decode the format – try <img>,
      // which applies EXIF orientation by default in every modern browser.
    }
  }
  try {
    return await decodeWithImg(file);
  } catch {
    return null;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), type, quality);
    } catch {
      resolve(null);
    }
  });
}

/**
 * Compresses an image file to a JPEG whose long edge is at most `maxSize` px.
 * Returns the original file (empty dataUrl, 0×0) if it is not an image or decoding fails.
 */
export async function compressImage(
  file: File,
  opts: CompressImageOptions = {},
): Promise<CompressImageResult> {
  const maxSize = Math.max(64, Math.floor(opts.maxSize ?? 1600));
  const quality = Math.min(1, Math.max(0.1, opts.quality ?? 0.85));
  const passthrough: CompressImageResult = { blob: file, dataUrl: "", width: 0, height: 0 };

  if (typeof document === "undefined" || !isImageFile(file)) return passthrough;

  const decoded = await decode(file);
  if (!decoded) return passthrough;

  try {
    const { width: sourceWidth, height: sourceHeight } = decoded;
    if (!sourceWidth || !sourceHeight) return passthrough;

    const scale = Math.min(1, maxSize / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return passthrough;

    // JPEG has no alpha: paint white first so transparent PNG areas do not turn black.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(decoded.source, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, "image/jpeg", quality);
    if (!blob || blob.size === 0) return passthrough;
    const dataUrl = canvas.toDataURL("image/jpeg", quality);

    return { blob, dataUrl, width, height };
  } catch {
    return passthrough;
  } finally {
    decoded.release();
  }
}
