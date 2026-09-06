import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createReceipt, processReceipt } from "@/lib/receipts/pipeline";
import { ALLOWED_TYPES, MAX_FILES_PER_RECEIPT, MAX_FILE_BYTES } from "@/lib/receipts/files";
import type { ReceiptSource } from "@prisma/client";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST multipart/form-data
 *   files: one or more image/PDF files (same receipt)
 *   source: SCAN | UPLOAD (default UPLOAD)
 * → { id } – extraction continues after the response; poll /api/receipts/[id]/status.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Du måste vara inloggad." }, { status: 401 });

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Ogiltig uppladdning." }, { status: 400 });
  }

  const sourceRaw = String(form.get("source") ?? "UPLOAD").toUpperCase();
  const source: ReceiptSource = sourceRaw === "SCAN" ? "SCAN" : "UPLOAD";

  const entries = form.getAll("files").filter((v): v is File => typeof v !== "string" && v.size > 0);
  if (!entries.length) return NextResponse.json({ error: "Ingen fil skickades." }, { status: 400 });
  if (entries.length > MAX_FILES_PER_RECEIPT) return NextResponse.json({ error: `Max ${MAX_FILES_PER_RECEIPT} filer per kvitto.` }, { status: 400 });

  const files = [];
  for (const file of entries) {
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Filtypen stöds inte (${mimeType}). Använd JPG, PNG, HEIC, WebP eller PDF.` }, { status: 415 });
    }
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Filen är för stor (max 15 MB)." }, { status: 413 });
    files.push({ data: Buffer.from(await file.arrayBuffer()), mimeType, originalName: file.name || null });
  }

  try {
    const { id } = await createReceipt({ userId: session.user.id, source, files });
    after(async () => {
      try {
        await processReceipt(id);
      } catch (error) {
        console.error("[upload] background processing failed", id, error);
      }
    });
    return NextResponse.json({ id, status: "PROCESSING" }, { status: 201 });
  } catch (error) {
    console.error("[upload] failed", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Uppladdningen misslyckades." }, { status: 400 });
  }
}
