import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/marketing/reveal";

export function FinalCta() {
  return (
    <section className="bg-white pb-16 sm:pb-24">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-ink-900 shadow-card">
            <Image
              src="/images/friends-balcony.jpg"
              alt="Tre vänner fikar på en balkong. En av dem håller upp sin mobil som visar en grön bock."
              fill
              sizes="(min-width: 1152px) 72rem, 100vw"
              className="object-cover object-[center_30%]"
            />
            <div aria-hidden className="absolute inset-0 bg-linear-to-t from-ink-950/85 via-ink-950/40 to-ink-950/5" />

            <div className="relative flex min-h-[26rem] flex-col justify-end p-6 sm:min-h-[32rem] sm:p-12">
              <h2 className="max-w-2xl text-balance text-3xl font-bold tracking-tight text-white sm:text-4xl">Nästa gång något går sönder har du kvittot.</h2>
              <p className="mt-4 max-w-xl text-pretty text-lg text-ink-200">Skapa konto på en minut. Ingen bindningstid, inget kort – bara dina kvitton, samlade på ett ställe.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/registrera" size="lg" className="bg-white text-ink-900 shadow-none hover:bg-ink-100">
                  Skapa konto gratis
                </ButtonLink>
                <ButtonLink href="/logga-in" variant="ghost" size="lg" className="text-white hover:bg-white/10">
                  Jag har redan ett konto
                </ButtonLink>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
