"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/marketing/reveal";
import { SECTION_IDS, FILM_VIDEO_ID } from "./ids";

const VIDEO_SRC = "/video/reklamfilm.mp4";
const POSTER_SRC = "/video/reklamfilm-poster.jpg";

/**
 * The ad film. A client component so the hero CTA can scroll here and move
 * focus, and so we can show a big play button over the poster until playback starts.
 */
export function VideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);

  function play() {
    const video = videoRef.current;
    if (!video) return;
    const result = video.play();
    if (result && typeof result.catch === "function") result.catch(() => undefined);
  }

  return (
    <section id={SECTION_IDS.film} tabIndex={-1} className="scroll-mt-20 bg-white py-16 outline-none sm:py-24">
      <Container>
        <Reveal className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-700">
            <span className="h-px w-6 bg-brand-500" aria-hidden />
            Reklamfilm
          </span>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">Se filmen: när tv:n krånglar</h2>
          <p className="text-pretty text-lg text-ink-600">En kort film om känslan när kvittot faktiskt finns kvar – och assistenten vet exakt vad du ska göra.</p>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-3xl bg-ink-900 shadow-card ring-1 ring-ink-900/10">
            <video
              ref={videoRef}
              id={FILM_VIDEO_ID}
              className="h-full w-full"
              src={VIDEO_SRC}
              poster={POSTER_SRC}
              controls
              playsInline
              preload="metadata"
              onPlay={() => setStarted(true)}
              onError={() => setFailed(true)}
              aria-label="Reklamfilm: när tv:n krånglar"
            >
              Din webbläsare kan inte spela upp filmen.{" "}
              <a href={VIDEO_SRC} className="underline">
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
