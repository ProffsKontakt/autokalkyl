import { ArrowDown, ArrowRight, Mail } from "lucide-react";
import { inboundAddressFor } from "@/lib/brand";
import { Container } from "@/components/ui/container";
import { ScrollCheck } from "@/components/ui/checkmark";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { ChatSearchIllustration, EnvelopeFlowIllustration, LaptopReceiptIllustration, PhoneReceiptIllustration } from "@/components/marketing/illustrations";
import { SectionIntro } from "./section-intro";
import { SECTION_IDS } from "./ids";

const steps = [
  {
    title: "Mottagande",
    text: "Fota kvittot med mobilen, ladda upp en bild eller PDF – eller maila det till din egen kvittoadress. Orderbekräftelser fungerar lika bra.",
    points: ["Fota", "Ladda upp", "Maila"],
    Illustration: PhoneReceiptIllustration,
  },
  {
    title: "Arkivering",
    text: "AI:n läser av butik, datum, belopp, artikelnummer och garantitext. Kvittot sparas tryggt i sju år – sorterat och sökbart från första sekunden.",
    points: ["Butik & datum", "Belopp & artiklar", "Sparat i 7 år"],
    Illustration: LaptopReceiptIllustration,
  },
  {
    title: "Sökning",
    text: "Hitta rätt kvitto på sekunder – sök på butik, produkt eller belopp. Eller fråga assistenten och låt den leta åt dig.",
    points: ["Sök fritt", "Filtrera", "Fråga AI"],
    Illustration: ChatSearchIllustration,
  },
];

export function HowItWorks() {
  const exampleAddress = inboundAddressFor("kvitto-ab12cd34ef");

  return (
    <section id={SECTION_IDS.howItWorks} className="scroll-mt-20 bg-white py-16 sm:py-24">
      <Container>
        <SectionIntro
          eyebrow="Så funkar det"
          title="Tre steg. Sedan sköter det sig självt."
          lead="Du behöver inte sortera, döpa eller leta. Skicka in kvittot på det sätt som passar dig – resten gör vi."
        />

        <RevealGroup as="ol" className="mt-14 grid gap-12 md:grid-cols-3 md:gap-8" stagger={0.15} aria-label="Så funkar det, steg för steg">
          {steps.map(({ title, text, points, Illustration }, i) => (
            <RevealItem as="li" key={title} className="relative flex flex-col">
              <div className="relative rounded-2xl bg-ink-50 p-6 text-ink-800 ring-1 ring-ink-200/60 sm:p-8">
                <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-ink-900 text-sm font-bold text-white" aria-hidden>
                  {i + 1}
                </span>
                <Illustration className="mx-auto max-w-[220px]" fillClassName="fill-ink-50" delay={0.1 + i * 0.15} />
              </div>
              <div className="mt-6 flex items-start gap-3">
                <ScrollCheck size={30} delay={0.2 + i * 0.15} className="mt-0.5" />
                <div>
                  <h3 className="text-xl font-semibold text-ink-900">
                    <span className="sr-only">Steg {i + 1}: </span>
                    {title}
                  </h3>
                  <p className="mt-2 text-ink-600">{text}</p>
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={`Det ingår i ${title.toLowerCase()}`}>
                    {points.map((p) => (
                      <li key={p} className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {i < steps.length - 1 ? (
                <>
                  <ArrowRight className="absolute -right-7 top-[5.5rem] hidden h-6 w-6 text-ink-300 md:block" aria-hidden />
                  <ArrowDown className="mx-auto mt-8 h-6 w-6 text-ink-300 md:hidden" aria-hidden />
                </>
              ) : null}
            </RevealItem>
          ))}
        </RevealGroup>

        <Reveal className="mt-16 sm:mt-20">
          <div className="grid items-center gap-8 rounded-3xl border border-ink-200/70 bg-ink-50 p-6 sm:p-10 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div>
              <h3 className="text-2xl font-bold tracking-tight text-ink-900">Din egen kvittoadress</h3>
              <p className="mt-3 max-w-xl text-ink-600">
                Varje konto får en unik e-postadress. Vidarebefordra orderbekräftelser och digitala kvitton dit, så hamnar de i arkivet automatiskt – tolkade och sökbara som alla
                andra.
              </p>
              <p className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl bg-white px-4 py-2.5 font-mono text-sm text-ink-800 ring-1 ring-ink-200">
                <Mail className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span className="truncate">{exampleAddress}</span>
              </p>
              <p className="mt-2 text-xs text-ink-500">Exempel – du får din egen adress när du skapar konto.</p>
            </div>
            <EnvelopeFlowIllustration className="mx-auto w-full max-w-[300px] text-ink-800" fillClassName="fill-ink-50" />
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
