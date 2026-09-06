import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import type { ExtractedReceipt } from "./extract";
import type { AssistantEvent, RunAssistantOptions } from "./assistant";

/**
 * Demo/test mode for the AI features (no Anthropic calls).
 *
 * Enabled with AI_MOCK=1, and never on Vercel – it exists for local demos, product videos and
 * end-to-end tests of the UI around extraction and the assistant.
 */
export function isAiMock(): boolean {
  return process.env.AI_MOCK === "1" && !process.env.VERCEL;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockExtractReceipt(): Promise<ExtractedReceipt> {
  await sleep(2600);
  return {
    is_receipt: true,
    title: 'Elgiganten – Samsung 55" QLED TV',
    summary: "Samsung 55\" QLED-tv köpt på Elgiganten Kungens Kurva. 24 månaders garanti och 30 dagars öppet köp.",
    merchant_name: "Elgiganten Kungens Kurva",
    merchant_org_number: "556446-0555",
    merchant_address: "Tangentvägen 2, 141 75 Kungens Kurva",
    purchase_date: "2026-09-03",
    total_amount: 8990,
    vat_amount: 1798,
    currency: "SEK",
    payment_method: "Kort",
    receipt_number: "K-4471-88213",
    category: "Elektronik",
    items: [
      {
        name: 'Samsung 55" QLED 4K TV QE55Q80C',
        quantity: 1,
        unit_price: 8990,
        total_price: 8990,
        article_number: "152 431 78",
        brand: "Samsung",
        model: "QE55Q80C",
        serial_number: "0B2K3TFN700412",
        warranty_months: 24,
        category: "Elektronik",
      },
    ],
    warranty_months: 24,
    warranty_notes: "Garanti 24 månader. Öppet köp 30 dagar med kvitto.",
    return_days: 30,
    ocr_text:
      "ELGIGANTEN\nKungens Kurva\nTangentvägen 2\nOrg.nr 556446-0555\n\nKvitto K-4471-88213\n2026-09-03 14:32\n\nSamsung 55\" QLED 4K TV QE55Q80C\nArt.nr 152 431 78\nSerienr 0B2K3TFN700412\n1 st 8 990,00\n\nMoms 25% 1 798,00\nTOTALT 8 990,00 SEK\n\nKort ****1234\n\nGaranti 24 mån. Öppet köp 30 dagar.\nTack för ditt köp!",
    confidence: 0.96,
    language: "sv",
  };
}

interface MockScript {
  match: RegExp;
  steps: Array<{ kind: "tool"; name: string; label: string; wait: number } | { kind: "status"; text: string; wait: number }>;
  text: string;
  sources: { title: string; url: string }[];
}

const SCRIPTS: MockScript[] = [
  {
    match: /fel|error|visar|bild|kod/i,
    steps: [
      { kind: "tool", name: "search_receipts", label: "Söker bland dina kvitton…", wait: 900 },
      { kind: "tool", name: "get_receipt", label: "Hämtar kvitto…", wait: 700 },
      { kind: "tool", name: "web_search", label: "Söker på webben…", wait: 1400 },
      { kind: "tool", name: "web_fetch", label: "Läser webbsida…", wait: 1200 },
    ],
    text:
      "Jag hittade kvittot: **Samsung 55\" QLED TV (QE55Q80C)**, köpt på Elgiganten Kungens Kurva den 12 mars 2024.\n\nFelkoden på bilden betyder att tv:n har tappat kontakten med nätverket. Så här löser du det:\n\n1. Håll in strömknappen på fjärrkontrollen i 5 sekunder så att tv:n startar om.\n2. Starta om routern och vänta en minut.\n3. Gå till Inställningar → Allmänt → Nätverk → Nätverksstatus och tryck på Försök igen.\n\nHjälper det inte? Reklamationsrätten gäller till **12 mars 2027** enligt konsumentköplagen, så kontakta Elgiganten på 0771‑115 115 och hänvisa till kvittonummer K-4471-88213.\n\nBruksanvisningen för din modell finns här: [Samsung QE55Q80C – manual (PDF)](https://www.samsung.com/se/support/tv-audio-video/)",
    sources: [
      { title: "Samsung Support – Felsökning nätverk QLED", url: "https://www.samsung.com/se/support/tv-audio-video/" },
      { title: "Elgiganten – Reklamation och garanti", url: "https://www.elgiganten.se/kundservice/reklamation" },
    ],
  },
  {
    match: /garanti|reklam/i,
    steps: [
      { kind: "tool", name: "search_receipts", label: "Söker bland dina kvitton…", wait: 900 },
      { kind: "tool", name: "get_receipt", label: "Hämtar kvitto…", wait: 700 },
      { kind: "tool", name: "web_search", label: "Söker på webben…", wait: 1500 },
    ],
    text:
      "Din tv är en **Samsung 55\" QLED (QE55Q80C)**, köpt på Elgiganten den 12 mars 2024 för 8 990 kr.\n\n- **Garanti:** Samsung ger 24 månaders garanti. Den gick ut den 12 mars 2026.\n- **Reklamationsrätt:** Enligt konsumentköplagen har du 3 år, alltså till **12 mars 2027**. Fel som visar sig inom två år antas ha funnits från början.\n\nVill du reklamera: kontakta Elgiganten skriftligt, bifoga kvittot (jag har det här) och beskriv felet. De ska erbjuda reparation eller en ny tv inom skälig tid.\n\nKälla: Samsungs garantivillkor och Konsumentverket.",
    sources: [
      { title: "Samsung – Garantivillkor Sverige", url: "https://www.samsung.com/se/support/warranty/" },
      { title: "Hallå konsument – Reklamera en vara", url: "https://www.hallakonsument.se/reklamera/" },
    ],
  },
  {
    match: /bruksanvisning|manual/i,
    steps: [
      { kind: "tool", name: "search_receipts", label: "Söker bland dina kvitton…", wait: 800 },
      { kind: "tool", name: "web_search", label: "Söker på webben…", wait: 1300 },
    ],
    text:
      "Bruksanvisningen till din **Bosch Serie 6 diskmaskin (SMS6ZCI00E)** finns hos Bosch: [Ladda ner manualen (PDF)](https://www.bosch-home.se/support/manualer)\n\nSnabbtips: symbolen med kranen betyder att vattentillförseln är stängd eller filtret igensatt. Rensa filtret i botten av maskinen och kontrollera att kranen är öppen.",
    sources: [{ title: "Bosch – Bruksanvisningar", url: "https://www.bosch-home.se/support/manualer" }],
  },
  {
    match: /.*/,
    steps: [{ kind: "tool", name: "search_receipts", label: "Söker bland dina kvitton…", wait: 900 }],
    text:
      "Jag hittade det här bland dina kvitton:\n\n- **Elgiganten** – Samsung 55\" QLED TV, 12 mars 2024, 8 990 kr\n- **Bauhaus** – Bosch skruvdragare, 18 maj 2025, 2 349 kr\n- **Solkraft Sverige** – solcellsanläggning, 1 september 2025, 189 000 kr\n\nVill du veta mer om garantin, bruksanvisningen eller hur du reklamerar något av dem?",
    sources: [],
  },
];

export async function runMockAssistant(options: RunAssistantOptions): Promise<void> {
  const { userId, conversationId, userText, attachments = [], emit } = options;
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, userId }, select: { id: true, title: true } });
  if (!conversation) throw new Error("Konversationen hittades inte.");

  const userContent: Array<Record<string, unknown>> = [];
  for (const a of attachments.slice(0, 3)) userContent.push({ type: "image", omitted: true, media_type: a.mimeType });
  userContent.push({ type: "text", text: userText });
  await prisma.chatMessage.create({
    data: { conversationId, role: "USER", text: userText, content: userContent as unknown as Prisma.InputJsonValue },
  });

  const script = attachments.length ? SCRIPTS[0] : (SCRIPTS.find((s) => s.match.test(userText)) ?? SCRIPTS[SCRIPTS.length - 1]);
  const send = (event: AssistantEvent) => emit(event);

  await sleep(500);
  for (const step of script.steps) {
    if (step.kind === "tool") send({ type: "tool", name: step.name, label: step.label });
    else send({ type: "status", text: step.text });
    await sleep(step.wait);
  }

  const words = script.text.split(/(\s+)/);
  for (const w of words) {
    if (!w) continue;
    send({ type: "text", text: w });
    if (/\S/.test(w)) await sleep(38 + Math.min(60, w.length * 4));
  }
  if (script.sources.length) send({ type: "sources", items: script.sources });

  const stored: Array<Record<string, unknown>> = [{ type: "text", text: script.text }];
  if (script.sources.length) stored.push({ type: "sources", items: script.sources });
  const assistantMessage = await prisma.chatMessage.create({
    data: { conversationId, role: "ASSISTANT", text: script.text, content: stored as unknown as Prisma.InputJsonValue },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date(), title: conversation.title ?? userText.slice(0, 80) },
  });
  send({ type: "done", conversationId, messageId: assistantMessage.id });
}
