// Floor/ceiling geometry. Replaces linuxdoom-1.10/r_plane.c, which drew
// visplanes as horizontal spans; we need real polygons instead.
//
// The BSP guarantees every subsector is convex, but it does NOT store the
// polygon: SEGS only contains edges that came from real linedefs. Edges created
// by BSP splits along a partition line -- where there is no wall -- are absent.
// Empirically ~98% of subsectors have an open seg ring, so fanning the segs
// directly leaves holes in the floor.
//
// Recover the polygon the way GZDoom does: start with a quad covering the map,
// walk the BSP from the root to each subsector, and Sutherland-Hodgman clip by
// each partition half-plane along the way. The result is the subsector's true
// convex cell, which fans trivially.

import type { DoomMap } from './map.js';

export interface Poly { x: number; y: number; }

const NF_SUBSECTOR = 0x8000; // node child flag: index is a subsector, not a node

/**
 * Clip a convex polygon to the FRONT half-plane of the line (x,y)+(dx,dy).
 *
 * Front matches vanilla's R_PointOnSide (r_main.c): it returns 0 (front) when
 * `right < left`, i.e. dy*node.dx < node.dy*dx, i.e. cross > 0 for
 *   cross = node.dy*(px - node.x) - (py - node.y)*node.dx
 * so the front side is cross >= 0 and we keep that. Pass (-dx,-dy) to keep the
 * back side instead.
 */
function clipToPlane(poly: Poly[], x: number, y: number, dx: number, dy: number): Poly[] {
  if (poly.length === 0) return poly;
  const side = (p: Poly): number => (p.x - x) * dy - (p.y - y) * dx;

  const out: Poly[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);

    if (sa >= 0) out.push(a);
    // Strict sign change only: touching the plane (side == 0) is not a crossing,
    // otherwise collinear edges emit duplicate vertices.
    if ((sa < 0 && sb > 0) || (sa > 0 && sb < 0)) {
      const t = sa / (sa - sb);
      out.push({ x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) });
    }
  }
  return out;
}

function dedupe(poly: Poly[], eps = 0.01): Poly[] {
  const out: Poly[] = [];
  for (const p of poly) {
    const q = out[out.length - 1];
    if (q && Math.abs(p.x - q.x) < eps && Math.abs(p.y - q.y) < eps) continue;
    out.push(p);
  }
  while (out.length > 1) {
    const a = out[0], b = out[out.length - 1];
    if (Math.abs(a.x - b.x) < eps && Math.abs(a.y - b.y) < eps) out.pop();
    else break;
  }
  return out;
}

/**
 * Weld near-duplicate vertices across all cells.
 *
 * Two cells that share a partition edge each compute that edge's far endpoint
 * from a DIFFERENT pair of partition lines, so their copies of the same corner
 * drift apart by up to ~1 unit (e.g. (3070.3,-2977.7) in one cell, (3070.8,
 * -2978.3) in its neighbour). The two cells then fan to slightly different
 * points and a thin sliver — gap on one side, overlap on the other — opens
 * across the middle of a floor or ceiling. Collapsing every cluster of vertices
 * within EPS to their shared centroid makes neighbours agree on the corner, so
 * the sliver closes. EPS stays well under the spacing of genuinely distinct map
 * features, so no real corner is merged (verified across E1: cell counts and
 * convexity are unchanged). Snapping to the CENTROID, not to a map vertex, is
 * load-bearing: mid-plane partition corners are not map vertices, and pulling
 * one onto a nearby wall vertex would tear the tiling open instead.
 */
function weldVertices(polys: Poly[][]): void {
  const EPS2 = 1.2 * 1.2;
  const BUCKET = 2;
  interface Cluster { x: number; y: number; sx: number; sy: number; n: number; }
  const grid = new Map<string, Cluster[]>();
  const instances: { poly: Poly[]; i: number }[] = [];
  const clusterOf: Cluster[] = [];

  for (const p of polys) {
    if (!p) continue;
    for (let i = 0; i < p.length; i++) instances.push({ poly: p, i });
  }
  for (const it of instances) {
    const pt = it.poly[it.i];
    const bx = Math.floor(pt.x / BUCKET), by = Math.floor(pt.y / BUCKET);
    let cl: Cluster | null = null;
    for (let gx = -1; gx <= 1 && !cl; gx++) {
      for (let gy = -1; gy <= 1 && !cl; gy++) {
        const cell = grid.get(`${bx + gx},${by + gy}`);
        if (!cell) continue;
        for (const c of cell) {
          if ((c.x - pt.x) ** 2 + (c.y - pt.y) ** 2 < EPS2) { cl = c; break; }
        }
      }
    }
    if (!cl) {
      cl = { x: pt.x, y: pt.y, sx: 0, sy: 0, n: 0 };
      const k = `${bx},${by}`;
      let cell = grid.get(k);
      if (!cell) grid.set(k, cell = []);
      cell.push(cl);
    }
    cl.sx += pt.x; cl.sy += pt.y; cl.n++;
    clusterOf.push(cl);
  }
  for (let j = 0; j < instances.length; j++) {
    const c = clusterOf[j];
    instances[j].poly[instances[j].i].x = c.sx / c.n;
    instances[j].poly[instances[j].i].y = c.sy / c.n;
  }
  for (let s = 0; s < polys.length; s++) if (polys[s]) polys[s] = dedupe(polys[s]);
}

/**
 * Split T-junctions. A small cell's corner often lands partway along a big
 * neighbour's single long edge. The corner is (almost) on the line, so there is
 * no real gap — but the big cell rasterises its edge as one straight span while
 * the small cell meets it with a vertex, and the two disagree pixel-by-pixel,
 * opening a dashed hairline crack. Inserting that vertex into the long edge makes
 * both sides share it. Only vertices that sit on or just OUTSIDE the edge are
 * inserted: one just inside would dent the cell concave and break the fan, so it
 * is skipped (its offset is sub-pixel, invisible). Run AFTER weldVertices so the
 * vertices being matched are already consistent between neighbours.
 */
function splitTJunctions(polys: Poly[][]): void {
  // PERP is generous: a BSP split vertex can sit a couple of units off the far
  // side's straight edge (integer rounding), and matching it there is what
  // closes the sliver. The concavity guard below keeps a too-far/wrong-side
  // vertex from denting the cell, so a large threshold is safe.
  const PERP = 2.5, END = 1.5, BUCKET = 8;
  const grid = new Map<string, Poly[]>();
  const seen = new Set<string>();
  for (const p of polys) {
    if (!p) continue;
    for (const v of p) {
      const k = `${Math.round(v.x * 4)},${Math.round(v.y * 4)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const gk = `${Math.floor(v.x / BUCKET)},${Math.floor(v.y / BUCKET)}`;
      let cell = grid.get(gk);
      if (!cell) grid.set(gk, cell = []);
      cell.push(v);
    }
  }
  for (let s = 0; s < polys.length; s++) {
    const p = polys[s];
    if (!p || p.length < 3) continue;
    let area = 0;
    for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length]; area += a.x * b.y - b.x * a.y; }
    const wind = area >= 0 ? 1 : -1;
    const out: Poly[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push(a);
      const ex = b.x - a.x, ey = b.y - a.y, L = Math.hypot(ex, ey);
      if (L < 2 * END) continue;
      const nx = ex / L, ny = ey / L;
      const ins: { t: number; v: Poly }[] = [];
      const minx = Math.min(a.x, b.x) - PERP, maxx = Math.max(a.x, b.x) + PERP;
      const miny = Math.min(a.y, b.y) - PERP, maxy = Math.max(a.y, b.y) + PERP;
      for (let gx = Math.floor(minx / BUCKET); gx <= Math.floor(maxx / BUCKET); gx++) {
        for (let gy = Math.floor(miny / BUCKET); gy <= Math.floor(maxy / BUCKET); gy++) {
          const cell = grid.get(`${gx},${gy}`);
          if (!cell) continue;
          for (const v of cell) {
            const t = (v.x - a.x) * nx + (v.y - a.y) * ny;
            if (t < END || t > L - END) continue;                 // too near an endpoint
            const perp = (ex * (v.y - a.y) - ey * (v.x - a.x)) / L; // signed, +left of a->b
            if (Math.abs(perp) >= PERP) continue;                 // not on this edge
            if (perp * wind > 0.05) continue;                     // interior side: would dent — skip
            // Bound the bulge angle: perp small vs the shorter sub-segment, so
            // the outward kink never becomes a reflex that breaks the fan.
            if (Math.abs(perp) > 0.25 * Math.min(t, L - t)) continue;
            ins.push({ t, v });
          }
        }
      }
      ins.sort((m, n) => m.t - n.t);
      for (const it of ins) out.push({ x: it.v.x, y: it.v.y, ins: true } as Poly);
    }
    // Cleanup: a bulge can still make a NEIGHBOUR vertex reflex through the next
    // edge. Drop any INSERTED vertex that leaves a reflex anywhere, until convex,
    // so the fan never gaps. Original vertices are kept (the cell was convex).
    let changed = true;
    while (changed && out.length > 3) {
      changed = false;
      for (let i = 0; i < out.length; i++) {
        const a = out[(i - 1 + out.length) % out.length], b = out[i], c = out[(i + 1) % out.length];
        const cr = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
        const l = (Math.hypot(b.x - a.x, b.y - a.y) * Math.hypot(c.x - b.x, c.y - b.y)) || 1;
        if ((cr / l) * wind >= -2e-3) continue;                 // convex here
        const bi = (b as { ins?: boolean }).ins, ai = (a as { ins?: boolean }).ins, ci = (c as { ins?: boolean }).ins;
        const drop = bi ? i : ai ? (i - 1 + out.length) % out.length : ci ? (i + 1) % out.length : -1;
        if (drop >= 0) { out.splice(drop, 1); changed = true; break; }  // remove the offending insert
      }
    }
    polys[s] = dedupe(out);
  }
}

/**
 * Convex cell for every subsector, recovered by clipping the map bounds against
 * the BSP partitions on the root->leaf path. Indexed by subsector number.
 */
export function buildSubsectorPolys(map: DoomMap): Poly[][] {
  const polys: Poly[][] = new Array(map.subSectors.length);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const v of map.vertexes) {
    if (v.x < minX) minX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.x > maxX) maxX = v.x;
    if (v.y > maxY) maxY = v.y;
  }
  // Pad so the initial quad is strictly outside every partition line.
  const M = 1024;
  minX -= M; minY -= M; maxX += M; maxY += M;

  const root = map.nodes.length - 1;
  if (root < 0) return polys;

  const walk = (nodeNum: number, poly: Poly[]): void => {
    if (nodeNum & NF_SUBSECTOR) {
      const ssNum = nodeNum & ~NF_SUBSECTOR;
      if (ssNum >= polys.length) return;

      // Partition planes alone leave edge cells running out to the map bounds:
      // the BSP tiles the whole plane, so a leaf at the level's rim is only
      // bounded on its interior sides. Clip by the subsector's own segs to
      // close it against its walls. Segs are wound with the subsector on the
      // front side, which is the same half-plane test as the partitions.
      let p = poly;
      const ss = map.subSectors[ssNum];
      for (let i = 0; i < ss.numSegs && p.length > 0; i++) {
        const sg = map.segs[ss.firstSeg + i];
        if (!sg) continue;
        const a = map.vertexes[sg.v1], b = map.vertexes[sg.v2];
        if (!a || !b) continue;
        p = clipToPlane(p, a.x, a.y, b.x - a.x, b.y - a.y);
      }

      polys[ssNum] = dedupe(p);
      return;
    }
    const n = map.nodes[nodeNum];
    if (!n) return;

    // Front (right) child keeps the front half-plane; back (left) child gets
    // the same plane reversed.
    walk(n.children[0], clipToPlane(poly, n.x, n.y, n.dx, n.dy));
    walk(n.children[1], clipToPlane(poly, n.x, n.y, -n.dx, -n.dy));
  };

  walk(root, [
    { x: minX, y: minY }, { x: maxX, y: minY },
    { x: maxX, y: maxY }, { x: minX, y: maxY },
  ]);

  weldVertices(polys);
  splitTJunctions(polys);
  return polys;
}

/** Which sector a subsector belongs to (via its first seg's linedef side). */
export function subsectorSector(map: DoomMap, ssIndex: number): number {
  const ss = map.subSectors[ssIndex];
  const seg = map.segs[ss.firstSeg];
  if (!seg) return -1;
  const ld = map.lineDefs[seg.lineDef];
  if (!ld) return -1;
  const sideNum = ld.sideNum[seg.side];
  const side = map.sideDefs[sideNum];
  return side ? side.sector : -1;
}
