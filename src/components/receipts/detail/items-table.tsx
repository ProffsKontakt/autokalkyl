import Link from "next/link";
import { BookOpen, ExternalLink, PackageOpen } from "lucide-react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatMoney } from "@/lib/utils";
import { receiptHref, type ReceiptDetailItem } from "./types";

const quantityFormatter = new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 3 });

function ItemLinks({ item }: { item: ReceiptDetailItem }) {
  if (!item.productUrl && !item.manualUrl) return <span className="text-ink-300">–</span>;
  return (
    <span className="inline-flex items-center gap-1">
      {item.productUrl ? (
        <a href={item.productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50" aria-label={`Produktsida för ${item.name}`} title="Produktsida">
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
      {item.manualUrl ? (
        <a href={item.manualUrl} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-brand-700 hover:bg-brand-50" aria-label={`Bruksanvisning för ${item.name}`} title="Bruksanvisning">
          <BookOpen className="h-4 w-4" aria-hidden />
        </a>
      ) : null}
    </span>
  );
}

function ItemName({ item }: { item: ReceiptDetailItem }) {
  const brandModel = [item.brand, item.model].filter(Boolean).join(" ");
  return (
    <div className="min-w-0">
      <div className="font-medium text-ink-900">{item.name}</div>
      {brandModel ? <div className="text-sm text-ink-500">{brandModel}</div> : null}
      {item.warrantyMonths ? (
        <Badge tone="brand" className="mt-1">
          Garanti {item.warrantyMonths} mån
        </Badge>
      ) : null}
    </div>
  );
}

/** Line items on the receipt – a table on wide screens and stacked cards on phones. */
export function ItemsTable({ receiptId, items, currency }: { receiptId: string; items: ReceiptDetailItem[]; currency: string }) {
  const total = items.reduce<number | null>((sum, item) => (item.totalPrice === null ? sum : (sum ?? 0) + item.totalPrice), null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Varor</CardTitle>
        <CardDescription>{items.length ? `${items.length} ${items.length === 1 ? "rad" : "rader"} på kvittot.` : "Inga varor har lästs av från kvittot."}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-8 text-center">
            <PackageOpen className="h-8 w-8 text-ink-300" aria-hidden />
            <p className="mt-2 text-sm text-ink-500">
              Du kan lägga till varor själv –{" "}
              <Link href={receiptHref(receiptId, true)} className="font-medium text-brand-700 hover:underline">
                redigera kvittot
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            {/* Phones: stacked cards */}
            <ul className="space-y-3 sm:hidden">
              {items.map((item) => (
                <li key={item.id} className="rounded-xl border border-ink-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <ItemName item={item} />
                    <div className="shrink-0 text-right">
                      <div className="font-semibold text-ink-900">{formatMoney(item.totalPrice, currency)}</div>
                      <div className="text-xs text-ink-500">
                        {quantityFormatter.format(item.quantity)} × {formatMoney(item.unitPrice, currency)}
                      </div>
                    </div>
                  </div>
                  <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-ink-600">
                    {item.articleNumber ? (
                      <>
                        <dt className="text-ink-400">Art.nr</dt>
                        <dd className="text-right font-mono">{item.articleNumber}</dd>
                      </>
                    ) : null}
                    {item.serialNumber ? (
                      <>
                        <dt className="text-ink-400">Serienr</dt>
                        <dd className="text-right font-mono">{item.serialNumber}</dd>
                      </>
                    ) : null}
                  </dl>
                  {item.productUrl || item.manualUrl ? (
                    <div className="mt-2 flex items-center gap-1 text-xs text-ink-500">
                      Länkar: <ItemLinks item={item} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>

            {/* Tablets and up: table */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-200 text-left text-xs font-medium uppercase tracking-wide text-ink-500">
                    <th scope="col" className="py-2 pr-3">Vara</th>
                    <th scope="col" className="py-2 pr-3 text-right">Antal</th>
                    <th scope="col" className="py-2 pr-3 text-right">À-pris</th>
                    <th scope="col" className="py-2 pr-3 text-right">Summa</th>
                    <th scope="col" className="py-2 pr-3">Art.nr</th>
                    <th scope="col" className="py-2 pr-3">Serienr</th>
                    <th scope="col" className="py-2 text-right">Länkar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {items.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="py-3 pr-3">
                        <ItemName item={item} />
                      </td>
                      <td className="py-3 pr-3 text-right tabular-nums text-ink-700">{quantityFormatter.format(item.quantity)}</td>
                      <td className="py-3 pr-3 text-right tabular-nums text-ink-700">{formatMoney(item.unitPrice, currency)}</td>
                      <td className="py-3 pr-3 text-right font-semibold tabular-nums text-ink-900">{formatMoney(item.totalPrice, currency)}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-ink-600">{item.articleNumber ?? <span className="text-ink-300">–</span>}</td>
                      <td className="py-3 pr-3 font-mono text-xs text-ink-600">{item.serialNumber ?? <span className="text-ink-300">–</span>}</td>
                      <td className="py-3 text-right">
                        <ItemLinks item={item} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                {total !== null ? (
                  <tfoot>
                    <tr className="border-t border-ink-200">
                      <th scope="row" colSpan={3} className="py-3 pr-3 text-right text-sm font-medium text-ink-600">
                        Summa varor
                      </th>
                      <td className="py-3 pr-3 text-right font-semibold tabular-nums text-ink-900">{formatMoney(total, currency)}</td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
