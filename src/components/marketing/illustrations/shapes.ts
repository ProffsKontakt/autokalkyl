/**
 * Tiny path helpers for the line-art illustrations.
 * Everything is expressed as SVG path data so the renderer can animate
 * each stroke with a single `pathLength` tween.
 */

export type Point = [number, number];

const n = (v: number) => Math.round(v * 100) / 100;

/** Rounded rectangle as a closed path. */
export function rrect(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return [
    `M${n(x + rr)} ${n(y)}`,
    `H${n(x + w - rr)}`,
    `A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w)} ${n(y + rr)}`,
    `V${n(y + h - rr)}`,
    `A${n(rr)} ${n(rr)} 0 0 1 ${n(x + w - rr)} ${n(y + h)}`,
    `H${n(x + rr)}`,
    `A${n(rr)} ${n(rr)} 0 0 1 ${n(x)} ${n(y + h - rr)}`,
    `V${n(y + rr)}`,
    `A${n(rr)} ${n(rr)} 0 0 1 ${n(x + rr)} ${n(y)}`,
    "Z",
  ].join(" ");
}

/** Circle as a closed path (two arcs). */
export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)} A${n(r)} ${n(r)} 0 1 0 ${n(cx + r)} ${n(cy)} A${n(r)} ${n(r)} 0 1 0 ${n(cx - r)} ${n(cy)} Z`;
}

export function line(x1: number, y1: number, x2: number, y2: number): string {
  return `M${n(x1)} ${n(y1)} L${n(x2)} ${n(y2)}`;
}

/** Polyline / polygon from points. */
export function poly(points: Point[], close = false): string {
  const [first, ...rest] = points;
  if (!first) return "";
  const d = `M${n(first[0])} ${n(first[1])} ` + rest.map(([x, y]) => `L${n(x)} ${n(y)}`).join(" ");
  return close ? `${d} Z` : d;
}

/** Rotates points by `deg` degrees around (cx, cy). Positive = clockwise in SVG space. */
export function rotate(points: Point[], deg: number, cx: number, cy: number): Point[] {
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map(([x, y]) => {
    const dx = x - cx;
    const dy = y - cy;
    return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
  });
}

/**
 * A receipt outline: straight top and sides, zig-zag (torn) bottom edge.
 * Returns the polygon points so callers can rotate before closing.
 */
export function receiptPoints(x: number, y: number, w: number, h: number, teeth = 5, depth = 4): Point[] {
  const pts: Point[] = [
    [x, y],
    [x + w, y],
    [x + w, y + h - depth],
  ];
  const step = w / teeth;
  for (let i = 0; i < teeth; i++) {
    pts.push([x + w - step * (i + 0.5), y + h]);
    pts.push([x + w - step * (i + 1), y + h - depth]);
  }
  return pts;
}

/** Convenience: closed receipt path, optionally rotated around its centre. */
export function receipt(x: number, y: number, w: number, h: number, opts: { teeth?: number; depth?: number; rotateDeg?: number } = {}): string {
  const pts = receiptPoints(x, y, w, h, opts.teeth, opts.depth);
  const rotated = opts.rotateDeg ? rotate(pts, opts.rotateDeg, x + w / 2, y + h / 2) : pts;
  return poly(rotated, true);
}

/** Straight line rotated with the same pivot as a rotated receipt. */
export function rotatedLine(x1: number, y1: number, x2: number, y2: number, deg: number, cx: number, cy: number): string {
  return poly(rotate([[x1, y1], [x2, y2]], deg, cx, cy));
}
