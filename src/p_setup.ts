// Build the runtime playsim state. Ported from linuxdoom-1.10/p_setup.c
// (P_LoadSectors / P_LoadLineDefs / P_GroupLines), the half that map.ts skips.
//
// map.ts reads the lumps in raw map units for the renderer. This shifts them
// into fixed_t and derives what the sim needs: line deltas, bounding boxes,
// slope types, and the front/back sector links.

import { MAPBLOCKSHIFT, type DoomMap } from './map.js';
import { FRACBITS } from './m_fixed.js';
import { slopeTypeOf, BOXTOP, BOXBOTTOM, BOXLEFT, BOXRIGHT } from './p_maputl.js';
import { MAXRADIUS, type PLine, type PSector } from './p_local.js';

/** r_defs.h node_t. p_setup.c shifts these into fixed_t on load. */
export interface PNode {
  x: number;
  y: number;
  dx: number;
  dy: number;
  children: [number, number];
}

export interface PlaysimMap {
  sectors: PSector[];
  lines: PLine[];
  /** Fixed-point BSP nodes — p_sight.c walks these, not the map-unit ones. */
  nodes: PNode[];
  /** Kept for the blockmap, which stays in map units. */
  source: DoomMap;
}

export function P_SetupLevel(map: DoomMap): PlaysimMap {
  // P_LoadSectors: heights shift into fixed_t; lightlevel/special/tag don't.
  const sectors: PSector[] = map.sectors.map((s, i) => ({
    floorHeight: s.floorHeight << FRACBITS,
    ceilingHeight: s.ceilingHeight << FRACBITS,
    floorPic: s.floorPic,
    ceilingPic: s.ceilingPic,
    lightLevel: s.lightLevel,
    special: s.special,
    tag: s.tag,
    index: i,
    thingList: null,
    specialData: null,
    soundX: 0,
    soundY: 0,
    soundTarget: null,
    soundTraversed: 0,
    validCount: 0,
    blockBox: [0, 0, 0, 0],
    lineIndices: [],
  }));

  // P_LoadLineDefs: derive dx/dy, bbox and slopetype, then link sectors.
  const lines: PLine[] = map.lineDefs.map((ld, i) => {
    const a = map.vertexes[ld.v1];
    const b = map.vertexes[ld.v2];

    const v1x = a.x << FRACBITS, v1y = a.y << FRACBITS;
    const v2x = b.x << FRACBITS, v2y = b.y << FRACBITS;
    const dx = (v2x - v1x) | 0;
    const dy = (v2y - v1y) | 0;

    const bbox: [number, number, number, number] = [0, 0, 0, 0];
    bbox[BOXTOP] = Math.max(v1y, v2y);
    bbox[BOXBOTTOM] = Math.min(v1y, v2y);
    bbox[BOXLEFT] = Math.min(v1x, v2x);
    bbox[BOXRIGHT] = Math.max(v1x, v2x);

    const frontSide = ld.sideNum[0] >= 0 ? map.sideDefs[ld.sideNum[0]] : undefined;
    const backSide = ld.sideNum[1] >= 0 ? map.sideDefs[ld.sideNum[1]] : undefined;

    return {
      index: i,
      v1x, v1y, v2x, v2y,
      dx, dy,
      flags: ld.flags,
      special: ld.special,
      tag: ld.tag,
      sideNum: [ld.sideNum[0], ld.sideNum[1]],
      bbox,
      slopeType: slopeTypeOf(dx, dy),
      frontSector: frontSide ? sectors[frontSide.sector] ?? null : null,
      backSector: backSide ? sectors[backSide.sector] ?? null : null,
      validCount: 0,
      seen: false,
    };
  });

  // P_GroupLines: attach lines to sectors, then derive each sector's bounding
  // box and the blockmap cells it spans. P_ChangeSector walks the blockbox to
  // find every mobj a moving plane could touch, so a wrong box means a door
  // that fails to crush — or crushes a room away.
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.frontSector) l.frontSector.lineIndices.push(i);
    if (l.backSector && l.backSector !== l.frontSector) l.backSector.lineIndices.push(i);
  }

  const bm = map.blockMap;
  const orgX = bm.originX << FRACBITS;
  const orgY = bm.originY << FRACBITS;

  for (const sec of sectors) {
    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (const li of sec.lineIndices) {
      const l = lines[li];
      top = Math.max(top, l.v1y, l.v2y);
      bottom = Math.min(bottom, l.v1y, l.v2y);
      left = Math.min(left, l.v1x, l.v2x);
      right = Math.max(right, l.v1x, l.v2x);
    }
    if (!Number.isFinite(top)) { top = bottom = left = right = 0; }

    // Sector sound origin: the centre of its bounding box (p_setup.c).
    sec.soundX = ((left + right) / 2) | 0;
    sec.soundY = ((top + bottom) / 2) | 0;

    const clamp = (v: number, hi: number): number => (v < 0 ? 0 : v >= hi ? hi - 1 : v);
    sec.blockBox[BOXTOP] = clamp((top - orgY + MAXRADIUS) >> MAPBLOCKSHIFT, bm.height);
    sec.blockBox[BOXBOTTOM] = clamp((bottom - orgY - MAXRADIUS) >> MAPBLOCKSHIFT, bm.height);
    sec.blockBox[BOXRIGHT] = clamp((right - orgX + MAXRADIUS) >> MAPBLOCKSHIFT, bm.width);
    sec.blockBox[BOXLEFT] = clamp((left - orgX - MAXRADIUS) >> MAPBLOCKSHIFT, bm.width);
  }

  // P_LoadNodes: the sight code treats a node as a divline, so its x/y/dx/dy
  // must be fixed_t like everything else it compares against.
  const nodes: PNode[] = map.nodes.map((n) => ({
    x: n.x << FRACBITS,
    y: n.y << FRACBITS,
    dx: n.dx << FRACBITS,
    dy: n.dy << FRACBITS,
    children: [n.children[0], n.children[1]],
  }));

  return { sectors, lines, nodes, source: map };
}
