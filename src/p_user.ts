// Player movement. Ported from linuxdoom-1.10/p_user.c.

import { FixedMul, FRACUNIT } from './m_fixed.js';
import { finesine, finecosine, FINEANGLES, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import { VIEWHEIGHT, type PPlayer } from './p_local.js';
import { P_SetMobjState } from './p_mobj.js';
import { S, MF } from './info.js';
import { P_UseLines } from './p_map.js';
import { P_MovePsprites } from './p_pspr.js';

/** tables.h — a BAM quarter turn. */
export const ANG90 = 0x40000000;
export const ANG180 = 0x80000000;
export const ANG45 = 0x20000000;

/** p_user.c: 16 pixels of bob. */
const MAXBOB = 0x100000;

/** d_player.h playerstate_t. */
export const PST_LIVE = 0;
export const PST_DEAD = 1;
export const PST_REBORN = 2;


/** Set by P_MovePlayer, read by P_CalcHeight. Vanilla shares it as a global. */
let onGround = false;

/**
 * P_Thrust. angle is a BAM; >>ANGLETOFINESHIFT indexes the 8192-entry LUT.
 * Note momentum ACCUMULATES — this adds, it doesn't set. Friction in
 * P_XYMovement is the only thing that takes it away.
 */
export function P_Thrust(player: PPlayer, angle: number, move: number): void {
  const fine = (angle >>> ANGLETOFINESHIFT) & FINEMASK;
  const mo = player.mo!;
  mo.momx = (mo.momx + FixedMul(move, finecosine[fine])) | 0;
  mo.momy = (mo.momy + FixedMul(move, finesine[fine])) | 0;
}

/** P_MovePlayer. Turns a ticcmd into angle and thrust. */
export function P_MovePlayer(player: PPlayer): void {
  const cmd = player.cmd;
  const mo = player.mo!;

  // angleturn is stored as the high byte only, so <<16 restores the BAM.
  // >>> 0 keeps it unsigned: angles wrap, they don't go negative.
  mo.angle = (mo.angle + (cmd.angleTurn << 16)) >>> 0;

  onGround = mo.z <= mo.floorZ;

  // Airborne players get no control at all — no air-steering in DOOM.
  if (cmd.forwardMove !== 0 && onGround) {
    P_Thrust(player, mo.angle, cmd.forwardMove * 2048);
  }
  if (cmd.sideMove !== 0 && onGround) {
    P_Thrust(player, (mo.angle - ANG90) >>> 0, cmd.sideMove * 2048);
  }

  if ((cmd.forwardMove !== 0 || cmd.sideMove !== 0) && mo.state === S.S_PLAY) {
    P_SetMobjState(mo, S.S_PLAY_RUN1);
  }
}

/**
 * P_CalcHeight. View height, bob, and the landing dip. `leveltime` drives the
 * bob phase, so it must be the sim's tic counter, not a wall clock.
 */
export function P_CalcHeight(player: PPlayer, levelTime: number): void {
  const mo = player.mo!;

  // Bob is momentum SQUARED — it grows with speed, then clamps.
  player.bob = (FixedMul(mo.momx, mo.momx) + FixedMul(mo.momy, mo.momy)) | 0;
  player.bob >>= 2;
  if (player.bob > MAXBOB) player.bob = MAXBOB;

  if (!onGround) {
    player.viewZ = (mo.z + VIEWHEIGHT) | 0;
    if (player.viewZ > mo.ceilingZ - 4 * FRACUNIT) {
      player.viewZ = (mo.ceilingZ - 4 * FRACUNIT) | 0;
    }
    // Vanilla assigns viewz twice here; the second wins. Keep both so the
    // ceiling clamp above is (as in vanilla) dead — removing it would be a
    // behaviour change, not a cleanup.
    player.viewZ = (mo.z + player.viewHeight) | 0;
    return;
  }

  const angle = ((FINEANGLES / 20) * levelTime) & FINEMASK;
  const bob = FixedMul(player.bob / 2, finesine[angle]);

  if (player.state === PST_LIVE) {
    player.viewHeight = (player.viewHeight + player.deltaViewHeight) | 0;

    if (player.viewHeight > VIEWHEIGHT) {
      player.viewHeight = VIEWHEIGHT;
      player.deltaViewHeight = 0;
    }
    if (player.viewHeight < VIEWHEIGHT / 2) {
      player.viewHeight = VIEWHEIGHT / 2;
      if (player.deltaViewHeight <= 0) player.deltaViewHeight = 1;
    }
    if (player.deltaViewHeight !== 0) {
      player.deltaViewHeight = (player.deltaViewHeight + FRACUNIT / 4) | 0;
      if (player.deltaViewHeight === 0) player.deltaViewHeight = 1;
    }
  }

  player.viewZ = (mo.z + player.viewHeight + bob) | 0;
  if (player.viewZ > mo.ceilingZ - 4 * FRACUNIT) {
    player.viewZ = (mo.ceilingZ - 4 * FRACUNIT) | 0;
  }
}

/** d_event.h buttoncode_t. */
export const BT_ATTACK = 1;
export const BT_USE = 2;

/** P_PlayerThink. */
export function P_PlayerThink(player: PPlayer, levelTime: number): void {
  if (player.state === PST_DEAD) return; // P_DeathThink

  // reactiontime freezes the player briefly after a teleport — they arrive
  // stunned. Without this you can walk straight back into the teleporter.
  if (player.mo!.reactionTime) player.mo!.reactionTime--;
  else P_MovePlayer(player);

  P_CalcHeight(player, levelTime);

  // Use is EDGE-triggered: holding the key does nothing after the first tic.
  // That's what `usedown` is for — without it, a held key would re-open a door
  // every tic and doors would never close.
  if (player.cmd.buttons & BT_USE) {
    if (!player.useDown) {
      P_UseLines(player);
      player.useDown = true;
    }
  } else {
    player.useDown = false;
  }

  // The weapon overlay ticks AFTER movement — it reads player.bob, which
  // P_CalcHeight just computed.
  P_MovePsprites(player);

  // Time-dependent powerups (p_user.c). Strength counts UP to drive the berserk
  // fade; the timed ones count down, and invisibility drops MF_SHADOW when it
  // runs out. Allmap is a permanent flag and is left alone.
  const pw = player.powers;
  if (pw[1 /* strength */]) pw[1]++;
  if (pw[0 /* invulnerability */]) pw[0]--;
  if (pw[2 /* invisibility */] && !--pw[2]) player.mo!.flags &= ~MF.MF_SHADOW;
  if (pw[5 /* infrared */]) pw[5]--;
  if (pw[3 /* ironfeet */]) pw[3]--;

  // Screen-flash counters decay every tic.
  if (player.damageCount) player.damageCount--;
  if (player.bonusCount) player.bonusCount--;
}

export function isOnGround(): boolean {
  return onGround;
}
