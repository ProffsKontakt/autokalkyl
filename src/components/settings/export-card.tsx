import { Calculator, Download, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import { SettingsSection } from "./settings-section";
import { AnchorButton } from "./anchor-button";

export function ExportCard({ receiptCount }: { receiptCount: number }) {
  const hasReceipts = receiptCount > 0;
  return (
    <SettingsSection id="export" icon={FileSpreadsheet} title="Export" description="Dina kvitton är dina – ta med dem vart du vill.">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 rounded-xl bg-ink-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">Alla kvitton som CSV</p>
            <p className="mt-0.5 text-sm text-ink-500">
              {hasReceipts ? `${receiptCount} ${receiptCount === 1 ? "kvitto" : "kvitton"}` : "Inga kvitton ännu"} · butik, datum, belopp, moms,
              kategori, garanti och produkter. Öppnas direkt i Excel eller Numbers.
            </p>
          </div>
          <AnchorButton
            href={hasReceipts ? "/api/receipts/export" : undefined}
            download={hasReceipts ? true : undefined}
            aria-disabled={hasReceipts ? undefined : true}
            className="shrink-0"
          >
            <Download className="h-4 w-4" aria-hidden />
            Ladda ner alla kvitton som CSV
          </AnchorButton>
        </div>

        <div className="grid gap-4 text-sm text-ink-600 sm:grid-cols-2">
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
              <Calculator className="h-4 w-4" />
            </span>
            <p>
              <span className="font-semibold text-ink-900">Bra för bokföringen.</span> Filen är semikolonseparerad med svenska decimaler (12,50) och
              fungerar direkt i Excel, Google Kalkylark och de flesta bokföringsprogram. Lämnar du underlag till en redovisningskonsult eller vill ha
              koll på avdrag är det här allt du behöver.
            </p>
          </div>
          <div className="flex gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700" aria-hidden>
              <ImageIcon className="h-4 w-4" />
            </span>
            <p>
              <span className="font-semibold text-ink-900">Bilder och PDF:er</span> laddar du ner per kvitto – öppna kvittot och välj Ladda ner.
              Originalen ligger kvar hos oss i sju år oavsett.
            </p>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
