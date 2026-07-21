// Sprite billboards. Replaces linuxdoom-1.10/r_things.c (R_ProjectSprite /
// R_DrawVisSprite).
//
// The quad is expanded in the vertex shader from a per-instance point, so the
// only per-frame data is 24 bytes per thing: position, layer, flip, light.
// E1M1's 129 things come to ~3 KB a frame — nowhere near enough to justify
// mapped staging buffers over writeBuffer.
//
// Sprites are upright billboards: they rotate about the world Y axis to face
// the viewer but never tilt, which is what vanilla's column projection does
// implicitly (it has no pitch at all).

const shader = (gb: boolean): string => /* wgsl */ `
struct Globals {
  mvp        : mat4x4f,
  paletteRow : u32,
  fixedMap   : i32,
  extralight : f32,
  _pad       : f32,
};

struct Camera {
  right : vec3f,   // horizontal, normalised — the billboard's X axis
  _p0   : f32,
};

@group(0) @binding(0) var<uniform> g : Globals;
@group(0) @binding(1) var palette  : texture_2d<f32>;
@group(0) @binding(2) var colormap : texture_2d<u32>;
@group(0) @binding(3) var atlas    : texture_2d_array<u32>;
@group(0) @binding(4) var<storage, read> texInfo : array<vec4f>;  // xy = size, zw = anchor
@group(0) @binding(5) var<uniform> cam : Camera;

struct VsIn {
  @builtin(vertex_index)   vi   : u32,
  @location(0) pos    : vec3f,   // thing position; y is the FEET
  @location(1) layer  : f32,
  @location(2) flip   : f32,     // 1 = mirrored (the A2A8 doubled lump form)
  @location(3) light  : f32,
};

struct VsOut {
  @builtin(position) clip : vec4f,
  @location(0) uv         : vec2f,
  @location(1) @interpolate(flat) lightIdx : f32,
  @location(2) viewDepth  : f32,
  @location(3) @interpolate(flat) layer    : u32,
  @location(4) @interpolate(flat) shadow   : u32,   // MF_SHADOW: draw as fuzz
  ${gb ? '@location(5) @interpolate(flat) normal : vec3f,' : ''}
};

${gb ? 'struct FsOut { @location(0) color : vec4f, @location(1) nd : vec4f, };' : ''}

@vertex
fn vs(in : VsIn) -> VsOut {
  let info = texInfo[u32(in.layer)];
  let size = info.xy;
  let leftOffset = info.z;
  let topOffset  = info.w;

  // r_things.c: the sprite's top sits at thing.z + topoffset, its left edge at
  // -leftoffset from the thing's centre.
  //
  // But DOOM's art puts the feet BELOW thing.z -- topoffset is ~5 less than the
  // patch height for nearly every actor, and for a corpse (POL5: h=10, top=5)
  // it's half the sprite. Vanilla gets away with it because it never clips
  // sprites against the floor: R_DrawSprite leaves mfloorclip = viewheight for
  // unclipped columns, so sprites paint straight over the floor and only clip
  // against wall drawsegs. A depth buffer can't do that -- the floor occludes.
  //
  // So lift the sprite until its feet rest on thing.z. This is what hardware
  // ports do (GZDoom's "smart" sprite clipping). Sprites that already sit above
  // the floor (topoffset >= height, e.g. hanging bodies) are left alone.
  let lift   = max(0.0, size.y - topOffset);
  let top    = in.pos.y + topOffset + lift;
  let bottom = top - size.y;
  let left   = -leftOffset;
  let right  = left + size.x;

  // Two triangles: (0,1,2) (0,2,3) via an index pattern.
  var corner = array(vec2u(0u,0u), vec2u(1u,0u), vec2u(1u,1u),
                     vec2u(0u,0u), vec2u(1u,1u), vec2u(0u,1u));
  let c = corner[in.vi];

  let x = select(left, right, c.x == 1u);
  let y = select(top, bottom, c.y == 1u);

  // flip encodes two flags: bit 0 = mirrored, bit 1 = MF_SHADOW (spectre fuzz).
  let flags = u32(in.flip);
  var uv = vec2f(f32(c.x), f32(c.y));
  if ((flags & 1u) != 0u) { uv.x = 1.0 - uv.x; }

  let world = vec3f(in.pos.x, 0.0, in.pos.z) + cam.right * x + vec3f(0.0, y, 0.0);

  var out : VsOut;
  let clip = g.mvp * vec4f(world, 1.0);
  out.clip = clip;
  out.uv = uv;
  out.lightIdx = in.light;
  out.viewDepth = clip.w;
  out.layer = u32(in.layer);
  out.shadow = (flags >> 1u) & 1u;
  // Billboard normal: horizontal, perpendicular to the sprite's world X axis
  // (cam.right). A consistent facing so show-normals/outline treat sprites sanely.
  ${gb ? 'out.normal = normalize(cross(cam.right, vec3f(0.0, 1.0, 0.0)));' : ''}
  return out;
}

@fragment
fn fs(in : VsOut) -> ${gb ? 'FsOut' : '@location(0) vec4f'} {
  let size = texInfo[in.layer].xy;
  // Clamp rather than wrap: a sprite must not tile across its own quad.
  let texel = vec2i(clamp(in.uv * size, vec2f(0.0), size - vec2f(1.0)));
  let idx = textureLoad(atlas, texel, in.layer, 0);

  if (idx.g == 0u) { discard; }   // sprite cut-out

  var row : i32;
  if (g.fixedMap >= 0) {
    row = g.fixedMap;
  } else if (in.lightIdx < 0.0) {
    row = 0;                       // fullbright state (bit 15 of the frame field)
  } else {
    let startMap = (15.0 - in.lightIdx) * 4.0;
    let distMap  = clamp(in.viewDepth * (12.0 / 1024.0), 0.0, 12.0);
    row = i32(clamp(startMap + distMap - 12.0 - g.extralight * 8.0, 0.0, 31.0));
  }

  // Spectre fuzz (MF_SHADOW). Vanilla remaps the *background* through a dark
  // colormap, which needs a second pass over the framebuffer. We get the same
  // read — a translucent, shimmering ghost — by darkening the sprite's own
  // shaded colour and blending it out. A screen-door shimmer keyed to screen
  // position gives it the characteristic fizzle without erasing the silhouette.
  if (in.shadow != 0u) {
    let dark = min(row + 12, 31);
    let remap = textureLoad(colormap, vec2i(i32(idx.r), dark), 0).r;
    let rgb = textureLoad(palette, vec2i(i32(remap), i32(g.paletteRow)), 0).rgb;
    let p = vec2u(in.clip.xy);
    let shimmer = select(0.0, 0.18, ((p.x + p.y) & 1u) == 0u);
    ${gb ? 'var o : FsOut; o.color = vec4f(rgb, 0.34 + shimmer); o.nd = vec4f(in.normal, in.viewDepth); return o;' : 'return vec4f(rgb, 0.34 + shimmer);'}
  }

  let remap = textureLoad(colormap, vec2i(i32(idx.r), row), 0).r;
  let rgb = textureLoad(palette, vec2i(i32(remap), i32(g.paletteRow)), 0).rgb;
  ${gb ? 'var o : FsOut; o.color = vec4f(rgb, 1.0); o.nd = vec4f(in.normal, in.viewDepth); return o;' : 'return vec4f(rgb, 1.0);'}
}
`;

export const INSTANCE_STRIDE = 24; // pos(12) + layer(4) + flip(4) + light(4)

export interface BillboardPass {
  pipeline: GPURenderPipeline;
  layout: GPUBindGroupLayout;
  camera: GPUBuffer;
}

export function createBillboardPass(device: GPUDevice, format: GPUTextureFormat, gbufferFormat?: GPUTextureFormat): BillboardPass {
  const module = device.createShaderModule({ label: 'doom-sprites', code: shader(!!gbufferFormat) });

  const layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'uint', viewDimension: '2d-array' } },
      { binding: 4, visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT, buffer: { type: 'read-only-storage' } },
      { binding: 5, visibility: GPUShaderStage.VERTEX, buffer: { type: 'uniform' } },
    ],
  });

  const pipeline = device.createRenderPipeline({
    label: 'doom-sprites',
    layout: device.createPipelineLayout({ bindGroupLayouts: [layout] }),
    vertex: {
      module,
      entryPoint: 'vs',
      buffers: [{
        arrayStride: INSTANCE_STRIDE,
        stepMode: 'instance',
        attributes: [
          { shaderLocation: 0, offset: 0,  format: 'float32x3' },
          { shaderLocation: 1, offset: 12, format: 'float32'   },
          { shaderLocation: 2, offset: 16, format: 'float32'   },
          { shaderLocation: 3, offset: 20, format: 'float32'   },
        ],
      }],
    },
    fragment: {
      module,
      entryPoint: 'fs',
      // Blend is enabled for the spectre fuzz (translucent). Opaque sprites
      // output alpha 1.0, so src-alpha blending leaves them untouched. The
      // normal/depth target (when present) is written straight, no blend.
      targets: gbufferFormat
        ? [
            { format, blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            } },
            { format: gbufferFormat },
          ]
        : [{
            format,
            blend: {
              color: { srcFactor: 'src-alpha', dstFactor: 'one-minus-src-alpha', operation: 'add' },
              alpha: { srcFactor: 'one', dstFactor: 'one-minus-src-alpha', operation: 'add' },
            },
          }],
    },
    primitive: { topology: 'triangle-list', cullMode: 'none' },
    // Depth-write on: the cut-out discards before the depth write, so masked
    // sprites still occlude correctly without sorting.
    depthStencil: { format: 'depth24plus', depthWriteEnabled: true, depthCompare: 'less' },
  });

  const camera = device.createBuffer({
    label: 'billboard-camera',
    size: 16,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
  });

  return { pipeline, layout, camera };
}
