import type { Metadata } from "next";
import { ScanView } from "@/components/scan/scan-view";
import type { ScanMode } from "@/components/scan/types";

export const metadata: Metadata = { title: "Skanna kvitto" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/**
 * /app/skanna – server wrapper around the client-heavy scan experience.
 * `?mode=upload` opens the file picker directly; anything else starts in camera mode.
 * The client view is keyed on the mode so a URL change resets it cleanly.
 */
export default async function ScanPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const raw = Array.isArray(params.mode) ? params.mode[0] : params.mode;
  const mode: ScanMode = raw === "upload" ? "upload" : "camera";
  return <ScanView key={mode} initialMode={mode} />;
}
