import type { Metadata } from "next";
import { Badge, ButtonLink, Card, CardContent, Container, ScrollCheck } from "@/components/ui";
import { brand } from "@/lib/brand";
import { WaitlistForm } from "./waitlist-form";

export const metadata: Metadata = {
  title: "För företag – kommer snart",
  description: `Företagsversionen av ${brand.name} kopplar kvitton direkt till bokföringen i Fortnox, Visma, Bokio och fler. Ställ dig i kön så hör vi av oss när den är klar.`,
  robots: { index: true, follow: true },
  alternates: { canonical: "/foretag" },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Picks the first value of a search param and trims it to a sane length for prefilling. */
function firstParam(value: string | string[] | undefined): string {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === "string" ? single.trim().slice(0, 200) : "";
}

const integrations = ["Fortnox", "Visma eEkonomi", "Bokio", "Fler på gång"];

const upcoming = [
  {
    title: "Kvittot rakt in i bokföringen",
    text: "Fota, ladda upp eller maila kvittot – underlaget hamnar hos redovisningen med belopp, moms och leverantör redan ifyllt.",
  },
  {
    title: "Verifikationer som håller för Skatteverket",
    text: "Kvitton sparas i sju år enligt bokföringslagen, är sökbara och går att exportera när revisorn frågar.",
  },
  {
    title: "Hela teamet på samma ställe",
    text: "Flera användare per företag, en gemensam kvittoinkorg och koll på vem som köpt vad.",
  },
];

export default async function ForetagPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialName = firstParam(params.name);
  const initialEmail = firstParam(params.email);
  const fromRegistration = initialEmail.length > 0;

  return (
    <>
      <section className="bg-paper">
        <Container className="grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16">
          <div className="animate-fade-up">
            <p
              role="img"
              aria-label="404"
              className="flex items-center gap-2 text-[5.5rem] font-black leading-none tracking-tighter text-ink-900 sm:text-[8rem]"
            >
              <span aria-hidden>4</span>
              <span aria-hidden className="inline-flex h-[0.8em] w-[0.8em] items-center justify-center rounded-full bg-brand-600 shadow-soft">
                <svg
                  viewBox="0 0 64 64"
                  className="h-[52%] w-[52%]"
                  fill="none"
                  stroke="white"
                  strokeWidth={8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 34 L26 46 L50 20" />
                </svg>
              </span>
              <span aria-hidden>4</span>
            </p>

            <Badge tone="brand" className="mt-5">
              Inte klart än
            </Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Företagsversionen är inte klar än</h1>
            <p className="mt-4 max-w-xl text-lg text-ink-600">
              Just nu är {brand.name} byggt för privatpersoner. Företagsversionen kopplar kvittona direkt till ditt bokföringssystem – Fortnox,
              Visma, Bokio och fler – så att varje kvitto blir ett färdigt underlag utan att någon behöver skriva av det. Vi bygger för fullt.
            </p>

            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Planerade integrationer">
              {integrations.map((name) => (
                <li key={name} className="rounded-full border border-ink-200 bg-white px-3.5 py-1.5 text-sm font-medium text-ink-700">
                  {name}
                </li>
              ))}
            </ul>

            <h2 className="mt-12 text-sm font-semibold uppercase tracking-widest text-brand-700">Det här jobbar vi på</h2>
            <ul className="mt-4 space-y-6">
              {upcoming.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <ScrollCheck size={36} delay={index * 0.12} className="mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-ink-900">{item.title}</h3>
                    <p className="mt-1 text-sm text-ink-600">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <Card className="lg:sticky lg:top-24">
            <CardContent>
              <WaitlistForm initialName={initialName} initialEmail={initialEmail} fromRegistration={fromRegistration} />
            </CardContent>
          </Card>
        </Container>
      </section>

      <section className="border-t border-ink-200/70 bg-white">
        <Container className="flex flex-col items-center gap-4 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="font-semibold text-ink-900">Är du privatperson?</h2>
            <p className="mt-1 text-sm text-ink-600">Då kan du börja spara kvitton med {brand.name} redan i dag – helt gratis.</p>
          </div>
          <ButtonLink href="/registrera" variant="outline">
            Kom igång gratis
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
