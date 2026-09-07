/**
 * Swedish consumer-rights facts used in system prompts. Keep short, factual and dated.
 * Sources: Konsumentköplagen (2022:260), Distansavtalslagen (2005:59), Konsumentverket/Hallå konsument.
 */
export const CONSUMER_RIGHTS_SV = `
Svenska konsumenträttigheter (privatperson som köpt av näringsidkare):
- Reklamationsrätt: 3 år från köpet enligt konsumentköplagen (2022:260). Fel som visar sig inom 2 år antas ha funnits vid köpet (omvänd bevisbörda). Reklamera inom skälig tid – inom 2 månader räknas alltid som i tid.
- Garanti: frivillig utfästelse från säljare/tillverkare som gäller utöver reklamationsrätten. Garantivillkor och garantitid framgår av kvitto, garantibevis eller tillverkarens webbplats. Under garantitiden är det säljaren som ska visa att felet inte omfattas.
- Ångerrätt: 14 dagar vid distansköp (e-handel, telefon) enligt distansavtalslagen. Gäller inte i fysisk butik.
- Öppet köp och bytesrätt: frivilligt, villkor bestäms av butiken och står ofta på kvittot.
- Kvittot är köpbeviset. Ett digitalt foto av kvittot, orderbekräftelse eller kontoutdrag duger normalt som bevis på köp.
- Vid tvist: kontakta säljaren skriftligt först, därefter kommunens konsumentvägledare, Hallå konsument (Konsumentverket) eller Allmänna reklamationsnämnden (ARN).
- Företag (näringsidkare som köpare) omfattas av köplagen, inte konsumentköplagen: reklamationstid 2 år och ingen omvänd bevisbörda.
`.trim();

export const RECEIPT_CATEGORIES = [
  "Elektronik",
  "Vitvaror",
  "Möbler & inredning",
  "Bygg & verktyg",
  "Kläder & skor",
  "Sport & fritid",
  "Mat & dryck",
  "Restaurang & café",
  "Resor & transport",
  "Bil & fordon",
  "Hem & trädgård",
  "Hälsa & skönhet",
  "Barn & leksaker",
  "Tjänster & hantverk",
  "Abonnemang & el",
  "Solceller & energi",
  "Övrigt",
] as const;

export type ReceiptCategory = (typeof RECEIPT_CATEGORIES)[number];
