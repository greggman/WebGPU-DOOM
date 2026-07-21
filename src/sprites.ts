// Sprite lump indexing. Ported from linuxdoom-1.10/r_things.c
// (R_InitSpriteDefs / R_InstallSpriteLump).
//
// DOOM encodes sprite metadata in the lump NAME, not in a table:
//   TROOA1     -> sprite TROO, frame A, rotation 1
//   TROOA2A8   -> sprite TROO, frame A rotation 2, and frame A rotation 8
//                 MIRRORED (the second pair is always installed flipped)
//   TROOA0     -> rotation 0: one lump serves all 8 angles (no rotations)
//
// Rotation 1 faces the viewer; they run counter-clockwise. A frame either has
// rotation 0 (angle-independent) or all 8 rotations -- vanilla I_Errors on a
// mix, and so do we, because a mixed frame means the WAD is malformed.

import type { Wad } from './wad.js';

export interface SpriteFrame {
  /** False if rotation 0: one lump for every angle. */
  rotate: boolean;
  /** Lump number per rotation; all 8 identical when rotate is false. */
  lump: number[];
  /** Whether each rotation renders mirrored. */
  flip: boolean[];
}

export interface SpriteDef {
  name: string;
  frames: SpriteFrame[];
}

function newFrame(): SpriteFrame {
  return { rotate: false, lump: new Array(8).fill(-1), flip: new Array(8).fill(false) };
}

export function initSpriteDefs(wad: Wad): Map<string, SpriteDef> {
  const start = wad.checkNumForName('S_START');
  const end = wad.checkNumForName('S_END');
  if (start < 0 || end < 0) throw new Error('WAD has no S_START/S_END');

  // sprite name -> frame index -> frame. Frames are sparse until we know
  // maxframe, so collect into a map first.
  const acc = new Map<string, Map<number, SpriteFrame>>();
  // Tracks which frames saw a rotation-0 lump, to catch mixed frames.
  const sawRot0 = new Map<string, Set<number>>();

  const install = (
    sprName: string,
    frame: number,
    rotation: number,
    lump: number,
    flipped: boolean,
  ): void => {
    if (frame >= 29 || rotation > 8) {
      throw new Error(`bad sprite frame chars in ${wad.lumps[lump].name}`);
    }
    let frames = acc.get(sprName);
    if (!frames) { frames = new Map(); acc.set(sprName, frames); }
    let f = frames.get(frame);
    if (!f) { f = newFrame(); frames.set(frame, f); }

    let rot0 = sawRot0.get(sprName);
    if (!rot0) { rot0 = new Set(); sawRot0.set(sprName, rot0); }

    if (rotation === 0) {
      if (f.rotate) {
        throw new Error(`${sprName} frame ${String.fromCharCode(65 + frame)}: rotations and a rot=0 lump`);
      }
      rot0.add(frame);
      f.rotate = false;
      for (let r = 0; r < 8; r++) { f.lump[r] = lump; f.flip[r] = flipped; }
      return;
    }

    if (rot0.has(frame)) {
      throw new Error(`${sprName} frame ${String.fromCharCode(65 + frame)}: rotations and a rot=0 lump`);
    }
    f.rotate = true;
    const r = rotation - 1;
    if (f.lump[r] !== -1) {
      throw new Error(`${sprName} frame ${String.fromCharCode(65 + frame)} rot ${rotation}: two lumps mapped`);
    }
    f.lump[r] = lump;
    f.flip[r] = flipped;
  };

  for (let l = start + 1; l < end; l++) {
    const name = wad.lumps[l].name;
    if (name.length < 6) continue;

    const sprName = name.slice(0, 4);
    install(sprName, name.charCodeAt(4) - 65, name.charCodeAt(5) - 48, l, false);

    // Second pair, if present, is the mirrored view.
    if (name.length >= 8) {
      install(sprName, name.charCodeAt(6) - 65, name.charCodeAt(7) - 48, l, true);
    }
  }

  const out = new Map<string, SpriteDef>();
  for (const [name, frames] of acc) {
    const maxFrame = Math.max(...frames.keys());
    const list: SpriteFrame[] = [];
    for (let i = 0; i <= maxFrame; i++) {
      const f = frames.get(i);
      if (!f) throw new Error(`${name}: frame ${String.fromCharCode(65 + i)} missing`);
      if (f.rotate) {
        for (let r = 0; r < 8; r++) {
          if (f.lump[r] === -1) {
            throw new Error(`${name}: frame ${String.fromCharCode(65 + i)} missing rotation ${r + 1}`);
          }
        }
      }
      list.push(f);
    }
    out.set(name, { name, frames: list });
  }
  return out;
}

/**
 * Pick the rotation for a sprite seen from `viewAngle` while it faces
 * `objAngle`. r_things.c R_ProjectSprite:
 *   rot = (viewangle - objangle + (ANG45/2)*9) >> 29
 * Angles here are radians; the constant biases so rotation 1 faces the viewer.
 */
export function spriteRotation(objAngle: number, viewAngle: number): number {
  const TAU = Math.PI * 2;
  let a = viewAngle - objAngle + (TAU / 8) * 4.5;
  a = ((a % TAU) + TAU) % TAU;
  return Math.floor((a / TAU) * 8) & 7;
}
