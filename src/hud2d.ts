// 2D patch overlay: status bar, menus, messages, the intermission.
//
// DOOM's UI is drawn in a fixed 320x200 virtual space and scaled to the screen.
// Everything is an indexed patch blitted fullbright — no distance shading, no
// COLORMAP row selection, just PLAYPAL. So this is a much simpler pass than the
// world renderer: one instanced quad per patch, positions rebuilt each frame.

import { decodePatch, type IndexedImage } from './patch.js';
import type { Wad } from './wad.js';
import { SID_HUD } from './spriteid.js';

export const VIRT_W = 320;
export const VIRT_H = 200;

// paletteRow is PER-INSTANCE, not a shared uniform. That matters: the HUD is
// drawn in several passes per frame (weapon, status bar, menu) that share one
// instance buffer, and a shared uniform would be clobbered by the last write.
// Baking the tint into each quad lets every draw own its own region.
const shader = (gb: boolean): string => /* wgsl */ `
@group(0) @binding(0) var palette : texture_2d<f32>;
@group(0) @binding(1) var atlas   : texture_2d_array<u32>;
@group(0) @binding(2) var<storage, read> sizes : array<vec2f>;

struct Inst {
  @location(0) rect    : vec4f,  // x, y, w, h in 320x200 space
  @location(1) layer   : f32,
  @location(2) palRow  : f32,
};
struct VsOut {
  @builtin(position) clip : vec4f,
  @location(0) uv : vec2f,
  @location(1) @interpolate(flat) layer : u32,
  @location(2) @interpolate(flat) palRow : u32,
  @location(3) @interpolate(flat) sid : u32,
};

@vertex
fn vs(@builtin(vertex_index) vi : u32, in : Inst) -> VsOut {
  var corner = array(vec2f(0,0), vec2f(1,0), vec2f(1,1),
                     vec2f(0,0), vec2f(1,1), vec2f(0,1));
  let c = corner[vi];
  let px = in.rect.x + c.x * in.rect.z;
  let py = in.rect.y + c.y * in.rect.w;
  // 320x200 -> clip space, y down.
  var out : VsOut;
  out.clip = vec4f(px / ${VIRT_W}.0 * 2.0 - 1.0, 1.0 - py / ${VIRT_H}.0 * 2.0, 0.0, 1.0);
  out.uv = c;
  // The category (SID_*) is packed into the layer field's high bits so the HUD
  // needs no extra vertex attribute; mask it back out for the atlas lookup.
  out.layer = u32(in.layer) & 0xffffu;
  out.sid = u32(in.layer) >> 16u;
  out.palRow = u32(in.palRow);
  return out;
}

// meta target (rgba16uint): .rg = uv*65535, .b = 0, .a = category (SID_HUD/HUDNUM/WEAPON).
${gb ? 'struct FsOut { @location(0) color : vec4f, @location(1) nd : vec4f, @location(2) mval : vec4u, };' : ''}

@fragment
fn fs(in : VsOut) -> ${gb ? 'FsOut' : '@location(0) vec4f'} {
  let size = sizes[in.layer];
  let texel = vec2i(in.uv * size);
  let idx = textureLoad(atlas, texel, in.layer, 0);
  if (idx.g == 0u) { discard; }   // patch transparency
  let rgb = textureLoad(palette, vec2i(i32(idx.r), i32(in.palRow)), 0).rgb;
  ${gb ? 'var o : FsOut; o.color = vec4f(rgb, 1.0); o.nd = vec4f(0.0, 0.0, 0.0, 0.0); o.mval = vec4u(u32(in.uv.x * 65535.0), u32(in.uv.y * 65535.0), 0u, in.sid); return o;' : 'return vec4f(rgb, 1.0);'}
}
`;

const INSTANCE_STRIDE = 24; // vec4f rect + f32 layer + f32 palRow

export interface Hud2D {
  /** Layer index for a patch, by lump name. */
  layerOf: Map<string, number>;
  /** Patch dimensions and anchor, by lump name (for right/centre alignment). */
  patchOf: Map<string, IndexedImage>;
  /** Reset the per-frame instance cursor. Call once before the render pass. */
  beginFrame(): void;
  /** Append a batch of quads and record a draw. Safe to call several times per
   *  frame — each batch lands in its own buffer region. */
  draw(pass: GPURenderPassEncoder, quads: Quad[], paletteRow: number): void;
}

export interface Quad { name: string; x: number; y: number; sid?: number; }

export function createHud2D(
  device: GPUDevice,
  format: GPUTextureFormat,
  paletteView: GPUTextureView,
  wad: Wad,
  lumpNames: string[],
  gbufferFormat?: GPUTextureFormat,
): Hud2D {
  // Decode every UI patch into one texture array, padded to the largest.
  const patches = lumpNames
    .filter((n) => wad.checkNumForName(n) >= 0)
    .map((n) => ({ name: n, img: decodePatch(wad.lump(n)) }));

  let maxW = 1, maxH = 1;
  for (const p of patches) { maxW = Math.max(maxW, p.img.width); maxH = Math.max(maxH, p.img.height); }

  const atlas = device.createTexture({
    label: 'hud-atlas',
    size: [maxW, maxH, patches.length],
    format: 'rg8uint',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const layerOf = new Map<string, number>();
  const patchOf = new Map<string, IndexedImage>();
  const sizeData = new Float32Array(patches.length * 2);

  for (let i = 0; i < patches.length; i++) {
    const { name, img } = patches[i];
    layerOf.set(name, i);
    patchOf.set(name, img);
    sizeData[i * 2] = img.width;
    sizeData[i * 2 + 1] = img.height;
    device.queue.writeTexture(
      { texture: atlas, origin: [0, 0, i] },
      img.data,
      { bytesPerRow: img.width * 2, rowsPerImage: img.height },
      [img.width, img.height, 1],
    );
  }

  const sizes = device.createBuffer({
    size: Math.max(16, sizeData.byteLength),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(sizes, 0, sizeData);

  const module = device.createShaderModule({ label: 'hud2d', code: shader(!!gbufferFormat) });
  const layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint', viewDimension: '2d-array' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    ],
  });

  const pipeline = device.createRenderPipeline({
    label: 'hud2d',
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: {
      module, entryPoint: 'vs',
      buffers: [{
        arrayStride: INSTANCE_STRIDE,
        stepMode: 'instance',
        attributes: [
          { shaderLocation: 0, offset: 0, format: 'float32x4' },
          { shaderLocation: 1, offset: 16, format: 'float32' },
          { shaderLocation: 2, offset: 20, format: 'float32' },
        ],
      }],
    },
    fragment: {
      module, entryPoint: 'fs',
      targets: gbufferFormat ? [{ format }, { format: gbufferFormat }, { format: 'rgba16uint' }] : [{ format }],
    },
    primitive: { topology: 'triangle-list' },
    // The HUD shares the world's render pass, which has a depth attachment — so
    // this pipeline must declare a matching depth-stencil state even though it
    // neither tests nor writes depth. It paints over the finished frame in
    // submission order instead.
    depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
  });

  const bindGroup = device.createBindGroup({
    layout,
    entries: [
      { binding: 0, resource: paletteView },
      { binding: 1, resource: atlas.createView() },
      { binding: 2, resource: { buffer: sizes } },
    ],
  });

  const FLOATS = 6; // rect(4) + layer + palRow
  const MAX_QUADS = 512;
  const instanceData = new Float32Array(MAX_QUADS * FLOATS);
  const instanceBuf = device.createBuffer({
    size: MAX_QUADS * INSTANCE_STRIDE,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  // Per-frame cursor: each draw() batch occupies its own region so multiple
  // batches in one frame don't clobber each other's instance data.
  let cursor = 0;

  return {
    layerOf,
    patchOf,
    beginFrame() { cursor = 0; },
    draw(rp, quads, paletteRow) {
      const start = cursor;
      let n = 0;
      for (const q of quads) {
        const layer = layerOf.get(q.name);
        const img = patchOf.get(q.name);
        if (layer === undefined || !img || cursor >= MAX_QUADS) continue;
        const o = cursor * FLOATS;
        // patch offsets anchor the graphic — number digits use them.
        instanceData[o + 0] = q.x - img.leftOffset;
        instanceData[o + 1] = q.y - img.topOffset;
        instanceData[o + 2] = img.width;
        instanceData[o + 3] = img.height;
        // Category in the high 16 bits; layer index in the low 16 (< 512 patches).
        instanceData[o + 4] = layer | ((q.sid ?? SID_HUD) << 16);
        instanceData[o + 5] = paletteRow;
        cursor++; n++;
      }
      if (n === 0) return;

      // Write only this batch's region, and draw it with firstInstance=start.
      device.queue.writeBuffer(
        instanceBuf, start * INSTANCE_STRIDE,
        instanceData, start * FLOATS, n * FLOATS,
      );

      rp.setPipeline(pipeline);
      rp.setBindGroup(0, bindGroup);
      rp.setVertexBuffer(0, instanceBuf);
      rp.draw(6, n, 0, start);
    },
  };
}
