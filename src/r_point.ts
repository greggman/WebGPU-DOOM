// Point-to-angle. Ported from linuxdoom-1.10/r_main.c (R_PointToAngle) and
// tables.c (SlopeDiv).
//
// Despite living in r_main.c this is playsim code — P_HitSlideLine and the
// enemy AI both call it, so its exact output is demo-critical. It's a table
// lookup over eight octants, not an atan2: the tantoangle LUT only covers
// 0..45 degrees and the octant logic folds everything else onto it. Using
// Math.atan2 would be more accurate and would desync.

import { tantoangle, SLOPERANGE } from './tables.js';

export const ANG45 = 0x20000000;
export const ANG90 = 0x40000000;
export const ANG180 = 0x80000000;
export const ANG270 = 0xc0000000;

/**
 * SlopeDiv. Maps a ratio to a tantoangle index. `den < 512` saturating to
 * SLOPERANGE is what keeps near-vertical slopes from dividing by ~0.
 */
export function SlopeDiv(num: number, den: number): number {
  // Both operands are unsigned in the C.
  den = den >>> 0;
  if (den < 512) return SLOPERANGE;
  const ans = ((num >>> 0) << 3) / (den >>> 8);
  const a = Math.floor(ans) >>> 0;
  return a <= SLOPERANGE ? a : SLOPERANGE;
}

/**
 * R_PointToAngle2: BAM angle of (x2,y2) as seen from (x1,y1).
 * Returns an unsigned 32-bit BAM.
 */
export function R_PointToAngle2(x1: number, y1: number, x2: number, y2: number): number {
  let x = (x2 - x1) | 0;
  let y = (y2 - y1) | 0;

  if (x === 0 && y === 0) return 0;

  if (x >= 0) {
    if (y >= 0) {
      if (x > y) return tantoangle[SlopeDiv(y, x)] >>> 0;             // octant 0
      return (ANG90 - 1 - tantoangle[SlopeDiv(x, y)]) >>> 0;          // octant 1
    }
    y = -y;
    if (x > y) return (-tantoangle[SlopeDiv(y, x)]) >>> 0;            // octant 8
    return (ANG270 + tantoangle[SlopeDiv(x, y)]) >>> 0;               // octant 7
  }

  x = -x;
  if (y >= 0) {
    if (x > y) return (ANG180 - 1 - tantoangle[SlopeDiv(y, x)]) >>> 0; // octant 3
    return (ANG90 + tantoangle[SlopeDiv(x, y)]) >>> 0;                 // octant 2
  }
  y = -y;
  if (x > y) return (ANG180 + tantoangle[SlopeDiv(y, x)]) >>> 0;       // octant 4
  return (ANG270 - 1 - tantoangle[SlopeDiv(x, y)]) >>> 0;              // octant 5
}
