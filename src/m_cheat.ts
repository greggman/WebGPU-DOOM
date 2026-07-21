// Cheat codes. The player types a sequence; a rolling buffer of recent keys is
// matched against each one. Effects mutate the player directly; level warp and
// music go through callbacks. Only fed from live play (never an attract demo),
// so demo playback is unaffected. Confirmation text is our own plain wording.

import { MF, WP } from './info.js';
import { P_GivePower } from './p_inter.js';
import type { PPlayer } from './p_local.js';

export interface CheatEnv {
  warp?: (episode: number, map: number) => void;
  music?: (name: string) => void;
  revealMap?: () => void; // iddt
}

const buf: string[] = [];
const MAXLEN = 10;

function giveArsenal(player: PPlayer, keys: boolean): void {
  player.armorPoints = 200;
  player.armorType = 2;
  // Weapons 0..chainsaw; the super shotgun (8) doesn't exist in DOOM 1.
  for (let i = 0; i < WP.wp_supershotgun; i++) player.weaponOwned[i] = true;
  for (let i = 0; i < player.ammo.length; i++) player.ammo[i] = player.maxAmmo[i];
  if (keys) for (let i = 0; i < player.cards.length; i++) player.cards[i] = true;
}

/** Feed one typed character (letters/digits) to the cheat matcher. */
export function M_CheatKey(ch: string, player: PPlayer, env: CheatEnv): void {
  if (!/^[a-z0-9]$/.test(ch)) return;
  buf.push(ch);
  while (buf.length > MAXLEN) buf.shift();
  const s = buf.join('');
  const say = (m: string): void => { player.message = m; };
  const mo = player.mo;

  if (s.endsWith('iddqd')) {
    player.cheatGod = !player.cheatGod;
    if (player.cheatGod) { player.health = 100; if (mo) mo.health = 100; }
    say(player.cheatGod ? 'GOD MODE ON' : 'GOD MODE OFF');
  } else if (s.endsWith('idkfa')) {
    giveArsenal(player, true);
    say('ALL WEAPONS, AMMO AND KEYS');
  } else if (s.endsWith('idfa')) {
    giveArsenal(player, false);
    say('ALL WEAPONS AND AMMO');
  } else if (s.endsWith('idclip') || s.endsWith('idspispopd')) {
    player.cheatNoClip = !player.cheatNoClip;
    if (mo) {
      if (player.cheatNoClip) mo.flags |= MF.MF_NOCLIP;
      else mo.flags &= ~MF.MF_NOCLIP;
    }
    say(player.cheatNoClip ? 'NOCLIP ON' : 'NOCLIP OFF');
  } else if (s.endsWith('idchoppers')) {
    player.weaponOwned[WP.wp_chainsaw] = true;
    say('CHAINSAW');
  } else if (s.endsWith('idmypos')) {
    if (mo) say(`X ${mo.x >> 16}  Y ${mo.y >> 16}  ANGLE ${Math.round((mo.angle >>> 0) / 4294967296 * 360)}`);
  } else if (s.endsWith('iddt')) {
    env.revealMap?.(); // toggles thing markers on the automap
  } else {
    let m: RegExpMatchArray | null;
    if ((m = s.match(/idbehold([vsiral])$/))) {
      P_GivePower(player, 'vsiral'.indexOf(m[1]));
      say('POWERUP');
    } else if ((m = s.match(/idclev(\d)(\d)$/))) {
      env.warp?.(Number(m[1]), Number(m[2]));
    } else if ((m = s.match(/idmus(\d)(\d)$/))) {
      env.music?.(`D_E${m[1]}M${m[2]}`);
      say('MUSIC CHANGED');
    }
  }
}
