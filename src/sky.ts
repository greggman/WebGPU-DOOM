// Sky. Ported from linuxdoom-1.10/r_sky.c and r_plane.c's sky column path.
//
// Vanilla picks a sky column per screen column with
//   angle = (viewangle + xtoviewangle[x]) >> ANGLETOSKYSHIFT   (shift = 22)
// viewangle is a 32-bit BAM, so >>22 yields 1024 columns per revolution across
// a 256-wide sky: the sky repeats 4x per 360 degrees. skytexturemid = 100 puts
// texture row 100 of 128 at the horizon.
//
// Vanilla draws sky as full-bright columns wherever a F_SKY1 plane is visible
// (r_plane.c: "Sky is always drawn full bright, no colormaps"). We emit no
// geometry for F_SKY1 planes at all, so instead we draw a full-screen pass
// first with depth writes off; level geometry then paints over it, leaving sky
// exactly in the holes. Same result, no stencil, no per-column loop.
//
// Vanilla has no freelook, so the vertical mapping below is an extension. It's
// built to agree with vanilla at pitch 0 (horizon lands on row 100).

const shader = (gb: boolean): string => /* wgsl */ `
struct SkyGlobals {
  right   : vec3f,
  tanHalf : f32,
  up      : vec3f,
  aspect  : f32,
  forward : vec3f,
  layer    : u32,
};

@group(0) @binding(0) var<uniform> s : SkyGlobals;
@group(0) @binding(1) var palette : texture_2d<f32>;
@group(0) @binding(2) var atlas   : texture_2d_array<u32>;
// vec4f: xy = real size, zw = sprite anchor (unused here). Shared layout with
// render.ts and billboard.ts.
@group(0) @binding(3) var<storage, read> texInfo : array<vec4f>;

struct VsOut {
  @builtin(position) clip : vec4f,
  @location(0) ndc : vec2f,
};

// Full-screen triangle generated from vertex_index — no vertex buffer needed.
@vertex
fn vs(@builtin(vertex_index) i : u32) -> VsOut {
  var p = array(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var out : VsOut;
  out.clip = vec4f(p[i], 0.0, 1.0);
  out.ndc = p[i];
  return out;
}

const PI = 3.14159265359;

${gb ? 'struct FsOut { @location(0) color : vec4f, @location(1) nd : vec4f, };' : ''}

@fragment
fn fs(in : VsOut) -> ${gb ? 'FsOut' : '@location(0) vec4f'} {
  // Ray direction straight from the camera basis -- cheaper than inverting the
  // view-projection, and there's only one camera to care about.
  let dir = normalize(
      s.forward
    + s.right * (in.ndc.x * s.tanHalf * s.aspect)
    + s.up    * (in.ndc.y * s.tanHalf)
  );

  let size = texInfo[s.layer].xy;

  // 4 repeats per revolution (ANGLETOSKYSHIFT). World Z is negated map Y, so
  // negate it back to recover the map-space angle the sky is indexed by.
  let yaw = atan2(-dir.z, dir.x);
  let u = fract(yaw / (2.0 * PI) * 4.0);

  // skytexturemid = 100 of 128 at the horizon; up is toward row 0.
  let v = clamp((100.0 - dir.y * 128.0) / 128.0, 0.0, 1.0);

  let texel = vec2i(vec2f(u, v) * size);
  let idx = textureLoad(atlas, texel, s.layer, 0);

  // Full bright: no COLORMAP lookup at all, matching r_plane.c.
  let rgb = textureLoad(palette, vec2i(i32(idx.r), 0), 0).rgb;
  ${gb ? 'var o : FsOut; o.color = vec4f(rgb, 1.0); o.nd = vec4f(0.0, 0.0, 0.0, 20000.0); return o;' : 'return vec4f(rgb, 1.0);'}
}
`;

export const SKY_GLOBALS_SIZE = 48; // 3 x (vec3f + f32)

export interface SkyPass {
  pipeline: GPURenderPipeline;
  layout: GPUBindGroupLayout;
  globals: GPUBuffer;
}

export function createSkyPass(device: GPUDevice, format: GPUTextureFormat, gbufferFormat?: GPUTextureFormat): SkyPass {
  const module = device.createShaderModule({ label: 'doom-sky', code: shader(!!gbufferFormat) });

  const layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint', viewDimension: '2d-array' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
    ],
  });

  const pipeline = device.createRenderPipeline({
    label: 'doom-sky',
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: { module, entryPoint: 'vs' },
    fragment: {
      module, entryPoint: 'fs',
      targets: gbufferFormat ? [{ format }, { format: gbufferFormat }] : [{ format }],
    },
    primitive: { topology: 'triangle-list' },
    // Depth test off, writes off: the sky lays down a background and level
    // geometry paints over it.
    depthStencil: { format: 'depth24plus', depthWriteEnabled: false, depthCompare: 'always' },
  });

  const globals = device.createBuffer({
    label: 'sky-globals',
    size: SKY_GLOBALS_SIZE,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { pipeline, layout, globals };
}

const scratch = new ArrayBuffer(SKY_GLOBALS_SIZE);
const f32 = new Float32Array(scratch);
const u32 = new Uint32Array(scratch);

export function writeSkyGlobals(
  device: GPUDevice,
  pass: SkyPass,
  right: number[],
  up: number[],
  forward: number[],
  tanHalfFov: number,
  aspect: number,
  layer: number,
): void {
  f32.set(right, 0);   f32[3] = tanHalfFov;
  f32.set(up, 4);      f32[7] = aspect;
  f32.set(forward, 8); u32[11] = layer;
  device.queue.writeBuffer(pass.globals, 0, scratch);
}
