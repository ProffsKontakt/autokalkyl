import { Building2, CalendarDays, CreditCard, Hash, Mail, Sparkles, Tag } from "lucide-react";
import { Badge, Card, CardContent } from "@/components/ui";
import { StatusBadge } from "@/components/receipts/status-badge";
import { formatDate, formatMoney } from "@/lib/utils";
import { SOURCE_LABELS, type ReceiptDetail } from "./types";

function Row({ icon: Icon, label, children }: { icon: typeof Building2; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
      <div className="min-w-0 flex-1">
        <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</dt>
        <dd className="mt-0.5 text-[15px] text-ink-900">{children}</dd>
      </div>
    </div>
  );
}

function confidencePercent(value: number): number {
  const pct = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/** Right-column facts about the receipt: merchant, date, amounts, source and AI summary. */
export function ReceiptSummary({ receipt }: { receipt: ReceiptDetail }) {
  const sourceLabel = SOURCE_LABELS[receipt.source];
  const confidence = receipt.aiConfidence !== null ? confidencePercent(receipt.aiConfidence) : null;
  const hasMerchant = receipt.merchantName || receipt.merchantOrgNumber || receipt.merchantAddress;

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={receipt.status} showReady />
          {receipt.category ? <Badge tone="brand">{receipt.category}</Badge> : null}
          <Badge tone="neutral">{sourceLabel}</Badge>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 rounded-xl bg-ink-50 px-4 py-3">
          <div>
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">Belopp</div>
            <div className="text-3xl font-bold tracking-tight text-ink-900">{formatMoney(receipt.totalAmount, receipt.currency)}</div>
          </div>
          {receipt.vatAmount !== null ? (
            <div className="text-right text-sm text-ink-600">
              varav moms <span className="font-semibold text-ink-900">{formatMoney(receipt.vatAmount, receipt.currency)}</span>
            </div>
          ) : null}
        </div>

        <dl className="grid gap-5 sm:grid-cols-2">
          <Row icon={Building2} label="Butik">
            {hasMerchant ? (
              <>
                <div className="font-medium">{receipt.merchantName ?? "Okänd butik"}</div>
                {receipt.merchantOrgNumber ? <div className="text-sm text-ink-500">Org.nr {receipt.merchantOrgNumber}</div> : null}
                {receipt.merchantAddress ? <div className="text-sm text-ink-500">{receipt.merchantAddress}</div> : null}
              </>
            ) : (
              <span className="text-ink-400">Ej angiven</span>
            )}
          </Row>
          <Row icon={CalendarDays} label="Inköpsdatum">
            {receipt.purchaseDate ? formatDate(receipt.purchaseDate) : <span className="text-ink-400">Ej angivet</span>}
          </Row>
          <Row icon={CreditCard} label="Betalsätt">{receipt.paymentMethod ?? <span className="text-ink-400">Ej angivet</span>}</Row>
          <Row icon={Hash} label="Kvittonummer">{receipt.receiptNumber ?? <span className="text-ink-400">Ej angivet</span>}</Row>
          <Row icon={Mail} label="Källa">
            <div>{sourceLabel}</div>
            {receipt.source === "EMAIL" && receipt.emailFrom ? <div className="break-all text-sm text-ink-500">från {receipt.emailFrom}</div> : null}
            {receipt.source === "EMAIL" && receipt.emailSubject ? <div className="text-sm text-ink-500">”{receipt.emailSubject}”</div> : null}
            <div className="text-sm text-ink-500">Tillagt {formatDate(receipt.createdAt)}</div>
          </Row>
          <Row icon={Tag} label="Taggar">
            {receipt.tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {receipt.tags.map((tag) => (
                  <Badge key={tag} tone="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-ink-400">Inga taggar</span>
            )}
          </Row>
        </dl>

        {receipt.notes ? (
          <div>
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-500">Anteckningar</h3>
            <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink-800">{receipt.notes}</p>
          </div>
        ) : null}

        {receipt.aiSummary ? (
          <div className="rounded-xl border border-brand-100 bg-brand-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Sparkles className="h-4 w-4" aria-hidden /> AI-sammanfattning
            </div>
            <p className="mt-1.5 text-sm leading-relaxed text-brand-900">{receipt.aiSummary}</p>
          </div>
        ) : null}

        {confidence !== null ? (
          <div className="text-sm text-ink-600">
            <div className="flex items-center justify-between gap-3">
              <span>AI:ns säkerhet vid tolkningen</span>
              <span className="font-semibold tabular-nums text-ink-900">{confidence} %</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100" role="progressbar" aria-valuenow={confidence} aria-valuemin={0} aria-valuemax={100} aria-label="AI:ns säkerhet">
              <div className={confidence >= 80 ? "h-full bg-brand-500" : confidence >= 60 ? "h-full bg-amber-500" : "h-full bg-red-500"} style={{ width: `${confidence}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-ink-500">{confidence >= 80 ? "Uppgifterna är sannolikt korrekta – men kontrollera gärna beloppet." : "Kontrollera uppgifterna mot originalet och rätta vid behov."}</p>
          </div>
        ) : null}

        {receipt.retentionUntil ? <p className="text-xs text-ink-400">Sparas säkert till {formatDate(receipt.retentionUntil)} (sju år enligt bokföringslagen).</p> : null}
      </CardContent>
    </Card>
  );
}
