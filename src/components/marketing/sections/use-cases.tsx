import Image from "next/image";
import { FileSpreadsheet, Hammer, PackageX, ShoppingBasket, Sun, Tv, type LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { ScrollCheck } from "@/components/ui/checkmark";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { SectionIntro } from "./section-intro";
import { SECTION_IDS } from "./ids";

const cases: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Tv,
    title: "Elektronik & vitvaror",
    text: "Tv, dator, tvättmaskin. Garantitiden räknas ut automatiskt och du får veta hur länge reklamationsrätten gäller.",
  },
  {
    icon: Sun,
    title: "Solceller & värmepumpar",
    text: "Stora installationer med garantier på 10–25 år. Villkoren sparas bredvid kvittot så att de finns kvar om tio år.",
  },
  {
    icon: Hammer,
    title: "Byggvaror & hantverkare",
    text: "Håll ihop kvitton och kvittenser från renoveringen – bra att ha för ROT-avdraget och den dagen huset ska säljas.",
  },
  {
    icon: ShoppingBasket,
    title: "Vardagsinköp",
    text: "Mat, kläder, apotek. Se vad pengarna går till per månad och kategori, utan att göra något extra.",
  },
  {
    icon: PackageX,
    title: "Reklamation & retur",
    text: "Kvittot är ditt bevis. Visa det i butiken direkt från mobilen, eller skicka det som PDF till kundtjänst.",
  },
  {
    icon: FileSpreadsheet,
    title: "Bokföring",
    text: "Exportera valda kvitton som CSV med belopp, moms och datum – till dig själv eller din redovisningsbyrå.",
  },
];

const photos = [
  {
    src: "/images/couple-sofa.jpg",
    alt: "Ett par sitter i soffan och tittar på mobilen. På bordet ligger kvitton och en kartong till en espressomaskin.",
    caption: "Espressomaskinen krånglar efter ett år? Kvittot och garantin finns i appen – inte i en byrålåda.",
    position: "object-[center_45%]",
  },
  {
    src: "/images/store-family.jpg",
    alt: "En pappa fotograferar ett kvitto med mobilen i en elektronikbutik medan hans dotter skrattar och håller i en kartong.",
    caption: "Fota kvittot redan i butiken. Det är arkiverat innan ni hunnit hem.",
    position: "object-[center_35%]",
  },
];

export function UseCases() {
  return (
    <section id={SECTION_IDS.useCases} className="scroll-mt-20 bg-white py-16 sm:py-24">
      <Container>
        <SectionIntro eyebrow="Användningsområden" title="När kvittot plötsligt blir viktigt" lead="De flesta kvitton behövs aldrig. Men när ett behövs, behövs det på riktigt." />

        <RevealGroup as="ul" className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6" stagger={0.08}>
          {cases.map(({ icon: Icon, title, text }) => (
            <RevealItem as="li" key={title} className="group rounded-2xl border border-ink-200/70 bg-white p-6 shadow-soft transition-colors hover:border-brand-200">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-50 text-ink-800 transition-colors group-hover:bg-brand-50 group-hover:text-brand-700">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink-900">{title}</h3>
              <p className="mt-2 text-sm text-ink-600">{text}</p>
            </RevealItem>
          ))}
        </RevealGroup>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {photos.map((photo, i) => (
            <Reveal key={photo.src} delay={i * 0.12} as="figure" className="relative overflow-hidden rounded-3xl bg-ink-100 shadow-card ring-1 ring-ink-900/5">
              <Image src={photo.src} alt={photo.alt} width={1600} height={1195} sizes="(min-width: 768px) 36rem, 100vw" className={`aspect-[4/3] h-auto w-full object-cover ${photo.position}`} />
              <figcaption className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-white/95 p-4 text-sm text-ink-800 shadow-card ring-1 ring-ink-200/70 backdrop-blur sm:inset-x-6 sm:bottom-6">
                <ScrollCheck size={28} delay={0.2 + i * 0.1} />
                <span>{photo.caption}</span>
              </figcaption>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
