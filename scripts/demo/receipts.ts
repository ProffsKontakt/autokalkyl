/**
 * Demo receipt data + HTML templates used by scripts/seed-demo.ts.
 *
 * Everything in this file is deterministic (no Date.now(), no randomness) so that repeated seeding
 * produces identical receipts. The thermal receipts are built from a small "line model" that is
 * rendered both as HTML (→ PNG via Chromium) and as plain text (→ Receipt.ocrText), so the image and
 * the OCR text always agree.
 */
import type { ReceiptCategory } from "@/lib/ai/knowledge";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type DemoLayout = "thermal" | "invoice" | "email";

export interface DemoItem {
  name: string;
  quantity: number;
  /** "st" (default) or "kg" – only affects how the quantity line is printed. */
  unit?: "st" | "kg";
  /** Negative amounts are deductions (e.g. skattereduktion) – shown in the invoice totals, not the item table. */
  unitPrice: number;
  totalPrice: number;
  articleNumber?: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  warrantyMonths?: number;
  category?: string;
  /** Extra lines printed under the item, e.g. size/colour. */
  extraLines?: string[];
}

export interface DemoMerchant {
  /** Big logo text on the receipt, e.g. "ELGIGANTEN". */
  logo: string;
  /** Store line printed under the logo, e.g. "Kungens Kurva" (thermal receipts only). */
  store?: string;
  /** Stored as Receipt.merchantName. */
  name: string;
  legalName: string;
  orgNumber: string;
  /** Stored as Receipt.merchantAddress. */
  address: string;
  phone?: string;
  web?: string;
  vatNumber?: string;
  bankgiro?: string;
}

export interface DemoInvoice {
  number: string;
  dueDate: string;
  customerNumber: string;
  ourReference: string;
  customer: { name: string; address: string; postal: string; personalNumberMasked: string };
  installedOn: string;
  /** Rows that are NOT part of the green-deduction base (e.g. scaffolding). */
  nonDeductibleItemNames: string[];
  greenDeductionRate: number;
  greenDeductionBase: number;
  greenDeduction: number;
  ocrNumber: string;
}

export interface DemoReceipt {
  /** Stable key used to reference receipts from other seed data (e.g. the demo conversation). */
  key: string;
  source: "SCAN" | "UPLOAD" | "EMAIL";
  layout: DemoLayout;
  title: string;
  merchant: DemoMerchant;
  purchaseDate: string; // YYYY-MM-DD
  purchaseTime: string; // HH:MM
  /** When the receipt was scanned/uploaded/received in the app → Receipt.createdAt (ISO). */
  scannedAt: string;
  totalAmount: number;
  /** VAT lines as printed on the receipt. The sum is stored as Receipt.vatAmount. */
  vat: { rate: number; amount: number; base: number }[];
  category: ReceiptCategory;
  paymentMethod: string;
  /** Payment block as printed – the first line gets the total on the right. */
  paymentLines: string[];
  receiptNumber: string;
  registerLine?: string;
  items: DemoItem[];
  aiSummary: string;
  aiConfidence: number;
  warrantyMonths: number | null;
  warrantyNotes: string | null;
  returnDays: number | null;
  tags: string[];
  /** Footer lines: warranty / öppet köp / thanks. */
  footer: string[];
  email?: { from: string; subject: string };
  invoice?: DemoInvoice;
}

export interface DemoChatMessage {
  role: "USER" | "ASSISTANT";
  text: string;
  sources?: { title: string; url: string }[];
  /** ISO timestamp. */
  at: string;
}

// -----------------------------------------------------------------------------
// Demo user & conversation
// -----------------------------------------------------------------------------

export const DEMO_USER = {
  email: "demo@kvittera.se",
  password: "Demo1234!",
  name: "Anna Andersson",
  accountType: "PRIVATE" as const,
  inboundToken: "kvitto-demo7k2m4p",
  createdAt: "2024-03-10T09:15:00.000Z",
};

export const DEMO_CONVERSATION: { title: string; receiptKey: string; createdAt: string; messages: DemoChatMessage[] } = {
  title: "Vilken garanti har min tv?",
  receiptKey: "elgiganten-tv",
  createdAt: "2026-09-04T18:02:00.000Z",
  messages: [
    { role: "USER", text: "Vilken garanti har min tv?", at: "2026-09-04T18:02:00.000Z" },
    {
      role: "ASSISTANT",
      at: "2026-09-04T18:02:14.000Z",
      text: [
        "Jag hittade ditt kvitto från Elgiganten Kungens Kurva, daterat 12 mars 2024: Samsung 55\" QLED-tv (QE55Q80C), 8 990 kr, serienummer 0B2K3TFN700412.",
        "",
        "**Garanti:** Samsung lämnar 24 månaders garanti, så garantin gick ut den 12 mars 2026.",
        "",
        "**Reklamationsrätt:** Du har fortfarande reklamationsrätt i 3 år enligt konsumentköplagen – fram till den 12 mars 2027. Den gäller ursprungliga fel, alltså fel som fanns när du köpte tv:n, även om de visar sig först nu.",
        "",
        "**Så reklamerar du:** Kontakta Elgiganten skriftligt (butiken eller kundservice), beskriv felet och bifoga kvittot. Eftersom det gått mer än två år är det du som ska göra det troligt att felet är ursprungligt – en tydlig felbeskrivning och gärna ett foto eller en film på felet hjälper. Kommer ni inte överens kan du vända dig till ARN.",
        "",
        "Vill du att jag hjälper dig att formulera reklamationen?",
      ].join("\n"),
      sources: [
        { title: "Samsung Sverige – Garanti och support", url: "https://www.samsung.com/se/support/warranty/" },
        { title: "Elgiganten – Garanti och reklamation", url: "https://www.elgiganten.se/kundservice/garanti-reklamation" },
        { title: "Hallå konsument – Reklamera en vara", url: "https://www.hallakonsument.se/klaga-angra-eller-anmala/reklamera-vara-eller-tjanst/" },
      ],
    },
    { role: "USER", text: "Var hittar jag bruksanvisningen?", at: "2026-09-04T18:03:05.000Z" },
    {
      role: "ASSISTANT",
      at: "2026-09-04T18:03:12.000Z",
      text:
        "Bruksanvisningen till din Samsung QE55Q80C finns att ladda ner som PDF på Samsungs supportsida för modellen – välj \"Manualer & nedladdningar\". Där finns även programuppdateringar och en felsökningsguide. Vill du att jag letar upp något särskilt i manualen, till exempel hur du återställer tv:n till fabriksinställningar?",
      sources: [{ title: "Samsung – QE55Q80C: manualer och nedladdningar", url: "https://www.samsung.com/se/support/model/QE55Q80CATXXC/" }],
    },
  ],
};

// -----------------------------------------------------------------------------
// Merchants
// -----------------------------------------------------------------------------

const ELGIGANTEN_KUNGENS_KURVA: DemoMerchant = {
  logo: "ELGIGANTEN",
  store: "Kungens Kurva",
  name: "Elgiganten Kungens Kurva",
  legalName: "Elgiganten AB",
  orgNumber: "556471-4474",
  address: "Tangentvägen 2, 141 75 Kungens Kurva",
  phone: "0771-115 115",
  web: "elgiganten.se",
};

const CUSTOMER_CARD = "Kort Mastercard ************4412";

// -----------------------------------------------------------------------------
// Receipts (dates relative to "today" 2026-09-06)
// -----------------------------------------------------------------------------

export const DEMO_RECEIPTS: DemoReceipt[] = [
  {
    key: "elgiganten-tv",
    source: "SCAN",
    layout: "thermal",
    title: "Elgiganten – Samsung 55\" QLED TV",
    merchant: ELGIGANTEN_KUNGENS_KURVA,
    purchaseDate: "2024-03-12",
    purchaseTime: "14:37",
    scannedAt: "2024-03-12T17:41:00.000Z",
    totalAmount: 8990,
    vat: [{ rate: 25, amount: 1798, base: 7192 }],
    category: "Elektronik",
    paymentMethod: "Kort",
    paymentLines: [CUSTOMER_CARD, "Kontaktlös  AID A0000000041010", "Ref 004471221  Godkänd"],
    receiptNumber: "4471-88213",
    registerLine: "Kassa 3   Kassör 2181",
    items: [
      {
        name: "Samsung 55\" QLED 4K TV QE55Q80C",
        quantity: 1,
        unitPrice: 8990,
        totalPrice: 8990,
        articleNumber: "152 431 78",
        brand: "Samsung",
        model: "QE55Q80C",
        serialNumber: "0B2K3TFN700412",
        warrantyMonths: 24,
        category: "Elektronik",
      },
    ],
    aiSummary: "Samsung 55\" QLED-tv (QE55Q80C) köpt på Elgiganten Kungens Kurva för 8 990 kr. 24 månaders garanti och 30 dagars öppet köp.",
    aiConfidence: 0.97,
    warrantyMonths: 24,
    warrantyNotes: "Samsung: 24 månaders garanti. Elgiganten: öppet köp 30 dagar med kvitto (oöppnad förpackning).",
    returnDays: 30,
    tags: ["tv", "samsung", "elektronik"],
    footer: ["Garanti 24 månader (Samsung)", "Öppet köp 30 dagar med kvitto.", "Reklamationsrätt 3 år enligt konsumentköplagen."],
  },
  {
    key: "ica-maxi",
    source: "SCAN",
    layout: "thermal",
    title: "ICA Maxi Haninge – veckohandling",
    merchant: {
      logo: "ICA MAXI",
      store: "Maxi ICA Stormarknad Haninge",
      name: "ICA Maxi Haninge",
      legalName: "Maxi Stormarknad Haninge AB",
      orgNumber: "556802-1145",
      address: "Nynäsvägen 1, 136 40 Handen",
      phone: "08-741 60 00",
      web: "ica.se/maxi-haninge",
    },
    purchaseDate: "2026-08-30",
    purchaseTime: "11:52",
    scannedAt: "2026-08-30T12:28:00.000Z",
    totalAmount: 1243.5,
    vat: [
      { rate: 12, amount: 105.4, base: 878.35 },
      { rate: 25, amount: 51.95, base: 207.8 },
    ],
    category: "Mat & dryck",
    paymentMethod: "Swish",
    paymentLines: ["Swish 070-*** ** 12", "Ref 4Q7X2M9K  Godkänd"],
    receiptNumber: "20260830-7-3417",
    registerLine: "Kassa 7   Kassör Lina",
    items: [
      { name: "Mjölk 3% Arla 1,5 l", quantity: 2, unitPrice: 19.9, totalPrice: 39.8, brand: "Arla" },
      { name: "Lingongrova Pågen 500 g", quantity: 1, unitPrice: 34.95, totalPrice: 34.95, brand: "Pågen" },
      { name: "Kaffe Gevalia mellanrost 450 g", quantity: 2, unitPrice: 54.95, totalPrice: 109.9, brand: "Gevalia" },
      { name: "Ägg frigående 12-p", quantity: 1, unitPrice: 46.9, totalPrice: 46.9 },
      { name: "Bregott 600 g", quantity: 1, unitPrice: 64.95, totalPrice: 64.95, brand: "Bregott" },
      { name: "Kycklingfilé Kronfågel 925 g", quantity: 1, unitPrice: 119, totalPrice: 119, brand: "Kronfågel" },
      { name: "Laxfilé 4-p 500 g", quantity: 1, unitPrice: 129, totalPrice: 129 },
      { name: "Nötfärs 10% 800 g", quantity: 1, unitPrice: 99, totalPrice: 99 },
      { name: "Bananer", quantity: 1.121, unit: "kg", unitPrice: 24.9, totalPrice: 27.91 },
      { name: "Tomater kvist", quantity: 1.646, unit: "kg", unitPrice: 49.9, totalPrice: 82.14 },
      { name: "Krossade tomater ICA 400 g", quantity: 4, unitPrice: 12.95, totalPrice: 51.8, brand: "ICA" },
      { name: "Prästost 31% ca 700 g", quantity: 1, unitPrice: 98.5, totalPrice: 98.5 },
      { name: "Brämhults apelsinjuice 1 l", quantity: 2, unitPrice: 39.95, totalPrice: 79.9, brand: "Brämhults" },
      { name: "Lambi toalettpapper 12-p", quantity: 1, unitPrice: 89.95, totalPrice: 89.95, brand: "Lambi" },
      { name: "Yes diskmedel 650 ml", quantity: 1, unitPrice: 39.95, totalPrice: 39.95, brand: "Yes" },
      { name: "Pepsodent tandkräm 2-p", quantity: 1, unitPrice: 49.95, totalPrice: 49.95, brand: "Pepsodent" },
      { name: "Via Color tvättmedel 2,5 kg", quantity: 1, unitPrice: 79.9, totalPrice: 79.9, brand: "Via" },
    ],
    aiSummary: "Veckohandling på ICA Maxi Haninge, 17 varor för 1 243,50 kr betalt med Swish. Livsmedel samt hushållsartiklar.",
    aiConfidence: 0.95,
    warrantyMonths: null,
    warrantyNotes: null,
    returnDays: null,
    tags: ["veckohandling", "mat"],
    footer: ["Öppet köp gäller ej livsmedel.", "Stammis: 1 244 poäng registrerade.", "Spara kvittot vid reklamation."],
  },
  {
    key: "bauhaus-skruvdragare",
    source: "UPLOAD",
    layout: "thermal",
    title: "Bauhaus – Bosch GSR 18V-55 skruvdragare",
    merchant: {
      logo: "BAUHAUS",
      store: "Länna",
      name: "Bauhaus Länna",
      legalName: "Bauhaus & Co KB",
      orgNumber: "969627-9459",
      address: "Truckvägen 4, 142 50 Skogås",
      phone: "08-448 80 00",
      web: "bauhaus.se",
    },
    purchaseDate: "2025-05-18",
    purchaseTime: "10:14",
    scannedAt: "2025-05-18T17:05:00.000Z",
    totalAmount: 2349,
    vat: [{ rate: 25, amount: 469.8, base: 1879.2 }],
    category: "Bygg & verktyg",
    paymentMethod: "Kort",
    paymentLines: ["Kort Visa ************0918", "Chip + PIN  AID A0000000031010", "Ref 000417883  Godkänd"],
    receiptNumber: "0417-88",
    registerLine: "Kassa 4   Kassör 3390",
    items: [
      {
        name: "Bosch Professional GSR 18V-55 2x2,0Ah L-BOXX",
        quantity: 1,
        unitPrice: 1749,
        totalPrice: 1749,
        articleNumber: "06019H5202",
        brand: "Bosch",
        model: "GSR 18V-55",
        serialNumber: "512 007 328",
        warrantyMonths: 36,
        category: "Bygg & verktyg",
      },
      {
        name: "Bosch Impact Control bitsset 35 delar",
        quantity: 1,
        unitPrice: 199,
        totalPrice: 199,
        articleNumber: "2608522366",
        brand: "Bosch",
        category: "Bygg & verktyg",
      },
      {
        name: "Sortimo L-BOXX 102 med insats",
        quantity: 1,
        unitPrice: 401,
        totalPrice: 401,
        articleNumber: "6100000305",
        brand: "Sortimo",
        model: "L-BOXX 102",
        category: "Bygg & verktyg",
      },
    ],
    aiSummary: "Bosch Professional GSR 18V-55 skruvdragare med två batterier, bitsset och Sortimo L-BOXX från Bauhaus Länna, totalt 2 349 kr. 3 års garanti vid registrering hos Bosch.",
    aiConfidence: 0.94,
    warrantyMonths: 36,
    warrantyNotes: "Bosch Professional: 3 års garanti vid registrering inom 4 veckor",
    returnDays: 30,
    tags: ["verktyg", "bosch"],
    footer: ["Bosch Professional: 3 års garanti vid", "registrering inom 4 veckor (bosch-pt.com)", "Öppet köp 30 dagar med kvitto."],
  },
  {
    key: "clas-ohlson-horlurar",
    source: "SCAN",
    layout: "thermal",
    title: "Clas Ohlson – Sony WH-CH720N hörlurar",
    merchant: {
      logo: "CLAS OHLSON",
      store: "Sickla",
      name: "Clas Ohlson Sickla",
      legalName: "Clas Ohlson AB",
      orgNumber: "556035-8672",
      address: "Sickla Köpkvarter, Smedjegatan 2, 131 54 Nacka",
      phone: "0247-444 00",
      web: "clasohlson.com",
    },
    purchaseDate: "2026-07-02",
    purchaseTime: "17:23",
    scannedAt: "2026-07-02T17:39:00.000Z",
    totalAmount: 799,
    vat: [{ rate: 25, amount: 159.8, base: 639.2 }],
    category: "Elektronik",
    paymentMethod: "Kort",
    paymentLines: [CUSTOMER_CARD, "Kontaktlös  AID A0000000041010", "Ref 001181702  Godkänd"],
    receiptNumber: "1181-4-70213",
    registerLine: "Kassa 4   Kassör Samir",
    items: [
      {
        name: "Sony WH-CH720N hörlurar brusred. svart",
        quantity: 1,
        unitPrice: 799,
        totalPrice: 799,
        articleNumber: "38-9986",
        brand: "Sony",
        model: "WH-CH720N",
        serialNumber: "5027431",
        warrantyMonths: 12,
        category: "Elektronik",
      },
    ],
    aiSummary: "Sony WH-CH720N brusreducerande hörlurar från Clas Ohlson Sickla, 799 kr. 12 månaders garanti och 30 dagars öppet köp.",
    aiConfidence: 0.96,
    warrantyMonths: 12,
    warrantyNotes: "Sony: 1 års tillverkargaranti. Clas Ohlson: 30 dagars öppet köp med kvitto, oanvänd vara i originalförpackning.",
    returnDays: 30,
    tags: ["hörlurar", "sony"],
    footer: ["Öppet köp 30 dagar med kvitto.", "Garanti 12 månader (Sony).", "Bytesrätt 30 dagar i alla våra butiker."],
  },
  {
    key: "solkraft-solceller",
    source: "EMAIL",
    layout: "invoice",
    title: "Solkraft Sverige – Solcellsanläggning 10,4 kWp",
    merchant: {
      logo: "SOLKRAFT",
      name: "Solkraft Sverige AB",
      legalName: "Solkraft Sverige AB",
      orgNumber: "559312-4471",
      address: "Energivägen 12, 741 40 Knivsta",
      phone: "018-440 22 10",
      web: "solkraft.se",
      vatNumber: "SE559312447101",
      bankgiro: "5412-7788",
    },
    purchaseDate: "2025-09-01",
    purchaseTime: "09:00",
    scannedAt: "2025-09-01T12:12:00.000Z",
    totalAmount: 189000,
    vat: [{ rate: 25, amount: 44100, base: 176400 }],
    category: "Solceller & energi",
    paymentMethod: "Faktura",
    paymentLines: ["Faktura – bankgiro 5412-7788"],
    receiptNumber: "2025-0912",
    items: [
      {
        name: "Solpanel Jinko Tiger Neo 400W N-type, helsvart",
        quantity: 26,
        unitPrice: 1850,
        totalPrice: 48100,
        articleNumber: "JKM400N-54HL4-B",
        brand: "Jinko Solar",
        model: "Tiger Neo JKM400N-54HL4-B",
        warrantyMonths: 144,
        category: "Solceller & energi",
      },
      {
        name: "Växelriktare Huawei SUN2000-10KTL-M1",
        quantity: 1,
        unitPrice: 18900,
        totalPrice: 18900,
        articleNumber: "SUN2000-10KTL-M1",
        brand: "Huawei",
        model: "SUN2000-10KTL-M1",
        serialNumber: "HV2530196742",
        warrantyMonths: 120,
        category: "Solceller & energi",
      },
      {
        name: "Huawei Smart Dongle WLAN-FE",
        quantity: 1,
        unitPrice: 1500,
        totalPrice: 1500,
        articleNumber: "SDongleA-05",
        brand: "Huawei",
        warrantyMonths: 24,
        category: "Solceller & energi",
      },
      { name: "Montagesystem K2 Systems för tegeltak, 26 paneler", quantity: 1, unitPrice: 14200, totalPrice: 14200, brand: "K2 Systems", warrantyMonths: 144 },
      { name: "Elmaterial: DC-kablage, DC-brytare, överspänningsskydd", quantity: 1, unitPrice: 6300, totalPrice: 6300 },
      { name: "Installation och driftsättning (elektriker och montörer)", quantity: 1, unitPrice: 121000, totalPrice: 121000, warrantyMonths: 60, category: "Tjänster & hantverk" },
      { name: "Byggställning, hyra 1 vecka", quantity: 1, unitPrice: 8000, totalPrice: 8000 },
      { name: "Föranmälan nätägare, dokumentation och administration", quantity: 1, unitPrice: 2500, totalPrice: 2500 },
      { name: "Skattereduktion grön teknik 15 % (underlag 210 000,00)", quantity: 1, unitPrice: -31500, totalPrice: -31500 },
    ],
    aiSummary:
      "Faktura från Solkraft Sverige AB för solcellsanläggning 10,4 kWp (26 st Jinko Tiger Neo 400 W, Huawei SUN2000-10KTL växelriktare, installation). 189 000 kr inkl. moms efter grönt avdrag 31 500 kr.",
    aiConfidence: 0.93,
    warrantyMonths: 144,
    warrantyNotes: "Produktgaranti paneler 12 år, effektgaranti 25 år (min 87,4 % efter 25 år), växelriktare 10 år, installationsgaranti 5 år",
    returnDays: null,
    tags: ["solceller", "faktura", "grönt avdrag"],
    footer: [],
    email: { from: "faktura@solkraft.se", subject: "Faktura 2025-0912 – Solcellsanläggning" },
    invoice: {
      number: "2025-0912",
      dueDate: "2025-10-01",
      customerNumber: "10482",
      ourReference: "Marcus Lindqvist",
      customer: { name: "Anna Andersson", address: "Björkvägen 14", postal: "137 34 Vendelsö", personalNumberMasked: "850322-****" },
      installedOn: "2025-08-27",
      nonDeductibleItemNames: ["Byggställning, hyra 1 vecka", "Föranmälan nätägare, dokumentation och administration"],
      greenDeductionRate: 15,
      greenDeductionBase: 210000,
      greenDeduction: 31500,
      ocrNumber: "2025091200007",
    },
  },
  {
    key: "apotek-hjartat",
    source: "SCAN",
    layout: "thermal",
    title: "Apotek Hjärtat – Alvedon, nässpray m.m.",
    merchant: {
      logo: "APOTEK HJÄRTAT",
      store: "Haninge Centrum",
      name: "Apotek Hjärtat Haninge Centrum",
      legalName: "Apotek Hjärtat AB",
      orgNumber: "556773-8249",
      address: "Poseidons torg 6, 136 41 Handen",
      phone: "0771-405 405",
      web: "apotekhjartat.se",
    },
    purchaseDate: "2026-08-12",
    purchaseTime: "16:05",
    scannedAt: "2026-08-12T16:19:00.000Z",
    totalAmount: 312,
    vat: [{ rate: 25, amount: 62.4, base: 249.6 }],
    category: "Hälsa & skönhet",
    paymentMethod: "Kort",
    paymentLines: [CUSTOMER_CARD, "Kontaktlös  AID A0000000041010", "Ref 003341187  Godkänd"],
    receiptNumber: "3341-1187",
    registerLine: "Kassa 2   Farmaceut 118",
    items: [
      { name: "Alvedon 500 mg filmdrag. tabl. 20 st", quantity: 1, unitPrice: 49, totalPrice: 49, articleNumber: "01 84 47", brand: "Alvedon", category: "Hälsa & skönhet" },
      { name: "Nezeril nässpray 0,5 mg/ml 10 ml", quantity: 1, unitPrice: 89, totalPrice: 89, articleNumber: "08 19 63", brand: "Nezeril", category: "Hälsa & skönhet" },
      { name: "Apotek Hjärtat Sol SPF 50 200 ml", quantity: 1, unitPrice: 129, totalPrice: 129, articleNumber: "88 12 04", brand: "Apotek Hjärtat", category: "Hälsa & skönhet" },
      { name: "Salvequick plåster textil 20 st", quantity: 1, unitPrice: 45, totalPrice: 45, articleNumber: "24 71 15", brand: "Salvequick", category: "Hälsa & skönhet" },
    ],
    aiSummary: "Receptfria läkemedel och egenvårdsprodukter från Apotek Hjärtat Haninge Centrum, totalt 312 kr.",
    aiConfidence: 0.95,
    warrantyMonths: null,
    warrantyNotes: null,
    returnDays: null,
    tags: ["apotek", "hälsa"],
    footer: ["Öppet köp gäller ej läkemedel.", "Byte inom 30 dagar på oöppnade", "egenvårdsprodukter mot uppvisande av kvitto."],
  },
  {
    key: "elgiganten-diskmaskin",
    source: "EMAIL",
    layout: "email",
    title: "Elgiganten – Bosch Serie 6 diskmaskin",
    merchant: ELGIGANTEN_KUNGENS_KURVA,
    purchaseDate: "2024-11-05",
    purchaseTime: "17:12",
    scannedAt: "2024-11-05T16:14:00.000Z",
    totalAmount: 6495,
    vat: [{ rate: 25, amount: 1299, base: 5196 }],
    category: "Vitvaror",
    paymentMethod: "Kort",
    paymentLines: [CUSTOMER_CARD, "Kontaktlös  Ref 004471932  Godkänd"],
    receiptNumber: "4471-102394",
    registerLine: "Kassa 5   Kassör 2044",
    items: [
      {
        name: "Bosch Serie 6 diskmaskin SMS6ZCI00E, 60 cm, rostfri",
        quantity: 1,
        unitPrice: 6495,
        totalPrice: 6495,
        articleNumber: "209 118 52",
        brand: "Bosch",
        model: "SMS6ZCI00E",
        serialNumber: "FD0410 01523714",
        warrantyMonths: 24,
        category: "Vitvaror",
      },
      { name: "Hemleverans (kampanj: fri leverans)", quantity: 1, unitPrice: 0, totalPrice: 0 },
    ],
    aiSummary: "E-kvitto från Elgiganten Kungens Kurva: Bosch Serie 6 diskmaskin SMS6ZCI00E för 6 495 kr med fri hemleverans. 2 års garanti, 10 år mot genomrostning av innerbalja.",
    aiConfidence: 0.97,
    warrantyMonths: 24,
    warrantyNotes: "Bosch: 2 års garanti, 10 år mot genomrostning av innerbalja",
    returnDays: 30,
    tags: ["diskmaskin", "bosch", "vitvaror"],
    footer: ["Garanti 24 månader (Bosch). 10 års garanti mot genomrostning av innerbalja.", "Öppet köp 30 dagar med kvitto – oöppnad förpackning."],
    email: { from: "kvitto@elgiganten.se", subject: "Ditt e-kvitto från Elgiganten Kungens Kurva" },
  },
  {
    key: "stadium-loparskor",
    source: "UPLOAD",
    layout: "thermal",
    title: "Stadium – ASICS Gel-Nimbus 26 löparskor",
    merchant: {
      logo: "STADIUM",
      store: "Farsta Centrum",
      name: "Stadium Farsta",
      legalName: "Stadium AB",
      orgNumber: "556187-3299",
      address: "Farsta Centrum, Farstaplan 3, 123 47 Farsta",
      phone: "011-24 46 00",
      web: "stadium.se",
    },
    purchaseDate: "2026-06-14",
    purchaseTime: "13:41",
    scannedAt: "2026-06-15T07:20:00.000Z",
    totalAmount: 1299,
    vat: [{ rate: 25, amount: 259.8, base: 1039.2 }],
    category: "Sport & fritid",
    paymentMethod: "Kort",
    paymentLines: [CUSTOMER_CARD, "Kontaktlös  AID A0000000041010", "Ref 002126400  Godkänd"],
    receiptNumber: "2126-3-40012",
    registerLine: "Kassa 3   Kassör Elin",
    items: [
      {
        name: "ASICS Gel-Nimbus 26 W löparskor",
        quantity: 1,
        unitPrice: 1299,
        totalPrice: 1299,
        articleNumber: "1012B601-002",
        brand: "ASICS",
        model: "Gel-Nimbus 26",
        category: "Sport & fritid",
        extraLines: ["Stl 39  Black/Pure Silver"],
      },
    ],
    aiSummary: "ASICS Gel-Nimbus 26 löparskor (stl 39) från Stadium Farsta, 1 299 kr. Öppet köp 30 dagar på oanvänd vara.",
    aiConfidence: 0.94,
    warrantyMonths: null,
    warrantyNotes: "Ingen särskild garanti. Reklamationsrätt 3 år enligt konsumentköplagen.",
    returnDays: 30,
    tags: ["löparskor", "asics"],
    footer: ["Öppet köp 30 dagar – oanvänd vara med kvitto.", "Stadium Member: 1 299 poäng registrerade."],
  },
];

// -----------------------------------------------------------------------------
// Formatting helpers
// -----------------------------------------------------------------------------

/** 1243.5 → "1 243,50" (plain spaces so the OCR text stays simple). */
export function sek(value: number): string {
  const [int, frac] = Math.abs(value).toFixed(2).split(".");
  return `${value < 0 ? "-" : ""}${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")},${frac}`;
}

function qtyText(item: DemoItem): string {
  return item.unit === "kg" ? `${item.quantity.toFixed(3).replace(".", ",")} kg` : `${item.quantity} st`;
}

function esc(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Sum of the VAT lines → Receipt.vatAmount. */
export function vatTotal(r: DemoReceipt): number {
  return Math.round(r.vat.reduce((sum, v) => sum + v.amount, 0) * 100) / 100;
}

// -----------------------------------------------------------------------------
// Thermal receipt – line model → HTML / text
// -----------------------------------------------------------------------------

interface Line {
  text: string;
  right?: string;
  /** Space-separated CSS classes: logo center muted small bold rule blank barcode */
  cls?: string;
}

const TEXT_WIDTH = 42;

function thermalLines(r: DemoReceipt): Line[] {
  const m = r.merchant;
  const lines: Line[] = [
    { text: m.logo, cls: "logo" },
    { text: m.store ?? m.name, cls: "center" },
    { text: m.address, cls: "center muted" },
    { text: `${m.legalName}  Org.nr ${m.orgNumber}`, cls: "center muted" },
    { text: `Tel ${m.phone ?? ""}  ${m.web ?? ""}`.trim(), cls: "center muted" },
    { text: "", cls: "rule" },
    { text: `${r.purchaseDate} ${r.purchaseTime}`, right: `Kvitto ${r.receiptNumber}` },
  ];
  if (r.registerLine) lines.push({ text: r.registerLine, cls: "muted" });
  lines.push({ text: "", cls: "rule" });

  for (const item of r.items) {
    if (item.quantity === 1 && item.unit !== "kg") {
      lines.push({ text: item.name, right: sek(item.totalPrice) });
    } else {
      lines.push({ text: item.name });
      lines.push({ text: `  ${qtyText(item)} x ${sek(item.unitPrice)}`, right: sek(item.totalPrice), cls: "small" });
    }
    if (item.articleNumber) lines.push({ text: `  Art.nr ${item.articleNumber}`, cls: "small muted" });
    if (item.serialNumber) lines.push({ text: `  Serienr ${item.serialNumber}`, cls: "small muted" });
    for (const extra of item.extraLines ?? []) lines.push({ text: `  ${extra}`, cls: "small muted" });
  }

  lines.push({ text: "", cls: "rule" });
  lines.push({ text: "TOTALT SEK", right: sek(r.totalAmount), cls: "bold" });
  for (const v of r.vat) {
    lines.push({ text: `Moms ${v.rate} % (underlag ${sek(v.base)})`, right: sek(v.amount), cls: "small muted" });
  }
  lines.push({ text: "", cls: "blank" });
  r.paymentLines.forEach((p, i) => lines.push(i === 0 ? { text: p, right: sek(r.totalAmount) } : { text: `  ${p}`, cls: "small muted" }));
  lines.push({ text: "", cls: "rule" });
  for (const f of r.footer) lines.push({ text: f, cls: "center" });
  lines.push({ text: "", cls: "blank" });
  lines.push({ text: "Tack för ditt köp!", cls: "center bold" });
  lines.push({ text: `${m.web ?? m.legalName}`, cls: "center muted" });
  lines.push({ text: r.receiptNumber.replace(/\D/g, "").padEnd(12, "0"), cls: "barcode" });
  return lines;
}

function linesToText(lines: Line[]): string {
  return lines
    .map((l) => {
      if (l.cls?.includes("rule")) return "-".repeat(TEXT_WIDTH);
      if (l.cls?.includes("blank")) return "";
      if (l.cls?.includes("barcode")) return `||| ${l.text} |||`;
      if (l.right === undefined) return l.text;
      const gap = Math.max(2, TEXT_WIDTH - l.text.length - l.right.length);
      return `${l.text}${" ".repeat(gap)}${l.right}`;
    })
    .join("\n")
    .trim();
}

function linesToHtml(lines: Line[]): string {
  return lines
    .map((l) => {
      const cls = l.cls ?? "";
      if (cls.includes("rule")) return '<div class="rule"></div>';
      if (cls.includes("blank")) return '<div class="blank"></div>';
      if (cls.includes("barcode")) return `<div class="barcode"></div><div class="row center muted small">${esc(l.text)}</div>`;
      if (l.right !== undefined) return `<div class="row ${cls}"><span class="l">${esc(l.text)}</span><span class="r">${esc(l.right)}</span></div>`;
      return `<div class="row ${cls}"><span class="l">${esc(l.text)}</span></div>`;
    })
    .join("\n");
}

function thermalHtml(r: DemoReceipt): string {
  const tilt = r.source === "SCAN" ? "-0.9deg" : "0.4deg";
  const bg = r.source === "SCAN" ? "linear-gradient(160deg,#c9ccd1 0%,#dfe1e4 45%,#c3c6cb 100%)" : "linear-gradient(180deg,#e8e9eb,#d7d9dc)";
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>${esc(r.title)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body { min-height: 1400px; width: 800px; background: ${bg}; display: flex; align-items: center; justify-content: center; padding: 48px 0; }
  .paper { position: relative; width: 640px; padding: 44px 40px 40px; background: #fdfdfa; color: #1a1a1a;
    font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; font-size: 17px; line-height: 1.35;
    transform: rotate(${tilt}); box-shadow: 0 18px 40px rgba(0,0,0,.28), 0 2px 6px rgba(0,0,0,.12);
    clip-path: polygon(${zigzag()}); }
  .paper::after { content: ""; position: absolute; inset: 0; pointer-events: none;
    background: repeating-linear-gradient(0deg, rgba(0,0,0,.018) 0 2px, transparent 2px 5px); }
  .row { display: flex; justify-content: space-between; gap: 14px; }
  .row .l { white-space: pre-wrap; }
  .row .r { white-space: nowrap; }
  .logo { justify-content: center; font-size: 34px; font-weight: 700; letter-spacing: .06em; margin: 4px 0 6px; }
  .center { justify-content: center; text-align: center; }
  .muted { color: #4a4a4a; }
  .small { font-size: 15px; }
  .bold { font-weight: 700; font-size: 19px; }
  .rule { border-top: 2px dashed #7a7a7a; margin: 12px 0; }
  .blank { height: 14px; }
  .barcode { margin: 20px auto 6px; width: 70%; height: 58px;
    background: repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 8px, #111 8px 11px, transparent 11px 13px, #111 13px 14px, transparent 14px 17px); }
</style></head><body><div class="paper">
${linesToHtml(thermalLines(r))}
</div></body></html>`;
}

/** Torn top/bottom edge for the receipt paper. */
function zigzag(): string {
  const teeth = 32;
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= teeth; i++) {
    const x = ((i / teeth) * 100).toFixed(2);
    top.push(`${x}% ${i % 2 === 0 ? "0px" : "7px"}`);
    bottom.push(`${x}% ${i % 2 === 0 ? "100%" : "calc(100% - 7px)"}`);
  }
  return [...top, ...bottom.reverse()].join(", ");
}

// -----------------------------------------------------------------------------
// Invoice (A4 PDF)
// -----------------------------------------------------------------------------

function invoiceHtml(r: DemoReceipt): string {
  const inv = r.invoice;
  if (!inv) throw new Error(`Receipt ${r.key} has layout "invoice" but no invoice data.`);
  const m = r.merchant;
  const vat = r.vat[0];
  const rows = r.items
    .filter((item) => item.totalPrice >= 0)
    .map((item) => {
      const deductible = !inv.nonDeductibleItemNames.includes(item.name);
      const meta = [item.articleNumber ? `Art.nr ${item.articleNumber}` : null, item.serialNumber ? `S/N ${item.serialNumber}` : null].filter(Boolean).join(" · ");
      return `<tr><td>${esc(item.name)}${meta ? `<div class="meta">${esc(meta)}</div>` : ""}${deductible ? "" : '<div class="meta">Ingår ej i underlag för skattereduktion</div>'}</td><td class="num">${item.quantity} st</td><td class="num">${sek(item.unitPrice)}</td><td class="num">${sek(item.totalPrice)}</td></tr>`;
    })
    .join("\n");
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><title>Faktura ${esc(inv.number)}</title>
<style>
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body { margin: 0; font-family: "Liberation Sans", "DejaVu Sans", Arial, sans-serif; font-size: 10pt; color: #1b1b1b; }
  .page { padding: 14mm 16mm 12mm; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8mm; }
  .brand { font-size: 28pt; font-weight: 700; letter-spacing: .04em; color: #1c6f61; }
  .brand small { display: block; font-size: 9pt; font-weight: 400; letter-spacing: .18em; color: #555; margin-top: 2pt; }
  .addr { font-size: 9pt; color: #444; margin-top: 6pt; line-height: 1.4; }
  h1 { margin: 0 0 4pt; font-size: 20pt; text-align: right; }
  table.meta { border-collapse: collapse; font-size: 9.5pt; margin-left: auto; }
  table.meta td { padding: 1pt 0 1pt 14pt; }
  table.meta td:first-child { color: #666; }
  .parties { display: flex; gap: 40pt; margin-bottom: 6mm; font-size: 10pt; line-height: 1.4; }
  .parties h3 { margin: 0 0 3pt; font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: #666; }
  .intro { margin: 0 0 4mm; font-size: 10pt; }
  table.items { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  table.items th { text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: .08em; color: #666; border-bottom: 1.5pt solid #1c6f61; padding: 4pt 4pt; }
  table.items td { padding: 3.5pt 4pt; border-bottom: .5pt solid #ddd; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .meta { font-size: 8.5pt; color: #666; margin-top: 1pt; }
  table.totals { border-collapse: collapse; margin: 4mm 0 0 auto; font-size: 10pt; min-width: 300pt; }
  table.totals td { padding: 2pt 4pt; }
  table.totals td:first-child { color: #444; }
  table.totals tr.grand td { font-size: 13pt; font-weight: 700; border-top: 1.5pt solid #1c6f61; padding-top: 5pt; }
  .pay { margin-top: 5mm; padding: 8pt 11pt; background: #eef6f4; border-radius: 6pt; font-size: 9.5pt; line-height: 1.45; }
  .pay strong { color: #1c6f61; }
  .warranty { margin-top: 4mm; font-size: 9pt; line-height: 1.45; color: #333; }
  .warranty h3 { margin: 0 0 3pt; font-size: 9pt; text-transform: uppercase; letter-spacing: .1em; color: #666; }
  .foot { margin-top: 6mm; padding-top: 5pt; border-top: .5pt solid #bbb; font-size: 8pt; color: #666; line-height: 1.5; }
</style></head><body><div class="page">
  <div class="head">
    <div>
      <div class="brand">SOLKRAFT<small>SVERIGE AB</small></div>
      <div class="addr">${esc(m.address).replace(", ", "<br>")}<br>${esc(m.phone ?? "")} · ${esc(r.email?.from ?? "")}<br>${esc(m.web ?? "")}</div>
    </div>
    <div>
      <h1>FAKTURA</h1>
      <table class="meta">
        <tr><td>Fakturanummer</td><td><strong>${esc(inv.number)}</strong></td></tr>
        <tr><td>Fakturadatum</td><td>${esc(r.purchaseDate)}</td></tr>
        <tr><td>Förfallodatum</td><td>${esc(inv.dueDate)}</td></tr>
        <tr><td>Kundnummer</td><td>${esc(inv.customerNumber)}</td></tr>
        <tr><td>Er referens</td><td>${esc(inv.customer.name)}</td></tr>
        <tr><td>Vår referens</td><td>${esc(inv.ourReference)}</td></tr>
      </table>
    </div>
  </div>
  <div class="parties">
    <div><h3>Fakturamottagare</h3>${esc(inv.customer.name)}<br>${esc(inv.customer.address)}<br>${esc(inv.customer.postal)}<br>Personnr ${esc(inv.customer.personalNumberMasked)}</div>
    <div><h3>Anläggningsadress</h3>${esc(inv.customer.address)}<br>${esc(inv.customer.postal)}<br>Driftsatt ${esc(inv.installedOn)}</div>
  </div>
  <p class="intro"><strong>Solcellsanläggning 10,4 kWp</strong> – 26 st paneler à 400 W, växelriktare 10 kW, montage och installation enligt offert O-2025-0417.</p>
  <table class="items">
    <thead><tr><th>Beskrivning</th><th class="num">Antal</th><th class="num">À-pris inkl. moms</th><th class="num">Belopp inkl. moms</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <table class="totals">
    <tr><td>Summa exkl. moms</td><td class="num">${sek(vat.base)}</td></tr>
    <tr><td>Moms ${vat.rate} %</td><td class="num">${sek(vat.amount)}</td></tr>
    <tr><td>Summa inkl. moms</td><td class="num">${sek(vat.base + vat.amount)}</td></tr>
    <tr><td>Skattereduktion grön teknik ${inv.greenDeductionRate} % (underlag ${sek(inv.greenDeductionBase)})</td><td class="num">-${sek(inv.greenDeduction)}</td></tr>
    <tr class="grand"><td>Att betala</td><td class="num">${sek(r.totalAmount)} SEK</td></tr>
  </table>
  <div class="pay">
    <strong>Betalning:</strong> ${sek(r.totalAmount)} kr senast ${esc(inv.dueDate)} till bankgiro <strong>${esc(m.bankgiro ?? "")}</strong>. Ange OCR-nummer <strong>${esc(inv.ocrNumber)}</strong>.<br>
    Skattereduktionen för grön teknik (${inv.greenDeductionRate} % av kostnad för arbete och material) är avdragen på fakturan och begärs av Solkraft Sverige AB hos Skatteverket.
    Betalningsvillkor 30 dagar. Dröjsmålsränta enligt räntelagen.
  </div>
  <div class="warranty">
    <h3>Garantier</h3>
    ${esc(r.warrantyNotes ?? "")}. Garantierna gäller från driftsättningsdatum. Spara fakturan – den är ditt köpbevis och krävs vid garantiärenden. Reklamationsrätt 3 år enligt konsumenttjänstlagen/konsumentköplagen.
  </div>
  <div class="foot">${esc(m.legalName)} · Org.nr ${esc(m.orgNumber)} · Momsreg.nr ${esc(m.vatNumber ?? "")} · Godkänd för F-skatt · Bankgiro ${esc(m.bankgiro ?? "")}<br>Registrerat elinstallationsföretag hos Elsäkerhetsverket. Certifierad solcellsinstallatör (Svensk Solenergi).</div>
</div></body></html>`;
}

function invoiceText(r: DemoReceipt): string {
  const inv = r.invoice;
  if (!inv) throw new Error(`Receipt ${r.key} has layout "invoice" but no invoice data.`);
  const m = r.merchant;
  const vat = r.vat[0];
  const out: string[] = [
    `${m.legalName}`,
    `${m.address}`,
    `${m.phone ?? ""} · ${r.email?.from ?? ""} · ${m.web ?? ""}`,
    "",
    "FAKTURA",
    `Fakturanummer: ${inv.number}`,
    `Fakturadatum: ${r.purchaseDate}`,
    `Förfallodatum: ${inv.dueDate}`,
    `Kundnummer: ${inv.customerNumber}`,
    `Er referens: ${inv.customer.name}`,
    `Vår referens: ${inv.ourReference}`,
    "",
    `Fakturamottagare: ${inv.customer.name}, ${inv.customer.address}, ${inv.customer.postal}, personnr ${inv.customer.personalNumberMasked}`,
    `Anläggningsadress: ${inv.customer.address}, ${inv.customer.postal}. Driftsatt ${inv.installedOn}`,
    "",
    "Solcellsanläggning 10,4 kWp – 26 st paneler à 400 W, växelriktare 10 kW, montage och installation enligt offert O-2025-0417.",
    "",
    "Beskrivning | Antal | À-pris inkl. moms | Belopp inkl. moms",
  ];
  for (const item of r.items.filter((i) => i.totalPrice >= 0)) {
    const meta = [item.articleNumber ? `Art.nr ${item.articleNumber}` : null, item.serialNumber ? `S/N ${item.serialNumber}` : null].filter(Boolean).join(", ");
    out.push(`${item.name}${meta ? ` (${meta})` : ""} | ${item.quantity} st | ${sek(item.unitPrice)} | ${sek(item.totalPrice)}`);
    if (inv.nonDeductibleItemNames.includes(item.name)) out.push("  Ingår ej i underlag för skattereduktion");
  }
  out.push(
    "",
    `Summa exkl. moms: ${sek(vat.base)}`,
    `Moms ${vat.rate} %: ${sek(vat.amount)}`,
    `Summa inkl. moms: ${sek(vat.base + vat.amount)}`,
    `Skattereduktion grön teknik ${inv.greenDeductionRate} % (underlag ${sek(inv.greenDeductionBase)}): -${sek(inv.greenDeduction)}`,
    `ATT BETALA: ${sek(r.totalAmount)} SEK`,
    "",
    `Betalning: ${sek(r.totalAmount)} kr senast ${inv.dueDate} till bankgiro ${m.bankgiro ?? ""}. OCR-nummer ${inv.ocrNumber}.`,
    `Skattereduktionen för grön teknik (${inv.greenDeductionRate} % av kostnad för arbete och material) är avdragen på fakturan och begärs av ${m.legalName} hos Skatteverket. Betalningsvillkor 30 dagar.`,
    "",
    `Garantier: ${r.warrantyNotes ?? ""}. Garantierna gäller från driftsättningsdatum. Spara fakturan – den är ditt köpbevis.`,
    "",
    `${m.legalName} · Org.nr ${m.orgNumber} · Momsreg.nr ${m.vatNumber ?? ""} · Godkänd för F-skatt · Bankgiro ${m.bankgiro ?? ""}`,
  );
  return out.join("\n");
}

// -----------------------------------------------------------------------------
// E-mail receipt (HTML e-mail → stored as EMAIL_HTML and rendered to PNG)
// -----------------------------------------------------------------------------

function emailHtml(r: DemoReceipt): string {
  const m = r.merchant;
  const rows = r.items
    .map((item) => {
      const meta = [item.articleNumber ? `Art.nr ${item.articleNumber}` : null, item.serialNumber ? `Serienr ${item.serialNumber}` : null].filter(Boolean).join(" · ");
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid #e6e6e6;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;">
          <strong>${esc(item.name)}</strong>${meta ? `<div style="font-size:13px;color:#666;margin-top:3px;">${esc(meta)}</div>` : ""}
        </td>
        <td style="padding:14px 0;border-bottom:1px solid #e6e6e6;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;text-align:right;white-space:nowrap;">${item.quantity} st</td>
        <td style="padding:14px 0 14px 16px;border-bottom:1px solid #e6e6e6;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a;text-align:right;white-space:nowrap;">${sek(item.totalPrice)} kr</td>
      </tr>`;
    })
    .join("\n");
  const vat = r.vat[0];
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(r.email?.subject ?? r.title)}</title></head>
<body style="margin:0;padding:0;background:#f0f1f2;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f1f2;padding:32px 0;">
<tr><td align="center">
<table role="presentation" width="640" cellpadding="0" cellspacing="0" style="width:640px;max-width:100%;background:#ffffff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#0b8f4d;padding:26px 36px;font-family:Arial,Helvetica,sans-serif;font-size:30px;font-weight:bold;letter-spacing:.06em;color:#ffffff;">${esc(m.logo)}</td></tr>
  <tr><td style="padding:32px 36px 8px;font-family:Arial,Helvetica,sans-serif;">
    <h1 style="margin:0 0 10px;font-size:26px;color:#1a1a1a;">Tack för ditt köp, Anna!</h1>
    <p style="margin:0 0 18px;font-size:15px;line-height:1.5;color:#444;">Här är ditt e-kvitto från <strong>${esc(m.name)}</strong>. Spara det – kvittot gäller som köpbevis vid garanti, reklamation och öppet köp.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:14px;color:#444;line-height:1.6;">
      <tr><td style="padding-right:18px;color:#777;">Kvittonummer</td><td><strong>${esc(r.receiptNumber)}</strong></td></tr>
      <tr><td style="padding-right:18px;color:#777;">Datum</td><td>${esc(r.purchaseDate)} ${esc(r.purchaseTime)}</td></tr>
      <tr><td style="padding-right:18px;color:#777;">Butik</td><td>${esc(m.name)}, ${esc(m.address)}</td></tr>
      <tr><td style="padding-right:18px;color:#777;">Kassa</td><td>${esc(r.registerLine ?? "")}</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 36px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <th align="left" style="padding:0 0 8px;border-bottom:2px solid #0b8f4d;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;color:#666;text-transform:uppercase;">Produkt</th>
        <th align="right" style="padding:0 0 8px;border-bottom:2px solid #0b8f4d;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;color:#666;text-transform:uppercase;">Antal</th>
        <th align="right" style="padding:0 0 8px 16px;border-bottom:2px solid #0b8f4d;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:.08em;color:#666;text-transform:uppercase;">Pris</th>
      </tr>
      ${rows}
      <tr><td colspan="2" style="padding:14px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;">Varav moms ${vat.rate} %</td><td style="padding:14px 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#666;text-align:right;">${sek(vat.amount)} kr</td></tr>
      <tr><td colspan="2" style="padding:4px 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#1a1a1a;">Totalt</td><td style="padding:4px 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:bold;color:#1a1a1a;text-align:right;white-space:nowrap;">${sek(r.totalAmount)} kr</td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 36px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#444;">
    <strong>Betalning:</strong> ${esc(r.paymentLines.join(" · "))}<br>
    <strong>Leverans:</strong> Hemleverans 2024-11-08, kl 08–16. Gammal maskin bortforslas.
  </td></tr>
  <tr><td style="padding:12px 36px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef7f2;border-radius:8px;">
      <tr><td style="padding:16px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#1a3d2b;">
        <strong style="display:block;margin-bottom:4px;font-size:15px;">Garanti och öppet köp</strong>
        ${r.footer.map((f) => esc(f)).join("<br>")}<br>
        Reklamationsrätt 3 år enligt konsumentköplagen.
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:18px 36px 26px;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#777;">
    ${esc(m.legalName)} · Org.nr ${esc(m.orgNumber)} · ${esc(m.address)}<br>
    Kundservice ${esc(m.phone ?? "")} · ${esc(m.web ?? "")} · Detta är ett automatiskt utskick från ${esc(r.email?.from ?? "")}
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function emailText(r: DemoReceipt): string {
  const m = r.merchant;
  const vat = r.vat[0];
  const out: string[] = [
    `Från: ${r.email?.from ?? ""}`,
    `Ämne: ${r.email?.subject ?? ""}`,
    "",
    m.logo,
    "Tack för ditt köp, Anna!",
    `Här är ditt e-kvitto från ${m.name}. Spara det – kvittot gäller som köpbevis vid garanti, reklamation och öppet köp.`,
    "",
    `Kvittonummer: ${r.receiptNumber}`,
    `Datum: ${r.purchaseDate} ${r.purchaseTime}`,
    `Butik: ${m.name}, ${m.address}`,
    `Kassa: ${r.registerLine ?? ""}`,
    "",
  ];
  for (const item of r.items) {
    const meta = [item.articleNumber ? `Art.nr ${item.articleNumber}` : null, item.serialNumber ? `Serienr ${item.serialNumber}` : null].filter(Boolean).join(", ");
    out.push(`${item.name}${meta ? ` (${meta})` : ""}  ${item.quantity} st  ${sek(item.totalPrice)} kr`);
  }
  out.push(
    "",
    `Varav moms ${vat.rate} %: ${sek(vat.amount)} kr`,
    `Totalt: ${sek(r.totalAmount)} kr`,
    "",
    `Betalning: ${r.paymentLines.join(" · ")}`,
    "Leverans: Hemleverans 2024-11-08, kl 08–16. Gammal maskin bortforslas.",
    "",
    "Garanti och öppet köp",
    ...r.footer,
    "Reklamationsrätt 3 år enligt konsumentköplagen.",
    "",
    `${m.legalName} · Org.nr ${m.orgNumber} · ${m.address}`,
    `Kundservice ${m.phone ?? ""} · ${m.web ?? ""}`,
  );
  return out.join("\n");
}

// -----------------------------------------------------------------------------
// Public renderers
// -----------------------------------------------------------------------------

/** HTML document for the receipt – screenshot it (thermal/email) or print it to PDF (invoice). */
export function renderHtml(r: DemoReceipt): string {
  switch (r.layout) {
    case "thermal":
      return thermalHtml(r);
    case "invoice":
      return invoiceHtml(r);
    case "email":
      return emailHtml(r);
  }
}

/** Plain-text version of the receipt → Receipt.ocrText. */
export function renderText(r: DemoReceipt): string {
  switch (r.layout) {
    case "thermal":
      return linesToText(thermalLines(r));
    case "invoice":
      return invoiceText(r);
    case "email":
      return emailText(r);
  }
}
