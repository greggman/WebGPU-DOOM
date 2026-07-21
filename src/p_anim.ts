// Animated flats and wall textures. Ported from linuxdoom-1.10/p_spec.c
// (P_InitPicAnims / P_UpdateSpecials' animation loop).
//
// Certain surfaces cycle through a short sequence of frames — the nukage/slime
// pools, blood, lava, the fire and waterfall wall textures. Each frame is a
// separate flat/texture lump; the sequence is the contiguous run from `first` to
// `last` in the WAD (flats) or the TEXTURE1 directory (textures). DOOM animates
// them with flattranslation[]/texturetranslation[] indirection: geometry keeps
// pointing at the base frame, and a per-frame table redirects it to the frame
// showing this tic. We do the same with a GPU translation buffer, so nothing
// rebuilds — the sim is untouched, this is pure display.

import type { Wad } from './wad.js';

/** p_spec.c animdefs[]. `first`/`last` bound a contiguous frame run; the surface
 *  advances one frame every `speed` tics. Functional game data. */
const ANIMDEFS: { istexture: boolean; last: string; first: string; speed: number }[] = [
  { istexture: false, last: 'NUKAGE3',  first: 'NUKAGE1',  speed: 8 },
  { istexture: false, last: 'FWATER4',  first: 'FWATER1',  speed: 8 },
  { istexture: false, last: 'SWATER4',  first: 'SWATER1',  speed: 8 },
  { istexture: false, last: 'LAVA4',    first: 'LAVA1',    speed: 8 },
  { istexture: false, last: 'BLOOD3',   first: 'BLOOD1',   speed: 8 },
  { istexture: false, last: 'RROCK08',  first: 'RROCK05',  speed: 8 },
  { istexture: false, last: 'SLIME04',  first: 'SLIME01',  speed: 8 },
  { istexture: false, last: 'SLIME08',  first: 'SLIME05',  speed: 8 },
  { istexture: false, last: 'SLIME12',  first: 'SLIME09',  speed: 8 },
  { istexture: true,  last: 'BLODGR4',  first: 'BLODGR1',  speed: 8 },
  { istexture: true,  last: 'SLADRIP3', first: 'SLADRIP1', speed: 8 },
  { istexture: true,  last: 'BLODRIP4', first: 'BLODRIP1', speed: 8 },
  { istexture: true,  last: 'FIREWALL', first: 'FIREWALA', speed: 8 },
  { istexture: true,  last: 'GSTFONT3', first: 'GSTFONT1', speed: 8 },
  { istexture: true,  last: 'FIRELAVA', first: 'FIRELAV3', speed: 8 },
  { istexture: true,  last: 'FIREMAG3', first: 'FIREMAG1', speed: 8 },
  { istexture: true,  last: 'FIREBLU2', first: 'FIREBLU1', speed: 8 },
  { istexture: true,  last: 'ROCKRED3', first: 'ROCKRED1', speed: 8 },
  { istexture: true,  last: 'BFALL4',   first: 'BFALL1',   speed: 8 },
  { istexture: true,  last: 'SFALL4',   first: 'SFALL1',   speed: 8 },
  { istexture: true,  last: 'WFALL4',   first: 'WFALL1',   speed: 8 },
  { istexture: true,  last: 'DBRAIN4',  first: 'DBRAIN1',  speed: 8 },
];

/** A resolved animation: the ordered frame lump names and its frame period. */
export interface ResolvedAnim {
  istexture: boolean;
  names: string[];
  speed: number;
}

/** An animation bound to GPU layers: geometry referencing `layers[i]` is
 *  redirected to whichever frame layer is current this tic. */
export interface LayerAnim {
  layers: number[];
  speed: number;
}

/**
 * Resolve every animdef whose frames are all present in this WAD. Flats resolve
 * to the contiguous lump run; textures to the contiguous TEXTURE1 slice
 * (`texOrder` is the texture directory order — Map insertion order from
 * loadTextures). Anims absent from the WAD (most are DOOM II's) are skipped.
 */
export function resolveAnims(wad: Wad, texOrder: string[]): ResolvedAnim[] {
  const out: ResolvedAnim[] = [];
  for (const d of ANIMDEFS) {
    let names: string[];
    if (d.istexture) {
      const i0 = texOrder.indexOf(d.first), i1 = texOrder.indexOf(d.last);
      if (i0 < 0 || i1 < 0 || i1 < i0) continue;
      names = texOrder.slice(i0, i1 + 1);
    } else {
      const n0 = wad.checkNumForName(d.first), n1 = wad.checkNumForName(d.last);
      if (n0 < 0 || n1 < 0 || n1 < n0) continue;
      names = [];
      for (let i = n0; i <= n1; i++) names.push(wad.lumps[i].name.toUpperCase());
    }
    if (names.length >= 2) out.push({ istexture: d.istexture, names, speed: d.speed });
  }
  return out;
}

/**
 * P_UpdateSpecials' animation loop: for each anim, every frame slot is redirected
 * to the frame that should show at `leveltime`. `trans[layer]` is the layer the
 * shader samples in place of `layer`. Only anim slots are written; identity
 * entries for everything else are left untouched.
 */
export function updateAnimTranslation(anims: LayerAnim[], leveltime: number, trans: Uint32Array): void {
  for (const a of anims) {
    const n = a.layers.length;
    const base = Math.floor(leveltime / a.speed);
    for (let i = 0; i < n; i++) {
      trans[a.layers[i]] = a.layers[(base + i) % n];
    }
  }
}
