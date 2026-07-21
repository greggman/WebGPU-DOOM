// Map utility geometry. Ported from linuxdoom-1.10/p_maputl.c.
//
// Every function here is bit-exact with the C on purpose, including the parts
// that look wrong. The precision quirks ARE the behaviour: DOOM's collision has
// documented edge cases that players and demos both depend on, and "fixing"
// them silently rewrites the game.

import { FixedMul, FixedDiv, FRACBITS, FRACUNIT, MAXINT } from './m_fixed.js';
import { SlopeType, type PLine } from './p_local.js';
import { blockLines, MAPBLOCKSHIFT, MAPBLOCKSIZE, MAPBTOFRAC, type DoomMap } from './map.js';
import { P_BlockThingsIterator } from './p_blockmap.js';
import type { PMobj } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/**
 * P_AproxDistance: cheap |dx|+|dy| - min/2 approximation. Overestimates by up
 * to ~12%. Vanilla uses it for nearly every distance test, so replacing it with
 * a real hypot changes monster behaviour and desyncs demos.
 */
export function P_AproxDistance(dx: number, dy: number): number {
  dx = Math.abs(dx) | 0;
  dy = Math.abs(dy) | 0;
  if (dx < dy) return (dx + dy - (dx >> 1)) | 0;
  return (dx + dy - (dy >> 1)) | 0;
}

/** P_PointOnLineSide: 0 = front, 1 = back. */
export function P_PointOnLineSide(x: number, y: number, line: PLine): number {
  if (line.dx === 0) {
    if (x <= line.v1x) return line.dy > 0 ? 1 : 0;
    return line.dy < 0 ? 1 : 0;
  }
  if (line.dy === 0) {
    if (y <= line.v1y) return line.dx < 0 ? 1 : 0;
    return line.dx > 0 ? 1 : 0;
  }

  const dx = (x - line.v1x) | 0;
  const dy = (y - line.v1y) | 0;

  const left = FixedMul(line.dy >> FRACBITS, dx);
  const right = FixedMul(dy, line.dx >> FRACBITS);

  return right < left ? 0 : 1;
}

/** p_maputl.c divline_t — a line as a point plus a delta. */
export interface DivLine {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

export function P_MakeDivline(line: PLine): DivLine {
  return { x: line.v1x, y: line.v1y, dx: line.dx, dy: line.dy };
}

/**
 * P_PointOnDivlineSide. Note this does NOT match P_PointOnLineSide: it shifts
 * both operands >>8 instead of >>FRACBITS, and short-circuits on sign bits
 * first. Different precision, different results near a line. Vanilla uses each
 * in specific places; swapping them changes collision.
 */
export function P_PointOnDivlineSide(x: number, y: number, line: DivLine): number {
  if (line.dx === 0) {
    if (x <= line.x) return line.dy > 0 ? 1 : 0;
    return line.dy < 0 ? 1 : 0;
  }
  if (line.dy === 0) {
    if (y <= line.y) return line.dx < 0 ? 1 : 0;
    return line.dx > 0 ? 1 : 0;
  }

  const dx = (x - line.x) | 0;
  const dy = (y - line.y) | 0;

  // Sign-bit fast path, straight from the C.
  if ((line.dy ^ line.dx ^ dx ^ dy) & 0x80000000) {
    if ((line.dy ^ dx) & 0x80000000) return 1; // left is negative
    return 0;
  }

  const left = FixedMul(line.dy >> 8, dx >> 8);
  const right = FixedMul(dy >> 8, line.dx >> 8);

  return right < left ? 0 : 1;
}

/** p_setup.c P_LoadLineDefs derives this from dx/dy. */
export function slopeTypeOf(dx: number, dy: number): SlopeType {
  if (dx === 0) return SlopeType.Vertical;
  if (dy === 0) return SlopeType.Horizontal;
  return (dy ^ dx) < 0 ? SlopeType.Negative : SlopeType.Positive;
}

/** Result of P_LineOpening — the gap a mobj could pass through. */
export interface Opening {
  top: number;
  bottom: number;
  range: number;
  lowFloor: number;
}

/**
 * P_LineOpening: the vertical gap through a two-sided line. A one-sided line
 * has range 0 — nothing passes.
 */
export function P_LineOpening(line: PLine): Opening {
  if (line.sideNum[1] === -1 || !line.frontSector || !line.backSector) {
    return { top: 0, bottom: 0, range: 0, lowFloor: 0 };
  }

  const front = line.frontSector;
  const back = line.backSector;

  const top = front.ceilingHeight < back.ceilingHeight ? front.ceilingHeight : back.ceilingHeight;

  let bottom: number;
  let lowFloor: number;
  if (front.floorHeight > back.floorHeight) {
    bottom = front.floorHeight;
    lowFloor = back.floorHeight;
  } else {
    bottom = back.floorHeight;
    lowFloor = front.floorHeight;
  }

  return { top, bottom, range: (top - bottom) | 0, lowFloor };
}

/** m_bbox.h box indices. */
export const BOXTOP = 0, BOXBOTTOM = 1, BOXLEFT = 2, BOXRIGHT = 3;

/**
 * P_BoxOnLineSide: which side of a line an axis-aligned box lies on.
 * Returns -1 when the box straddles it. Ported branch-for-branch — the
 * slopetype switch picks which corners to test.
 */
export function P_BoxOnLineSide(box: readonly number[], line: PLine): number {
  let p1: number;
  let p2: number;

  switch (line.slopeType) {
    case SlopeType.Horizontal:
      p1 = box[BOXTOP] > line.v1y ? 1 : 0;
      p2 = box[BOXBOTTOM] > line.v1y ? 1 : 0;
      if (line.dx < 0) { p1 ^= 1; p2 ^= 1; }
      break;

    case SlopeType.Vertical:
      p1 = box[BOXRIGHT] < line.v1x ? 1 : 0;
      p2 = box[BOXLEFT] < line.v1x ? 1 : 0;
      if (line.dy < 0) { p1 ^= 1; p2 ^= 1; }
      break;

    case SlopeType.Positive:
      p1 = P_PointOnLineSide(box[BOXLEFT], box[BOXTOP], line);
      p2 = P_PointOnLineSide(box[BOXRIGHT], box[BOXBOTTOM], line);
      break;

    case SlopeType.Negative:
      p1 = P_PointOnLineSide(box[BOXRIGHT], box[BOXTOP], line);
      p2 = P_PointOnLineSide(box[BOXLEFT], box[BOXBOTTOM], line);
      break;

    default:
      return -1;
  }

  return p1 === p2 ? p1 : -1;
}

// ---------------------------------------------------------------------------
// Path traversal: walk a ray across the blockmap, collecting what it crosses.
// ---------------------------------------------------------------------------

export const PT_ADDLINES = 1;
export const PT_ADDTHINGS = 2;
export const PT_EARLYOUT = 4;

export interface Intercept {
  frac: number;
  isALine: boolean;
  line: PLine | null;
  thing: PMobj | null;
}

/** p_maputl.c MAXINTERCEPTS. */
const MAXINTERCEPTS = 128;

const intercepts: Intercept[] = Array.from({ length: MAXINTERCEPTS }, () => ({
  frac: 0, isALine: false, line: null, thing: null,
}));
let interceptCount = 0;

/** The ray currently being traced. Vanilla shares it as a global. */
export const trace: DivLine = { x: 0, y: 0, dx: 0, dy: 0 };
let earlyOut = false;

let traceLevel: PlaysimMap;
let traceMap: DoomMap;
let traceValidCount = 0;

export function P_SetTraceLevel(l: PlaysimMap): void {
  traceLevel = l;
  traceMap = l.source;
  traceValidCount = 0;
}

/**
 * P_InterceptVector: where along v2 does v1 cross it, as a 0..FRACUNIT frac.
 * The >>8 shifts are vanilla's: they trade precision for headroom so the
 * FixedMul can't overflow. Using full precision changes results near-parallel.
 */
export function P_InterceptVector(v2: DivLine, v1: DivLine): number {
  const den = (FixedMul(v1.dy >> 8, v2.dx) - FixedMul(v1.dx >> 8, v2.dy)) | 0;
  if (den === 0) return 0;

  const num = (FixedMul((v1.x - v2.x) >> 8, v1.dy) + FixedMul((v2.y - v1.y) >> 8, v1.dx)) | 0;
  return FixedDiv(num, den);
}

/** PIT_AddLineIntercepts. */
function PIT_AddLineIntercepts(ld: PLine): boolean {
  let s1: number;
  let s2: number;

  // Two different side tests by ray length — vanilla switches to avoid
  // precision problems on short traces. Both are kept: they disagree near a
  // line, and which one runs depends on the ray, so this branch is behaviour.
  if (trace.dx > FRACUNIT * 16 || trace.dy > FRACUNIT * 16 ||
      trace.dx < -FRACUNIT * 16 || trace.dy < -FRACUNIT * 16) {
    s1 = P_PointOnDivlineSide(ld.v1x, ld.v1y, trace);
    s2 = P_PointOnDivlineSide(ld.v2x, ld.v2y, trace);
  } else {
    s1 = P_PointOnLineSide(trace.x, trace.y, ld);
    s2 = P_PointOnLineSide((trace.x + trace.dx) | 0, (trace.y + trace.dy) | 0, ld);
  }

  if (s1 === s2) return true; // not crossed

  const dl = P_MakeDivline(ld);
  const frac = P_InterceptVector(trace, dl);

  if (frac < 0) return true; // behind the source

  if (earlyOut && frac < FRACUNIT && !ld.backSector) return false;

  if (interceptCount < MAXINTERCEPTS) {
    const ic = intercepts[interceptCount++];
    ic.frac = frac;
    ic.isALine = true;
    ic.line = ld;
    ic.thing = null;
  }
  return true;
}

/**
 * PIT_AddThingIntercepts. Tests the ray against a CORNER-TO-CORNER diagonal of
 * the thing's bounding box, picking whichever diagonal is more perpendicular to
 * the trace (`(trace.dx ^ trace.dy) > 0` — a sign-bit trick, not a comparison).
 * So DOOM hitscans hit a diagonal line, not a box: shots can miss at the
 * corners of a thing's bounds.
 */
function PIT_AddThingIntercepts(thing: PMobj): boolean {
  const tracePositive = ((trace.dx ^ trace.dy) > 0);

  let x1: number, y1: number, x2: number, y2: number;
  if (tracePositive) {
    x1 = (thing.x - thing.radius) | 0;
    y1 = (thing.y + thing.radius) | 0;
    x2 = (thing.x + thing.radius) | 0;
    y2 = (thing.y - thing.radius) | 0;
  } else {
    x1 = (thing.x - thing.radius) | 0;
    y1 = (thing.y - thing.radius) | 0;
    x2 = (thing.x + thing.radius) | 0;
    y2 = (thing.y + thing.radius) | 0;
  }

  const s1 = P_PointOnDivlineSide(x1, y1, trace);
  const s2 = P_PointOnDivlineSide(x2, y2, trace);
  if (s1 === s2) return true; // not crossed

  const dl: DivLine = { x: x1, y: y1, dx: (x2 - x1) | 0, dy: (y2 - y1) | 0 };
  const frac = P_InterceptVector(trace, dl);
  if (frac < 0) return true; // behind the source

  if (interceptCount < MAXINTERCEPTS) {
    const ic = intercepts[interceptCount++];
    ic.frac = frac;
    ic.isALine = false;
    ic.line = null;
    ic.thing = thing;
  }
  return true;
}

/** P_TraverseIntercepts: visit collected intercepts in nearest-first order. */
function P_TraverseIntercepts(func: (i: Intercept) => boolean, maxFrac: number): boolean {
  let count = interceptCount;

  // Vanilla selection-sorts by repeatedly scanning for the minimum and then
  // marking it MAXINT. O(n^2), but it's the order callers depend on.
  while (count-- > 0) {
    let dist = MAXINT;
    let inIdx = -1;
    for (let i = 0; i < interceptCount; i++) {
      if (intercepts[i].frac < dist) {
        dist = intercepts[i].frac;
        inIdx = i;
      }
    }
    if (dist > maxFrac) return true; // everything in range checked
    if (inIdx < 0) return true;
    if (!func(intercepts[inIdx])) return false;
    intercepts[inIdx].frac = MAXINT; // consumed
  }
  return true;
}

/** p_maputl.c P_BlockLinesIterator, for the trace's own validcount. */
function traceBlockLines(bx: number, by: number, fn: (l: PLine) => boolean): boolean {
  for (const li of blockLines(traceMap, bx, by)) {
    const ld = traceLevel.lines[li];
    if (!ld) continue;
    if (ld.validCount === traceValidCount) continue;
    ld.validCount = traceValidCount;
    if (!fn(ld)) return false;
  }
  return true;
}

/**
 * P_PathTraverse: walk the blockmap along a ray, gathering intercepts, then
 * hand them to `trav` nearest-first. Returns false if `trav` stopped early.
 *
 * The DDA below steps block to block. Note the hard 64-iteration cap — vanilla
 * gives up rather than risk looping, so a very long trace simply stops. That's
 * a real limit, not a safety net to raise.
 */
export function P_PathTraverse(
  x1: number, y1: number, x2: number, y2: number,
  flags: number,
  trav: (i: Intercept) => boolean,
): boolean {
  earlyOut = (flags & PT_EARLYOUT) !== 0;
  traceValidCount++;
  interceptCount = 0;

  const bm = traceMap.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;

  // Nudge off exact block boundaries so the DDA can't sit on a line.
  if (((x1 - orgX) & (MAPBLOCKSIZE - 1)) === 0) x1 = (x1 + FRACUNIT) | 0;
  if (((y1 - orgY) & (MAPBLOCKSIZE - 1)) === 0) y1 = (y1 + FRACUNIT) | 0;

  trace.x = x1;
  trace.y = y1;
  trace.dx = (x2 - x1) | 0;
  trace.dy = (y2 - y1) | 0;

  x1 = (x1 - orgX) | 0;
  y1 = (y1 - orgY) | 0;
  const xt1 = x1 >> MAPBLOCKSHIFT;
  const yt1 = y1 >> MAPBLOCKSHIFT;

  x2 = (x2 - orgX) | 0;
  y2 = (y2 - orgY) | 0;
  const xt2 = x2 >> MAPBLOCKSHIFT;
  const yt2 = y2 >> MAPBLOCKSHIFT;

  let mapXStep: number;
  let mapYStep: number;
  let partial: number;
  let xStep: number;
  let yStep: number;

  if (xt2 > xt1) {
    mapXStep = 1;
    partial = FRACUNIT - ((x1 >> MAPBTOFRAC) & (FRACUNIT - 1));
    yStep = FixedDiv((y2 - y1) | 0, Math.abs(x2 - x1) | 0);
  } else if (xt2 < xt1) {
    mapXStep = -1;
    partial = (x1 >> MAPBTOFRAC) & (FRACUNIT - 1);
    yStep = FixedDiv((y2 - y1) | 0, Math.abs(x2 - x1) | 0);
  } else {
    mapXStep = 0;
    partial = FRACUNIT;
    yStep = 256 * FRACUNIT;
  }
  let yIntercept = ((y1 >> MAPBTOFRAC) + FixedMul(partial, yStep)) | 0;

  if (yt2 > yt1) {
    mapYStep = 1;
    partial = FRACUNIT - ((y1 >> MAPBTOFRAC) & (FRACUNIT - 1));
    xStep = FixedDiv((x2 - x1) | 0, Math.abs(y2 - y1) | 0);
  } else if (yt2 < yt1) {
    mapYStep = -1;
    partial = (y1 >> MAPBTOFRAC) & (FRACUNIT - 1);
    xStep = FixedDiv((x2 - x1) | 0, Math.abs(y2 - y1) | 0);
  } else {
    mapYStep = 0;
    partial = FRACUNIT;
    xStep = 256 * FRACUNIT;
  }
  let xIntercept = ((x1 >> MAPBTOFRAC) + FixedMul(partial, xStep)) | 0;

  let mapX = xt1;
  let mapY = yt1;

  for (let count = 0; count < 64; count++) {
    if (flags & PT_ADDLINES) {
      if (!traceBlockLines(mapX, mapY, PIT_AddLineIntercepts)) return false;
    }
    if (flags & PT_ADDTHINGS) {
      if (!P_BlockThingsIterator(mapX, mapY, PIT_AddThingIntercepts)) return false;
    }

    if (mapX === xt2 && mapY === yt2) break;

    if ((yIntercept >> FRACBITS) === mapY) {
      yIntercept = (yIntercept + yStep) | 0;
      mapX += mapXStep;
    } else if ((xIntercept >> FRACBITS) === mapX) {
      xIntercept = (xIntercept + xStep) | 0;
      mapY += mapYStep;
    }
  }

  return P_TraverseIntercepts(trav, FRACUNIT);
}
