// The sim tick. Ported from linuxdoom-1.10/p_tick.c (P_Ticker).
//
// Order is the contract. P_PlayerThink runs FIRST and only applies thrust to
// momentum; P_RunThinkers then moves everything, player included. Swap them and
// the player moves on last tic's input forever — which looks almost right and
// desyncs instantly.

import { P_RunThinkers } from './p_tick.js';
import { P_PlayerThink } from './p_user.js';
import { P_PlayerInSpecialSector } from './p_spec.js';
import { P_UpdateButtons } from './p_switch.js';
import type { PPlayer } from './p_local.js';

let levelTime = 0;

export function P_ResetLevelTime(): void {
  levelTime = 0;
}

export function P_LevelTime(): number {
  return levelTime;
}

export function P_Ticker(players: PPlayer[]): void {
  for (const p of players) {
    P_PlayerThink(p, levelTime);
    // Damage floors and secrets are checked AFTER the player moves, so you're
    // scored against the sector you ended the tic in.
    if (p.state !== 1 /* PST_DEAD */) P_PlayerInSpecialSector(p, levelTime);
  }

  P_RunThinkers();

  // P_UpdateSpecials: switch-button timers flip repeatable switches back.
  // (Texture animation and P_RespawnSpecials still land here too.)
  P_UpdateButtons();

  levelTime++;
}
