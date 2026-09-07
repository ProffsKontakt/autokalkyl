import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, Camera, Loader2, PencilLine, ReceiptText, ShieldAlert, Wallet } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { dashboardStats, receiptListSelect, toReceiptCard } from "@/lib/receipts/queries";
import { formatMoney } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/button";
import { EmptyReceipts, StatCard, WelcomeCard } from "@/components/dashboard";
import { ReceiptGrid } from "@/components/receipts/receipt-grid";

export const metadata: Metadata = { title: "Översikt" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Time-of-day greeting in Swedish local time (the server may run in UTC). */
function greeting(now: Date): string {
  const hour = Number(new Intl.DateTimeFormat("sv-SE", { hour: "numeric", hourCycle: "h23", timeZone: "Europe/Stockholm" }).format(now));
  if (hour < 5) return "God natt";
  if (hour < 10) return "God morgon";
  if (hour < 18) return "Hej";
  return "God kväll";
}

function firstName(name: string | null | undefined): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || "du";
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/logga-in?next=/app");
  const userId = session.user.id;
  const accountType = session.user.accountType;
  const params = await searchParams;
  const showWelcome = params.welcome === "1";
  const now = new Date();

  const [stats, recentRows] = await Promise.all([
    dashboardStats(userId, accountType),
    prisma.receipt.findMany({
      where: { userId, deletedAt: null },
      select: receiptListSelect,
      orderBy: [{ createdAt: "desc" }],
      take: 6,
    }),
  ]);
  const recent = recentRows.map(toReceiptCard);
  const name = firstName(session.user.name);
  const monthName = new Intl.DateTimeFormat("sv-SE", { month: "long", timeZone: "Europe/Stockholm" }).format(now);
  const hasReceipts = stats.receiptCount > 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
            {greeting(now)}, {name}!
          </h1>
          <p className="mt-1 text-ink-500">
            {hasReceipts ? `Du har ${plural(stats.receiptCount, "kvitto", "kvitton")} sparade och i tryggt förvar.` : "Här samlar du alla dina kvitton – tryggt sparade i sju år."}
          </p>
        </div>
        <ButtonLink href="/app/skanna" size="lg" className="w-full sm:w-auto">
          <Camera className="h-5 w-5" aria-hidden />
          Skanna kvitto
        </ButtonLink>
      </header>

      {showWelcome ? <WelcomeCard name={name} /> : null}

      {stats.processing > 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800" role="status" aria-live="polite">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
          <span>
            {plural(stats.processing, "kvitto bearbetas", "kvitton bearbetas")} just nu – uppgifterna dyker upp om en liten stund.
          </span>
        </div>
      ) : null}

      {hasReceipts ? (
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">
            Nyckeltal
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Kvitton" value={stats.receiptCount} icon={ReceiptText} tone="brand" href="/app/kvitton" />
            <StatCard label="Utgifter denna månad" value={formatMoney(stats.monthTotal)} hint={monthName} icon={Wallet} />
            <StatCard label="Utgifter i år" value={formatMoney(stats.yearTotal)} hint={String(now.getFullYear())} icon={CalendarDays} />
            <StatCard
              label="Garantier går ut"
              value={stats.expiringSoon}
              hint="inom 60 dagar"
              icon={ShieldAlert}
              tone={stats.expiringSoon > 0 ? "warning" : "neutral"}
              emphasis={stats.expiringSoon > 0}
              href="/app/garantier"
            />
            <StatCard
              label="Att granska"
              value={stats.needsReview}
              hint={stats.needsReview > 0 ? "kontrollera uppgifterna" : "allt ser bra ut"}
              icon={PencilLine}
              tone={stats.needsReview > 0 ? "warning" : "neutral"}
              emphasis={stats.needsReview > 0}
              href="/app/kvitton?status=needs_review"
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="recent-heading">
        <div className="mb-3 flex items-end justify-between gap-3">
          <h2 id="recent-heading" className="text-lg font-semibold text-ink-900">
            Senast tillagda
          </h2>
          {hasReceipts ? (
            <Link href="/app/kvitton" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">
              Alla kvitton
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : null}
        </div>
        {recent.length ? <ReceiptGrid receipts={recent} accountType={accountType} /> : <EmptyReceipts />}
      </section>
    </div>
  );
}
