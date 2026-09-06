import { LineArt, type Stroke } from "./line-art";
import { line, poly, receiptPoints, rrect } from "./shapes";

/* An envelope on the left, a dashed arrow, and a receipt on the right:
   "forward the email and it becomes a stored receipt". */

export const strokes: Stroke[] = [
  // Envelope
  { d: rrect(14, 52, 70, 50, 6), filled: true },
  { d: "M14 58 L49 84 L84 58" },
  { d: line(14, 98, 40, 78), width: 2, opacity: 0.6 },
  { d: line(84, 98, 58, 78), width: 2, opacity: 0.6 },
  // Arrow
  { d: line(94, 77, 120, 77), dashed: true, width: 2.5 },
  { d: "M116 70 L124 77 L116 84" },
  // Receipt
  { d: poly(receiptPoints(134, 26, 52, 100, 5, 4), true), filled: true },
  { d: line(144, 42, 176, 42), width: 2 },
  { d: line(144, 52, 170, 52), width: 2 },
  { d: line(144, 62, 176, 62), width: 2 },
  { d: line(144, 72, 166, 72), width: 2 },
  { d: line(144, 82, 176, 82), width: 2 },
  { d: line(160, 100, 176, 100), width: 3 },
];

export function EnvelopeFlowIllustration({ className, fillClassName, delay, title }: { className?: string; fillClassName?: string; delay?: number; title?: string }) {
  return <LineArt strokes={strokes} accent={{ cx: 184, cy: 120, r: 12 }} className={className} fillClassName={fillClassName} delay={delay} title={title} />;
}
