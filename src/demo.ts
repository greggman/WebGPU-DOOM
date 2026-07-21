// Demo playback. Ported from linuxdoom-1.10/g_game.c (G_DoPlayDemo /
// G_ReadDemoTiccmd).
//
// This is the correctness oracle for the playsim. A demo is a stream of raw
// input (a ticcmd per tic) with no state in it: replay the same input against
// the same map and every position, every monster, every RNG draw must land
// identically. If the playsim drifts by one fixed-point bit, the demo desyncs.
// Nothing else tests DOOM's physics this precisely.
//
// Header (13 bytes), then 4 bytes per tic, then 0x80.

import type { Wad } from './wad.js';

export const DEMOMARKER = 0x80;

/** d_ticcmd.h ticcmd_t — only the four fields a demo actually stores. */
export interface TicCmd {
  /** *2048 for movement. */
  forwardMove: number;
  sideMove: number;
  /** <<16 for the angle delta. */
  angleTurn: number;
  buttons: number;
}

export interface Demo {
  name: string;
  version: number;
  skill: number;
  episode: number;
  map: number;
  deathmatch: boolean;
  respawnParm: boolean;
  fastParm: boolean;
  noMonsters: boolean;
  consolePlayer: number;
  playerInGame: boolean[];
  cmds: TicCmd[];
}

/**
 * g_game.c enforces `version == VERSION` (110) and rejects everything else.
 * But 1.10 was never a released DOS build: linuxdoom-1.10 is the 1.9 codebase
 * with the constant bumped for the Linux port, so it refuses the very demos
 * shipped in the 1.9 IWADs it otherwise plays perfectly. doom1.wad's DEMO1-3
 * are all version 109. Accept the range vanilla's own logic can actually run,
 * as Chocolate Doom does.
 */
const MIN_VERSION = 104;
const MAX_VERSION = 109;

export function readDemo(wad: Wad, name: string): Demo {
  const l = wad.lump(name);
  if (l.length < 14) throw new Error(`${name}: too short to be a demo`);

  const version = l[0];
  if (version < MIN_VERSION || version > MAX_VERSION) {
    throw new Error(`${name}: demo version ${version} unsupported (want ${MIN_VERSION}-${MAX_VERSION})`);
  }

  const demo: Demo = {
    name,
    version,
    skill: l[1],
    episode: l[2],
    map: l[3],
    deathmatch: l[4] !== 0,
    respawnParm: l[5] !== 0,
    fastParm: l[6] !== 0,
    noMonsters: l[7] !== 0,
    consolePlayer: l[8],
    playerInGame: [l[9] !== 0, l[10] !== 0, l[11] !== 0, l[12] !== 0],
    cmds: [],
  };

  let p = 13;
  while (p < l.length && l[p] !== DEMOMARKER) {
    if (p + 4 > l.length) throw new Error(`${name}: truncated ticcmd at ${p}`);
    demo.cmds.push({
      // forwardmove/sidemove are signed chars; angleturn is the high byte only.
      forwardMove: (l[p] << 24) >> 24,
      sideMove: (l[p + 1] << 24) >> 24,
      angleTurn: l[p + 2] << 8,
      buttons: l[p + 3],
    });
    p += 4;
  }

  if (p >= l.length) throw new Error(`${name}: no DEMOMARKER — truncated`);
  return demo;
}
