"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

/**
 * Animated green checkmark – the brand's signature moment ("kvittot är sparat").
 * Draws the circle and tick with SVG path animation, then pops.
 */
export function Checkmark({
  size = 96,
  className,
  animate = true,
  delay = 0,
  label,
}: {
  size?: number;
  className?: string;
  animate?: boolean;
  delay?: number;
  label?: string;
}) {
  const reduce = useReducedMotion();
  const shouldAnimate = animate && !reduce;
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }} role="img" aria-label={label ?? "Klart"}>
      {shouldAnimate ? (
        <motion.span
          className="absolute inset-0 rounded-full bg-brand-500/30"
          initial={{ scale: 0.8, opacity: 0.7 }}
          animate={{ scale: 1.7, opacity: 0 }}
          transition={{ duration: 1.1, delay: delay + 0.35, ease: "easeOut" }}
        />
      ) : null}
      <motion.svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        initial={shouldAnimate ? { scale: 0.6, opacity: 0 } : false}
        animate={shouldAnimate ? { scale: [0.6, 1.12, 1], opacity: 1 } : undefined}
        transition={{ duration: 0.55, delay, ease: [0.2, 0.9, 0.3, 1.2] }}
      >
        <circle cx="32" cy="32" r="30" className="fill-brand-600" />
        <motion.path
          d="M19 33.5 L28 42 L45 24"
          fill="none"
          stroke="white"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldAnimate ? { pathLength: 0 } : false}
          animate={shouldAnimate ? { pathLength: 1 } : undefined}
          transition={{ duration: 0.45, delay: delay + 0.25, ease: "easeOut" }}
        />
      </motion.svg>
    </div>
  );
}

/** Small inline check that turns green and grows when it scrolls into view. */
export function ScrollCheck({ className, delay = 0, size = 40 }: { className?: string; delay?: number; size?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      initial={reduce ? false : { scale: 0.7, opacity: 0.6 }}
      whileInView={reduce ? undefined : { scale: 1, opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.9, 0.3, 1.2] }}
      aria-hidden
    >
      <motion.circle
        cx="32"
        cy="32"
        r="30"
        initial={reduce ? { fill: "#1c6f61" } : { fill: "#d9dde2" }}
        whileInView={{ fill: "#1c6f61" }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.5, delay: delay + 0.1 }}
      />
      <motion.path
        d="M19 33.5 L28 42 L45 24"
        fill="none"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.45, delay: delay + 0.25 }}
      />
    </motion.svg>
  );
}
