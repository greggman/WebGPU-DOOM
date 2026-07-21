// Light effects. Ported from linuxdoom-1.10/p_lights.c.
//
// P_SpawnSpecials scans every sector at level start and turns the light-type
// specials into thinkers. Several of them draw P_Random AT SPAWN to randomise
// their initial phase — so the RNG sequence depends on how many light sectors a
// map has and in what order they're scanned. That makes lights demo-critical
// even though they're purely visual.

import { P_Random } from './m_random.js';
import { P_AddThinker, type Thinker } from './p_tick.js';
import { P_FindMinSurroundingLight } from './p_sectors.js';
import type { PSector } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

/** p_spec.h. */
const STROBEBRIGHT = 5;
const FASTDARK = 15;
const SLOWDARK = 35;
const GLOWSPEED = 8;

let level: PlaysimMap;
export function P_SetLightLevel(l: PlaysimMap): void {
  level = l;
}

interface LightFlash {
  sector: PSector;
  count: number;
  maxLight: number;
  minLight: number;
  maxTime: number;
  minTime: number;
}

/** T_LightFlash: random on/off flicker. */
function T_LightFlash(flash: LightFlash): void {
  if (--flash.count) return;

  if (flash.sector.lightLevel === flash.maxLight) {
    flash.sector.lightLevel = flash.minLight;
    flash.count = (P_Random() & flash.minTime) + 1;
  } else {
    flash.sector.lightLevel = flash.maxLight;
    flash.count = (P_Random() & flash.maxTime) + 1;
  }
}

function P_SpawnLightFlash(sector: PSector): void {
  sector.special = 0; // consumed; the thinker owns it now

  const flash: LightFlash = {
    sector,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level, sector, sector.lightLevel),
    maxTime: 64,
    minTime: 7,
    count: 0,
  };
  flash.count = (P_Random() & flash.maxTime) + 1; // random initial phase
  const t: Thinker = { removed: false, tick: () => T_LightFlash(flash) };
  P_AddThinker(t);
}

interface Strobe {
  sector: PSector;
  count: number;
  minLight: number;
  maxLight: number;
  darkTime: number;
  brightTime: number;
}

/** T_StrobeFlash: regular on/off (the horror-movie flicker). */
function T_StrobeFlash(flash: Strobe): void {
  if (--flash.count) return;

  if (flash.sector.lightLevel === flash.minLight) {
    flash.sector.lightLevel = flash.maxLight;
    flash.count = flash.brightTime;
  } else {
    flash.sector.lightLevel = flash.minLight;
    flash.count = flash.darkTime;
  }
}

function P_SpawnStrobeFlash(sector: PSector, darkTime: number, inSync: boolean): void {
  const flash: Strobe = {
    sector,
    darkTime,
    brightTime: STROBEBRIGHT,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level, sector, sector.lightLevel),
    count: 0,
  };
  if (flash.minLight === flash.maxLight) flash.minLight = 0;
  sector.special = 0;

  // inSync strobes all fire together (count 1); free ones get a random phase.
  flash.count = inSync ? 1 : (P_Random() & 7) + 1;

  const t: Thinker = { removed: false, tick: () => T_StrobeFlash(flash) };
  P_AddThinker(t);
}

interface Glow {
  sector: PSector;
  minLight: number;
  maxLight: number;
  direction: number;
}

/** T_Glow: smooth pulse between min and max. */
function T_Glow(g: Glow): void {
  if (g.direction === -1) {
    g.sector.lightLevel -= GLOWSPEED;
    if (g.sector.lightLevel <= g.minLight) {
      g.sector.lightLevel += GLOWSPEED;
      g.direction = 1;
    }
  } else {
    g.sector.lightLevel += GLOWSPEED;
    if (g.sector.lightLevel >= g.maxLight) {
      g.sector.lightLevel -= GLOWSPEED;
      g.direction = -1;
    }
  }
}

function P_SpawnGlowingLight(sector: PSector): void {
  const g: Glow = {
    sector,
    minLight: P_FindMinSurroundingLight(level, sector, sector.lightLevel),
    maxLight: sector.lightLevel,
    direction: -1,
  };
  sector.special = 0;
  const t: Thinker = { removed: false, tick: () => T_Glow(g) };
  P_AddThinker(t);
}

interface FireFlicker {
  sector: PSector;
  count: number;
  maxLight: number;
  minLight: number;
}

/** T_FireFlicker: torch flicker — a small random jitter around max. */
function T_FireFlicker(f: FireFlicker): void {
  if (--f.count) return;
  const amount = (P_Random() & 3) * 16;
  if (f.sector.lightLevel - amount < f.minLight) f.sector.lightLevel = f.minLight;
  else f.sector.lightLevel = f.maxLight - amount;
  f.count = 4;
}

function P_SpawnFireFlicker(sector: PSector): void {
  sector.special = 0;
  const f: FireFlicker = {
    sector,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level, sector, sector.lightLevel) + 16,
    count: 4,
  };
  const t: Thinker = { removed: false, tick: () => T_FireFlicker(f) };
  P_AddThinker(t);
}

/**
 * P_SpawnSpecials, the light portion. Runs at level load, in sector order.
 * Sector special 9 (secret) is COUNTED here for the intermission but spawns no
 * thinker; doors 10/14 are handled by p_doors.
 */
export function P_SpawnLightSpecials(): number {
  let totalSecret = 0;

  for (const sector of level.sectors) {
    switch (sector.special) {
      case 1:  P_SpawnLightFlash(sector); break;
      case 2:  P_SpawnStrobeFlash(sector, FASTDARK, false); break;
      case 3:  P_SpawnStrobeFlash(sector, SLOWDARK, false); break;
      case 4:  // strobe + slime: keep the special so the damage floor still works
        P_SpawnStrobeFlash(sector, FASTDARK, false);
        sector.special = 4;
        break;
      case 8:  P_SpawnGlowingLight(sector); break;
      case 9:  totalSecret++; break;
      case 12: P_SpawnStrobeFlash(sector, SLOWDARK, true); break;
      case 13: P_SpawnStrobeFlash(sector, FASTDARK, true); break;
      case 17: P_SpawnFireFlicker(sector); break;
      default: break;
    }
  }

  return totalSecret;
}
