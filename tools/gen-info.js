// Generate src/info.ts from DOOM/linuxdoom-1.10/info.{h,c}.
//
// info.c is ~4700 lines of pure table: 138 sprite names, 967 states, 137 mobj
// types. Hand-porting it invites a silent transcription error somewhere around
// row 700 that surfaces as one monster with the wrong death animation. Parsing
// the C is deterministic and re-runnable, so it's the only sane option.
//
//   node tools/gen-info.js
//
// Writes src/info.ts directly rather than to stdout — a redirect makes the
// invocation a shell construct, and errors would clobber the output file.

import { readFileSync, writeFileSync } from 'node:fs';

const OUT = 'src/info.ts';

const SRC = 'DOOM/linuxdoom-1.10';
const h = readFileSync(`${SRC}/info.h`, 'utf8');
const c = readFileSync(`${SRC}/info.c`, 'utf8');

/** Strip // and /* comments, preserving line structure. */
const decomment = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/**
 * Pull `enum { A, B, C, NUMFOO }` members in declaration order -> name to
 * index. The trailing NUM* member is a count, not a value, so drop it.
 */
function parseEnum(src, terminator) {
  const i = src.indexOf(terminator);
  if (i < 0) throw new Error(`enum ${terminator} not found`);
  const open = src.lastIndexOf('{', i);
  const body = decomment(src.slice(open + 1, src.lastIndexOf('}', i)));
  const out = new Map();
  let next = 0;
  for (let tok of body.split(',')) {
    tok = tok.trim();
    if (!tok) continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=\s*(-?\d+))?$/.exec(tok);
    if (!m) continue;
    if (/^NUM[A-Z]+$/.test(m[1])) continue;
    if (m[2] !== undefined) next = parseInt(m[2], 10);
    out.set(m[1], next++);
  }
  return out;
}

const spriteEnum = parseEnum(h, 'spritenum_t');
const stateEnum = parseEnum(h, 'statenum_t');
const mobjEnum = parseEnum(h, 'mobjtype_t');

// MF_* live in p_mobj.h as an explicitly-valued enum. Parse rather than
// transcribe: hand-copying these put MF_CORPSE and MF_NOTDMATCH on the wrong
// bits, which flags nothing at compile time and corrupts collision at runtime.
const mobjFlags = new Map();
{
  const mf = readFileSync(`${SRC}/p_mobj.h`, 'utf8');
  for (const m of decomment(mf).matchAll(/\b(MF_[A-Z0-9_]+)\s*=\s*(0x[0-9a-fA-F]+|\d+)/g)) {
    mobjFlags.set(m[1], m[2].startsWith('0x') ? parseInt(m[2], 16) : parseInt(m[2], 10));
  }
}

/** Evaluate a `MF_A|MF_B|MF_C` expression to a number. */
function evalFlags(expr) {
  let v = 0;
  for (let tok of expr.split('|')) {
    tok = tok.trim();
    if (!tok || tok === '0') continue;
    if (!mobjFlags.has(tok)) throw new Error(`unknown mobj flag ${tok}`);
    // >>> 0 keeps the bitwise OR in unsigned space; MF_TRANSLATION is 0xc000000
    // and the set as a whole stays under 32 bits.
    v = (v | mobjFlags.get(tok)) >>> 0;
  }
  return v;
}

// ---- sprnames -----------------------------------------------------------
const sprBody = decomment(c).slice(decomment(c).indexOf('sprnames'));
const sprNames = [...sprBody.slice(0, sprBody.indexOf('};')).matchAll(/"([A-Z0-9]{4})"/g)].map((m) => m[1]);

// ---- states -------------------------------------------------------------
// {SPR_TROO,0,-1,{NULL},S_NULL,0,0}
const cc = decomment(c);
const statesBody = cc.slice(cc.indexOf('states[NUMSTATES]'));
const states = [];
const actionNames = new Set();
for (const m of statesBody.slice(0, statesBody.indexOf('\n};')).matchAll(/\{\s*(SPR_[A-Z0-9]+)\s*,([^,]+),([^,]+),\s*\{([^}]*)\}\s*,\s*([A-Za-z0-9_]+)\s*,([^,]+),([^}]+)\}/g)) {
  const rawFrame = evalInt(m[2]);
  // The action is a function pointer: {NULL} or {A_Chase}. It's what drives
  // every monster and weapon — dropping it leaves a state machine that ticks
  // but never does anything.
  const action = m[4].trim();
  if (action !== 'NULL') actionNames.add(action);
  states.push({
    sprite: spriteEnum.get(m[1]),
    // Bit 15 of the frame field is the fullbright flag (r_things.c).
    frame: rawFrame & 0x7fff,
    fullbright: (rawFrame & 0x8000) !== 0,
    tics: evalInt(m[3]),
    action: action === 'NULL' ? null : action,
    nextState: stateEnum.get(m[5]) ?? 0,
  });
}

// ---- mobjinfo -----------------------------------------------------------
// 23 comma-separated fields per { } block, in mobjtype_t order:
//  0 doomednum      1 spawnstate    2 spawnhealth   3 seestate    4 seesound
//  5 reactiontime   6 attacksound   7 painstate     8 painchance  9 painsound
// 10 meleestate    11 missilestate 12 deathstate   13 xdeathstate 14 deathsound
// 15 speed         16 radius       17 height       18 mass        19 damage
// 20 activesound   21 flags        22 raisestate
const MOBJ_FIELDS = 23;
const moBody = cc.slice(cc.indexOf('mobjinfo[NUMMOBJTYPES]'));
const mobjInfo = [];
for (const m of moBody.slice(0, moBody.lastIndexOf('\n};')).matchAll(/\{([^{}]*)\}/g)) {
  const f = m[1].split(',').map((s) => s.trim());
  if (f.length !== MOBJ_FIELDS) continue;
  const st = (i) => stateEnum.get(f[i]) ?? 0;
  mobjInfo.push({
    doomedNum: evalInt(f[0]),
    spawnState: st(1),
    spawnHealth: evalInt(f[2]),
    seeState: st(3),
    // A_Look switches on this and draws P_Random ONLY for the multi-variant
    // sit sounds (posit1..3 draws %3, bgsit1..2 draws %2). So the see sound
    // decides whether the RNG advances when a monster wakes up.
    seeSound: f[4],
    reactionTime: evalInt(f[5]),
    /** sfx name for the melee attack (A_TroopAttack etc.), or "sfx_None". */
    attackSound: f[6],
    painState: st(7),
    painChance: evalInt(f[8]),
    /** sfx name A_Pain plays when the monster flinches, or "sfx_None". */
    painSound: f[9],
    meleeState: st(10),
    missileState: st(11),
    deathState: st(12),
    xdeathState: st(13),
    // A_Scream switches on this and draws P_Random ONLY for the multi-variant
    // sounds (podth1..3 draws %3, bgdth1..2 draws %2, sfx_None draws nothing).
    // So the death sound decides whether the RNG advances.
    deathSound: f[14],
    speed: evalInt(f[15]),
    radius: evalInt(f[16]),
    height: evalInt(f[17]),
    mass: evalInt(f[18]),
    damage: evalInt(f[19]),
    // Kept as the sfx name: p_enemy.c short-circuits on it
    // (`if (activesound && P_Random() < 3)`), so whether it's sfx_None decides
    // whether the RNG advances. Emitting it as a bool would work; emitting it
    // at all is the point.
    activeSound: f[20],
    flags: evalFlags(f[21]),
    raiseState: st(22),
  });
}

// ---- weaponinfo (d_items.c) ---------------------------------------------
// 6 fields per weapon: ammo type, up, down, ready, attack, flash states.
const di = decomment(readFileSync(`${SRC}/d_items.c`, 'utf8'));
const ammoEnum = parseEnum(readFileSync(`${SRC}/doomdef.h`, 'utf8'), 'ammotype_t');
const weaponEnum = parseEnum(readFileSync(`${SRC}/doomdef.h`, 'utf8'), 'weapontype_t');

const weaponInfo = [];
{
  const body = di.slice(di.indexOf('weaponinfo[NUMWEAPONS]'));
  for (const m of body.slice(0, body.indexOf('\n};')).matchAll(/\{([^{}]*)\}/g)) {
    const f = m[1].split(',').map((s) => s.trim()).filter(Boolean);
    if (f.length !== 6) continue;
    weaponInfo.push({
      ammo: ammoEnum.get(f[0]) ?? 5, // am_noammo
      upState: stateEnum.get(f[1]) ?? 0,
      downState: stateEnum.get(f[2]) ?? 0,
      readyState: stateEnum.get(f[3]) ?? 0,
      atkState: stateEnum.get(f[4]) ?? 0,
      flashState: stateEnum.get(f[5]) ?? 0,
    });
  }
}

/** Evaluate the small integer expressions the tables use: 16*FRACUNIT, -1, 8. */
function evalInt(s) {
  s = s.trim().replace(/FRACUNIT/g, '65536');
  if (/^-?\d+$/.test(s)) return parseInt(s, 10);
  const m = /^(-?\d+)\s*\*\s*(-?\d+)$/.exec(s);
  if (m) return parseInt(m[1], 10) * parseInt(m[2], 10);
  return 0;
}

// ---- sanity -------------------------------------------------------------
const errs = [];
if (sprNames.length !== spriteEnum.size) errs.push(`sprnames ${sprNames.length} != SPR_ enum ${spriteEnum.size}`);
if (states.length !== stateEnum.size) errs.push(`states ${states.length} != S_ enum ${stateEnum.size}`);
if (mobjInfo.length !== mobjEnum.size) errs.push(`mobjinfo ${mobjInfo.length} != MT_ enum ${mobjEnum.size}`);
for (const s of states) if (s.sprite === undefined) errs.push('state with unknown sprite');
if (errs.length) {
  console.error('gen-info: ' + errs.join('\n           '));
  process.exit(1);
}

// ---- emit ---------------------------------------------------------------
const j = (v) => JSON.stringify(v);
writeFileSync(OUT, `// GENERATED by tools/gen-info.js from ${SRC}/info.{h,c} — do not edit.
// ${sprNames.length} sprites, ${states.length} states, ${mobjInfo.length} mobj types.

export interface State {
  sprite: number;
  frame: number;
  fullbright: boolean;
  /** -1 means the state never advances. */
  tics: number;
  /**
   * Action function name, or null. P_SetMobjState calls it on entry — this is
   * what makes a monster chase and a weapon fire. Look it up in an action
   * table; a name with no implementation is a gap, not an error.
   */
  action: string | null;
  nextState: number;
}

export interface MobjInfo {
  /** THINGS type from the map; -1 for things never placed by an editor. */
  doomedNum: number;
  spawnState: number;
  spawnHealth: number;
  /** Entered when the monster first notices a target. */
  seeState: number;
  /** sfx name, or "sfx_None". A_Look's wake-up RNG draw depends on which one. */
  seeSound: string;
  reactionTime: number;
  /** sfx name for the melee attack, or "sfx_None". */
  attackSound: string;
  painState: number;
  /** 0..255 chance out of 256 of flinching when hurt. */
  painChance: number;
  /** sfx name A_Pain plays, or "sfx_None". */
  painSound: string;
  meleeState: number;
  missileState: number;
  deathState: number;
  xdeathState: number;
  /** sfx name, or "sfx_None". A_Scream's RNG draw depends on which one. */
  deathSound: string;
  /** Map units per move for monsters; fixed_t for missiles. */
  speed: number;
  /** Fixed-point (16.16), as in the C tables. */
  radius: number;
  height: number;
  mass: number;
  damage: number;
  /** sfx name, or "sfx_None". p_enemy.c short-circuits the RNG draw on it. */
  activeSound: string;
  /** Resolved MF_* bitmask. */
  flags: number;
  raiseState: number;
}

/** p_mobj.h mobj flags, parsed from the enum rather than transcribed. */
export const MF = {
${[...mobjFlags].map(([k, v]) => `  ${k}: 0x${v.toString(16)},`).join('\n')}
} as const;

export const sprNames: string[] = ${j(sprNames)};

export const states: State[] = ${j(states)};

export const mobjInfo: MobjInfo[] = ${j(mobjInfo)};

/** doomednum -> mobjInfo index. p_setup.c P_SpawnMapThing does this scan. */
export const byDoomedNum: Map<number, number> = new Map(
  mobjInfo.map((m, i) => [m.doomedNum, i] as const).filter(([n]) => n >= 0),
);

/** statenum_t. Generated so no caller has to hardcode a state index. */
export const S = {
${[...stateEnum].map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const;

/** mobjtype_t. */
export const MT = {
${[...mobjEnum].map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const;

/**
 * Every action function name the state table references (${actionNames.size} of them).
 * Use it to assert an action table covers what the states can actually reach.
 */
export const ACTION_NAMES: readonly string[] = ${j([...actionNames].sort())};

/** d_items.h weaponinfo_t. */
export interface WeaponInfo {
  /** ammotype_t; am_noammo means the weapon consumes nothing. */
  ammo: number;
  upState: number;
  downState: number;
  readyState: number;
  atkState: number;
  flashState: number;
}

export const weaponInfo: WeaponInfo[] = ${j(weaponInfo)};

/** doomdef.h weapontype_t. */
export const WP = {
${[...weaponEnum].map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const;

/** doomdef.h ammotype_t. */
export const AM = {
${[...ammoEnum].map(([k, v]) => `  ${k}: ${v},`).join('\n')}
} as const;

/** p_inter.c. Ammo caps, and the per-clip pickup amounts. */
export const maxAmmo: readonly number[] = [200, 50, 300, 50];
export const clipAmmo: readonly number[] = [10, 4, 20, 1];
`);

console.error(`gen-info: wrote ${OUT} — ${sprNames.length} sprites, ${states.length} states, ` +
              `${mobjInfo.length} mobj types, ${actionNames.size} actions`);
