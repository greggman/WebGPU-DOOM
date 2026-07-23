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
import { PP_TEX_SIZE, PP_TEX_COUNT, generatePPTextures } from '../pptextures.js';
import { parseChannels, loadChannel, CHANNEL_TYPES, type ChannelSpec, type LoadedChannel } from '../ppchannels.js';
import type { PostEffectInfo, PostProcessControl, ShaderError } from '../renderer.js';

const VS = `#version 300 es
void main(){ vec2 p=vec2(gl_VertexID==1?3.0:-1.0, gl_VertexID==2?3.0:-1.0); gl_Position=vec4(p,0.0,1.0); }`;

const FS_HEADER = `#version 300 es
precision highp float;
precision highp sampler2DArray;
precision highp sampler3D;
#define texture2D texture
uniform vec3 iResolution;
uniform float iTime;
uniform float iFrame;
uniform vec4 iMouse;
uniform sampler2D iChannel0;    // scene colour
uniform sampler2D iChannelND;   // normal.xyz + linear depth.w
uniform vec3 iCamPos;
uniform vec3 iCamRight;
uniform vec3 iCamUp;
uniform vec3 iCamFwd;
uniform float iTanHalfFovX;
uniform float iTanHalfFovY;
uniform highp sampler2DArray iChannels;   // built-in noise/pattern library (repeat + mipmap)
out vec4 _outColor;
const int iNoiseRGBA = 0;   // uncorrelated per-texel rgba white noise
const int iNoiseValue = 1;  // smooth grey value noise
const int iBlueNoise = 2;   // approximate blue noise (dither)
const int iCrosshatch = 3;  // cross-hatch tonal-art-map (ink where luma < texel)
vec4 iChan(int layer, vec2 uv){ return texture(iChannels, vec3(uv, float(layer))); }
vec4 iColor0(vec2 uv){ return texture(iChannel0, uv); }        // == texture2D(iChannel0, uv)
vec3 iNormal0(vec2 uv){ return texture(iChannelND, uv).xyz; }
// 1 on billboard sprites (enemies, items), 0 on world geometry. Sprite normals
// are stored at length 2, world normals at length 1; iNormal0 callers normalize.
float iSprite(vec2 uv){ return step(1.5, length(texture(iChannelND, uv).xyz)); }
float iDepth0(vec2 uv){ return texture(iChannelND, uv).w; }    // map units
float iDepth01(vec2 uv){ return clamp(iDepth0(uv) / 20000.0, 0.0, 1.0); }   // 0 = eye, 1 = far clip
// World-space position of the surface at uv, reconstructed from linear depth +
// the camera basis (Y up). Meaningless on sky (no geometry) or UI (depth ~0).
vec3 iWorldPos(vec2 uv){
  float d = iDepth0(uv);
  vec2 ndc = vec2(uv.x * 2.0 - 1.0, uv.y * 2.0 - 1.0);
  return iCamPos + d * (iCamFwd + iCamRight * (ndc.x * iTanHalfFovX) + iCamUp * (ndc.y * iTanHalfFovY));
}
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
  iChannels: WebGLUniformLocation | null;
  iCamPos: WebGLUniformLocation | null;
  iCamRight: WebGLUniformLocation | null;
  iCamUp: WebGLUniformLocation | null;
  iCamFwd: WebGLUniformLocation | null;
  iTanHalfFovX: WebGLUniformLocation | null;
  iTanHalfFovY: WebGLUniformLocation | null;
}

export interface WebGL2PostProcess extends PostProcessControl {
  setInputs(colorTex: WebGLTexture, ndTex: WebGLTexture): void;
  render(targetFbo: WebGLFramebuffer | null, width: number, height: number, dtMs: number): void;
}

export type WebGL2PostProcessFactory = (gl: WebGL2RenderingContext) => WebGL2PostProcess;

export function createWebGL2PostProcess(gl: WebGL2RenderingContext): WebGL2PostProcess {
  const usable = EFFECTS.filter((e): e is PostEffect & { glsl: string } => typeof e.glsl === 'string');
  const emptyVao = gl.createVertexArray()!;

  // Built-in texture library: a mip-mapped, repeat-wrapped 2D array of procedural
  // noise/pattern layers, uploaded once and bound to texture unit 2 (iChannels).
  const libTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, libTex);
  const libData = new Uint8Array(PP_TEX_SIZE * PP_TEX_SIZE * 4 * PP_TEX_COUNT);
  generatePPTextures().forEach((layer, i) => libData.set(layer, i * PP_TEX_SIZE * PP_TEX_SIZE * 4));
  gl.texImage3D(gl.TEXTURE_2D_ARRAY, 0, gl.RGBA8, PP_TEX_SIZE, PP_TEX_SIZE, PP_TEX_COUNT, 0, gl.RGBA, gl.UNSIGNED_BYTE, libData);
  gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_WRAP_T, gl.REPEAT);

  // Compile a GLSL `mainImage` body into a program + uniform locations. Throws
  // (with the shader info log) on a compile/link error.
  // 1x1 black placeholders per target, bound while a channel is still loading.
  const CUBE_FACES = [
    gl.TEXTURE_CUBE_MAP_POSITIVE_X, gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Y, gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
    gl.TEXTURE_CUBE_MAP_POSITIVE_Z, gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
  ];
  const placeholder: Record<string, WebGLTexture> = {};
  for (const kind of ['2d', 'array', 'cube', '3d'] as const) {
    const target = gl[CHANNEL_TYPES[kind].glTarget];
    const t = gl.createTexture()!;
    gl.bindTexture(target, t);
    const black = new Uint8Array([0, 0, 0, 255]);
    if (kind === '2d') gl.texImage2D(target, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black);
    else if (kind === 'cube') for (const f of CUBE_FACES) gl.texImage2D(f, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black);
    else gl.texImage3D(target, 0, gl.RGBA8, 1, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, black);
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    placeholder[kind] = t;
  }

  const concat = (imgs: Uint8Array[]): Uint8Array => {
    const out = new Uint8Array(imgs.reduce((n, a) => n + a.length, 0));
    let o = 0; for (const a of imgs) { out.set(a, o); o += a.length; }
    return out;
  };
  // Upload a loaded channel into a GL texture of the matching target.
  const uploadGL = (l: LoadedChannel): WebGLTexture => {
    const kind = l.spec.kind, target = gl[CHANNEL_TYPES[kind].glTarget];
    const tex = gl.createTexture()!;
    gl.bindTexture(target, tex);
    const { width: w, height: h, images } = l;
    if (kind === '2d' && l.spec.explicitMips) {
      images.forEach((px, lvl) => gl.texImage2D(target, lvl, gl.RGBA8, Math.max(1, w >> lvl), Math.max(1, h >> lvl), 0, gl.RGBA, gl.UNSIGNED_BYTE, px));
      gl.texParameteri(target, gl.TEXTURE_MAX_LEVEL, images.length - 1);
    } else if (kind === '2d') {
      gl.texImage2D(target, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, images[0]);
      gl.generateMipmap(target);
    } else if (kind === 'cube') {
      images.forEach((px, f) => gl.texImage2D(CUBE_FACES[f], 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, px));
      gl.generateMipmap(target);
    } else { // array | 3d
      gl.texImage3D(target, 0, gl.RGBA8, w, h, images.length, 0, gl.RGBA, gl.UNSIGNED_BYTE, concat(images));
      gl.generateMipmap(target);
    }
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const wrap = kind === 'cube' ? gl.CLAMP_TO_EDGE : gl.REPEAT;
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, wrap);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, wrap);
    return tex;
  };

  interface ChannelBind { spec: ChannelSpec; loc: WebGLUniformLocation | null; tex: WebGLTexture | null; error?: string; load: Promise<void>; }
  interface Prog { prog: WebGLProgram; loc: Locs; channels: ChannelBind[]; headerLines: number; parseErrs: { line: number; message: string }[]; }

  const compile = (glsl: string): Prog => {
    const { specs, errors: parseErrs } = parseChannels(glsl);
    const decls = specs.map((s) => `uniform ${CHANNEL_TYPES[s.kind].glsl} iChannel${s.index};`).join('\n');
    const headerLines = FS_HEADER_LINES + (decls ? decls.split('\n').length : 0);
    let prog: WebGLProgram;
    try { prog = createProgram(gl, VS, FS_HEADER + (decls ? decls + '\n' : '') + glsl + FS_FOOTER); }
    catch (e) { (e as Error & { headerLines?: number }).headerLines = headerLines; throw e; }
    const loc: Locs = {
      iResolution: gl.getUniformLocation(prog, 'iResolution'),
      iTime: gl.getUniformLocation(prog, 'iTime'),
      iFrame: gl.getUniformLocation(prog, 'iFrame'),
      iMouse: gl.getUniformLocation(prog, 'iMouse'),
      iChannel0: gl.getUniformLocation(prog, 'iChannel0'),
      iChannelND: gl.getUniformLocation(prog, 'iChannelND'),
      iChannels: gl.getUniformLocation(prog, 'iChannels'),
      iCamPos: gl.getUniformLocation(prog, 'iCamPos'),
      iCamRight: gl.getUniformLocation(prog, 'iCamRight'),
      iCamUp: gl.getUniformLocation(prog, 'iCamUp'),
      iCamFwd: gl.getUniformLocation(prog, 'iCamFwd'),
      iTanHalfFovX: gl.getUniformLocation(prog, 'iTanHalfFovX'),
      iTanHalfFovY: gl.getUniformLocation(prog, 'iTanHalfFovY'),
    };
    const channels: ChannelBind[] = specs.map((s) => {
      const cb: ChannelBind = { spec: s, loc: gl.getUniformLocation(prog, `iChannel${s.index}`), tex: null, load: Promise.resolve() };
      cb.load = loadChannel(s).then((l) => { cb.tex = uploadGL(l); }).catch((e: Error) => { cb.error = e.message; console.warn(e.message); });
      return cb;
    });
    return { prog, loc, channels, headerLines, parseErrs };
  };
  const progs = new Map<string, Prog>();
  const get = (name: string): Prog => {
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
  // camPos(3), right(3), up(3), fwd(3), tanX, tanY
  const cam = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, -1, 1, 1]);

  const info: PostEffectInfo[] = usable.map((e) => ({
    name: e.name, author: e.author, authorUrl: e.authorUrl,
    src: e.src, license: e.license, licenseUrl: e.licenseUrl, hidden: e.hidden,
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
    setCamera(pos, right, up, fwd, tanX, tanY): void {
      cam[0] = pos[0]; cam[1] = pos[1]; cam[2] = pos[2];
      cam[3] = right[0]; cam[4] = right[1]; cam[5] = right[2];
      cam[6] = up[0]; cam[7] = up[1]; cam[8] = up[2];
      cam[9] = fwd[0]; cam[10] = fwd[1]; cam[11] = fwd[2];
      cam[12] = tanX; cam[13] = tanY;
    },
    sourceOf: (name) => (usable.find((e) => e.name === name)?.glsl ?? usable[0].glsl).trim(),
    async setCustomSource(source: string): Promise<ShaderError[]> {
      let p: Prog;
      try {
        p = compile(source);
      } catch (e) {
        // ANGLE/desktop GL: "ERROR: 0:<line>: <message>". The spec doesn't mandate
        // this, so fall back to the whole log if nothing parses.
        const err = e as Error & { headerLines?: number };
        const hl = err.headerLines ?? FS_HEADER_LINES;
        const log = err.message ?? String(e);
        const errs: ShaderError[] = [];
        const re = /ERROR:\s*\d+:(\d+):\s*(.*)/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(log))) {
          errs.push({ line: Math.max(1, Number(m[1]) - hl), col: 1, message: m[2].trim() });
        }
        return errs.length ? errs : [{ line: 1, col: 1, message: log }];
      }
      cur = p; curName = 'custom';
      // Compile succeeded; wait for the channel textures and report load failures.
      await Promise.all(p.channels.map((c) => c.load));
      return [
        ...p.parseErrs.map((e) => ({ line: e.line, col: 1, message: e.message, kind: 'resource' as const })),
        ...p.channels.filter((c) => c.error).map((c) => ({ line: c.spec.line, col: 1, message: c.error!, kind: 'resource' as const })),
      ];
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
      gl.uniform3f(cur.loc.iCamPos, cam[0], cam[1], cam[2]);
      gl.uniform3f(cur.loc.iCamRight, cam[3], cam[4], cam[5]);
      gl.uniform3f(cur.loc.iCamUp, cam[6], cam[7], cam[8]);
      gl.uniform3f(cur.loc.iCamFwd, cam[9], cam[10], cam[11]);
      gl.uniform1f(cur.loc.iTanHalfFovX, cam[12]);
      gl.uniform1f(cur.loc.iTanHalfFovY, cam[13]);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, colorTex); gl.uniform1i(cur.loc.iChannel0, 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, ndTex); gl.uniform1i(cur.loc.iChannelND, 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D_ARRAY, libTex); gl.uniform1i(cur.loc.iChannels, 2);
      // User channels (iChannel1..N) on units 3+; placeholder until loaded.
      cur.channels.forEach((c, i) => {
        const unit = 3 + i, target = gl[CHANNEL_TYPES[c.spec.kind].glTarget];
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(target, c.tex ?? placeholder[c.spec.kind]);
        gl.uniform1i(c.loc, unit);
      });
      gl.bindVertexArray(emptyVao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
  };
}
