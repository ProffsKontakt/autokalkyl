"use client";

import { motion, useReducedMotion } from "motion/react";
import { BookOpen } from "lucide-react";
import { Checkmark } from "@/components/ui/checkmark";
import { formatDate, formatMoney } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

/**
 * The floating "Kvittot är sparat" card (and a smaller chip) that hover over
 * the hero photo. Slides in after the page has settled, then bobs gently.
 */
export function HeroFloatingCards() {
  const reduce = useReducedMotion() ?? false;
  const bob = reduce ? undefined : { y: [0, -6, 0] };

  return (
    <>
      <motion.div
        className="absolute -bottom-8 left-4 max-w-[calc(100%-2rem)] sm:-left-6 sm:max-w-none"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5, ease }}
      >
        <motion.div
          animate={bob}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.6 }}
          className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-card ring-1 ring-ink-200/70"
        >
          <Checkmark size={44} delay={0.95} label="Kvittot är sparat" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900">Kvittot är sparat</p>
            <p className="truncate text-xs text-ink-500">
              Elgiganten · {formatMoney(1299)} · garanti till {formatDate("2028-09-06")}
            </p>
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="absolute -top-4 right-4 hidden sm:block lg:-right-4"
        initial={reduce ? false : { opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.2, ease }}
      >
        <motion.div
          animate={bob}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.2 }}
          className="flex items-center gap-2 rounded-xl bg-white/95 px-3 py-2 text-xs font-medium text-ink-700 shadow-soft ring-1 ring-ink-200/70 backdrop-blur"
        >
          <BookOpen className="h-4 w-4 text-brand-600" aria-hidden />
          Bruksanvisning hittad
        </motion.div>
      </motion.div>
    </>
  );
}
