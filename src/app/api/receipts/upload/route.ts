import { NextResponse, after } from "next/server";
import { auth } from "@/lib/auth/auth";
import { createReceipt, processReceipt } from "@/lib/receipts/pipeline";
import { UPLOAD_TYPES, MAX_FILES_PER_RECEIPT, MAX_FILE_BYTES, MAX_REQUEST_BYTES } from "@/lib/receipts/files";
import { dbRateLimit } from "@/lib/rate-limit";
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

  const rl = await dbRateLimit(session.user.id, "receipt.created", 120, 60 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: "Du har laddat upp många kvitton på kort tid. Försök igen om en stund." }, { status: 429 });

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
  let total = 0;
  for (const file of entries) {
    const mimeType = (file.type || "application/octet-stream").toLowerCase();
    if (!UPLOAD_TYPES.includes(mimeType)) {
      return NextResponse.json({ error: `Filtypen stöds inte (${mimeType}). Använd JPG, PNG, HEIC, WebP eller PDF.` }, { status: 415 });
    }
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Filen är för stor (max 4 MB per fil)." }, { status: 413 });
    total += file.size;
    if (total > MAX_REQUEST_BYTES) return NextResponse.json({ error: "Filerna är för stora tillsammans (max 4 MB per uppladdning). Spara kvittot i flera omgångar." }, { status: 413 });
    files.push({ data: Buffer.from(await file.arrayBuffer()), mimeType, originalName: file.name || null });
  }

  try {
    const { id } = await createReceipt({ userId: session.user.id, source, files });
    after(async () => {
      try {
        await processReceipt(id, { owned: true });
      } catch (error) {
        console.error("[upload] background processing failed", id, error);
      }
    });
    return NextResponse.json({ id, status: "PROCESSING" }, { status: 201 });
  } catch (error) {
    console.error("[upload] failed", error);
    const message = error instanceof Error && /för stor|stöds inte|är tom|kunde läsas|Max /.test(error.message) ? error.message : "Uppladdningen misslyckades. Försök igen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
