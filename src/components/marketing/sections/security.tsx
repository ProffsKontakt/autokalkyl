import { Archive, Download, FileCheck, Globe, KeyRound, ScrollText, ShieldCheck, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScrollCheck } from "@/components/ui/checkmark";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { ShieldArchiveIllustration } from "@/components/marketing/illustrations";
import { cn } from "@/lib/utils";
import { SectionIntro } from "./section-intro";
import { SECTION_IDS } from "./ids";

const facts: { icon: LucideIcon; title: string; text: string; badge?: string; wide?: boolean }[] = [
  {
    icon: FileCheck,
    title: "Rättslig giltighet i hela EU",
    text: "Sedan eIDAS-förordningen 2014 har elektroniska dokument och underskrifter rättslig giltighet i hela EU. Ett digitalt sparat kvitto duger som underlag vid reklamation, precis som papperskvittot.",
    wide: true,
  },
  {
    icon: Archive,
    title: "Sju års arkiv",
    text: "Bokföringslagen kräver att verifikationer sparas i sju år. Vi använder samma tidsgräns för dina kvitton – och du kan radera tidigare om du vill.",
  },
  {
    icon: ShieldCheck,
    title: "Enligt ISO 27001",
    text: "ISO 27001 är den internationella standarden för informationssäkerhet. Våra rutiner för åtkomst, kryptering och loggning utgår från den.",
  },
  {
    icon: KeyRound,
    title: "BankID-inloggning kommer",
    text: "BankID är Sveriges dominerande e-legitimation. Vi bygger inloggning med BankID – i dag loggar du in med e-post och lösenord.",
    badge: "Planerat",
  },
  {
    icon: Globe,
    title: "Krypterat inom EU",
    text: "Dina kvitton och bilder lagras krypterade på servrar inom EU och lämnar inte unionen.",
  },
  {
    icon: Download,
    title: "Exportera eller radera",
    text: "Ladda ner allt som CSV när du vill. Vill du sluta raderar du kontot själv – då försvinner allt.",
  },
  {
    wide: true,
    icon: ScrollText,
    title: "Spårbarhet",
    text: "Varje ändring loggas, så att du kan se vad som hänt med ett kvitto och när.",
  },
];

const features = ["Automatisk skanning (OCR)", "Metadata och sökbarhet", "Revisionslogg", "Export till bokföring (CSV)", "7 års arkiv", "Egen kvittoadress via e-post"];

export function Security() {
  return (
    <section id={SECTION_IDS.security} className="relative scroll-mt-20 overflow-hidden bg-ink-900 py-16 text-white sm:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_85%_0%,rgba(42,138,120,0.32),transparent_70%)]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(40%_40%_at_0%_100%,rgba(42,138,120,0.18),transparent_70%)]" />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <SectionIntro
              align="left"
              dark
              eyebrow="Säkerhet & lagring"
              title="Trygg digital kvittohantering"
              lead="Dina kvitton är dina. Vi lagrar dem krypterat inom EU, sparar dem så länge lagen kräver och låter dig ta med dig allt – eller radera det – när du vill."
            />
          </div>
          <Reveal direction="left" className="lg:col-span-5">
            <ShieldArchiveIllustration className="mx-auto w-full max-w-xs text-white" fillClassName="fill-ink-900" />
          </Reveal>
        </div>

        <RevealGroup as="ul" className="mt-14 grid gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-2 lg:grid-cols-3" stagger={0.07}>
          {facts.map(({ icon: Icon, title, text, badge, wide }) => (
            <RevealItem as="li" key={title} className={cn("bg-ink-900 p-6", wide && "lg:col-span-2")}>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-brand-300 ring-1 ring-white/10">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="font-semibold text-white">{title}</h3>
                {badge ? <span className="ml-auto rounded-full bg-brand-500/20 px-2.5 py-0.5 text-xs font-semibold text-brand-200">{badge}</span> : null}
              </div>
              <p className="mt-3 text-sm text-ink-300">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-10 sm:mt-14">
          <div className="rounded-3xl bg-white/5 p-6 ring-1 ring-white/10 sm:p-8">
            <h3 className="text-lg font-semibold text-white">Det här ingår</h3>
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Funktioner">
              {features.map((f, i) => (
                <li key={f} className="flex items-center gap-3 text-ink-100">
                  <ScrollCheck size={28} delay={i * 0.08} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
