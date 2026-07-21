// Sector neighbour searches. Ported from linuxdoom-1.10/p_spec.c.
//
// Every moving-floor special asks the same question — "how high are the sectors
// around this one" — and the answers differ in ways that matter: LOWEST vs
// NEXT-HIGHEST is the difference between a lift and a staircase.

import type { PSector } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/** getNextSector: the sector on the other side of a line, or null. */
export function getNextSector(line: { frontSector: PSector | null; backSector: PSector | null; flags: number },
                              sec: PSector): PSector | null {
  // ML_TWOSIDED. A one-sided line has no other side.
  if (!(line.flags & 4)) return null;
  if (line.frontSector === sec) return line.backSector;
  return line.frontSector;
}

/** P_FindLowestFloorSurrounding. */
export function P_FindLowestFloorSurrounding(level: PlaysimMap, sec: PSector): number {
  let floor = sec.floorHeight;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (other && other.floorHeight < floor) floor = other.floorHeight;
  }
  return floor;
}

/** P_FindHighestFloorSurrounding. Starts at -500 units, NOT the sector's own
 *  height — so a sector higher than everything around it returns -500. */
export function P_FindHighestFloorSurrounding(level: PlaysimMap, sec: PSector): number {
  let floor = -500 * 65536;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (other && other.floorHeight > floor) floor = other.floorHeight;
  }
  return floor;
}

/**
 * P_FindNextHighestFloor: the lowest neighbouring floor that is still ABOVE
 * `currentheight`. This is what builds staircases.
 *
 * Vanilla uses a fixed 20-entry array and reads heightlist[0] unguarded when
 * nothing qualifies — a documented overflow. We return currentheight instead,
 * which is what the unoverflowed case degenerates to.
 */
export function P_FindNextHighestFloor(level: PlaysimMap, sec: PSector, currentHeight: number): number {
  let best = Number.MAX_SAFE_INTEGER;
  let found = false;

  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (!other) continue;
    if (other.floorHeight > currentHeight && other.floorHeight < best) {
      best = other.floorHeight;
      found = true;
    }
  }
  return found ? best : currentHeight;
}

/** P_FindLowestCeilingSurrounding. */
export function P_FindLowestCeilingSurrounding(level: PlaysimMap, sec: PSector): number {
  let height = 0x7fffffff;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (other && other.ceilingHeight < height) height = other.ceilingHeight;
  }
  return height;
}

/** P_FindHighestCeilingSurrounding. */
export function P_FindHighestCeilingSurrounding(level: PlaysimMap, sec: PSector): number {
  let height = 0;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (other && other.ceilingHeight > height) height = other.ceilingHeight;
  }
  return height;
}

/**
 * P_FindMinSurroundingLight. Used by the light specials.
 */
export function P_FindMinSurroundingLight(level: PlaysimMap, sec: PSector, max: number): number {
  let min = max;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level.lines[li], sec);
    if (other && other.lightLevel < min) min = other.lightLevel;
  }
  return min;
}
