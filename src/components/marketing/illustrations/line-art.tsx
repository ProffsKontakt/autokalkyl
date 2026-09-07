"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

export interface Stroke {
  /** SVG path data */
  d: string;
  /** Stroke width override (defaults to the svg's 2.5) */
  width?: number;
  /** Dashed strokes fade in instead of drawing (dash arrays clash with pathLength) */
  dashed?: boolean;
  opacity?: number;
  /** Fill the shape with the background colour so it occludes strokes drawn before it */
  filled?: boolean;
}

export interface Accent {
  cx: number;
  cy: number;
  r: number;
}

export interface LineArtProps {
  strokes: Stroke[];
  /** Green check badge that pops in after the strokes have drawn */
  accent?: Accent;
  viewBox?: string;
  className?: string;
  /** Tailwind fill class used for `filled` strokes, e.g. "fill-ink-50". Defaults to white. */
  fillClassName?: string;
  /** Accessible name. Omit for purely decorative use (aria-hidden). */
  title?: string;
  /** Extra delay (s) before the drawing starts */
  delay?: number;
}

const drawEase = [0.4, 0, 0.2, 1] as const;
const STAGGER = 0.07;

/**
 * Renders a line-art illustration whose strokes draw themselves when scrolled
 * into view, followed by a green check badge that springs in.
 * Strokes use `currentColor`, so colour the illustration via text-* classes.
 */
export function LineArt({ strokes, accent, viewBox = "0 0 200 160", className, fillClassName = "fill-white", title, delay = 0 }: LineArtProps) {
  const reduce = useReducedMotion() ?? false;
  const accentDelay = delay + Math.min(strokes.length, 14) * STAGGER * 0.6 + 0.45;

  const accentVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 320, damping: 16, delay: accentDelay },
    },
  };

  return (
    <motion.svg
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-auto w-full", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      initial={reduce ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      {strokes.map((s, i) => {
        const start = delay + i * STAGGER;
        const opacity = s.opacity ?? 1;
        const variants: Variants = s.dashed
          ? {
              hidden: { opacity: 0 },
              visible: { opacity, transition: { duration: 0.5, delay: start } },
            }
          : {
              hidden: { pathLength: 0, opacity: 0 },
              visible: {
                pathLength: 1,
                opacity,
                transition: {
                  pathLength: { duration: 0.8, delay: start, ease: drawEase },
                  opacity: { duration: 0.2, delay: start },
                },
              },
            };
        return (
          <motion.path
            key={i}
            d={s.d}
            strokeWidth={s.width}
            strokeDasharray={s.dashed ? "3 6" : undefined}
            className={s.filled ? fillClassName : undefined}
            variants={variants}
          />
        );
      })}
      {accent ? <AccentBadge accent={accent} variants={accentVariants} /> : null}
    </motion.svg>
  );
}

function AccentBadge({ accent, variants }: { accent: Accent; variants: Variants }) {
  const { cx, cy, r } = accent;
  const k = r / 30;
  const check = `M${cx - 13 * k} ${cy + 1.5 * k} L${cx - 4 * k} ${cy + 10 * k} L${cx + 13 * k} ${cy - 8 * k}`;
  return (
    <motion.g variants={variants}>
      <circle cx={cx} cy={cy} r={r} className="fill-brand-600 stroke-white" strokeWidth={3} />
      <path d={check} className="stroke-white" strokeWidth={Math.max(2.5, 6 * k)} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </motion.g>
  );
}
