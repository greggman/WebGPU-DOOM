// Line specials. Ported from linuxdoom-1.10/p_spec.c (P_UseSpecialLine).
//
// Only the door specials are wired so far — enough to get through a level.
// Floors, lifts, crushers, lights, teleports and the exit all dispatch from the
// same switch and land here as they're ported.

import { EV_VerticalDoor, EV_DoDoor, DoorType } from './p_doors.js';
import { EV_DoFloor, EV_BuildStairs, FloorType, StairType } from './p_floor.js';
import { EV_DoPlat, EV_StopPlat, PlatType } from './p_plats.js';
import { EV_DoCeiling, EV_CeilingCrushStop, CeilingType } from './p_ceilng.js';
import { P_Random } from './m_random.js';
import { P_ChangeSwitchTexture } from './p_switch.js';
import type { PLine, PMobj, PPlayer } from './p_local.js';

// Use-line specials that are REPEATABLE (SR): their switch flips back after a
// moment. Everything else handled by use flips once and stays (S1). Manual door
// tracks aren't switch textures, so P_ChangeSwitchTexture no-ops on them.
const REPEATABLE_USE = new Set([42, 61, 63, 114, 115, 116, 62, 123, 45, 60, 64, 65, 69, 70, 87, 89]);

export interface SpecEnv {
  /** g_game.c G_ExitLevel / G_SecretExitLevel. */
  exitLevel?: (secret: boolean) => void;
  /** p_telept.c EV_Teleport. */
  teleport?: (line: PLine, side: number, thing: PMobj) => boolean;
  /** p_inter.c P_DamageMobj — the slime floors need it. */
  damageMobj?: (target: PMobj, inflictor: PMobj | null, source: PMobj | null, damage: number) => void;
}
let env: SpecEnv = {};
export function P_SetSpecEnv(e: SpecEnv): void {
  env = e;
}

/**
 * P_PlayerInSpecialSector: damage floors, secrets, and E1M8's finale.
 *
 * `!(leveltime & 0x1f)` means damage lands every 32 tics — just under once a
 * second. That's why you can dash across nukage unhurt if you time it.
 */
export function P_PlayerInSpecialSector(player: PPlayer, levelTime: number): void {
  const mo = player.mo!;
  const sector = mo.sector;
  if (!sector) return;

  // Only hurts when you're actually standing on the floor, not falling to it.
  if (mo.z !== sector.floorHeight) return;

  switch (sector.special) {
    case 5: // hellslime
      if (!player.powers[3 /* pw_ironfeet */] && !(levelTime & 0x1f)) {
        env.damageMobj?.(mo, null, null, 10);
      }
      break;

    case 7: // nukage — 81 sectors across E1, the most common by far
      if (!player.powers[3] && !(levelTime & 0x1f)) {
        env.damageMobj?.(mo, null, null, 5);
      }
      break;

    case 16: // super hellslime
    case 4:  // strobe hurt
      // A radsuit only MOSTLY protects here: P_Random()<5 leaks through, so
      // the worst slime hurts ~2% of the time even suited. Note the draw only
      // happens when you HAVE the suit — short-circuit order matters.
      if (!player.powers[3] || P_Random() < 5) {
        if (!(levelTime & 0x1f)) env.damageMobj?.(mo, null, null, 20);
      }
      break;

    case 9: // secret
      player.secretCount++;
      sector.special = 0; // once only
      break;

    case 11: // E1M8's finale: the floor kills you, and that ends the episode
      if (!(levelTime & 0x1f)) env.damageMobj?.(mo, null, null, 20);
      if (player.health <= 10) env.exitLevel?.(false);
      break;

    default:
      // Vanilla I_Errors on an unknown special. Lights use the same field and
      // are handled elsewhere, so ignore rather than die.
      break;
  }
}

/**
 * P_UseSpecialLine: the player pressed use against `line`.
 *
 * Vanilla's switch is one giant table of magic numbers, and they're magic in
 * the WADs too — a mapper types 1 for "door". Keeping the raw numbers (rather
 * than inventing an enum) is what makes this checkable against the source.
 */
export function P_UseSpecialLine(thing: PMobj, line: PLine, side: number): boolean {
  const orig = line.special; // captured before a once-only case zeroes it
  // Monsters can only open a few door types.
  if (!thing.player) {
    // ML_SECRET is 0x20 (32), NOT 4 — 4 is ML_TWOSIDED, which EVERY door has, so
    // the wrong constant made monsters unable to open any door (they'd reroute,
    // desyncing demos and never following you through doorways).
    if (line.flags & 32 /* ML_SECRET */) return false;
    switch (line.special) {
      case 1:  // manual door raise
      case 32: // blue
      case 33: // red
      case 34: // yellow
        break;
      default:
        return false;
    }
  }

  switch (line.special) {
    // --- manual doors (no tag: the line's own back sector) ---
    case 1:   // DR Door raise
    case 26:  // DR Blue lock
    case 27:  // DR Yellow lock
    case 28:  // DR Red lock
    case 31:  // D1 Door open stay
    case 32:  // D1 Blue lock
    case 33:  // D1 Red lock
    case 34:  // D1 Yellow lock
    case 117: // DR Blazing raise
    case 118: // D1 Blazing open
      EV_VerticalDoor(line, thing);
      break;

    // --- switched doors (tagged) ---
    case 29: // S1 Door raise
      if (EV_DoDoor(line, DoorType.Normal)) line.special = 0;
      break;
    case 50: // S1 Door close
      if (EV_DoDoor(line, DoorType.Close)) line.special = 0;
      break;
    case 103: // S1 Door open stay
      if (EV_DoDoor(line, DoorType.Open)) line.special = 0;
      break;
    case 111: // S1 Blazing door raise
      if (EV_DoDoor(line, DoorType.BlazeRaise)) line.special = 0;
      break;
    case 112: // S1 Blazing door open
      if (EV_DoDoor(line, DoorType.BlazeOpen)) line.special = 0;
      break;
    case 113: // S1 Blazing door close
      if (EV_DoDoor(line, DoorType.BlazeClose)) line.special = 0;
      break;

    // --- repeatable switched doors ---
    case 42: EV_DoDoor(line, DoorType.Close); break;      // SR Door close
    case 61: EV_DoDoor(line, DoorType.Open); break;       // SR Door open
    case 63: EV_DoDoor(line, DoorType.Normal); break;     // SR Door raise
    case 114: EV_DoDoor(line, DoorType.BlazeRaise); break;
    case 115: EV_DoDoor(line, DoorType.BlazeOpen); break;
    case 116: EV_DoDoor(line, DoorType.BlazeClose); break;

    // --- exits. THE most important special: without 11 no level ends. ---
    case 11: // S1 Exit level
      env.exitLevel?.(false);
      line.special = 0;
      break;
    case 51: // S1 Secret exit
      env.exitLevel?.(true);
      line.special = 0;
      break;

    // --- lifts (switched) ---
    case 62: EV_DoPlat(line, PlatType.DownWaitUpStay, 1); break;   // SR
    case 21: // S1 Lift
      if (EV_DoPlat(line, PlatType.DownWaitUpStay, 0)) line.special = 0;
      break;
    case 122: // S1 Blazing lift
      if (EV_DoPlat(line, PlatType.BlazeDWUS, 0)) line.special = 0;
      break;
    case 123: EV_DoPlat(line, PlatType.BlazeDWUS, 0); break;       // SR

    // --- perpetual lifts ---
    case 87: EV_DoPlat(line, PlatType.PerpetualRaise, 0); break;   // WR
    case 89: EV_StopPlat(line); break;                             // WR stop

    // --- floors (switched) ---
    case 18: // S1 Floor raise to next
      if (EV_DoFloor(line, FloorType.RaiseFloorToNearest)) line.special = 0;
      break;
    case 20: // S1 Floor raise to nearest and change
      if (EV_DoPlat(line, PlatType.RaiseToNearestAndChange, 0)) line.special = 0;
      break;
    case 23: // S1 Floor lower to lowest
      if (EV_DoFloor(line, FloorType.LowerFloorToLowest)) line.special = 0;
      break;
    case 55: // S1 Floor raise crush
      if (EV_DoFloor(line, FloorType.RaiseFloorCrush)) line.special = 0;
      break;
    case 71: // S1 Turbo lower
      if (EV_DoFloor(line, FloorType.TurboLower)) line.special = 0;
      break;
    case 101: // S1 Floor raise
      if (EV_DoFloor(line, FloorType.RaiseFloor)) line.special = 0;
      break;
    case 102: // S1 Floor lower
      if (EV_DoFloor(line, FloorType.LowerFloor)) line.special = 0;
      break;
    case 140: // S1 Floor raise 512
      if (EV_DoFloor(line, FloorType.RaiseFloor512)) line.special = 0;
      break;

    // --- floors (repeatable) ---
    case 45: EV_DoFloor(line, FloorType.LowerFloor); break;         // SR
    case 60: EV_DoFloor(line, FloorType.LowerFloorToLowest); break; // SR
    case 64: EV_DoFloor(line, FloorType.RaiseFloor); break;         // SR
    case 65: EV_DoFloor(line, FloorType.RaiseFloorCrush); break;    // SR
    case 69: EV_DoFloor(line, FloorType.RaiseFloorToNearest); break;// SR
    case 70: EV_DoFloor(line, FloorType.TurboLower); break;         // SR

    default:
      return false; // not handled yet
  }

  // The used line flips its switch texture (no-op if it isn't a switch, e.g. a
  // manual door track). Repeatable switches flip back after a moment.
  P_ChangeSwitchTexture(line, REPEATABLE_USE.has(orig), orig);
  return true;
}

/** P_CrossSpecialLine: a mobj walked over a trigger line. */
export function P_CrossSpecialLine(line: PLine, side: number, thing: PMobj): boolean {
  // Monsters can only trigger a few types — otherwise they'd open every door
  // and ride every lift in the level on their own.
  if (!thing.player) {
    if (thing.flags & 0x10000 /* MF_MISSILE */) return false;
    switch (line.special) {
      case 39:  // TELEPORT TRIGGER
      case 97:  // TELEPORT RETRIGGER
      case 125: // TELEPORT MONSTERONLY TRIGGER
      case 126: // TELEPORT MONSTERONLY RETRIGGER
      case 4:   // RAISE DOOR
      case 10:  // PLAT DOWN-WAIT-UP-STAY TRIGGER
      case 88:  // PLAT DOWN-WAIT-UP-STAY RETRIGGER
        break;
      default:
        return false;
    }
  }

  switch (line.special) {
    // --- W1: once only ---
    case 2:  if (EV_DoDoor(line, DoorType.Open)) line.special = 0; return true;
    case 3:  if (EV_DoDoor(line, DoorType.Close)) line.special = 0; return true;
    case 4:  if (EV_DoDoor(line, DoorType.Normal)) line.special = 0; return true;
    case 16: if (EV_DoDoor(line, DoorType.Close30ThenOpen)) line.special = 0; return true;
    case 108: if (EV_DoDoor(line, DoorType.BlazeRaise)) line.special = 0; return true;
    case 109: if (EV_DoDoor(line, DoorType.BlazeOpen)) line.special = 0; return true;
    case 110: if (EV_DoDoor(line, DoorType.BlazeClose)) line.special = 0; return true;

    case 5:  if (EV_DoFloor(line, FloorType.RaiseFloor)) line.special = 0; return true;
    case 8:  if (EV_BuildStairs(line, StairType.Build8)) line.special = 0; return true;
    case 19: if (EV_DoFloor(line, FloorType.LowerFloor)) line.special = 0; return true;
    case 22: if (EV_DoPlat(line, PlatType.RaiseToNearestAndChange, 0)) line.special = 0; return true;
    case 30: if (EV_DoFloor(line, FloorType.RaiseToTexture)) line.special = 0; return true;
    case 36: if (EV_DoFloor(line, FloorType.TurboLower)) line.special = 0; return true;
    case 37: if (EV_DoFloor(line, FloorType.LowerAndChange)) line.special = 0; return true;
    case 38: if (EV_DoFloor(line, FloorType.LowerFloorToLowest)) line.special = 0; return true;
    case 56: if (EV_DoFloor(line, FloorType.RaiseFloorCrush)) line.special = 0; return true;
    case 58: if (EV_DoFloor(line, FloorType.RaiseFloor24)) line.special = 0; return true;
    case 59: if (EV_DoFloor(line, FloorType.RaiseFloor24AndChange)) line.special = 0; return true;
    case 119: if (EV_DoFloor(line, FloorType.RaiseFloorToNearest)) line.special = 0; return true;
    case 130: if (EV_DoFloor(line, FloorType.RaiseFloorTurbo)) line.special = 0; return true;

    case 10: if (EV_DoPlat(line, PlatType.DownWaitUpStay, 0)) line.special = 0; return true;
    case 121: if (EV_DoPlat(line, PlatType.BlazeDWUS, 0)) line.special = 0; return true;

    case 6:  if (EV_DoCeiling(line, CeilingType.FastCrushAndRaise)) line.special = 0; return true;
    case 25: if (EV_DoCeiling(line, CeilingType.CrushAndRaise)) line.special = 0; return true;
    case 44: if (EV_DoCeiling(line, CeilingType.LowerAndCrush)) line.special = 0; return true;

    case 39: // W1 Teleport
      if (env.teleport?.(line, side, thing)) line.special = 0;
      return true;

    case 52: // W1 Exit — the classic end-of-level line.
      env.exitLevel?.(false);
      return true;
    case 124: // W1 Secret exit
      env.exitLevel?.(true);
      return true;

    // --- WR: repeatable ---
    case 72: EV_DoCeiling(line, CeilingType.LowerAndCrush); return true;
    case 73: EV_DoCeiling(line, CeilingType.CrushAndRaise); return true;
    case 74: EV_CeilingCrushStop(line); return true;
    case 75: EV_DoDoor(line, DoorType.Close); return true;
    case 76: EV_DoDoor(line, DoorType.Close30ThenOpen); return true;
    case 77: EV_DoCeiling(line, CeilingType.FastCrushAndRaise); return true;
    case 82: EV_DoFloor(line, FloorType.LowerFloorToLowest); return true;
    case 83: EV_DoFloor(line, FloorType.LowerFloor); return true;
    case 84: EV_DoFloor(line, FloorType.LowerAndChange); return true;
    case 86: EV_DoDoor(line, DoorType.Open); return true;
    case 87: EV_DoPlat(line, PlatType.PerpetualRaise, 0); return true;
    case 88: EV_DoPlat(line, PlatType.DownWaitUpStay, 0); return true;
    case 89: EV_StopPlat(line); return true;
    case 90: EV_DoDoor(line, DoorType.Normal); return true;
    case 91: EV_DoFloor(line, FloorType.RaiseFloor); return true;
    case 92: EV_DoFloor(line, FloorType.RaiseFloor24); return true;
    case 93: EV_DoFloor(line, FloorType.RaiseFloor24AndChange); return true;
    case 94: EV_DoFloor(line, FloorType.RaiseFloorCrush); return true;
    case 95: EV_DoPlat(line, PlatType.RaiseToNearestAndChange, 0); return true;
    case 96: EV_DoFloor(line, FloorType.RaiseToTexture); return true;
    case 97: // WR Teleport
      env.teleport?.(line, side, thing);
      return true;
    case 98: EV_DoFloor(line, FloorType.TurboLower); return true;
    case 105: EV_DoDoor(line, DoorType.BlazeRaise); return true;
    case 106: EV_DoDoor(line, DoorType.BlazeOpen); return true;
    case 107: EV_DoDoor(line, DoorType.BlazeClose); return true;
    case 120: EV_DoPlat(line, PlatType.BlazeDWUS, 0); return true;
    case 128: EV_DoFloor(line, FloorType.RaiseFloorToNearest); return true;
    case 129: EV_DoFloor(line, FloorType.RaiseFloorTurbo); return true;

    default:
      return false;
  }
}
