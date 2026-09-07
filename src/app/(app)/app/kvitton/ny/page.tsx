import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Camera, Mail, PencilLine } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { inboundAddressFor } from "@/lib/brand";
import { PageHeader } from "@/components/ui";
import { ReceiptForm } from "@/components/receipts/receipt-form";

export const metadata: Metadata = {
  title: "Nytt kvitto",
  robots: { index: false, follow: false },
};

export default async function NewReceiptPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/logga-in?next=/app/kvitton/ny");

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { inboundToken: true } });
  const inboundAddress = user ? inboundAddressFor(user.inboundToken) : null;

  return (
    <div className="animate-fade-up">
      <Link href="/app/kvitton" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Alla kvitton
      </Link>

      <PageHeader className="mt-3" title="Lägg till kvitto för hand" description="Har du inget papperskvitto kvar? Fyll i det du vet – butik, datum och belopp räcker långt." />

      <section className="mb-6 grid gap-3 sm:grid-cols-3" aria-label="Andra sätt att lägga till kvitton">
        <Link href="/app/skanna" className="group flex items-start gap-3 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card transition-colors hover:border-brand-300">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Camera className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-ink-900 group-hover:text-brand-800">Fota kvittot</span>
            <span className="block text-sm text-ink-500">Snabbast – AI:n fyller i allt åt dig.</span>
          </span>
        </Link>
        <div className="flex items-start gap-3 rounded-2xl border border-ink-200/80 bg-white p-4 shadow-card">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Mail className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink-900">Maila in kvittot</span>
            {inboundAddress ? (
              <span className="block break-all text-sm text-ink-500">
                Vidarebefordra till{" "}
                <a href={`mailto:${inboundAddress}`} className="font-medium text-brand-700 hover:underline">
                  {inboundAddress}
                </a>
              </span>
            ) : (
              <span className="block text-sm text-ink-500">
                Din adress hittar du under{" "}
                <Link href="/app/installningar" className="font-medium text-brand-700 hover:underline">
                  Inställningar
                </Link>
                .
              </span>
            )}
          </span>
        </div>
        <div className="flex items-start gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-700">
            <PencilLine className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-semibold text-brand-900">Fyll i själv</span>
            <span className="block text-sm text-brand-800/80">Du är här. Kvittot sparas i sju år precis som de andra.</span>
          </span>
        </div>
      </section>

      <ReceiptForm mode="create" cancelHref="/app/kvitton" />
    </div>
  );
}
