import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Camera, Info, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { LEGAL_CLAIM_YEARS_BUSINESS, LEGAL_CLAIM_YEARS_PRIVATE, coverageStatus, legalClaimDeadline } from "@/lib/receipts/warranty";
import { toNumber } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader } from "@/components/ui/container";
import { CoverageSection, type CoverageEntry } from "./coverage-section";

export const metadata: Metadata = { title: "Garantier" };

export default async function WarrantiesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/logga-in?next=/app/garantier");
  const userId = session.user.id;
  const accountType = session.user.accountType;
  const legalYears = accountType === "BUSINESS" ? LEGAL_CLAIM_YEARS_BUSINESS : LEGAL_CLAIM_YEARS_PRIVATE;
  const now = new Date();

  const rows = await prisma.receipt.findMany({
    where: { userId, deletedAt: null, purchaseDate: { not: null } },
    select: {
      id: true,
      title: true,
      merchantName: true,
      purchaseDate: true,
      totalAmount: true,
      currency: true,
      warrantyMonths: true,
      warrantyExpiresAt: true,
    },
    orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }],
  });

  const entries: CoverageEntry[] = rows.flatMap((r) => {
    if (!r.purchaseDate) return [];
    const coverage = coverageStatus(r.purchaseDate, r.warrantyExpiresAt, accountType, now);
    if (coverage.status === "unknown") return [];
    return [
      {
        id: r.id,
        title: r.title ?? r.merchantName ?? "Kvitto",
        merchantName: r.merchantName,
        purchaseDate: r.purchaseDate,
        totalAmount: toNumber(r.totalAmount),
        currency: r.currency,
        warrantyMonths: r.warrantyMonths,
        warrantyExpiresAt: r.warrantyExpiresAt,
        legalDeadline: legalClaimDeadline(r.purchaseDate, accountType),
        coverage,
      },
    ];
  });

  const byDaysLeft = (a: CoverageEntry, b: CoverageEntry) => (a.coverage.daysLeft ?? 0) - (b.coverage.daysLeft ?? 0);
  const expiring = entries.filter((e) => e.coverage.status === "expiring").sort(byDaysLeft);
  const active = entries.filter((e) => e.coverage.status === "active").sort(byDaysLeft);
  const expired = entries.filter((e) => e.coverage.status === "expired").sort((a, b) => (b.coverage.until?.getTime() ?? 0) - (a.coverage.until?.getTime() ?? 0));

  const summary = [
    { href: "#gar-ut-snart", label: "Går ut snart", count: expiring.length, icon: ShieldAlert, tone: expiring.length ? "text-amber-700" : "text-ink-500" },
    { href: "#aktiva", label: "Aktiva", count: active.length, icon: ShieldCheck, tone: "text-brand-700" },
    { href: "#utgangna", label: "Utgångna", count: expired.length, icon: ShieldX, tone: "text-ink-500" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garantier"
        description="Vi håller koll på garanti och reklamationsrätt för allt du köpt – så att du hinner agera i tid."
      />

      {entries.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-10 w-10" strokeWidth={1.5} aria-hidden />}
          title="Inga garantier att bevaka ännu"
          description="När du lägger till kvitton med inköpsdatum räknar vi automatiskt ut hur länge garanti och reklamationsrätt gäller."
          action={
            <ButtonLink href="/app/skanna">
              <Camera className="h-4 w-4" aria-hidden />
              Skanna kvitto
            </ButtonLink>
          }
        />
      ) : (
        <>
          <nav aria-label="Sammanfattning" className="grid grid-cols-3 gap-2 sm:gap-3">
            {summary.map((item) => (
              <Link key={item.href} href={item.href} className="flex flex-col items-center rounded-2xl border border-ink-200/80 bg-white px-2 py-3 text-center shadow-card transition-colors hover:border-brand-300 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:text-left">
                <item.icon className={`h-5 w-5 ${item.tone}`} aria-hidden />
                <span className="mt-1 sm:mt-0">
                  <span className="block text-xl font-bold tabular-nums text-ink-900">{item.count}</span>
                  <span className="block text-xs font-medium text-ink-500">{item.label}</span>
                </span>
              </Link>
            ))}
          </nav>

          <CoverageSection
            id="gar-ut-snart"
            title="Går ut snart"
            description="Skydd som upphör inom 60 dagar. Har du problem med varan – reklamera nu."
            icon={ShieldAlert}
            tone="warning"
            entries={expiring}
            legalYears={legalYears}
            now={now}
            emptyText="Inget skydd går ut de närmaste 60 dagarna."
          />

          <CoverageSection
            id="aktiva"
            title="Aktiva"
            description="Varor där garanti eller reklamationsrätt fortfarande gäller."
            icon={ShieldCheck}
            tone="success"
            entries={active}
            legalYears={legalYears}
            now={now}
            emptyText="Inga aktiva garantier just nu."
          />

          <CoverageSection
            id="utgangna"
            title="Utgångna"
            description="Skyddet har upphört, men kvittot finns kvar som bevis på köpet."
            icon={ShieldX}
            tone="neutral"
            entries={expired}
            legalYears={legalYears}
            now={now}
            emptyText="Inga utgångna garantier."
            collapsible
          />
        </>
      )}

      <Card className="border-brand-200 bg-brand-50/50">
        <CardContent>
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Info className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 text-sm text-ink-700">
              <h2 className="text-base font-semibold text-ink-900">Garanti eller reklamationsrätt – vad är skillnaden?</h2>
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className="font-semibold text-ink-900">Reklamationsrätt ({legalYears} år)</dt>
                  <dd className="mt-0.5">
                    {accountType === "BUSINESS"
                      ? "Enligt köplagen kan företag reklamera fel på en vara i två år från köpet."
                      : "Enligt konsumentköplagen har du alltid rätt att reklamera fel på en vara i tre år från köpet."}{" "}
                    Rätten gäller fel som fanns från början, oavsett om butiken lämnar garanti eller inte – och den kan aldrig avtalas bort.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold text-ink-900">Garanti</dt>
                  <dd className="mt-0.5">
                    Ett frivilligt löfte från säljaren eller tillverkaren under en viss tid, till exempel 24 månader. Under garantitiden är det säljaren som ska visa att felet inte fanns från början – annars är det du som behöver visa det.
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-ink-600">
                Vi räknar alltid med det skydd som gäller längst. Kvittot är ditt bevis på köpet – spara det, så hjälper vi dig när det gäller.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
