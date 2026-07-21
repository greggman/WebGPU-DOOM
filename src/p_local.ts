// Runtime playsim structures. Ported from linuxdoom-1.10/r_defs.h and p_local.h.
//
// These are NOT the structures in map.ts. That module holds the on-disk map in
// raw map units for the renderer; the playsim needs fixed_t (16.16) with the
// derived fields P_LoadLineDefs computes at load. Keeping them apart means the
// renderer never accidentally does physics in floats, which is the fastest way
// to desync a demo.

import { FRACUNIT } from './m_fixed.js';

export const enum SlopeType {
  Horizontal = 0,
  Vertical = 1,
  Positive = 2,
  Negative = 3,
}

/** r_defs.h sector_t, runtime half. */
export interface PSector {
  /** fixed_t. */
  floorHeight: number;
  ceilingHeight: number;
  /** Flat names. Some specials COPY these between sectors (raiseAndChange), so
   *  the sim owns them too, not just the renderer. */
  floorPic: string;
  ceilingPic: string;
  lightLevel: number;
  special: number;
  tag: number;
  /** Indices into the renderer-side map, so geometry can follow moving sectors. */
  index: number;
  /** Head of this sector's mobj list (r_defs.h sector_t.thinglist). */
  thingList: PMobj | null;
  /** Set while a floor/ceiling thinker owns this sector. */
  specialData: unknown | null;
  /** Sector centre (fixed_t), the origin for its door/lift/floor sounds
   *  (p_setup.c P_GroupLines soundorg). */
  soundX: number;
  soundY: number;
  /** p_enemy.c sound flood: the noise-maker heard here, or null. A_Look reads it. */
  soundTarget: PMobj | null;
  /** How many sound-blocking lines the flood crossed to reach here. */
  soundTraversed: number;
  /** Flood-fill visited marker, compared against p_enemy's sound validcount. */
  validCount: number;
  /**
   * Blockmap cells this sector spans, [top, bottom, left, right], widened by
   * MAXRADIUS and clamped to the grid. p_setup.c P_GroupLines computes it;
   * P_ChangeSector uses it to find every mobj a moving plane could touch.
   */
  blockBox: [number, number, number, number];
  /** Lines bounding this sector, by index. */
  lineIndices: number[];
}

/** r_defs.h line_t, runtime half. */
export interface PLine {
  index: number;
  /** fixed_t endpoints. */
  v1x: number;
  v1y: number;
  v2x: number;
  v2y: number;
  /** Precomputed v2 - v1 (p_setup.c P_LoadLineDefs). */
  dx: number;
  dy: number;
  flags: number;
  special: number;
  tag: number;
  /** -1 when there's no back side. */
  sideNum: [number, number];
  /** fixed_t bbox: [top, bottom, left, right] (BOXTOP..BOXRIGHT). */
  bbox: [number, number, number, number];
  slopeType: SlopeType;
  frontSector: PSector | null;
  backSector: PSector | null;
  /** Bumped when a line is activated, so once-only specials stay once-only. */
  validCount: number;
  /** Automap: set once the player has had line-of-sight to this line. */
  seen: boolean;
}

/** p_mobj.h mobj_t — the fields the sim actually touches. */
export interface PMobj {
  /** fixed_t position. */
  x: number;
  y: number;
  z: number;
  /** BAM angle (0..2^32). */
  angle: number;
  /** fixed_t momentum. */
  momx: number;
  momy: number;
  momz: number;
  /** fixed_t. */
  radius: number;
  height: number;
  floorZ: number;
  ceilingZ: number;
  /** mobjtype_t index into info.ts mobjInfo. */
  type: number;
  /** statenum_t index into info.ts states. */
  state: number;
  tics: number;
  sprite: number;
  frame: number;
  flags: number;
  health: number;
  /** Subsector the mobj currently sits in. */
  subSector: number;
  /** Set for the player's mobj. */
  player: PPlayer | null;
  /** p_tick.c thinker list membership. */
  removed: boolean;

  // --- AI state (p_enemy.c) ----------------------------------------------
  /** Who this monster is chasing / shooting at. Also a missile's owner. */
  target: PMobj | null;
  /** A homing missile's victim; the arch-vile's flame. */
  tracer: PMobj | null;
  /** Which player to check next. Seeded by P_SpawnMobj's P_Random draw. */
  lastLook: number;
  /** Tics before it may act after waking / teleporting. */
  reactionTime: number;
  /** Tics it will stay locked on this target regardless of provocation. */
  threshold: number;
  /** Direction index 0..7 (DI_EAST..), or DI_NODIR. */
  moveDir: number;
  /** Tics until it reconsiders direction. */
  moveCount: number;

  // Blockmap and sector links. Vanilla threads mobjs through intrusive doubly
  // linked lists; the ORDER matters (new things are prepended, and iteration
  // order decides which of two overlapping things you hit first), so these are
  // modelled as real links rather than rebuilt arrays.
  bnext: PMobj | null;
  bprev: PMobj | null;
  snext: PMobj | null;
  sprev: PMobj | null;
  /** Sector this mobj is linked into, for unlinking. */
  sector: PSector | null;
  /** Blockmap cell index it's linked into, or -1 when off the map. */
  blockIndex: number;
}

/** d_player.h player_t. */
export interface PPlayer {
  mo: PMobj | null;
  /** Pending pickup/HUD notification; the display layer consumes and clears it. */
  message: string;
  /** fixed_t view height above the feet. */
  viewZ: number;
  viewHeight: number;
  deltaViewHeight: number;
  bob: number;
  health: number;
  /** playerstate_t. */
  state: number;

  // --- inventory (p_inter.c) ---------------------------------------------
  armorPoints: number;
  /** 0 none, 1 green (absorbs 1/3), 2 blue (absorbs 1/2). */
  armorType: number;
  /** Indexed by ammotype_t: clip, shell, cell, misl. */
  ammo: number[];
  maxAmmo: number[];
  /** Indexed by weapontype_t. */
  weaponOwned: boolean[];
  readyWeapon: number;
  /** The weapon being switched to, or -1. */
  pendingWeapon: number;
  /** Indexed by card_t: blue/yellow/red card, then the three skulls. */
  cards: boolean[];
  /** Tics remaining, indexed by powertype_t. */
  powers: number[];
  /** Who last hurt us — the death cam turns to face them. */
  attacker: PMobj | null;
  /** Screen-flash counters for the palette tint. */
  damageCount: number;
  bonusCount: number;
  /** Monsters and items collected, for the intermission. */
  killCount: number;
  itemCount: number;
  secretCount: number;
  /** True while the fire button was down last tic. */
  attackDown: boolean;
  /** A backpack doubles every ammo cap, but only the first one counts. */
  backpack: boolean;
  /** Console cheats. */
  cheatGod: boolean;
  cheatNoClip: boolean;
  /** The weapon and muzzle-flash overlays — a second state machine. */
  psprites: { state: number; tics: number; sx: number; sy: number }[];
  /** Muzzle-flash brightness boost, 0..2. Feeds the renderer's extralight. */
  extraLight: number;
  /** Set from the ticcmd each tic. */
  cmd: {
    forwardMove: number;
    sideMove: number;
    angleTurn: number;
    buttons: number;
  };
  /** Consecutive attack tics — p_pspr.c uses it for chaingun accuracy. */
  refire: number;
  /** Use is edge-triggered — p_user.c usedown. */
  useDown: boolean;
}

/** p_local.h. */
export const MAXRADIUS = 32 * FRACUNIT;
export const ONFLOORZ = -2147483648; // MININT
export const ONCEILINGZ = 2147483647; // MAXINT

/** p_local.h view/bob constants. */
export const VIEWHEIGHT = 41 * FRACUNIT;

// Mobj flags are GENERATED — see info.ts's `MF`, parsed from p_mobj.h by
// tools/gen-info.js. Hand-writing them here put MF_CORPSE and MF_NOTDMATCH on
// the wrong bits, which nothing catches until collision misbehaves at runtime.
export { MF } from './info.js';
