// The automap (am_map.c): a top-down line drawing of the level, player as an
// arrow, walls coloured by type. Toggled with Tab; +/- zoom. Draws coloured
// lines (not textured quads), so it owns a tiny line-list pipeline and rebuilds
// a vertex buffer each frame from the live line/sector data.

import type { PLine, PMobj } from './p_local.js';
import { P_PathTraverse, PT_ADDLINES } from './p_maputl.js';

// Reveal lines the player can currently see: cast rays across the view and mark
// each line a ray crosses up to the first blocker (a solid wall or a shut door),
// exactly as the software renderer marks the columns it draws. Display-only — it
// sets a flag the sim never reads and draws no P_Random, so demos are untouched.
// Runs each tic whether or not the map is open, so you reveal as you explore.
const REVEAL_RAYS = 60;
const REVEAL_FOV = Math.PI * 0.6;       // a touch wider than the 90° view
const REVEAL_DIST = 2400 << 16;         // fixed_t reach

export function AM_Reveal(player: PMobj): void {
  const x1 = player.x, y1 = player.y;
  const base = (player.angle >>> 0) / 4294967296 * Math.PI * 2 - REVEAL_FOV / 2;
  for (let i = 0; i < REVEAL_RAYS; i++) {
    const a = base + REVEAL_FOV * (i / (REVEAL_RAYS - 1));
    const x2 = (x1 + Math.cos(a) * REVEAL_DIST) | 0;
    const y2 = (y1 + Math.sin(a) * REVEAL_DIST) | 0;
    P_PathTraverse(x1, y1, x2, y2, PT_ADDLINES, (ic) => {
      const ld = ic.line;
      if (!ld) return true;
      ld.seen = true;
      if (!ld.backSector || !ld.frontSector) return false; // solid wall stops the ray
      // A shut door / no vertical opening also blocks the view beyond.
      const openTop = Math.min(ld.frontSector.ceilingHeight, ld.backSector.ceilingHeight);
      const openBot = Math.max(ld.frontSector.floorHeight, ld.backSector.floorHeight);
      return openTop > openBot;
    });
  }
}

const SHADER = /* wgsl */ `
struct VSOut { @builtin(position) pos: vec4f, @location(0) color: vec3f };
@vertex fn vs(@location(0) p: vec2f, @location(1) c: vec3f) -> VSOut {
  var o: VSOut; o.pos = vec4f(p, 0.0, 1.0); o.color = c; return o;
}
@fragment fn fs(in: VSOut) -> @location(0) vec4f { return vec4f(in.color, 1.0); }
`;

// Line colours (plain RGB — not palette indices). Roughly am_map.c's scheme.
const C_ONESIDED = [0.75, 0.0, 0.0];   // solid wall
const C_FLOORDIFF = [0.60, 0.40, 0.20]; // two-sided, floor step
const C_CEILDIFF = [0.85, 0.72, 0.15];  // two-sided, ceiling step
const C_TWOSIDED = [0.42, 0.42, 0.42];  // two-sided, no step
const C_ARROW = [1.0, 1.0, 1.0];        // the player
const C_THING = [0.4, 0.85, 0.4];       // things (iddt)

const ML_DONTDRAW = 0x80;

// Player arrow in local space (points +X), as line segments.
const ARROW: [number, number][][] = [
  [[-1, 0], [1, 0]], [[1, 0], [0.5, 0.35]], [[1, 0], [0.5, -0.35]],
];

export interface Automap {
  active: boolean;
  toggle(): void;
  /** iddt: cycle showing things on/off. */
  cheatCycle(): void;
  /** Handle a keydown (zoom). Returns true if consumed. */
  key(code: string): boolean;
  /** Build the frame's line vertices (call before the render pass). `allmap` is
   *  the computer-area-map powerup: it reveals every line like the iddt cheat. */
  prepare(lines: PLine[], player: PMobj, things: Iterable<PMobj>, aspect: number, allmap: boolean): void;
  /** Draw into the current render pass. */
  draw(pass: GPURenderPassEncoder): void;
}

export function createAutomap(device: GPUDevice, format: GPUTextureFormat): Automap {
  const module = device.createShaderModule({ code: SHADER });
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: {
      module, entryPoint: 'vs',
      buffers: [{
        arrayStride: 20,
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x2' },
          { shaderLocation: 1, offset: 8, format: 'float32x3' },
        ],
      }],
    },
    fragment: { module, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'line-list' },
    // The scene pass carries a depth attachment; opt out of testing/writing.
    depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
  });

  let buf = device.createBuffer({ size: 1 << 18, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
  let data = new Float32Array(buf.size / 4);
  let count = 0;         // vertices
  let zoom = 0.00125;    // NDC per map unit
  let reveal = 0;        // iddt cycle: 0 = only seen, 1 = all lines, 2 = + things

  const state = {
    active: false,
    toggle(): void { state.active = !state.active; },
    cheatCycle(): void { reveal = (reveal + 1) % 3; },
    key(code: string): boolean {
      if (!state.active) return false;
      if (code === 'Equal' || code === 'NumpadAdd') { zoom *= 1.3; return true; }
      if (code === 'Minus' || code === 'NumpadSubtract') { zoom /= 1.3; return true; }
      return false;
    },
    prepare(lines: PLine[], player: PMobj, things: Iterable<PMobj>, aspect: number, allmap: boolean): void {
      const cx = player.x >> 16, cy = player.y >> 16;
      const sx = zoom / aspect, sy = zoom;
      const showLines = reveal >= 1 || allmap; // reveal everything (cheat/powerup)
      const showThings = reveal >= 2;
      let n = 0;
      const seg = (ax: number, ay: number, bx: number, by: number, c: number[]): void => {
        if (n + 10 > data.length) return; // clamp; buffer is generously sized
        data[n] = (ax - cx) * sx; data[n + 1] = (ay - cy) * sy;
        data[n + 2] = c[0]; data[n + 3] = c[1]; data[n + 4] = c[2];
        data[n + 5] = (bx - cx) * sx; data[n + 6] = (by - cy) * sy;
        data[n + 7] = c[0]; data[n + 8] = c[1]; data[n + 9] = c[2];
        n += 10;
      };

      for (const ld of lines) {
        if (!ld.seen && !showLines) continue;             // not yet explored
        if (ld.flags & ML_DONTDRAW && !showLines) continue; // mapper-hidden
        const front = ld.frontSector, back = ld.backSector;
        let c = C_ONESIDED;
        if (back && front) {
          if (back.floorHeight !== front.floorHeight) c = C_FLOORDIFF;
          else if (back.ceilingHeight !== front.ceilingHeight) c = C_CEILDIFF;
          else c = C_TWOSIDED;
        }
        seg(ld.v1x >> 16, ld.v1y >> 16, ld.v2x >> 16, ld.v2y >> 16, c);
      }

      // Things (iddt): a small cross at each mobj.
      if (showThings) {
        const r = 12;
        for (const mo of things) {
          const mx = mo.x >> 16, my = mo.y >> 16;
          seg(mx - r, my, mx + r, my, C_THING);
          seg(mx, my - r, mx, my + r, C_THING);
        }
      }

      // Player arrow: rotate the local shape by the view angle and scale it.
      const ang = (player.angle >>> 0) / 4294967296 * Math.PI * 2;
      const ca = Math.cos(ang), sa = Math.sin(ang), size = 20;
      const px = player.x >> 16, py = player.y >> 16;
      for (const [[lx0, ly0], [lx1, ly1]] of ARROW) {
        seg(px + (lx0 * ca - ly0 * sa) * size, py + (lx0 * sa + ly0 * ca) * size,
            px + (lx1 * ca - ly1 * sa) * size, py + (lx1 * sa + ly1 * ca) * size, C_ARROW);
      }

      count = n / 5;
      device.queue.writeBuffer(buf, 0, data, 0, n);
    },
    draw(pass: GPURenderPassEncoder): void {
      if (count === 0) return;
      pass.setPipeline(pipeline);
      pass.setVertexBuffer(0, buf);
      pass.draw(count);
    },
  };
  return state;
}
