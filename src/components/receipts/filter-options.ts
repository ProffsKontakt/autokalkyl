/** Sort options for the receipt list – plain module so both server and client code can import it. */
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
