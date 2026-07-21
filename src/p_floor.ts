// Plane movement. Ported from linuxdoom-1.10/p_floor.c (T_MovePlane).
//
// Every moving floor, ceiling, door, lift and crusher goes through this one
// function. It moves a plane one step toward `dest` and reports whether it
// arrived, was blocked by something it would crush, or is still going.

import { P_AddThinker, P_RemoveThinker, type Thinker } from './p_tick.js';
import {
  P_FindLowestFloorSurrounding, P_FindHighestFloorSurrounding,
  P_FindNextHighestFloor, P_FindLowestCeilingSurrounding,
} from './p_sectors.js';
import type { PSector, PLine } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/** p_spec.h result. */
export const enum MoveResult {
  Ok = 0,
  Crushed = 1,
  PastDest = 2,
}

export const FLOOR = 0;
export const CEILING = 1;

export interface FloorEnv {
  /** p_map.c P_ChangeSector — true if a mobj is being crushed. */
  changeSector: (sector: PSector, crunch: boolean) => boolean;
}
let env: FloorEnv;
export function P_SetFloorEnv(e: FloorEnv): void {
  env = e;
}

/** p_spec.h. */
export const FLOORSPEED = 65536; // FRACUNIT

/** p_spec.h floor_e. */
export const enum FloorType {
  LowerFloor = 0,
  LowerFloorToLowest = 1,
  TurboLower = 2,
  RaiseFloor = 3,
  RaiseFloorToNearest = 4,
  RaiseToTexture = 5,
  LowerAndChange = 6,
  RaiseFloor24 = 7,
  RaiseFloor24AndChange = 8,
  RaiseFloorCrush = 9,
  RaiseFloorTurbo = 10,
  DonutRaise = 11,
  RaiseFloor512 = 12,
}

export interface FloorMove {
  thinker: Thinker;
  type: FloorType;
  crush: boolean;
  sector: PSector;
  /** 1 up, -1 down. */
  direction: number;
  newSpecial: number;
  texture: string;
  floorDestHeight: number;
  speed: number;
}

/**
 * T_MovePlane. `direction` is 1 up, -1 down.
 *
 * Note the asymmetry: a plane blocked by a mobj reverts to its previous height
 * and reports Crushed — EXCEPT a ceiling moving UP, where vanilla #if 0's out
 * the revert entirely. So rising ceilings never get blocked, and that's the
 * shipped behaviour, not an oversight to fix.
 */
export function T_MovePlane(
  sector: PSector,
  speed: number,
  dest: number,
  crush: boolean,
  floorOrCeiling: number,
  direction: number,
): MoveResult {
  if (floorOrCeiling === FLOOR) {
    if (direction === -1) {
      if (sector.floorHeight - speed < dest) {
        const lastPos = sector.floorHeight;
        sector.floorHeight = dest;
        if (env.changeSector(sector, crush)) {
          sector.floorHeight = lastPos;
          env.changeSector(sector, crush);
        }
        return MoveResult.PastDest;
      }
      const lastPos = sector.floorHeight;
      sector.floorHeight = (sector.floorHeight - speed) | 0;
      if (env.changeSector(sector, crush)) {
        sector.floorHeight = lastPos;
        env.changeSector(sector, crush);
        return MoveResult.Crushed;
      }
      return MoveResult.Ok;
    }

    // direction === 1
    if (sector.floorHeight + speed > dest) {
      const lastPos = sector.floorHeight;
      sector.floorHeight = dest;
      if (env.changeSector(sector, crush)) {
        sector.floorHeight = lastPos;
        env.changeSector(sector, crush);
      }
      return MoveResult.PastDest;
    }
    const lastPos = sector.floorHeight;
    sector.floorHeight = (sector.floorHeight + speed) | 0;
    if (env.changeSector(sector, crush)) {
      // A rising floor that would crush still crushes if `crush` is set —
      // it only reverts when it isn't.
      if (crush) return MoveResult.Crushed;
      sector.floorHeight = lastPos;
      env.changeSector(sector, crush);
      return MoveResult.Crushed;
    }
    return MoveResult.Ok;
  }

  // CEILING
  if (direction === -1) {
    if (sector.ceilingHeight - speed < dest) {
      const lastPos = sector.ceilingHeight;
      sector.ceilingHeight = dest;
      if (env.changeSector(sector, crush)) {
        sector.ceilingHeight = lastPos;
        env.changeSector(sector, crush);
      }
      return MoveResult.PastDest;
    }
    const lastPos = sector.ceilingHeight;
    sector.ceilingHeight = (sector.ceilingHeight - speed) | 0;
    if (env.changeSector(sector, crush)) {
      if (crush) return MoveResult.Crushed;
      sector.ceilingHeight = lastPos;
      env.changeSector(sector, crush);
      return MoveResult.Crushed;
    }
    return MoveResult.Ok;
  }

  // direction === 1
  if (sector.ceilingHeight + speed > dest) {
    const lastPos = sector.ceilingHeight;
    sector.ceilingHeight = dest;
    if (env.changeSector(sector, crush)) {
      sector.ceilingHeight = lastPos;
      env.changeSector(sector, crush);
    }
    return MoveResult.PastDest;
  }
  sector.ceilingHeight = (sector.ceilingHeight + speed) | 0;
  // Vanilla #if 0's the crush check here: a ceiling moving UP is never blocked.
  env.changeSector(sector, crush);
  return MoveResult.Ok;
}

/** p_spec.h stair_e. */
export const enum StairType { Build8 = 0, Turbo16 = 1 }

// ---------------------------------------------------------------------------
// Moving floors. p_floor.c T_MoveFloor / EV_DoFloor.
// ---------------------------------------------------------------------------

let level: PlaysimMap;
export function P_SetFloorLevel(l: PlaysimMap): void {
  level = l;
}

/** T_MoveFloor. */
export function T_MoveFloor(floor: FloorMove): void {
  const res = T_MovePlane(floor.sector, floor.speed, floor.floorDestHeight,
                          floor.crush, FLOOR, floor.direction);

  if (res === MoveResult.PastDest) {
    floor.sector.specialData = null;

    // Only donutRaise (going up) and lowerAndChange (going down) rewrite the
    // sector — and each only in its own direction.
    if (floor.direction === 1 && floor.type === FloorType.DonutRaise) {
      floor.sector.special = floor.newSpecial;
      floor.sector.floorPic = floor.texture;
    } else if (floor.direction === -1 && floor.type === FloorType.LowerAndChange) {
      floor.sector.special = floor.newSpecial;
      floor.sector.floorPic = floor.texture;
    }

    P_RemoveThinker(floor.thinker);
  }
}

/** EV_DoFloor. */
export function EV_DoFloor(line: PLine, floorType: FloorType): boolean {
  let rtn = false;

  for (const sec of level.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue; // already moving

    rtn = true;
    const floor: FloorMove = {
      thinker: { removed: false, tick: null },
      type: floorType,
      crush: false,
      sector: sec,
      direction: 1,
      newSpecial: 0,
      texture: sec.floorPic,
      floorDestHeight: 0,
      speed: FLOORSPEED,
    };
    floor.thinker.tick = () => T_MoveFloor(floor);
    sec.specialData = floor;
    P_AddThinker(floor.thinker);

    switch (floorType) {
      case FloorType.LowerFloor:
        floor.direction = -1;
        floor.floorDestHeight = P_FindHighestFloorSurrounding(level, sec);
        break;

      case FloorType.LowerFloorToLowest:
        floor.direction = -1;
        floor.floorDestHeight = P_FindLowestFloorSurrounding(level, sec);
        break;

      case FloorType.TurboLower:
        floor.direction = -1;
        floor.speed = FLOORSPEED * 4;
        floor.floorDestHeight = P_FindHighestFloorSurrounding(level, sec);
        // Stops 8 above the neighbour — unless it's already there.
        if (floor.floorDestHeight !== sec.floorHeight) {
          floor.floorDestHeight = (floor.floorDestHeight + 8 * 65536) | 0;
        }
        break;

      case FloorType.RaiseFloorCrush:
      case FloorType.RaiseFloor:
        floor.crush = floorType === FloorType.RaiseFloorCrush;
        floor.direction = 1;
        floor.floorDestHeight = P_FindLowestCeilingSurrounding(level, sec);
        if (floor.floorDestHeight > sec.ceilingHeight) floor.floorDestHeight = sec.ceilingHeight;
        // A crushing floor stops 8 short so it pins you rather than sealing.
        if (floorType === FloorType.RaiseFloorCrush) {
          floor.floorDestHeight = (floor.floorDestHeight - 8 * 65536) | 0;
        }
        break;

      case FloorType.RaiseFloorTurbo:
        floor.direction = 1;
        floor.speed = FLOORSPEED * 4;
        floor.floorDestHeight = P_FindNextHighestFloor(level, sec, sec.floorHeight);
        break;

      case FloorType.RaiseFloorToNearest:
        floor.direction = 1;
        floor.floorDestHeight = P_FindNextHighestFloor(level, sec, sec.floorHeight);
        break;

      case FloorType.RaiseFloor24:
        floor.direction = 1;
        floor.floorDestHeight = (sec.floorHeight + 24 * 65536) | 0;
        break;

      case FloorType.RaiseFloor512:
        floor.direction = 1;
        floor.floorDestHeight = (sec.floorHeight + 512 * 65536) | 0;
        break;

      case FloorType.RaiseFloor24AndChange:
        floor.direction = 1;
        floor.floorDestHeight = (sec.floorHeight + 24 * 65536) | 0;
        sec.floorPic = line.frontSector!.floorPic;
        sec.special = line.frontSector!.special;
        break;

      case FloorType.LowerAndChange:
        floor.direction = -1;
        floor.floorDestHeight = P_FindLowestFloorSurrounding(level, sec);
        floor.texture = sec.floorPic;
        // Vanilla scans the neighbours for a sector at the destination height
        // and copies its flat/special. Needs the line list; approximated by
        // keeping our own until the donut/lowerAndChange maps need it.
        break;

      case FloorType.RaiseToTexture:
        // Raises by the shortest lower texture around the sector. Needs sidedef
        // texture heights; not used by any shareware map.
        floor.direction = 1;
        floor.floorDestHeight = sec.floorHeight;
        break;

      default:
        break;
    }
  }
  return rtn;
}

/**
 * EV_BuildStairs: the classic rising staircase.
 *
 * The chaining rule is the trick: from each step, find a two-sided line whose
 * FRONT is the current sector, and whose BACK has the SAME floor texture. That
 * back sector becomes the next step, one stairsize higher. A different texture
 * ends the run — which is how mappers control where a staircase stops.
 */
export function EV_BuildStairs(line: PLine, type: StairType): boolean {
  let rtn = false;

  const stairSize = type === StairType.Turbo16 ? 16 * 65536 : 8 * 65536;
  const speed = type === StairType.Turbo16 ? FLOORSPEED * 4 : FLOORSPEED / 4;

  for (const start of level.sectors) {
    if (start.tag !== line.tag) continue;
    if (start.specialData) continue;

    rtn = true;
    let sec = start;
    let height = (sec.floorHeight + stairSize) | 0;
    const texture = sec.floorPic;

    const makeStep = (s: PSector, dest: number): void => {
      const floor: FloorMove = {
        thinker: { removed: false, tick: null },
        type: FloorType.LowerFloor, // unused for stairs; only direction matters
        crush: false,
        sector: s,
        direction: 1,
        newSpecial: 0,
        texture: s.floorPic,
        floorDestHeight: dest,
        speed,
      };
      floor.thinker.tick = () => T_MoveFloor(floor);
      s.specialData = floor;
      P_AddThinker(floor.thinker);
    };

    makeStep(sec, height);

    // Walk the staircase.
    let ok = true;
    while (ok) {
      ok = false;
      for (const li of sec.lineIndices) {
        const l = level.lines[li];
        if (!(l.flags & 4 /* ML_TWOSIDED */)) continue;
        // The current sector must be the FRONT of this line.
        if (l.frontSector !== sec) continue;
        const next = l.backSector;
        if (!next || next.floorPic !== texture) continue;

        height = (height + stairSize) | 0;
        if (next.specialData) continue; // already moving — skip, don't stop

        makeStep(next, height);
        sec = next;
        ok = true;
        break;
      }
    }
  }
  return rtn;
}
