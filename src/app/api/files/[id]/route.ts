import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { audit } from "@/lib/audit";

export const runtime = "nodejs";

/**
 * Serves a receipt file to its owner. `?thumb=1` returns the JPEG thumbnail (images only).
 * Files are private: authenticated, owner-checked, never cached publicly.
 */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await context.params;
  const url = new URL(request.url);
  const thumb = url.searchParams.get("thumb") === "1";
  const download = url.searchParams.get("download") === "1";

  const file = await prisma.receiptFile.findFirst({
    where: { id, receipt: { userId: session.user.id } },
    select: { id: true, kind: true, mimeType: true, data: !thumb, thumbnail: thumb, originalName: true, sha256: true, receiptId: true },
  });
  if (!file) return new NextResponse("Not found", { status: 404 });

  const body = thumb ? file.thumbnail : file.data;
  if (!body) return new NextResponse("Not found", { status: 404 });

  if (!thumb) {
    void audit(session.user.id, "receipt.file_viewed", { receiptId: file.receiptId, details: { fileId: file.id } });
  }

  const name = file.originalName ?? `kvitto-${file.id}.${file.kind === "PDF" ? "pdf" : file.kind === "IMAGE" ? "jpg" : file.kind === "EMAIL_HTML" ? "html" : "txt"}`;
  const headers = new Headers({
    "Content-Type": thumb ? "image/jpeg" : file.mimeType,
    "Content-Length": String(body.byteLength),
    "Cache-Control": "private, max-age=3600",
    ETag: `"${file.sha256.slice(0, 32)}${thumb ? "-t" : ""}"`,
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
  });
  if (file.kind === "EMAIL_HTML") {
    // Never execute scripts from stored e-mails
    headers.set("Content-Security-Policy", "default-src 'none'; img-src data: https:; style-src 'unsafe-inline'");
    headers.set("Content-Type", "text/html; charset=utf-8");
  }
  if (request.headers.get("if-none-match") === headers.get("ETag")) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(new Uint8Array(body), { status: 200, headers });
}
