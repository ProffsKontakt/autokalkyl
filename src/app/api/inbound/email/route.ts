import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/audit";
import { inboundEmailDomain } from "@/lib/brand";
import { createAndProcessReceipt } from "@/lib/receipts/pipeline";
import { extractInboundTokens, parseJsonInbound, parseMultipartInbound, parseRawMime, selectReceiptParts, type InboundMessage } from "@/lib/inbound/parse";

export const runtime = "nodejs";
export const maxDuration = 120;

function secretOk(request: Request): boolean {
  const expected = process.env.INBOUND_EMAIL_SECRET?.trim();
  if (!expected) return false;
  const url = new URL(request.url);
  const candidates: string[] = [];
  const header = request.headers.get("x-inbound-secret");
  if (header) candidates.push(header.trim());
  const query = url.searchParams.get("secret");
  if (query) candidates.push(query.trim());
  const authz = request.headers.get("authorization");
  if (authz?.startsWith("Basic ")) {
    try {
      const decoded = Buffer.from(authz.slice(6), "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      candidates.push(idx >= 0 ? decoded.slice(idx + 1) : decoded);
    } catch {}
  } else if (authz?.startsWith("Bearer ")) {
    candidates.push(authz.slice(7).trim());
  }
  const exp = Buffer.from(expected);
  return candidates.some((c) => {
    const buf = Buffer.from(c);
    return buf.length === exp.length && timingSafeEqual(buf, exp);
  });
}

/**
 * Inbound receipt e-mail webhook.
 * Accepts: Postmark JSON, generic JSON, SendGrid/Mailgun/n8n multipart, or raw MIME (message/rfc822).
 * Auth: INBOUND_EMAIL_SECRET via header x-inbound-secret, ?secret=, Basic-auth password or Bearer token.
 */
export async function POST(request: Request) {
  if (!secretOk(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  let message: InboundMessage;
  try {
    if (contentType.includes("application/json")) {
      message = parseJsonInbound((await request.json()) as Record<string, unknown>);
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      message = await parseMultipartInbound(await request.formData());
    } else {
      message = await parseRawMime(Buffer.from(await request.arrayBuffer()));
    }
  } catch (error) {
    console.error("[inbound] parse failed", error);
    return NextResponse.json({ error: "Could not parse message" }, { status: 400 });
  }

  // Explicit recipient override (useful for Cloudflare Email Workers: ?to=<address>)
  const url = new URL(request.url);
  const toParam = url.searchParams.get("to");
  if (toParam) message.recipients.unshift(toParam.toLowerCase());

  const tokens = extractInboundTokens(message.recipients, inboundEmailDomain());
  let user: { id: string; inboundToken: string } | null = null;
  for (const token of tokens) {
    user = await prisma.user.findUnique({ where: { inboundToken: token }, select: { id: true, inboundToken: true } });
    if (user) break;
  }

  const toAddress = message.recipients[0] ?? "";
  if (!user) {
    await prisma.inboundEmail.create({
      data: { toAddress: toAddress.slice(0, 254), fromAddress: message.from.slice(0, 254), subject: message.subject?.slice(0, 300), status: "REJECTED", error: "Okänd mottagaradress" },
    });
    // 200 so providers don't retry forever; the mail is simply dropped.
    return NextResponse.json({ ok: false, reason: "unknown_recipient" }, { status: 200 });
  }

  const { files, extraText } = selectReceiptParts(message);
  if (!files.length) {
    await prisma.inboundEmail.create({
      data: { userId: user.id, toAddress: toAddress.slice(0, 254), fromAddress: message.from.slice(0, 254), subject: message.subject?.slice(0, 300), status: "REJECTED", error: "Inget kvitto (ingen bild, PDF eller text) i mailet" },
    });
    return NextResponse.json({ ok: false, reason: "no_content" }, { status: 200 });
  }

  try {
    const { id, status } = await createAndProcessReceipt({
      userId: user.id,
      source: "EMAIL",
      files,
      email: { from: message.from, subject: message.subject },
      extraText,
    });
    await prisma.inboundEmail.create({
      data: { userId: user.id, receiptId: id, toAddress: toAddress.slice(0, 254), fromAddress: message.from.slice(0, 254), subject: message.subject?.slice(0, 300), status: "ACCEPTED" },
    });
    await audit(user.id, "receipt.email_received", { receiptId: id, details: { from: message.from, files: files.length } });
    return NextResponse.json({ ok: true, receiptId: id, status }, { status: 200 });
  } catch (error) {
    console.error("[inbound] failed", error);
    await prisma.inboundEmail.create({
      data: { userId: user.id, toAddress: toAddress.slice(0, 254), fromAddress: message.from.slice(0, 254), subject: message.subject?.slice(0, 300), status: "FAILED", error: String(error).slice(0, 500) },
    });
    return NextResponse.json({ ok: false, error: "processing_failed" }, { status: 500 });
  }
}
