import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/lib/brand";
import { LegalArticle, LegalSummary, type LegalSection } from "./legal-article";

const UPDATED = "2026-09-06";

export const metadata: Metadata = {
  title: "Integritetspolicy",
  description: `Så behandlar ${brand.name} dina personuppgifter: vad vi sparar, varför, hur länge, vilka vi delar uppgifter med och vilka rättigheter du har enligt GDPR.`,
  alternates: { canonical: "/integritet" },
};

const sections: LegalSection[] = [
  { id: "ansvarig", label: "Vem som ansvarar för dina uppgifter" },
  { id: "uppgifter", label: "Vilka uppgifter vi behandlar" },
  { id: "andamal", label: "Varför – och med vilken rättslig grund" },
  { id: "lagringstid", label: "Hur länge vi sparar uppgifterna" },
  { id: "ai", label: "Så använder vi AI" },
  { id: "underbitraden", label: "Vilka vi delar uppgifter med" },
  { id: "rattigheter", label: "Dina rättigheter" },
  { id: "cookies", label: "Cookies" },
  { id: "sakerhet", label: "Så skyddar vi dina uppgifter" },
  { id: "andringar", label: "Ändringar i policyn" },
  { id: "kontakt", label: "Kontakt" },
];

export default function IntegritetPage() {
  const supportLink = <a href={`mailto:${brand.supportEmail}`}>{brand.supportEmail}</a>;

  return (
    <LegalArticle
      eyebrow="Integritet"
      title="Integritetspolicy"
      lead={`Dina kvitton är dina. Här förklarar vi i klartext vilka personuppgifter ${brand.name} behandlar, varför vi gör det och hur du bestämmer över dem.`}
      updated={UPDATED}
      sections={sections}
      related={{ href: "/villkor", label: "våra användarvillkor" }}
    >
      <LegalSummary>
        <p>
          Vi sparar dina kvitton så att du kan hitta dem, och vi använder AI för att läsa av dem åt dig. Uppgifterna används bara för att
          leverera tjänsten. Vi säljer aldrig dina uppgifter, visar ingen reklam, spårar dig inte och tränar inga AI-modeller på dina kvitton.
          Du kan exportera eller radera allt när du vill.
        </p>
      </LegalSummary>

      <h2 id="ansvarig">1. Vem som ansvarar för dina uppgifter</h2>
      <p>
        <strong>{brand.name}</strong> ({brand.host}) är personuppgiftsansvarig för den behandling som beskrivs i den här policyn. Det betyder att vi
        bestämmer varför och hur dina personuppgifter behandlas, och att vi ansvarar för att det sker enligt EU:s dataskyddsförordning (GDPR)
        och svensk kompletterande lagstiftning.
      </p>
      <p>Har du frågor om hur vi hanterar dina uppgifter når du oss på {supportLink}.</p>

      <h2 id="uppgifter">2. Vilka uppgifter vi behandlar</h2>
      <p>Vi behandlar bara uppgifter som behövs för att tjänsten ska fungera. Det här är vad vi sparar:</p>
      <h3>Kontouppgifter</h3>
      <ul>
        <li>Namn, e-postadress och kontotyp (privat eller företag).</li>
        <li>
          Ditt lösenord – lagras enbart som en kryptografisk hash. Vi kan aldrig se ditt lösenord, bara kontrollera att det stämmer.
        </li>
        <li>Din personliga inkorgsadress för kvitton (den unika e-postadress du kan vidarebefordra kvitton till).</li>
        <li>Tidpunkt för när kontot skapades.</li>
      </ul>
      <h3>Kvitton och filer</h3>
      <ul>
        <li>Bilder, PDF:er och e-postmeddelanden med kvitton som du fotar, laddar upp eller mailar in, inklusive bifogade filer.</li>
        <li>För kvitton som mailas in sparar vi även avsändaradress och ämnesrad, så att du ser var kvittot kom ifrån.</li>
      </ul>
      <h3>Tolkad kvittodata</h3>
      <ul>
        <li>
          Det AI:n läser ut ur kvittot: butik, organisationsnummer, adress, inköpsdatum, belopp, moms, betalsätt, kvittonummer, varor med
          artikelnummer, märke, modell och serienummer, garantitid, ångerfrist och kategori.
        </li>
        <li>Den text som lästs ut ur bilden, en kort AI-sammanfattning samt hur säker tolkningen bedöms vara.</li>
        <li>Dina egna ändringar, anteckningar och etiketter.</li>
      </ul>
      <h3>Chatthistorik</h3>
      <ul>
        <li>Frågorna du ställer till assistenten, assistentens svar och de bilder du bifogar i chatten (till exempel ett foto på en felkod).</li>
        <li>Vilka kvitton en konversation gäller och vilka webbkällor assistenten hämtat information från.</li>
      </ul>
      <h3>Loggar och tekniska uppgifter</h3>
      <ul>
        <li>
          En händelselogg för ditt konto med viktiga händelser – till exempel inloggning, uppladdning, ändring och radering av kvitton – med
          tidpunkt. Den finns till för din egen insyn och för att kunna utreda missbruk.
        </li>
        <li>
          IP-adress, som används tillfälligt för att begränsa antalet försök (till exempel inloggningar och uppladdningar) och skydda mot
          angrepp. Den lagras bara i serverns arbetsminne under kort tid.
        </li>
        <li>Tekniska serverloggar som används för felsökning och som sparas under en kort period.</li>
      </ul>
      <h3>Väntelista för företag</h3>
      <ul>
        <li>Om du anmäler intresse för företagsversionen sparar vi namn, e-postadress och i förekommande fall företagsnamn och meddelande.</li>
      </ul>
      <p>
        Ett kvitto kan ibland innehålla uppgifter om andra personer, till exempel namnet på en butiksanställd. Sådana uppgifter behandlar vi bara
        som en del av ditt kvitto och använder dem inte för något annat.
      </p>

      <h2 id="andamal">3. Varför – och med vilken rättslig grund</h2>
      <p>All behandling har ett tydligt syfte och stöd i GDPR. Så här hänger det ihop:</p>
      <ul>
        <li>
          <strong>Att leverera tjänsten</strong> – spara, tolka, söka i och exportera dina kvitton, hålla koll på garantier och ångerrätt samt
          svara i chatten. Rättslig grund: fullgörande av avtalet med dig (artikel 6.1 b GDPR).
        </li>
        <li>
          <strong>Att skicka nödvändiga meddelanden</strong> – till exempel länk för att återställa lösenordet eller information om viktiga
          ändringar i tjänsten. Rättslig grund: fullgörande av avtalet (artikel 6.1 b).
        </li>
        <li>
          <strong>Säkerhet och missbruksskydd</strong> – begränsa antalet försök, upptäcka angrepp, felsöka och föra händelselogg. Rättslig
          grund: vårt berättigade intresse av en säker och stabil tjänst (artikel 6.1 f).
        </li>
        <li>
          <strong>Att förbättra tjänsten</strong> – vi kan följa upp avidentifierad statistik, till exempel hur ofta kvitton behöver rättas
          manuellt. Rättslig grund: berättigat intresse (artikel 6.1 f). Sådan statistik går aldrig att koppla till dig.
        </li>
        <li>
          <strong>Att uppfylla lagkrav</strong> – till exempel att svara på en lagstadgad begäran från en myndighet. Rättslig grund: rättslig
          förpliktelse (artikel 6.1 c).
        </li>
        <li>
          <strong>Väntelistan</strong> – för att kontakta dig när företagsversionen är klar. Rättslig grund: åtgärder på din begäran innan ett
          avtal ingås samt vårt berättigade intresse av att kunna svara dig (artikel 6.1 b och f).
        </li>
      </ul>
      <p>
        Vi använder inte dina uppgifter för marknadsföring från andra företag, profilering eller reklam, och vi fattar inga automatiserade
        beslut som har rättsliga följder för dig.
      </p>

      <h2 id="lagringstid">4. Hur länge vi sparar uppgifterna</h2>
      <ul>
        <li>
          <strong>Kvitton och tolkad kvittodata</strong> sparas i upp till sju år från inköpsdatum – lika länge som bokföringslagen kräver för
          verifikationer och gott och väl hela reklamationstiden – eller tills du själv raderar kvittot. Ett kvitto du raderar hamnar först i
          papperskorgen så att du kan ångra dig; därifrån kan du ta bort det permanent när som helst.
        </li>
        <li>
          <strong>Kontouppgifter</strong> sparas tills du raderar ditt konto. När du raderar kontot tas kontot, alla kvitton och filer, all
          chatthistorik och händelseloggen bort. Kopior i våra säkerhetskopior skrivs över löpande inom kort tid därefter.
        </li>
        <li>
          <strong>Chatthistorik</strong> sparas tills du raderar konversationen eller ditt konto.
        </li>
        <li>
          <strong>Händelseloggen</strong> sparas så länge kontot finns.
        </li>
        <li>
          <strong>IP-adresser</strong> för missbruksskydd sparas bara tillfälligt i arbetsminnet, som längst några timmar.
        </li>
        <li>
          <strong>Väntelistan</strong> sparas tills företagsversionen har lanserats och vi har kontaktat dig, eller tills du ber oss ta bort dig.
        </li>
      </ul>

      <h2 id="ai">5. Så använder vi AI</h2>
      <p>
        {brand.name} använder AI-modeller från <strong>Anthropic</strong> (Claude) för två saker: att läsa av kvitton och att driva assistenten
        i chatten.
      </p>
      <ul>
        <li>
          <strong>Kvittotolkning.</strong> När du laddar upp ett kvitto skickas bilden eller PDF:en till Anthropics API, som läser ut butik,
          belopp, varor och annan information. Resultatet sparas hos oss så att du kan söka och rätta det.
        </li>
        <li>
          <strong>Assistenten.</strong> När du chattar skickas din fråga, relevanta kvitton och de bilder du bifogar till Anthropic för att ta
          fram ett svar. Assistenten kan söka på webben efter till exempel garantivillkor och bruksanvisningar. Då skickas en sökfråga (till
          exempel produktens namn och modell) – aldrig hela kvittot eller dina kontouppgifter.
        </li>
      </ul>
      <p>
        Vi har databehandlingsavtal med Anthropic. Anthropic använder <strong>inte</strong> dina uppgifter för att träna sina modeller och sparar
        dem bara under en begränsad tid för säkerhetsändamål. Vi tränar inte heller några egna modeller på dina kvitton.
      </p>
      <p>
        AI-tolkningar kan innehålla fel. Kontrollera alltid belopp, datum och andra uppgifter som är viktiga för dig – du kan enkelt rätta dem i
        appen. Assistentens svar är vägledning, inte juridisk rådgivning. Läs mer i <Link href="/villkor">användarvillkoren</Link>.
      </p>

      <h2 id="underbitraden">6. Vilka vi delar uppgifter med</h2>
      <p>
        Vi säljer aldrig dina uppgifter och delar dem inte med andra företag för deras egna ändamål. För att driva tjänsten anlitar vi ett
        litet antal leverantörer (personuppgiftsbiträden) som behandlar uppgifter för vår räkning och enligt våra instruktioner:
      </p>
      <ul>
        <li>
          <strong>Databas- och driftleverantörer</strong> som kör tjänsten och lagrar din data. Servrar och databaser finns inom EU/EES.
        </li>
        <li>
          <strong>Anthropic</strong> för AI-tolkning och assistenten, enligt avsnitt 5. Anthropic har säte i USA. Överföringen skyddas av ett
          databehandlingsavtal och EU-kommissionens standardavtalsklausuler, och Anthropic använder inte dina uppgifter för att träna sina
          modeller.
        </li>
        <li>
          <strong>E-postleverantör</strong> för att skicka systemmeddelanden (till exempel återställning av lösenord) och för att ta emot kvitton
          som du mailar till din inkorgsadress.
        </li>
      </ul>
      <p>
        Vi kan också lämna ut uppgifter om vi är skyldiga att göra det enligt lag eller myndighetsbeslut. Vill du ha en aktuell lista över våra
        leverantörer är det bara att mejla {supportLink}.
      </p>

      <h2 id="rattigheter">7. Dina rättigheter</h2>
      <p>Enligt GDPR har du en rad rättigheter. De flesta kan du utöva direkt i appen, resten hjälper vi dig med:</p>
      <ul>
        <li>
          <strong>Tillgång.</strong> Du har rätt att få veta vilka uppgifter vi har om dig. Allt vi sparar syns i appen, och du kan begära ett
          registerutdrag via {supportLink}.
        </li>
        <li>
          <strong>Rättelse.</strong> Du kan själv ändra ditt namn under Inställningar och rätta alla uppgifter på ett kvitto.
        </li>
        <li>
          <strong>Radering.</strong> Du kan radera enskilda kvitton, konversationer eller hela ditt konto under Inställningar – när som helst,
          utan att fråga oss.
        </li>
        <li>
          <strong>Dataportabilitet.</strong> Du kan exportera dina kvitton som en CSV-fil direkt i appen och ladda ner varje kvittobild eller
          PDF i originalformat.
        </li>
        <li>
          <strong>Begränsning och invändning.</strong> Du har rätt att begära att vi begränsar behandlingen eller invända mot behandling som
          stöder sig på berättigat intresse. Mejla {supportLink} så tar vi ställning skyndsamt.
        </li>
        <li>
          <strong>Klagomål.</strong> Om du anser att vi behandlar dina uppgifter felaktigt kan du klaga hos Integritetsskyddsmyndigheten (IMY),{" "}
          <a href="https://www.imy.se" rel="noopener noreferrer" target="_blank">
            imy.se
          </a>
          . Vi uppskattar om du hör av dig till oss först så att vi får chansen att rätta till det.
        </li>
      </ul>
      <p>Vi svarar på förfrågningar om dina rättigheter utan onödigt dröjsmål och senast inom en månad.</p>

      <h2 id="cookies">8. Cookies</h2>
      <p>
        {brand.name} använder <strong>endast nödvändiga cookies</strong>: en sessionscookie som håller dig inloggad (gäller i högst 30 dagar eller
        tills du loggar ut) och en cookie som skyddar formulär mot förfalskade anrop. Vi använder inga analys-, reklam- eller
        spårningscookies och inga cookies från tredje part. Eftersom nödvändiga cookies inte kräver samtycke visar vi ingen cookiebanner.
      </p>

      <h2 id="sakerhet">9. Så skyddar vi dina uppgifter</h2>
      <ul>
        <li>All trafik mellan din enhet och {brand.name} är krypterad (HTTPS/TLS).</li>
        <li>Lösenord lagras med en beprövad, saltad hashfunktion (bcrypt) – aldrig i klartext.</li>
        <li>
          Kvittobilder och filer lagras i vår databas inom EU/EES och kan bara hämtas av det konto som äger dem. Varje åtkomst kontrolleras mot
          din inloggning.
        </li>
        <li>Antalet inloggningsförsök, uppladdningar och anrop är begränsat för att förhindra angrepp och missbruk.</li>
        <li>Tjänsten skickar säkerhetsrubriker till webbläsaren som försvårar klickkapning och inbäddning på andra webbplatser.</li>
        <li>Endast ett fåtal personer med behov har åtkomst till produktionsmiljön.</li>
        <li>Data säkerhetskopieras regelbundet så att dina kvitton finns kvar även om något går fel.</li>
      </ul>
      <p>
        Om en personuppgiftsincident skulle inträffa som medför risk för dig informerar vi dig och Integritetsskyddsmyndigheten enligt GDPR:s
        regler.
      </p>

      <h2 id="andringar">10. Ändringar i policyn</h2>
      <p>
        Vi kan behöva uppdatera den här policyn när tjänsten utvecklas eller lagstiftningen ändras. Datumet högst upp visar alltid när den senast
        ändrades. Vid större ändringar – till exempel nya ändamål eller nya leverantörer utanför EU/EES – meddelar vi dig via e-post eller i
        appen i god tid innan ändringen börjar gälla.
      </p>

      <h2 id="kontakt">11. Kontakt</h2>
      <p>
        Frågor, funderingar eller en begäran om att utöva dina rättigheter? Skriv till {supportLink} så hör vi av oss. Skriv gärna från den
        e-postadress som är kopplad till ditt konto, så kan vi hjälpa dig snabbare.
      </p>
    </LegalArticle>
  );
}
