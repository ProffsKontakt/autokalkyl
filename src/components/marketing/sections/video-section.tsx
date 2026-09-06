"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/marketing/reveal";
import { cn } from "@/lib/utils";
import { SECTION_IDS, FILM_VIDEO_ID } from "./ids";

const FILMS = [
  {
    key: "produkt",
    tab: "Så funkar Kvittera",
    length: "2 min",
    title: "Så funkar Kvittera – på två minuter",
    description: "Från fotat kvitto till färdigt arkiv: skanning, e-post, sökning, garantier och assistenten som hittar villkoren åt dig.",
    src: "/video/produktfilm.mp4",
    poster: "/video/produktfilm-poster.jpg",
    label: "Produktfilm: så funkar Kvittera",
  },
  {
    key: "reklam",
    tab: "Reklamfilmen",
    length: "30 s",
    title: "Se filmen: när tv:n krånglar",
    description: "En kort film om känslan när kvittot faktiskt finns kvar – och assistenten vet exakt vad du ska göra.",
    src: "/video/reklamfilm.mp4",
    poster: "/video/reklamfilm-poster.jpg",
    label: "Reklamfilm: när tv:n krånglar",
  },
] as const;

/**
 * The films. A client component so the hero CTA can scroll here and move focus, and so we can
 * show a big play button over the poster until playback starts.
 */
export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState<(typeof FILMS)[number]["key"]>("produkt");
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const film = FILMS.find((f) => f.key === active) ?? FILMS[0];

  function play() {
    const video = videoRef.current;
    if (!video) return;
    const result = video.play();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  }

  function choose(key: (typeof FILMS)[number]["key"]) {
    if (key === active) return;
    videoRef.current?.pause();
    setActive(key);
    setStarted(false);
    setFailed(false);
  }

  return (
    <section id={SECTION_IDS.film} tabIndex={-1} className="scroll-mt-20 bg-white py-16 outline-none sm:py-24">
      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
            <span className="h-px w-6 bg-brand-500" aria-hidden />
            Film
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{film.title}</h2>
          <p className="text-pretty text-lg text-ink-600">{film.description}</p>
          <div className="mt-2 inline-flex rounded-full bg-ink-100 p-1" role="tablist" aria-label="Välj film">
            {FILMS.map((f) => (
              <button
                key={f.key}
                type="button"
                role="tab"
                aria-selected={f.key === active}
                onClick={() => choose(f.key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  f.key === active ? "bg-white text-ink-900 shadow-soft" : "text-ink-600 hover:text-ink-900",
                )}
              >
                {f.tab} <span className="font-normal text-ink-500">· {f.length}</span>
              </button>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-3xl bg-ink-900 shadow-card ring-1 ring-ink-900/10">
            <video
              key={film.key}
              ref={videoRef}
              id={FILM_VIDEO_ID}
              className="h-full w-full"
              src={film.src}
              poster={film.poster}
              controls
              playsInline
              preload="metadata"
              onPlay={() => setStarted(true)}
              onError={() => setFailed(true)}
              aria-label={film.label}
            >
              Din webbläsare kan inte spela upp filmen.{" "}
              <a href={film.src} className="underline">
                Ladda ner filmen
              </a>
              .
            </video>

            {!started && !failed ? (
              <button
                type="button"
                onClick={play}
                className="group absolute inset-x-0 bottom-16 top-0 flex items-center justify-center bg-ink-950/10 transition-colors hover:bg-ink-950/20"
                aria-label="Spela upp filmen"
              >
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-brand-700 shadow-card ring-1 ring-ink-900/10 transition-transform group-hover:scale-105 group-active:scale-95">
                  <Play className="ml-1 h-8 w-8" fill="currentColor" aria-hidden />
                </span>
              </button>
            ) : null}

            {failed ? (
              <p className="absolute inset-x-0 top-0 flex h-full items-center justify-center bg-ink-900 px-6 text-center text-sm text-ink-300" role="status">
                Filmen kunde inte laddas just nu. Prova igen om en stund.
              </p>
            ) : null}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
