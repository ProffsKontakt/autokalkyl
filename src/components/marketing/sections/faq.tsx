import { ChevronDown } from "lucide-react";
import { brand } from "@/lib/brand";
import { Container } from "@/components/ui/container";
import { RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { SectionIntro } from "./section-intro";
import { SECTION_IDS } from "./ids";

const faqs: { q: string; a: string }[] = [
  {
    q: "Är det gratis?",
    a: `Ja. För privatpersoner är ${brand.name} gratis just nu. Företagskonton är på väg och kommer att kosta – ställ dig på väntelistan om du är nyfiken.`,
  },
  {
    q: "Vad händer om AI:n läser fel?",
    a: "Du kan rätta allt själv: butik, datum, belopp, artiklar och garantitid. Kvitton som AI:n är osäker på markeras, så att du kan titta en extra gång.",
  },
  {
    q: "Kan jag maila in kvitton?",
    a: "Ja. Varje konto får en egen kvittoadress. Vidarebefordra orderbekräftelser och digitala kvitton dit, så tolkas och sparas de automatiskt.",
  },
  {
    q: "Hur länge sparas kvittona?",
    a: "I sju år – samma tid som bokföringslagen kräver för verifikationer. Du kan radera enskilda kvitton, eller hela kontot, när du vill.",
  },
  {
    q: "Är mina kvitton privata?",
    a: "Ja. Bara du kan se dina kvitton. Vi säljer ingen data, visar ingen reklam och delar inget med butiker eller andra företag.",
  },
  {
    q: "Fungerar det på mobilen?",
    a: `Ja, det är byggt för mobilen. Öppna ${brand.host} i webbläsaren och välj ”Lägg till på hemskärmen”, så fungerar det som en app – med kameran direkt.`,
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

export function Faq() {
  return (
    <section id={SECTION_IDS.faq} className="scroll-mt-20 bg-ink-50 py-16 sm:py-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Container className="max-w-3xl">
        <SectionIntro eyebrow="Vanliga frågor" title="Bra att veta innan du börjar" />

        <RevealGroup className="mt-10 space-y-3" stagger={0.06}>
          {faqs.map(({ q, a }) => (
            <RevealItem key={q}>
              <details className="group rounded-2xl border border-ink-200/70 bg-white shadow-soft open:border-brand-200">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left font-semibold text-ink-900 [&::-webkit-details-marker]:hidden">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-ink-400 transition-transform duration-200 group-open:rotate-180" aria-hidden />
                </summary>
                <p className="px-5 pb-5 text-ink-600">{a}</p>
              </details>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
