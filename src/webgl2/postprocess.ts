// WebGL2 post-processing — the analogue of webgpu/postprocess.ts. The scene
// renders into a G-buffer (colour + normal/depth); this runs the selected
// effect's GLSL over it before the melt.
//
// The harness is GLSL ES 3.00 with a `#define texture2D texture` shim, so the
// effect modules' `glsl` bodies (Shadertoy `mainImage`, Shadertoy uniform names)
// compile almost verbatim. iChannel0 is the scene colour; iChannelND is the DOOM
// G-buffer (normal.xyz + linear depth.w), read via iNormal0()/iDepth0().

import { createProgram } from './glutil.js';
import { EFFECTS } from '../effects/index.js';
import type { PostEffect } from '../effects/index.js';
import type { PostEffectInfo, PostProcessControl, ShaderError } from '../renderer.js';

const VS = `#version 300 es
void main(){ vec2 p=vec2(gl_VertexID==1?3.0:-1.0, gl_VertexID==2?3.0:-1.0); gl_Position=vec4(p,0.0,1.0); }`;

const FS_HEADER = `#version 300 es
precision highp float;
#define texture2D texture
uniform vec3 iResolution;
uniform float iTime;
uniform float iFrame;
uniform vec4 iMouse;
uniform sampler2D iChannel0;    // scene colour
uniform sampler2D iChannelND;   // normal.xyz + linear depth.w
out vec4 _outColor;
vec4 iColor0(vec2 uv){ return texture(iChannel0, uv); }        // == texture2D(iChannel0, uv)
vec3 iNormal0(vec2 uv){ return texture(iChannelND, uv).xyz; }
float iDepth0(vec2 uv){ return texture(iChannelND, uv).w; }    // map units
float iDepth01(vec2 uv){ return clamp(iDepth0(uv) / 20000.0, 0.0, 1.0); }   // 0 = eye, 1 = far clip
`;

const FS_FOOTER = `
void main(){ vec4 c = vec4(0.0); mainImage(c, gl_FragCoord.xy); _outColor = c; }
`;

// Lines the fragment harness prepends, to map compile-log line numbers to the editor.
const FS_HEADER_LINES = FS_HEADER.split('\n').length - 1;

interface Locs {
  iResolution: WebGLUniformLocation | null;
  iTime: WebGLUniformLocation | null;
  iFrame: WebGLUniformLocation | null;
  iMouse: WebGLUniformLocation | null;
  iChannel0: WebGLUniformLocation | null;
  iChannelND: WebGLUniformLocation | null;
}

export interface WebGL2PostProcess extends PostProcessControl {
  setInputs(colorTex: WebGLTexture, ndTex: WebGLTexture): void;
  render(targetFbo: WebGLFramebuffer | null, width: number, height: number, dtMs: number): void;
}

export type WebGL2PostProcessFactory = (gl: WebGL2RenderingContext) => WebGL2PostProcess;

export function createWebGL2PostProcess(gl: WebGL2RenderingContext): WebGL2PostProcess {
  const usable = EFFECTS.filter((e): e is PostEffect & { glsl: string } => typeof e.glsl === 'string');
  const emptyVao = gl.createVertexArray()!;

  // Compile a GLSL `mainImage` body into a program + uniform locations. Throws
  // (with the shader info log) on a compile/link error.
  const compile = (glsl: string): { prog: WebGLProgram; loc: Locs } => {
    const prog = createProgram(gl, VS, FS_HEADER + glsl + FS_FOOTER);
    const loc: Locs = {
      iResolution: gl.getUniformLocation(prog, 'iResolution'),
      iTime: gl.getUniformLocation(prog, 'iTime'),
      iFrame: gl.getUniformLocation(prog, 'iFrame'),
      iMouse: gl.getUniformLocation(prog, 'iMouse'),
      iChannel0: gl.getUniformLocation(prog, 'iChannel0'),
      iChannelND: gl.getUniformLocation(prog, 'iChannelND'),
    };
    return { prog, loc };
  };
  const progs = new Map<string, { prog: WebGLProgram; loc: Locs }>();
  const get = (name: string): { prog: WebGLProgram; loc: Locs } => {
    let p = progs.get(name);
    if (!p) {
      const eff = usable.find((e) => e.name === name) ?? usable[0];
      try {
        p = compile(eff.glsl);
      } catch (err) {
        console.warn(`post-process "${eff.name}" failed to compile — falling back to passthrough:`, err);
        p = progs.get(usable[0].name) ?? compile(usable[0].glsl);
      }
      progs.set(name, p);
    }
    return p;
  };

  let colorTex: WebGLTexture | null = null;
  let ndTex: WebGLTexture | null = null;
  let curName = usable[0].name;
  let cur = get(curName);
  let time = 0, frame = 0;
  const mouse = new Float32Array([0, 0, 0, 0]);

  const info: PostEffectInfo[] = usable.map((e) => ({
    name: e.name, author: e.author, authorUrl: e.authorUrl,
    src: e.src, license: e.license, licenseUrl: e.licenseUrl,
  }));

  return {
    effects: info,
    language: 'glsl',
    current: () => curName,
    setEffect(name: string): void {
      if (!usable.some((e) => e.name === name)) return;
      curName = name;
      cur = get(name);
    },
    setMouse(x, y, down): void { mouse[0] = x; mouse[1] = y; mouse[2] = down ? 1 : 0; },
    sourceOf: (name) => (usable.find((e) => e.name === name)?.glsl ?? usable[0].glsl).trim(),
    setCustomSource(source: string): Promise<ShaderError[]> {
      try {
        cur = compile(source);
        curName = 'custom';
        return Promise.resolve([]);
      } catch (e) {
        // ANGLE/desktop GL: "ERROR: 0:<line>: <message>". The spec doesn't mandate
        // this, so fall back to the whole log if nothing parses.
        const log = e instanceof Error ? e.message : String(e);
        const errs: ShaderError[] = [];
        const re = /ERROR:\s*\d+:(\d+):\s*(.*)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(log))) {
          errs.push({ line: Math.max(1, Number(m[1]) - FS_HEADER_LINES), col: 1, message: m[2].trim() });
        }
        return Promise.resolve(errs.length ? errs : [{ line: 1, col: 1, message: log }]);
      }
    },
    setInputs(c, nd): void { colorTex = c; ndTex = nd; },
    render(targetFbo, width, height, dtMs): void {
      time += dtMs / 1000;
      frame += 1;
      gl.bindFramebuffer(gl.FRAMEBUFFER, targetFbo);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(cur.prog);
      gl.uniform3f(cur.loc.iResolution, width, height, 1);
      gl.uniform1f(cur.loc.iTime, time);
      gl.uniform1f(cur.loc.iFrame, frame);
      gl.uniform4f(cur.loc.iMouse, mouse[0], mouse[1], mouse[2], 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, colorTex); gl.uniform1i(cur.loc.iChannel0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ndTex); gl.uniform1i(cur.loc.iChannelND, 1);
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
  };
}
