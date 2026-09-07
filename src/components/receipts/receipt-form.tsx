"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Save, Trash2 } from "lucide-react";
import { RECEIPT_CATEGORIES } from "@/lib/ai/knowledge";
import { createManualReceiptAction, updateReceiptAction } from "@/actions/receipts";
import { Button, ButtonLink, Card, CardContent, CardDescription, CardHeader, CardTitle, FieldError, Hint, Input, Label, Select, Textarea } from "@/components/ui";
import { cn, formatMoney } from "@/lib/utils";
import {
  CURRENCY_OPTIONS,
  MAX_ITEMS,
  PAYMENT_SUGGESTIONS,
  amountToInput,
  buildReceiptInput,
  emptyFormValues,
  emptyItem,
  parseAmount,
  parseQuantity,
  sumItemTotals,
  type ReceiptFormErrors,
  type ReceiptFormItem,
  type ReceiptFormValues,
} from "@/components/receipts/detail/form-values";

export type { ReceiptFormItem, ReceiptFormValues } from "@/components/receipts/detail/form-values";

export interface ReceiptFormProps {
  mode: "create" | "edit";
  /** Required in edit mode. */
  receiptId?: string;
  initialValues?: ReceiptFormValues;
  /** Where "Avbryt" takes the user. */
  cancelHref: string;
  className?: string;
}

type ItemField = Exclude<keyof ReceiptFormItem, "key">;

const ITEM_FIELDS: {
  key: ItemField;
  label: string;
  className: string;
  inputMode?: "decimal" | "numeric";
  placeholder?: string;
  /** Blurring this field fills in the row total when it is empty. */
  autoTotal?: boolean;
}[] = [
  { key: "name", label: "Vara", className: "col-span-2 sm:col-span-4 lg:col-span-3", placeholder: "T.ex. Bosch diskmaskin SMS4HVI33E" },
  { key: "quantity", label: "Antal", className: "col-span-1", inputMode: "decimal", autoTotal: true },
  { key: "unitPrice", label: "À-pris", className: "col-span-1", inputMode: "decimal", placeholder: "0,00", autoTotal: true },
  { key: "totalPrice", label: "Summa", className: "col-span-2 sm:col-span-2 lg:col-span-1", inputMode: "decimal", placeholder: "0,00" },
  { key: "articleNumber", label: "Artikelnr", className: "col-span-1 sm:col-span-2 lg:col-span-1" },
  { key: "brand", label: "Märke", className: "col-span-1 sm:col-span-2 lg:col-span-1" },
  { key: "model", label: "Modell", className: "col-span-2 sm:col-span-2 lg:col-span-2" },
  { key: "serialNumber", label: "Serienummer", className: "col-span-1 sm:col-span-2 lg:col-span-1" },
  { key: "warrantyMonths", label: "Garanti (mån)", className: "col-span-1 sm:col-span-2 lg:col-span-1", inputMode: "numeric" },
];

function Field({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
      {!error ? <Hint>{hint}</Hint> : null}
    </div>
  );
}

/**
 * Create/edit form for a receipt. Sends the exact `ReceiptUpdateInput` shape to
 * the server actions; amounts are parsed the Swedish way ("1 299,50").
 */
export function ReceiptForm({ mode, receiptId, initialValues, cancelHref, className }: ReceiptFormProps) {
  const router = useRouter();
  const uid = React.useId();
  const [values, setValues] = React.useState<ReceiptFormValues>(() => initialValues ?? emptyFormValues());
  const [errors, setErrors] = React.useState<ReceiptFormErrors>({});
  const [pending, startTransition] = React.useTransition();

  const fid = (key: string) => `${uid}-${key}`;

  function set<K extends Exclude<keyof ReceiptFormValues, "items">>(key: K, value: ReceiptFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) setErrors((current) => ({ ...current, [key]: "" }));
  }

  function updateItem(index: number, patch: Partial<ReceiptFormItem>) {
    setValues((current) => ({
      ...current,
      items: current.items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    }));
    const changed = Object.keys(patch).map((key) => `items.${index}.${key}`);
    if (changed.some((key) => errors[key])) {
      setErrors((current) => {
        const next = { ...current };
        for (const key of changed) delete next[key];
        return next;
      });
    }
  }

  function addItem() {
    setValues((current) => (current.items.length >= MAX_ITEMS ? current : { ...current, items: [...current.items, emptyItem()] }));
  }

  function removeItem(index: number) {
    setValues((current) => ({ ...current, items: current.items.filter((_, i) => i !== index) }));
    setErrors((current) => {
      const next: ReceiptFormErrors = {};
      for (const [key, message] of Object.entries(current)) {
        if (!key.startsWith(`items.${index}.`)) next[key] = message;
      }
      return next;
    });
  }

  /** Fills in the row total from quantity × unit price when the total is still empty. */
  function autoTotal(index: number) {
    const item = values.items[index];
    if (!item || item.totalPrice.trim()) return;
    const quantity = parseQuantity(item.quantity).value;
    const unitPrice = parseAmount(item.unitPrice).value;
    if (quantity === null || unitPrice === null) return;
    updateItem(index, { totalPrice: amountToInput(quantity * unitPrice) });
  }

  const itemsSum = sumItemTotals(values.items);
  const totalParsed = parseAmount(values.totalAmount).value;
  const sumMismatch = itemsSum !== null && totalParsed !== null && Math.abs(itemsSum - totalParsed) > 0.01;
  const currencyOptions = CURRENCY_OPTIONS.includes(values.currency as (typeof CURRENCY_OPTIONS)[number])
    ? [...CURRENCY_OPTIONS]
    : [values.currency, ...CURRENCY_OPTIONS];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const { input, errors: nextErrors } = buildReceiptInput(values, mode);
    setErrors(nextErrors);
    const firstKey = Object.keys(nextErrors)[0];
    if (firstKey) {
      toast.error("Kontrollera de markerade fälten.");
      document.getElementById(fid(firstKey))?.focus();
      return;
    }
    startTransition(async () => {
      try {
        if (mode === "edit") {
          if (!receiptId) throw new Error("Kvittot saknar id.");
          const result = await updateReceiptAction(receiptId, input);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success("Ändringarna är sparade.");
          router.push(`/app/kvitton/${receiptId}`);
          router.refresh();
          return;
        }
        const result = await createManualReceiptAction(input);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Kvittot är sparat.");
        router.push(result.data?.id ? `/app/kvitton/${result.data.id}` : "/app/kvitton");
        router.refresh();
      } catch (error) {
        const message = error instanceof Error && error.message && error.message !== "UNAUTHORIZED" ? error.message : "Något gick fel. Försök igen.";
        toast.error(message);
      }
    });
  }

  const inputProps = (key: Exclude<keyof ReceiptFormValues, "items">) => ({
    id: fid(key),
    "aria-invalid": errors[key] ? true : undefined,
    disabled: pending,
  });

  return (
    <form onSubmit={handleSubmit} noValidate className={cn("space-y-6", className)} aria-busy={pending}>
      <Card>
        <CardHeader>
          <CardTitle>Grunduppgifter</CardTitle>
          <CardDescription>Butik, datum och belopp är det viktigaste – resten kan du fylla i senare.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id={fid("title")} label="Titel" error={errors.title} hint="Lämna tomt så använder vi butikens namn." className="sm:col-span-2">
            <Input {...inputProps("title")} value={values.title} onChange={(e) => set("title", e.target.value)} maxLength={140} placeholder="T.ex. Elgiganten – ny TV" />
          </Field>
          <Field id={fid("merchantName")} label="Butik" error={errors.merchantName}>
            <Input {...inputProps("merchantName")} value={values.merchantName} onChange={(e) => set("merchantName", e.target.value)} maxLength={150} placeholder="T.ex. Clas Ohlson" autoComplete="organization" />
          </Field>
          <Field id={fid("merchantOrgNumber")} label="Organisationsnummer" error={errors.merchantOrgNumber}>
            <Input {...inputProps("merchantOrgNumber")} value={values.merchantOrgNumber} onChange={(e) => set("merchantOrgNumber", e.target.value)} maxLength={30} placeholder="556000-0000" inputMode="numeric" />
          </Field>
          <Field id={fid("merchantAddress")} label="Adress" error={errors.merchantAddress} className="sm:col-span-2">
            <Input {...inputProps("merchantAddress")} value={values.merchantAddress} onChange={(e) => set("merchantAddress", e.target.value)} maxLength={300} placeholder="Gata, postnummer och ort" />
          </Field>
          <Field id={fid("purchaseDate")} label="Inköpsdatum" error={errors.purchaseDate} hint="Garanti och reklamationsrätt räknas från det här datumet.">
            <Input {...inputProps("purchaseDate")} type="date" value={values.purchaseDate} onChange={(e) => set("purchaseDate", e.target.value)} />
          </Field>
          <Field id={fid("category")} label="Kategori" error={errors.category}>
            <Select {...inputProps("category")} value={values.category} onChange={(e) => set("category", e.target.value)}>
              <option value="">Ingen kategori</option>
              {RECEIPT_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={fid("totalAmount")} label="Totalbelopp" error={errors.totalAmount} hint="Skriv som på kvittot, t.ex. 1 299,50.">
            <Input {...inputProps("totalAmount")} value={values.totalAmount} onChange={(e) => set("totalAmount", e.target.value)} inputMode="decimal" placeholder="0,00" />
          </Field>
          <Field id={fid("vatAmount")} label="Varav moms" error={errors.vatAmount}>
            <Input {...inputProps("vatAmount")} value={values.vatAmount} onChange={(e) => set("vatAmount", e.target.value)} inputMode="decimal" placeholder="0,00" />
          </Field>
          <Field id={fid("currency")} label="Valuta" error={errors.currency}>
            <Select {...inputProps("currency")} value={values.currency} onChange={(e) => set("currency", e.target.value)}>
              {currencyOptions.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </Select>
          </Field>
          <Field id={fid("paymentMethod")} label="Betalsätt" error={errors.paymentMethod}>
            <Input {...inputProps("paymentMethod")} value={values.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)} maxLength={60} list={fid("payment-options")} placeholder="Kort, Swish, faktura…" />
            <datalist id={fid("payment-options")}>
              {PAYMENT_SUGGESTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </Field>
          <Field id={fid("receiptNumber")} label="Kvittonummer" error={errors.receiptNumber}>
            <Input {...inputProps("receiptNumber")} value={values.receiptNumber} onChange={(e) => set("receiptNumber", e.target.value)} maxLength={100} placeholder="Kvitto-/ordernummer" />
          </Field>
          <Field id={fid("tags")} label="Taggar" error={errors.tags} hint="Separera med komma, t.ex. kök, present, deklaration.">
            <Input {...inputProps("tags")} value={values.tags} onChange={(e) => set("tags", e.target.value)} placeholder="kök, present" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Garanti och öppet köp</CardTitle>
          <CardDescription>Reklamationsrätten räknar vi ut automatiskt från inköpsdatumet. Fyll i om butiken eller tillverkaren lovat mer.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field id={fid("warrantyMonths")} label="Garanti (månader)" error={errors.warrantyMonths} hint="T.ex. 24 för två års garanti.">
            <Input {...inputProps("warrantyMonths")} value={values.warrantyMonths} onChange={(e) => set("warrantyMonths", e.target.value)} inputMode="numeric" placeholder="0" />
          </Field>
          <Field id={fid("returnDays")} label="Öppet köp (dagar)" error={errors.returnDays} hint="T.ex. 30 om du får ångra dig i en månad.">
            <Input {...inputProps("returnDays")} value={values.returnDays} onChange={(e) => set("returnDays", e.target.value)} inputMode="numeric" placeholder="0" />
          </Field>
          <Field id={fid("warrantyNotes")} label="Garantivillkor" error={errors.warrantyNotes} className="sm:col-span-2" hint="Skriv av det som står på kvittot eller garantibeviset.">
            <Textarea {...inputProps("warrantyNotes")} value={values.warrantyNotes} onChange={(e) => set("warrantyNotes", e.target.value)} maxLength={2000} rows={3} placeholder="T.ex. 3 års garanti vid registrering hos tillverkaren." />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Varor</CardTitle>
          <CardDescription>Lägg till det du köpt. Serienummer och artikelnummer gör det lättare att reklamera och hitta bruksanvisningar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errors.items ? <FieldError>{errors.items}</FieldError> : null}
          {values.items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-ink-200 bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">Inga varor tillagda ännu.</p>
          ) : null}
          <ul className="space-y-3">
            {values.items.map((item, index) => (
              <li key={item.key} className="rounded-xl border border-ink-200 bg-ink-50/60 p-3 sm:p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink-700">Vara {index + 1}</span>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} disabled={pending} aria-label={`Ta bort vara ${index + 1}`}>
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Ta bort
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {ITEM_FIELDS.map((field) => {
                    const key = `items.${index}.${field.key}`;
                    const error = errors[key];
                    return (
                      <div key={field.key} className={field.className}>
                        <Label htmlFor={fid(key)} className="text-xs">
                          {field.label}
                        </Label>
                        <Input
                          id={fid(key)}
                          value={item[field.key]}
                          onChange={(e) => updateItem(index, { [field.key]: e.target.value })}
                          onBlur={field.autoTotal ? () => autoTotal(index) : undefined}
                          inputMode={field.inputMode}
                          placeholder={field.placeholder}
                          aria-invalid={error ? true : undefined}
                          disabled={pending}
                          className="h-10 text-sm"
                          maxLength={field.key === "name" ? 300 : 150}
                        />
                        <FieldError>{error}</FieldError>
                      </div>
                    );
                  })}
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={pending || values.items.length >= MAX_ITEMS}>
              <Plus className="h-4 w-4" aria-hidden />
              Lägg till vara
            </Button>
            {itemsSum !== null ? (
              <p className="text-sm text-ink-600">
                Varorna summerar till <span className="font-semibold text-ink-900">{formatMoney(itemsSum, values.currency)}</span>
                {sumMismatch ? (
                  <>
                    {" "}
                    – totalbeloppet är {formatMoney(totalParsed, values.currency)}.{" "}
                    <button type="button" onClick={() => set("totalAmount", amountToInput(itemsSum))} className="font-medium text-brand-700 underline-offset-2 hover:underline" disabled={pending}>
                      Använd summan
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Anteckningar</CardTitle>
          <CardDescription>Eget minne – t.ex. vem det var present till eller var manualen ligger.</CardDescription>
        </CardHeader>
        <CardContent>
          <Field id={fid("notes")} label="Anteckningar" error={errors.notes}>
            <Textarea {...inputProps("notes")} value={values.notes} onChange={(e) => set("notes", e.target.value)} maxLength={4000} rows={4} placeholder="Skriv vad du vill komma ihåg." />
          </Field>
        </CardContent>
      </Card>

      <div className="sticky bottom-[4.75rem] z-10 flex flex-col-reverse gap-2 rounded-2xl border border-ink-200/80 bg-white/95 p-3 shadow-card backdrop-blur sm:flex-row sm:justify-end lg:bottom-4">
        <ButtonLink href={cancelHref} variant="outline" aria-disabled={pending}>
          Avbryt
        </ButtonLink>
        <Button type="submit" loading={pending}>
          {pending ? null : <Save className="h-4 w-4" aria-hidden />}
          {mode === "edit" ? "Spara ändringar" : "Spara kvitto"}
        </Button>
      </div>
    </form>
  );
}
