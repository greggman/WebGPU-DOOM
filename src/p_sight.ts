// Line of sight. Ported from linuxdoom-1.10/p_sight.c.
//
// P_CheckSight answers "can t1 see t2" by walking the BSP along the ray between
// them and narrowing a vertical slope window at every two-sided line it crosses.
// If the window ever closes, sight is blocked. It is NOT a simple ray cast: the
// slope window is what lets a monster see you over a low wall but not through a
// door that's barely open.
//
// This is the gate on all monster AI — A_Look and A_Chase both hang off it.

import { FixedDiv, FixedMul, FRACBITS, MAXINT } from './m_fixed.js';
import type { DivLine } from './p_maputl.js';
import type { PMobj, PSector } from './p_local.js';
import type { PlaysimMap, PNode } from './p_setup.js';

const NF_SUBSECTOR = 0x8000;
const ML_TWOSIDED = 4;

let level: PlaysimMap;
export function P_SetSightLevel(l: PlaysimMap): void {
  level = l;
}

// The trace, shared as globals exactly as vanilla does.
const strace: DivLine = { x: 0, y: 0, dx: 0, dy: 0 };
let t2x = 0, t2y = 0;
let sightZStart = 0;
let topSlope = 0;
let bottomSlope = 0;
let sightValidCount = 0;

/**
 * P_DivlineSide: 0 front, 1 back, 2 exactly on the line.
 *
 * NOTE the `!node->dy` branch tests `x == node->y` — comparing X against Y.
 * That is a genuine bug in the shipped source (it should be `y == node->y`),
 * and it changes which side a point lands on for horizontal partitions. It
 * shipped, so monsters' sight has always behaved this way. Reproduced
 * deliberately; "fixing" it would be a gameplay change.
 */
export function P_DivlineSide(x: number, y: number, node: DivLine): number {
  if (node.dx === 0) {
    if (x === node.x) return 2;
    if (x <= node.x) return node.dy > 0 ? 1 : 0;
    return node.dy < 0 ? 1 : 0;
  }

  if (node.dy === 0) {
    if (x === node.y) return 2; // sic — vanilla's bug, kept
    if (y <= node.y) return node.dx < 0 ? 1 : 0;
    return node.dx > 0 ? 1 : 0;
  }

  const dx = (x - node.x) | 0;
  const dy = (y - node.y) | 0;

  // Plain 32-bit int multiplies of the shifted-down operands — NOT FixedMul.
  // Math.imul reproduces the C's wraparound exactly.
  const left = Math.imul(node.dy >> FRACBITS, dx >> FRACBITS);
  const right = Math.imul(dy >> FRACBITS, node.dx >> FRACBITS);

  if (right < left) return 0;
  if (left === right) return 2;
  return 1;
}

/** P_InterceptVector2 — same math as p_maputl's, kept separate as in vanilla. */
function P_InterceptVector2(v2: DivLine, v1: DivLine): number {
  const den = (FixedMul(v1.dy >> 8, v2.dx) - FixedMul(v1.dx >> 8, v2.dy)) | 0;
  if (den === 0) return 0;
  const num = (FixedMul((v1.x - v2.x) >> 8, v1.dy) + FixedMul((v2.y - v1.y) >> 8, v1.dx)) | 0;
  return FixedDiv(num, den);
}

/** P_CrossSubsector: narrow the slope window across one BSP leaf. */
function P_CrossSubsector(num: number): boolean {
  const map = level.source;
  const sub = map.subSectors[num];
  if (!sub) return true;

  for (let i = 0; i < sub.numSegs; i++) {
    const seg = map.segs[sub.firstSeg + i];
    if (!seg) continue;
    const line = level.lines[seg.lineDef];
    if (!line) continue;

    // Already checked from the other side?
    if (line.validCount === sightValidCount) continue;
    line.validCount = sightValidCount;

    let s1 = P_DivlineSide(line.v1x, line.v1y, strace);
    let s2 = P_DivlineSide(line.v2x, line.v2y, strace);
    if (s1 === s2) continue; // line isn't crossed

    const divl: DivLine = { x: line.v1x, y: line.v1y, dx: line.dx, dy: line.dy };
    s1 = P_DivlineSide(strace.x, strace.y, divl);
    s2 = P_DivlineSide(t2x, t2y, divl);
    if (s1 === s2) continue; // line isn't crossed

    // A one-sided line always blocks.
    if (!(line.flags & ML_TWOSIDED)) return false;

    const front = line.frontSector;
    const back = line.backSector;
    if (!front || !back) return false;

    // Nothing to block with — the floors and ceilings line up.
    if (front.floorHeight === back.floorHeight &&
        front.ceilingHeight === back.ceilingHeight) continue;

    const openTop = front.ceilingHeight < back.ceilingHeight
      ? front.ceilingHeight : back.ceilingHeight;
    const openBottom = front.floorHeight > back.floorHeight
      ? front.floorHeight : back.floorHeight;

    // Totally closed door.
    if (openBottom >= openTop) return false;

    const frac = P_InterceptVector2(strace, divl);

    if (front.floorHeight !== back.floorHeight) {
      const slope = FixedDiv((openBottom - sightZStart) | 0, frac);
      if (slope > bottomSlope) bottomSlope = slope;
    }
    if (front.ceilingHeight !== back.ceilingHeight) {
      const slope = FixedDiv((openTop - sightZStart) | 0, frac);
      if (slope < topSlope) topSlope = slope;
    }

    // The window closed: nothing can be seen through this gap.
    if (topSlope <= bottomSlope) return false;
  }

  return true;
}

/** P_CrossBSPNode. */
function P_CrossBSPNode(bspnum: number): boolean {
  if (bspnum & NF_SUBSECTOR) {
    if (bspnum === -1) return P_CrossSubsector(0);
    return P_CrossSubsector(bspnum & ~NF_SUBSECTOR);
  }

  const bsp: PNode = level.nodes[bspnum];
  if (!bsp) return true;

  let side = P_DivlineSide(strace.x, strace.y, bsp);
  if (side === 2) side = 0; // "on" the line crosses both

  if (!P_CrossBSPNode(bsp.children[side])) return false;

  // If the far point is on the same side, the ray never reaches the other half.
  if (side === P_DivlineSide(t2x, t2y, bsp)) return true;

  return P_CrossBSPNode(bsp.children[side ^ 1]);
}

/**
 * P_CheckSight.
 *
 * The eye is at 3/4 of t1's height (`z + height - height/4`), not its centre —
 * that's why a monster on a ledge can see over things a centre-line test would
 * say it can't.
 */
export function P_CheckSight(t1: PMobj, t2: PMobj): boolean {
  const map = level.source;

  // REJECT: a precomputed sector-pair visibility matrix. If it says these two
  // sectors can never see each other, stop — this is the fast path that makes
  // dozens of monsters checking sight every few tics affordable.
  const s1 = sectorNumOf(t1);
  const s2 = sectorNumOf(t2);
  const pnum = s1 * level.sectors.length + s2;
  const byteNum = pnum >> 3;
  const bitNum = 1 << (pnum & 7);
  if (map.reject.length > byteNum && (map.reject[byteNum] & bitNum)) return false;

  sightValidCount++;

  sightZStart = (t1.z + t1.height - (t1.height >> 2)) | 0;
  topSlope = (t2.z + t2.height - sightZStart) | 0;
  bottomSlope = (t2.z - sightZStart) | 0;

  strace.x = t1.x;
  strace.y = t1.y;
  t2x = t2.x;
  t2y = t2.y;
  strace.dx = (t2.x - t1.x) | 0;
  strace.dy = (t2.y - t1.y) | 0;

  return P_CrossBSPNode(level.nodes.length - 1);
}

function sectorNumOf(mo: PMobj): number {
  return mo.sector ? mo.sector.index : 0;
}
