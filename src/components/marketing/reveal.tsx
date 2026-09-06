"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { CSSProperties, ReactNode } from "react";

type Tag = "div" | "section" | "article" | "ul" | "ol" | "li" | "p" | "span" | "figure" | "header" | "footer";
type Direction = "up" | "down" | "left" | "right" | "none";

type MotionTag = typeof motion.div;

/* The motion element types differ only in their ref type; for our purposes
   (className + animation props) they are interchangeable. */
const tags: Record<Tag, MotionTag> = {
  div: motion.div,
  section: motion.section as unknown as MotionTag,
  article: motion.article as unknown as MotionTag,
  ul: motion.ul as unknown as MotionTag,
  ol: motion.ol as unknown as MotionTag,
  li: motion.li as unknown as MotionTag,
  p: motion.p as unknown as MotionTag,
  span: motion.span as unknown as MotionTag,
  figure: motion.figure as unknown as MotionTag,
  header: motion.header as unknown as MotionTag,
  footer: motion.footer as unknown as MotionTag,
};

export const revealEase = [0.22, 1, 0.36, 1] as const;

function offsetFor(direction: Direction, distance: number): { x?: number; y?: number } {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
}

interface BaseProps {
  children?: ReactNode;
  className?: string;
  as?: Tag;
  id?: string;
  style?: CSSProperties;
  "aria-label"?: string;
  "aria-hidden"?: boolean;
  role?: string;
}

export interface RevealProps extends BaseProps {
  /** Delay in seconds */
  delay?: number;
  duration?: number;
  direction?: Direction;
  /** Travel distance in px */
  distance?: number;
  /** Fraction of the element that must be visible before it animates */
  amount?: number;
  once?: boolean;
}

/**
 * Fades and slides its children in when scrolled into view (once).
 * Falls back to an instant appearance for users who prefer reduced motion.
 */
export function Reveal({ children, className, as = "div", delay = 0, duration = 0.6, direction = "up", distance = 24, amount = 0.25, once = true, ...rest }: RevealProps) {
  const reduce = useReducedMotion() ?? false;
  const Tag = tags[as];
  return (
    <Tag
      className={className}
      initial={reduce ? false : { opacity: 0, ...offsetFor(direction, distance) }}
      whileInView={{ opacity: 1, x: 0, y: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: reduce ? 0 : duration, delay: reduce ? 0 : delay, ease: revealEase }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export interface RevealGroupProps extends BaseProps {
  /** Seconds between each child */
  stagger?: number;
  /** Delay before the first child */
  delay?: number;
  amount?: number;
  once?: boolean;
}

/**
 * Staggers its `RevealItem` children when the group scrolls into view.
 */
export function RevealGroup({ children, className, as = "div", stagger = 0.1, delay = 0, amount = 0.15, once = true, ...rest }: RevealGroupProps) {
  const reduce = useReducedMotion() ?? false;
  const Tag = tags[as];
  const variants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: reduce ? 0 : delay } },
  };
  return (
    <Tag className={className} initial={reduce ? false : "hidden"} whileInView="visible" viewport={{ once, amount }} variants={variants} {...rest}>
      {children}
    </Tag>
  );
}

export interface RevealItemProps extends BaseProps {
  direction?: Direction;
  distance?: number;
  duration?: number;
}

export function RevealItem({ children, className, as = "div", direction = "up", distance = 20, duration = 0.55, ...rest }: RevealItemProps) {
  const reduce = useReducedMotion() ?? false;
  const Tag = tags[as];
  const variants: Variants = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, ...offsetFor(direction, distance) },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: reduce ? 0 : duration, ease: revealEase } },
  };
  return (
    <Tag className={className} variants={variants} {...rest}>
      {children}
    </Tag>
  );
}
