// WebGL2 automap — the analogue of the WebGPU automap.ts. Same top-down line
// drawing (walls coloured by type, player arrow, iddt things); a tiny line-list
// program with a per-frame vertex buffer rebuilt from the live level. The reveal
// raycast (AM_Reveal) is backend-agnostic and stays in automap.ts.

import { createProgram } from './glutil.js';
import type { PLine, PMobj } from '../p_local.js';
import type { AutomapControl } from '../renderer.js';

const VS = `#version 300 es
layout(location=0) in vec2 a_pos; layout(location=1) in vec3 a_color;
out vec3 v_color;
void main(){ gl_Position=vec4(a_pos,0.0,1.0); v_color=a_color; }`;

const FS = `#version 300 es
precision highp float; in vec3 v_color; out vec4 fragColor;
void main(){ fragColor=vec4(v_color,1.0); }`;

// Line colours (plain RGB), roughly am_map.c's scheme.
const C_ONESIDED = [0.75, 0.0, 0.0];
const C_FLOORDIFF = [0.60, 0.40, 0.20];
const C_CEILDIFF = [0.85, 0.72, 0.15];
const C_TWOSIDED = [0.42, 0.42, 0.42];
const C_ARROW = [1.0, 1.0, 1.0];
const C_THING = [0.4, 0.85, 0.4];

const ML_DONTDRAW = 0x80;

// Player arrow in local space (points +X), as line segments.
const ARROW: [number, number][][] = [
  [[-1, 0], [1, 0]], [[1, 0], [0.5, 0.35]], [[1, 0], [0.5, -0.35]],
];

export interface WebGL2Automap extends AutomapControl {
  draw(): void;
}

export function createAutomap(gl: WebGL2RenderingContext): WebGL2Automap {
  const prog = createProgram(gl, VS, FS);
  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 20, 8);
  gl.bindVertexArray(null);

  let data = new Float32Array((1 << 18) / 4);
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
      const showLines = reveal >= 1 || allmap;
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
        if (!ld.seen && !showLines) continue;
        if (ld.flags & ML_DONTDRAW && !showLines) continue;
        const front = ld.frontSector, back = ld.backSector;
        let c = C_ONESIDED;
        if (back && front) {
          if (back.floorHeight !== front.floorHeight) c = C_FLOORDIFF;
          else if (back.ceilingHeight !== front.ceilingHeight) c = C_CEILDIFF;
          else c = C_TWOSIDED;
        }
        seg(ld.v1x >> 16, ld.v1y >> 16, ld.v2x >> 16, ld.v2y >> 16, c);
      }

      if (showThings) {
        const r = 12;
        for (const mo of things) {
          const mx = mo.x >> 16, my = mo.y >> 16;
          seg(mx - r, my, mx + r, my, C_THING);
          seg(mx, my - r, mx, my + r, C_THING);
        }
      }

      const ang = (player.angle >>> 0) / 4294967296 * Math.PI * 2;
      const ca = Math.cos(ang), sa = Math.sin(ang), size = 20;
      const px = player.x >> 16, py = player.y >> 16;
      for (const [[lx0, ly0], [lx1, ly1]] of ARROW) {
        seg(px + (lx0 * ca - ly0 * sa) * size, py + (lx0 * sa + ly0 * ca) * size,
            px + (lx1 * ca - ly1 * sa) * size, py + (lx1 * sa + ly1 * ca) * size, C_ARROW);
      }

      count = n / 5;
      gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n), gl.DYNAMIC_DRAW);
    },
    draw(): void {
      if (count === 0) return;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.LINES, 0, count);
      gl.bindVertexArray(null);
    },
  };
  return state;
}
