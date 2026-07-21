// Doors. Ported from linuxdoom-1.10/p_doors.c.
//
// A door is a sector whose CEILING moves. "Open" raises it to 4 below the
// lowest neighbouring ceiling; "close" drops it to the floor. sector.specialData
// holds the active thinker, which is how a door knows it's already moving —
// that's what makes bumping a closing door reopen it.

import { FRACUNIT } from './m_fixed.js';
import { P_AddThinker, P_RemoveThinker, type Thinker } from './p_tick.js';
import { T_MovePlane, MoveResult, CEILING } from './p_floor.js';
import { S_StartSoundAt } from './s_sound.js';
import type { PLine, PMobj, PSector } from './p_local.js';

/** Play a door's open/close sound at its sector centre. */
function doorSound(door: VLDoor, opening: boolean): void {
  const blaze = door.speed >= VDOORSPEED * 4;
  const sfx = opening ? (blaze ? 'sfx_bdopn' : 'sfx_doropn')
                      : (blaze ? 'sfx_bdcls' : 'sfx_dorcls');
  S_StartSoundAt(door.sector.soundX, door.sector.soundY, sfx);
}
import type { PlaysimMap } from './p_setup.js';

/** p_spec.h. */
export const VDOORSPEED = FRACUNIT * 2;
export const VDOORWAIT = 150;

/** p_spec.h vldoor_e. */
export const enum DoorType {
  Normal = 0,
  Close30ThenOpen = 1,
  Close = 2,
  Open = 3,
  RaiseIn5Mins = 4,
  BlazeRaise = 5,
  BlazeOpen = 6,
  BlazeClose = 7,
}

export interface VLDoor {
  thinker: Thinker;
  type: DoorType;
  sector: PSector;
  topHeight: number;
  speed: number;
  /** 1 up, 0 waiting at top, -1 down, 2 initial wait. */
  direction: number;
  topWait: number;
  topCountdown: number;
}

let level: PlaysimMap;
export function P_SetDoorLevel(l: PlaysimMap): void {
  level = l;
}

/** p_spec.c P_FindLowestCeilingSurrounding. */
function findLowestCeilingSurrounding(sec: PSector): number {
  let height = 0x7fffffff;
  for (const line of level.lines) {
    if (line.frontSector !== sec && line.backSector !== sec) continue;
    const other = line.frontSector === sec ? line.backSector : line.frontSector;
    if (!other) continue;
    if (other.ceilingHeight < height) height = other.ceilingHeight;
  }
  return height;
}

/** T_VerticalDoor. */
export function T_VerticalDoor(door: VLDoor): void {
  switch (door.direction) {
    case 0: // waiting at the top
      if (--door.topCountdown === 0) {
        switch (door.type) {
          case DoorType.BlazeRaise:
          case DoorType.Normal:
            door.direction = -1; // time to go back down
            doorSound(door, false);
            break;
          case DoorType.Close30ThenOpen:
            door.direction = 1;
            doorSound(door, true);
            break;
          default:
            break;
        }
      }
      break;

    case 2: // initial wait
      if (--door.topCountdown === 0) {
        if (door.type === DoorType.RaiseIn5Mins) {
          door.direction = 1;
          door.type = DoorType.Normal;
        }
      }
      break;

    case -1: { // going down
      const res = T_MovePlane(door.sector, door.speed, door.sector.floorHeight,
                              false, CEILING, door.direction);
      if (res === MoveResult.PastDest) {
        switch (door.type) {
          case DoorType.BlazeRaise:
          case DoorType.BlazeClose:
          case DoorType.Normal:
          case DoorType.Close:
            door.sector.specialData = null;
            P_RemoveThinker(door.thinker);
            break;
          case DoorType.Close30ThenOpen:
            door.direction = 0;
            door.topCountdown = 35 * 30;
            break;
          default:
            break;
        }
      } else if (res === MoveResult.Crushed) {
        // Something's underneath: reverse rather than crush. Blaze doors and
        // pure "close" doors keep going — they're the ones that hurt.
        switch (door.type) {
          case DoorType.BlazeClose:
          case DoorType.Close:
            break;
          default:
            door.direction = 1;
            break;
        }
      }
      break;
    }

    case 1: { // going up
      const res = T_MovePlane(door.sector, door.speed, door.topHeight,
                              false, CEILING, door.direction);
      if (res === MoveResult.PastDest) {
        switch (door.type) {
          case DoorType.BlazeRaise:
          case DoorType.Normal:
            door.direction = 0; // wait at top
            door.topCountdown = door.topWait;
            break;
          case DoorType.Close30ThenOpen:
          case DoorType.BlazeOpen:
          case DoorType.Open:
            door.sector.specialData = null;
            P_RemoveThinker(door.thinker);
            break;
          default:
            break;
        }
      }
      break;
    }
  }
}

function newDoor(sector: PSector, type: DoorType): VLDoor {
  const door: VLDoor = {
    thinker: { removed: false, tick: null },
    type,
    sector,
    topHeight: 0,
    speed: VDOORSPEED,
    direction: 1,
    topWait: VDOORWAIT,
    topCountdown: 0,
  };
  door.thinker.tick = () => T_VerticalDoor(door);
  sector.specialData = door;
  P_AddThinker(door.thinker);
  return door;
}

/**
 * EV_VerticalDoor: a door opened by USING it (no tag). The door sector is the
 * one on the BACK of the line — you always stand on the front.
 *
 * Key checks (blue/yellow/red) are omitted until the player has an inventory;
 * locked doors currently open for anyone.
 */
export function EV_VerticalDoor(line: PLine, thing: PMobj): void {
  // side ^ 1: the sector behind the line is the door.
  const backSideNum = line.sideNum[1];
  if (backSideNum < 0) return; // one-sided: not a door
  const sec = line.backSector;
  if (!sec) return;

  // Already moving? Re-using it reverses or re-triggers, depending on type.
  if (sec.specialData) {
    const door = sec.specialData as VLDoor;
    switch (line.special) {
      case 1:  // raise doors only, not opens
      case 26:
      case 27:
      case 28:
      case 117:
        if (door.direction === -1) {
          door.direction = 1; // go back up
        } else {
          if (!thing.player) return; // monsters can't close doors
          door.direction = -1; // start going down
        }
        return;
      default:
        return;
    }
  }

  const door = newDoor(sec, DoorType.Normal);

  switch (line.special) {
    case 1:
    case 26:
    case 27:
    case 28:
      door.type = DoorType.Normal;
      break;
    case 31:
    case 32:
    case 33:
    case 34:
      door.type = DoorType.Open;
      line.special = 0; // once only
      break;
    case 117: // blazing raise
      door.type = DoorType.BlazeRaise;
      door.speed = VDOORSPEED * 4;
      break;
    case 118: // blazing open
      door.type = DoorType.BlazeOpen;
      line.special = 0;
      door.speed = VDOORSPEED * 4;
      break;
    default:
      break;
  }

  door.topHeight = (findLowestCeilingSurrounding(sec) - 4 * FRACUNIT) | 0;
  door.direction = 1;
  doorSound(door, true);
}

/** EV_DoDoor: a tagged door, opened by a switch or a walk-over trigger. */
export function EV_DoDoor(line: PLine, type: DoorType): boolean {
  let didSomething = false;

  for (const sec of level.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue; // already busy

    didSomething = true;
    const door = newDoor(sec, type);

    switch (type) {
      case DoorType.BlazeClose:
        door.topHeight = (findLowestCeilingSurrounding(sec) - 4 * FRACUNIT) | 0;
        door.direction = -1;
        door.speed = VDOORSPEED * 4;
        break;
      case DoorType.Close:
        door.topHeight = (findLowestCeilingSurrounding(sec) - 4 * FRACUNIT) | 0;
        door.direction = -1;
        break;
      case DoorType.Close30ThenOpen:
        door.topHeight = sec.ceilingHeight;
        door.direction = -1;
        break;
      case DoorType.BlazeRaise:
      case DoorType.BlazeOpen:
        door.direction = 1;
        door.speed = VDOORSPEED * 4;
        door.topHeight = (findLowestCeilingSurrounding(sec) - 4 * FRACUNIT) | 0;
        break;
      case DoorType.Normal:
      case DoorType.Open:
        door.direction = 1;
        door.topHeight = (findLowestCeilingSurrounding(sec) - 4 * FRACUNIT) | 0;
        break;
      default:
        break;
    }
    // A closing door and an opening door have distinct sounds.
    doorSound(door, door.direction === 1);
  }

  return didSomething;
}
