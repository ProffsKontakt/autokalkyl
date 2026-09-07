/**
 * JSON-safe shapes for the receipt detail page. Everything here can cross the
 * server → client boundary (no Decimal, no Date).
 */

export type ReceiptStatusValue = "PROCESSING" | "READY" | "NEEDS_REVIEW" | "FAILED";
export type ReceiptSourceValue = "SCAN" | "UPLOAD" | "EMAIL" | "MANUAL";
export type FileKindValue = "IMAGE" | "PDF" | "EMAIL_HTML" | "EMAIL_TEXT";
export type AccountTypeValue = "PRIVATE" | "BUSINESS";
export type CoverageStatusValue = "active" | "expiring" | "expired" | "unknown";

export interface ReceiptDetailFile {
  id: string;
  kind: FileKindValue;
  mimeType: string;
  originalName: string | null;
  width: number | null;
  height: number | null;
  byteSize: number;
  position: number;
}

export interface ReceiptDetailItem {
  id: string;
  position: number;
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  articleNumber: string | null;
  brand: string | null;
  model: string | null;
  serialNumber: string | null;
  productUrl: string | null;
  manualUrl: string | null;
  warrantyMonths: number | null;
  category: string | null;
}

export interface ReceiptCoverage {
  status: CoverageStatusValue;
  /** ISO date (YYYY-MM-DD) */
  until: string | null;
  kind: "warranty" | "legal" | null;
  daysLeft: number | null;
}

export interface ReceiptDetail {
  id: string;
  status: ReceiptStatusValue;
  source: ReceiptSourceValue;
  accountType: AccountTypeValue;
  title: string;
  merchantName: string | null;
  merchantOrgNumber: string | null;
  merchantAddress: string | null;
  /** ISO date (YYYY-MM-DD) */
  purchaseDate: string | null;
  totalAmount: number | null;
  vatAmount: number | null;
  currency: string;
  category: string | null;
  paymentMethod: string | null;
  receiptNumber: string | null;
  notes: string | null;
  tags: string[];
  ocrText: string | null;
  aiSummary: string | null;
  aiConfidence: number | null;
  processingError: string | null;
  warrantyMonths: number | null;
  warrantyExpiresAt: string | null;
  warrantyNotes: string | null;
  returnDeadline: string | null;
  legalClaimDeadline: string | null;
  coverage: ReceiptCoverage;
  emailFrom: string | null;
  emailSubject: string | null;
  retentionUntil: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: ReceiptDetailItem[];
  files: ReceiptDetailFile[];
}

export interface AuditEntry {
  id: string;
  action: string;
  createdAt: string;
}

export const SOURCE_LABELS: Record<ReceiptSourceValue, string> = {
  SCAN: "Skannat",
  UPLOAD: "Uppladdat",
  EMAIL: "E-post",
  MANUAL: "Manuellt",
};

export const FILE_KIND_LABELS: Record<FileKindValue, string> = {
  IMAGE: "Bild",
  PDF: "PDF",
  EMAIL_HTML: "E-post",
  EMAIL_TEXT: "E-post (text)",
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  "receipt.created": "Kvittot lades till",
  "receipt.processed": "Kvittot tolkades av AI",
  "receipt.viewed": "Kvittot visades",
  "receipt.updated": "Uppgifterna ändrades",
  "receipt.deleted": "Flyttades till papperskorgen",
  "receipt.restored": "Återställdes från papperskorgen",
  "receipt.purged": "Raderades permanent",
  "receipt.file_viewed": "Originalfilen öppnades",
  "receipt.email_received": "Togs emot via e-post",
  "chat.message": "Fråga ställdes till AI",
  "export.csv": "Exporterades till CSV",
};

/** Swedish label for an audit action, falling back to the raw action key. */
export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

/** Link to a receipt, optionally straight into edit mode. */
export function receiptHref(id: string, edit = false): string {
  return edit ? `/app/kvitton/${id}?redigera=1` : `/app/kvitton/${id}`;
}

/** URL for a stored receipt file (owner-only API route). */
export function fileUrl(fileId: string, options: { thumb?: boolean; download?: boolean } = {}): string {
  const params = new URLSearchParams();
  if (options.thumb) params.set("thumb", "1");
  if (options.download) params.set("download", "1");
  const query = params.toString();
  return `/api/files/${fileId}${query ? `?${query}` : ""}`;
}

/** Short, human label for a file: "Bild 1 av 3", "PDF", "E-post". */
export function fileLabel(file: ReceiptDetailFile, index: number, total: number): string {
  if (file.kind === "IMAGE") return total > 1 ? `Bild ${index + 1} av ${total}` : "Bild";
  return FILE_KIND_LABELS[file.kind];
}
