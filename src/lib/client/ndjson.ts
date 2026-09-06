/**
 * Client-side helper for the assistant's NDJSON streaming protocol.
 *
 * POSTs a JSON body and yields one parsed JSON object per line of the streaming response body.
 * Lines are buffered until a newline arrives, so partial chunks (and multi-byte UTF-8 sequences
 * split across chunks) are handled. Lines that are not valid JSON are skipped.
 */

export type ChatAttachmentMimeType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export interface ChatAttachmentPayload {
  mimeType: ChatAttachmentMimeType;
  /** Base64 without the `data:` prefix. */
  data: string;
}

export interface ChatRequestBody {
  conversationId?: string;
  receiptId?: string;
  text: string;
  attachments?: ChatAttachmentPayload[];
}

/** Events emitted by POST /api/chat, one per line. Mirrors AssistantEvent in src/lib/ai/assistant.ts. */
export type ChatEvent =
  | { type: "conversation"; id: string }
  | { type: "status"; text: string }
  | { type: "text"; text: string }
  | { type: "tool"; name: string; label: string }
  | { type: "sources"; items: { title: string; url: string }[] }
  | { type: "done"; conversationId: string; messageId: string }
  | { type: "error"; message: string };

export class NdjsonRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "NdjsonRequestError";
    this.status = status;
  }
}

export const AI_NOT_CONFIGURED_MESSAGE = "AI-assistenten är inte aktiverad ännu. Den aktiveras när ANTHROPIC_API_KEY är satt.";

function defaultMessageFor(status: number): string {
  switch (status) {
    case 401:
      return "Du måste vara inloggad för att använda assistenten.";
    case 404:
      return "Konversationen hittades inte.";
    case 413:
      return "Bilderna är för stora. Skicka färre eller mindre bilder.";
    case 429:
      return "Du har skickat många frågor på kort tid. Vänta en stund och försök igen.";
    case 503:
      return AI_NOT_CONFIGURED_MESSAGE;
    default:
      return status >= 500 ? "Assistenten svarar inte just nu. Försök igen om en stund." : `Något gick fel (${status}).`;
  }
}

async function errorFromResponse(res: Response): Promise<NdjsonRequestError> {
  if (res.status === 503) return new NdjsonRequestError(AI_NOT_CONFIGURED_MESSAGE, 503);
  let message = "";
  try {
    const body: unknown = await res.json();
    if (body && typeof body === "object" && typeof (body as { error?: unknown }).error === "string") {
      message = (body as { error: string }).error;
    }
  } catch {
    // Not a JSON body – fall back to a status-based message.
  }
  return new NdjsonRequestError(message || defaultMessageFor(res.status), res.status);
}

function parseLine<T>(line: string): T | undefined {
  try {
    return JSON.parse(line) as T;
  } catch {
    return undefined;
  }
}

/**
 * POSTs `body` as JSON to `url` and yields each NDJSON line of the response as a parsed object.
 * Throws NdjsonRequestError (with the server's `{ error }` message when present) on non-2xx responses.
 * Pass an AbortSignal to cancel the request and the stream.
 */
export async function* postNdjson<T>(url: string, body: unknown, options: { signal?: AbortSignal } = {}): AsyncGenerator<T, void, undefined> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
    body: JSON.stringify(body),
    signal: options.signal,
  });
  if (!res.ok) throw await errorFromResponse(res);
  if (!res.body) throw new NdjsonRequestError("Servern skickade inget svar.", res.status);

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let newline = buffer.indexOf("\n");
      while (newline !== -1) {
        const line = buffer.slice(0, newline).trim();
        buffer = buffer.slice(newline + 1);
        if (line) {
          const event = parseLine<T>(line);
          if (event !== undefined) yield event;
        }
        newline = buffer.indexOf("\n");
      }
    }
    // Flush any trailing bytes and a final line without a newline.
    buffer += decoder.decode();
    const rest = buffer.trim();
    if (rest) {
      const event = parseLine<T>(rest);
      if (event !== undefined) yield event;
    }
  } finally {
    // Releases the connection if the consumer stops early (or the request was aborted).
    await reader.cancel().catch(() => undefined);
  }
}

/** Streams one assistant turn from POST /api/chat. */
export function streamChat(body: ChatRequestBody, options: { signal?: AbortSignal } = {}): AsyncGenerator<ChatEvent, void, undefined> {
  return postNdjson<ChatEvent>("/api/chat", body, options);
}
