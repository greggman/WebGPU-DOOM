// Map objects. Ported from linuxdoom-1.10/p_mobj.c.

import { FixedMul, FRACUNIT } from './m_fixed.js';
import { P_Random, pRandomCount } from './m_random.js';

// Debug-only spawn log for demo-sync tooling: (type, x, y, draw#) per P_SpawnMobj.
let spawnLog: ((type: number, x: number, y: number, draw: number) => void) | null = null;
export function setSpawnLog(fn: ((type: number, x: number, y: number, draw: number) => void) | null): void {
  spawnLog = fn;
}
import { states, mobjInfo, MF, MT, S } from './info.js';
import { R_PointToAngle2 } from './r_point.js';
import { finesine, finecosine, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import { P_AddThinker, P_RemoveThinker, type Thinker } from './p_tick.js';
import { P_AproxDistance } from './p_maputl.js';
import { S_StartSound } from './s_sound.js';
import { P_SetThingPosition, P_UnsetThingPosition } from './p_blockmap.js';
import { P_CallAction } from './p_action.js';
import { DI_EAST, MAXPLAYERS } from './p_enemy.js';
import { ONFLOORZ, ONCEILINGZ, VIEWHEIGHT, type PMobj, type PSector } from './p_local.js';

/** p_local.h / p_mobj.c. */
export const GRAVITY = FRACUNIT;
export const MAXMOVE = 30 * FRACUNIT;
export const STOPSPEED = 0x1000;
export const FRICTION = 0xe800;

export const S_NULL = 0;

/**
 * Hooks the sim needs but that live in other translation units. Set once at
 * level start. Keeps p_mobj from importing the whole engine and lets the
 * headless oracle run with the pieces that exist.
 */
export interface MobjEnv {
  /** Sector at a point, via the BSP. r_main.c R_PointInSubsector. */
  sectorAt: (x: number, y: number) => PSector;
  /** Subsector index at a point. */
  subSectorAt: (x: number, y: number) => number;
  /** p_map.c P_TryMove. Returns false when blocked. */
  tryMove: (mo: PMobj, x: number, y: number) => boolean;
  /** p_map.c P_SlideMove. */
  slideMove: (mo: PMobj) => void;
  /** p_inter.c P_ExplodeMissile. */
  explodeMissile: (mo: PMobj) => void;
}

let env: MobjEnv;
export function P_SetMobjEnv(e: MobjEnv): void {
  env = e;
}

/** Every mobj carries its thinker node; the sim walks these in spawn order. */
const thinkerOf = new WeakMap<PMobj, Thinker>();

/**
 * P_SetMobjState. Walks the state chain while tics == 0, so zero-tic states
 * chain through in a single call — that's how DOOM's action functions fire in
 * sequence. Returns false if the mobj removed itself.
 */
export function P_SetMobjState(mo: PMobj, state: number): boolean {
  do {
    if (state === S_NULL) {
      mo.state = S_NULL;
      P_RemoveMobj(mo);
      return false;
    }
    const st = states[state];
    mo.state = state;
    mo.tics = st.tics;
    mo.sprite = st.sprite;
    mo.frame = st.frame;

    // The action runs on ENTRY to the state, before the tics elapse. It can
    // remove the mobj (A_Fall on a corpse, an exploding missile), so bail
    // rather than keep walking a dead thing's chain.
    if (st.action) {
      P_CallAction(st.action, mo);
      if (mo.removed) return false;
    }

    state = st.nextState;
  } while (mo.tics === 0);

  return true;
}

/**
 * P_SpawnMobj.
 *
 * Note `lastlook = P_Random() % MAXPLAYERS`: EVERY spawn draws from the shared
 * gameplay RNG. So the order things spawn in — which is THINGS lump order —
 * determines the random sequence for the whole level. Spawn one extra mobj, or
 * spawn them in a different order, and every subsequent P_Random draw shifts.
 */
export function P_SpawnMobj(x: number, y: number, z: number, type: number): PMobj {
  const info = mobjInfo[type];
  const st = states[info.spawnState];

  // MT_TELEPORTMAN is NOSECTOR in vanilla, which finds it by scanning thinkercap
  // (every mobj) in EV_Teleport. We have no global mobj list, so EV_Teleport
  // scans sector thingLists — which needs the marker linked into its sector.
  // Drop NOSECTOR so P_SetThingPosition links it; nothing RNG-drawing iterates
  // thingLists, so this stays demo-sync-neutral. (It keeps NOBLOCKMAP.)
  const flags = type === MT.MT_TELEPORTMAN ? info.flags & ~MF.MF_NOSECTOR : info.flags;

  const mo: PMobj = {
    x, y, z: 0,
    angle: 0,
    momx: 0, momy: 0, momz: 0,
    radius: info.radius,
    height: info.height,
    floorZ: 0,
    ceilingZ: 0,
    type,
    state: info.spawnState,
    tics: st.tics,
    sprite: st.sprite,
    frame: st.frame,
    flags,
    health: info.spawnHealth,
    subSector: 0,
    player: null,
    removed: false,
    bnext: null, bprev: null, snext: null, sprev: null,
    sector: null,
    blockIndex: -1,
    target: null,
    tracer: null,
    lastLook: 0,
    reactionTime: info.reactionTime,
    threshold: 0,
    // Vanilla P_SpawnMobj memsets the whole mobj to 0, so movedir starts at
    // DI_EAST (0), NOT DI_NODIR. P_NewChaseDir reads this initial value the first
    // time a monster gives chase, so seeding it wrong changes the direction it
    // picks — and the P_Random it draws — desyncing demos once monsters engage.
    moveDir: DI_EAST,
    moveCount: 0,
  };

  // `lastlook = P_Random() % MAXPLAYERS` — which player this monster checks
  // first. The draw is unconditional and its RESULT matters: it staggers when
  // each monster notices you, so they don't all wake on the same tic.
  mo.lastLook = P_Random() % MAXPLAYERS;
  spawnLog?.(type, x, y, pRandomCount());

  // P_SetThingPosition links it into its sector and blockmap cell — it must
  // happen before floorz is read, because it sets mo.subSector.
  P_SetThingPosition(mo);
  const sec = env.sectorAt(x, y);
  mo.floorZ = sec.floorHeight;
  mo.ceilingZ = sec.ceilingHeight;

  if (z === ONFLOORZ) mo.z = mo.floorZ;
  else if (z === ONCEILINGZ) mo.z = (mo.ceilingZ - info.height) | 0;
  else mo.z = z;

  const thinker: Thinker = { removed: false, tick: () => P_MobjThinker(mo) };
  thinkerOf.set(mo, thinker);
  P_AddThinker(thinker);

  return mo;
}

/** P_RemoveMobj (the thinker half; item respawn queue comes later). */
export function P_RemoveMobj(mo: PMobj): void {
  // Unlink before flagging: a removed mobj must leave no dangling links in the
  // sector or blockmap lists.
  P_UnsetThingPosition(mo);
  mo.removed = true;
  const t = thinkerOf.get(mo);
  if (t) P_RemoveThinker(t);
}

/**
 * P_XYMovement. The half-step loop matters: a move larger than MAXMOVE/2 is
 * split so collision can't be tunnelled through at speed.
 */
export function P_XYMovement(mo: PMobj): void {
  if (mo.momx === 0 && mo.momy === 0) return;

  const player = mo.player;

  if (mo.momx > MAXMOVE) mo.momx = MAXMOVE;
  else if (mo.momx < -MAXMOVE) mo.momx = -MAXMOVE;
  if (mo.momy > MAXMOVE) mo.momy = MAXMOVE;
  else if (mo.momy < -MAXMOVE) mo.momy = -MAXMOVE;

  let xmove = mo.momx;
  let ymove = mo.momy;

  do {
    let ptryx: number;
    let ptryy: number;
    // Vanilla tests `>` against MAXMOVE/2 on the SIGNED value, so a large
    // negative move isn't split. That asymmetry is real; keep it.
    if (xmove > MAXMOVE / 2 || ymove > MAXMOVE / 2) {
      // Vanilla's `mo->y + ymove/2` divides FIRST with C integer division
      // (truncate toward zero), THEN adds. Doing `(mo.y + ymove/2) | 0` instead
      // floors the half-step for odd negative momentum, landing 1 fixed-point
      // unit short — a sub-pixel drift that only shows at high speed (momentum
      // over MAXMOVE/2) with odd momentum, i.e. deep into a fast run.
      ptryx = (mo.x + ((xmove / 2) | 0)) | 0;
      ptryy = (mo.y + ((ymove / 2) | 0)) | 0;
      xmove >>= 1;
      ymove >>= 1;
    } else {
      ptryx = (mo.x + xmove) | 0;
      ptryy = (mo.y + ymove) | 0;
      xmove = ymove = 0;
    }

    if (!env.tryMove(mo, ptryx, ptryy)) {
      if (mo.player) {
        env.slideMove(mo);
      } else if (mo.flags & MF.MF_MISSILE) {
        env.explodeMissile(mo);
        return;
      } else {
        mo.momx = 0;
        mo.momy = 0;
      }
    }
  } while (xmove !== 0 || ymove !== 0);

  // Friction. Skipped entirely while airborne.
  if (mo.flags & (MF.MF_MISSILE | MF.MF_NOGRAVITY)) return;
  if (mo.z > mo.floorZ) return;

  if (mo.flags & MF.MF_CORPSE) {
    // A corpse half off a step keeps sliding.
    if (mo.momx > FRACUNIT / 4 || mo.momx < -FRACUNIT / 4 ||
        mo.momy > FRACUNIT / 4 || mo.momy < -FRACUNIT / 4) {
      if (mo.floorZ !== env.sectorAt(mo.x, mo.y).floorHeight) return;
    }
  }

  if (mo.momx > -STOPSPEED && mo.momx < STOPSPEED &&
      mo.momy > -STOPSPEED && mo.momy < STOPSPEED &&
      (!player || (player.cmd.forwardMove === 0 && player.cmd.sideMove === 0))) {
    // If the player came to rest in a walking frame, drop back to the idle
    // frame. This is the ONLY place the run animation resets — miss it and the
    // player mobj is stuck in S_PLAY_RUN*, which desyncs demos. `>>> 0` mirrors
    // vanilla's unsigned compare so states below S_PLAY_RUN1 fall out.
    if (player && ((mo.state - S.S_PLAY_RUN1) >>> 0) < 4) P_SetMobjState(mo, S.S_PLAY);
    mo.momx = 0;
    mo.momy = 0;
  } else {
    mo.momx = FixedMul(mo.momx, FRICTION);
    mo.momy = FixedMul(mo.momy, FRICTION);
  }
}

/** P_ZMovement. */
export function P_ZMovement(mo: PMobj): void {
  // Landing hard drops the view; the player feels the impact.
  if (mo.player && mo.z < mo.floorZ) {
    mo.player.viewHeight -= (mo.floorZ - mo.z) | 0;
    mo.player.deltaViewHeight = (VIEWHEIGHT - mo.player.viewHeight) >> 3;
  }

  mo.z = (mo.z + mo.momz) | 0;

  // MF.MF_FLOAT bobbing toward a target needs p_enemy; skipped until then.

  if (mo.z <= mo.floorZ) {
    if (mo.momz < 0) {
      if (mo.player && mo.momz < -GRAVITY * 8) {
        // Hard landing: the view dips proportionally to impact speed and the
        // player grunts. p_mobj.c P_ZMovement.
        mo.player.deltaViewHeight = mo.momz >> 3;
        S_StartSound(mo, 'sfx_oof');
      }
      mo.momz = 0;
    }
    mo.z = mo.floorZ;

    if (mo.flags & MF.MF_MISSILE && !(mo.flags & MF.MF_NOCLIP)) {
      env.explodeMissile(mo);
      return;
    }
  } else if (!(mo.flags & MF.MF_NOGRAVITY)) {
    // First tic of a fall gets DOUBLE gravity. Not a bug — it's what makes
    // DOOM's falls feel like DOOM.
    if (mo.momz === 0) mo.momz = -GRAVITY * 2;
    else mo.momz = (mo.momz - GRAVITY) | 0;
  }

  if (mo.z + mo.height > mo.ceilingZ) {
    if (mo.momz > 0) mo.momz = 0;
    mo.z = (mo.ceilingZ - mo.height) | 0;

    if (mo.flags & MF.MF_MISSILE && !(mo.flags & MF.MF_NOCLIP)) {
      env.explodeMissile(mo);
      return;
    }
  }
}

// Debug-only: called at the top of every mobj's think, with the draw counter,
// so the demo-sync tooling can attribute per-tic P_Random draws to a monster.
let thinkLog: ((mo: PMobj, draw: number) => void) | null = null;
export function setThinkLog(fn: ((mo: PMobj, draw: number) => void) | null): void {
  thinkLog = fn;
}

/** P_MobjThinker. */
export function P_MobjThinker(mo: PMobj): void {
  thinkLog?.(mo, pRandomCount());
  if (mo.momx !== 0 || mo.momy !== 0) {
    P_XYMovement(mo);
    if (mo.removed) return;
  }

  if (mo.z !== mo.floorZ || mo.momz !== 0) {
    P_ZMovement(mo);
    if (mo.removed) return;
  }

  // State cycling. tics === -1 means "stay here forever".
  if (mo.tics === -1) return;
  mo.tics--;
  if (mo.tics <= 0) {
    P_SetMobjState(mo, states[mo.state].nextState);
  }
}

// ---------------------------------------------------------------------------
// Spawning: puffs, blood, missiles. p_mobj.c.
// ---------------------------------------------------------------------------

/** p_inter.c P_ExplodeMissile, but it lives in p_mobj.c. */
export function P_ExplodeMissile(mo: PMobj): void {
  mo.momx = mo.momy = mo.momz = 0;
  P_SetMobjState(mo, mobjInfo[mo.type].deathState);
  mo.tics -= P_Random() & 3;
  if (mo.tics < 1) mo.tics = 1;
  mo.flags &= ~MF.MF_MISSILE;
  if (mobjInfo[mo.type].deathSound !== 'sfx_None') S_StartSound(mo, mobjInfo[mo.type].deathSound);
}

/**
 * P_SpawnPuff: the spark where a bullet hits a wall.
 *
 * `attackRange === MELEERANGE` skips the spark — punches don't strike sparks
 * off walls. p_map.c owns attackRange, so it's injected.
 */
export function P_SpawnPuff(x: number, y: number, z: number, meleeRange: boolean): void {
  z = (z + ((P_Random() - P_Random()) << 10)) | 0;
  const th = P_SpawnMobj(x, y, z, MT.MT_PUFF);
  th.momz = FRACUNIT;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;
  if (meleeRange) P_SetMobjState(th, S.S_PUFF3);
}

/** P_SpawnBlood. The sprite frame encodes how hard you were hit. */
export function P_SpawnBlood(x: number, y: number, z: number, damage: number): void {
  z = (z + ((P_Random() - P_Random()) << 10)) | 0;
  const th = P_SpawnMobj(x, y, z, MT.MT_BLOOD);
  th.momz = FRACUNIT * 2;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;

  if (damage <= 12 && damage >= 9) P_SetMobjState(th, S.S_BLOOD2);
  else if (damage < 9) P_SetMobjState(th, S.S_BLOOD3);
}

/** P_CheckMissileSpawn: nudge it forward so a point-blank hit has an angle. */
export function P_CheckMissileSpawn(th: PMobj): void {
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;

  th.x = (th.x + (th.momx >> 1)) | 0;
  th.y = (th.y + (th.momy >> 1)) | 0;
  th.z = (th.z + (th.momz >> 1)) | 0;

  if (!env.tryMove(th, th.x, th.y)) P_ExplodeMissile(th);
}

/** P_SpawnMissile: a monster's projectile, aimed at `dest`. */
export function P_SpawnMissile(source: PMobj, dest: PMobj, type: number): PMobj {
  const th = P_SpawnMobj(source.x, source.y, (source.z + 4 * 8 * FRACUNIT) | 0, type);
  if (mobjInfo[type].seeSound !== 'sfx_None') S_StartSound(th, mobjInfo[type].seeSound);

  th.target = source; // so the kill is credited correctly
  let an = R_PointToAngle2(source.x, source.y, dest.x, dest.y);

  // Spectres (MF_SHADOW) make monsters miss — the aim is randomised.
  if (dest.flags & MF.MF_SHADOW) an = (an + ((P_Random() - P_Random()) << 20)) >>> 0;

  th.angle = an;
  const fine = (an >>> ANGLETOFINESHIFT) & FINEMASK;
  const speed = mobjInfo[th.type].speed;
  th.momx = FixedMul(speed, finecosine[fine]);
  th.momy = FixedMul(speed, finesine[fine]);

  // momz is derived from TIME TO TARGET, not a slope — that's why DOOM's
  // fireballs arc toward you rather than travelling in a straight 3D line.
  let dist = P_AproxDistance(dest.x - source.x, dest.y - source.y);
  dist = (dist / speed) | 0;
  if (dist < 1) dist = 1;
  th.momz = ((dest.z - source.z) / dist) | 0;

  P_CheckMissileSpawn(th);
  return th;
}

export interface MissileEnv {
  aimLineAttack: (t1: PMobj, angle: number, distance: number) => number;
  lineTarget: () => PMobj | null;
}
let missileEnv: MissileEnv;
export function P_SetMissileEnv(e: MissileEnv): void {
  missileEnv = e;
}

/** P_SpawnPlayerMissile: autoaims like the hitscan weapons do. */
export function P_SpawnPlayerMissile(source: PMobj, type: number): PMobj {
  let an = source.angle;
  let slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);

  if (!missileEnv.lineTarget()) {
    an = (an + (1 << 26)) >>> 0;
    slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    if (!missileEnv.lineTarget()) {
      an = (an - (2 << 26)) >>> 0;
      slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    }
    if (!missileEnv.lineTarget()) {
      // Nothing to lock onto: fire dead level, straight ahead.
      an = source.angle;
      slope = 0;
    }
  }

  const th = P_SpawnMobj(source.x, source.y, (source.z + 4 * 8 * FRACUNIT) | 0, type);
  if (mobjInfo[type].seeSound !== 'sfx_None') S_StartSound(th, mobjInfo[type].seeSound);
  th.target = source;
  th.angle = an;
  const fine = (an >>> ANGLETOFINESHIFT) & FINEMASK;
  const speed = mobjInfo[type].speed;
  th.momx = FixedMul(speed, finecosine[fine]);
  th.momy = FixedMul(speed, finesine[fine]);
  th.momz = FixedMul(speed, slope);

  P_CheckMissileSpawn(th);
  return th;
}

/** Distance helper re-exported for callers that only import p_mobj. */
export { P_AproxDistance };
