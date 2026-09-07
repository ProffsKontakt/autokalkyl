"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Checkmark } from "@/components/ui/checkmark";

export interface SuccessOverlayProps {
  open: boolean;
  title: string;
  description?: string;
}

/** Full-screen "kvittot är sparat" moment with the brand checkmark. */
export function SuccessOverlay({ open, title, description }: SuccessOverlayProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/95 px-6 text-center backdrop-blur-sm"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Checkmark size={128} />
          <motion.h2
            className="mt-6 text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl"
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.35 }}
          >
            {title}
          </motion.h2>
          {description ? (
            <motion.p
              className="mt-2 text-ink-500"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.5 }}
            >
              {description}
            </motion.p>
          ) : null}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
