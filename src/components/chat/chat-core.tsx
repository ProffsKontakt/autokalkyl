"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  AlertCircle,
  Camera,
  Check,
  Copy,
  ExternalLink,
  FileSearch,
  Globe,
  ImageIcon,
  ImagePlus,
  Info,
  Loader2,
  ReceiptText,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo";
import { compressImage } from "@/lib/client/image-compress";
import { streamChat, type ChatAttachmentMimeType, type ChatRequestBody } from "@/lib/client/ndjson";
import { MarkdownLite } from "./markdown-lite";

/* ------------------------------------------------------------------------------------------------
 * Shared chat internals: the streaming hook plus the message list, composer and helper components
 * used by both the full chat page (ChatClient) and the compact receipt panel (ReceiptChat).
 * ---------------------------------------------------------------------------------------------- */

export type ChatRole = "user" | "assistant";

export interface ChatSource {
  title: string;
  url: string;
}

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  text: string;
  /** ISO timestamp */
  createdAt: string;
  sources?: ChatSource[];
  /** Local preview data URLs for images attached during this session. */
  images?: string[];
  /** Number of images attached (stored history keeps only a marker, not the bytes). */
  imageCount?: number;
  streaming?: boolean;
  aborted?: boolean;
}

export interface ChatAttachmentPreview {
  id: string;
  name: string;
  mimeType: ChatAttachmentMimeType;
  dataUrl: string;
  /** Base64 without the data: prefix – what the API expects. */
  base64: string;
}

export interface ChatActivity {
  name: string;
  label: string;
}

export interface SuggestedPrompt {
  text: string;
  hint?: string;
  /** Put the text in the composer instead of sending right away (e.g. when a photo should be attached). */
  fill?: boolean;
}

export const MAX_ATTACHMENTS = 3;
/** Server limit is 1.5M base64 chars per image and ~3.6M in total; keep a margin. */
const MAX_ATTACHMENT_CHARS = 1_400_000;
const MAX_TOTAL_ATTACHMENT_CHARS = 3_400_000;
const IMAGE_ONLY_TEXT = "Vad ser du på bilden? Hjälp mig med det.";

export const DEFAULT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { text: "Vilken garanti har min tv?" },
  { text: "Hitta bruksanvisningen till min diskmaskin" },
  { text: "Vad köpte jag på Bauhaus i våras?" },
  { text: "Min tv visar ett felmeddelande – vad gör jag?", hint: "Bifoga gärna en bild på felmeddelandet", fill: true },
];

export const RECEIPT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  { text: "Vilken garanti gäller?" },
  { text: "Hitta bruksanvisningen" },
  { text: "Hur reklamerar jag?" },
];

/* ---------- Helpers ---------- */

function localId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
}

function isValidSource(value: unknown): value is ChatSource {
  if (!value || typeof value !== "object") return false;
  const v = value as { title?: unknown; url?: unknown };
  return typeof v.url === "string" && /^https?:\/\//i.test(v.url);
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

const stampFormatter = new Intl.DateTimeFormat("sv-SE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Stockholm",
});

/** "6 sep. 14:03" – fixed time zone so server and client render the same text. */
export function formatStamp(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : stampFormatter.format(d);
}

function base64Of(dataUrl: string): { mimeType: ChatAttachmentMimeType; base64: string } {
  const comma = dataUrl.indexOf(",");
  const header = comma === -1 ? "" : dataUrl.slice(0, comma);
  const match = /^data:(image\/(?:jpeg|png|webp|gif));base64$/i.exec(header);
  const mimeType = (match?.[1]?.toLowerCase() as ChatAttachmentMimeType | undefined) ?? "image/jpeg";
  return { mimeType, base64: comma === -1 ? "" : dataUrl.slice(comma + 1) };
}

/** Downscales an image to ~1280 px JPEG and encodes it for the chat API. */
export async function prepareAttachment(file: File): Promise<ChatAttachmentPreview> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Bara bilder kan bifogas (till exempel JPEG, PNG eller WebP).");
  }
  let result = await compressImage(file, { maxSize: 1280, quality: 0.82 });
  let encoded = base64Of(result.dataUrl);
  // An empty data URL means the browser could not decode the file (e.g. HEIC) and it was passed through untouched.
  if (!encoded.base64) {
    throw new Error("Bilden kunde inte läsas. Prova med en JPEG- eller PNG-bild.");
  }
  if (encoded.base64.length > MAX_ATTACHMENT_CHARS) {
    result = await compressImage(file, { maxSize: 1024, quality: 0.6 });
    encoded = base64Of(result.dataUrl);
  }
  if (!encoded.base64 || encoded.base64.length > MAX_ATTACHMENT_CHARS) {
    throw new Error("Bilden är för stor även efter komprimering. Prova med en mindre bild.");
  }
  return { id: localId("img"), name: file.name || "bild.jpg", mimeType: encoded.mimeType, dataUrl: result.dataUrl, base64: encoded.base64 };
}

/* ---------- Hook ---------- */

export interface UseChatOptions {
  conversationId?: string | null;
  receiptId?: string | null;
  initialMessages?: ChatMessageData[];
  onConversationCreated?: (id: string) => void;
  onDone?: (info: { conversationId: string; messageId: string; isNew: boolean }) => void;
}

export interface UseChatResult {
  messages: ChatMessageData[];
  status: "idle" | "streaming";
  activity: ChatActivity | null;
  error: string | null;
  conversationId: string | null;
  canRetry: boolean;
  send: (text: string, attachments?: ChatAttachmentPreview[]) => Promise<void>;
  retry: () => Promise<void>;
  abort: () => void;
  dismissError: () => void;
}

interface LastRequest {
  text: string;
  attachments: ChatAttachmentPreview[];
  userMessageId: string;
}

/**
 * Drives one conversation with the assistant: optimistic user message, streamed assistant reply,
 * tool/status activity, sources, errors and aborts. The conversation id is remembered after the
 * first reply so later messages continue the same thread.
 */
export function useChat(options: UseChatOptions): UseChatResult {
  const { receiptId = null, onConversationCreated, onDone } = options;
  const [messages, setMessages] = React.useState<ChatMessageData[]>(() => options.initialMessages ?? []);
  const [conversationId, setConversationId] = React.useState<string | null>(options.conversationId ?? null);
  const [status, setStatus] = React.useState<"idle" | "streaming">("idle");
  const [activity, setActivity] = React.useState<ChatActivity | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [lastRequest, setLastRequest] = React.useState<LastRequest | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  // Stop an in-flight request when the component goes away (navigation, conversation switch).
  React.useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  async function send(rawText: string, attachments: ChatAttachmentPreview[] = []): Promise<void> {
    if (status === "streaming") return;
    const text = rawText.trim() || (attachments.length ? IMAGE_ONLY_TEXT : "");
    if (!text) return;

    const controller = new AbortController();
    abortRef.current = controller;
    const now = new Date().toISOString();
    const userMessageId = localId("user");
    const assistantId = localId("assistant");
    const startedWith = conversationId;

    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: "user",
        text,
        createdAt: now,
        images: attachments.map((a) => a.dataUrl),
        imageCount: attachments.length || undefined,
      },
      { id: assistantId, role: "assistant", text: "", createdAt: now, streaming: true },
    ]);
    setLastRequest({ text, attachments, userMessageId });
    setStatus("streaming");
    setActivity(null);
    setError(null);

    const body: ChatRequestBody = {
      text,
      conversationId: startedWith ?? undefined,
      receiptId: receiptId ?? undefined,
      attachments: attachments.length ? attachments.map((a) => ({ mimeType: a.mimeType, data: a.base64 })) : undefined,
    };

    let errorMessage: string | null = null;
    let completed: { conversationId: string; messageId: string } | null = null;
    let activeConversation = startedWith;

    try {
      for await (const event of streamChat(body, { signal: controller.signal })) {
        switch (event.type) {
          case "conversation":
            if (!activeConversation) {
              activeConversation = event.id;
              setConversationId(event.id);
              onConversationCreated?.(event.id);
            }
            break;
          case "text":
            setActivity(null);
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, text: m.text + event.text } : m)));
            break;
          case "tool":
            setActivity({ name: event.name, label: event.label });
            break;
          case "status":
            setActivity({ name: "status", label: event.text });
            break;
          case "sources": {
            const items = event.items.filter(isValidSource).map((s) => ({ title: s.title || hostOf(s.url), url: s.url }));
            if (items.length) setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, sources: items } : m)));
            break;
          }
          case "error":
            errorMessage = event.message;
            break;
          case "done":
            completed = { conversationId: event.conversationId, messageId: event.messageId };
            break;
        }
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        errorMessage = err instanceof Error && err.message ? err.message : "Något gick fel. Försök igen.";
      }
    }

    const aborted = controller.signal.aborted;
    if (abortRef.current === controller) abortRef.current = null;
    const finished = completed;

    setMessages((prev) =>
      prev.flatMap((m) => {
        if (m.id !== assistantId) return [m];
        // Nothing arrived before the error/abort – drop the empty bubble, keep the user's message.
        if (!m.text.trim() && (aborted || errorMessage)) return [];
        return [{ ...m, id: finished?.messageId ?? m.id, streaming: false, aborted: aborted || undefined }];
      }),
    );
    setActivity(null);
    setStatus("idle");
    if (errorMessage && !aborted) setError(errorMessage);
    if (finished) onDone?.({ ...finished, isNew: !startedWith });
  }

  async function retry(): Promise<void> {
    if (!lastRequest || status === "streaming") return;
    const { text, attachments, userMessageId } = lastRequest;
    setMessages((prev) => prev.filter((m) => m.id !== userMessageId));
    setError(null);
    await send(text, attachments);
  }

  function abort() {
    abortRef.current?.abort();
  }

  function dismissError() {
    setError(null);
  }

  return {
    messages,
    status,
    activity,
    error,
    conversationId,
    canRetry: error !== null && lastRequest !== null,
    send,
    retry,
    abort,
    dismissError,
  };
}

/* ---------- Small presentational pieces ---------- */

export function AssistantAvatar({ className }: { className?: string }) {
  return (
    <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-900", className)} aria-hidden>
      <LogoMark size={18} />
    </span>
  );
}

function ActivityIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "search_receipts":
    case "get_receipt":
      return <ReceiptText className={className} aria-hidden />;
    case "web_search":
      return <Globe className={className} aria-hidden />;
    case "web_fetch":
      return <FileSearch className={className} aria-hidden />;
    default:
      return <Sparkles className={className} aria-hidden />;
  }
}

export function ActivityChip({ activity }: { activity: ChatActivity }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-800" role="status">
      <ActivityIcon name={activity.name} className="h-3.5 w-3.5" />
      <span>{activity.label}</span>
      <Loader2 className="h-3 w-3 animate-spin text-brand-500" aria-hidden />
    </span>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1 py-1" role="status" aria-label="Assistenten skriver">
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400" style={{ animationDelay: `${i * 150}ms` }} aria-hidden />
      ))}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Kunde inte kopiera texten.");
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Kopierat" : "Kopiera svaret"}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
    >
      {copied ? <Check className="h-3 w-3 text-success" aria-hidden /> : <Copy className="h-3 w-3" aria-hidden />}
      {copied ? "Kopierat" : "Kopiera"}
    </button>
  );
}

function SourcesList({ sources }: { sources: ChatSource[] }) {
  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-500">Källor</p>
      <ul className="space-y-1.5">
        {sources.map((source) => (
          <li key={source.url}>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 text-sm">
              <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-400 group-hover:text-brand-600" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-medium text-brand-700 group-hover:underline">{source.title || hostOf(source.url)}</span>
                <span className="block truncate text-xs text-ink-400">{hostOf(source.url)}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MessageBubble({ message, activity, compact }: { message: ChatMessageData; activity: ChatActivity | null; compact: boolean }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end animate-fade-up">
        <div className={cn("min-w-0", compact ? "max-w-[90%]" : "max-w-[85%] sm:max-w-[75%]")}>
          {message.images?.length ? (
            <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
              {message.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={`${message.id}-${i}`} src={src} alt={`Bifogad bild ${i + 1}`} className="h-24 w-24 rounded-xl border border-ink-200 object-cover" />
              ))}
            </div>
          ) : message.imageCount ? (
            <div className="mb-1.5 flex justify-end">
              <span className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2.5 py-1 text-xs text-ink-600">
                <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                {message.imageCount === 1 ? "1 bild bifogad" : `${message.imageCount} bilder bifogade`}
              </span>
            </div>
          ) : null}
          <div
            className={cn(
              "whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-ink-900 text-white",
              compact ? "px-3.5 py-2 text-sm leading-relaxed" : "px-4 py-2.5 text-[15px] leading-relaxed",
            )}
          >
            {message.text}
          </div>
          <time dateTime={message.createdAt} className="mt-1 block text-right text-[11px] text-ink-400">
            {formatStamp(message.createdAt)}
          </time>
        </div>
      </div>
    );
  }

  const showActivity = message.streaming && activity;
  const showTyping = message.streaming && !activity && !message.text;

  return (
    <div className="flex items-start gap-2.5 animate-fade-up">
      <AssistantAvatar className="mt-1" />
      <div className={cn("min-w-0 flex-1", compact ? "max-w-[92%]" : "max-w-[92%] sm:max-w-[85%]")}>
        <div className={cn("rounded-2xl rounded-bl-md border border-ink-200/80 bg-white shadow-soft", compact ? "px-3.5 py-2.5" : "px-4 py-3")}>
          {message.text ? <MarkdownLite text={message.text} className={compact ? "text-sm" : undefined} /> : null}
          {showTyping ? <TypingDots /> : null}
          {showActivity ? (
            <div className={message.text ? "mt-2.5" : undefined}>
              <ActivityChip activity={activity} />
            </div>
          ) : null}
          {message.sources?.length ? <SourcesList sources={message.sources} /> : null}
          {message.aborted ? <p className="mt-2 text-xs italic text-ink-400">Svaret avbröts.</p> : null}
        </div>
        {!message.streaming ? (
          <div className="mt-1 flex items-center gap-2">
            <time dateTime={message.createdAt} className="text-[11px] text-ink-400">
              {formatStamp(message.createdAt)}
            </time>
            {message.text ? <CopyButton text={message.text} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ---------- Message list ---------- */

export interface MessageListProps {
  messages: ChatMessageData[];
  streaming: boolean;
  activity: ChatActivity | null;
  error: string | null;
  canRetry?: boolean;
  onRetry?: () => void;
  onDismissError: () => void;
  /** Shown instead of the (empty) list when there are no messages yet. */
  emptyState?: React.ReactNode;
  compact?: boolean;
  className?: string;
}

export function MessageList({ messages, streaming, activity, error, canRetry = false, onRetry, onDismissError, emptyState, compact = false, className }: MessageListProps) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const countRef = React.useRef(0);
  const [pinned, setPinned] = React.useState(true);
  const reduceMotion = useReducedMotion();

  // Follow the conversation while the user is at the bottom; always jump when a new message is added.
  React.useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const grew = messages.length > countRef.current;
    countRef.current = messages.length;
    if (!pinned && !grew) return;
    el.scrollTo({ top: el.scrollHeight, behavior: grew && !reduceMotion ? "smooth" : "auto" });
  }, [messages, activity, error, pinned, reduceMotion]);

  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    const el = event.currentTarget;
    setPinned(el.scrollHeight - el.scrollTop - el.clientHeight < 48);
  }

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-busy={streaming}
      className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain bg-ink-50/60", compact ? "p-3" : "px-4 py-4 sm:px-6 sm:py-5", className)}
    >
      {messages.length === 0 && emptyState ? emptyState : null}
      <div className={cn("mx-auto flex flex-col", compact ? "gap-3" : "max-w-3xl gap-4")}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} activity={message.streaming ? activity : null} compact={compact} />
        ))}
      </div>
      {error ? (
        <div role="alert" className={cn("mx-auto mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800", !compact && "max-w-3xl")}>
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <div className="min-w-0 flex-1">
            <p>{error}</p>
            {canRetry && onRetry ? (
              <button type="button" onClick={onRetry} className="mt-1.5 font-semibold underline underline-offset-2 hover:text-red-900">
                Försök igen
              </button>
            ) : null}
          </div>
          <button type="button" onClick={onDismissError} aria-label="Stäng felmeddelandet" className="rounded-md p-1 text-red-700 hover:bg-red-100">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Suggested prompts ---------- */

export function SuggestedPrompts({
  prompts,
  onPick,
  disabled = false,
  compact = false,
  className,
}: {
  prompts: SuggestedPrompt[];
  onPick: (prompt: SuggestedPrompt) => void;
  disabled?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn(compact ? "flex flex-wrap gap-2" : "grid w-full gap-2 sm:grid-cols-2", className)} aria-label="Förslag på frågor">
      {prompts.map((prompt) => (
        <li key={prompt.text} className={compact ? undefined : "flex"}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPick(prompt)}
            className={cn(
              "text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              compact
                ? "rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                : "flex w-full flex-col gap-1 rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-800 shadow-soft hover:border-brand-300 hover:bg-brand-50",
            )}
          >
            <span className="font-medium">{prompt.text}</span>
            {prompt.hint && !compact ? (
              <span className="flex items-center gap-1 text-xs font-normal text-ink-400">
                <Camera className="h-3.5 w-3.5" aria-hidden />
                {prompt.hint}
              </span>
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}

/* ---------- AI not configured ---------- */

export function NotConfiguredNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("border-t border-ink-100 bg-white", compact ? "p-2.5" : "p-3 sm:p-4")}>
      <div className="flex items-start gap-3 rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <div className="text-sm">
          <p className="font-semibold text-ink-900">AI-assistenten är inte aktiverad ännu</p>
          <p className="mt-0.5 text-ink-500">AI-assistenten aktiveras när ANTHROPIC_API_KEY är satt. Tidigare konversationer visas fortfarande här.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- Composer ---------- */

export interface ComposerHandle {
  /** Replaces the draft text and focuses the textarea. */
  insert: (text: string) => void;
  focus: () => void;
}

export interface ComposerProps {
  onSend: (text: string, attachments: ChatAttachmentPreview[]) => void | Promise<void>;
  onAbort: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
  compact?: boolean;
}

export const Composer = React.forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSend, onAbort, streaming, disabled = false, placeholder = "Fråga om ett kvitto, en garanti eller ett problem…", compact = false },
  ref,
) {
  const [text, setText] = React.useState("");
  const [attachments, setAttachments] = React.useState<ChatAttachmentPreview[]>([]);
  const [compressing, setCompressing] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaId = React.useId();

  React.useImperativeHandle(
    ref,
    () => ({
      insert(value: string) {
        setText(value);
        textareaRef.current?.focus();
      },
      focus() {
        textareaRef.current?.focus();
      },
    }),
    [],
  );

  // Grow with the content, up to a few lines.
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, compact ? 120 : 200)}px`;
  }, [text, compact]);

  const attachDisabled = disabled || streaming || compressing || attachments.length >= MAX_ATTACHMENTS;
  const canSend = !disabled && !streaming && !compressing && (text.trim().length > 0 || attachments.length > 0);

  function submit() {
    if (!canSend) return;
    const value = text;
    const payload = attachments;
    setText("");
    setAttachments([]);
    void onSend(value, payload);
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  async function addFiles(files: File[]) {
    if (disabled || streaming) return;
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.error(`Du kan bifoga högst ${MAX_ATTACHMENTS} bilder per meddelande.`);
      return;
    }
    const picked = files.slice(0, room);
    if (files.length > room) {
      toast.info(`Bara ${room === 1 ? "en bild till" : `${room} bilder till`} får plats – högst ${MAX_ATTACHMENTS} per meddelande.`);
    }
    setCompressing(true);
    try {
      const prepared: ChatAttachmentPreview[] = [];
      for (const file of picked) {
        try {
          prepared.push(await prepareAttachment(file));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Bilden kunde inte läsas.");
        }
      }
      if (!prepared.length) return;
      const total = [...attachments, ...prepared].reduce((sum, a) => sum + a.base64.length, 0);
      if (total > MAX_TOTAL_ATTACHMENT_CHARS) {
        toast.error("Bilderna är för stora tillsammans. Ta bort någon bild eller välj mindre bilder.");
        return;
      }
      setAttachments((prev) => [...prev, ...prepared]);
    } finally {
      setCompressing(false);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length) void addFiles(files);
  }

  function handlePaste(event: React.ClipboardEvent<HTMLTextAreaElement>) {
    const files = Array.from(event.clipboardData.files).filter((f) => f.type.startsWith("image/"));
    if (files.length) {
      event.preventDefault();
      void addFiles(files);
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  const iconButton = "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors disabled:cursor-not-allowed";

  return (
    <div className={cn("border-t border-ink-100 bg-white", compact ? "p-2.5" : "p-3 sm:p-4")}>
      {attachments.length ? (
        <ul className="mb-2 flex flex-wrap gap-2" aria-label="Bifogade bilder">
          {attachments.map((attachment, i) => (
            <li key={attachment.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={attachment.dataUrl} alt={`Bifogad bild ${i + 1}: ${attachment.name}`} className="h-16 w-16 rounded-xl border border-ink-200 object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                aria-label={`Ta bort bild ${i + 1}`}
                className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-white shadow-soft hover:bg-ink-700"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div
        className={cn(
          "flex items-end gap-1.5 rounded-2xl border border-ink-200 bg-white px-1.5 py-1.5 transition-colors focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200",
          disabled && "bg-ink-50",
        )}
      >
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} disabled={attachDisabled} tabIndex={-1} aria-hidden />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={attachDisabled}
          aria-label={compressing ? "Förbereder bild" : "Bifoga bild"}
          title="Bifoga bild"
          className={cn(iconButton, "text-ink-500 hover:bg-ink-100 hover:text-ink-900 disabled:opacity-50")}
        >
          {compressing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <ImagePlus className="h-5 w-5" aria-hidden />}
        </button>

        <label htmlFor={textareaId} className="sr-only">
          Skriv ditt meddelande
        </label>
        <textarea
          id={textareaId}
          ref={textareaRef}
          rows={1}
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          disabled={disabled}
          enterKeyHint="send"
          className={cn(
            "min-h-10 flex-1 resize-none bg-transparent px-1 py-2.5 leading-relaxed text-ink-900 placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed",
            compact ? "max-h-[120px] text-sm" : "max-h-[200px] text-[15px]",
          )}
        />

        {streaming ? (
          <button type="button" onClick={onAbort} aria-label="Avbryt svaret" title="Avbryt" className={cn(iconButton, "bg-ink-900 text-white hover:bg-ink-700")}>
            <Square className="h-4 w-4" fill="currentColor" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!canSend}
            aria-label="Skicka"
            title="Skicka (Enter)"
            className={cn(iconButton, "bg-brand-600 text-white shadow-soft hover:bg-brand-700 disabled:bg-ink-200 disabled:text-ink-400 disabled:shadow-none")}
          >
            <Send className="h-4.5 w-4.5" aria-hidden />
          </button>
        )}
      </div>

      {!compact ? (
        <p className="mt-1.5 hidden text-[11px] text-ink-400 sm:block">
          Enter skickar · Shift+Enter ger ny rad · Du kan bifoga upp till {MAX_ATTACHMENTS} bilder, till exempel ett felmeddelande.
        </p>
      ) : null}
    </div>
  );
});
