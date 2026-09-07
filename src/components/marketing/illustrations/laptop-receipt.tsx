import { LineArt, type Stroke } from "./line-art";
import { line, poly, receiptPoints, rrect } from "./shapes";

/* A laptop whose screen shows the archive: a receipt in the middle, rows of
   stored documents on either side, and a green check on the receipt. */

export const strokes: Stroke[] = [
  // Screen
  { d: rrect(44, 18, 112, 80, 6), filled: true },
  { d: rrect(50, 24, 100, 68, 3), width: 1.5, opacity: 0.5 },
  // Base
  { d: "M30 98 L22 116 A4 4 0 0 0 26 120 H174 A4 4 0 0 0 178 116 L170 98 Z", filled: true },
  { d: line(86, 104, 114, 104), width: 2, opacity: 0.6 },
  // Archived rows left
  { d: rrect(58, 40, 16, 10, 2), width: 2, opacity: 0.7 },
  { d: rrect(58, 56, 16, 10, 2), width: 2, opacity: 0.7 },
  { d: rrect(58, 72, 16, 10, 2), width: 2, opacity: 0.7 },
  // Archived rows right
  { d: rrect(126, 40, 16, 10, 2), width: 2, opacity: 0.7 },
  { d: rrect(126, 56, 16, 10, 2), width: 2, opacity: 0.7 },
  { d: rrect(126, 72, 16, 10, 2), width: 2, opacity: 0.7 },
  // Receipt on screen
  { d: poly(receiptPoints(80, 32, 40, 56, 4, 3), true), filled: true },
  { d: line(87, 42, 113, 42), width: 2 },
  { d: line(87, 50, 109, 50), width: 2 },
  { d: line(87, 58, 113, 58), width: 2 },
  { d: line(101, 70, 113, 70), width: 3 },
];

export function LaptopReceiptIllustration({ className, fillClassName, delay, title }: { className?: string; fillClassName?: string; delay?: number; title?: string }) {
  return <LineArt strokes={strokes} accent={{ cx: 122, cy: 86, r: 12 }} className={className} fillClassName={fillClassName} delay={delay} title={title} />;
}
