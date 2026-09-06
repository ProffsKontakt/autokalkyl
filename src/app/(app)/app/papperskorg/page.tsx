import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info, Trash2 } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { listReceipts } from "@/lib/receipts/queries";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/container";
import { Pagination, ReceiptGrid } from "@/components/receipts/receipt-grid";
import { TrashActions } from "@/components/receipts/trash-actions";

export const metadata: Metadata = { title: "Papperskorg" };

const PAGE_SIZE = 24;
const PATH = "/app/papperskorg";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickPage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default async function TrashPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/logga-in?next=${encodeURIComponent(PATH)}`);
  const userId = session.user.id;
  const accountType = session.user.accountType;
  const page = pickPage((await searchParams).page);

  const result = await listReceipts(userId, { status: "trash", page, pageSize: PAGE_SIZE });
  if (result.total > 0 && page > result.pages) redirect(result.pages > 1 ? `${PATH}?page=${result.pages}` : PATH);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Papperskorg"
        description={result.total > 0 ? `${result.total} ${result.total === 1 ? "raderat kvitto" : "raderade kvitton"}` : "Raderade kvitton hamnar här."}
      />

      <div className="flex items-start gap-3 rounded-2xl border border-ink-200/80 bg-white px-4 py-3 text-sm text-ink-600 shadow-card">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
        <p>
          Kvitton i papperskorgen sparas i 30 dagar – sedan rensar vi papperskorgen automatiskt. Ångrat dig? Återställ kvittot så hamnar det bland dina kvitton igen. Vill du bli av med det direkt kan du radera det permanent.
        </p>
      </div>

      {result.items.length > 0 ? (
        <>
          <ReceiptGrid receipts={result.items} accountType={accountType} hrefFor={() => null} footerFor={(receipt) => <TrashActions id={receipt.id} title={receipt.title} />} />
          <Pagination page={result.page} pages={result.pages} total={result.total} pageSize={result.pageSize} pathname={PATH} className="pt-2" />
        </>
      ) : (
        <EmptyState
          icon={<Trash2 className="h-10 w-10" strokeWidth={1.5} aria-hidden />}
          title="Papperskorgen är tom"
          description="Kvitton du raderar hamnar här och sparas i 30 dagar innan de tas bort för gott."
          action={
            <ButtonLink href="/app/kvitton" variant="outline">
              Till dina kvitton
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
