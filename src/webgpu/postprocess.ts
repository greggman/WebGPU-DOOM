// Post-processing (index-postprocess.html). The scene renders into a small
// G-buffer — colour + a second target holding the geometric wall/floor normal
// and linear view depth — and this pass runs a Shadertoy-style filter over it
// before the melt/present.
//
// Effects are backend-agnostic modules (src/effects/); this consumes their WGSL.
// The harness below provides the Shadertoy-named inputs so ports stay close to
// their originals: `U.iResolution` (vec3), `U.iTime`, `U.iFrame`, `U.iMouse`,
// plus `iColor0(uv)` (iChannel0 colour), `iNormal0(uv)`/`iDepth0(uv)` (the DOOM
// G-buffer), and `fmod`/`fmod2` (GLSL's *floored* mod, `x - y*floor(x/y)` — WGSL's
// `%` is truncated, so it differs for negative operands the ported effects rely on).

import { EFFECTS } from '../effects/index.js';
import { PP_TEX_SIZE, PP_TEX_COUNT, generatePPTextures, buildMipChain } from '../pptextures.js';
import { parseChannels, loadChannel, mipChain, CHANNEL_TYPES, type ChannelKind, type ChannelSpec, type LoadedChannel } from '../ppchannels.js';
import type { PostEffectInfo, PostProcessControl, ShaderError } from '../renderer.js';

const HEADER = /* wgsl */ `
struct Uniforms {
  iResolution: vec3f, iTime: f32,
  iMouse: vec4f, iFrame: f32,
  iCamPos: vec3f, iTanHalfFovX: f32,
  iCamRight: vec3f, iTanHalfFovY: f32,
  iCamUp: vec3f, _p0: f32,
  iCamFwd: vec3f, _p1: f32,
};
@group(0) @binding(0) var iSampler : sampler;
@group(0) @binding(1) var iChannel0 : texture_2d<f32>;
@group(0) @binding(2) var iChannelND : texture_2d<f32>;
@group(0) @binding(3) var<uniform> U : Uniforms;
@group(0) @binding(4) var iChannels : texture_2d_array<f32>;   // built-in noise/pattern library
@group(0) @binding(5) var iChannelsSampler : sampler;          // repeat + mipmap
@group(0) @binding(6) var iChannelSampler : sampler;           // repeat + mipmap, for iChannel1..N
@group(0) @binding(7) var iChannelMeta : texture_2d<u32>;      // integer meta: uv*65535, type, category|flip<<3|rot<<4

const iNoiseRGBA : i32 = 0;   // uncorrelated per-texel rgba white noise
const iNoiseValue : i32 = 1;  // smooth grey value noise
const iBlueNoise : i32 = 2;   // approximate blue noise (dither)
const iCrosshatch : i32 = 3;  // cross-hatch tonal-art-map (ink where luma < texel)
// Sample a built-in library layer. Call in uniform control flow (top level).
fn iChan(layer: i32, uv: vec2f) -> vec4f { return textureSample(iChannels, iChannelsSampler, uv, layer); }

fn iColor0(uv: vec2f) -> vec4f { return textureSampleLevel(iChannel0, iSampler, uv, 0.0); }
fn iNormal0(uv: vec2f) -> vec3f { return textureSampleLevel(iChannelND, iSampler, uv, 0.0).xyz; }
fn iDepth0(uv: vec2f) -> f32 { return textureSampleLevel(iChannelND, iSampler, uv, 0.0).w; }   // map units
// Per-surface texture UV of the pixel at uv. Sprites/HUD read 0..1 across the
// patch; world walls/floors read 0..1 within a tile (wrapped). Sky reads its
// panorama u/v. Handy for aligning effects to a surface instead of the screen.
// The meta target is integer + point-sampled (textureLoad) — ids never blend at
// silhouettes. iUV0 decodes uv; the rest expose the packed per-sprite fields.
fn iMeta(uv: vec2f) -> vec4u { return textureLoad(iChannelMeta, vec2i(uv * U.iResolution.xy), 0); }
fn iUV0(uv: vec2f) -> vec2f { let m = iMeta(uv); return vec2f(f32(m.x), f32(m.y)) / 65535.0; }
// mobj type (MT_*, e.g. 11 = imp, 1 = former human; 0 = world / HUD / sky).
fn iSpriteType(uv: vec2f) -> f32 { return f32(iMeta(uv).z); }
// category 1..7 (see src/spriteid.ts): 1 world, 2 enemy, 3 powerup, 4 effect,
// 5 HUD, 6 HUD number, 7 weapon (0 = sky). Point-sampled, so crisp at edges.
fn iSpriteCategory(uv: vec2f) -> f32 { return f32(iMeta(uv).w & 7u); }
// 1 if the sprite graphic is horizontally mirrored for this facing, else 0.
fn iSpriteFlip(uv: vec2f) -> f32 { return f32((iMeta(uv).w >> 3u) & 1u); }
// which of the 8 view rotations (0..7) is shown for this sprite.
fn iSpriteRotation(uv: vec2f) -> f32 { return f32((iMeta(uv).w >> 4u) & 7u); }
fn iDepth01(uv: vec2f) -> f32 { return clamp(iDepth0(uv) / 20000.0, 0.0, 1.0); }                 // 0 = eye, 1 = far clip
// World-space position of the surface at uv, reconstructed from linear depth +
// the camera basis. Y is up. Meaningless where there is no geometry (sky) or on
// UI (depth ~0); guard with iDepth0.
fn iWorldPos(uv: vec2f) -> vec3f {
  let d = iDepth0(uv);
  let ndc = vec2f(uv.x * 2.0 - 1.0, 1.0 - uv.y * 2.0);
  return U.iCamPos + d * (U.iCamFwd + U.iCamRight * (ndc.x * U.iTanHalfFovX) + U.iCamUp * (ndc.y * U.iTanHalfFovY));
}
fn fmod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn fmod2(x: vec2f, y: vec2f) -> vec2f { return x - y * floor(x / y); }

struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0));
  var o: VSOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = vec2f(p[i].x*0.5+0.5, 0.5 - p[i].y*0.5);
  return o;
}
`;

const FOOTER = /* wgsl */ `
@fragment fn fs(in: VSOut) -> @location(0) vec4f {
  return mainImage(in.pos.xy);
}
`;

const U_SIZE = 112; // + camera: camPos+tanX (16) + right+tanY (16) + up+pad (16) + fwd+pad (16)

// Lines the harness prepends, to map WGSL error line numbers back to the editor.
const HEADER_LINES = HEADER.split('\n').length - 1;

export interface PostProcess extends PostProcessControl {
  setInputs(colorView: GPUTextureView, ndView: GPUTextureView, uvView: GPUTextureView): void;
  render(enc: GPUCommandEncoder, outView: GPUTextureView, width: number, height: number, dtMs: number): void;
}

export function createPostProcess(device: GPUDevice, format: GPUTextureFormat): PostProcess {
  const FRAG = GPUShaderStage.FRAGMENT;
  // Bindings 0-7 are the same for every effect; 8+ are per-effect user channels.
  const baseEntries: GPUBindGroupLayoutEntry[] = [
    { binding: 0, visibility: FRAG, sampler: { type: 'filtering' } },
    { binding: 1, visibility: FRAG, texture: { sampleType: 'float' } },
    { binding: 2, visibility: FRAG, texture: { sampleType: 'float' } },
    { binding: 3, visibility: FRAG, buffer: { type: 'uniform' } },
    { binding: 4, visibility: FRAG, texture: { sampleType: 'float', viewDimension: '2d-array' } },
    { binding: 5, visibility: FRAG, sampler: { type: 'filtering' } },
    { binding: 6, visibility: FRAG, sampler: { type: 'filtering' } },
    { binding: 7, visibility: FRAG, texture: { sampleType: 'uint' } },
  ];
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  const uniforms = device.createBuffer({ size: U_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const uScratch = new ArrayBuffer(U_SIZE);
  const uF32 = new Float32Array(uScratch);

  // Built-in texture library: a mip-mapped, repeat-wrapped array of procedural
  // noise/pattern layers. Generated + uploaded once (mips built on the CPU since
  // WebGPU has no generateMipmap).
  const mipCount = Math.log2(PP_TEX_SIZE) + 1;
  const libTex = device.createTexture({
    size: [PP_TEX_SIZE, PP_TEX_SIZE, PP_TEX_COUNT],
    format: 'rgba8unorm',
    mipLevelCount: mipCount,
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  generatePPTextures().forEach((layer, z) => {
    buildMipChain(layer, PP_TEX_SIZE).forEach((m, level) => {
      const s = PP_TEX_SIZE >> level;
      device.queue.writeTexture(
        { texture: libTex, mipLevel: level, origin: { x: 0, y: 0, z } },
        m, { bytesPerRow: s * 4, rowsPerImage: s }, { width: s, height: s, depthOrArrayLayers: 1 });
    });
  });
  const libView = libTex.createView({ dimension: '2d-array' });
  const libSampler = device.createSampler({
    addressModeU: 'repeat', addressModeV: 'repeat',
    magFilter: 'linear', minFilter: 'linear', mipmapFilter: 'linear',
  });

  // 1x1 black placeholders per channel kind, bound until a channel loads / on error.
  const makePlaceholder = (kind: ChannelKind): GPUTextureView => {
    const layers = kind === 'cube' ? 6 : 1;
    const tex = device.createTexture({
      size: [1, 1, layers], dimension: kind === '3d' ? '3d' : '2d',
      format: 'rgba8unorm', usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    for (let z = 0; z < layers; z++) {
      device.queue.writeTexture({ texture: tex, origin: { x: 0, y: 0, z } }, new Uint8Array([0, 0, 0, 255]),
        { bytesPerRow: 4, rowsPerImage: 1 }, { width: 1, height: 1, depthOrArrayLayers: 1 });
    }
    return tex.createView({ dimension: CHANNEL_TYPES[kind].view });
  };
  const placeholder: Record<ChannelKind, GPUTextureView> = {
    '2d': makePlaceholder('2d'), array: makePlaceholder('array'),
    cube: makePlaceholder('cube'), '3d': makePlaceholder('3d'),
  };

  // Upload a loaded channel into a GPU texture (mips: explicit levels, or CPU box
  // chain per 2D image; 3D gets none) and return its typed view.
  const uploadGPU = (l: LoadedChannel): GPUTextureView => {
    const kind = l.spec.kind, { width: w, height: h, images } = l;
    const layers = kind === '2d' ? 1 : images.length;
    const mipLevelCount = kind === '3d' ? 1
      : kind === '2d' && l.spec.explicitMips ? images.length
      : Math.floor(Math.log2(Math.max(w, h))) + 1;
    const tex = device.createTexture({
      size: [w, h, layers], dimension: kind === '3d' ? '3d' : '2d', format: 'rgba8unorm', mipLevelCount,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const write = (data: Uint8Array<ArrayBuffer>, mw: number, mh: number, level: number, z: number): void =>
      device.queue.writeTexture({ texture: tex, mipLevel: level, origin: { x: 0, y: 0, z } }, data,
        { bytesPerRow: mw * 4, rowsPerImage: mh }, { width: mw, height: mh, depthOrArrayLayers: 1 });
    if (kind === '2d' && l.spec.explicitMips) images.forEach((px, lvl) => write(px, Math.max(1, w >> lvl), Math.max(1, h >> lvl), lvl, 0));
    else if (kind === '2d') mipChain(images[0], w, h).forEach((m, lvl) => write(m.data, m.w, m.h, lvl, 0));
    else if (kind === '3d') images.forEach((px, z) => write(px, w, h, 0, z));
    else images.forEach((px, z) => mipChain(px, w, h).forEach((m, lvl) => write(m.data, m.w, m.h, lvl, z))); // array | cube
    return tex.createView({ dimension: CHANNEL_TYPES[kind].view });
  };

  interface ChannelGPU { spec: ChannelSpec; view: GPUTextureView | null; error?: string; load: Promise<void>; }
  interface EffectGPU { pipeline: GPURenderPipeline; layout: GPUBindGroupLayout; channels: ChannelGPU[]; headerLines: number; parseErrs: { line: number; message: string }[]; }

  const channelDecls = (specs: ChannelSpec[]): string =>
    specs.map((s, i) => `@group(0) @binding(${8 + i}) var iChannel${s.index}: ${CHANNEL_TYPES[s.kind].wgsl};`).join('\n');
  const makeLayout = (specs: ChannelSpec[]): GPUBindGroupLayout => device.createBindGroupLayout({
    entries: [...baseEntries, ...specs.map((s, i): GPUBindGroupLayoutEntry =>
      ({ binding: 8 + i, visibility: FRAG, texture: { sampleType: 'float', viewDimension: CHANNEL_TYPES[s.kind].view } }))],
  });
  const startLoads = (specs: ChannelSpec[]): ChannelGPU[] => specs.map((s) => {
    const c: ChannelGPU = { spec: s, view: null, load: Promise.resolve() };
    c.load = loadChannel(s).then((lo) => { c.view = uploadGPU(lo); rebuildBind(); }).catch((e: Error) => { c.error = e.message; console.warn(e.message); });
    return c;
  });
  const makePipeline = (wgsl: string, specs: ChannelSpec[], layout: GPUBindGroupLayout, label?: string): GPURenderPipeline => {
    const module = device.createShaderModule({ label, code: HEADER + (specs.length ? channelDecls(specs) + '\n' : '') + wgsl + FOOTER });
    return device.createRenderPipeline({
      label, layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
      vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
  };
  const assemble = (name: string): EffectGPU => {
    const eff = EFFECTS.find((e) => e.name === name) ?? EFFECTS[0];
    const { specs, errors: parseErrs } = parseChannels(eff.wgsl);
    const layout = makeLayout(specs);
    return { pipeline: makePipeline(eff.wgsl, specs, layout, `pp-${eff.name}`), layout, channels: startLoads(specs), headerLines: HEADER_LINES, parseErrs };
  };

  let colorView: GPUTextureView | null = null;
  let ndView: GPUTextureView | null = null;
  let uvView: GPUTextureView | null = null;
  let bind: GPUBindGroup | null = null;
  const effects = new Map<string, EffectGPU>();
  let curName = EFFECTS[0].name;
  let curEffect = assemble(curName);
  effects.set(curName, curEffect);
  let time = 0, frame = 0;
  const mouse = new Float32Array([0, 0, 0, 0]);
  // camPos(3), right(3), up(3), fwd(3), tanX, tanY
  const cam = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, -1, 1, 1]);

  function rebuildBind(): void {
    if (!colorView || !ndView || !uvView) return;
    bind = device.createBindGroup({
      layout: curEffect.layout,
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: colorView },
        { binding: 2, resource: ndView },
        { binding: 3, resource: { buffer: uniforms } },
        { binding: 4, resource: libView },
        { binding: 5, resource: libSampler },
        { binding: 6, resource: libSampler },
        { binding: 7, resource: uvView },
        ...curEffect.channels.map((c, i): GPUBindGroupEntry => ({ binding: 8 + i, resource: c.view ?? placeholder[c.spec.kind] })),
      ],
    });
  }

  return {
    effects: EFFECTS.map((e) => ({
      name: e.name, author: e.author, authorUrl: e.authorUrl,
      src: e.src, license: e.license, licenseUrl: e.licenseUrl, hidden: e.hidden,
    })),
    language: 'wgsl',
    current: () => curName,
    setEffect(name: string): void {
      if (!EFFECTS.some((e) => e.name === name)) return;
      curName = name;
      let e = effects.get(name);
      if (!e) { e = assemble(name); effects.set(name, e); }
      curEffect = e;
      rebuildBind();
    },
    setMouse(x, y, down): void { mouse[0] = x; mouse[1] = y; mouse[2] = down ? 1 : 0; },
    setCamera(pos, right, up, fwd, tanX, tanY): void {
      cam[0] = pos[0]; cam[1] = pos[1]; cam[2] = pos[2];
      cam[3] = right[0]; cam[4] = right[1]; cam[5] = right[2];
      cam[6] = up[0]; cam[7] = up[1]; cam[8] = up[2];
      cam[9] = fwd[0]; cam[10] = fwd[1]; cam[11] = fwd[2];
      cam[12] = tanX; cam[13] = tanY;
    },
    sourceOf: (name) => (EFFECTS.find((e) => e.name === name)?.wgsl ?? EFFECTS[0].wgsl).trim(),
    async setCustomSource(source: string): Promise<ShaderError[]> {
      const { specs, errors: parseErrs } = parseChannels(source);
      const headerLines = HEADER_LINES + (specs.length ? channelDecls(specs).split('\n').length : 0);
      const layout = makeLayout(specs);
      device.pushErrorScope('validation');
      const module = device.createShaderModule({ code: HEADER + (specs.length ? channelDecls(specs) + '\n' : '') + source + FOOTER });
      const pipeline = device.createRenderPipeline({
        layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
        vertex: { module, entryPoint: 'vs' }, fragment: { module, entryPoint: 'fs', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      });
      const scopeErr = await device.popErrorScope();
      const errs = (await module.getCompilationInfo()).messages
        .filter((m) => m.type === 'error')
        .map((m) => ({ line: Math.max(1, m.lineNum - headerLines), col: Math.max(1, m.linePos), message: m.message }));
      if (errs.length) return errs;
      if (scopeErr) return [{ line: 1, col: 1, message: scopeErr.message }];
      const channels = startLoads(specs);
      curName = 'custom';
      curEffect = { pipeline, layout, channels, headerLines, parseErrs };
      rebuildBind();
      await Promise.all(channels.map((c) => c.load));
      return [
        ...parseErrs.map((e) => ({ line: e.line, col: 1, message: e.message, kind: 'resource' as const })),
        ...channels.filter((c) => c.error).map((c) => ({ line: c.spec.line, col: 1, message: c.error!, kind: 'resource' as const })),
      ];
    },
    setInputs(cv, nv, uvv): void { colorView = cv; ndView = nv; uvView = uvv; rebuildBind(); },
    render(enc, outView, width, height, dtMs): void {
      time += dtMs / 1000;
      frame += 1;
      uF32[0] = width; uF32[1] = height; uF32[2] = 1;   // iResolution
      uF32[3] = time;                                    // iTime
      uF32[4] = mouse[0]; uF32[5] = mouse[1]; uF32[6] = mouse[2]; uF32[7] = 0; // iMouse
      uF32[8] = frame;                                   // iFrame
      uF32[12] = cam[0]; uF32[13] = cam[1]; uF32[14] = cam[2]; uF32[15] = cam[12]; // iCamPos, iTanHalfFovX
      uF32[16] = cam[3]; uF32[17] = cam[4]; uF32[18] = cam[5]; uF32[19] = cam[13]; // iCamRight, iTanHalfFovY
      uF32[20] = cam[6]; uF32[21] = cam[7]; uF32[22] = cam[8];                     // iCamUp
      uF32[24] = cam[9]; uF32[25] = cam[10]; uF32[26] = cam[11];                   // iCamFwd
      device.queue.writeBuffer(uniforms, 0, uScratch);

      const rp = enc.beginRenderPass({
        colorAttachments: [{ view: outView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
      });
      if (bind) { rp.setPipeline(curEffect.pipeline); rp.setBindGroup(0, bind); rp.draw(3); }
      rp.end();
    },
  };
}
