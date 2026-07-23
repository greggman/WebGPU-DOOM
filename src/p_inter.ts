// Damage, death and pickups. Ported from linuxdoom-1.10/p_inter.c.

import { FixedMul, FRACUNIT } from './m_fixed.js';
import { P_Random } from './m_random.js';
import {
  mobjInfo, sprNames, weaponInfo, maxAmmo, clipAmmo,
  MF, MT, S, WP, AM,
} from './info.js';
import { P_SetMobjState, P_RemoveMobj, P_SpawnMobj } from './p_mobj.js';
import { ONFLOORZ } from './p_local.js';
import { S_StartSound } from './s_sound.js';
import { R_PointToAngle2, ANG180 } from './r_point.js';
import { finesine, finecosine, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import { PST_DEAD } from './p_user.js';
import type { PMobj, PPlayer } from './p_local.js';

/** p_inter.c. How long a monster stays locked on its attacker. */
export const BASETHRESHOLD = 100;

// ---------------------------------------------------------------------------
// Pickups. p_inter.c P_Give* / P_TouchSpecialThing.
// ---------------------------------------------------------------------------

/** p_inter.c. Green armour absorbs a third, blue absorbs half. */
const armorPointsFor = [0, 100, 200];

// Our own plain pickup notifications, keyed by pickup sprite (see the switch in
// P_TouchSpecialThing). Shown briefly at the top of the screen.
const PICKUP_MSG: Record<string, string> = {
  ARM1: 'PICKED UP THE ARMOR', ARM2: 'PICKED UP THE MEGAARMOR',
  BON1: 'PICKED UP A HEALTH BONUS', BON2: 'PICKED UP AN ARMOR BONUS',
  SOUL: 'PICKED UP A SOULSPHERE',
  BKEY: 'PICKED UP A BLUE KEYCARD', YKEY: 'PICKED UP A YELLOW KEYCARD',
  RKEY: 'PICKED UP A RED KEYCARD', BSKU: 'PICKED UP A BLUE SKULL KEY',
  YSKU: 'PICKED UP A YELLOW SKULL KEY', RSKU: 'PICKED UP A RED SKULL KEY',
  STIM: 'PICKED UP A STIMPACK', MEDI: 'PICKED UP A MEDIKIT',
  PINV: 'PICKED UP INVULNERABILITY', PSTR: 'PICKED UP BERSERK',
  PINS: 'PICKED UP PARTIAL INVISIBILITY', SUIT: 'PICKED UP A RADIATION SUIT',
  PMAP: 'PICKED UP THE AREA MAP', PVIS: 'PICKED UP LIGHT GOGGLES',
  CLIP: 'PICKED UP A CLIP', AMMO: 'PICKED UP A BOX OF BULLETS',
  ROCK: 'PICKED UP A ROCKET', BROK: 'PICKED UP A BOX OF ROCKETS',
  CELL: 'PICKED UP AN ENERGY CELL', CELP: 'PICKED UP AN ENERGY CELL PACK',
  SHEL: 'PICKED UP SOME SHOTGUN SHELLS', SBOX: 'PICKED UP A BOX OF SHELLS',
  BPAK: 'PICKED UP A BACKPACK',
  BFUG: 'PICKED UP THE BFG9000', MGUN: 'PICKED UP THE CHAINGUN',
  CSAW: 'PICKED UP THE CHAINSAW', LAUN: 'PICKED UP THE ROCKET LAUNCHER',
  PLAS: 'PICKED UP THE PLASMA GUN', SHOT: 'PICKED UP THE SHOTGUN',
  SGN2: 'PICKED UP THE SUPER SHOTGUN',
};

/** P_GiveAmmo. `num` is CLIP LOADS, not rounds; 0 means half a clip. */
export function P_GiveAmmo(player: PPlayer, ammo: number, num: number): boolean {
  if (ammo === AM.am_noammo) return false;
  if (ammo < 0 || ammo >= maxAmmo.length) return false;
  if (player.ammo[ammo] === player.maxAmmo[ammo]) return false;

  let amount = num ? num * clipAmmo[ammo] : (clipAmmo[ammo] / 2) | 0;

  // sk_baby and sk_nightmare both double ammo — the easiest and hardest
  // skills, for opposite reasons.
  const skill = env.skill();
  if (skill === 0 || skill === 4) amount <<= 1;

  const oldAmmo = player.ammo[ammo];
  player.ammo[ammo] += amount;
  if (player.ammo[ammo] > player.maxAmmo[ammo]) player.ammo[ammo] = player.maxAmmo[ammo];

  // Auto-switch ONLY when coming up from zero: if you had ammo and chose a
  // weaker weapon, that was deliberate and DOOM respects it.
  if (oldAmmo) return true;

  switch (ammo) {
    case AM.am_clip:
      if (player.readyWeapon === WP.wp_fist) {
        player.pendingWeapon = player.weaponOwned[WP.wp_chaingun] ? WP.wp_chaingun : WP.wp_pistol;
      }
      break;
    case AM.am_shell:
      if (player.readyWeapon === WP.wp_fist || player.readyWeapon === WP.wp_pistol) {
        if (player.weaponOwned[WP.wp_shotgun]) player.pendingWeapon = WP.wp_shotgun;
      }
      break;
    case AM.am_cell:
      if (player.readyWeapon === WP.wp_fist || player.readyWeapon === WP.wp_pistol) {
        if (player.weaponOwned[WP.wp_plasma]) player.pendingWeapon = WP.wp_plasma;
      }
      break;
    case AM.am_misl:
      if (player.readyWeapon === WP.wp_fist) {
        if (player.weaponOwned[WP.wp_missile]) player.pendingWeapon = WP.wp_missile;
      }
      break;
    default:
      break;
  }
  return true;
}

/** P_GiveWeapon. */
export function P_GiveWeapon(player: PPlayer, weapon: number, dropped: boolean): boolean {
  const ammo = weaponInfo[weapon].ammo;
  let gaveAmmo = false;
  let gaveWeapon = false;

  if (ammo !== AM.am_noammo) {
    // A dropped weapon carries half the ammo of a placed one.
    gaveAmmo = P_GiveAmmo(player, ammo, dropped ? 1 : 2);
  }

  if (!player.weaponOwned[weapon]) {
    gaveWeapon = true;
    player.weaponOwned[weapon] = true;
    player.pendingWeapon = weapon;
  }

  return gaveWeapon || gaveAmmo;
}

/** P_GiveBody: health. Won't pick up above 100 — that's what bonuses are for. */
export function P_GiveBody(player: PPlayer, num: number): boolean {
  if (player.health >= 100) return false;
  player.health += num;
  if (player.health > 100) player.health = 100;
  if (player.mo) player.mo.health = player.health;
  return true;
}

/** P_GiveArmor. Won't downgrade: blue armour blocks a green pickup. */
export function P_GiveArmor(player: PPlayer, armorType: number): boolean {
  const hits = armorPointsFor[armorType];
  if (player.armorPoints >= hits) return false;
  player.armorType = armorType;
  player.armorPoints = hits;
  return true;
}

export function P_GiveCard(player: PPlayer, card: number): void {
  if (player.cards[card]) return;
  player.bonusCount = BONUSADD;
  player.cards[card] = true;
}

/** p_local.h powerup durations (tics). Strength/allmap are permanent flags. */
const INVULNTICS = 30 * 35;
const INVISTICS = 60 * 35;
const INFRATICS = 120 * 35;
const IRONTICS = 60 * 35;

export function P_GivePower(player: PPlayer, power: number): boolean {
  // p_inter.c P_GivePower: each timed powerup starts at its full duration and
  // ticks down in P_PlayerThink. Invisibility also turns the mobj to a shadow.
  switch (power) {
    case 0 /* invulnerability */: player.powers[power] = INVULNTICS; return true;
    case 2 /* invisibility */: player.powers[power] = INVISTICS; if (player.mo) player.mo.flags |= MF.MF_SHADOW; return true;
    case 5 /* infrared */: player.powers[power] = INFRATICS; return true;
    case 3 /* ironfeet */: player.powers[power] = IRONTICS; return true;
    case 1 /* strength */: P_GiveBody(player, 100); player.powers[power] = 1; return true;
    default: // allmap and anything else: a one-shot flag
      if (player.powers[power]) return false;
      player.powers[power] = 1;
      return true;
  }
}

/** p_inter.c. How long the pickup flash lasts. */
export const BONUSADD = 6;

/**
 * P_TouchSpecialThing. Switches on SPRITE, not mobj type — DOOM identifies
 * pickups by what they look like.
 */
export function P_TouchSpecialThing(special: PMobj, toucher: PMobj): void {
  const delta = special.z - toucher.z;
  // Out of reach vertically: you can't grab an item on a ledge above you.
  if (delta > toucher.height || delta < -8 * FRACUNIT) return;

  const player = toucher.player;
  if (!player) return;
  if (toucher.health <= 0) return; // a sliding corpse can touch things

  const spr = sprNames[special.sprite];

  switch (spr) {
    // --- armour ---
    case 'ARM1': if (!P_GiveArmor(player, 1)) return; break;
    case 'ARM2': if (!P_GiveArmor(player, 2)) return; break;

    // --- bonuses: these go ABOVE 100, which is the whole point of them ---
    case 'BON1':
      player.health++;
      if (player.health > 200) player.health = 200;
      if (player.mo) player.mo.health = player.health;
      break;
    case 'BON2':
      player.armorPoints++;
      if (player.armorPoints > 200) player.armorPoints = 200;
      if (!player.armorType) player.armorType = 1;
      break;
    case 'SOUL':
      player.health += 100;
      if (player.health > 200) player.health = 200;
      if (player.mo) player.mo.health = player.health;
      break;

    // --- keys. NOTE: no `return` in single-player, so they're picked up. ---
    case 'BKEY': P_GiveCard(player, 0); break;
    case 'YKEY': P_GiveCard(player, 1); break;
    case 'RKEY': P_GiveCard(player, 2); break;
    case 'BSKU': P_GiveCard(player, 3); break;
    case 'YSKU': P_GiveCard(player, 4); break;
    case 'RSKU': P_GiveCard(player, 5); break;

    // --- health ---
    case 'STIM': if (!P_GiveBody(player, 10)) return; break;
    case 'MEDI': if (!P_GiveBody(player, 25)) return; break;

    // --- powerups ---
    case 'PINV': if (!P_GivePower(player, 0)) return; break;
    case 'PSTR':
      if (!P_GivePower(player, 1)) return;
      if (player.readyWeapon !== WP.wp_fist) player.pendingWeapon = WP.wp_fist;
      break;
    case 'PINS': if (!P_GivePower(player, 2)) return; break;
    case 'SUIT': if (!P_GivePower(player, 3)) return; break;
    case 'PMAP': if (!P_GivePower(player, 4)) return; break;
    case 'PVIS': if (!P_GivePower(player, 5)) return; break;

    // --- ammo ---
    case 'CLIP':
      // A clip DROPPED by a zombie carries half. That's MF_DROPPED.
      if (!P_GiveAmmo(player, AM.am_clip, (special.flags & MF.MF_DROPPED) ? 0 : 1)) return;
      break;
    case 'AMMO': if (!P_GiveAmmo(player, AM.am_clip, 5)) return; break;
    case 'ROCK': if (!P_GiveAmmo(player, AM.am_misl, 1)) return; break;
    case 'BROK': if (!P_GiveAmmo(player, AM.am_misl, 5)) return; break;
    case 'CELL': if (!P_GiveAmmo(player, AM.am_cell, 1)) return; break;
    case 'CELP': if (!P_GiveAmmo(player, AM.am_cell, 5)) return; break;
    case 'SHEL': if (!P_GiveAmmo(player, AM.am_shell, 1)) return; break;
    case 'SBOX': if (!P_GiveAmmo(player, AM.am_shell, 5)) return; break;
    case 'BPAK': {
      // A backpack raises every cap ONCE, then gives a clip of everything.
      if (!player.backpack) {
        for (let i = 0; i < maxAmmo.length; i++) player.maxAmmo[i] = maxAmmo[i] * 2;
        player.backpack = true;
      }
      for (let i = 0; i < maxAmmo.length; i++) P_GiveAmmo(player, i, 1);
      break;
    }

    // --- weapons ---
    case 'BFUG': if (!P_GiveWeapon(player, WP.wp_bfg, false)) return; break;
    case 'MGUN':
      if (!P_GiveWeapon(player, WP.wp_chaingun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;
    case 'CSAW': if (!P_GiveWeapon(player, WP.wp_chainsaw, false)) return; break;
    case 'LAUN': if (!P_GiveWeapon(player, WP.wp_missile, false)) return; break;
    case 'PLAS': if (!P_GiveWeapon(player, WP.wp_plasma, false)) return; break;
    case 'SHOT':
      if (!P_GiveWeapon(player, WP.wp_shotgun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;
    case 'SGN2':
      if (!P_GiveWeapon(player, WP.wp_supershotgun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;

    default:
      return; // not a pickup we know
  }

  if (special.flags & MF.MF_COUNTITEM) player.itemCount++;
  P_RemoveMobj(special);
  player.bonusCount += BONUSADD;

  // Notify what was grabbed (consumed by the HUD). Only reached on a successful
  // pickup, so one lookup by sprite covers every case above.
  const msg = PICKUP_MSG[spr];
  if (msg) player.message = msg;

  // The pickup jingle: weapons and powerups get their own, everything else the
  // generic "blip". Full volume — it's the player picking it up.
  const sound = ['BFUG', 'MGUN', 'CSAW', 'LAUN', 'PLAS', 'SHOT', 'SGN2'].includes(spr) ? 'sfx_wpnup'
    : ['SOUL', 'PINV', 'PSTR', 'PINS', 'SUIT', 'PMAP', 'PVIS'].includes(spr) ? 'sfx_getpow'
      : 'sfx_itemup';
  S_StartSound(null, sound);
}

/**
 * P_KillMobj.
 *
 * `height >>= 2` is why you can walk over corpses: a dead monster keeps its
 * radius but loses three quarters of its height.
 */
export function P_KillMobj(source: PMobj | null, target: PMobj): void {
  target.flags &= ~(MF.MF_SHOOTABLE | MF.MF_FLOAT | MF.MF_SKULLFLY);

  if (target.type !== MT.MT_SKULL) target.flags &= ~MF.MF_NOGRAVITY;

  target.flags |= MF.MF_CORPSE | MF.MF_DROPOFF;
  target.height >>= 2;

  // Count the kill for the intermission tally (p_inter.c). The killer's player
  // gets credit; a kill with no player source (barrel, crusher, infighting)
  // goes to player 1, as in vanilla single-player. This only bumps a display
  // counter the sim never reads back, so demo playback is unaffected.
  if (target.flags & MF.MF_COUNTKILL) {
    if (source && source.player) source.player.killCount++;
    else { const p = env.player(); if (p) p.killCount++; }
  }

  if (target.player) {
    target.flags &= ~MF.MF_SOLID;
    target.player.state = PST_DEAD;
    // P_DropWeapon
  }

  const info = mobjInfo[target.type];

  // Overkill: damage exceeding the monster's FULL spawn health triggers the
  // gib animation, not the normal death. That's why a rocket gibs a zombie
  // that a pistol merely kills.
  if (target.health < -info.spawnHealth && info.xdeathState) {
    P_SetMobjState(target, info.xdeathState);
  } else {
    P_SetMobjState(target, info.deathState);
  }

  // Stagger the death animation so a room full of corpses doesn't animate in
  // lockstep. The draw happens either way.
  target.tics -= P_Random() & 3;
  if (target.tics < 1) target.tics = 1;

  // Drop stuff: the human enemies leave their weapon/ammo behind. This spawns a
  // mobj (which draws P_Random for lastlook), so skipping it BOTH desynced demos
  // and meant a downed shotgun guy left no shotgun to pick up.
  let item: number;
  switch (target.type) {
    case MT.MT_WOLFSS:
    case MT.MT_POSSESSED:
      item = MT.MT_CLIP;
      break;
    case MT.MT_SHOTGUY:
      item = MT.MT_SHOTGUN;
      break;
    case MT.MT_CHAINGUY:
      item = MT.MT_CHAINGUN;
      break;
    default:
      return;
  }

  const drop = P_SpawnMobj(target.x, target.y, ONFLOORZ, item);
  drop.flags |= MF.MF_DROPPED; // dropped ammo/weapons give less than pickups
}

export interface InterEnv {
  /** The skill level — sk_baby halves incoming player damage. */
  skill: () => number;
  /** The single player, for crediting kills with no player source (barrels,
   *  crushers, monster infighting) — vanilla's players[0]. */
  player: () => PPlayer | null;
}
let env: InterEnv = { skill: () => 2, player: () => null };
export function P_SetInterEnv(e: InterEnv): void {
  env = e;
}

/**
 * P_DamageMobj.
 *
 * `inflictor` is what did it (a bullet's shooter, a barrel); `source` is who's
 * to blame. They differ for splash damage, which is why both exist.
 */
export function P_DamageMobj(
  target: PMobj,
  inflictor: PMobj | null,
  source: PMobj | null,
  damage: number,
): void {
  if (!(target.flags & MF.MF_SHOOTABLE)) return;
  if (target.health <= 0) return;

  if (target.flags & MF.MF_SKULLFLY) {
    target.momx = target.momy = target.momz = 0;
  }

  const player = target.player;
  if (player && env.skill() === 0) damage >>= 1; // sk_baby: half damage

  // Thrust: getting shot pushes you. Thrust is inversely proportional to MASS,
  // which is why a cacodemon barely flinches and a zombie flies.
  if (inflictor && !(target.flags & MF.MF_NOCLIP)) {
    let ang = R_PointToAngle2(inflictor.x, inflictor.y, target.x, target.y);
    let thrust = ((damage * (FRACUNIT >> 3) * 100) / mobjInfo[target.type].mass) | 0;

    // Fall FORWARDS sometimes when a killing blow comes from below — a
    // deliberate touch that makes deaths look less uniform.
    if (damage < 40 && damage > target.health &&
        target.z - inflictor.z > 64 * FRACUNIT && (P_Random() & 1)) {
      ang = (ang + ANG180) >>> 0;
      thrust *= 4;
    }

    const fine = (ang >>> ANGLETOFINESHIFT) & FINEMASK;
    target.momx = (target.momx + FixedMul(thrust, finecosine[fine])) | 0;
    target.momy = (target.momy + FixedMul(thrust, finesine[fine])) | 0;
  }

  if (player) {
    // God mode / invulnerability absorb any survivable hit. Vanilla lets a
    // 1000+ hit (telefrag) through even in god mode; keep that.
    if (damage < 1000 && (player.cheatGod || player.powers[0 /* invuln */])) return;

    // Armour absorbs a fraction: green (type 1) a third, blue (type 2) a half,
    // until its points run out.
    if (player.armorType) {
      let saved = player.armorType === 1 ? Math.floor(damage / 3) : Math.floor(damage / 2);
      if (player.armorPoints <= saved) { saved = player.armorPoints; player.armorType = 0; }
      player.armorPoints -= saved;
      damage -= saved;
    }

    player.health -= damage;
    if (player.health < 0) player.health = 0;
    player.attacker = source;
    player.damageCount += damage;
    if (player.damageCount > 100) player.damageCount = 100;
  }

  target.health -= damage;
  if (target.health <= 0) {
    P_KillMobj(source, target);
    return;
  }

  // Pain: painchance is a threshold out of 256, drawn EVERY hit. A cacodemon
  // (128) flinches half the time; a baron (50) rarely.
  if (P_Random() < mobjInfo[target.type].painChance && !(target.flags & MF.MF_SKULLFLY)) {
    target.flags |= MF.MF_JUSTHIT; // fight back
    P_SetMobjState(target, mobjInfo[target.type].painState);
  }

  target.reactionTime = 0; // awake now

  // Retaliate — unless already locked onto someone else.
  if ((!target.threshold || target.type === MT.MT_VILE) &&
      source && source !== target && source.type !== MT.MT_VILE) {
    target.target = source;
    target.threshold = BASETHRESHOLD;
    if (target.state === mobjInfo[target.type].spawnState &&
        mobjInfo[target.type].seeState !== S.S_NULL) {
      P_SetMobjState(target, mobjInfo[target.type].seeState);
    }
  }
}
