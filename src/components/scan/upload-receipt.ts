/**
 * Uploads one receipt (1–8 files) to POST /api/receipts/upload using XMLHttpRequest so we can
 * report upload progress – fetch() has no upload progress events.
 */

export type UploadSource = "SCAN" | "UPLOAD";

export interface UploadProgress {
  loaded: number;
  total: number;
  /** 0–100 */
  percent: number;
}

export interface UploadResult {
  id: string;
  status: string;
}

export class UploadError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "UploadError";
    this.status = status;
  }
}

export interface UploadFile {
  blob: Blob;
  name: string;
}

function parseError(xhr: XMLHttpRequest, fallback: string): string {
  try {
    const body = JSON.parse(xhr.responseText) as { error?: unknown };
    if (body && typeof body.error === "string" && body.error.trim()) return body.error;
  } catch {
    // not JSON
  }
  return fallback;
}

function fallbackMessage(status: number): string {
  if (status === 401) return "Du har blivit utloggad. Logga in igen och försök på nytt.";
  if (status === 413) return "Filerna är för stora. Prova med färre sidor åt gången.";
  if (status === 415) return "Filtypen stöds inte. Använd JPG, PNG, HEIC, WebP eller PDF.";
  if (status === 429) return "Du har laddat upp många kvitton på kort tid. Försök igen om en stund.";
  if (status >= 500) return "Något gick fel hos oss. Försök igen om en liten stund.";
  return "Uppladdningen misslyckades. Försök igen.";
}

export function uploadReceipt(input: {
  files: UploadFile[];
  source: UploadSource;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    for (const file of input.files) form.append("files", file.blob, file.name);
    form.append("source", input.source);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/receipts/upload", true);
    xhr.responseType = "text";
    xhr.setRequestHeader("Accept", "application/json");

    const abort = () => {
      xhr.abort();
    };
    input.signal?.addEventListener("abort", abort, { once: true });
    const done = () => input.signal?.removeEventListener("abort", abort);

    xhr.upload.onprogress = (event) => {
      if (!input.onProgress) return;
      const total = event.lengthComputable ? event.total : 0;
      const loaded = event.loaded;
      const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      input.onProgress({ loaded, total, percent });
    };

    xhr.onload = () => {
      done();
      if (xhr.status === 201 || xhr.status === 200) {
        try {
          const body = JSON.parse(xhr.responseText) as { id?: unknown; status?: unknown };
          if (typeof body.id === "string" && body.id) {
            resolve({ id: body.id, status: typeof body.status === "string" ? body.status : "PROCESSING" });
            return;
          }
        } catch {
          // fall through to error
        }
        reject(new UploadError("Servern svarade på ett oväntat sätt. Kontrollera dina kvitton.", xhr.status));
        return;
      }
      reject(new UploadError(parseError(xhr, fallbackMessage(xhr.status)), xhr.status));
    };

    xhr.onerror = () => {
      done();
      reject(new UploadError("Ingen kontakt med servern. Kontrollera din uppkoppling och försök igen.", 0));
    };

    xhr.onabort = () => {
      done();
      reject(new UploadError("Uppladdningen avbröts.", 0));
    };

    xhr.ontimeout = () => {
      done();
      reject(new UploadError("Uppladdningen tog för lång tid. Försök igen.", 0));
    };

    xhr.timeout = 120_000;
    xhr.send(form);
  });
}
