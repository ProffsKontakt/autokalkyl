"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { WifiOff } from "lucide-react";
import { Checkmark, Spinner } from "@/components/ui";

type Phase = "polling" | "done" | "failed";

const STEPS = ["Läser av kvittot…", "Hittar butik, datum och belopp…", "Letar efter varor och artikelnummer…", "Kollar garantivillkor…", "Snart klart…"];
const POLL_INTERVAL_MS = 2000;

function ScanningReceipt({ animate }: { animate: boolean }) {
  return (
    <div className="relative mx-auto h-40 w-32" aria-hidden>
      <svg viewBox="0 0 120 150" className="h-full w-full text-ink-300">
        <path d="M22 6h76v130l-9.5-6-9.5 6-9.5-6-9.5 6-9.5-6-9.5 6-9.5-6-9.5 6V6z" fill="white" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <path d="M36 30h48M36 46h48M36 62h30M36 78h48M36 94h24M60 112h24" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      </svg>
      {animate ? (
        <motion.div
          className="absolute inset-x-3 h-10 rounded-full bg-gradient-to-b from-transparent via-brand-400/45 to-transparent"
          initial={{ top: "0%" }}
          animate={{ top: ["0%", "72%", "0%"] }}
          transition={{ duration: 2.6, ease: "easeInOut", repeat: Infinity }}
        />
      ) : null}
    </div>
  );
}

/**
 * Polls the status endpoint while a receipt is being interpreted, then refreshes
 * the page. Shows a scanning animation and the big check when it is done.
 */
export function ProcessingPoller({ receiptId }: { receiptId: string }) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [phase, setPhase] = React.useState<Phase>("polling");
  const [elapsed, setElapsed] = React.useState(0);
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    let failures = 0;
    const started = Date.now();

    const poll = async (): Promise<boolean> => {
      if (inFlight) return false;
      inFlight = true;
      try {
        const response = await fetch(`/api/receipts/${receiptId}/status`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = (await response.json()) as { status?: string };
        if (cancelled) return true;
        failures = 0;
        setOffline(false);
        if (data.status === "READY" || data.status === "NEEDS_REVIEW") {
          setPhase("done");
          return true;
        }
        if (data.status === "FAILED") {
          setPhase("failed");
          return true;
        }
        return false;
      } catch {
        failures += 1;
        if (!cancelled && failures >= 3) setOffline(true);
        return false;
      } finally {
        inFlight = false;
      }
    };

    const timer = setInterval(async () => {
      if (cancelled) return;
      setElapsed(Date.now() - started);
      const finished = await poll();
      if (finished) clearInterval(timer);
    }, POLL_INTERVAL_MS);
    void poll();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [receiptId]);

  React.useEffect(() => {
    if (phase === "polling") return;
    const delay = phase === "done" ? (reduce ? 600 : 1600) : 300;
    const timer = setTimeout(() => router.refresh(), delay);
    return () => clearTimeout(timer);
  }, [phase, reduce, router]);

  const step = STEPS[Math.min(STEPS.length - 1, Math.floor(elapsed / 4000))];
  const slow = elapsed > 25_000;
  const verySlow = elapsed > 90_000;

  return (
    <section className="rounded-2xl border border-brand-100 bg-white p-6 text-center shadow-card sm:p-8" aria-live="polite" aria-busy={phase === "polling"}>
      {phase === "done" ? (
        <div className="flex flex-col items-center gap-3">
          <Checkmark size={96} label="Kvittot är tolkat" />
          <p className="text-lg font-semibold text-ink-900">Klart!</p>
          <p className="text-sm text-ink-500">Hämtar uppgifterna…</p>
        </div>
      ) : phase === "failed" ? (
        <div className="flex flex-col items-center gap-2">
          <Spinner label="Hämtar resultatet…" />
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <ScanningReceipt animate={!reduce} />
          <div>
            <p className="text-lg font-semibold text-ink-900">{step}</p>
            <p className="mt-1 text-sm text-ink-500">Det brukar ta 10–30 sekunder. Du kan lämna sidan – vi jobbar vidare i bakgrunden.</p>
          </div>
          {reduce ? <Spinner label="Tolkar kvittot" /> : null}
          {verySlow ? (
            <p className="text-sm text-amber-700">Det tar ovanligt lång tid. Vi försöker igen automatiskt – kom gärna tillbaka om en stund.</p>
          ) : slow ? (
            <p className="text-sm text-ink-500">Det tar lite längre än vanligt – kvitton med många rader kräver mer tid.</p>
          ) : null}
          {offline ? (
            <p className="inline-flex items-center gap-2 text-sm text-amber-700">
              <WifiOff className="h-4 w-4" aria-hidden /> Kunde inte nå servern just nu. Vi försöker igen.
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
