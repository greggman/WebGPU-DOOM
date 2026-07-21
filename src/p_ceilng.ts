// Crushers and moving ceilings. Ported from linuxdoom-1.10/p_ceilng.c.
//
// A crusher slows to 1/8 speed WHILE it's crushing something (the grind), then
// returns to full speed once clear — which is why a crusher pinning a monster
// sounds different from one moving freely.

import { FRACUNIT } from './m_fixed.js';
import { P_AddThinker, P_RemoveThinker, type Thinker } from './p_tick.js';
import { T_MovePlane, MoveResult, CEILING } from './p_floor.js';
import { P_FindHighestCeilingSurrounding } from './p_sectors.js';
import type { PLine, PSector } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/** p_spec.h. */
export const CEILSPEED = FRACUNIT;
export const CEILWAIT = 150;

/** p_spec.h ceiling_e. */
export const enum CeilingType {
  LowerToFloor = 0,
  RaiseToHighest = 1,
  LowerAndCrush = 2,
  CrushAndRaise = 3,
  FastCrushAndRaise = 4,
  SilentCrushAndRaise = 5,
}

export interface Ceiling {
  thinker: Thinker;
  type: CeilingType;
  sector: PSector;
  bottomHeight: number;
  topHeight: number;
  speed: number;
  crush: boolean;
  /** 1 up, 0 in stasis, -1 down. */
  direction: number;
  tag: number;
  oldDirection: number;
}

let level: PlaysimMap;
const activeCeilings: Ceiling[] = [];

export function P_SetCeilingLevel(l: PlaysimMap): void {
  level = l;
  activeCeilings.length = 0;
}

/** T_MoveCeiling. */
export function T_MoveCeiling(ceiling: Ceiling): void {
  switch (ceiling.direction) {
    case 0: // in stasis
      break;

    case 1: { // up
      const res = T_MovePlane(ceiling.sector, ceiling.speed, ceiling.topHeight,
                              false, CEILING, ceiling.direction);
      if (res === MoveResult.PastDest) {
        switch (ceiling.type) {
          case CeilingType.RaiseToHighest:
            P_RemoveActiveCeiling(ceiling);
            break;
          case CeilingType.SilentCrushAndRaise:
          case CeilingType.FastCrushAndRaise:
          case CeilingType.CrushAndRaise:
            ceiling.direction = -1; // reverse into the next crush
            break;
          default:
            break;
        }
      }
      break;
    }

    case -1: { // down
      const res = T_MovePlane(ceiling.sector, ceiling.speed, ceiling.bottomHeight,
                              ceiling.crush, CEILING, ceiling.direction);
      if (res === MoveResult.PastDest) {
        switch (ceiling.type) {
          case CeilingType.SilentCrushAndRaise:
          case CeilingType.CrushAndRaise:
            ceiling.speed = CEILSPEED; // back to full after a grind
            ceiling.direction = 1;
            break;
          case CeilingType.FastCrushAndRaise:
            ceiling.direction = 1;
            break;
          case CeilingType.LowerAndCrush:
          case CeilingType.LowerToFloor:
            P_RemoveActiveCeiling(ceiling);
            break;
          default:
            break;
        }
      } else if (res === MoveResult.Crushed) {
        // Grinding: slow WAY down while pinning something.
        switch (ceiling.type) {
          case CeilingType.SilentCrushAndRaise:
          case CeilingType.CrushAndRaise:
          case CeilingType.LowerAndCrush:
            ceiling.speed = CEILSPEED / 8;
            break;
          default:
            break;
        }
      }
      break;
    }
  }
}

function P_AddActiveCeiling(c: Ceiling): void {
  activeCeilings.push(c);
}

export function P_RemoveActiveCeiling(c: Ceiling): void {
  c.sector.specialData = null;
  P_RemoveThinker(c.thinker);
  const i = activeCeilings.indexOf(c);
  if (i >= 0) activeCeilings.splice(i, 1);
}

/** A crusher switch can re-start crushers it previously stopped. */
export function P_ActivateInStasisCeiling(line: PLine): void {
  for (const c of activeCeilings) {
    if (c.tag === line.tag && c.direction === 0) {
      c.direction = c.oldDirection;
      c.thinker.tick = () => T_MoveCeiling(c);
    }
  }
}

/** EV_CeilingCrushStop. */
export function EV_CeilingCrushStop(line: PLine): boolean {
  let rtn = false;
  for (const c of activeCeilings) {
    if (c.tag === line.tag && c.direction !== 0) {
      c.oldDirection = c.direction;
      c.direction = 0;
      c.thinker.tick = null;
      rtn = true;
    }
  }
  return rtn;
}

/** EV_DoCeiling. */
export function EV_DoCeiling(line: PLine, type: CeilingType): boolean {
  if (type === CeilingType.FastCrushAndRaise ||
      type === CeilingType.SilentCrushAndRaise ||
      type === CeilingType.CrushAndRaise) {
    P_ActivateInStasisCeiling(line);
  }

  let rtn = false;
  for (const sec of level.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue;

    rtn = true;
    const ceiling: Ceiling = {
      thinker: { removed: false, tick: null },
      type,
      sector: sec,
      bottomHeight: 0,
      topHeight: 0,
      speed: CEILSPEED,
      crush: false,
      direction: -1,
      tag: sec.tag,
      oldDirection: -1,
    };
    ceiling.thinker.tick = () => T_MoveCeiling(ceiling);
    sec.specialData = ceiling;
    P_AddThinker(ceiling.thinker);

    switch (type) {
      case CeilingType.FastCrushAndRaise:
        ceiling.crush = true;
        ceiling.topHeight = sec.ceilingHeight;
        ceiling.bottomHeight = (sec.floorHeight + 8 * FRACUNIT) | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED * 2;
        break;

      case CeilingType.SilentCrushAndRaise:
      case CeilingType.CrushAndRaise:
        ceiling.crush = true;
        ceiling.topHeight = sec.ceilingHeight;
        ceiling.bottomHeight = (sec.floorHeight + 8 * FRACUNIT) | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED;
        break;

      case CeilingType.LowerAndCrush:
      case CeilingType.LowerToFloor:
        // Crushers stop 8 above the floor so you're pinned, not sealed; a plain
        // lower-to-floor goes all the way.
        ceiling.bottomHeight = sec.floorHeight;
        if (type !== CeilingType.LowerToFloor) ceiling.bottomHeight = (ceiling.bottomHeight + 8 * FRACUNIT) | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED;
        break;

      case CeilingType.RaiseToHighest:
        ceiling.topHeight = P_FindHighestCeilingSurrounding(level, sec);
        ceiling.direction = 1;
        ceiling.speed = CEILSPEED;
        break;
    }

    P_AddActiveCeiling(ceiling);
  }
  return rtn;
}
