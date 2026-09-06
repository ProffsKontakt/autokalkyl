import { ArrowRight, Building2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/marketing/reveal";
import { SECTION_IDS } from "./ids";

export function BusinessTeaser() {
  return (
    <section id={SECTION_IDS.business} className="scroll-mt-20 bg-white py-16 sm:py-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-700 px-6 py-10 text-white shadow-card sm:px-12 sm:py-14">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-brand-500/50 blur-3xl" />
            <div aria-hidden className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-brand-900/60 blur-3xl" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-200">
                  <Building2 className="h-4 w-4" aria-hidden />
                  För företag
                </span>
                <h2 className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">Företagskonton som pratar med bokföringen</h2>
                <p className="mt-4 max-w-2xl text-pretty text-lg text-brand-100">
                  Kvitton från hela teamet på ett ställe, med koppling till bokföringssystemet, attest och export per kostnadsställe. Vi bygger det nu – ställ dig på
                  väntelistan så hör vi av oss först.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <ButtonLink href="/foretag" size="lg" className="bg-white text-brand-800 shadow-none hover:bg-brand-50">
                  Gå med i väntelistan
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
                <ButtonLink href="/foretag" variant="ghost" size="lg" className="text-white hover:bg-white/10">
                  Läs mer om företagskonton
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
