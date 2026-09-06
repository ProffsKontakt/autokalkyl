import { LineArt, type Stroke } from "./line-art";
import { circle, line, receipt, rotatedLine, rrect, receiptPoints, poly } from "./shapes";

/* A paper receipt lying on the table, slightly askew, with a phone held above
   it. The phone screen shows the receipt through a viewfinder, and a green
   check pops in when the capture is done. */

const TILT = -10;
const RX = 48;
const RY = 76;
const RW = 54;
const RH = 72;
const RCX = RX + RW / 2;
const RCY = RY + RH / 2;

export const strokes: Stroke[] = [
  // Physical receipt on the table (drawn first, so the phone can occlude it)
  { d: receipt(RX, RY, RW, RH, { teeth: 5, depth: 4, rotateDeg: TILT }), filled: true },
  { d: rotatedLine(RX + 10, RY + 16, RX + 42, RY + 16, TILT, RCX, RCY), width: 2 },
  { d: rotatedLine(RX + 10, RY + 26, RX + 36, RY + 26, TILT, RCX, RCY), width: 2 },
  { d: rotatedLine(RX + 10, RY + 36, RX + 42, RY + 36, TILT, RCX, RCY), width: 2 },
  { d: rotatedLine(RX + 24, RY + 50, RX + 42, RY + 50, TILT, RCX, RCY), width: 3 },
  // Small "capture" sparks beside the phone
  { d: line(90, 20, 84, 14), width: 2.5 },
  { d: line(84, 32, 76, 32), width: 2.5 },
  // Phone body and screen
  { d: rrect(98, 10, 72, 126, 12), filled: true },
  { d: rrect(105, 22, 58, 102, 5), width: 1.5, opacity: 0.55 },
  { d: line(126, 16, 142, 16), width: 2 },
  { d: line(124, 130, 144, 130), width: 2 },
  // Viewfinder corners
  { d: "M113 42 V34 H121", width: 2.5 },
  { d: "M147 34 H155 V42", width: 2.5 },
  { d: "M113 92 V100 H121", width: 2.5 },
  { d: "M155 92 V100 H147", width: 2.5 },
  // Receipt preview on screen
  { d: poly(receiptPoints(120, 44, 28, 44, 4, 3), true), width: 2 },
  { d: line(125, 54, 143, 54), width: 1.8 },
  { d: line(125, 62, 139, 62), width: 1.8 },
  { d: line(125, 70, 143, 70), width: 1.8 },
  { d: line(133, 80, 143, 80), width: 2.5 },
  // Shutter button
  { d: circle(134, 112, 7), width: 2.5 },
  { d: circle(134, 112, 10.5), width: 1.5, opacity: 0.5 },
];

export function PhoneReceiptIllustration({ className, fillClassName, delay, title }: { className?: string; fillClassName?: string; delay?: number; title?: string }) {
  return <LineArt strokes={strokes} accent={{ cx: 170, cy: 18, r: 13 }} className={className} fillClassName={fillClassName} delay={delay} title={title} />;
}
