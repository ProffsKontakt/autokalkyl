import { LineArt, type Stroke } from "./line-art";
import { line, poly, receiptPoints, rrect } from "./shapes";

/* A shield standing on an archive box, with a receipt inside the shield and a
   green check on its corner: "stored, protected, verified". */

export const strokes: Stroke[] = [
  // Archive box
  { d: rrect(28, 108, 144, 16, 4) },
  { d: "M36 124 V142 A6 6 0 0 0 42 148 H158 A6 6 0 0 0 164 142 V124" },
  { d: rrect(88, 131, 24, 6, 3), width: 2 },
  // Shield
  { d: "M100 10 L136 24 V58 C136 84 118 100 100 106 C82 100 64 84 64 58 V24 Z" },
  // Receipt inside
  { d: poly(receiptPoints(84, 34, 32, 44, 4, 3), true), width: 2 },
  { d: line(90, 44, 110, 44), width: 2 },
  { d: line(90, 52, 106, 52), width: 2 },
  { d: line(90, 60, 110, 60), width: 2 },
  { d: line(100, 68, 110, 68), width: 2.5 },
];

export function ShieldArchiveIllustration({ className, fillClassName, delay, title }: { className?: string; fillClassName?: string; delay?: number; title?: string }) {
  return <LineArt strokes={strokes} accent={{ cx: 120, cy: 78, r: 11 }} className={className} fillClassName={fillClassName} delay={delay} title={title} />;
}
