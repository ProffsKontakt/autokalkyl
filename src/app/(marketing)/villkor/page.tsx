import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { LegalArticle, LegalSummary, type LegalSection } from "../integritet/legal-article";

const UPDATED = "2026-09-06";

export const metadata: Metadata = {
  title: "Användarvillkor",
  description: `Villkoren för att använda ${brand.name}: vad tjänsten gör, ditt ansvar för kontot, hur AI-tolkning och assistenten fungerar, uppsägning, ändringar och tillämplig lag.`,
  alternates: { canonical: "/villkor" },
};

const sections: LegalSection[] = [
  { id: "tjansten", label: "Om tjänsten" },
  { id: "konto", label: "Konto och ansvar" },
  { id: "anvandning", label: "Tillåten användning" },
  { id: "ai", label: "AI-tolkning och kontroll av uppgifter" },
  { id: "assistenten", label: "Assistenten är vägledning, inte juridisk rådgivning" },
  { id: "innehall", label: "Ditt innehåll och våra rättigheter" },
  { id: "lagring", label: "Lagring, tillgänglighet och ansvar" },
  { id: "uppsagning", label: "Uppsägning och radering" },
  { id: "andringar", label: "Ändringar av villkoren" },
  { id: "lag", label: "Tillämplig lag och tvister" },
  { id: "kontakt", label: "Kontakt" },
];

export default function VillkorPage() {
  const supportLink = <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>;

  return (
    <LegalArticle
      eyebrow="Villkor"
      title="Användarvillkor"
      lead={`Det här är spelreglerna för ${brand.name}. Vi har försökt skriva dem så att de går att läsa utan jurist – men de gäller på riktigt, så läs gärna igenom dem innan du skapar ett konto.`}
      updated={UPDATED}
      sections={sections}
      related={{ href: "/integritet", label: "vår integritetspolicy" }}
    >
      <LegalSummary>
        <p>
          {brand.name} sparar och läser av dina kvitton med hjälp av AI. Du ansvarar för att kontrollera att tolkade uppgifter stämmer och för
          vad du gör med ditt konto. Assistentens svar är vägledning, inte juridisk rådgivning. Du kan när som helst exportera dina kvitton och
          radera kontot. Svensk lag gäller.
        </p>
      </LegalSummary>

      <h2 id="tjansten">1. Om tjänsten</h2>
      <p>
        <strong>{brand.name}</strong> ({brand.host}) är en digital tjänst där du kan spara kvitton genom att fotografera, ladda upp eller maila
        in dem. Tjänsten läser av kvittona med hjälp av AI, gör dem sökbara, håller koll på garantier och ångerrätt och erbjuder en assistent
        som hjälper dig att hitta rätt kvitto, leta upp garantivillkor och bruksanvisningar och reda ut problem med det du köpt.
      </p>
      <p>
        Genom att skapa ett konto ingår du ett avtal med {brand.name} och godkänner dessa villkor samt vår{" "}
        <Link href="/integritet">integritetspolicy</Link>, som beskriver hur vi behandlar dina personuppgifter.
      </p>
      <p>
        Tjänsten är i dag kostnadsfri för privatpersoner. Skulle vi införa avgifter meddelar vi dig i god tid, och du kan då välja att fortsätta
        eller avsluta kontot innan avgiften börjar gälla. Företagsversionen är under utveckling och erbjuds tills vidare bara via{" "}
        <Link href="/foretag">väntelistan</Link>.
      </p>

      <h2 id="konto">2. Konto och ansvar</h2>
      <ul>
        <li>Du måste vara minst 18 år för att skapa ett konto.</li>
        <li>Uppgifterna du lämnar vid registreringen ska vara riktiga, och du ska hålla dem uppdaterade.</li>
        <li>
          Kontot är personligt. Du ansvarar för att skydda ditt lösenord och för allt som görs med kontot. Välj ett lösenord du inte använder
          någon annanstans och kontakta oss omgående på {supportLink} om du misstänker att någon annan fått tillgång till kontot.
        </li>
        <li>
          Ditt konto har en personlig e-postadress för inkommande kvitton. Allt som skickas dit sparas som ett kvitto på ditt konto, så dela
          inte adressen offentligt.
        </li>
        <li>Du får inte skapa konton åt andra eller överlåta ditt konto utan vårt godkännande.</li>
      </ul>

      <h2 id="anvandning">3. Tillåten användning</h2>
      <p>Tjänsten är till för att hantera dina egna kvitton och inköp. Du får inte:</p>
      <ul>
        <li>ladda upp material som du inte har rätt att använda, eller uppgifter om andra personer som du saknar rätt att behandla,</li>
        <li>ladda upp skadlig kod eller innehåll som är olagligt, hotfullt eller kränkande,</li>
        <li>försöka kringgå säkerhetsfunktioner, komma åt andra användares data eller störa tjänstens drift,</li>
        <li>använda automatiserade verktyg för att skrapa, massanropa eller överbelasta tjänsten,</li>
        <li>använda assistenten för olagliga ändamål eller för att generera vilseledande underlag, eller</li>
        <li>kopiera, bygga om eller vidaresälja tjänsten.</li>
      </ul>
      <p>
        Vid missbruk kan vi stänga av eller avsluta kontot. Om det är möjligt och rimligt kontaktar vi dig först och ger dig chansen att
        exportera dina kvitton.
      </p>

      <h2 id="ai">4. AI-tolkning och kontroll av uppgifter</h2>
      <p>
        Kvittona läses av automatiskt med AI. Tekniken är bra men inte ofelbar: belopp, datum, moms, artikelnummer och garantitider kan bli fel,
        särskilt om bilden är suddig eller kvittot är skrynkligt. Därför gäller följande:
      </p>
      <ul>
        <li>
          <strong>Du ansvarar för att kontrollera att uppgifterna stämmer</strong> innan du använder dem – till exempel i en reklamation, en
          försäkringsanmälan, en deklaration eller din bokföring. Du kan enkelt rätta alla uppgifter i appen.
        </li>
        <li>
          Beräknade datum för garanti, reklamationsrätt och ångerrätt bygger på tolkade uppgifter och allmänna regler. De är ett stöd, inte en
          garanti för vad som gäller i ditt fall.
        </li>
        <li>
          Vi garanterar inte att en digital kopia av ett kvitto godtas av varje butik, försäkringsbolag eller myndighet. Behöver du
          originalkvittot av något skäl ansvarar du för att spara det.
        </li>
      </ul>

      <h2 id="assistenten">5. Assistenten är vägledning, inte juridisk rådgivning</h2>
      <p>
        Assistenten i chatten svarar utifrån dina kvitton, allmänt tillgänglig information på webben och en sammanfattning av svenska
        konsumentregler. Svaren är <strong>allmän vägledning</strong> och utgör inte juridisk, ekonomisk eller teknisk rådgivning. Vi lämnar inga
        garantier för att assistentens bedömningar är korrekta, fullständiga eller aktuella, och du ansvarar själv för de beslut du fattar
        utifrån dem.
      </p>
      <p>
        Behöver du hjälp i ett konkret ärende kan du vända dig till Konsumentverkets upplysningstjänst Hallå konsument, din kommunala
        konsumentvägledning eller Allmänna reklamationsnämnden (ARN). Webbsidor som assistenten hämtar information från tillhör andra parter, och
        vi ansvarar inte för deras innehåll.
      </p>

      <h2 id="innehall">6. Ditt innehåll och våra rättigheter</h2>
      <p>
        Dina kvitton, bilder, anteckningar och chattmeddelanden är dina. För att kunna leverera tjänsten ger du oss rätt att lagra, kopiera,
        tolka och bearbeta innehållet, inklusive att skicka det till vår AI-leverantör för tolkning – allt enligt integritetspolicyn. Rätten
        gäller bara så länge det behövs för tjänsten och upphör när du raderar innehållet eller ditt konto.
      </p>
      <p>
        Tjänsten, varumärket {brand.name}, koden, designen och allt innehåll som vi själva tagit fram tillhör oss. Du får använda tjänsten
        enligt dessa villkor men förvärvar inga andra rättigheter till den. Förslag och synpunkter som du skickar till oss får vi använda fritt
        för att förbättra tjänsten.
      </p>

      <h2 id="lagring">7. Lagring, tillgänglighet och ansvar</h2>
      <p>
        Vi lagrar dina kvitton i upp till sju år från inköpsdatum eller tills du raderar dem, och vi säkerhetskopierar regelbundet. Vi arbetar
        för att tjänsten alltid ska vara tillgänglig, men kan inte lova hundra procent drifttid – underhåll, uppdateringar och störningar hos
        våra leverantörer kan påverka tillgängligheten. Vi rekommenderar att du exporterar dina kvitton då och då.
      </p>
      <p>
        Tjänsten tillhandahålls i befintligt skick. I den utsträckning tvingande lag tillåter ansvarar vi inte för indirekta skador, utebliven
        vinst eller förluster som beror på felaktigt tolkade uppgifter, på att en digital kvittokopia inte godtas eller på omständigheter
        utanför vår kontroll. Vårt sammanlagda ansvar gentemot dig är begränsat till det belopp du betalat för tjänsten under de senaste tolv
        månaderna. Ingenting i dessa villkor begränsar de rättigheter du har som konsument enligt tvingande lag.
      </p>

      <h2 id="uppsagning">8. Uppsägning och radering</h2>
      <ul>
        <li>
          <strong>Du</strong> kan när som helst avsluta avtalet genom att radera ditt konto under Inställningar. Då tas kontot, alla kvitton och
          filer, chatthistoriken och händelseloggen bort enligt integritetspolicyn. Exportera det du vill behålla först – raderingen går inte att
          ångra.
        </li>
        <li>
          <strong>Vi</strong> kan stänga av eller avsluta ditt konto om du bryter mot dessa villkor, om det krävs enligt lag eller om vi lägger
          ner tjänsten. Lägger vi ner tjänsten meddelar vi dig minst 30 dagar i förväg så att du hinner exportera dina kvitton.
        </li>
      </ul>

      <h2 id="andringar">9. Ändringar av villkoren</h2>
      <p>
        Vi kan ändra villkoren när tjänsten utvecklas eller när lagen kräver det. Datumet högst upp visar när villkoren senast ändrades. Vid
        ändringar som är till nackdel för dig meddelar vi dig via e-post eller i appen minst 30 dagar innan de börjar gälla. Om du inte godtar
        ändringarna kan du avsluta kontot innan de träder i kraft. Fortsätter du använda tjänsten efter det gäller de nya villkoren.
      </p>

      <h2 id="lag">10. Tillämplig lag och tvister</h2>
      <p>
        Svensk lag gäller för dessa villkor och för din användning av tjänsten. Om vi hamnar i en tvist försöker vi i första hand lösa den
        tillsammans – hör av dig till {supportLink}.
      </p>
      <p>
        Är du konsument kan du vända dig till Allmänna reklamationsnämnden (ARN),{" "}
        <a href="https://www.arn.se" rel="noopener noreferrer" target="_blank">
          arn.se
        </a>
        , som prövar tvister mellan konsumenter och företag kostnadsfritt. I annat fall avgörs tvisten av svensk allmän domstol.
      </p>

      <h2 id="kontakt">11. Kontakt</h2>
      <p>
        Frågor om villkoren? Skriv till {supportLink}. Vi svarar så snart vi kan – och gärna på vanlig svenska.
      </p>
    </LegalArticle>
  );
}
