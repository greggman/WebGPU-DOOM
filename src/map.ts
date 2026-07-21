// Map loading. Ported from linuxdoom-1.10/p_setup.c, on-disk structs from
// doomdata.h.
//
// Heights and coordinates stay in raw map units here. Vanilla shifts them left
// by FRACBITS on load because the playsim is fixed-point; that's a playsim
// concern, and the renderer wants floats. When the playsim lands it keeps its
// own fixed_t state and we convert at geometry-build time.

import type { Wad } from './wad.js';

// Lump order following the map label. p_setup.c: ML_THINGS .. ML_BLOCKMAP.
const ML_THINGS = 1, ML_LINEDEFS = 2, ML_SIDEDEFS = 3, ML_VERTEXES = 4,
      ML_SEGS = 5, ML_SSECTORS = 6, ML_NODES = 7, ML_SECTORS = 8,
      ML_REJECT = 9, ML_BLOCKMAP = 10;

export interface Vertex { x: number; y: number; }

export interface Sector {
  floorHeight: number;
  ceilingHeight: number;
  floorPic: string;
  ceilingPic: string;
  lightLevel: number;
  special: number;
  tag: number;
  /** Filled by the geometry builder: lines bounding this sector. */
  lines: number[];
}

export interface SideDef {
  textureOffset: number;
  rowOffset: number;
  topTexture: string;
  bottomTexture: string;
  midTexture: string;
  sector: number;
}

export interface LineDef {
  v1: number;
  v2: number;
  flags: number;
  special: number;
  tag: number;
  /** sidenum[1] is -1 for one-sided lines. */
  sideNum: [number, number];
}

export interface Seg {
  v1: number;
  v2: number;
  angle: number;
  lineDef: number;
  /** 0 = front, 1 = back. */
  side: number;
  offset: number;
}

export interface SubSector { numSegs: number; firstSeg: number; }

export interface Node {
  x: number; y: number; dx: number; dy: number;
  /** bbox[child][0..3] = top, bottom, left, right. */
  bbox: [number[], number[]];
  children: [number, number];
}

/**
 * p_setup.c P_LoadBlockMap. A uniform grid over the map; each cell lists the
 * linedefs crossing it, so collision tests only look at nearby lines instead of
 * all of them. Header is 4 shorts, then width*height offsets into the same
 * lump, then the lists (each -1 terminated).
 */
export interface BlockMap {
  originX: number;
  originY: number;
  width: number;
  height: number;
  /** Raw shorts — offsets index into this same array, as in vanilla. */
  data: Int16Array;
}

export interface DoomMap {
  name: string;
  vertexes: Vertex[];
  sectors: Sector[];
  sideDefs: SideDef[];
  lineDefs: LineDef[];
  segs: Seg[];
  subSectors: SubSector[];
  nodes: Node[];
  blockMap: BlockMap;
  /** Sector-to-sector visibility LUT for line-of-sight. Empty if absent. */
  reject: Uint8Array;
}

/** p_local.h. MAPBLOCKSHIFT is FRACBITS+7 = 23: it shifts a FIXED-POINT
 *  coordinate straight to a block index, not a map unit. */
export const MAPBLOCKUNITS = 128;
export const MAPBLOCKSIZE = MAPBLOCKUNITS * 65536;
export const MAPBLOCKSHIFT = 16 + 7;
export const MAPBTOFRAC = MAPBLOCKSHIFT - 16;

/** LINEDEFS flags we care about (doomdef.h ML_*). */
export const ML_BLOCKING = 1;
export const ML_TWOSIDED = 4;
export const ML_DONTPEGTOP = 8;
export const ML_DONTPEGBOTTOM = 16;

function name8(bytes: Uint8Array, off: number): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const c = bytes[off + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.toUpperCase();
}

function dv(lump: Uint8Array): DataView {
  return new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
}

export function loadMap(wad: Wad, name: string): DoomMap {
  const label = wad.getNumForName(name);

  const vertexes: Vertex[] = [];
  {
    const l = wad.lumpNum(label + ML_VERTEXES), v = dv(l);
    for (let i = 0; i + 4 <= l.length; i += 4) {
      vertexes.push({ x: v.getInt16(i, true), y: v.getInt16(i + 2, true) });
    }
  }

  const sectors: Sector[] = [];
  {
    const l = wad.lumpNum(label + ML_SECTORS), v = dv(l);
    for (let i = 0; i + 26 <= l.length; i += 26) {
      sectors.push({
        floorHeight: v.getInt16(i, true),
        ceilingHeight: v.getInt16(i + 2, true),
        floorPic: name8(l, i + 4),
        ceilingPic: name8(l, i + 12),
        lightLevel: v.getInt16(i + 20, true),
        special: v.getInt16(i + 22, true),
        tag: v.getInt16(i + 24, true),
        lines: [],
      });
    }
  }

  const sideDefs: SideDef[] = [];
  {
    const l = wad.lumpNum(label + ML_SIDEDEFS), v = dv(l);
    for (let i = 0; i + 30 <= l.length; i += 30) {
      sideDefs.push({
        textureOffset: v.getInt16(i, true),
        rowOffset: v.getInt16(i + 2, true),
        topTexture: name8(l, i + 4),
        bottomTexture: name8(l, i + 12),
        midTexture: name8(l, i + 20),
        sector: v.getInt16(i + 28, true),
      });
    }
  }

  const lineDefs: LineDef[] = [];
  {
    const l = wad.lumpNum(label + ML_LINEDEFS), v = dv(l);
    for (let i = 0; i + 14 <= l.length; i += 14) {
      lineDefs.push({
        v1: v.getUint16(i, true),
        v2: v.getUint16(i + 2, true),
        flags: v.getInt16(i + 4, true),
        special: v.getInt16(i + 6, true),
        tag: v.getInt16(i + 8, true),
        // -1 (0xffff) means no back side. getInt16 gives us that directly.
        sideNum: [v.getInt16(i + 10, true), v.getInt16(i + 12, true)],
      });
    }
  }

  const segs: Seg[] = [];
  {
    const l = wad.lumpNum(label + ML_SEGS), v = dv(l);
    for (let i = 0; i + 12 <= l.length; i += 12) {
      segs.push({
        v1: v.getUint16(i, true),
        v2: v.getUint16(i + 2, true),
        angle: v.getInt16(i + 4, true),
        lineDef: v.getUint16(i + 6, true),
        side: v.getInt16(i + 8, true),
        offset: v.getInt16(i + 10, true),
      });
    }
  }

  const subSectors: SubSector[] = [];
  {
    const l = wad.lumpNum(label + ML_SSECTORS), v = dv(l);
    for (let i = 0; i + 4 <= l.length; i += 4) {
      subSectors.push({ numSegs: v.getUint16(i, true), firstSeg: v.getUint16(i + 2, true) });
    }
  }

  const nodes: Node[] = [];
  {
    const l = wad.lumpNum(label + ML_NODES), v = dv(l);
    for (let i = 0; i + 28 <= l.length; i += 28) {
      const bb = (c: number): number[] => [
        v.getInt16(i + 8 + c * 8, true), v.getInt16(i + 10 + c * 8, true),
        v.getInt16(i + 12 + c * 8, true), v.getInt16(i + 14 + c * 8, true),
      ];
      nodes.push({
        x: v.getInt16(i, true), y: v.getInt16(i + 2, true),
        dx: v.getInt16(i + 4, true), dy: v.getInt16(i + 6, true),
        bbox: [bb(0), bb(1)],
        children: [v.getUint16(i + 24, true), v.getUint16(i + 26, true)],
      });
    }
  }

  // p_setup.c P_LoadBlockMap. Vanilla byte-swaps the lump in place and keeps
  // offsets relative to the same buffer, so we mirror that: `data` is the whole
  // lump as shorts, and an offset at data[4 + y*w + x] indexes back into it.
  const bmLump = wad.lumpNum(label + ML_BLOCKMAP);
  const bmShorts = new Int16Array(bmLump.length >> 1);
  {
    const v = dv(bmLump);
    for (let i = 0; i < bmShorts.length; i++) bmShorts[i] = v.getInt16(i * 2, true);
  }
  const blockMap: BlockMap = {
    originX: bmShorts[0],
    originY: bmShorts[1],
    width: bmShorts[2],
    height: bmShorts[3],
    data: bmShorts,
  };

  // REJECT is a bit-per-sector-pair visibility matrix. Some WADs ship it
  // undersized or zero-filled; treat a short lump as "everything visible"
  // rather than reading past the end.
  const rjLump = wad.lumpNum(label + ML_REJECT);
  const needed = Math.ceil((sectors.length * sectors.length) / 8);
  const reject = rjLump.length >= needed ? rjLump : new Uint8Array(needed);

  // p_setup.c P_GroupLines: attach each line to the sectors it bounds. The
  // geometry builder needs this to walk a sector's boundary.
  for (let i = 0; i < lineDefs.length; i++) {
    const ld = lineDefs[i];
    const front = ld.sideNum[0] >= 0 ? sideDefs[ld.sideNum[0]] : undefined;
    const back = ld.sideNum[1] >= 0 ? sideDefs[ld.sideNum[1]] : undefined;
    if (front && sectors[front.sector]) sectors[front.sector].lines.push(i);
    if (back && sectors[back.sector] && back.sector !== front?.sector) {
      sectors[back.sector].lines.push(i);
    }
  }

  return { name, vertexes, sectors, sideDefs, lineDefs, segs, subSectors, nodes, blockMap, reject };
}

/** Linedefs in a blockmap cell. p_maputl.c P_BlockLinesIterator. */
export function blockLines(map: DoomMap, bx: number, by: number): number[] {
  const bm = map.blockMap;
  if (bx < 0 || by < 0 || bx >= bm.width || by >= bm.height) return [];
  // Header is 4 shorts; the per-cell offset follows, and is itself an index
  // into the same short array.
  let p = bm.data[4 + by * bm.width + bx];
  const out: number[] = [];
  // Vanilla reads the blocklist straight from the offset — and every list begins
  // with a 0 word, which P_BlockLinesIterator dutifully treats as LINEDEF 0. So
  // linedef 0 is tested in every cell. It's a vanilla quirk (line 0 can block a
  // move/shot in a cell it isn't really in), but demos depend on it, so we must
  // NOT skip that leading 0.
  for (; p < bm.data.length && bm.data[p] !== -1; p++) out.push(bm.data[p]);
  return out;
}
