import Image from "next/image";
import { BookOpen, Camera, Clock, Receipt, Send, ShieldCheck, Sun, Wrench } from "lucide-react";
import { brand } from "@/lib/brand";
import { formatDate, formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { LogoMark } from "@/components/ui/logo";
import { ScrollCheck } from "@/components/ui/checkmark";
import { Reveal, RevealGroup, RevealItem } from "@/components/marketing/reveal";
import { SectionIntro } from "./section-intro";
import { SECTION_IDS } from "./ids";

const abilities = [
  "Hittar rätt kvitto och artikelnummer – även om du bara minns ungefär när du köpte saken",
  "Slår upp tillverkarens garantivillkor och bruksanvisning på webben",
  "Räknar ut hur länge garanti och reklamationsrätt gäller",
  "Ger dig konkreta steg och ett underlag att skicka till butiken",
];

const purchase = {
  merchant: "Elgiganten",
  date: "2024-03-12",
  item: "Diskmaskin, art.nr 812 345",
  amount: 6490,
  warrantyEnds: "2026-03-12",
  claimEnds: "2027-03-12",
};

export function WarrantyAssistant() {
  return (
    <section id={SECTION_IDS.warranties} className="scroll-mt-20 bg-ink-50 py-16 sm:py-24">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <SectionIntro
              align="left"
              eyebrow="Garantier & rättigheter"
              title="Din AI-assistent kan garantierna"
              lead={
                <>
                  Peka på ett kvitto eller skriv <em className="font-medium not-italic text-ink-800">”min tv visar det här”</em> och bifoga en bild. Assistenten hittar kvittot,
                  artikelnumret, tillverkarens garantivillkor och bruksanvisningen – och berättar exakt vad du ska göra.
                </>
              }
            />

            <RevealGroup as="ul" className="mt-8 space-y-4" stagger={0.12} aria-label="Det här gör assistenten">
              {abilities.map((text, i) => (
                <RevealItem as="li" key={text} className="flex items-start gap-3">
                  <ScrollCheck size={26} delay={i * 0.1} className="mt-0.5" />
                  <span className="text-ink-700">{text}</span>
                </RevealItem>
              ))}
            </RevealGroup>

            <Reveal delay={0.1} className="mt-10">
              <div className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink-200/70">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <Sun className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-semibold text-ink-900">Stora köp, långa villkor</h3>
                  <p className="mt-1 text-sm text-ink-600">
                    Solceller, värmepumpar och andra stora installationer har ofta garantier på 10–25 år. Villkoren sparas tillsammans med kvittot, så de finns kvar den dagen
                    du behöver dem.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <Reveal direction="left" className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink-100 shadow-card ring-1 ring-ink-900/5">
                <Image
                  src="/images/senior-table.jpg"
                  alt="En leende äldre kvinna sitter vid köksbordet med mobilen i handen, ett kvitto och en tv-fjärrkontroll framför sig."
                  fill
                  sizes="(min-width: 1024px) 44rem, 100vw"
                  className="object-cover object-[center_40%]"
                />
              </div>

              <div className="relative -mt-16 px-3 sm:-mt-24 sm:px-8">
                <MockChat />
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}

function MockChat() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-ink-200/70" role="figure" aria-label={`Exempel på en konversation med ${brand.name}-assistenten`}>
      <div className="flex items-center gap-2 border-b border-ink-100 px-4 py-3">
        <LogoMark size={22} className="text-ink-900" />
        <span className="text-sm font-semibold text-ink-900">{brand.name}-assistenten</span>
        <Badge tone="brand" className="ml-auto">
          AI
        </Badge>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="flex justify-end">
          <p className="max-w-[85%] rounded-2xl rounded-br-md bg-ink-900 px-4 py-2.5 text-sm text-white">Min diskmaskin har slutat värma vatten, den är från 2024.</p>
        </div>

        <div className="flex justify-start">
          <div className="max-w-[92%] space-y-3 rounded-2xl rounded-bl-md bg-ink-50 px-4 py-3 text-sm text-ink-800">
            <p>Jag hittade kvittot och har kollat villkoren:</p>

            <div className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-ink-200/70">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
                <Receipt className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink-900">
                  {purchase.merchant} · {formatDate(purchase.date)}
                </p>
                <p className="truncate text-xs text-ink-500">
                  {purchase.item} · {formatMoney(purchase.amount)}
                </p>
              </div>
            </div>

            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" aria-hidden />
                <span>
                  <strong className="font-semibold">Garanti 2 år</strong> från tillverkaren – gick ut {formatDate(purchase.warrantyEnds)}.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
                <span>
                  <strong className="font-semibold">Reklamationsrätt 3 år</strong> enligt konsumentköplagen – gäller till {formatDate(purchase.claimEnds)}.{" "}
                  <Badge tone="success" className="ml-1 align-middle">
                    Gäller
                  </Badge>
                </span>
              </li>
            </ul>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                Bruksanvisning (PDF)
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-brand-800 ring-1 ring-brand-200">
                <Wrench className="h-3.5 w-3.5" aria-hidden />
                Felsökning: värmeelement
              </span>
            </div>

            <div>
              <p className="font-semibold text-ink-900">Så gör du:</p>
              <ol className="mt-1.5 list-decimal space-y-1 pl-5 marker:font-semibold marker:text-brand-700">
                <li>Kör ett tomt program på högsta temperatur. Blir vattnet fortfarande kallt är det troligen värmeelementet.</li>
                <li>Kontakta Elgiganten skriftligt och hänvisa till kvittot – jag har tagit fram ett underlag åt dig.</li>
                <li>Butiken ska laga eller byta maskinen utan kostnad, eftersom felet visat sig inom tre år.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-ink-100 px-4 py-3" aria-hidden>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-500">
          <Camera className="h-4 w-4" />
        </span>
        <span className="flex h-9 flex-1 items-center rounded-lg bg-ink-50 px-3 text-sm text-ink-400 ring-1 ring-ink-200/70">Skriv ett meddelande …</span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Send className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}
