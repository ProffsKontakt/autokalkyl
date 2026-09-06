"use client";

import type { MouseEvent } from "react";
import { Play } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { SECTION_IDS } from "./ids";

/**
 * "Se hur det funkar" – scrolls smoothly to the film section and moves focus
 * there. Degrades to a plain anchor link without JavaScript.
 */
export function WatchFilmButton({ className }: { className?: string }) {
  const reduce = useReducedMotion() ?? false;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    const section = document.getElementById(SECTION_IDS.film);
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${SECTION_IDS.film}`);
    section.focus({ preventScroll: true });
  }

  return (
    <ButtonLink href={`#${SECTION_IDS.film}`} variant="outline" size="lg" className={className} onClick={handleClick}>
      <Play className="h-4 w-4 text-brand-600" aria-hidden />
      Se hur det funkar
    </ButtonLink>
  );
}
