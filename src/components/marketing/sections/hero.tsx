import Image from "next/image";
import { Archive, EyeOff, Globe } from "lucide-react";
import { brand } from "@/lib/brand";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { HeroFloatingCards } from "./hero-floating-cards";
import { WatchFilmButton } from "./watch-film-button";

const trust = [
  { icon: Archive, label: "Sparas i 7 år" },
  { icon: Globe, label: "Servrar inom EU" },
  { icon: EyeOff, label: "Ingen reklam" },
];

/** Splits "Alla dina kvitton. Alltid till hands." into two lines for emphasis. */
function splitTagline(tagline: string): [string, string | null] {
  const idx = tagline.indexOf(". ");
  if (idx === -1) return [tagline, null];
  return [tagline.slice(0, idx + 1), tagline.slice(idx + 2)];
}

export function Hero() {
  const [first, second] = splitTagline(brand.tagline);

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="bg-paper absolute inset-0 opacity-70" aria-hidden />
      <div className="absolute -top-48 right-[-10%] h-[36rem] w-[36rem] rounded-full bg-brand-100/70 blur-3xl" aria-hidden />
      <div className="absolute -bottom-40 left-[-15%] h-[28rem] w-[28rem] rounded-full bg-brand-50 blur-3xl" aria-hidden />

      <Container className="relative grid items-center gap-14 py-16 sm:py-20 lg:grid-cols-12 lg:gap-10 lg:py-28">
        <div className="animate-fade-up lg:col-span-6">
          <Badge tone="brand" className="mb-5">
            Gratis för privatpersoner
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-ink-900 sm:text-5xl lg:text-6xl">
            {first}
            {second ? (
              <>
                {" "}
                <span className="text-brand-600">{second}</span>
              </>
            ) : null}
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg text-ink-600 sm:text-xl">
            Fota kvittot, ladda upp det eller maila det till din egen kvittoadress. Vi läser av butik, datum och belopp – och din AI-assistent håller koll på garantier och
            reklamationsrätt, så att du slipper leta när något går sönder.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/registrera" size="lg">
              Kom igång gratis
            </ButtonLink>
            <WatchFilmButton />
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500" aria-label="Det här kan du lita på">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon className="h-4 w-4 text-brand-600" aria-hidden />
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mb-8 lg:col-span-6">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink-100 shadow-card ring-1 ring-ink-900/5">
            <Image
              src="/images/hero-kitchen.jpg"
              alt="En man står i sitt kök, skrattar och fotograferar ett kvitto med mobilen."
              fill
              priority
              sizes="(min-width: 1024px) 40rem, (min-width: 640px) 36rem, 100vw"
              className="object-cover object-[62%_center]"
            />
          </div>
          <HeroFloatingCards />
        </div>
      </Container>
    </section>
  );
}
