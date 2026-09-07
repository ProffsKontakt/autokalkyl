import { LineArt, type Stroke } from "./line-art";
import { circle, line, rrect } from "./shapes";

/* A chat bubble with a typing reply below it, and a magnifying glass over the
   corner with a green check in the lens: "ask, and it finds the receipt". */

export const strokes: Stroke[] = [
  // Main bubble
  { d: rrect(18, 16, 120, 74, 16), filled: true },
  { d: "M38 86 L32 108 L60 86", filled: true },
  { d: line(40, 40, 112, 40) },
  { d: line(40, 54, 120, 54) },
  { d: line(40, 68, 96, 68) },
  // Reply bubble (typing)
  { d: rrect(22, 116, 58, 28, 14), filled: true },
  { d: circle(40, 130, 1.2), width: 4 },
  { d: circle(51, 130, 1.2), width: 4 },
  { d: circle(62, 130, 1.2), width: 4 },
  // Magnifier
  { d: circle(140, 106, 26), filled: true },
  { d: circle(140, 106, 21), width: 1.5, opacity: 0.4 },
  { d: line(159, 125, 182, 148), width: 6 },
];

export function ChatSearchIllustration({ className, fillClassName, delay, title }: { className?: string; fillClassName?: string; delay?: number; title?: string }) {
  return <LineArt strokes={strokes} accent={{ cx: 140, cy: 106, r: 12 }} className={className} fillClassName={fillClassName} delay={delay} title={title} />;
}
