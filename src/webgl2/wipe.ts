// WebGL2 screen melt — the analogue of the WebGPU wipe.ts. The scene renders into
// an offscreen framebuffer; a final full-screen pass blits it to the default
// framebuffer, or — during a transition — melts a snapshot of the old screen down
// over the new one. The column state machine is shared (wipe_melt.ts) so both
// backends melt identically. Display-only; never touches the sim.

import { createProgram, dataTexture2D } from './glutil.js';
import { createMeltColumns, NCOLS, WIPE_TIC_MS } from '../wipe_melt.js';

const VS = `#version 300 es
out vec2 v_screen; // y = 0 at the top, 1 at the bottom (DOOM melt space)
void main(){
  vec2 p = vec2(gl_VertexID==1 ? 3.0 : -1.0, gl_VertexID==2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
  v_screen = vec2(p.x*0.5+0.5, 0.5 - p.y*0.5);
}`;

const FS = `#version 300 es
precision highp float;
uniform sampler2D u_scene, u_old, u_meltY;
uniform float u_melting;
in vec2 v_screen; out vec4 fragColor;
const int NCOLS = ${NCOLS};
void main(){
  vec2 sceneUV = vec2(v_screen.x, 1.0 - v_screen.y); // FBO textures are bottom-up
  if (u_melting < 0.5) { fragColor = texture(u_scene, sceneUV); return; }
  int col = int(min(float(NCOLS-1), v_screen.x*float(NCOLS)));
  float y = texelFetch(u_meltY, ivec2(col,0), 0).r; // 0..1 downward offset
  if (v_screen.y < y) fragColor = texture(u_scene, sceneUV);           // new revealed at top
  else fragColor = texture(u_old, vec2(v_screen.x, 1.0 - (v_screen.y - y))); // old slid down
}`;

export interface WebGL2Wipe {
  melting(): boolean;
  resize(w: number, h: number): void;
  /** Bind the offscreen scene target and, if a melt was requested, snapshot the
   *  previous frame as the old screen. Call at the start of beginFrame, before
   *  clearing. */
  beginScene(): void;
  request(): void;
  /** Composite the scene (melting the old screen over it) to the default
   *  framebuffer. Call after all scene/HUD passes. */
  present(dtMs: number): void;
}

export function createWebGL2Wipe(gl: WebGL2RenderingContext): WebGL2Wipe {
  const prog = createProgram(gl, VS, FS);
  const melt = createMeltColumns();
  const meltNorm = new Float32Array(NCOLS);
  const meltTex = dataTexture2D(gl, gl.R32F, gl.RED, gl.FLOAT, NCOLS, 1, meltNorm);

  let sceneFbo: WebGLFramebuffer | null = null;
  let sceneTex: WebGLTexture | null = null;
  let oldTex: WebGLTexture | null = null;
  let depthRb: WebGLRenderbuffer | null = null;
  let width = 1, height = 1;
  let pending = false, active = false, acc = 0;

  function colorTex(w: number, h: number): WebGLTexture {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function resize(w: number, h: number): void {
    width = w; height = h;
    if (sceneTex) gl.deleteTexture(sceneTex);
    if (oldTex) gl.deleteTexture(oldTex);
    if (depthRb) gl.deleteRenderbuffer(depthRb);
    if (sceneFbo) gl.deleteFramebuffer(sceneFbo);
    sceneTex = colorTex(w, h);
    oldTex = colorTex(w, h);
    depthRb = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthRb);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h);
    sceneFbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTex, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthRb);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    active = false; pending = false; // a resize invalidates any in-flight melt
  }

  return {
    melting: () => active,
    resize,
    request(): void { if (!active) { pending = true; melt.init(); } },
    beginScene(): void {
      gl.bindFramebuffer(gl.FRAMEBUFFER, sceneFbo);
      if (pending) {
        // Snapshot the previous frame (still in sceneTex) as the old screen.
        gl.bindTexture(gl.TEXTURE_2D, oldTex);
        gl.copyTexSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 0, 0, width, height);
        pending = false; active = true; acc = 0;
      }
    },
    present(dtMs: number): void {
      if (active) {
        acc += Math.min(dtMs, 250);
        while (acc >= WIPE_TIC_MS) { acc -= WIPE_TIC_MS; if (melt.step()) { active = false; break; } }
        melt.normalized(meltNorm);
        gl.bindTexture(gl.TEXTURE_2D, meltTex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, NCOLS, 1, gl.RED, gl.FLOAT, meltNorm);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(prog);
      gl.uniform1f(gl.getUniformLocation(prog, 'u_melting'), active ? 1 : 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sceneTex); gl.uniform1i(gl.getUniformLocation(prog, 'u_scene'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, oldTex); gl.uniform1i(gl.getUniformLocation(prog, 'u_old'), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, meltTex); gl.uniform1i(gl.getUniformLocation(prog, 'u_meltY'), 2);
      gl.bindVertexArray(null);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
