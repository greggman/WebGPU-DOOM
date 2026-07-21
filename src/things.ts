// THINGS -> renderable sprites. Ported from linuxdoom-1.10/p_setup.c
// (P_LoadThings) and p_mobj.c (P_SpawnMapThing).
//
// No playsim yet, so every thing sits in its spawn state forever. Once the
// playsim lands, `frame` comes from the mobj's live state instead and the rest
// of this stays put.

import type { Wad } from './wad.js';
import type { DoomMap } from './map.js';
import { states, mobjInfo, byDoomedNum, sprNames } from './info.js';
import { initSpriteDefs, type SpriteDef } from './sprites.js';
import { decodePatch } from './patch.js';
import type { Texture } from './textures.js';

export interface Thing {
  x: number;
  y: number;
  /** Feet. Sprites hang from z + topOffset (r_things.c vis->gzt). */
  z: number;
  /** Facing, radians. Only matters for 8-rotation sprites. */
  angle: number;
  def: SpriteDef;
  frame: number;
  fullbright: boolean;
  /** Sector light bucket at the thing's position. */
  light: number;
}

/** Sector containing a point, by walking the BSP. r_main.c R_PointInSubsector. */
function sectorAt(map: DoomMap, x: number, y: number): number {
  if (map.nodes.length === 0) return 0;
  let n = map.nodes.length - 1;
  while (!(n & 0x8000)) {
    const node = map.nodes[n];
    // R_PointOnSide: front (0) when cross > 0.
    const cross = (x - node.x) * node.dy - (y - node.y) * node.dx;
    n = node.children[cross >= 0 ? 0 : 1];
  }
  const ss = map.subSectors[n & 0x7fff];
  const seg = map.segs[ss?.firstSeg ?? 0];
  const ld = map.lineDefs[seg?.lineDef ?? 0];
  const sd = map.sideDefs[ld?.sideNum[seg?.side ?? 0] ?? 0];
  return sd?.sector ?? 0;
}

export function spawnThings(wad: Wad, map: DoomMap): { things: Thing[]; defs: Map<string, SpriteDef> } {
  const defs = initSpriteDefs(wad);
  const l = wad.lumpNum(wad.getNumForName(map.name) + 1); // ML_THINGS
  const v = new DataView(l.buffer, l.byteOffset, l.byteLength);

  const things: Thing[] = [];
  for (let i = 0; i + 10 <= l.length; i += 10) {
    const x = v.getInt16(i, true);
    const y = v.getInt16(i + 2, true);
    const angleDeg = v.getInt16(i + 4, true);
    const type = v.getInt16(i + 6, true);

    // Player/DM starts and teleport destinations have no mobjinfo entry.
    const mi = byDoomedNum.get(type);
    if (mi === undefined) continue;

    const st = states[mobjInfo[mi].spawnState];
    const def = defs.get(sprNames[st.sprite]);
    if (!def || !def.frames[st.frame]) continue;

    const secNum = sectorAt(map, x, y);
    const sec = map.sectors[secNum];

    things.push({
      x, y,
      z: sec ? sec.floorHeight : 0,
      angle: (angleDeg * Math.PI) / 180,
      def,
      frame: st.frame,
      fullbright: st.fullbright,
      light: sec ? Math.max(0, Math.min(15, sec.lightLevel >> 4)) : 15,
    });
  }
  return { things, defs };
}

/**
 * Every sprite lump in the WAD, as texture-array entries.
 *
 * Not "every sprite the map's things can reach" — that model is unfixable.
 * Blood, bullet puffs, rockets, fireballs and smoke are spawned at RUNTIME and
 * appear in no THINGS lump, so any static analysis of the map misses them and
 * they silently fail to draw. doom1.wad has 483 sprite lumps total; registering
 * the lot costs ~44 MB of VRAM and removes the entire class of bug.
 */
export function spriteTextures(wad: Wad, defs: Map<string, SpriteDef>): Texture[] {
  const out: Texture[] = [];
  const seen = new Set<number>();

  for (const def of defs.values()) {
    for (const frame of def.frames) {
      for (const lump of frame.lump) {
        if (lump < 0 || seen.has(lump)) continue;
        seen.add(lump);
        const img = decodePatch(wad.lumpNum(lump));
        out.push({
          name: wad.lumps[lump].name,
          width: img.width,
          height: img.height,
          data: img.data,
          masked: true,
          leftOffset: img.leftOffset,
          topOffset: img.topOffset,
        });
      }
    }
  }
  return out;
}
