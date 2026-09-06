import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type Anthropic from "@anthropic-ai/sdk";
import { AI_BETAS, AI_MODEL, AiRefusalError, getAnthropic } from "./client";
import { CONSUMER_RIGHTS_SV, RECEIPT_CATEGORIES } from "./knowledge";

/** One input document for extraction. */
export type ExtractionInput =
  | { kind: "image"; data: Buffer; mimeType: "image/jpeg" | "image/png" | "image/webp" | "image/gif" }
  | { kind: "pdf"; data: Buffer }
  | { kind: "text"; text: string; label?: string };

const itemSchema = z.object({
  name: z.string().describe("Produkt-/tjänstenamn som det står på kvittot"),
  quantity: z.number().describe("Antal, 1 om inget anges"),
  unit_price: z.number().nullable().describe("Pris per styck inkl. moms"),
  total_price: z.number().nullable().describe("Radsumma inkl. moms"),
  article_number: z.string().nullable().describe("Artikelnummer/EAN/SKU om det finns"),
  brand: z.string().nullable().describe("Varumärke om det framgår, t.ex. Samsung"),
  model: z.string().nullable().describe("Modellbeteckning om den framgår, t.ex. UE55CU7105"),
  serial_number: z.string().nullable().describe("Serienummer/IMEI om det står på kvittot"),
  warranty_months: z.number().nullable().describe("Garantitid i månader för just denna rad om det anges"),
  category: z.enum(RECEIPT_CATEGORIES).nullable(),
});

const extractionSchema = z.object({
  is_receipt: z.boolean().describe("true om dokumentet är ett kvitto, en orderbekräftelse, faktura eller köpbevis"),
  title: z.string().describe("Kort rubrik, t.ex. 'Elgiganten – Samsung 55\" TV' eller 'ICA Maxi – matinköp'"),
  summary: z.string().describe("1–2 meningar om vad som köpts"),
  merchant_name: z.string().nullable(),
  merchant_org_number: z.string().nullable().describe("Organisationsnummer, format 556123-4567 om det finns"),
  merchant_address: z.string().nullable(),
  purchase_date: z.string().nullable().describe("Köpdatum i formatet YYYY-MM-DD"),
  total_amount: z.number().nullable().describe("Totalt betalt belopp inkl. moms"),
  vat_amount: z.number().nullable().describe("Total moms om den anges"),
  currency: z.string().describe("ISO 4217, t.ex. SEK, EUR"),
  payment_method: z.string().nullable().describe("T.ex. Kort, Swish, Faktura, Kontant, Klarna"),
  receipt_number: z.string().nullable().describe("Kvittonummer/ordernummer/fakturanummer"),
  category: z.enum(RECEIPT_CATEGORIES),
  items: z.array(itemSchema).describe("Alla rader på kvittot. Tom lista om inga rader kan läsas."),
  warranty_months: z.number().nullable().describe("Garantitid i månader om den uttryckligen anges på kvittot, annars null"),
  warranty_notes: z.string().nullable().describe("Text om garanti, öppet köp, bytesrätt, försäkring eller service som står på kvittot"),
  return_days: z.number().nullable().describe("Antal dagar öppet köp/bytesrätt om det anges"),
  ocr_text: z.string().describe("Fullständig transkription av all text på kvittot, rad för rad"),
  confidence: z.number().describe("0–1: hur säker tolkningen av belopp, datum och butik är"),
  language: z.string().describe("Språk på kvittot, ISO 639-1"),
});

export type ExtractedReceipt = z.infer<typeof extractionSchema>;

const SYSTEM_PROMPT = `Du är en noggrann assistent som läser av kvitton, orderbekräftelser och fakturor åt svenska privatpersoner och företag.

Uppgift: Läs dokumentet/dokumenten och fyll i strukturen exakt enligt schemat.
Regler:
- Hitta på ingenting. Sätt null när information saknas. Gissa aldrig belopp eller datum.
- Belopp anges som tal utan valutasymbol, decimalpunkt, inkl. moms. Svenska kvitton använder komma som decimaltecken och mellanslag som tusentalsavgränsare ("1 299,00" = 1299.00).
- Datum ska vara YYYY-MM-DD. Svenska kvitton skriver ofta YYYY-MM-DD, YY-MM-DD eller DD/MM-YY.
- Butiksnamn: använd det kända handelsnamnet (t.ex. "Elgiganten", "ICA Maxi Haninge", "Bauhaus"), inte bolagsformen.
- Artikelnummer, modell och serienummer är viktiga för garanti och bruksanvisning – fånga dem om de finns, exakt som skrivet.
- Om flera bilder skickas är de sidor/vinklar av SAMMA kvitto.
- ocr_text ska innehålla all läsbar text i ordning, en rad per rad på kvittot.
- Om dokumentet inte är ett kvitto/köpbevis: is_receipt=false, fyll ändå i title och ocr_text.

${CONSUMER_RIGHTS_SV}`;

function buildContent(inputs: ExtractionInput[]): Anthropic.Beta.BetaContentBlockParam[] {
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const input of inputs) {
    if (input.kind === "image") {
      blocks.push({
        type: "image",
        source: { type: "base64", media_type: input.mimeType, data: input.data.toString("base64") },
      });
    } else if (input.kind === "pdf") {
      blocks.push({
        type: "document",
        source: { type: "base64", media_type: "application/pdf", data: input.data.toString("base64") },
      });
    } else {
      blocks.push({
        type: "text",
        text: `${input.label ? `[${input.label}]\n` : ""}${input.text}`,
      });
    }
  }
  blocks.push({
    type: "text",
    text: "Läs av kvittot ovan och returnera strukturen. Svara på svenska i textfälten.",
  });
  return blocks;
}

/**
 * Extracts structured receipt data from images / PDFs / text using Claude vision + structured outputs.
 * Throws AiNotConfiguredError, AiRefusalError or an Anthropic API error.
 */
export async function extractReceipt(inputs: ExtractionInput[]): Promise<ExtractedReceipt> {
  if (inputs.length === 0) throw new Error("Inga dokument att tolka.");
  const client = getAnthropic();
  const format = betaZodOutputFormat(extractionSchema);

  const response = await client.beta.messages.parse({
    model: AI_MODEL,
    max_tokens: 16000,
    betas: [...AI_BETAS],
    fallbacks: "default",
    output_config: { effort: "medium", format },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildContent(inputs) }],
  });

  if (response.stop_reason === "refusal") {
    throw new AiRefusalError();
  }
  if (response.stop_reason === "max_tokens") {
    throw new Error("Tolkningen blev för lång och avbröts.");
  }
  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error("Kunde inte tolka svaret från AI-tjänsten.");
  }
  return normalize(parsed);
}

function normalize(r: ExtractedReceipt): ExtractedReceipt {
  const date = r.purchase_date && /^\d{4}-\d{2}-\d{2}$/.test(r.purchase_date) ? r.purchase_date : null;
  return {
    ...r,
    purchase_date: date && !Number.isNaN(new Date(date).getTime()) ? date : null,
    currency: (r.currency || "SEK").toUpperCase().slice(0, 3),
    confidence: Math.min(1, Math.max(0, r.confidence ?? 0)),
    items: r.items.map((item, i) => ({
      ...item,
      name: item.name.trim() || `Rad ${i + 1}`,
      quantity: item.quantity > 0 ? item.quantity : 1,
    })),
  };
}

export { extractionSchema };
