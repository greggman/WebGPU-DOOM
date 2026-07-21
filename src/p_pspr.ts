// Player weapons. Ported from linuxdoom-1.10/p_pspr.c.
//
// The weapon on screen is a SECOND state machine, independent of the player
// mobj's. It has its own states, its own action functions (which take
// (player, psp) rather than (mobj)), and its own tic counter. That's why the
// gun keeps animating while you walk.
//
// Two overlays: ps_weapon (the gun) and ps_flash (the muzzle flash), drawn in
// that order.

import { FixedMul, FRACUNIT } from './m_fixed.js';
import { P_Random } from './m_random.js';
import { states, weaponInfo, WP, AM, S, MT, MF } from './info.js';
import { finesine, finecosine, FINEANGLES, FINEMASK } from './tables.js';
import { P_SetMobjState } from './p_mobj.js';
import { R_PointToAngle2, ANG90, ANG180 } from './r_point.js';
import { PST_DEAD } from './p_user.js';
import { S_StartSound } from './s_sound.js';
import type { PMobj, PPlayer } from './p_local.js';

/** p_pspr.c. */
export const LOWERSPEED = FRACUNIT * 6;
export const RAISESPEED = FRACUNIT * 6;
export const WEAPONBOTTOM = 128 * FRACUNIT;
export const WEAPONTOP = 32 * FRACUNIT;
export const BFGCELLS = 40;

/** p_pspr.h psprnum_t. */
export const ps_weapon = 0;
export const ps_flash = 1;
export const NUMPSPRITES = 2;

/** wp_nochange. Vanilla uses -1 via an enum; keep the sentinel explicit. */
export const WP_NOCHANGE = -1;

/** p_pspr.h pspdef_t. */
export interface PSprite {
  /** statenum_t, or 0 (S_NULL) for "not drawn". */
  state: number;
  tics: number;
  /** fixed_t screen offsets — sx bobs horizontally, sy vertically. */
  sx: number;
  sy: number;
}

export function newPSprites(): PSprite[] {
  return Array.from({ length: NUMPSPRITES }, () => ({ state: 0, tics: 0, sx: 0, sy: 0 }));
}

export interface PsprEnv {
  aimLineAttack: (t1: PMobj, angle: number, distance: number) => number;
  lineAttack: (t1: PMobj, angle: number, distance: number, slope: number, damage: number) => void;
  /** p_map.c's lineTarget after the last aim. */
  lineTarget: () => PMobj | null;
  /** p_mobj.c P_SpawnPlayerMissile. */
  spawnPlayerMissile: (source: PMobj, type: number) => PMobj;
  /** p_mobj.c P_SpawnMobj. */
  spawnMobj: (x: number, y: number, z: number, type: number) => PMobj;
  /** p_inter.c P_DamageMobj. */
  damageMobj: (target: PMobj, inflictor: PMobj | null, source: PMobj | null, damage: number) => void;
  /** p_enemy.c P_NoiseAlert — firing wakes monsters that can hear the shot. */
  noiseAlert: (target: PMobj, emitter: PMobj) => void;
}
let env: PsprEnv;
export function P_SetPsprEnv(e: PsprEnv): void {
  env = e;
}

/** p_local.h. */
const MELEERANGE = 64 * FRACUNIT;
const MISSILERANGE = 32 * 64 * FRACUNIT;

/** The slope every hitscan weapon fires along. p_pspr.c shares it as a global. */
let bulletSlope = 0;

/**
 * P_SetPsprite. Like P_SetMobjState but for the weapon overlay: walks the state
 * chain while tics == 0, calling each state's action.
 */
export function P_SetPsprite(player: PPlayer, position: number, stnum: number): void {
  const psp = player.psprites[position];

  do {
    if (!stnum) {
      psp.state = 0; // S_NULL: not drawn
      break;
    }

    const state = states[stnum];
    psp.state = stnum;
    psp.tics = state.tics;

    // Weapon actions take (player, psp), NOT (mobj) — a different signature to
    // the mobj actions, dispatched separately.
    if (state.action) {
      callWeaponAction(state.action, player, psp);
      if (!psp.state) break; // the action changed state itself
    }

    stnum = states[psp.state].nextState;
  } while (!psp.tics);
}

/** P_BringUpWeapon. */
export function P_BringUpWeapon(player: PPlayer): void {
  if (player.pendingWeapon === WP_NOCHANGE) player.pendingWeapon = player.readyWeapon;

  const newState = weaponInfo[player.pendingWeapon].upState;
  player.pendingWeapon = WP_NOCHANGE;
  // Start from the bottom of the screen and rise.
  player.psprites[ps_weapon].sy = WEAPONBOTTOM;
  P_SetPsprite(player, ps_weapon, newState);
}

/**
 * P_CheckAmmo. Returns true if the ready weapon can fire; otherwise picks the
 * next weapon by a FIXED preference order and starts lowering the current one.
 */
export function P_CheckAmmo(player: PPlayer): boolean {
  const ammo = weaponInfo[player.readyWeapon].ammo;

  let count = 1;
  if (player.readyWeapon === WP.wp_bfg) count = BFGCELLS;
  else if (player.readyWeapon === WP.wp_supershotgun) count = 2; // double barrel

  if (ammo === AM.am_noammo || player.ammo[ammo] >= count) return true;

  // Out of ammo. The preference order is hardcoded and not user-selectable.
  // Shareware has no plasma/BFG, so those branches are gated on gamemode in
  // vanilla; doom1.wad never has them owned, so the checks are equivalent.
  do {
    if (player.weaponOwned[WP.wp_plasma] && player.ammo[AM.am_cell]) {
      player.pendingWeapon = WP.wp_plasma;
    } else if (player.weaponOwned[WP.wp_chaingun] && player.ammo[AM.am_clip]) {
      player.pendingWeapon = WP.wp_chaingun;
    } else if (player.weaponOwned[WP.wp_shotgun] && player.ammo[AM.am_shell]) {
      player.pendingWeapon = WP.wp_shotgun;
    } else if (player.ammo[AM.am_clip]) {
      player.pendingWeapon = WP.wp_pistol;
    } else if (player.weaponOwned[WP.wp_chainsaw]) {
      player.pendingWeapon = WP.wp_chainsaw;
    } else if (player.weaponOwned[WP.wp_missile] && player.ammo[AM.am_misl]) {
      player.pendingWeapon = WP.wp_missile;
    } else if (player.weaponOwned[WP.wp_bfg] && player.ammo[AM.am_cell] > 40) {
      player.pendingWeapon = WP.wp_bfg;
    } else {
      player.pendingWeapon = WP.wp_fist; // everything failed
    }
  } while (player.pendingWeapon === WP_NOCHANGE);

  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].downState);
  return false;
}

/** P_FireWeapon. */
export function P_FireWeapon(player: PPlayer): void {
  if (!P_CheckAmmo(player)) return;

  P_SetMobjState(player.mo!, S.S_PLAY_ATK1);
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].atkState);
  env.noiseAlert(player.mo!, player.mo!); // wakes monsters that can hear you
}

/** P_DropWeapon: the player died. */
export function P_DropWeapon(player: PPlayer): void {
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].downState);
}

/** A_WeaponReady: idle. Fires, switches, and bobs the gun. */
export function A_WeaponReady(player: PPlayer, psp: PSprite): void {
  const mo = player.mo!;

  if (mo.state === S.S_PLAY_ATK1 || mo.state === S.S_PLAY_ATK2) {
    P_SetMobjState(mo, S.S_PLAY);
  }

  // A pending switch, or death, lowers the weapon.
  if (player.pendingWeapon !== WP_NOCHANGE || !player.health) {
    P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].downState);
    return;
  }

  if (player.cmd.buttons & 1 /* BT_ATTACK */) {
    // The rocket launcher and BFG DON'T auto-fire: they need the button
    // released between shots. Everything else repeats while held.
    if (!player.attackDown ||
        (player.readyWeapon !== WP.wp_missile && player.readyWeapon !== WP.wp_bfg)) {
      player.attackDown = true;
      P_FireWeapon(player);
      return;
    }
  } else {
    player.attackDown = false;
  }

  // Bob. Note sx uses cosine over the FULL circle while sy uses sine over HALF
  // (`angle &= FINEANGLES/2-1`), so the gun traces a figure-of-eight, not a
  // circle. That asymmetry is the DOOM weapon bob.
  let angle = (128 * levelTime()) & FINEMASK;
  psp.sx = (FRACUNIT + FixedMul(player.bob, finecosine[angle])) | 0;
  angle &= FINEANGLES / 2 - 1;
  psp.sy = (WEAPONTOP + FixedMul(player.bob, finesine[angle])) | 0;
}

/** A_ReFire: held the trigger — go round again without re-raising. */
export function A_ReFire(player: PPlayer, _psp: PSprite): void {
  if ((player.cmd.buttons & 1) && player.pendingWeapon === WP_NOCHANGE && player.health) {
    // refire counts consecutive shots — the chaingun uses it for accuracy, and
    // P_GunShot's `!player->refire` makes the FIRST shot dead accurate.
    player.refire++;
    P_FireWeapon(player);
  } else {
    player.refire = 0;
    P_CheckAmmo(player);
  }
}

export function A_CheckReload(player: PPlayer, _psp: PSprite): void {
  P_CheckAmmo(player);
}

/** A_Lower: slide the weapon off the bottom, then swap. */
export function A_Lower(player: PPlayer, psp: PSprite): void {
  psp.sy = (psp.sy + LOWERSPEED) | 0;
  if (psp.sy < WEAPONBOTTOM) return;

  if (player.state === PST_DEAD) {
    psp.sy = WEAPONBOTTOM;
    return; // stays down
  }

  if (!player.health) {
    P_SetPsprite(player, ps_weapon, 0); // S_NULL
    return;
  }

  player.readyWeapon = player.pendingWeapon;
  P_BringUpWeapon(player);
}

/** A_Raise. */
export function A_Raise(player: PPlayer, psp: PSprite): void {
  psp.sy = (psp.sy - RAISESPEED) | 0;
  if (psp.sy > WEAPONTOP) return;

  psp.sy = WEAPONTOP;
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].readyState);
}

/** A_GunFlash. */
export function A_GunFlash(player: PPlayer, _psp: PSprite): void {
  P_SetMobjState(player.mo!, S.S_PLAY_ATK2);
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
}

/**
 * P_BulletSlope: vertical autoaim. Tries dead ahead, then ±(1<<26) BAM — about
 * 5.6 degrees either side. That's DOOM's horizontal autoaim, and it's why you
 * can be slightly off-target and still hit.
 */
function P_BulletSlope(mo: PMobj): void {
  let an = mo.angle;
  bulletSlope = env.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);

  if (!env.lineTarget()) {
    an = (an + (1 << 26)) >>> 0;
    bulletSlope = env.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);
    if (!env.lineTarget()) {
      an = (an - (2 << 26)) >>> 0;
      bulletSlope = env.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);
    }
  }
}

/** P_GunShot. `accurate` shots have no spread at all. */
function P_GunShot(mo: PMobj, accurate: boolean): void {
  const damage = 5 * ((P_Random() % 3) + 1); // 5, 10 or 15
  let angle = mo.angle;
  if (!accurate) angle = (angle + ((P_Random() - P_Random()) << 18)) >>> 0;
  env.lineAttack(mo, angle, MISSILERANGE, bulletSlope, damage);
}

/** A_Punch. */
export function A_Punch(player: PPlayer, _psp: PSprite): void {
  let damage = ((P_Random() % 10) + 1) << 1; // 2..20
  if (player.powers[1] /* pw_strength */) damage *= 10; // berserk

  const mo = player.mo!;
  const angle = (mo.angle + ((P_Random() - P_Random()) << 18)) >>> 0;
  const slope = env.aimLineAttack(mo, angle, MELEERANGE);
  env.lineAttack(mo, angle, MELEERANGE, slope, damage);

  S_StartSound(mo, 'sfx_punch');
  // Snap to face whatever you hit.
  const t = env.lineTarget();
  if (t) mo.angle = R_PointToAngle2(mo.x, mo.y, t.x, t.y);
}

/** A_FirePistol. */
export function A_FirePistol(player: PPlayer, _psp: PSprite): void {
  const mo = player.mo!;
  S_StartSound(mo, 'sfx_pistol');
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;

  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);

  P_BulletSlope(mo);
  // The FIRST shot of a burst is perfectly accurate; held fire spreads.
  P_GunShot(mo, !player.refire);
}

/** A_FireShotgun: 7 pellets, none of them accurate. */
export function A_FireShotgun(player: PPlayer, _psp: PSprite): void {
  const mo = player.mo!;
  S_StartSound(mo, 'sfx_shotgn');
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;

  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
  P_BulletSlope(mo);

  for (let i = 0; i < 7; i++) P_GunShot(mo, false);
}

/** A_FireCGun. */
export function A_FireCGun(player: PPlayer, psp: PSprite): void {
  const mo = player.mo!;
  if (!player.ammo[weaponInfo[player.readyWeapon].ammo]) return;

  S_StartSound(mo, 'sfx_pistol'); // the chaingun shares the pistol report
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;

  // The flash alternates between two frames based on which of the two firing
  // states we're in — that's the chaingun's spinning barrel.
  P_SetPsprite(player, ps_flash,
               weaponInfo[player.readyWeapon].flashState + psp.state - S.S_CHAIN1);

  P_BulletSlope(mo);
  P_GunShot(mo, !player.refire);
}

/** A_Saw: the chainsaw. Note MELEERANGE+1 — see the comment below. */
export function A_Saw(player: PPlayer, _psp: PSprite): void {
  const damage = 2 * ((P_Random() % 10) + 1);
  const mo = player.mo!;
  const angle = (mo.angle + ((P_Random() - P_Random()) << 18)) >>> 0;

  // MELEERANGE+1 so the puff doesn't skip the flash — vanilla's own comment.
  // The +1 also means P_SpawnPuff's `attackrange == MELEERANGE` test FAILS, so
  // the saw DOES spark off walls where the fist doesn't.
  const slope = env.aimLineAttack(mo, angle, MELEERANGE + 1);
  env.lineAttack(mo, angle, MELEERANGE + 1, slope, damage);

  const t = env.lineTarget();
  if (!t) { S_StartSound(mo, 'sfx_sawful'); return; }
  S_StartSound(mo, 'sfx_sawhit');

  // Turn toward the target, but only part-way — that's the saw's pull.
  const targetAngle = R_PointToAngle2(mo.x, mo.y, t.x, t.y);
  const delta = (targetAngle - mo.angle) >>> 0;
  if (delta > ANG180) {
    if (((delta | 0)) < -ANG90 / 20) mo.angle = (targetAngle + ANG90 / 21) >>> 0;
    else mo.angle = (mo.angle - ANG90 / 20) >>> 0;
  } else {
    if (delta > ANG90 / 20) mo.angle = (targetAngle - ANG90 / 21) >>> 0;
    else mo.angle = (mo.angle + ANG90 / 20) >>> 0;
  }
  mo.flags |= MF.MF_JUSTATTACKED;
}

/** A_FireMissile: the rocket launcher. */
export function A_FireMissile(player: PPlayer, _psp: PSprite): void {
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  env.spawnPlayerMissile(player.mo!, MT.MT_ROCKET);
}

/** A_FirePlasma. Note the flash frame is CHOSEN AT RANDOM. */
export function A_FirePlasma(player: PPlayer, _psp: PSprite): void {
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  // P_Random()&1 picks between two flash frames — a draw that exists purely
  // for a visual, and still moves the shared sequence.
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState + (P_Random() & 1));
  env.spawnPlayerMissile(player.mo!, MT.MT_PLASMA);
}

/** A_FireBFG. */
export function A_FireBFG(player: PPlayer, _psp: PSprite): void {
  player.ammo[weaponInfo[player.readyWeapon].ammo] -= BFGCELLS;
  env.spawnPlayerMissile(player.mo!, MT.MT_BFG);
}

export function A_BFGsound(player: PPlayer, _psp: PSprite): void {
  S_StartSound(player.mo, 'sfx_bfg');
}

/**
 * A_BFGSpray: the BFG's real damage. 40 tracers in a 90-degree arc in FRONT of
 * the player, fired when the ball explodes — which is why the BFG hurts things
 * you were looking at, not things near the ball.
 */
export function A_BFGSpray(mo: PMobj): void {
  const source = mo.target;
  if (!source) return;

  for (let i = 0; i < 40; i++) {
    const an = (mo.angle - ANG90 / 2 + (ANG90 / 40) * i) >>> 0;
    // An aim trace with damage 0 — it only sets lineTarget.
    env.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    const t = env.lineTarget();
    if (!t) continue;

    env.spawnMobj(t.x, t.y, (t.z + (t.height >> 2)) | 0, MT.MT_EXTRABFG);

    // 15 draws per target. The BFG's damage is 15..120 and famously swingy —
    // this loop is why.
    let damage = 0;
    for (let j = 0; j < 15; j++) damage += (P_Random() & 7) + 1;
    env.damageMobj(t, source, source, damage);
  }
}

// --- Super shotgun. Doom 2 only, but the states are in the shared table. ---

export function A_FireShotgun2(player: PPlayer, _psp: PSprite): void {
  const mo = player.mo!;
  S_StartSound(mo, 'sfx_dshtgn');
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo] -= 2;
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
  P_BulletSlope(mo);

  // 20 pellets, and the SSG's spread is baked in rather than optional.
  for (let i = 0; i < 20; i++) {
    const damage = 5 * ((P_Random() % 3) + 1);
    const angle = (mo.angle + ((P_Random() - P_Random()) << 19)) >>> 0;
    env.lineAttack(mo, angle, MISSILERANGE,
                   (bulletSlope + ((P_Random() - P_Random()) << 5)) | 0, damage);
  }
}

export function A_OpenShotgun2(player: PPlayer, _psp: PSprite): void {
  S_StartSound(player.mo, 'sfx_dbopn');
}
export function A_LoadShotgun2(player: PPlayer, _psp: PSprite): void {
  S_StartSound(player.mo, 'sfx_dbload');
}
export function A_CloseShotgun2(player: PPlayer, psp: PSprite): void {
  S_StartSound(player.mo, 'sfx_dbcls');
  A_ReFire(player, psp);
}

export function A_Light0(player: PPlayer, _psp: PSprite): void { player.extraLight = 0; }
export function A_Light1(player: PPlayer, _psp: PSprite): void { player.extraLight = 1; }
export function A_Light2(player: PPlayer, _psp: PSprite): void { player.extraLight = 2; }

/** P_SetupPsprites: called on spawn. */
export function P_SetupPsprites(player: PPlayer): void {
  for (let i = 0; i < NUMPSPRITES; i++) player.psprites[i].state = 0;
  player.pendingWeapon = player.readyWeapon;
  P_BringUpWeapon(player);
}

/** P_MovePsprites: tick both overlays. */
export function P_MovePsprites(player: PPlayer): void {
  for (let i = 0; i < NUMPSPRITES; i++) {
    const psp = player.psprites[i];
    if (!psp.state) continue;

    // tics == -1 means "stay forever".
    if (psp.tics !== -1) {
      psp.tics--;
      if (!psp.tics) P_SetPsprite(player, i, states[psp.state].nextState);
    }
  }
  // The flash rides along with the weapon.
  player.psprites[ps_flash].sx = player.psprites[ps_weapon].sx;
  player.psprites[ps_flash].sy = player.psprites[ps_weapon].sy;
}

// --- action dispatch -------------------------------------------------------
// Weapon actions have a different signature to mobj actions, so they need
// their own table. A state's action name is looked up in BOTH: whichever has it
// wins. Vanilla distinguishes them by which union member the state uses.

export type WeaponActionFn = (player: PPlayer, psp: PSprite) => void;
const weaponActions = new Map<string, WeaponActionFn>();

export function P_RegisterWeaponActions(table: Record<string, WeaponActionFn>): void {
  for (const [name, fn] of Object.entries(table)) weaponActions.set(name, fn);
}

export function P_IsWeaponAction(name: string): boolean {
  return weaponActions.has(name);
}

function callWeaponAction(name: string, player: PPlayer, psp: PSprite): void {
  weaponActions.get(name)?.(player, psp);
}

// leveltime, injected to avoid a cycle with p_ticker.
let levelTimeFn: () => number = () => 0;
export function P_SetPsprLevelTime(fn: () => number): void {
  levelTimeFn = fn;
}
const levelTime = (): number => levelTimeFn();
