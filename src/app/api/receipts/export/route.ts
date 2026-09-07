import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { audit } from "@/lib/audit";
import { exportReceiptsCsv } from "@/lib/receipts/export";
import { brand } from "@/lib/brand";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 });
  const csv = await exportReceiptsCsv(session.user.id);
  await audit(session.user.id, "export.csv");
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${brand.name.toLowerCase()}-kvitton-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
