import PostalMime from "postal-mime";

/** Provider-agnostic representation of an inbound email. */
export interface InboundMessage {
  recipients: string[]; // all candidate recipient addresses (to, cc, envelope, original recipient)
  from: string;
  subject: string | null;
  text: string | null;
  html: string | null;
  attachments: InboundAttachment[];
}

export interface InboundAttachment {
  filename: string | null;
  mimeType: string;
  data: Buffer;
}

function addrList(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(addrList);
  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    return addrList(o.Email ?? o.email ?? o.address ?? o.Address);
  }
  return String(value)
    .split(",")
    .map((s) => s.trim())
    .map((s) => {
      const m = s.match(/<([^>]+)>/);
      return (m ? m[1] : s).trim().toLowerCase();
    })
    .filter((s) => s.includes("@"));
}

function base64ToBuffer(content: unknown): Buffer | null {
  if (typeof content !== "string" || !content) return null;
  try {
    return Buffer.from(content, "base64");
  } catch {
    return null;
  }
}

/** Postmark inbound webhook JSON, or a generic JSON body { to, from, subject, text, html, attachments: [{filename, contentType, content}] }. */
export function parseJsonInbound(body: Record<string, unknown>): InboundMessage {
  const recipients = new Set<string>();
  for (const key of ["OriginalRecipient", "To", "ToFull", "Cc", "CcFull", "Bcc", "BccFull", "to", "cc", "recipient", "recipients", "envelope_to"]) {
    for (const a of addrList(body[key])) recipients.add(a);
  }
  const envelope = body.envelope;
  if (envelope && typeof envelope === "object") {
    for (const a of addrList((envelope as Record<string, unknown>).to)) recipients.add(a);
  }
  const rawAttachments = (body.Attachments ?? body.attachments ?? []) as unknown[];
  const attachments: InboundAttachment[] = [];
  for (const a of Array.isArray(rawAttachments) ? rawAttachments : []) {
    if (!a || typeof a !== "object") continue;
    const o = a as Record<string, unknown>;
    const data = base64ToBuffer(o.Content ?? o.content ?? o.data);
    if (!data) continue;
    attachments.push({
      filename: (o.Name ?? o.name ?? o.filename ?? null) as string | null,
      mimeType: String(o.ContentType ?? o.contentType ?? o.content_type ?? o.mimeType ?? "application/octet-stream").toLowerCase(),
      data,
    });
  }
  return {
    recipients: [...recipients],
    from: addrList(body.From ?? body.from ?? body.sender ?? body.FromFull)[0] ?? "unknown@unknown",
    subject: (body.Subject ?? body.subject ?? null) as string | null,
    text: (body.TextBody ?? body.text ?? body["body-plain"] ?? body.plain ?? null) as string | null,
    html: (body.HtmlBody ?? body.html ?? body["body-html"] ?? null) as string | null,
    attachments,
  };
}

/** SendGrid Inbound Parse / Mailgun routes / n8n (multipart/form-data). */
export async function parseMultipartInbound(form: FormData): Promise<InboundMessage> {
  const get = (k: string) => {
    const v = form.get(k);
    return typeof v === "string" ? v : null;
  };
  const recipients = new Set<string>();
  for (const key of ["to", "To", "cc", "recipient", "envelope_to", "X-Original-To"]) {
    for (const a of addrList(get(key))) recipients.add(a);
  }
  const envelope = get("envelope");
  if (envelope) {
    try {
      const env = JSON.parse(envelope) as { to?: unknown };
      for (const a of addrList(env.to)) recipients.add(a);
    } catch {}
  }
  const attachments: InboundAttachment[] = [];
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") continue;
    const file = value as File;
    if (!/^(attachment|file|attachments)/i.test(key) && !(file.size > 0 && file.name)) continue;
    const data = Buffer.from(await file.arrayBuffer());
    if (!data.byteLength) continue;
    attachments.push({ filename: file.name || null, mimeType: (file.type || "application/octet-stream").toLowerCase(), data });
  }
  // Raw MIME embedded in the form (SendGrid "raw" mode)
  const rawEmail = get("email");
  if (rawEmail && !attachments.length) {
    const parsed = await parseRawMime(Buffer.from(rawEmail, "utf8"));
    for (const r of parsed.recipients) recipients.add(r);
    return { ...parsed, recipients: [...recipients] };
  }
  return {
    recipients: [...recipients],
    from: addrList(get("from") ?? get("sender") ?? get("From"))[0] ?? "unknown@unknown",
    subject: get("subject") ?? get("Subject"),
    text: get("text") ?? get("body-plain") ?? get("stripped-text"),
    html: get("html") ?? get("body-html") ?? get("stripped-html"),
    attachments,
  };
}

/** Raw RFC 822 message (Cloudflare Email Workers, SES, custom forwarders). */
export async function parseRawMime(raw: Buffer | string): Promise<InboundMessage> {
  const parser = new PostalMime();
  const email = await parser.parse(raw);
  const recipients = new Set<string>();
  for (const list of [email.to, email.cc, email.bcc]) {
    for (const a of list ?? []) {
      if (a.address) recipients.add(a.address.toLowerCase());
    }
  }
  for (const h of email.headers ?? []) {
    const key = h.key.toLowerCase();
    if (["x-original-to", "delivered-to", "x-envelope-to", "envelope-to", "x-forwarded-to"].includes(key)) {
      for (const a of addrList(h.value)) recipients.add(a);
    }
  }
  const attachments: InboundAttachment[] = [];
  for (const a of email.attachments ?? []) {
    const data = typeof a.content === "string" ? Buffer.from(a.content, "base64") : Buffer.from(a.content as ArrayBuffer);
    if (!data.byteLength) continue;
    attachments.push({ filename: a.filename ?? null, mimeType: (a.mimeType || "application/octet-stream").toLowerCase(), data });
  }
  return {
    recipients: [...recipients],
    from: email.from?.address?.toLowerCase() ?? "unknown@unknown",
    subject: email.subject ?? null,
    text: email.text ?? null,
    html: email.html ?? null,
    attachments,
  };
}

/** Extracts the inbound token (local part without +suffix) from candidate recipient addresses. */
export function extractInboundTokens(recipients: string[], domain: string | null): string[] {
  const tokens: string[] = [];
  for (const r of recipients) {
    const [local, host] = r.toLowerCase().split("@");
    if (!local || !host) continue;
    if (domain && host !== domain.toLowerCase()) {
      // Allow any domain when strict matching finds nothing – forwarding aliases often rewrite the domain.
    }
    const token = local.split("+")[0];
    if (token.startsWith("kvitto-")) tokens.push(token);
  }
  // Prefer exact-domain matches first
  if (domain) {
    tokens.sort((a, b) => {
      const ad = recipients.some((r) => r.toLowerCase() === `${a}@${domain.toLowerCase()}`) ? 0 : 1;
      const bd = recipients.some((r) => r.toLowerCase() === `${b}@${domain.toLowerCase()}`) ? 0 : 1;
      return ad - bd;
    });
  }
  return [...new Set(tokens)];
}

/** Picks which parts of the email become receipt files. */
export function selectReceiptParts(msg: InboundMessage): { files: { data: Buffer; mimeType: string; originalName: string | null }[]; extraText: string | null } {
  const files: { data: Buffer; mimeType: string; originalName: string | null }[] = [];
  for (const a of msg.attachments) {
    const isImage = a.mimeType.startsWith("image/");
    const isPdf = a.mimeType === "application/pdf" || (a.filename?.toLowerCase().endsWith(".pdf") ?? false);
    if (!isImage && !isPdf) continue;
    // Skip tiny images (signatures, tracking pixels, logos)
    if (isImage && a.data.byteLength < 12 * 1024) continue;
    files.push({ data: a.data, mimeType: isPdf ? "application/pdf" : a.mimeType, originalName: a.filename });
    if (files.length >= 8) break;
  }
  if (!files.length) {
    if (msg.html && msg.html.trim().length > 0) {
      files.push({ data: Buffer.from(msg.html, "utf8"), mimeType: "text/html", originalName: "kvitto.html" });
    } else if (msg.text && msg.text.trim().length > 0) {
      files.push({ data: Buffer.from(msg.text, "utf8"), mimeType: "text/plain", originalName: "kvitto.txt" });
    }
  }
  return { files, extraText: msg.text?.trim() ? msg.text.trim().slice(0, 20000) : null };
}
