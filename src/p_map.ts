// Movement and collision. Ported from linuxdoom-1.10/p_map.c.
//
// The shape here is vanilla's and looks odd by modern standards: the checks
// communicate through module-level globals (tmfloorz, tmceilingz, ...) that the
// PIT_ callbacks mutate as the blockmap iterator walks. That IS the algorithm —
// P_CheckPosition doesn't just answer yes/no, it leaves behind the floor and
// ceiling the mobj would have at the target, which P_TryMove then commits. Keep
// the globals; restructuring them into return values changes evaluation order
// and with it the game.

import { FixedMul, FixedDiv, FRACUNIT } from './m_fixed.js';
import { blockLines, MAPBLOCKSHIFT, type DoomMap } from './map.js';
import {
  P_BoxOnLineSide, P_LineOpening, P_PointOnLineSide, P_AproxDistance,
  P_PathTraverse, PT_ADDLINES, PT_ADDTHINGS, P_SetTraceLevel,
  BOXTOP, BOXBOTTOM, BOXLEFT, BOXRIGHT,
  type Intercept,
} from './p_maputl.js';
import { finesine, finecosine, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import { P_BlockThingsIterator, P_SetThingPosition, P_UnsetThingPosition } from './p_blockmap.js';
import { R_PointToAngle2, ANG180 } from './r_point.js';
import { MAXRADIUS, SlopeType, type PLine, type PMobj, type PSector } from './p_local.js';
import { P_SetMobjState, P_RemoveMobj, P_SpawnPuff, P_SpawnBlood } from './p_mobj.js';
import { P_CheckSight } from './p_sight.js';
import { trace } from './p_maputl.js';
import { MF, MT, S, mobjInfo } from './info.js';
import { P_Random } from './m_random.js';
import { S_StartSound } from './s_sound.js';

/** p_local.h. */
const MELEERANGE = 64 * FRACUNIT;
import type { PlaysimMap } from './p_setup.js';

/** doomdata.h. */
export const ML_BLOCKING = 1;
export const ML_BLOCKMONSTERS = 2;

/** p_map.c MAXSPECIALCROSS. */
const MAXSPECIALCROSS = 8;

// --- the tm* globals, exactly as vanilla ------------------------------------
let tmThing: PMobj;
let tmFlags = 0;
let tmX = 0, tmY = 0;
const tmBBox: [number, number, number, number] = [0, 0, 0, 0];

/** Floor/ceiling the mobj would have at the target — P_TryMove commits these. */
export let tmFloorZ = 0;
export let tmCeilingZ = 0;
export let tmDropoffZ = 0;
export let ceilingLine: PLine | null = null;
export let floatOk = false;

/** Special lines touched during the check, replayed by P_TryMove if crossed. */
const specHit: PLine[] = [];
let numSpecHit = 0;

/** Bumped per check so each line is only visited once across blockmap cells. */
let validCount = 0;

let level: PlaysimMap;
let map: DoomMap;

export interface MapEnv {
  sectorAt: (x: number, y: number) => PSector;
  /** p_spec.c P_CrossSpecialLine — fired when a move crosses a trigger. */
  crossSpecialLine?: (lineIndex: number, side: number, thing: PMobj) => void;
  /** p_spec.c P_UseSpecialLine — fired by the use key. */
  useSpecialLine?: (thing: PMobj, line: PLine, side: number) => void;
  /** p_inter.c P_TouchSpecialThing — fired when a MF_PICKUP mobj overlaps an item. */
  touchSpecialThing?: (special: PMobj, toucher: PMobj) => void;
}
let mapEnv: MapEnv;

export function P_SetMapLevel(l: PlaysimMap, e: MapEnv): void {
  level = l;
  map = l.source;
  mapEnv = e;
  validCount = 0;
  P_SetTraceLevel(l);
}

/**
 * PIT_CheckLine. Returns false to abort the whole check (blocked); true to
 * continue, having possibly tightened tmFloorZ/tmCeilingZ.
 */
function PIT_CheckLine(ld: PLine): boolean {
  // Bounding boxes don't overlap — can't touch.
  if (tmBBox[BOXRIGHT] <= ld.bbox[BOXLEFT] ||
      tmBBox[BOXLEFT] >= ld.bbox[BOXRIGHT] ||
      tmBBox[BOXTOP] <= ld.bbox[BOXBOTTOM] ||
      tmBBox[BOXBOTTOM] >= ld.bbox[BOXTOP]) {
    return true;
  }

  // Entirely on one side — not crossed.
  if (P_BoxOnLineSide(tmBBox, ld) !== -1) return true;

  // A line has been hit.
  if (!ld.backSector) return false; // one-sided: solid

  if (!(tmFlags & MF.MF_MISSILE)) {
    if (ld.flags & ML_BLOCKING) return false;
    if (!tmThing.player && (ld.flags & ML_BLOCKMONSTERS)) return false;
  }

  const open = P_LineOpening(ld);

  if (open.top < tmCeilingZ) {
    tmCeilingZ = open.top;
    ceilingLine = ld;
  }
  if (open.bottom > tmFloorZ) tmFloorZ = open.bottom;
  if (open.lowFloor < tmDropoffZ) tmDropoffZ = open.lowFloor;

  // Vanilla writes spechit[numspechit++] with no bounds check — overrunning it
  // is the famous linedef-crossing overflow. We cap instead: the overflow's
  // actual effect depends on adjacent stack layout, which cannot be reproduced
  // meaningfully here, and no vanilla demo in the shareware WAD relies on it.
  if (ld.special) {
    if (numSpecHit < MAXSPECIALCROSS) specHit[numSpecHit++] = ld;
  }

  return true;
}

/**
 * PIT_CheckThing. Decides whether tmThing may occupy a cell already holding
 * `thing`: skull-slam damage, missile impact/pass-through, item pickup, then
 * plain solidity. The slam and missile branches draw P_Random, so their order
 * relative to everything else is demo-observable.
 */
function PIT_CheckThing(thing: PMobj): boolean {
  if (!(thing.flags & (MF.MF_SOLID | MF.MF_SPECIAL | MF.MF_SHOOTABLE))) return true;

  const blockDist = (thing.radius + tmThing.radius) | 0;
  if (Math.abs(thing.x - tmX) >= blockDist || Math.abs(thing.y - tmY) >= blockDist) {
    return true; // missed
  }

  // Don't clip against yourself. Note this is checked AFTER the distance test,
  // exactly as vanilla — it matters only because the order is observable.
  if (thing === tmThing) return true;

  // A charging lost soul (MF_SKULLFLY) slams whatever it reaches, then drops
  // out of its charge back to idle.
  if (tmThing.flags & MF.MF_SKULLFLY) {
    const dmg = ((P_Random() % 8) + 1) * mobjInfo[tmThing.type].damage;
    shootEnv.damageMobj?.(thing, tmThing, tmThing, dmg);
    tmThing.flags &= ~MF.MF_SKULLFLY;
    tmThing.momx = tmThing.momy = tmThing.momz = 0;
    P_SetMobjState(tmThing, mobjInfo[tmThing.type].spawnState);
    return false; // stop moving
  }

  // Missiles fly over/under things, pass through their own shooter and through
  // same-species monsters, and damage everything else. Without this a fireball
  // collided with the imp that fired it and exploded at birth.
  if (tmThing.flags & MF.MF_MISSILE) {
    if (tmThing.z > thing.z + thing.height) return true;    // overhead
    if (tmThing.z + tmThing.height < thing.z) return true;  // underneath

    if (tmThing.target && (
      tmThing.target.type === thing.type ||
      (tmThing.target.type === MT.MT_KNIGHT && thing.type === MT.MT_BRUISER) ||
      (tmThing.target.type === MT.MT_BRUISER && thing.type === MT.MT_KNIGHT))) {
      if (thing === tmThing.target) return true;       // never the shooter itself
      if (thing.type !== MT.MT_PLAYER) return false;   // explode on kin, no damage
    }

    if (!(thing.flags & MF.MF_SHOOTABLE)) return !(thing.flags & MF.MF_SOLID);

    const dmg = ((P_Random() % 8) + 1) * mobjInfo[tmThing.type].damage;
    shootEnv.damageMobj?.(thing, tmThing, tmThing.target, dmg);
    return false; // stop traversing
  }

  if (thing.flags & MF.MF_SPECIAL) {
    // Only things with MF_PICKUP collect items — that's the player. A monster
    // walks over a medikit without taking it.
    const solid = (thing.flags & MF.MF_SOLID) !== 0;
    if (tmFlags & MF.MF_PICKUP) {
      mapEnv.touchSpecialThing?.(thing, tmThing);
    }
    return !solid;
  }

  return !(thing.flags & MF.MF_SOLID);
}

/** p_maputl.c P_BlockLinesIterator, with validcount dedup. */
function blockLinesIterator(bx: number, by: number, fn: (l: PLine) => boolean): boolean {
  for (const li of blockLines(map, bx, by)) {
    const ld = level.lines[li];
    if (!ld) continue;
    // A line spans several cells; validcount stops it being tested twice.
    if (ld.validCount === validCount) continue;
    ld.validCount = validCount;
    if (!fn(ld)) return false;
  }
  return true;
}

/**
 * P_CheckPosition. Answers "could thing stand at (x,y)" AND leaves tmFloorZ /
 * tmCeilingZ / tmDropoffZ describing the space there.
 */
export function P_CheckPosition(thing: PMobj, x: number, y: number): boolean {
  tmThing = thing;
  tmFlags = thing.flags;
  tmX = x;
  tmY = y;

  tmBBox[BOXTOP] = (y + thing.radius) | 0;
  tmBBox[BOXBOTTOM] = (y - thing.radius) | 0;
  tmBBox[BOXRIGHT] = (x + thing.radius) | 0;
  tmBBox[BOXLEFT] = (x - thing.radius) | 0;

  // Base floor/ceiling come from the subsector under the point; contacted lines
  // then narrow them.
  const sec = mapEnv.sectorAt(x, y);
  ceilingLine = null;
  tmFloorZ = tmDropoffZ = sec.floorHeight;
  tmCeilingZ = sec.ceilingHeight;

  validCount++;
  numSpecHit = 0;

  if (tmFlags & MF.MF_NOCLIP) return true;

  // MAPBLOCKSHIFT is FRACBITS+7, so this takes a fixed_t straight to a block
  // index. bmaporgx/y are the blockmap origin shifted into fixed_t.
  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;

  // Things first, and the box is widened by MAXRADIUS: mobjs are filed in the
  // blockmap by their ORIGIN, so a wide thing whose origin sits in the next
  // cell can still overlap this one.
  {
    const txl = (tmBBox[BOXLEFT] - orgX - MAXRADIUS) >> MAPBLOCKSHIFT;
    const txh = (tmBBox[BOXRIGHT] - orgX + MAXRADIUS) >> MAPBLOCKSHIFT;
    const tyl = (tmBBox[BOXBOTTOM] - orgY - MAXRADIUS) >> MAPBLOCKSHIFT;
    const tyh = (tmBBox[BOXTOP] - orgY + MAXRADIUS) >> MAPBLOCKSHIFT;
    for (let bx = txl; bx <= txh; bx++) {
      for (let by = tyl; by <= tyh; by++) {
        if (!P_BlockThingsIterator(bx, by, PIT_CheckThing)) return false;
      }
    }
  }
  const xl = (tmBBox[BOXLEFT] - orgX) >> MAPBLOCKSHIFT;
  const xh = (tmBBox[BOXRIGHT] - orgX) >> MAPBLOCKSHIFT;
  const yl = (tmBBox[BOXBOTTOM] - orgY) >> MAPBLOCKSHIFT;
  const yh = (tmBBox[BOXTOP] - orgY) >> MAPBLOCKSHIFT;

  for (let bx = xl; bx <= xh; bx++) {
    for (let by = yl; by <= yh; by++) {
      if (!blockLinesIterator(bx, by, PIT_CheckLine)) return false;
    }
  }

  return true;
}

/** p_map.c: the step a mobj can climb, and the drop it refuses to walk off. */
export const MAXSTEP = 24 * FRACUNIT;

/**
 * Special lines the last P_CheckPosition touched. p_enemy.c reads this after a
 * failed P_Move so a blocked monster can try to open what stopped it — that's
 * the whole mechanism by which monsters open doors.
 */
export function P_TakeSpecHits(): { lineIndex: number }[] {
  const out: { lineIndex: number }[] = [];
  for (let i = 0; i < numSpecHit; i++) out.push({ lineIndex: specHit[i].index });
  return out;
}

/**
 * P_TryMove. Commits a move if the target is legal, and fires any special lines
 * crossed on the way.
 */
export function P_TryMove(thing: PMobj, x: number, y: number): boolean {
  floatOk = false;

  if (!P_CheckPosition(thing, x, y)) return false;

  if (!(thing.flags & MF.MF_NOCLIP)) {
    if (tmCeilingZ - tmFloorZ < thing.height) return false; // doesn't fit
    floatOk = true;

    if (!(thing.flags & MF.MF_TELEPORT) && tmCeilingZ - thing.z < thing.height) {
      return false; // would have to duck
    }
    if (!(thing.flags & MF.MF_TELEPORT) && tmFloorZ - thing.z > MAXSTEP) {
      return false; // step too high
    }
    if (!(thing.flags & (MF.MF_DROPOFF | MF.MF_FLOAT)) && tmFloorZ - tmDropoffZ > MAXSTEP) {
      return false; // won't stand over a ledge
    }
  }

  // The move is legal — relink into the new sector/blockmap cell.
  P_UnsetThingPosition(thing);

  const oldX = thing.x;
  const oldY = thing.y;

  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;
  thing.x = x;
  thing.y = y;

  P_SetThingPosition(thing);

  // Special lines fire only when the move actually crossed them. Vanilla walks
  // spechit BACKWARDS (while (numspechit--)), so triggers fire in reverse
  // contact order — visible when one move crosses two triggers.
  if (!(thing.flags & (MF.MF_TELEPORT | MF.MF_NOCLIP))) {
    while (numSpecHit-- > 0) {
      const ld = specHit[numSpecHit];
      const side = P_PointOnLineSide(thing.x, thing.y, ld);
      const oldSide = P_PointOnLineSide(oldX, oldY, ld);
      if (side !== oldSide && ld.special) {
        mapEnv.crossSpecialLine?.(ld.index, oldSide, thing);
      }
    }
    numSpecHit = 0;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Hitscan. p_map.c P_AimLineAttack / P_LineAttack.
// ---------------------------------------------------------------------------

let shootThing: PMobj;
let shootZ = 0;
let attackRange = 0;
let aimSlope = 0;
let topSlope = 0;
let bottomSlope = 0;
let laDamage = 0;

/** The thing P_AimLineAttack locked onto, or null. */
export let lineTarget: PMobj | null = null;

/**
 * PTR_AimTraverse: narrow a vertical slope window until something shootable
 * falls inside it. This is DOOM's auto-aim — the player never aims vertically,
 * the engine finds a target within the window and shoots at it.
 */
function PTR_AimTraverse(inter: Intercept): boolean {
  if (inter.isALine) {
    const li = inter.line!;
    if (!(li.flags & ML_TWOSIDED)) return false; // solid: stop

    const open = P_LineOpening(li);
    if (open.bottom >= open.top) return false; // closed: stop

    const dist = FixedMul(attackRange, inter.frac);

    if (li.frontSector!.floorHeight !== li.backSector!.floorHeight) {
      const slope = FixedDiv((open.bottom - shootZ) | 0, dist);
      if (slope > bottomSlope) bottomSlope = slope;
    }
    if (li.frontSector!.ceilingHeight !== li.backSector!.ceilingHeight) {
      const slope = FixedDiv((open.top - shootZ) | 0, dist);
      if (slope < topSlope) topSlope = slope;
    }

    if (topSlope <= bottomSlope) return false;
    return true; // shot continues
  }

  const th = inter.thing!;
  if (th === shootThing) return true;              // can't shoot yourself
  if (!(th.flags & MF.MF_SHOOTABLE)) return true;  // corpse, decoration

  const dist = FixedMul(attackRange, inter.frac);
  let thingTopSlope = FixedDiv((th.z + th.height - shootZ) | 0, dist);
  if (thingTopSlope < bottomSlope) return true;    // shot goes over it

  let thingBottomSlope = FixedDiv((th.z - shootZ) | 0, dist);
  if (thingBottomSlope > topSlope) return true;    // shot goes under it

  if (thingTopSlope > topSlope) thingTopSlope = topSlope;
  if (thingBottomSlope < bottomSlope) thingBottomSlope = bottomSlope;

  // Aim at the middle of whatever part of it is visible.
  aimSlope = ((thingTopSlope + thingBottomSlope) / 2) | 0;
  lineTarget = th;
  return false; // found one, stop
}

/**
 * P_AimLineAttack. Returns the slope to shoot at, and leaves `lineTarget` set.
 *
 * The initial window is +/- 100/160 — that's DOOM's fixed vertical autoaim
 * cone, derived from the 320x200 view. It's why you can't shoot a target
 * far above or below you no matter where it is.
 */
export function P_AimLineAttack(t1: PMobj, angle: number, distance: number): number {
  const fine = (angle >>> ANGLETOFINESHIFT) & FINEMASK;
  shootThing = t1;

  // (distance>>FRACBITS) * finecosine — integer times fixed_t, not FixedMul.
  const x2 = (t1.x + (distance >> 16) * finecosine[fine]) | 0;
  const y2 = (t1.y + (distance >> 16) * finesine[fine]) | 0;
  shootZ = (t1.z + (t1.height >> 1) + 8 * FRACUNIT) | 0;

  topSlope = ((100 * FRACUNIT) / 160) | 0;
  bottomSlope = ((-100 * FRACUNIT) / 160) | 0;

  attackRange = distance;
  lineTarget = null;

  P_PathTraverse(t1.x, t1.y, x2, y2, PT_ADDLINES | PT_ADDTHINGS, PTR_AimTraverse);

  return lineTarget ? aimSlope : 0;
}

export interface ShootEnv {
  /** p_inter.c P_DamageMobj. */
  damageMobj?: (target: PMobj, inflictor: PMobj | null, source: PMobj | null, damage: number) => void;
}
let shootEnv: ShootEnv = {};
export function P_SetShootEnv(e: ShootEnv): void {
  shootEnv = e;
}

/** PTR_ShootTraverse. Puffs and blood need p_mobj spawns; damage is wired. */
function PTR_ShootTraverse(inter: Intercept): boolean {
  if (inter.isALine) {
    const li = inter.line!;

    if (li.special) {
      // P_ShootSpecialLine — shootable switches.
    }

    // Decide whether the shot passes THROUGH this line (a two-sided gap it fits)
    // or HITS it (a solid wall, or the upper/lower step of a two-sided line the
    // shot's slope runs into). Vanilla lumps both hit cases into `hitline`, which
    // spawns a puff — so a two-sided hit must spawn one too, not silently stop.
    let hit = !(li.flags & ML_TWOSIDED);

    if (!hit) {
      const open = P_LineOpening(li);
      const dist = FixedMul(attackRange, inter.frac);

      if (li.frontSector!.floorHeight !== li.backSector!.floorHeight) {
        const slope = FixedDiv((open.bottom - shootZ) | 0, dist);
        if (slope > aimSlope) hit = true;
      }
      if (!hit && li.frontSector!.ceilingHeight !== li.backSector!.ceilingHeight) {
        const slope = FixedDiv((open.top - shootZ) | 0, dist);
        if (slope < aimSlope) hit = true;
      }
    }

    if (!hit) return true; // through the gap

    // hitline: spark where it landed, backed off 4 units so the puff isn't
    // inside the surface.
    const frac = (inter.frac - FixedDiv(4 * FRACUNIT, attackRange)) | 0;
    const x = (trace.x + FixedMul(trace.dx, frac)) | 0;
    const y = (trace.y + FixedMul(trace.dy, frac)) | 0;
    const z = (shootZ + FixedMul(aimSlope, FixedMul(frac, attackRange))) | 0;
    P_SpawnPuff(x, y, z, attackRange === MELEERANGE);
    return false;
  }

  const th = inter.thing!;
  if (th === shootThing) return true;
  if (!(th.flags & MF.MF_SHOOTABLE)) return true;

  const dist = FixedMul(attackRange, inter.frac);
  const thingTopSlope = FixedDiv((th.z + th.height - shootZ) | 0, dist);
  if (thingTopSlope < aimSlope) return true;   // over it

  const thingBottomSlope = FixedDiv((th.z - shootZ) | 0, dist);
  if (thingBottomSlope > aimSlope) return true; // under it

  // Hit. Back off 10 units along the trace so the effect isn't inside it.
  const frac = (inter.frac - FixedDiv(10 * FRACUNIT, attackRange)) | 0;
  const x = (trace.x + FixedMul(trace.dx, frac)) | 0;
  const y = (trace.y + FixedMul(trace.dy, frac)) | 0;
  const z = (shootZ + FixedMul(aimSlope, FixedMul(frac, attackRange))) | 0;

  // Blood on flesh, sparks on everything else. Both draw P_Random, so they are
  // NOT cosmetic — skipping them shifts the sequence.
  if (th.flags & MF.MF_NOBLOOD) {
    P_SpawnPuff(x, y, z, attackRange === MELEERANGE);
  } else {
    P_SpawnBlood(x, y, z, laDamage);
  }

  if (laDamage && shootEnv.damageMobj) {
    shootEnv.damageMobj(th, shootThing, shootThing, laDamage);
  }
  return false; // stop at the first thing hit
}

/** P_LineAttack. damage == 0 is a pure trace that just sets lineTarget. */
export function P_LineAttack(
  t1: PMobj, angle: number, distance: number, slope: number, damage: number,
): void {
  const fine = (angle >>> ANGLETOFINESHIFT) & FINEMASK;
  shootThing = t1;
  laDamage = damage;
  const x2 = (t1.x + (distance >> 16) * finecosine[fine]) | 0;
  const y2 = (t1.y + (distance >> 16) * finesine[fine]) | 0;
  shootZ = (t1.z + (t1.height >> 1) + 8 * FRACUNIT) | 0;
  attackRange = distance;
  aimSlope = slope;

  P_PathTraverse(t1.x, t1.y, x2, y2, PT_ADDLINES | PT_ADDTHINGS, PTR_ShootTraverse);
}

// ---------------------------------------------------------------------------
// Teleporting. p_map.c P_TeleportMove / PIT_StompThing.
// ---------------------------------------------------------------------------

/**
 * PIT_StompThing: the telefrag. Anything standing on the destination takes
 * 10000 damage — that's not a large number, it's a guaranteed kill regardless
 * of what it is.
 */
function PIT_StompThing(thing: PMobj): boolean {
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;

  const blockDist = (thing.radius + tmThing.radius) | 0;
  if (Math.abs(thing.x - tmX) >= blockDist || Math.abs(thing.y - tmY) >= blockDist) {
    return true; // missed
  }
  if (thing === tmThing) return true;

  // Only the PLAYER telefrags. A monster teleporting onto something just fails
  // to move (except on Doom 2's map30, which we don't have).
  if (!tmThing.player) return false;

  shootEnv.damageMobj?.(thing, tmThing, tmThing, 10000);
  return true;
}

/** P_TeleportMove: move ignoring walls, killing whatever's there. */
export function P_TeleportMove(thing: PMobj, x: number, y: number): boolean {
  tmThing = thing;
  tmFlags = thing.flags;
  tmX = x;
  tmY = y;

  tmBBox[BOXTOP] = (y + thing.radius) | 0;
  tmBBox[BOXBOTTOM] = (y - thing.radius) | 0;
  tmBBox[BOXRIGHT] = (x + thing.radius) | 0;
  tmBBox[BOXLEFT] = (x - thing.radius) | 0;

  const sec = mapEnv.sectorAt(x, y);
  ceilingLine = null;
  tmFloorZ = tmDropoffZ = sec.floorHeight;
  tmCeilingZ = sec.ceilingHeight;

  validCount++;
  numSpecHit = 0;

  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;
  const xl = (tmBBox[BOXLEFT] - orgX - MAXRADIUS) >> MAPBLOCKSHIFT;
  const xh = (tmBBox[BOXRIGHT] - orgX + MAXRADIUS) >> MAPBLOCKSHIFT;
  const yl = (tmBBox[BOXBOTTOM] - orgY - MAXRADIUS) >> MAPBLOCKSHIFT;
  const yh = (tmBBox[BOXTOP] - orgY + MAXRADIUS) >> MAPBLOCKSHIFT;

  for (let bx = xl; bx <= xh; bx++) {
    for (let by = yl; by <= yh; by++) {
      if (!P_BlockThingsIterator(bx, by, PIT_StompThing)) return false;
    }
  }

  // NOTE: no line checks at all — a teleport ignores walls entirely.
  P_UnsetThingPosition(thing);
  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;
  thing.x = x;
  thing.y = y;
  P_SetThingPosition(thing);

  return true;
}

// ---------------------------------------------------------------------------
// Splash damage. p_map.c P_RadiusAttack.
// ---------------------------------------------------------------------------

let bombSpot: PMobj;
let bombSource: PMobj | null = null;
let bombDamage = 0;

/** PIT_RadiusAttack. */
function PIT_RadiusAttack(thing: PMobj): boolean {
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;

  // The Cyberdemon and Spider Mastermind are immune to splash. That's why you
  // can't rocket-spam them — it's a hardcoded type check, not a flag.
  if (thing.type === MT.MT_CYBORG || thing.type === MT.MT_SPIDER) return true;

  const dx = Math.abs(thing.x - bombSpot.x);
  const dy = Math.abs(thing.y - bombSpot.y);

  // Distance is max(dx,dy), NOT a real distance — so DOOM's blast radius is a
  // SQUARE. Corners of the box take damage the same as the axes.
  let dist = dx > dy ? dx : dy;
  dist = (dist - thing.radius) >> 16;
  if (dist < 0) dist = 0;
  if (dist >= bombDamage) return true; // out of range

  // Damage falls off linearly, and requires line of sight — you can hide
  // behind a pillar from a rocket.
  if (P_CheckSight(thing, bombSpot)) {
    shootEnv.damageMobj?.(thing, bombSpot, bombSource, bombDamage - dist);
  }
  return true;
}

/** P_RadiusAttack. */
export function P_RadiusAttack(spot: PMobj, source: PMobj | null, damage: number): void {
  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;

  const dist = (damage + 32) << 16; // damage + MAXRADIUS in map units
  const yh = (spot.y + dist - orgY) >> MAPBLOCKSHIFT;
  const yl = (spot.y - dist - orgY) >> MAPBLOCKSHIFT;
  const xh = (spot.x + dist - orgX) >> MAPBLOCKSHIFT;
  const xl = (spot.x - dist - orgX) >> MAPBLOCKSHIFT;

  bombSpot = spot;
  bombSource = source;
  bombDamage = damage;

  for (let y = yl; y <= yh; y++) {
    for (let x = xl; x <= xh; x++) P_BlockThingsIterator(x, y, PIT_RadiusAttack);
  }
}

// ---------------------------------------------------------------------------
// Sector height changes. p_map.c P_ChangeSector / P_ThingHeightClip.
// ---------------------------------------------------------------------------

let noFit = false;
let crushChange = false;

/**
 * P_ThingHeightClip: re-fit a mobj after the floor or ceiling moved under it.
 * Returns false if it no longer fits at all (i.e. it's being crushed).
 */
export function P_ThingHeightClip(thing: PMobj): boolean {
  const onFloor = thing.z === thing.floorZ;

  // Re-run the position check purely for its tmFloorZ/tmCeilingZ side effects.
  P_CheckPosition(thing, thing.x, thing.y);
  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;

  if (onFloor) {
    // Something standing on the floor rides it up or down.
    thing.z = thing.floorZ;
  } else {
    // A floating thing only moves if the ceiling forces it.
    if (thing.z + thing.height > thing.ceilingZ) {
      thing.z = (thing.ceilingZ - thing.height) | 0;
    }
  }

  return thing.ceilingZ - thing.floorZ >= thing.height;
}

/** PIT_ChangeSector. */
function PIT_ChangeSector(thing: PMobj): boolean {
  if (P_ThingHeightClip(thing)) return true; // still fits

  // Crushing a corpse turns it to gibs. Needs S_GIBS and P_SetMobjState.
  if (thing.health <= 0) {
    P_SetMobjState(thing, S.S_GIBS);
    thing.flags &= ~MF.MF_SOLID;
    thing.height = 0;
    thing.radius = 0;
    return true;
  }

  // Dropped items just vanish rather than block a door forever.
  if (thing.flags & MF.MF_DROPPED) {
    P_RemoveMobj(thing);
    return true;
  }

  // Anything unshootable (decorations) doesn't stop the plane.
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;

  noFit = true;

  // Damage every 4th tic while crushing. P_DamageMobj and the blood spray
  // (which draws P_Random twice) land here once p_inter exists.

  return true;
}

/**
 * P_ChangeSector: a plane moved — re-fit everything in the sector, and report
 * whether anything is stuck. Walks the sector's precomputed blockbox rather
 * than its thing list, because a mobj straddling the boundary belongs to a
 * neighbouring sector but still gets squashed.
 */
export function P_ChangeSector(sector: PSector, crunch: boolean): boolean {
  noFit = false;
  crushChange = crunch;

  for (let x = sector.blockBox[BOXLEFT]; x <= sector.blockBox[BOXRIGHT]; x++) {
    for (let y = sector.blockBox[BOXBOTTOM]; y <= sector.blockBox[BOXTOP]; y++) {
      P_BlockThingsIterator(x, y, PIT_ChangeSector);
    }
  }

  return noFit;
}

// ---------------------------------------------------------------------------
// Using things. p_map.c P_UseLines / PTR_UseTraverse.
// ---------------------------------------------------------------------------

/** p_local.h. */
export const USERANGE = 64 * FRACUNIT;

let useThing: PMobj;

/**
 * PTR_UseTraverse. Stops at the first line it can't see through, so you can't
 * open a door through a wall.
 */
function PTR_UseTraverse(inter: Intercept): boolean {
  const li = inter.line;
  if (!li) return true;

  if (!li.special) {
    const open = P_LineOpening(li);
    // Solid, no special: the player grunts (can't use through a wall) and the
    // ray stops. p_map.c PTR_UseTraverse: S_StartSound(usething, sfx_noway).
    if (open.range <= 0) { S_StartSound(useThing, 'sfx_noway'); return false; }
    return true; // see through it and keep looking
  }

  let side = 0;
  if (P_PointOnLineSide(useThing.x, useThing.y, li) === 1) side = 1;

  mapEnv.useSpecialLine?.(useThing, li, side);

  // Only ever activate ONE line per use press.
  return false;
}

/** P_UseLines: cast a 64-unit ray from the player's face. */
export function P_UseLines(player: { mo: PMobj | null }): void {
  const mo = player.mo;
  if (!mo) return;
  useThing = mo;

  const angle = (mo.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  const x1 = mo.x;
  const y1 = mo.y;
  // Note (USERANGE>>FRACBITS) * finecosine — an integer times a fixed_t, NOT a
  // FixedMul. Vanilla scales the unit vector by 64 directly.
  const x2 = (x1 + (USERANGE >> 16) * finecosine[angle]) | 0;
  const y2 = (y1 + (USERANGE >> 16) * finesine[angle]) | 0;

  P_PathTraverse(x1, y1, x2, y2, PT_ADDLINES, PTR_UseTraverse);
}

// ---------------------------------------------------------------------------
// Sliding along walls. p_map.c P_SlideMove / P_HitSlideLine.
// ---------------------------------------------------------------------------

let slideMo: PMobj;
let bestSlideFrac = 0;
let bestSlideLine: PLine | null = null;
let tmXMove = 0;
let tmYMove = 0;

/** doomdata.h. */
const ML_TWOSIDED = 4;

/**
 * P_HitSlideLine: project the leftover move onto the wall so the player slides
 * instead of stopping dead. This is what makes DOOM's movement feel the way it
 * does against geometry.
 */
function P_HitSlideLine(ld: PLine): void {
  // Axis-aligned walls just zero the blocked component.
  if (ld.slopeType === SlopeType.Horizontal) { tmYMove = 0; return; }
  if (ld.slopeType === SlopeType.Vertical) { tmXMove = 0; return; }

  const side = P_PointOnLineSide(slideMo.x, slideMo.y, ld);

  let lineAngle = R_PointToAngle2(0, 0, ld.dx, ld.dy);
  if (side === 1) lineAngle = (lineAngle + ANG180) >>> 0;

  const moveAngle = R_PointToAngle2(0, 0, tmXMove, tmYMove);
  let deltaAngle = (moveAngle - lineAngle) >>> 0;
  if (deltaAngle > ANG180) deltaAngle = (deltaAngle + ANG180) >>> 0;

  const lineFine = (lineAngle >>> ANGLETOFINESHIFT) & FINEMASK;
  const deltaFine = (deltaAngle >>> ANGLETOFINESHIFT) & FINEMASK;

  const moveLen = P_AproxDistance(tmXMove, tmYMove);
  const newLen = FixedMul(moveLen, finecosine[deltaFine]);

  tmXMove = FixedMul(newLen, finecosine[lineFine]);
  tmYMove = FixedMul(newLen, finesine[lineFine]);
}

/** PTR_SlideTraverse: find the nearest blocking line along the move. */
function PTR_SlideTraverse(inter: Intercept): boolean {
  const li = inter.line;
  if (!inter.isALine || !li) return true;

  let blocking: boolean;

  if (!(li.flags & ML_TWOSIDED)) {
    // The back of a one-sided line doesn't block — you're already past it.
    if (P_PointOnLineSide(slideMo.x, slideMo.y, li)) return true;
    blocking = true;
  } else {
    const open = P_LineOpening(li);
    blocking =
      open.range < slideMo.height ||                 // doesn't fit
      open.top - slideMo.z < slideMo.height ||       // too high
      open.bottom - slideMo.z > MAXSTEP;             // step too big
  }

  if (!blocking) return true;

  if (inter.frac < bestSlideFrac) {
    bestSlideFrac = inter.frac;
    bestSlideLine = li;
  }
  return false; // stop
}

/** The fallback: try each axis alone so corners don't lock you solid. */
function stairStep(mo: PMobj): void {
  if (!P_TryMove(mo, mo.x, (mo.y + mo.momy) | 0)) {
    P_TryMove(mo, (mo.x + mo.momx) | 0, mo.y);
  }
}

/**
 * P_SlideMove. Move, and on contact project the remainder along the wall —
 * up to three attempts, then stair-step.
 */
export function P_SlideMove(mo: PMobj): void {
  slideMo = mo;
  let hitCount = 0;

  for (;;) {
    if (++hitCount === 3) { stairStep(mo); return; }

    // Trace from the LEADING corners of the bounding box, not the centre —
    // that's what gives the mobj its radius instead of treating it as a point.
    let leadX: number, trailX: number;
    if (mo.momx > 0) { leadX = (mo.x + mo.radius) | 0; trailX = (mo.x - mo.radius) | 0; }
    else { leadX = (mo.x - mo.radius) | 0; trailX = (mo.x + mo.radius) | 0; }

    let leadY: number, trailY: number;
    if (mo.momy > 0) { leadY = (mo.y + mo.radius) | 0; trailY = (mo.y - mo.radius) | 0; }
    else { leadY = (mo.y - mo.radius) | 0; trailY = (mo.y + mo.radius) | 0; }

    bestSlideFrac = FRACUNIT + 1;
    bestSlideLine = null;

    P_PathTraverse(leadX, leadY, (leadX + mo.momx) | 0, (leadY + mo.momy) | 0,
                   PT_ADDLINES, PTR_SlideTraverse);
    P_PathTraverse(trailX, leadY, (trailX + mo.momx) | 0, (leadY + mo.momy) | 0,
                   PT_ADDLINES, PTR_SlideTraverse);
    P_PathTraverse(leadX, trailY, (leadX + mo.momx) | 0, (trailY + mo.momy) | 0,
                   PT_ADDLINES, PTR_SlideTraverse);

    if (bestSlideFrac === FRACUNIT + 1) { stairStep(mo); return; }

    // Back off slightly so we never land exactly on the line.
    bestSlideFrac = (bestSlideFrac - 0x800) | 0;
    if (bestSlideFrac > 0) {
      const newX = FixedMul(mo.momx, bestSlideFrac);
      const newY = FixedMul(mo.momy, bestSlideFrac);
      if (!P_TryMove(mo, (mo.x + newX) | 0, (mo.y + newY) | 0)) { stairStep(mo); return; }
    }

    bestSlideFrac = (FRACUNIT - (bestSlideFrac + 0x800)) | 0;
    if (bestSlideFrac > FRACUNIT) bestSlideFrac = FRACUNIT;
    if (bestSlideFrac <= 0) return;

    tmXMove = FixedMul(mo.momx, bestSlideFrac);
    tmYMove = FixedMul(mo.momy, bestSlideFrac);

    if (bestSlideLine) P_HitSlideLine(bestSlideLine);

    mo.momx = tmXMove;
    mo.momy = tmYMove;

    if (P_TryMove(mo, (mo.x + tmXMove) | 0, (mo.y + tmYMove) | 0)) return;
    // else retry
  }
}
