// Renderable geometry for a level. Floors/ceilings from the recovered BSP cells
// (replacing r_plane.c's visplanes), walls from segs (replacing r_segs.c's
// column loop). Everything lands in one interleaved buffer with a texture-array
// layer per vertex, so the level draws in a single call.

import type { Wad } from './wad.js';
import type { DoomMap } from './map.js';
import { buildSubsectorPolys, subsectorSector } from './geometry.js';
import { loadTextures, type Texture } from './textures.js';
import { ML_DONTPEGTOP, ML_DONTPEGBOTTOM } from './map.js';
import { resolveAnims, type LayerAnim } from './p_anim.js';

/**
 * DOOM's map is X-east / Y-north with Z up; the renderer is Y-up. Mapping
 * map-Y straight to world-Z is an axis SWAP — determinant -1 — which mirrors
 * the whole world: facing east, your right hand points north. Negating restores
 * determinant +1, so the level renders the way it was drawn and turning left
 * looks like turning left.
 *
 * Every map->world conversion must go through this. Winding flips too, but
 * cullMode is 'none', so nothing else has to change.
 */
export const mapYToWorldZ = (y: number): number => -y;

export interface LevelGeometry {
  /** pos.xyz, uv.xy, light, layer — render.ts VERTEX_STRIDE (28 bytes). */
  vertices: Float32Array<ArrayBuffer>;
  count: number;
  /** Every texture referenced, in layer order. */
  textures: Texture[];
  /** Array layer of the sky texture — no sidedef references it, so it's forced in. */
  skyLayer: number;
  /** Animated flats/textures, as layer sequences the renderer cycles per tic. */
  anims: LayerAnim[];
}

/** g_game.c: sky is SKY1..SKY4 by episode; shareware only ships E1. */
export function skyTextureName(mapName: string): string {
  const m = /^E(\d)M\d$/.exec(mapName);
  return m ? `SKY${m[1]}` : 'SKY1';
}

// Light is NOT baked into the vertex any more — the vertex carries the SECTOR
// INDEX, and the shader looks up that sector's current light each frame from a
// storage buffer. That's what lets flickering lights animate without rebuilding
// geometry (they change every few tics; a rebuild each time would cost far more
// than the lookup).

/** Raw 64x64 flat -> rg8uint. Flats have no header and are always opaque. */
function flatToTexture(name: string, lump: Uint8Array): Texture {
  const data = new Uint8Array(64 * 64 * 2);
  for (let i = 0; i < 64 * 64; i++) {
    data[i * 2 + 0] = lump[i] ?? 0;
    data[i * 2 + 1] = 255;
  }
  // Flats anchor at their corner, not a sprite-style offset.
  return { name, width: 64, height: 64, data, masked: false, leftOffset: 0, topOffset: 0 };
}

/**
 * Build the level's triangles. `wallTex` is passed in rather than loaded here:
 * compositing 125 textures costs ~10ms and must not be repeated when geometry
 * is rebuilt for a moving sector.
 */
interface GeoCache {
  textures: Texture[];
  layerOf: Map<string, number>;
  cells: ReturnType<typeof buildSubsectorPolys>;
  skyLayer: number;
  anims: LayerAnim[];
  scratch: Float32Array;
}

// Per-map cache of everything that does NOT change when a sector's height moves:
// the texture->layer assignment, the subsector polygons, the sky layer, and a
// reusable output buffer. A door/lift rebuild then only re-reads heights and
// re-fills vertices — no re-triangulation, no texture re-decode, no growing a JS
// array and reallocating a Float32Array. Keyed by the map object, which is GC'd
// with the level, so the entry clears on a level swap.
const geoCache = new WeakMap<DoomMap, GeoCache>();

function buildGeoCache(wad: Wad, map: DoomMap, wallTex: Map<string, Texture>): GeoCache {
  const textures: Texture[] = [];
  const layerOf = new Map<string, number>();
  const layerFor = (t: Texture): number => {
    let l = layerOf.get(t.name);
    if (l === undefined) { l = textures.length; textures.push(t); layerOf.set(t.name, l); }
    return l;
  };

  // Stable texture->layer assignment: register EVERY texture the level references
  // in a fixed order that does NOT depend on which geometry is currently visible.
  // Load-bearing — the atlas uploads ONCE but geometry rebuilds when a sector
  // moves; encounter-order layers would shift as a door reveals wall quads and
  // point the stale atlas at the wrong texture ("wrong until the door closes").
  for (const sec of map.sectors) {
    for (const pic of [sec.floorPic, sec.ceilingPic]) {
      if (pic === 'F_SKY1' || layerOf.has(pic) || wad.checkNumForName(pic) < 0) continue;
      layerFor(flatToTexture(pic, wad.lump(pic)));
    }
  }
  for (const side of map.sideDefs) {
    for (const name of [side.topTexture, side.bottomTexture, side.midTexture]) {
      if (name === '-' || layerOf.has(name)) continue;
      const t = wallTex.get(name);
      if (t) layerFor(t);
    }
  }
  // The sky is drawn by a full-screen pass, so no sidedef claims its layer.
  const skyName = skyTextureName(map.name);
  const skyTex = wallTex.get(skyName) ?? wallTex.get('SKY1');
  if (!skyTex) throw new Error(`no sky texture (${skyName})`);
  const skyLayer = layerFor(skyTex);

  // Animated surfaces: whenever the level uses ANY frame of an animation, force
  // its whole frame sequence into the atlas (only the base frame is normally
  // referenced) and record the layer sequence. The renderer cycles them via a
  // translation buffer, so no geometry rebuild is needed — like DOOM's
  // flattranslation[]/texturetranslation[].
  const anims: LayerAnim[] = [];
  for (const anim of resolveAnims(wad, [...wallTex.keys()])) {
    if (!anim.names.some((n) => layerOf.has(n))) continue; // no surface uses it
    const layers = anim.names.map((n) => {
      const tex = anim.istexture ? wallTex.get(n) : flatToTexture(n, wad.lump(n));
      return tex ? layerFor(tex) : -1;
    });
    if (layers.every((l) => l >= 0)) anims.push({ layers, speed: anim.speed });
  }

  const cache: GeoCache = {
    textures, layerOf, cells: buildSubsectorPolys(map), skyLayer, anims,
    scratch: new Float32Array(1 << 17),
  };
  geoCache.set(map, cache);
  return cache;
}

/**
 * Build (or rebuild) the level's renderable vertices. Everything invariant to
 * sector height is cached per map (buildGeoCache); a rebuild after a door or
 * lift moves only re-reads heights and re-fills a reused buffer.
 */
export function buildLevelGeometry(wad: Wad, map: DoomMap, wallTex: Map<string, Texture>): LevelGeometry {
  const cache = geoCache.get(map) ?? buildGeoCache(wad, map, wallTex);
  const { textures, layerOf, cells, skyLayer, anims } = cache;

  let scratch = cache.scratch;
  let n = 0;
  const vert = (x: number, y: number, z: number, u: number, v: number, light: number, layer: number): void => {
    if (n + 7 > scratch.length) {
      const grown = new Float32Array(scratch.length * 2);
      grown.set(scratch);
      scratch = cache.scratch = grown;
    }
    scratch[n] = x; scratch[n + 1] = y; scratch[n + 2] = z;
    scratch[n + 3] = u; scratch[n + 4] = v; scratch[n + 5] = light; scratch[n + 6] = layer;
    n += 7;
  };

  // ---- floors and ceilings ------------------------------------------------
  for (let i = 0; i < cells.length; i++) {
    const poly = cells[i];
    if (!poly || poly.length < 3) continue;
    const secNum = subsectorSector(map, i);
    const sec = map.sectors[secNum];
    if (!sec) continue;
    const light = secNum; // sector index; shader resolves live light

    for (const [pic, height, flip] of [
      [sec.floorPic, sec.floorHeight, false],
      [sec.ceilingPic, sec.ceilingHeight, true],
    ] as const) {
      if (pic === 'F_SKY1' || wad.checkNumForName(pic) < 0) continue;
      const layer = layerOf.get(pic)!; // pre-registered by buildGeoCache

      // The cell is convex by construction, so a fan needs no triangulator.
      for (let k = 1; k < poly.length - 1; k++) {
        const tri = flip ? [poly[k + 1], poly[k], poly[0]] : [poly[0], poly[k], poly[k + 1]];
        // UVs stay in MAP space — flats are aligned to the map grid, not the
        // world axes, so the negation must not reach them.
        for (const p of tri) {
          vert(p.x, height, mapYToWorldZ(p.y), p.x / 64, p.y / 64, light, layer);
        }
      }
    }
  }

  // ---- walls --------------------------------------------------------------
  for (const seg of map.segs) {
    const ld = map.lineDefs[seg.lineDef];
    if (!ld) continue;
    const front = map.sideDefs[ld.sideNum[seg.side]];
    if (!front) continue;
    const frontSec = map.sectors[front.sector];
    if (!frontSec) continue;

    const backSideNum = ld.sideNum[seg.side ^ 1];
    const backSec = backSideNum >= 0 ? map.sectors[map.sideDefs[backSideNum]?.sector] : undefined;

    const a = map.vertexes[seg.v1], b = map.vertexes[seg.v2];
    if (!a || !b) continue;
    const segLen = Math.hypot(b.x - a.x, b.y - a.y);
    if (segLen === 0) continue;

    const light = front.sector; // sector index; shader resolves live light
    // r_segs.c: u starts at the sidedef offset plus the seg's distance along
    // its linedef, then advances by world distance across the seg.
    const u0 = front.textureOffset + seg.offset;

    const quad = (name: string, topH: number, botH: number, textureTop: number): void => {
      if (topH <= botH) return;
      const t = wallTex.get(name);
      if (!t) return;
      const layer = layerOf.get(t.name)!; // pre-registered by buildGeoCache

      const uL = u0 / t.width, uR = (u0 + segLen) / t.width;
      const vT = (textureTop - topH) / t.height, vB = (textureTop - botH) / t.height;

      const az = mapYToWorldZ(a.y);
      const bz = mapYToWorldZ(b.y);
      vert(a.x, topH, az, uL, vT, light, layer);
      vert(b.x, topH, bz, uR, vT, light, layer);
      vert(b.x, botH, bz, uR, vB, light, layer);
      vert(a.x, topH, az, uL, vT, light, layer);
      vert(b.x, botH, bz, uR, vB, light, layer);
      vert(a.x, botH, az, uL, vB, light, layer);
    };

    if (!backSec) {
      // One-sided: midtexture spans floor to ceiling. r_segs.c: DONTPEGBOTTOM
      // puts the texture's bottom at the floor, else its top at the ceiling.
      const t = wallTex.get(front.midTexture);
      if (t) {
        const top = ld.flags & ML_DONTPEGBOTTOM
          ? frontSec.floorHeight + t.height
          : frontSec.ceilingHeight;
        quad(front.midTexture, frontSec.ceilingHeight, frontSec.floorHeight, top + front.rowOffset);
      }
      continue;
    }

    // Upper: front ceiling above back ceiling.
    if (frontSec.ceilingHeight > backSec.ceilingHeight && front.topTexture !== '-') {
      const t = wallTex.get(front.topTexture);
      if (t) {
        const top = ld.flags & ML_DONTPEGTOP
          ? frontSec.ceilingHeight
          : backSec.ceilingHeight + t.height;
        quad(front.topTexture, frontSec.ceilingHeight, backSec.ceilingHeight, top + front.rowOffset);
      }
    }

    // Lower: front floor below back floor.
    if (frontSec.floorHeight < backSec.floorHeight && front.bottomTexture !== '-') {
      const t = wallTex.get(front.bottomTexture);
      if (t) {
        const top = ld.flags & ML_DONTPEGBOTTOM ? frontSec.ceilingHeight : backSec.floorHeight;
        quad(front.bottomTexture, backSec.floorHeight, frontSec.floorHeight, top + front.rowOffset);
      }
    }

    // Two-sided middle: grates and fences. Masked; the shader already discards
    // on zero coverage, so it needs no separate pass.
    if (front.midTexture !== '-') {
      const t = wallTex.get(front.midTexture);
      if (t) {
        const openTop = Math.min(frontSec.ceilingHeight, backSec.ceilingHeight);
        const openBot = Math.max(frontSec.floorHeight, backSec.floorHeight);
        const top = ld.flags & ML_DONTPEGBOTTOM ? openBot + t.height : openTop;
        quad(front.midTexture, Math.min(openTop, top), Math.max(openBot, top - t.height),
             top + front.rowOffset);
      }
    }
  }

  return {
    vertices: scratch.subarray(0, n) as Float32Array<ArrayBuffer>,
    count: n / 7, textures, skyLayer, anims,
  };
}

/** Player 1 start (THINGS type 1). p_setup.c P_LoadThings. */
export function playerStart(wad: Wad, map: DoomMap): { x: number; y: number; angle: number } {
  const l = wad.lumpNum(wad.getNumForName(map.name) + 1); // ML_THINGS
  const v = new DataView(l.buffer, l.byteOffset, l.byteLength);
  for (let i = 0; i + 10 <= l.length; i += 10) {
    if (v.getInt16(i + 6, true) === 1) {
      return { x: v.getInt16(i, true), y: v.getInt16(i + 2, true), angle: v.getInt16(i + 4, true) };
    }
  }
  throw new Error(`${map.name}: no player 1 start`);
}
