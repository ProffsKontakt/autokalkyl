import type { ReceiptUpdateInput } from "@/lib/receipts/schema";
import { RECEIPT_CATEGORIES, type ReceiptCategory } from "@/lib/ai/knowledge";

/**
 * Form state and parsing for `ReceiptForm`. Plain module (no "use client") so
 * the server page can build initial values with the same helpers.
 */

export interface ReceiptFormItem {
  /** Stable React key (item id when editing, random when added). */
  key: string;
  name: string;
  quantity: string;
  unitPrice: string;
  totalPrice: string;
  articleNumber: string;
  brand: string;
  model: string;
  serialNumber: string;
  warrantyMonths: string;
}

export interface ReceiptFormValues {
  title: string;
  merchantName: string;
  merchantOrgNumber: string;
  merchantAddress: string;
  /** YYYY-MM-DD */
  purchaseDate: string;
  totalAmount: string;
  vatAmount: string;
  currency: string;
  category: string;
  paymentMethod: string;
  receiptNumber: string;
  notes: string;
  /** Comma separated */
  tags: string;
  warrantyMonths: string;
  warrantyNotes: string;
  returnDays: string;
  items: ReceiptFormItem[];
}

export type ReceiptFormErrors = Record<string, string>;

export const CURRENCY_OPTIONS = ["SEK", "EUR", "NOK", "DKK", "USD", "GBP"] as const;
export const PAYMENT_SUGGESTIONS = ["Kort", "Swish", "Kontant", "Faktura", "Klarna", "Presentkort"] as const;

export const MAX_TAGS = 20;
export const MAX_TAG_LENGTH = 40;
export const MAX_ITEMS = 200;

let keyCounter = 0;

export function newItemKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  keyCounter += 1;
  return `item-${Date.now()}-${keyCounter}`;
}

export function emptyItem(): ReceiptFormItem {
  return {
    key: newItemKey(),
    name: "",
    quantity: "1",
    unitPrice: "",
    totalPrice: "",
    articleNumber: "",
    brand: "",
    model: "",
    serialNumber: "",
    warrantyMonths: "",
  };
}

export function emptyFormValues(): ReceiptFormValues {
  return {
    title: "",
    merchantName: "",
    merchantOrgNumber: "",
    merchantAddress: "",
    purchaseDate: "",
    totalAmount: "",
    vatAmount: "",
    currency: "SEK",
    category: "",
    paymentMethod: "",
    receiptNumber: "",
    notes: "",
    tags: "",
    warrantyMonths: "",
    warrantyNotes: "",
    returnDays: "",
    items: [],
  };
}

/** 1299.5 → "1299,5", 1299 → "1299", null → "". Swedish decimal comma. */
export function amountToInput(value: number | null | undefined, maxDecimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "";
  if (Number.isInteger(value)) return String(value);
  const fixed = value.toFixed(maxDecimals).replace(/0+$/, "").replace(/\.$/, "");
  return fixed.replace(".", ",");
}

export interface ParsedNumber {
  value: number | null;
  error?: string;
}

const AMOUNT_ERROR = "Ange ett belopp, t.ex. 1 299,50";
const QUANTITY_ERROR = "Ange ett antal, t.ex. 2 eller 0,5";

/**
 * Parses a Swedish-style decimal: "1 299,50", "1299.50", "1.299,50".
 * Whitespace (including non-breaking spaces) is ignored. Empty → null.
 */
function parseDecimal(raw: string, decimals: number, error: string): ParsedNumber {
  const cleaned = raw.replace(/\s/g, "");
  if (!cleaned) return { value: null };
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    // "1.299,50" – dot is a thousands separator, comma the decimal
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (hasComma) {
    normalized = cleaned.replace(",", ".");
  }
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return { value: null, error };
  const n = Number(normalized);
  if (!Number.isFinite(n) || Math.abs(n) >= 1e10) return { value: null, error };
  const factor = 10 ** decimals;
  return { value: Math.round(n * factor) / factor };
}

/** Amounts in currency ("299 kr", "1 299,50"). Two decimals. */
export function parseAmount(raw: string): ParsedNumber {
  return parseDecimal(raw.trim().replace(/(kr|sek|:-)$/i, ""), 2, AMOUNT_ERROR);
}

/** Quantities allow three decimals (e.g. 0,455 kg) and cannot be negative. */
export function parseQuantity(raw: string): ParsedNumber {
  const parsed = parseDecimal(raw.trim().replace(/(st|kg|l|m)$/i, ""), 3, QUANTITY_ERROR);
  if (parsed.value !== null && parsed.value < 0) return { value: null, error: QUANTITY_ERROR };
  return parsed;
}

/** Whole non-negative numbers (months, days). Empty → null. */
export function parseInteger(raw: string, label: string): ParsedNumber {
  const cleaned = raw.replace(/\s/g, "").replace(/(mån|månader|dagar|dgr)$/i, "");
  if (!cleaned) return { value: null };
  if (!/^\d{1,4}$/.test(cleaned)) return { value: null, error: `Ange ${label} som ett heltal` };
  return { value: Number(cleaned) };
}

export function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const part of raw.split(/[,;\n]/)) {
    const tag = part.trim().replace(/^#/, "");
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
  }
  return tags;
}

export function isReceiptCategory(value: string): value is ReceiptCategory {
  return (RECEIPT_CATEGORIES as readonly string[]).includes(value);
}

export function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(time)) return false;
  return new Date(time).toISOString().slice(0, 10) === value;
}

/** True when the user has not typed anything into the row (it is dropped on save). */
export function itemIsEmpty(item: ReceiptFormItem): boolean {
  return (
    !item.name.trim() &&
    !item.unitPrice.trim() &&
    !item.totalPrice.trim() &&
    !item.articleNumber.trim() &&
    !item.brand.trim() &&
    !item.model.trim() &&
    !item.serialNumber.trim() &&
    !item.warrantyMonths.trim()
  );
}

function text(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export interface BuildResult {
  input: ReceiptUpdateInput;
  errors: ReceiptFormErrors;
}

/**
 * Validates the form and converts it into the exact `ReceiptUpdateInput` shape
 * expected by the server actions. Amounts are sent as numbers.
 */
export function buildReceiptInput(values: ReceiptFormValues, mode: "create" | "edit"): BuildResult {
  const errors: ReceiptFormErrors = {};

  const title = text(values.title);
  const merchantName = text(values.merchantName);
  if (mode === "create" && !title && !merchantName) {
    errors.merchantName = "Ange butik eller en egen titel så vi kan hitta kvittot senare";
  }
  if (title && title.length > 140) errors.title = "Titeln får vara högst 140 tecken";

  const purchaseDate = values.purchaseDate.trim();
  if (purchaseDate && !isValidIsoDate(purchaseDate)) errors.purchaseDate = "Ange ett giltigt datum (ÅÅÅÅ-MM-DD)";

  const total = parseAmount(values.totalAmount);
  if (total.error) errors.totalAmount = total.error;
  const vat = parseAmount(values.vatAmount);
  if (vat.error) errors.vatAmount = vat.error;
  if (total.value !== null && vat.value !== null && Math.abs(vat.value) > Math.abs(total.value)) {
    errors.vatAmount = "Momsen kan inte vara större än totalbeloppet";
  }

  const currency = values.currency.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Ange en valutakod med tre bokstäver, t.ex. SEK";

  const category = values.category.trim();
  if (category && !isReceiptCategory(category)) errors.category = "Välj en kategori i listan";

  const tags = parseTags(values.tags);
  if (tags.length > MAX_TAGS) errors.tags = `Högst ${MAX_TAGS} taggar`;
  else if (tags.some((tag) => tag.length > MAX_TAG_LENGTH)) errors.tags = `En tagg får vara högst ${MAX_TAG_LENGTH} tecken`;

  const warrantyMonths = parseInteger(values.warrantyMonths, "garantitiden i månader");
  if (warrantyMonths.error) errors.warrantyMonths = warrantyMonths.error;
  const returnDays = parseInteger(values.returnDays, "öppet köp i dagar");
  if (returnDays.error) errors.returnDays = returnDays.error;

  const items: NonNullable<ReceiptUpdateInput["items"]> = [];
  values.items.forEach((item, index) => {
    if (itemIsEmpty(item)) return;
    const name = text(item.name);
    if (!name) errors[`items.${index}.name`] = "Ange vad varan heter";
    else if (name.length > 300) errors[`items.${index}.name`] = "Namnet får vara högst 300 tecken";
    const quantity = parseQuantity(item.quantity);
    if (quantity.error) errors[`items.${index}.quantity`] = quantity.error;
    const unitPrice = parseAmount(item.unitPrice);
    if (unitPrice.error) errors[`items.${index}.unitPrice`] = unitPrice.error;
    const totalPrice = parseAmount(item.totalPrice);
    if (totalPrice.error) errors[`items.${index}.totalPrice`] = totalPrice.error;
    const itemWarranty = parseInteger(item.warrantyMonths, "garantin i månader");
    if (itemWarranty.error) errors[`items.${index}.warrantyMonths`] = itemWarranty.error;
    items.push({
      name: name ?? "",
      quantity: quantity.value ?? 1,
      unitPrice: unitPrice.value,
      totalPrice: totalPrice.value,
      articleNumber: text(item.articleNumber),
      brand: text(item.brand),
      model: text(item.model),
      serialNumber: text(item.serialNumber),
      warrantyMonths: itemWarranty.value,
    });
  });
  if (items.length > MAX_ITEMS) errors.items = `Högst ${MAX_ITEMS} varor per kvitto`;

  const input: ReceiptUpdateInput = {
    title,
    merchantName,
    merchantOrgNumber: text(values.merchantOrgNumber),
    merchantAddress: text(values.merchantAddress),
    purchaseDate: purchaseDate || null,
    totalAmount: total.value,
    vatAmount: vat.value,
    currency,
    category: category && isReceiptCategory(category) ? category : null,
    paymentMethod: text(values.paymentMethod),
    receiptNumber: text(values.receiptNumber),
    notes: text(values.notes),
    tags,
    warrantyMonths: warrantyMonths.value,
    warrantyNotes: text(values.warrantyNotes),
    returnDays: returnDays.value,
    items,
  };

  return { input, errors };
}

/** Sum of the item totals that parse, or null when no item has a total. */
export function sumItemTotals(items: ReceiptFormItem[]): number | null {
  let sum = 0;
  let any = false;
  for (const item of items) {
    const parsed = parseAmount(item.totalPrice);
    if (parsed.value !== null) {
      sum += parsed.value;
      any = true;
    }
  }
  return any ? Math.round(sum * 100) / 100 : null;
}
