// WebGL2 implementation of the Renderer seam — the analogue of webgpu/backend.ts.
// Owns the GL context, the shared indexed-colour textures (atlas, per-layer
// info, PLAYPAL, COLORMAP, live sector light, animation redirect), and the four
// passes (world, sky, sprites, HUD), each a GLSL ES 3.0 port of its WGSL, plus
// the screen melt (wipe.ts) and automap (automap.ts). When a post-process factory
// is supplied the scene renders into a G-buffer (colour + normal/depth) and the
// filter (postprocess.ts) runs before the melt — mirroring the WebGPU backend.

import { createProgram, dataTexture2D } from './glutil.js';
import { createWebGL2Wipe } from './wipe.js';
import { createAutomap } from './automap.js';
import type { WebGL2PostProcessFactory } from './postprocess.js';
import { decodePatch, type IndexedImage } from '../patch.js';
import { spriteTextures } from '../things.js';
import { initSpriteDefs } from '../sprites.js';
import { statusBarLumps, weaponSpriteLumps, fontLumps } from '../st_stuff.js';
import { menuLumps } from '../m_menu.js';
import { wiLumps } from '../wi_stuff.js';
import type { Wad } from '../wad.js';
import type { Texture } from '../textures.js';
import type { LevelGeometry } from '../level.js';
import type { Renderer } from '../renderer.js';
import type { Quad } from '../hud2d.js';

// ---- shaders --------------------------------------------------------------

// The scene passes optionally write a 2nd MRT target (normal.xyz + linear depth.w)
// for the post-process G-buffer, exactly like the WebGPU passes. `gb` off yields
// the original single-output shaders so the plain page is unchanged.
const gbDecl = (gb: boolean): string =>
  gb ? 'layout(location=0) out vec4 fragColor; layout(location=1) out vec4 o_nd;' : 'out vec4 fragColor;';

const WORLD_VS = (gb: boolean): string => `#version 300 es
layout(location=0) in vec3 a_pos; layout(location=1) in vec2 a_uv;
layout(location=2) in float a_sector; layout(location=3) in float a_layer;
uniform mat4 u_mvp;
out vec2 v_uv; flat out int v_sector; out float v_depth; flat out int v_layer;
${gb ? 'out vec3 v_wpos;' : ''}
void main(){ vec4 c=u_mvp*vec4(a_pos,1.0); gl_Position=c; v_uv=a_uv; v_sector=int(a_sector); v_depth=c.w; v_layer=int(a_layer); ${gb ? 'v_wpos=a_pos;' : ''} }`;

const WORLD_FS = (gb: boolean): string => `#version 300 es
precision highp float; precision highp int; precision highp usampler2DArray; precision highp usampler2D;
uniform highp usampler2DArray u_atlas; uniform sampler2D u_texInfo; uniform highp usampler2D u_texTrans;
uniform sampler2D u_sectorLight; uniform highp usampler2D u_colormap; uniform sampler2D u_palette;
uniform int u_fixedMap; uniform int u_paletteRow; uniform float u_extralight;
in vec2 v_uv; flat in int v_sector; in float v_depth; flat in int v_layer; ${gbDecl(gb)}
${gb ? 'in vec3 v_wpos;' : ''}
void main(){
  ${gb ? 'vec3 nrm = normalize(cross(dFdx(v_wpos), dFdy(v_wpos)));' : ''}
  int L=int(texelFetch(u_texTrans,ivec2(v_layer,0),0).r);
  vec2 sz=texelFetch(u_texInfo,ivec2(L,0),0).xy;
  ivec2 texel=ivec2(fract(v_uv)*sz);
  uvec2 idx=texelFetch(u_atlas,ivec3(texel,L),0).rg;
  if(idx.g==0u) discard;
  int row;
  if(u_fixedMap>=0){ row=u_fixedMap; }
  else { float light=texelFetch(u_sectorLight,ivec2(v_sector,0),0).r;
    float li=clamp(floor(light/16.0),0.0,15.0);
    row=int(clamp((15.0-li)*4.0 + clamp(v_depth*(12.0/1024.0),0.0,12.0) - 12.0 - u_extralight*8.0,0.0,31.0)); }
  uint remap=texelFetch(u_colormap,ivec2(int(idx.r),row),0).r;
  fragColor=vec4(texelFetch(u_palette,ivec2(int(remap),u_paletteRow),0).rgb,1.0);
  ${gb ? 'o_nd = vec4(nrm, v_depth);' : ''}
}`;

const SKY_VS = `#version 300 es
out vec2 v_ndc;
void main(){ vec2 p=vec2(gl_VertexID==1?3.0:-1.0, gl_VertexID==2?3.0:-1.0); v_ndc=p; gl_Position=vec4(p,0.0,1.0); }`;

const SKY_FS = (gb: boolean): string => `#version 300 es
precision highp float; precision highp int; precision highp usampler2DArray;
uniform vec3 u_right,u_up,u_forward; uniform float u_tanHalf,u_aspect; uniform int u_skyLayer;
uniform highp usampler2DArray u_atlas; uniform sampler2D u_texInfo; uniform sampler2D u_palette;
in vec2 v_ndc; ${gbDecl(gb)} const float PI=3.14159265359;
void main(){
  vec3 dir=normalize(u_forward + u_right*(v_ndc.x*u_tanHalf*u_aspect) + u_up*(v_ndc.y*u_tanHalf));
  vec2 sz=texelFetch(u_texInfo,ivec2(u_skyLayer,0),0).xy;
  float uu=fract(atan(-dir.z,dir.x)/(2.0*PI)*4.0);
  float vv=clamp((100.0-dir.y*128.0)/128.0,0.0,1.0);
  uvec2 idx=texelFetch(u_atlas,ivec3(ivec2(vec2(uu,vv)*sz),u_skyLayer),0).rg;
  fragColor=vec4(texelFetch(u_palette,ivec2(int(idx.r),0),0).rgb,1.0);
  ${gb ? 'o_nd = vec4(0.0, 0.0, 0.0, 20000.0);' : ''}
}`;

const SPRITE_VS = (gb: boolean): string => `#version 300 es
precision highp float;
layout(location=0) in vec3 a_pos; layout(location=1) in float a_layer;
layout(location=2) in float a_flip; layout(location=3) in float a_light;
uniform mat4 u_mvp; uniform vec3 u_camRight; uniform sampler2D u_texInfo;
out vec2 v_uv; flat out float v_light; out float v_depth; flat out int v_layer; flat out int v_shadow;
${gb ? 'flat out vec3 v_nrm;' : ''}
void main(){
  vec4 info=texelFetch(u_texInfo,ivec2(int(a_layer),0),0);
  vec2 size=info.xy; float leftOff=info.z, topOff=info.w;
  float lift=max(0.0,size.y-topOff);
  float top=a_pos.y+topOff+lift, bottom=top-size.y, left=-leftOff, right=left+size.x;
  ivec2 corners[6]=ivec2[6](ivec2(0,0),ivec2(1,0),ivec2(1,1),ivec2(0,0),ivec2(1,1),ivec2(0,1));
  ivec2 cs=corners[gl_VertexID];
  int flags=int(a_flip);
  vec2 uv=vec2(float(cs.x),float(cs.y));
  if((flags&1)!=0) uv.x=1.0-uv.x;
  float x=cs.x==1?right:left; float y=cs.y==1?bottom:top;
  vec3 world=vec3(a_pos.x,0.0,a_pos.z)+u_camRight*x+vec3(0.0,y,0.0);
  vec4 c=u_mvp*vec4(world,1.0); gl_Position=c;
  v_uv=uv; v_light=a_light; v_depth=c.w; v_layer=int(a_layer); v_shadow=(flags>>1)&1;
  ${gb ? 'v_nrm=2.0*normalize(cross(u_camRight, vec3(0.0,1.0,0.0)));' : ''}  // length 2 flags sprites (iSprite)
}`;

const SPRITE_FS = (gb: boolean): string => `#version 300 es
precision highp float; precision highp int; precision highp usampler2DArray; precision highp usampler2D;
uniform highp usampler2DArray u_atlas; uniform sampler2D u_texInfo; uniform highp usampler2D u_colormap;
uniform sampler2D u_palette; uniform int u_fixedMap; uniform int u_paletteRow; uniform float u_extralight;
in vec2 v_uv; flat in float v_light; in float v_depth; flat in int v_layer; flat in int v_shadow; ${gbDecl(gb)}
${gb ? 'flat in vec3 v_nrm;' : ''}
void main(){
  vec2 size=texelFetch(u_texInfo,ivec2(v_layer,0),0).xy;
  ivec2 texel=ivec2(clamp(v_uv*size,vec2(0.0),size-vec2(1.0)));
  uvec2 idx=texelFetch(u_atlas,ivec3(texel,v_layer),0).rg;
  if(idx.g==0u) discard;
  int row;
  if(u_fixedMap>=0) row=u_fixedMap;
  else if(v_light<0.0) row=0;
  else row=int(clamp((15.0-v_light)*4.0 + clamp(v_depth*(12.0/1024.0),0.0,12.0) - 12.0 - u_extralight*8.0,0.0,31.0));
  if(v_shadow!=0){
    int dark=min(row+12,31);
    uint remap=texelFetch(u_colormap,ivec2(int(idx.r),dark),0).r;
    vec3 rgb=texelFetch(u_palette,ivec2(int(remap),u_paletteRow),0).rgb;
    ivec2 p=ivec2(gl_FragCoord.xy);
    float shimmer=((p.x+p.y)&1)==0?0.18:0.0;
    fragColor=vec4(rgb,0.34+shimmer); ${gb ? 'o_nd=vec4(v_nrm, v_depth);' : ''} return;
  }
  uint remap=texelFetch(u_colormap,ivec2(int(idx.r),row),0).r;
  fragColor=vec4(texelFetch(u_palette,ivec2(int(remap),u_paletteRow),0).rgb,1.0);
  ${gb ? 'o_nd=vec4(v_nrm, v_depth);' : ''}
}`;

const HUD_VS = `#version 300 es
precision highp float;
layout(location=0) in vec4 a_rect; layout(location=1) in float a_layer; layout(location=2) in float a_palRow;
out vec2 v_uv; flat out int v_layer; flat out int v_palRow;
void main(){
  vec2 corners[6]=vec2[6](vec2(0,0),vec2(1,0),vec2(1,1),vec2(0,0),vec2(1,1),vec2(0,1));
  vec2 corner=corners[gl_VertexID];
  vec2 px=a_rect.xy+corner*a_rect.zw;
  gl_Position=vec4(px.x/320.0*2.0-1.0, 1.0-px.y/200.0*2.0, 0.0, 1.0);
  v_uv=corner; v_layer=int(a_layer); v_palRow=int(a_palRow);
}`;

const HUD_FS = (gb: boolean): string => `#version 300 es
precision highp float; precision highp int; precision highp usampler2DArray;
uniform highp usampler2DArray u_atlas; uniform sampler2D u_sizes; uniform sampler2D u_palette;
in vec2 v_uv; flat in int v_layer; flat in int v_palRow; ${gbDecl(gb)}
void main(){
  vec2 size=texelFetch(u_sizes,ivec2(v_layer,0),0).xy;
  uvec2 idx=texelFetch(u_atlas,ivec3(ivec2(v_uv*size),v_layer),0).rg;
  if(idx.g==0u) discard;
  fragColor=vec4(texelFetch(u_palette,ivec2(int(idx.r),v_palRow),0).rgb,1.0);
  ${gb ? 'o_nd=vec4(0.0,0.0,0.0,0.0);' : ''}
}`;

// ---- backend --------------------------------------------------------------

export function createWebGL2Backend(
  canvas: HTMLCanvasElement,
  wad: Wad,
  opts: { postProcessFactory?: WebGL2PostProcessFactory } = {},
): Renderer {
  const gl: WebGL2RenderingContext = canvas.getContext('webgl2', { antialias: false, alpha: false })
    ?? (() => { throw new Error('WebGL2 not available in this browser'); })();

  // Post-process: scene renders into a G-buffer (colour + normal/depth); the
  // filter runs before the melt. Needs float render targets (RGBA16F).
  const gb = !!opts.postProcessFactory;
  if (gb && !gl.getExtension('EXT_color_buffer_float')) {
    console.warn('EXT_color_buffer_float unavailable — post-process G-buffer may fail');
  }
  // Per-draw-buffer blend control. WebGL2's global BLEND enable would blend the
  // sprite pass's normal/depth MRT target too (depth is that target's .a, so
  // SRC_ALPHA blending corrupts it); this lets us blend only the colour target.
  const drawBuffersIndexed = gb ? gl.getExtension('OES_draw_buffers_indexed') : null;

  // Every atlas is tightly packed with no per-row padding. The default
  // UNPACK_ALIGNMENT of 4 would corrupt any RG8UI patch of odd width (row =
  // 2*odd bytes, not a multiple of 4): the upload shifts 2 bytes per row and the
  // layer reads back blank. That blanks odd-width sprites (green armour, the
  // flickering monster frames), odd-width menu patches, and narrow font glyphs
  // like "1". WebGPU is immune because writeTexture takes an explicit bytesPerRow.
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  const playpal = wad.lump('PLAYPAL'), colormap = wad.lump('COLORMAP');
  const palRows = Math.floor(playpal.length / (256 * 3));
  const rgba = new Uint8Array(256 * palRows * 4);
  for (let i = 0; i < 256 * palRows; i++) { rgba[i * 4] = playpal[i * 3]; rgba[i * 4 + 1] = playpal[i * 3 + 1]; rgba[i * 4 + 2] = playpal[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
  const palTex = dataTexture2D(gl, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, 256, palRows, rgba);
  const cmapRows = Math.floor(colormap.length / 256);
  const cmapTex = dataTexture2D(gl, gl.R8UI, gl.RED_INTEGER, gl.UNSIGNED_BYTE, 256, cmapRows, colormap.subarray(0, 256 * cmapRows));

  const worldProg = createProgram(gl, WORLD_VS(gb), WORLD_FS(gb));
  const skyProg = createProgram(gl, SKY_VS, SKY_FS(gb));
  const spriteProg = createProgram(gl, SPRITE_VS(gb), SPRITE_FS(gb));
  const hudProg = createProgram(gl, HUD_VS, HUD_FS(gb));
  const U = (p: WebGLProgram, n: string): WebGLUniformLocation | null => gl.getUniformLocation(p, n);

  const wipe = createWebGL2Wipe(gl);
  const automapCtl = createAutomap(gl);
  const postprocess = opts.postProcessFactory ? opts.postProcessFactory(gl) : null;

  // Sprites: shared for every level, decode once (same as the WebGPU backend).
  const sprTex = spriteTextures(wad, initSpriteDefs(wad));
  const sprIndex = new Map<string, number>();
  for (let i = 0; i < sprTex.length; i++) sprIndex.set(sprTex[i].name, i);

  // The world's globals, reused by the sprite pass (same mvp/tint/depth).
  let lastMvp: Float32Array = new Float32Array(16);
  let lastPalRow = 0, lastFixed = -1, lastExtra = 0;

  // HUD atlas: decode every UI patch into its own 2D array.
  const hudNames = ['TITLEPIC', 'CREDIT', ...statusBarLumps(), ...weaponSpriteLumps(), ...menuLumps(), ...fontLumps(), ...wiLumps()]
    .filter((n) => wad.checkNumForName(n) >= 0);
  const patchOf = new Map<string, IndexedImage>();
  const hudLayerOf = new Map<string, number>();
  { let hw = 1, hh = 1;
    const imgs = hudNames.map((n) => { const img = decodePatch(wad.lump(n)); hw = Math.max(hw, img.width); hh = Math.max(hh, img.height); return { n, img }; });
    const hudAtlas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, hudAtlas);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RG8UI, hw, hh, imgs.length);
    const sizes = new Float32Array(imgs.length * 4);
    for (let i = 0; i < imgs.length; i++) {
      const { n, img } = imgs[i]; patchOf.set(n, img); hudLayerOf.set(n, i);
      sizes[i * 4] = img.width; sizes[i * 4 + 1] = img.height;
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, img.width, img.height, 1, gl.RG_INTEGER, gl.UNSIGNED_BYTE, img.data);
    }
    var hudAtlasTex = hudAtlas, hudSizesTex = dataTexture2D(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, imgs.length, 1, sizes);
  }

  // Per-level GPU set + per-frame state.
  let atlas: WebGLTexture | null = null, texInfo: WebGLTexture | null = null;
  let sectorLightTex: WebGLTexture | null = null, texTransTex: WebGLTexture | null = null;
  let worldVao: WebGLVertexArrayObject | null = null, worldVbo: WebGLBuffer | null = null;
  let vertexCount = 0, layerCount = 0, sectorCount = 0, spriteLayerOffset = 0;
  let width = 0, height = 0;

  // Post-process G-buffer: colour + normal/depth, both sampled by the filter.
  let gFbo: WebGLFramebuffer | null = null;
  let gColorTex: WebGLTexture | null = null, gNdTex: WebGLTexture | null = null, gDepthRb: WebGLRenderbuffer | null = null;

  const emptyVao = gl.createVertexArray()!;
  const spriteVao = gl.createVertexArray()!;
  const spriteVbo = gl.createBuffer()!;
  const hudVao = gl.createVertexArray()!;
  const hudVbo = gl.createBuffer()!;

  function makeColorTex(internal: number, format: number, type: number): WebGLTexture {
    const t = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, internal, width, height, 0, format, type, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    wipe.resize(width, height);
    if (postprocess) {
      if (gColorTex) gl.deleteTexture(gColorTex);
      if (gNdTex) gl.deleteTexture(gNdTex);
      if (gDepthRb) gl.deleteRenderbuffer(gDepthRb);
      if (gFbo) gl.deleteFramebuffer(gFbo);
      gColorTex = makeColorTex(gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);
      gNdTex = makeColorTex(gl.RGBA16F, gl.RGBA, gl.HALF_FLOAT);
      gDepthRb = gl.createRenderbuffer();
      gl.bindRenderbuffer(gl.RENDERBUFFER, gDepthRb);
      gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, width, height);
      gFbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, gFbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gColorTex, 0);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, gNdTex, 0);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, gDepthRb);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      postprocess.setInputs(gColorTex, gNdTex);
    }
  }

  function makeAtlas(textures: Texture[]): void {
    let maxW = 1, maxH = 1;
    for (const t of textures) { maxW = Math.max(maxW, t.width); maxH = Math.max(maxH, t.height); }
    if (atlas) gl.deleteTexture(atlas);
    atlas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas);
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RG8UI, maxW, maxH, textures.length);
    const info = new Float32Array(textures.length * 4);
    for (let i = 0; i < textures.length; i++) {
      const t = textures[i];
      info[i * 4] = t.width; info[i * 4 + 1] = t.height; info[i * 4 + 2] = t.leftOffset; info[i * 4 + 3] = t.topOffset;
      gl.texSubImage3D(gl.TEXTURE_2D_ARRAY, 0, 0, 0, i, t.width, t.height, 1, gl.RG_INTEGER, gl.UNSIGNED_BYTE, t.data);
    }
    if (texInfo) gl.deleteTexture(texInfo);
    texInfo = dataTexture2D(gl, gl.RGBA32F, gl.RGBA, gl.FLOAT, textures.length, 1, info);
  }

  function bindWorldTextures(prog: WebGLProgram): void {
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas); gl.uniform1i(U(prog, 'u_atlas'), 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texInfo); gl.uniform1i(U(prog, 'u_texInfo'), 1);
    gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, cmapTex); gl.uniform1i(U(prog, 'u_colormap'), 4);
    gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, palTex); gl.uniform1i(U(prog, 'u_palette'), 5);
  }

  resize();

  return {
    patchOf,
    get width() { return width; },
    get height() { return height; },
    automap: automapCtl,
    postProcess: postprocess ?? undefined,
    spriteLayerOf(name) { const i = sprIndex.get(name); return i === undefined ? undefined : spriteLayerOffset + i; },
    resize,
    setLevel(geo, sectors) {
      sectorCount = sectors; layerCount = geo.textures.length; spriteLayerOffset = geo.textures.length;
      vertexCount = geo.count;
      makeAtlas([...geo.textures, ...sprTex]);
      if (!worldVao) { worldVao = gl.createVertexArray(); worldVbo = gl.createBuffer(); }
      gl.bindVertexArray(worldVao); gl.bindBuffer(gl.ARRAY_BUFFER, worldVbo);
      gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12);
      gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 28, 20);
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 28, 24);
      gl.bindVertexArray(null);
      const trans = new Uint32Array(layerCount); for (let i = 0; i < layerCount; i++) trans[i] = i;
      if (texTransTex) gl.deleteTexture(texTransTex);
      texTransTex = dataTexture2D(gl, gl.R32UI, gl.RED_INTEGER, gl.UNSIGNED_INT, layerCount, 1, trans);
      if (sectorLightTex) gl.deleteTexture(sectorLightTex);
      sectorLightTex = dataTexture2D(gl, gl.R32F, gl.RED, gl.FLOAT, sectorCount, 1, new Float32Array(sectorCount));
    },
    updateGeometry(geo) {
      vertexCount = geo.count;
      gl.bindVertexArray(worldVao); gl.bindBuffer(gl.ARRAY_BUFFER, worldVbo);
      gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW); gl.bindVertexArray(null);
    },
    isMelting: () => wipe.melting(),
    requestWipe: () => wipe.request(),
    beginFrame(clearMagenta) {
      if (postprocess) {
        // Snapshot the old screen (prev filter output) then render the scene into
        // the G-buffer instead of the melt target.
        wipe.capture();
        gl.bindFramebuffer(gl.FRAMEBUFFER, gFbo);
        gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      } else {
        wipe.beginScene(); // binds the offscreen target + snapshots the old screen
      }
      gl.viewport(0, 0, width, height);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
      if (postprocess) {
        // Colour: magenta/black; normal/depth: zero normal, far depth.
        gl.clearBufferfv(gl.COLOR, 0, [clearMagenta ? 1 : 0, 0, clearMagenta ? 1 : 0, 1]);
        gl.clearBufferfv(gl.COLOR, 1, [0, 0, 0, 20000]);
        gl.clearBufferfv(gl.DEPTH, 0, [1]);
      } else {
        gl.clearColor(clearMagenta ? 1 : 0, 0, clearMagenta ? 1 : 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      }
    },
    hudBeginFrame: () => {},
    drawSky(right, up, forward, tanHalfY, aspect, skyLayer) {
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(skyProg);
      gl.uniform3fv(U(skyProg, 'u_right'), right); gl.uniform3fv(U(skyProg, 'u_up'), up); gl.uniform3fv(U(skyProg, 'u_forward'), forward);
      gl.uniform1f(U(skyProg, 'u_tanHalf'), tanHalfY); gl.uniform1f(U(skyProg, 'u_aspect'), aspect); gl.uniform1i(U(skyProg, 'u_skyLayer'), skyLayer);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas); gl.uniform1i(U(skyProg, 'u_atlas'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texInfo); gl.uniform1i(U(skyProg, 'u_texInfo'), 1);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, palTex); gl.uniform1i(U(skyProg, 'u_palette'), 5);
      gl.bindVertexArray(emptyVao); gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    drawWorld(mvp, paletteRow, fixedMap, extralight, sectorLight, texTrans) {
      gl.bindTexture(gl.TEXTURE_2D, sectorLightTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, sectorCount, 1, gl.RED, gl.FLOAT, sectorLight);
      gl.bindTexture(gl.TEXTURE_2D, texTransTex); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, layerCount, 1, gl.RED_INTEGER, gl.UNSIGNED_INT, texTrans);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LESS); gl.depthMask(true); gl.disable(gl.BLEND);
      gl.useProgram(worldProg);
      gl.uniformMatrix4fv(U(worldProg, 'u_mvp'), false, mvp);
      gl.uniform1i(U(worldProg, 'u_fixedMap'), fixedMap); gl.uniform1i(U(worldProg, 'u_paletteRow'), paletteRow); gl.uniform1f(U(worldProg, 'u_extralight'), extralight);
      bindWorldTextures(worldProg);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, texTransTex); gl.uniform1i(U(worldProg, 'u_texTrans'), 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, sectorLightTex); gl.uniform1i(U(worldProg, 'u_sectorLight'), 3);
      gl.bindVertexArray(worldVao); gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
      lastMvp = mvp; lastPalRow = paletteRow; lastFixed = fixedMap; lastExtra = extralight;
    },
    drawSprites(inst, count, cameraRight) {
      if (count <= 0) return;
      gl.bindVertexArray(spriteVao); gl.bindBuffer(gl.ARRAY_BUFFER, spriteVbo);
      gl.bufferData(gl.ARRAY_BUFFER, inst.subarray(0, count * 6), gl.DYNAMIC_DRAW);
      for (let i = 0; i < 4; i++) { gl.enableVertexAttribArray(i); gl.vertexAttribDivisor(i, 1); }
      gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0);
      gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 12);
      gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 24, 16);
      gl.vertexAttribPointer(3, 1, gl.FLOAT, false, 24, 20);
      gl.enable(gl.DEPTH_TEST); gl.depthMask(true);
      if (drawBuffersIndexed) {
        // Blend the colour target (0) for spectre-fuzz translucency; leave the
        // normal/depth target (1) unblended so its depth stays intact.
        drawBuffersIndexed.enableiOES(gl.BLEND, 0);
        drawBuffersIndexed.disableiOES(gl.BLEND, 1);
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      } else if (gb) {
        // No per-buffer blend: keep depth/normal correct by drawing opaque (fuzz
        // sprites lose translucency).
        gl.disable(gl.BLEND);
      } else {
        gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      }
      gl.useProgram(spriteProg);
      gl.uniformMatrix4fv(U(spriteProg, 'u_mvp'), false, lastMvp);
      gl.uniform3fv(U(spriteProg, 'u_camRight'), cameraRight);
      gl.uniform1i(U(spriteProg, 'u_fixedMap'), lastFixed); gl.uniform1i(U(spriteProg, 'u_paletteRow'), lastPalRow); gl.uniform1f(U(spriteProg, 'u_extralight'), lastExtra);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, atlas); gl.uniform1i(U(spriteProg, 'u_atlas'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, texInfo); gl.uniform1i(U(spriteProg, 'u_texInfo'), 1);
      gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, cmapTex); gl.uniform1i(U(spriteProg, 'u_colormap'), 4);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, palTex); gl.uniform1i(U(spriteProg, 'u_palette'), 5);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, count);
      for (let i = 0; i < 4; i++) gl.vertexAttribDivisor(i, 0);
      gl.bindVertexArray(null);
    },
    drawAutomap() { automapCtl.draw(); },
    drawHud(quads, paletteRow) {
      let n = 0;
      const data = new Float32Array(quads.length * 6);
      for (const q of quads) {
        const layer = hudLayerOf.get(q.name); const img = patchOf.get(q.name);
        if (layer === undefined || !img) continue;
        const o = n * 6;
        data[o] = q.x - img.leftOffset; data[o + 1] = q.y - img.topOffset; data[o + 2] = img.width; data[o + 3] = img.height;
        data[o + 4] = layer; data[o + 5] = paletteRow; n++;
      }
      if (n === 0) return;
      gl.bindVertexArray(hudVao); gl.bindBuffer(gl.ARRAY_BUFFER, hudVbo);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 6), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribDivisor(0, 1); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
      gl.enableVertexAttribArray(1); gl.vertexAttribDivisor(1, 1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 24, 16);
      gl.enableVertexAttribArray(2); gl.vertexAttribDivisor(2, 1); gl.vertexAttribPointer(2, 1, gl.FLOAT, false, 24, 20);
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      gl.useProgram(hudProg);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D_ARRAY, hudAtlasTex); gl.uniform1i(U(hudProg, 'u_atlas'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, hudSizesTex); gl.uniform1i(U(hudProg, 'u_sizes'), 1);
      gl.activeTexture(gl.TEXTURE5); gl.bindTexture(gl.TEXTURE_2D, palTex); gl.uniform1i(U(hudProg, 'u_palette'), 5);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, n);
      for (let i = 0; i < 3; i++) gl.vertexAttribDivisor(i, 0);
      gl.bindVertexArray(null);
    },
    present: (dtMs) => {
      // Resolve the G-buffer through the filter into the melt's scene target, then
      // let the melt blit/melt that to the default framebuffer.
      if (postprocess) postprocess.render(wipe.sceneFramebuffer(), width, height, dtMs);
      wipe.present(dtMs);
      gl.flush();
    },
  };
}
