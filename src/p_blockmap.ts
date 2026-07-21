// Mobj <-> blockmap/sector links. Ported from linuxdoom-1.10/p_maputl.c
// (P_SetThingPosition / P_UnsetThingPosition / P_BlockThingsIterator).
//
// Mobjs live in intrusive doubly linked lists: one per blockmap cell, one per
// sector. New things are PREPENDED, so a cell's list is reverse spawn order —
// and since PIT_CheckThing stops at the first blocker, that order decides which
// of two overlapping things you collide with. Rebuilding these as arrays each
// tic would be simpler and would quietly change the game.

import { MAPBLOCKSHIFT, type DoomMap } from './map.js';
import { MF } from './info.js';
import type { PMobj, PSector } from './p_local.js';

/** blocklinks[y*width+x] — head of each cell's mobj list. */
let blockLinks: (PMobj | null)[] = [];
let bmWidth = 0, bmHeight = 0, bmOrgX = 0, bmOrgY = 0;

let sectorAt: (x: number, y: number) => PSector;
let subSectorAt: (x: number, y: number) => number;

export function P_InitBlockLinks(
  map: DoomMap,
  env: { sectorAt: (x: number, y: number) => PSector; subSectorAt: (x: number, y: number) => number },
): void {
  const bm = map.blockMap;
  bmWidth = bm.width;
  bmHeight = bm.height;
  bmOrgX = bm.originX << 16;
  bmOrgY = bm.originY << 16;
  blockLinks = new Array(bmWidth * bmHeight).fill(null);
  sectorAt = env.sectorAt;
  subSectorAt = env.subSectorAt;
}

/** P_UnsetThingPosition. */
export function P_UnsetThingPosition(thing: PMobj): void {
  if (!(thing.flags & MF.MF_NOSECTOR)) {
    if (thing.snext) thing.snext.sprev = thing.sprev;
    if (thing.sprev) thing.sprev.snext = thing.snext;
    else if (thing.sector) thing.sector.thingList = thing.snext; // was the head
    thing.snext = thing.sprev = null;
    thing.sector = null;
  }

  if (!(thing.flags & MF.MF_NOBLOCKMAP)) {
    if (thing.bnext) thing.bnext.bprev = thing.bprev;
    if (thing.bprev) thing.bprev.bnext = thing.bnext;
    else if (thing.blockIndex >= 0) blockLinks[thing.blockIndex] = thing.bnext;
    thing.bnext = thing.bprev = null;
    thing.blockIndex = -1;
  }
}

/** P_SetThingPosition. */
export function P_SetThingPosition(thing: PMobj): void {
  thing.subSector = subSectorAt(thing.x, thing.y);

  if (!(thing.flags & MF.MF_NOSECTOR)) {
    const sec = sectorAt(thing.x, thing.y);
    thing.sector = sec;
    thing.sprev = null;
    thing.snext = sec.thingList;
    if (sec.thingList) sec.thingList.sprev = thing;
    sec.thingList = thing;
  }

  if (!(thing.flags & MF.MF_NOBLOCKMAP)) {
    const bx = (thing.x - bmOrgX) >> MAPBLOCKSHIFT;
    const by = (thing.y - bmOrgY) >> MAPBLOCKSHIFT;

    if (bx >= 0 && bx < bmWidth && by >= 0 && by < bmHeight) {
      const idx = by * bmWidth + bx;
      const head = blockLinks[idx];
      thing.bprev = null;
      thing.bnext = head;
      if (head) head.bprev = thing;
      blockLinks[idx] = thing;
      thing.blockIndex = idx;
    } else {
      // Off the map entirely — linked nowhere.
      thing.bnext = thing.bprev = null;
      thing.blockIndex = -1;
    }
  }
}

/** P_BlockThingsIterator. */
export function P_BlockThingsIterator(
  x: number,
  y: number,
  func: (m: PMobj) => boolean,
): boolean {
  if (x < 0 || y < 0 || x >= bmWidth || y >= bmHeight) return true;

  // Cache next before calling: func may remove the mobj (picking up an item),
  // which nulls its links mid-walk.
  let mobj = blockLinks[y * bmWidth + x];
  while (mobj) {
    const next = mobj.bnext;
    if (!func(mobj)) return false;
    mobj = next;
  }
  return true;
}
