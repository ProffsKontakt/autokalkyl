"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const RECEIPT_SORTS = [
  { value: "date_desc", label: "Nyast först" },
  { value: "date_asc", label: "Äldst först" },
  { value: "amount_desc", label: "Högst belopp" },
  { value: "amount_asc", label: "Lägst belopp" },
] as const;

export type ReceiptSort = (typeof RECEIPT_SORTS)[number]["value"];

export const RECEIPT_LIST_STATUSES = [
  { value: "all", label: "Alla kvitton" },
  { value: "needs_review", label: "Att granska" },
] as const;

export type ReceiptListStatus = (typeof RECEIPT_LIST_STATUSES)[number]["value"];

export interface ReceiptFilterValues {
  q: string;
  category: string;
  from: string;
  to: string;
  sort: ReceiptSort;
  status: ReceiptListStatus;
}

export const DEFAULT_FILTER_VALUES: ReceiptFilterValues = { q: "", category: "", from: "", to: "", sort: "date_desc", status: "all" };

/** Number of non-default filters (excluding the free-text search). */
export function countActiveFilters(values: ReceiptFilterValues): number {
  let n = 0;
  if (values.category) n += 1;
  if (values.from) n += 1;
  if (values.to) n += 1;
  if (values.sort !== "date_desc") n += 1;
  if (values.status !== "all") n += 1;
  return n;
}

/** Turns filter values into a clean query string (defaults and empty values omitted). */
export function filtersToParams(values: Partial<ReceiptFilterValues>): Record<string, string | undefined> {
  return {
    q: values.q?.trim() || undefined,
    category: values.category || undefined,
    from: values.from || undefined,
    to: values.to || undefined,
    sort: values.sort && values.sort !== "date_desc" ? values.sort : undefined,
    status: values.status && values.status !== "all" ? values.status : undefined,
  };
}

/**
 * Search + filter form for the receipt list. Plain GET semantics: submitting navigates to
 * `?q=…&category=…`, so it works without JavaScript. With JavaScript the form submits itself
 * when a select changes, and empty parameters are stripped from the URL.
 */
export function ReceiptFilters({ categories, values, action = "/app/kvitton", className }: { categories: string[]; values: ReceiptFilterValues; action?: string; className?: string }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, startTransition] = React.useTransition();
  const activeCount = countActiveFilters(values);
  const [open, setOpen] = React.useState(activeCount > 0);
  const hasAnything = activeCount > 0 || values.q.trim().length > 0;
  const panelId = React.useId();

  const categoryOptions = React.useMemo(() => {
    const list = [...categories];
    if (values.category && !list.includes(values.category)) list.push(values.category);
    return list.sort((a, b) => a.localeCompare(b, "sv"));
  }, [categories, values.category]);

  function submit() {
    formRef.current?.requestSubmit();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = filtersToParams({
      q: String(data.get("q") ?? ""),
      category: String(data.get("category") ?? ""),
      from: String(data.get("from") ?? ""),
      to: String(data.get("to") ?? ""),
      sort: String(data.get("sort") ?? "date_desc") as ReceiptSort,
      status: String(data.get("status") ?? "all") as ReceiptListStatus,
    });
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) sp.set(key, value);
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `${action}?${qs}` : action);
    });
  }

  return (
    <form ref={formRef} method="get" action={action} onSubmit={onSubmit} className={cn("rounded-2xl border border-ink-200/80 bg-white p-3 shadow-card sm:p-4", className)} role="search" aria-label="Sök och filtrera kvitton">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" aria-hidden />
          <Input type="search" name="q" defaultValue={values.q} placeholder="Sök på butik, produkt, artikelnummer…" aria-label="Sök kvitton" enterKeyHint="search" className="pl-10" />
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={panelId} className="flex-1 sm:flex-none">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            Filter
            {activeCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-bold text-white" aria-label={`${activeCount} aktiva filter`}>
                {activeCount}
              </span>
            ) : null}
          </Button>
          <Button type="submit" loading={pending} className="flex-1 sm:flex-none">
            Sök
          </Button>
        </div>
      </div>

      <div id={panelId} hidden={!open} className="mt-3 border-t border-ink-100 pt-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <Label htmlFor="filter-category">Kategori</Label>
            <Select id="filter-category" name="category" defaultValue={values.category} onChange={submit}>
              <option value="">Alla kategorier</option>
              {categoryOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-from">Från datum</Label>
            <Input id="filter-from" type="date" name="from" defaultValue={values.from} max={values.to || undefined} />
          </div>
          <div>
            <Label htmlFor="filter-to">Till datum</Label>
            <Input id="filter-to" type="date" name="to" defaultValue={values.to} min={values.from || undefined} />
          </div>
          <div>
            <Label htmlFor="filter-sort">Sortering</Label>
            <Select id="filter-sort" name="sort" defaultValue={values.sort} onChange={submit}>
              {RECEIPT_SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-status">Status</Label>
            <Select id="filter-status" name="status" defaultValue={values.status} onChange={submit}>
              {RECEIPT_LIST_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {hasAnything ? (
          <div className="mt-3 flex justify-end">
            <Link href={action} className="inline-flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-ink-900">
              <X className="h-4 w-4" aria-hidden />
              Rensa alla filter
            </Link>
          </div>
        ) : null}
      </div>
    </form>
  );
}
