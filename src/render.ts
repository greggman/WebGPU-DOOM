// The indexed pass: rg8uint (index, coverage) geometry resolved through
// COLORMAP then PLAYPAL. Replaces r_draw.c's per-pixel colormap lookup.
//
// Every wall, floor and ceiling in a level goes through this in ONE draw.
// DOOM's surfaces all shade identically and differ only by texture, so once the
// textures live in an array layer, there is nothing left to dispatch on: no
// per-material state, no sorting, no bind group churn. One pipeline, one bind
// group, one draw for the whole level.

const shader = (gb: boolean): string => /* wgsl */ `
struct Globals {
  mvp        : mat4x4f,
  paletteRow : u32,   // PLAYPAL index: damage/pickup/radsuit (vanilla swaps the palette outright)
  fixedMap   : i32,   // -1 = distance shading, >=0 = force COLORMAP row (32 = invulnerability)
  extralight : f32,   // weapon flash / light-amp visor
  _pad       : f32,
};

@group(0) @binding(0) var<uniform> g : Globals;
@group(0) @binding(1) var palette  : texture_2d<f32>;
@group(0) @binding(2) var colormap : texture_2d<u32>;
@group(0) @binding(3) var atlas    : texture_2d_array<u32>;
// vec4f: xy = real size, zw = sprite anchor (unused here; walls anchor at the
// corner). Shared with billboard.ts — keep the layout in step.
@group(0) @binding(4) var<storage, read> texInfo : array<vec4f>;
// Live sector light, 0..255, one entry per sector. Updated every frame so
// flickering lights animate without a geometry rebuild.
@group(0) @binding(5) var<storage, read> sectorLight : array<f32>;
// Per-layer redirect: a texture's layer resolves through this to whichever
// animation frame shows this tic (identity for non-animated layers). DOOM's
// flattranslation[]/texturetranslation[] — animates without a rebuild.
@group(0) @binding(6) var<storage, read> texTrans : array<u32>;

struct VsIn {
  @location(0) pos      : vec3f,
  @location(1) uv       : vec2f,
  @location(2) sector   : f32,   // sector index — light is resolved in the FS
  @location(3) layer    : f32,   // texture array layer
};

struct VsOut {
  @builtin(position) clip : vec4f,
  @location(0) uv         : vec2f,
  @location(1) @interpolate(flat) sector : u32,
  @location(2) viewDepth  : f32,
  @location(3) @interpolate(flat) layer    : u32,
  ${gb ? '@location(4) worldPos : vec3f,' : ''}
};

${gb ? 'struct FsOut { @location(0) color : vec4f, @location(1) nd : vec4f, };' : ''}

@vertex
fn vs(in : VsIn) -> VsOut {
  var out : VsOut;
  let clip = g.mvp * vec4f(in.pos, 1.0);
  out.clip = clip;
  out.uv = in.uv;
  out.sector = u32(in.sector);
  out.viewDepth = clip.w;   // perspective w == view-space depth
  out.layer = u32(in.layer);
  ${gb ? 'out.worldPos = in.pos;' : ''}
  return out;
}

@fragment
fn fs(in : VsOut) -> ${gb ? 'FsOut' : '@location(0) vec4f'} {
  // Geometric normal from screen-space derivatives of world position — free, and
  // correct for walls and floors alike. Computed before any discard so it stays
  // in uniform control flow.
  ${gb ? 'let normal = normalize(cross(dpdx(in.worldPos), dpdy(in.worldPos)));' : ''}
  // Wrap against the layer's REAL size, not the padded array size. Manual wrap
  // is not a workaround here -- an indexed texture can never be filtered or
  // hardware-wrapped, because the average of palette index 3 and index 200 is
  // not a color between them.
  let layer = texTrans[in.layer];   // resolve the animation frame for this tic
  let size = texInfo[layer].xy;
  let texel = vec2i(fract(in.uv) * size);
  let idx = textureLoad(atlas, texel, layer, 0);

  if (idx.g == 0u) { discard; }   // uncovered texel: grates, fences

  var row : i32;
  if (g.fixedMap >= 0) {
    row = g.fixedMap;
  } else {
    // Snap the sector's LIVE light to 16 buckets here (r_main.c: >>
    // LIGHTSEGSHIFT), so flickering lights update without touching geometry.
    let lightIdx = clamp(floor(sectorLight[in.sector] / 16.0), 0.0, 15.0);
    // r_main.c R_InitLightTables: startMap is the sector's far-distance
    // darkness; nearer geometry brightens by up to MAXLIGHTSCALE/4 rows.
    let startMap = (15.0 - lightIdx) * 4.0;
    let distMap  = clamp(in.viewDepth * (12.0 / 1024.0), 0.0, 12.0);
    row = i32(clamp(startMap + distMap - 12.0 - g.extralight * 8.0, 0.0, 31.0));
  }

  let remap = textureLoad(colormap, vec2i(i32(idx.r), row), 0).r;
  let rgb = textureLoad(palette, vec2i(i32(remap), i32(g.paletteRow)), 0).rgb;
  ${gb ? 'var o : FsOut; o.color = vec4f(rgb, 1.0); o.nd = vec4f(normal, in.viewDepth); return o;' : 'return vec4f(rgb, 1.0);'}
}
`;

export const GLOBALS_SIZE = 96;
export const VERTEX_STRIDE = 28; // pos(12) + uv(8) + light(4) + layer(4)

export interface Pass {
  pipeline: GPURenderPipeline;
  layout: GPUBindGroupLayout;
  globals: GPUBuffer;
}

export function createPass(device: GPUDevice, format: GPUTextureFormat, gbufferFormat?: GPUTextureFormat): Pass {
  const module = device.createShaderModule({ label: 'doom-indexed', code: shader(!!gbufferFormat) });

  const layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint', viewDimension: '2d-array' } },
      { binding: 4, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
      { binding: 5, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
      { binding: 6, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    ],
  });

  const pipeline = device.createRenderPipeline({
    label: 'doom-indexed',
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: {
      module,
      entryPoint: 'vs',
      buffers: [{
        arrayStride: VERTEX_STRIDE,
        attributes: [
          { shaderLocation: 0, offset: 0,  format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32x2' },
          { shaderLocation: 2, offset: 20, format: 'float32'   },
          { shaderLocation: 3, offset: 24, format: 'float32'   },
        ],
      }],
    },
    fragment: {
      module, entryPoint: 'fs',
      targets: gbufferFormat ? [{ format }, { format: gbufferFormat }] : [{ format }],
    },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
  });

  const globals = device.createBuffer({
    label: 'globals',
    size: GLOBALS_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { pipeline, layout, globals };
}

const globalsScratch = new ArrayBuffer(GLOBALS_SIZE);
const globalsF32 = new Float32Array(globalsScratch, 0, 16);
const globalsView = new DataView(globalsScratch);

export function writeGlobals(
  device: GPUDevice,
  pass: Pass,
  mvp: Float32Array,
  paletteRow: number,
  fixedMap: number,
  extralight: number,
): void {
  globalsF32.set(mvp);
  globalsView.setUint32(64, paletteRow, true);
  globalsView.setInt32(68, fixedMap, true);
  globalsView.setFloat32(72, extralight, true);
  device.queue.writeBuffer(pass.globals, 0, globalsScratch);
}
