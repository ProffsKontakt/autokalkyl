import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { audit } from "@/lib/audit";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui";
import { ReceiptChat } from "@/components/chat/receipt-chat";
import { StatusBadge } from "@/components/receipts/status-badge";
import { ReceiptForm } from "@/components/receipts/receipt-form";
import { receiptDetailInclude, toFormValues, toReceiptDetail } from "@/components/receipts/detail/serialize";
import { SOURCE_LABELS, receiptHref, type AuditEntry } from "@/components/receipts/detail/types";
import { FileViewer } from "@/components/receipts/detail/file-viewer";
import { ReceiptSummary } from "@/components/receipts/detail/receipt-summary";
import { WarrantyPanel } from "@/components/receipts/detail/warranty-panel";
import { ItemsTable } from "@/components/receipts/detail/items-table";
import { ProcessingPoller } from "@/components/receipts/detail/processing-poller";
import { ProcessingWarning } from "@/components/receipts/detail/processing-warning";
import { ReceiptActions } from "@/components/receipts/detail/receipt-actions";
import { TrashBanner } from "@/components/receipts/detail/trash-banner";
import { OcrText } from "@/components/receipts/detail/ocr-text";
import { AuditTrail } from "@/components/receipts/detail/audit-trail";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single : "";
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const [session, { id }] = await Promise.all([auth(), params]);
  const userId = session?.user?.id;
  if (!userId) return { title: "Kvitto", robots: { index: false, follow: false } };
  const receipt = await prisma.receipt.findFirst({ where: { id, userId }, select: { title: true, merchantName: true } });
  return {
    title: receipt?.title ?? receipt?.merchantName ?? "Kvitto",
    robots: { index: false, follow: false },
  };
}

export default async function ReceiptPage({ params, searchParams }: { params: Params; searchParams: SearchParams }) {
  const session = await auth();
  const userId = session?.user?.id;
  const [{ id }, query] = await Promise.all([params, searchParams]);
  if (!userId) redirect(`/logga-in?next=${encodeURIComponent(`/app/kvitton/${id}`)}`);

  const row = await prisma.receipt.findFirst({ where: { id, userId }, include: receiptDetailInclude });
  if (!row) notFound();

  const [auditRows] = await Promise.all([
    prisma.auditEvent.findMany({
      where: { receiptId: id, userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, action: true, createdAt: true },
    }),
    audit(userId, "receipt.viewed", { receiptId: id }),
  ]);

  const receipt = toReceiptDetail(row, session.user.accountType ?? "PRIVATE");
  const history: AuditEntry[] = auditRows.map((event) => ({ id: event.id, action: event.action, createdAt: event.createdAt.toISOString() }));
  const isProcessing = receipt.status === "PROCESSING";
  const editing = firstParam(query.redigera) === "1" && !isProcessing;
  const needsAttention = receipt.status === "NEEDS_REVIEW" || receipt.status === "FAILED";
  const subtitle = [receipt.merchantName, receipt.purchaseDate ? formatDate(receipt.purchaseDate) : null, receipt.totalAmount !== null ? formatMoney(receipt.totalAmount, receipt.currency) : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="animate-fade-up">
      <Link href="/app/kvitton" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-900">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Alla kvitton
      </Link>

      <header className="mb-6 mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={receipt.status} />
            {receipt.category ? <Badge tone="brand">{receipt.category}</Badge> : null}
            <Badge tone="neutral">{SOURCE_LABELS[receipt.source]}</Badge>
            {editing ? <Badge tone="dark">Redigerar</Badge> : null}
          </div>
          <h1 className="break-words text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">{receipt.title}</h1>
          {subtitle ? <p className="mt-1 text-ink-500">{subtitle}</p> : null}
        </div>
        {!editing && !isProcessing ? <ReceiptActions receiptId={receipt.id} files={receipt.files} isDeleted={Boolean(receipt.deletedAt)} /> : null}
      </header>

      <div className="space-y-6">
        {receipt.deletedAt ? <TrashBanner receiptId={receipt.id} deletedAt={receipt.deletedAt} /> : null}

        {isProcessing ? <ProcessingPoller receiptId={receipt.id} /> : null}

        {needsAttention && !editing ? (
          <ProcessingWarning receiptId={receipt.id} status={receipt.status === "FAILED" ? "FAILED" : "NEEDS_REVIEW"} error={receipt.processingError} canReprocess={receipt.files.length > 0} editHref={receiptHref(receipt.id, true)} />
        ) : null}

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="lg:sticky lg:top-6 lg:col-span-5">
            <FileViewer files={receipt.files} title={receipt.title} />
          </div>
          <div className="space-y-6 lg:col-span-7">
            {editing ? (
              <ReceiptForm mode="edit" receiptId={receipt.id} initialValues={toFormValues(receipt)} cancelHref={receiptHref(receipt.id)} />
            ) : (
              <>
                <ReceiptSummary receipt={receipt} />
                <WarrantyPanel receipt={receipt} />
              </>
            )}
          </div>
        </div>

        {!editing ? <ItemsTable receiptId={receipt.id} items={receipt.items} currency={receipt.currency} /> : null}

        {!editing ? (
          <section id="fraga-ai" className="scroll-mt-24" aria-labelledby="fraga-ai-rubrik">
            <h2 id="fraga-ai-rubrik" className="mb-1 text-lg font-semibold text-ink-900">
              Fråga AI om det här kvittot
            </h2>
            <p className="mb-4 text-sm text-ink-500">Till exempel ”Hur länge har jag garanti?”, ”Var hittar jag bruksanvisningen?” eller ”Vad gör jag om varan går sönder?”.</p>
            <ReceiptChat receiptId={receipt.id} receiptTitle={receipt.title} />
          </section>
        ) : null}

        <OcrText text={receipt.ocrText} />

        {!editing ? <AuditTrail entries={history} /> : null}
      </div>
    </div>
  );
}
