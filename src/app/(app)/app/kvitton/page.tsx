import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Camera, PencilLine, SearchX } from "lucide-react";
import { auth } from "@/lib/auth/auth";
import { listCategories, listReceipts } from "@/lib/receipts/queries";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/ui/container";
import { EmptyReceipts } from "@/components/dashboard";
import {
  RECEIPT_SORTS,
  ReceiptFilters,
  countActiveFilters,
  filtersToParams,
  type ReceiptFilterValues,
  type ReceiptListStatus,
  type ReceiptSort,
} from "@/components/receipts/receipt-filters";
import { Pagination, ReceiptGrid } from "@/components/receipts/receipt-grid";

export const metadata: Metadata = { title: "Kvitton" };

const PAGE_SIZE = 24;
const PATH = "/app/kvitton";
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function isoDate(value: string): string {
  return ISO_DATE.test(value) && !Number.isNaN(new Date(value).getTime()) ? value : "";
}

function pickSort(value: string): ReceiptSort {
  return RECEIPT_SORTS.some((s) => s.value === value) ? (value as ReceiptSort) : "date_desc";
}

function pickStatus(value: string): ReceiptListStatus {
  return value === "needs_review" ? "needs_review" : "all";
}

function pickPage(value: string): number {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function hrefWith(params: Record<string, string | undefined>, page?: number): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) sp.set(key, value);
  if (page && page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `${PATH}?${qs}` : PATH;
}

export default async function ReceiptsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/logga-in?next=${encodeURIComponent(PATH)}`);
  const userId = session.user.id;
  const accountType = session.user.accountType;

  const sp = await searchParams;
  const values: ReceiptFilterValues = {
    q: first(sp.q).trim().slice(0, 200),
    category: first(sp.category).trim().slice(0, 100),
    from: isoDate(first(sp.from)),
    to: isoDate(first(sp.to)),
    sort: pickSort(first(sp.sort)),
    status: pickStatus(first(sp.status)),
  };
  const page = pickPage(first(sp.page));
  const params = filtersToParams(values);
  const isFiltered = countActiveFilters(values) > 0 || values.q.length > 0;

  const [result, categories] = await Promise.all([
    listReceipts(userId, {
      q: values.q || undefined,
      category: values.category || undefined,
      from: values.from || undefined,
      to: values.to || undefined,
      sort: values.sort,
      status: values.status,
      page,
      pageSize: PAGE_SIZE,
    }),
    listCategories(userId),
  ]);

  // Past the last page (e.g. after deleting receipts): jump to the last page that has content.
  if (result.total > 0 && page > result.pages) redirect(hrefWith(params, result.pages));

  const description = isFiltered
    ? `${result.total} ${result.total === 1 ? "träff" : "träffar"}`
    : result.total > 0
      ? `${result.total} ${result.total === 1 ? "kvitto sparat" : "kvitton sparade"} – tryggt i sju år.`
      : "Här samlas alla dina kvitton – fotade, uppladdade eller mailade.";

  return (
    <div className="space-y-5">
      <PageHeader
        title="Kvitton"
        description={description}
        actions={
          <>
            <ButtonLink href="/app/skanna">
              <Camera className="h-4 w-4" aria-hidden />
              Skanna
            </ButtonLink>
            <ButtonLink href="/app/kvitton/ny" variant="outline">
              <PencilLine className="h-4 w-4" aria-hidden />
              Lägg till manuellt
            </ButtonLink>
          </>
        }
      />

      <ReceiptFilters categories={categories} values={values} action={PATH} />

      {result.items.length > 0 ? (
        <>
          <p className="text-sm text-ink-500" aria-live="polite">
            {values.status === "needs_review" ? "Kvitton där vi inte kunde läsa av allt – kontrollera uppgifterna." : `Visar ${result.items.length} av ${result.total}`}
          </p>
          <ReceiptGrid receipts={result.items} accountType={accountType} />
          <Pagination page={result.page} pages={result.pages} total={result.total} pageSize={result.pageSize} pathname={PATH} params={params} className="pt-2" />
        </>
      ) : isFiltered ? (
        <EmptyState
          icon={<SearchX className="h-10 w-10" strokeWidth={1.5} aria-hidden />}
          title="Inga kvitton matchar"
          description={values.status === "needs_review" && countActiveFilters(values) === 1 && !values.q ? "Inget att granska – alla dina kvitton är avlästa och klara." : "Prova att ändra sökordet eller rensa filtren."}
          action={
            <ButtonLink href={PATH} variant="outline">
              Rensa alla filter
            </ButtonLink>
          }
        />
      ) : (
        <EmptyReceipts />
      )}
    </div>
  );
}
