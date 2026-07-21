// Teleporters. Ported from linuxdoom-1.10/p_telept.c.
//
// The destination is an MT_TELEPORTMAN mobj (THINGS type 14) sitting in a
// sector whose tag matches the line's. So a teleport target is a THING, not a
// map coordinate — which is why a teleport with no destination thing silently
// does nothing rather than erroring.

import { FRACUNIT } from './m_fixed.js';
import { MT } from './info.js';
import { finesine, finecosine, FINEMASK, ANGLETOFINESHIFT } from './tables.js';
import { S_StartSound } from './s_sound.js';
import type { PLine, PMobj } from './p_local.js';
import type { PlaysimMap } from './p_setup.js';

export interface TeleportEnv {
  /** p_map.c P_TeleportMove. */
  teleportMove: (thing: PMobj, x: number, y: number) => boolean;
  /** p_mobj.c P_SpawnMobj. */
  spawnMobj: (x: number, y: number, z: number, type: number) => PMobj;
}
let env: TeleportEnv;
let level: PlaysimMap;

export function P_SetTeleportEnv(l: PlaysimMap, e: TeleportEnv): void {
  level = l;
  env = e;
}

/** EV_Teleport. */
export function EV_Teleport(line: PLine, side: number, thing: PMobj): boolean {
  // Missiles don't teleport — they'd arrive with no owner.
  if (thing.flags & 0x10000 /* MF_MISSILE */) return false;

  // Hitting the BACK of the line does nothing. That's how you walk OUT of a
  // teleporter without being immediately sent back.
  if (side === 1) return false;

  const tag = line.tag;

  for (const sec of level.sectors) {
    if (sec.tag !== tag) continue;

    // Find the MT_TELEPORTMAN in this sector.
    for (let m = sec.thingList; m; m = m.snext) {
      if (m.type !== MT.MT_TELEPORTMAN) continue;
      if (m.sector !== sec) continue;

      const oldX = thing.x;
      const oldY = thing.y;
      const oldZ = thing.z;

      if (!env.teleportMove(thing, m.x, m.y)) return false;

      thing.z = thing.floorZ;
      if (thing.player) thing.player.viewZ = (thing.z + thing.player.viewHeight) | 0;

      // Fog at BOTH ends — source first, then destination — each with a *whoosh*.
      const srcFog = env.spawnMobj(oldX, oldY, oldZ, MT.MT_TFOG);
      S_StartSound(srcFog, 'sfx_telept');
      const fine = (m.angle >>> ANGLETOFINESHIFT) & FINEMASK;
      // The destination fog is 20 units IN FRONT of the teleport thing, so you
      // don't spawn inside your own effect.
      const dstFog = env.spawnMobj((m.x + 20 * finecosine[fine]) | 0,
                    (m.y + 20 * finesine[fine]) | 0,
                    thing.z, MT.MT_TFOG);
      S_StartSound(dstFog, 'sfx_telept');

      // The player is frozen for ~half a second on arrival.
      if (thing.player) thing.reactionTime = 18;

      thing.angle = m.angle;
      thing.momx = thing.momy = thing.momz = 0;
      return true;
    }
  }
  return false;
}
