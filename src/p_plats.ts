// Lifts and platforms. Ported from linuxdoom-1.10/p_plats.c.
//
// The most-used special in the shareware maps by a wide margin: 93 lift lines
// across the 9 levels. You cannot traverse E1 without them.

import { FRACUNIT } from './m_fixed.js';
import { P_AddThinker, P_RemoveThinker, type Thinker } from './p_tick.js';
import { T_MovePlane, MoveResult, FLOOR } from './p_floor.js';
import { P_FindLowestFloorSurrounding, P_FindNextHighestFloor } from './p_sectors.js';
import { S_StartSoundAt } from './s_sound.js';
import type { PLine, PSector } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/** p_spec.h. */
export const PLATWAIT = 3;
export const PLATSPEED = FRACUNIT;
export const MAXPLATS = 30;

/** p_spec.h plattype_e. */
export const enum PlatType {
  PerpetualRaise = 0,
  DownWaitUpStay = 1,
  RaiseAndChange = 2,
  RaiseToNearestAndChange = 3,
  BlazeDWUS = 4,
}

/** p_spec.h plat_e. */
const enum PlatStatus { Up = 0, Down = 1, Waiting = 2, InStasis = 3 }

export interface Plat {
  thinker: Thinker;
  sector: PSector;
  speed: number;
  low: number;
  high: number;
  wait: number;
  count: number;
  status: PlatStatus;
  oldStatus: PlatStatus;
  crush: boolean;
  tag: number;
  type: PlatType;
}

let level: PlaysimMap;
export function P_SetPlatLevel(l: PlaysimMap): void {
  level = l;
  activePlats.length = 0;
}

/**
 * p_plats.c activeplats[MAXPLATS]. A fixed array, and vanilla I_Errors when it
 * overflows — but a stopped plat leaves a NULL hole that gets reused. We use a
 * list; the only externally visible behaviour is which plats EV_StopPlat finds.
 */
const activePlats: Plat[] = [];

/** T_PlatRaise. */
export function T_PlatRaise(plat: Plat): void {
  switch (plat.status) {
    case PlatStatus.Up: {
      const res = T_MovePlane(plat.sector, plat.speed, plat.high, plat.crush, FLOOR, 1);

      if (res === MoveResult.Crushed && !plat.crush) {
        // Something's in the way and we're not a crusher: go back down.
        plat.count = plat.wait;
        plat.status = PlatStatus.Down;
      } else if (res === MoveResult.PastDest) {
        plat.count = plat.wait;
        plat.status = PlatStatus.Waiting;
        S_StartSoundAt(plat.sector.soundX, plat.sector.soundY, 'sfx_pstop');

        switch (plat.type) {
          case PlatType.BlazeDWUS:
          case PlatType.DownWaitUpStay:
          case PlatType.RaiseAndChange:
          case PlatType.RaiseToNearestAndChange:
            P_RemoveActivePlat(plat);
            break;
          default:
            break;
        }
      }
      break;
    }

    case PlatStatus.Down: {
      const res = T_MovePlane(plat.sector, plat.speed, plat.low, false, FLOOR, -1);
      if (res === MoveResult.PastDest) {
        plat.count = plat.wait;
        plat.status = PlatStatus.Waiting;
        S_StartSoundAt(plat.sector.soundX, plat.sector.soundY, 'sfx_pstop');
      }
      break;
    }

    case PlatStatus.Waiting:
      if (!--plat.count) {
        // Which way to go is decided by where we ARE, not where we came from.
        plat.status = plat.sector.floorHeight === plat.low ? PlatStatus.Up : PlatStatus.Down;
        S_StartSoundAt(plat.sector.soundX, plat.sector.soundY, 'sfx_pstart');
      }
      break;

    case PlatStatus.InStasis:
      break;
  }
}

function P_AddActivePlat(plat: Plat): void {
  activePlats.push(plat);
}

export function P_RemoveActivePlat(plat: Plat): void {
  plat.sector.specialData = null;
  P_RemoveThinker(plat.thinker);
  const i = activePlats.indexOf(plat);
  if (i >= 0) activePlats.splice(i, 1);
}

/** P_ActivateInStasis: a perpetual lift restarted by another switch. */
export function P_ActivateInStasis(tag: number): void {
  for (const plat of activePlats) {
    if (plat.tag === tag && plat.status === PlatStatus.InStasis) {
      plat.status = plat.oldStatus;
      plat.thinker.tick = () => T_PlatRaise(plat);
    }
  }
}

/** EV_StopPlat: freeze a perpetual lift where it is. */
export function EV_StopPlat(line: PLine): void {
  for (const plat of activePlats) {
    if (plat.status !== PlatStatus.InStasis && plat.tag === line.tag) {
      plat.oldStatus = plat.status;
      plat.status = PlatStatus.InStasis;
      plat.thinker.tick = null; // frozen, but still in the list
    }
  }
}

/** EV_DoPlat. `amount` only matters for the raise-and-change types. */
export function EV_DoPlat(line: PLine, type: PlatType, amount: number): boolean {
  let rtn = false;

  // A perpetual-raise switch first UN-freezes any it previously stopped.
  if (type === PlatType.PerpetualRaise) P_ActivateInStasis(line.tag);

  for (const sec of level.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue; // already busy

    rtn = true;
    const plat: Plat = {
      thinker: { removed: false, tick: null },
      sector: sec,
      speed: PLATSPEED,
      low: 0,
      high: 0,
      wait: 0,
      count: 0,
      status: PlatStatus.Up,
      oldStatus: PlatStatus.Up,
      crush: false,
      tag: line.tag,
      type,
    };
    plat.thinker.tick = () => T_PlatRaise(plat);
    sec.specialData = plat;
    P_AddThinker(plat.thinker);

    switch (type) {
      case PlatType.RaiseToNearestAndChange:
        plat.speed = PLATSPEED / 2;
        // The lift adopts the flat of the sector the SWITCH is on.
        sec.floorPic = line.frontSector!.floorPic;
        plat.high = P_FindNextHighestFloor(level, sec, sec.floorHeight);
        plat.wait = 0;
        plat.status = PlatStatus.Up;
        sec.special = 0; // stops any damage this sector was doing
        break;

      case PlatType.RaiseAndChange:
        plat.speed = PLATSPEED / 2;
        sec.floorPic = line.frontSector!.floorPic;
        plat.high = (sec.floorHeight + amount * FRACUNIT) | 0;
        plat.wait = 0;
        plat.status = PlatStatus.Up;
        break;

      case PlatType.DownWaitUpStay:
        plat.speed = PLATSPEED * 4;
        plat.low = P_FindLowestFloorSurrounding(level, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        plat.status = PlatStatus.Down;
        break;

      case PlatType.BlazeDWUS:
        plat.speed = PLATSPEED * 8;
        plat.low = P_FindLowestFloorSurrounding(level, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        plat.status = PlatStatus.Down;
        break;

      case PlatType.PerpetualRaise:
        plat.speed = PLATSPEED;
        plat.low = P_FindLowestFloorSurrounding(level, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = P_FindHighestFloorSurrounding(level, sec);
        if (plat.high < sec.floorHeight) plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        // The starting direction is RANDOM — P_Random&1. A perpetual lift's
        // phase is therefore part of the RNG sequence.
        plat.status = (platRandom() & 1) ? PlatStatus.Up : PlatStatus.Down;
        break;

      default:
        break;
    }
    // The lift lurching into motion (close enough to vanilla's per-type mix of
    // pstart/stnmov for a first pass).
    S_StartSoundAt(plat.sector.soundX, plat.sector.soundY, 'sfx_pstart');
    P_AddActivePlat(plat);
  }
  return rtn;
}

// P_Random, injected to avoid an import cycle through p_spec.
import { P_Random } from './m_random.js';
import { P_FindHighestFloorSurrounding } from './p_sectors.js';
const platRandom = (): number => P_Random();
