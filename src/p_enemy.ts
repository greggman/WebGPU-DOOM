// Monster AI. Ported from linuxdoom-1.10/p_enemy.c.
//
// DOOM's monsters don't pathfind. They pick one of 8 compass directions,
// try to walk it, and re-choose when blocked — the "intelligence" is entirely
// in P_NewChaseDir's ordering of candidate directions plus a P_Random coin
// flip. That's why they get stuck on corners, and why they feel the way they do.

import { FixedMul, FRACUNIT } from './m_fixed.js';
import { P_Random } from './m_random.js';
import { states, mobjInfo, MF, MT } from './info.js';
import { P_SetMobjState } from './p_mobj.js';
import { P_AproxDistance, P_LineOpening } from './p_maputl.js';
import { S_StartSound } from './s_sound.js';
import { P_CheckSight } from './p_sight.js';
import { R_PointToAngle2, ANG90, ANG180, ANG270 } from './r_point.js';
import { finesine, finecosine, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import type { PMobj, PPlayer, PLine, PSector } from './p_local.js';

/** doomdata.h line flags used by the sound flood. */
const ML_TWOSIDED = 4;
const ML_SOUNDBLOCK = 64;

/** p_enemy.c dirtype_t. */
export const DI_EAST = 0, DI_NORTHEAST = 1, DI_NORTH = 2, DI_NORTHWEST = 3,
             DI_WEST = 4, DI_SOUTHWEST = 5, DI_SOUTH = 6, DI_SOUTHEAST = 7,
             DI_NODIR = 8;

/** doomdef.h. */
export const MAXPLAYERS = 4;
/** p_local.h. */
export const MELEERANGE = 64 * FRACUNIT;
export const MISSILERANGE = 32 * 64 * FRACUNIT;

/**
 * p_enemy.c. 47000 is ~0.717 in 16.16 — deliberately NOT 1/sqrt(2) (46341).
 * Diagonal movement is very slightly faster than orthogonal, and always has
 * been.
 */
const xspeed = [FRACUNIT, 47000, 0, -47000, -FRACUNIT, -47000, 0, 47000];
const yspeed = [0, 47000, FRACUNIT, 47000, 0, -47000, -FRACUNIT, -47000];

const opposite = [DI_WEST, DI_SOUTHWEST, DI_SOUTH, DI_SOUTHEAST,
                  DI_EAST, DI_NORTHEAST, DI_NORTH, DI_NORTHWEST, DI_NODIR];
const diags = [DI_NORTHWEST, DI_NORTHEAST, DI_SOUTHWEST, DI_SOUTHEAST];

export interface EnemyEnv {
  /** Live players — vanilla's players[] / playeringame[]. */
  players: () => (PPlayer | null)[];
  /** p_map.c P_TryMove. */
  tryMove: (mo: PMobj, x: number, y: number) => boolean;
  /** p_map.c: special lines the last P_TryMove touched but didn't cross. */
  takeSpecHits: () => { lineIndex: number }[];
  /** p_spec.c P_UseSpecialLine — monsters open doors by walking into them. */
  useSpecialLine: (mo: PMobj, lineIndex: number, side: number) => boolean;
  /** p_map.c P_AimLineAttack. */
  aimLineAttack: (t1: PMobj, angle: number, distance: number) => number;
  /** p_map.c P_LineAttack. */
  lineAttack: (t1: PMobj, angle: number, distance: number, slope: number, damage: number) => void;
  /** p_inter.c P_DamageMobj. */
  damageMobj: (target: PMobj, inflictor: PMobj | null, source: PMobj | null, damage: number) => void;
  /** p_mobj.c P_SpawnMissile. */
  spawnMissile: (source: PMobj, dest: PMobj, type: number) => PMobj;
  /** p_mobj.c P_SpawnMobj. */
  spawnMobj: (x: number, y: number, z: number, type: number) => PMobj;
  /** p_mobj.c P_SpawnPuff. */
  spawnPuff: (x: number, y: number, z: number, melee: boolean) => void;
  /** p_map.c P_RadiusAttack. */
  radiusAttack: (spot: PMobj, source: PMobj | null, damage: number) => void;
  /** p_blockmap.ts, for A_Fire's teleporting flame. */
  setThingPosition: (mo: PMobj) => void;
  unsetThingPosition: (mo: PMobj) => void;
  /** The global tic counter — A_Tracer only steers every 4th. */
  gameTic: () => number;
  /** p_spec.c: end-of-episode trigger. Doom 2's Keen/Brain use it too. */
  bossDeath?: (mo: PMobj) => void;
  /** p_enemy.c A_PainShootSkull. Doom 2 only. */
  painShootSkull?: (actor: PMobj, angle: number) => void;
  /** The level's linedefs, for P_RecursiveSound to flood through. */
  lines: () => PLine[];
}
let env: EnemyEnv;
export function P_SetEnemyEnv(e: EnemyEnv): void {
  env = e;
}

/**
 * P_LookForPlayers. Checks ONE player per call (round-robin via lastLook), not
 * all of them — so waking up is staggered across tics.
 */
export function P_LookForPlayers(actor: PMobj, allAround: boolean): boolean {
  let c = 0;
  const stop = (actor.lastLook - 1) & 3;
  const players = env.players();

  for (;; actor.lastLook = (actor.lastLook + 1) & 3) {
    if (!players[actor.lastLook]) continue;

    if (c++ === 2 || actor.lastLook === stop) return false; // done looking

    const player = players[actor.lastLook]!;
    if (player.health <= 0) continue;
    if (!player.mo) continue;
    if (!P_CheckSight(actor, player.mo)) continue;

    if (!allAround) {
      const an = (R_PointToAngle2(actor.x, actor.y, player.mo.x, player.mo.y) - actor.angle) >>> 0;
      if (an > ANG90 && an < ANG270) {
        const dist = P_AproxDistance(player.mo.x - actor.x, player.mo.y - actor.y);
        // Behind the monster's back — unless you're right on top of it.
        if (dist > MELEERANGE) continue;
      }
    }

    actor.target = player.mo;
    return true;
  }
}

// --- sound propagation (p_enemy.c) ---------------------------------------
// Gunfire floods outward through sectors, stamping each with the noise-maker as
// its soundTarget; A_Look reads that. Vanilla shares the global `validcount`,
// but only this flood touches these sector fields, so a private counter is
// equivalent and can't collide with sight/map traversals.
let soundValidCount = 0;
let soundTargetRef: PMobj | null = null;

function P_RecursiveSound(sec: PSector, soundblocks: number): void {
  if (sec.validCount === soundValidCount && sec.soundTraversed <= soundblocks + 1) {
    return; // already flooded here at least this loudly
  }

  sec.validCount = soundValidCount;
  sec.soundTraversed = soundblocks + 1;
  sec.soundTarget = soundTargetRef;

  const lines = env.lines();
  for (const li of sec.lineIndices) {
    const check = lines[li];
    if (!(check.flags & ML_TWOSIDED)) continue;
    if (P_LineOpening(check).range <= 0) continue; // closed door blocks sound
    const other = check.frontSector === sec ? check.backSector : check.frontSector;
    if (!other) continue;

    if (check.flags & ML_SOUNDBLOCK) {
      if (!soundblocks) P_RecursiveSound(other, 1);
    } else {
      P_RecursiveSound(other, soundblocks);
    }
  }
}

/**
 * P_NoiseAlert. A monster (or the firing player) yells; the noise floods
 * through open lines so anything that can "hear" it wakes and hunts `target`.
 */
export function P_NoiseAlert(target: PMobj, emitter: PMobj): void {
  soundTargetRef = target;
  soundValidCount++;
  if (emitter.sector) P_RecursiveSound(emitter.sector, 0);
}

/** A_Look: the idle state. Wakes the monster when it notices a player. */
export function A_Look(actor: PMobj): void {
  actor.threshold = 0; // any shot will wake it

  // Woken by noise: a player who made a racket in a sector this one can hear.
  const targ = actor.sector?.soundTarget ?? null;
  let seeYou = false;
  if (targ && targ.flags & MF.MF_SHOOTABLE) {
    actor.target = targ;
    // An ambush monster only reacts to noise if it can also see the source.
    seeYou = (actor.flags & MF.MF_AMBUSH) ? P_CheckSight(actor, targ) : true;
  }

  if (!seeYou && !P_LookForPlayers(actor, false)) return;

  // seeyou: the multi-take sit sounds pick a random variant (a P_Random draw
  // that is demo-critical — skipping it desyncs the first monster to wake).
  const see = mobjInfo[actor.type].seeSound;
  let sound = see;
  switch (see) {
    case 'sfx_posit1':
    case 'sfx_posit2':
    case 'sfx_posit3':
      sound = 'sfx_posit' + (1 + P_Random() % 3);
      break;
    case 'sfx_bgsit1':
    case 'sfx_bgsit2':
      sound = 'sfx_bgsit' + (1 + P_Random() % 2);
      break;
    default:
      break;
  }
  if (see !== 'sfx_None') {
    // Bosses (spider/cyborg) yell at full volume from anywhere; everyone else
    // is positional.
    const full = actor.type === MT.MT_SPIDER || actor.type === MT.MT_CYBORG;
    S_StartSound(full ? null : actor, sound);
  }

  wakeHook?.(actor);
  P_SetMobjState(actor, mobjInfo[actor.type].seeState);
}

// Debug-only: the demo-sync trace tool logs when each monster wakes, to line up
// against the vanilla reference. No effect in the browser (hook stays null).
let wakeHook: ((actor: PMobj) => void) | null = null;
export function setEnemyWakeHook(fn: ((actor: PMobj) => void) | null): void {
  wakeHook = fn;
}

/** P_CheckMeleeRange. */
export function P_CheckMeleeRange(actor: PMobj): boolean {
  if (!actor.target) return false;
  const pl = actor.target;
  const dist = P_AproxDistance(pl.x - actor.x, pl.y - actor.y);
  if (dist >= MELEERANGE - 20 * FRACUNIT + pl.radius) return false;
  return P_CheckSight(actor, pl);
}

/** P_CheckMissileRange. */
export function P_CheckMissileRange(actor: PMobj): boolean {
  if (!actor.target) return false;
  if (!P_CheckSight(actor, actor.target)) return false;

  // Just been hurt? Attack back immediately, and only once.
  if (actor.flags & MF.MF_JUSTHIT) {
    actor.flags &= ~MF.MF_JUSTHIT;
    return true;
  }

  if (actor.reactionTime) return false;

  // The -64 is vanilla's: it biases every monster toward closing distance.
  let dist = (P_AproxDistance(actor.x - actor.target.x, actor.y - actor.target.y) - 64 * FRACUNIT) | 0;

  if (mobjInfo[actor.type].meleeState === 0) dist -= 128 * FRACUNIT; // no melee: fire sooner

  dist >>= 16;

  // Per-monster tuning, straight from the C.
  if (dist > 200) dist = 200;

  return P_Random() >= dist;
}

/**
 * P_Move. One step in movedir. Note `info.speed * xspeed[dir]` — an integer
 * times a fixed_t, NOT FixedMul.
 */
export function P_Move(actor: PMobj): boolean {
  if (actor.moveDir === DI_NODIR) return false;
  if (actor.moveDir >= 8) throw new Error('bad moveDir');

  const speed = mobjInfo[actor.type].speed;
  const tryX = (actor.x + speed * xspeed[actor.moveDir]) | 0;
  const tryY = (actor.y + speed * yspeed[actor.moveDir]) | 0;

  if (!env.tryMove(actor, tryX, tryY)) {
    // MF_FLOAT bobbing over an obstacle needs floatok; skipped until then.

    // Blocked by a door? Monsters open doors by walking into them.
    const hits = env.takeSpecHits();
    if (hits.length === 0) return false;

    actor.moveDir = DI_NODIR;
    let good = false;
    for (let i = hits.length - 1; i >= 0; i--) {
      if (env.useSpecialLine(actor, hits[i].lineIndex, 0)) good = true;
    }
    return good;
  }

  actor.flags &= ~MF.MF_INFLOAT;
  if (!(actor.flags & MF.MF_FLOAT)) actor.z = actor.floorZ;
  return true;
}

/** P_TryWalk: move, and commit to the direction for a while if it worked. */
function P_TryWalk(actor: PMobj): boolean {
  if (!P_Move(actor)) return false;
  // Stick with this direction for a random spell — this is why monsters wander
  // rather than beeline.
  actor.moveCount = P_Random() & 15;
  return true;
}

/** P_NewChaseDir: pick a direction toward the target, preferring diagonals. */
export function P_NewChaseDir(actor: PMobj): void {
  if (!actor.target) return;

  const olddir = actor.moveDir;
  const turnaround = opposite[olddir];

  const deltax = (actor.target.x - actor.x) | 0;
  const deltay = (actor.target.y - actor.y) | 0;

  const d: number[] = [0, 0, 0];
  if (deltax > 10 * FRACUNIT) d[1] = DI_EAST;
  else if (deltax < -10 * FRACUNIT) d[1] = DI_WEST;
  else d[1] = DI_NODIR;

  if (deltay < -10 * FRACUNIT) d[2] = DI_SOUTH;
  else if (deltay > 10 * FRACUNIT) d[2] = DI_NORTH;
  else d[2] = DI_NODIR;

  // Try the diagonal first.
  if (d[1] !== DI_NODIR && d[2] !== DI_NODIR) {
    actor.moveDir = diags[((deltay < 0 ? 1 : 0) << 1) + (deltax > 0 ? 1 : 0)];
    if (actor.moveDir !== turnaround && P_TryWalk(actor)) return;
  }

  // Randomly prefer the other axis — the one coin flip in the whole algorithm.
  if (P_Random() > 200 || Math.abs(deltay) > Math.abs(deltax)) {
    const tdir = d[1]; d[1] = d[2]; d[2] = tdir;
  }

  if (d[1] === turnaround) d[1] = DI_NODIR;
  if (d[2] === turnaround) d[2] = DI_NODIR;

  if (d[1] !== DI_NODIR) {
    actor.moveDir = d[1];
    if (P_TryWalk(actor)) return;
  }
  if (d[2] !== DI_NODIR) {
    actor.moveDir = d[2];
    if (P_TryWalk(actor)) return;
  }

  // Nothing toward the target worked — try the old direction.
  if (olddir !== DI_NODIR) {
    actor.moveDir = olddir;
    if (P_TryWalk(actor)) return;
  }

  // Try every direction, alternating scan order so monsters don't all favour
  // the same way out of a corner.
  if (P_Random() & 1) {
    for (let tdir = DI_EAST; tdir <= DI_SOUTHEAST; tdir++) {
      if (tdir === turnaround) continue;
      actor.moveDir = tdir;
      if (P_TryWalk(actor)) return;
    }
  } else {
    for (let tdir = DI_SOUTHEAST; tdir !== DI_EAST - 1; tdir--) {
      if (tdir === turnaround) continue;
      actor.moveDir = tdir;
      if (P_TryWalk(actor)) return;
    }
  }

  // Last resort: turn around.
  if (turnaround !== DI_NODIR) {
    actor.moveDir = turnaround;
    if (P_TryWalk(actor)) return;
  }

  actor.moveDir = DI_NODIR; // stuck
}

/** A_FaceTarget. */
export function A_FaceTarget(actor: PMobj): void {
  if (!actor.target) return;
  actor.flags &= ~MF.MF_AMBUSH;
  actor.angle = R_PointToAngle2(actor.x, actor.y, actor.target.x, actor.target.y);
  // MF_SHADOW (Spectres) get an aim wobble here — needs P_Random; added with
  // the attack functions so the RNG order stays right.
}

// ---------------------------------------------------------------------------
// Attacks. p_enemy.c.
//
// Every one of these draws P_Random in a specific order and count. The damage
// formulas ARE the game's balance: a zombie's ((P_Random()%5)+1)*3 is 3..15 per
// shot, and that's why they're a nuisance rather than a threat.
// ---------------------------------------------------------------------------

/** A_PosAttack: the zombieman's pistol. One shot, spread by two RNG draws. */
export function A_PosAttack(actor: PMobj): void {
  if (!actor.target) return;

  A_FaceTarget(actor);
  S_StartSound(actor, 'sfx_pistol');
  const angle = actor.angle;
  const slope = env.aimLineAttack(actor, angle, MISSILERANGE);

  // (P_Random()-P_Random())<<20 — TWO draws for a symmetric spread. One draw
  // would be biased; the difference of two is centred. Order matters.
  const spread = ((P_Random() - P_Random()) << 20) | 0;
  const damage = ((P_Random() % 5) + 1) * 3;
  env.lineAttack(actor, (angle + spread) >>> 0, MISSILERANGE, slope, damage);
}

/** A_SPosAttack: the shotgun guy. THREE pellets, each with its own spread. */
export function A_SPosAttack(actor: PMobj): void {
  if (!actor.target) return;

  S_StartSound(actor, 'sfx_shotgn');
  A_FaceTarget(actor);
  const bangle = actor.angle;
  // Aim ONCE, then fire three pellets along that slope.
  const slope = env.aimLineAttack(actor, bangle, MISSILERANGE);

  for (let i = 0; i < 3; i++) {
    const angle = (bangle + ((P_Random() - P_Random()) << 20)) >>> 0;
    const damage = ((P_Random() % 5) + 1) * 3;
    env.lineAttack(actor, angle, MISSILERANGE, slope, damage);
  }
}

/** A_TroopAttack: the imp. Claws in melee, fireball otherwise. */
export function A_TroopAttack(actor: PMobj): void {
  if (!actor.target) return;

  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    S_StartSound(actor, 'sfx_claw');
    const damage = ((P_Random() % 8) + 1) * 3; // 3..24
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
  // Out of reach: hurl a fireball. (Every other monster's missile attack was
  // already wired to spawnMissile — the imp's, the most common in E1, was not.)
  env.spawnMissile(actor, actor.target, MT.MT_TROOPSHOT);
}

/** A_SargAttack: the demon. Melee only. 4..40, which is why they hurt. */
export function A_SargAttack(actor: PMobj): void {
  if (!actor.target) return;

  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = ((P_Random() % 10) + 1) * 4;
    env.damageMobj(actor.target, actor, actor, damage);
  }
}

/** A_HeadAttack: cacodemon. Bite in melee (10..60!), fireball otherwise. */
export function A_HeadAttack(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = ((P_Random() % 6) + 1) * 10;
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
  env.spawnMissile(actor, actor.target, MT.MT_HEADSHOT);
}

/** A_CyberAttack: the Cyberdemon just fires rockets. */
export function A_CyberAttack(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.spawnMissile(actor, actor.target, MT.MT_ROCKET);
}

/**
 * A_BruisAttack: baron/knight. NOTE it does NOT call A_FaceTarget — the baron
 * swings where it's already looking. That's in the C, and it's why they can
 * whiff on a strafing player.
 */
export function A_BruisAttack(actor: PMobj): void {
  if (!actor.target) return;
  if (P_CheckMeleeRange(actor)) {
    S_StartSound(actor, 'sfx_claw');
    const damage = ((P_Random() % 8) + 1) * 10; // up to 80
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
  env.spawnMissile(actor, actor.target, MT.MT_BRUISERSHOT);
}

/** A_SkelMissile: revenant's homing rocket. */
export function A_SkelMissile(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  actor.z = (actor.z + 16 * FRACUNIT) | 0; // spawn higher
  const mo = env.spawnMissile(actor, actor.target, MT.MT_TRACER);
  actor.z = (actor.z - 16 * FRACUNIT) | 0;

  mo.x = (mo.x + mo.momx) | 0;
  mo.y = (mo.y + mo.momy) | 0;
  mo.tracer = actor.target; // what makes it home
}

/** p_enemy.c. How fast a tracer turns. */
const TRACEANGLE = 0xc000000;

/**
 * A_Tracer: the revenant rocket's homing. Only steers every 4th gametic
 * (`if (gametic & 3) return`) — which is why they can be dodged.
 */
export function A_Tracer(actor: PMobj): void {
  if (env.gameTic() & 3) return;

  env.spawnPuff(actor.x, actor.y, actor.z, false);
  const th = env.spawnMobj((actor.x - actor.momx) | 0, (actor.y - actor.momy) | 0,
                           actor.z, MT.MT_SMOKE);
  th.momz = FRACUNIT;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;

  const dest = actor.tracer;
  if (!dest || dest.health <= 0) return;

  // Turn toward the target, capped at TRACEANGLE per step.
  const exact = R_PointToAngle2(actor.x, actor.y, dest.x, dest.y);
  if (exact !== actor.angle) {
    if (((exact - actor.angle) >>> 0) > 0x80000000) {
      actor.angle = (actor.angle - TRACEANGLE) >>> 0;
      if (((exact - actor.angle) >>> 0) < 0x80000000) actor.angle = exact;
    } else {
      actor.angle = (actor.angle + TRACEANGLE) >>> 0;
      if (((exact - actor.angle) >>> 0) > 0x80000000) actor.angle = exact;
    }
  }

  const fine = (actor.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  const speed = mobjInfo[actor.type].speed;
  actor.momx = FixedMul(speed, finecosine[fine]);
  actor.momy = FixedMul(speed, finesine[fine]);

  // Adjust vertical too.
  let dist = P_AproxDistance(dest.x - actor.x, dest.y - actor.y);
  dist = (dist / speed) | 0;
  if (dist < 1) dist = 1;
  const slope = (((dest.z + 40 * FRACUNIT - actor.z) / dist) | 0);
  if (slope < actor.momz) actor.momz = (actor.momz - FRACUNIT / 8) | 0;
  else actor.momz = (actor.momz + FRACUNIT / 8) | 0;
}

export function A_SkelWhoosh(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
}

/** A_SkelFist: the revenant's punch. 6..60. */
export function A_SkelFist(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = ((P_Random() % 10) + 1) * 6;
    env.damageMobj(actor.target, actor, actor, damage);
  }
}

/** A_FatRaise. */
export function A_FatRaise(actor: PMobj): void {
  A_FaceTarget(actor);
}

/** p_enemy.c FATSPREAD. */
const FATSPREAD = ANG90 / 8;

/** A_FatAttack1: mancubus. Two fireballs, one aimed wide. */
export function A_FatAttack1(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  // The spread is applied to the ACTOR's angle, and the missile inherits it —
  // then the actor's angle is restored by the next state.
  actor.angle = (actor.angle + FATSPREAD) >>> 0;
  env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);

  const mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = (mo.angle + FATSPREAD) >>> 0;
  const fine = (mo.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  const speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}

export function A_FatAttack2(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  actor.angle = (actor.angle - FATSPREAD) >>> 0;
  env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);

  const mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = (mo.angle - FATSPREAD * 2) >>> 0;
  const fine = (mo.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  const speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}

export function A_FatAttack3(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);

  let mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = (mo.angle - FATSPREAD / 2) >>> 0;
  let fine = (mo.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  let speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);

  mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = (mo.angle + FATSPREAD / 2) >>> 0;
  fine = (mo.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}

/** p_enemy.c SKULLSPEED. */
const SKULLSPEED = 20 * FRACUNIT;

/** A_SkullAttack: the lost soul launches itself as a projectile. */
export function A_SkullAttack(actor: PMobj): void {
  if (!actor.target) return;
  const dest = actor.target;
  actor.flags |= MF.MF_SKULLFLY;

  S_StartSound(actor, mobjInfo[actor.type].attackSound);
  A_FaceTarget(actor);
  const fine = (actor.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  actor.momx = FixedMul(SKULLSPEED, finecosine[fine]);
  actor.momy = FixedMul(SKULLSPEED, finesine[fine]);

  let dist = P_AproxDistance(dest.x - actor.x, dest.y - actor.y);
  dist = (dist / SKULLSPEED) | 0;
  if (dist < 1) dist = 1;
  actor.momz = (((dest.z + (dest.height >> 1) - actor.z) / dist) | 0);
}

/** A_CPosAttack: chaingunner. ONE bullet per call — the state loops. */
export function A_CPosAttack(actor: PMobj): void {
  if (!actor.target) return;
  S_StartSound(actor, 'sfx_shotgn');
  A_FaceTarget(actor);
  const bangle = actor.angle;
  const slope = env.aimLineAttack(actor, bangle, MISSILERANGE);

  const angle = (bangle + ((P_Random() - P_Random()) << 20)) >>> 0;
  const damage = ((P_Random() % 5) + 1) * 3;
  env.lineAttack(actor, angle, MISSILERANGE, slope, damage);
}

/** A_CPosRefire: 40/256 chance per tic of stopping. */
export function A_CPosRefire(actor: PMobj): void {
  A_FaceTarget(actor);
  if (P_Random() < 40) return;

  if (!actor.target || actor.target.health <= 0 || !P_CheckSight(actor, actor.target)) {
    P_SetMobjState(actor, mobjInfo[actor.type].seeState);
  }
}

/** A_SpidRefire: the Mastermind is more persistent — only 10/256. */
export function A_SpidRefire(actor: PMobj): void {
  A_FaceTarget(actor);
  if (P_Random() < 10) return;

  if (!actor.target || actor.target.health <= 0 || !P_CheckSight(actor, actor.target)) {
    P_SetMobjState(actor, mobjInfo[actor.type].seeState);
  }
}

/** A_BspiAttack: arachnotron. */
export function A_BspiAttack(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.spawnMissile(actor, actor.target, MT.MT_ARACHPLAZ);
}

/** A_Explode: rockets and barrels. Always 128 damage before falloff. */
export function A_Explode(thing: PMobj): void {
  env.radiusAttack(thing, thing.target, 128);
}

/** A_PlayerScream: the player's death cry. */
export function A_PlayerScream(mo: PMobj): void {
  // The gib scream below -50 health, the normal death cry otherwise.
  S_StartSound(mo, mo.health < -50 ? 'sfx_pdiehi' : 'sfx_pldeth');
}

/** A_Metal / A_BabyMetal / A_Hoof: footstep sounds. No RNG. */
export function A_Metal(actor: PMobj): void { A_Chase(actor); }
export function A_BabyMetal(actor: PMobj): void { A_Chase(actor); }
export function A_Hoof(actor: PMobj): void { A_Chase(actor); }

/** A_BossDeath: the E1M8 / E2M8 / E3M8 end-of-episode trigger. */
export function A_BossDeath(mo: PMobj): void {
  env.bossDeath?.(mo);
}

/** A_KeenDie: Commander Keen. Doom 2 only. */
export function A_KeenDie(mo: PMobj): void {
  A_Fall(mo);
  env.bossDeath?.(mo);
}

// --- Arch-vile. Doom 2 only, but the states exist in the shared table. ---

export function A_VileStart(actor: PMobj): void { void actor; }
export function A_StartFire(actor: PMobj): void { A_Fire(actor); }
export function A_FireCrackle(actor: PMobj): void { A_Fire(actor); }

/** A_Fire: the vile's flame tracks its target. */
export function A_Fire(actor: PMobj): void {
  const dest = actor.tracer;
  if (!dest) return;
  if (!actor.target) return;
  if (!P_CheckSight(actor.target, dest)) return;

  const fine = (dest.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  env.unsetThingPosition(actor);
  actor.x = (dest.x + FixedMul(24 * FRACUNIT, finecosine[fine])) | 0;
  actor.y = (dest.y + FixedMul(24 * FRACUNIT, finesine[fine])) | 0;
  actor.z = dest.z;
  env.setThingPosition(actor);
}

export function A_VileTarget(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  const fog = env.spawnMobj(actor.target.x, actor.target.y, actor.target.z, MT.MT_FIRE);
  actor.tracer = fog;
  fog.target = actor;
  fog.tracer = actor.target;
  A_Fire(fog);
}

export function A_VileAttack(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (!P_CheckSight(actor, actor.target)) return;

  env.damageMobj(actor.target, actor, actor, 20);
  actor.target.momz = ((1000 * FRACUNIT) / mobjInfo[actor.target.type].mass) | 0;

  const fire = actor.tracer;
  if (!fire) return;
  // Move the fire to just in front of the victim, then blast.
  const fine = (actor.angle >>> ANGLETOFINESHIFT) & FINEMASK;
  fire.x = (actor.target.x - FixedMul(24 * FRACUNIT, finecosine[fine])) | 0;
  fire.y = (actor.target.y - FixedMul(24 * FRACUNIT, finesine[fine])) | 0;
  env.radiusAttack(fire, actor, 70);
}

/** A_VileChase: raises corpses. The resurrect scan is why viles are hated. */
export function A_VileChase(actor: PMobj): void {
  // The corpse scan needs a blockmap walk over MF_CORPSE things with a
  // raisestate. Doom 2 only; not reachable from doom1.wad.
  A_Chase(actor);
}

// --- Pain elemental / Icon of Sin. Doom 2 only. ---

export function A_PainAttack(actor: PMobj): void {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.painShootSkull?.(actor, actor.angle);
}

export function A_PainDie(actor: PMobj): void {
  A_Fall(actor);
  env.painShootSkull?.(actor, (actor.angle + ANG90) >>> 0);
  env.painShootSkull?.(actor, (actor.angle + ANG180) >>> 0);
  env.painShootSkull?.(actor, (actor.angle + ANG270) >>> 0);
}

export function A_BrainAwake(_mo: PMobj): void {}
export function A_BrainPain(_mo: PMobj): void {}
export function A_BrainScream(_mo: PMobj): void {}
export function A_BrainExplode(_mo: PMobj): void {}
export function A_BrainDie(_mo: PMobj): void {}
export function A_BrainSpit(_mo: PMobj): void {}
export function A_SpawnSound(_mo: PMobj): void {}
export function A_SpawnFly(_mo: PMobj): void {}

/** A_Fall: the corpse becomes walkable. Called from every death animation. */
export function A_Fall(actor: PMobj): void {
  // Not SOLID any more — you can walk over it. Radius and height are unchanged
  // here; P_KillMobj already quartered the height.
  actor.flags &= ~MF.MF_SOLID;
}

/**
 * A_Scream. The RNG draw depends on the death sound: the multi-variant ones
 * pick between takes, sfx_None returns immediately and draws nothing.
 */
export function A_Scream(actor: PMobj): void {
  const ds = mobjInfo[actor.type].deathSound;
  let sound = ds;
  switch (ds) {
    case 'sfx_None':
    case '0':
      return;
    case 'sfx_podth1':
    case 'sfx_podth2':
    case 'sfx_podth3':
      sound = 'sfx_podth' + (1 + P_Random() % 3);
      break;
    case 'sfx_bgdth1':
    case 'sfx_bgdth2':
      sound = 'sfx_bgdth' + (1 + P_Random() % 2);
      break;
    default:
      break;
  }
  // Bosses die at full volume; regular monsters are positional.
  const full = actor.type === MT.MT_SPIDER || actor.type === MT.MT_CYBORG;
  S_StartSound(full ? null : actor, sound);
}

/** A_XScream: the gib sound. No RNG. */
export function A_XScream(actor: PMobj): void {
  S_StartSound(actor, 'sfx_slop');
}

/** A_Pain: the flinch sound. No RNG. */
export function A_Pain(actor: PMobj): void {
  const s = mobjInfo[actor.type].painSound;
  if (s !== 'sfx_None') S_StartSound(actor, s);
}

/** A_Chase: the main monster loop. */
export function A_Chase(actor: PMobj): void {
  if (actor.reactionTime) actor.reactionTime--;

  if (actor.threshold) {
    if (!actor.target || actor.target.health <= 0) actor.threshold = 0;
    else actor.threshold--;
  }

  // Turn toward movedir, one eighth-turn per tic. `angle &= (7<<29)` snaps to
  // the 8 compass directions first — monsters can only face 8 ways while
  // chasing, however smoothly they appear to turn.
  if (actor.moveDir < 8) {
    actor.angle = (actor.angle & (7 << 29)) >>> 0;
    const delta = (actor.angle - (actor.moveDir << 29)) | 0;
    if (delta > 0) actor.angle = (actor.angle - ANG90 / 2) >>> 0;
    else if (delta < 0) actor.angle = (actor.angle + ANG90 / 2) >>> 0;
  }

  if (!actor.target || !(actor.target.flags & MF.MF_SHOOTABLE)) {
    if (P_LookForPlayers(actor, true)) return; // found someone new
    P_SetMobjState(actor, mobjInfo[actor.type].spawnState);
    return;
  }

  // Just attacked: take a step before attacking again.
  if (actor.flags & MF.MF_JUSTATTACKED) {
    actor.flags &= ~MF.MF_JUSTATTACKED;
    P_NewChaseDir(actor);
    return;
  }

  const info = mobjInfo[actor.type];

  if (info.meleeState && P_CheckMeleeRange(actor)) {
    if (info.attackSound !== 'sfx_None') S_StartSound(actor, info.attackSound);
    P_SetMobjState(actor, info.meleeState);
    return;
  }

  if (info.missileState) {
    // movecount gates missile attacks: a monster that recently changed
    // direction won't fire. On skills below nightmare this is a hard skip.
    if (!actor.moveCount && P_CheckMissileRange(actor)) {
      P_SetMobjState(actor, info.missileState);
      actor.flags |= MF.MF_JUSTATTACKED;
      return;
    }
  }

  // Chase.
  if (--actor.moveCount < 0 || !P_Move(actor)) {
    P_NewChaseDir(actor);
  }

  // The idle growl. Vanilla SHORT-CIRCUITS: `if (activesound && P_Random()<3)`,
  // so the 119 mobj types with sfx_None never draw at all. Drawing
  // unconditionally would shift the RNG on every chase tic of every silent
  // monster — invisible in play, fatal to demo sync.
  if (info.activeSound !== 'sfx_None' && P_Random() < 3) {
    S_StartSound(actor, info.activeSound);
  }
}
