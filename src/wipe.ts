// DOOM's screen "melt" wipe (f_wipe.c). The scene renders into an offscreen
// texture each frame; a final full-screen pass blits it to the swapchain. When a
// screen transition begins we snapshot that texture as the "old" screen and, for
// the next ~1s, melt it downward over the freshly-rendered "new" screen: the
// image is cut into 160 vertical columns that slide down at staggered, ramping
// speeds. Purely a display effect — it never touches the sim (its own RNG, so
// demo playback stays bit-identical).

import { createMeltColumns, NCOLS, WIPE_TIC_MS } from './wipe_melt.js';

const SHADER = /* wgsl */ `
struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };

@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array<vec2f, 3>(vec2f(-1.0, -1.0), vec2f(3.0, -1.0), vec2f(-1.0, 3.0));
  var o: VSOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = vec2f(p[i].x * 0.5 + 0.5, 0.5 - p[i].y * 0.5); // uv.y = 0 at the top
  return o;
}

@group(0) @binding(0) var samp: sampler;
@group(0) @binding(1) var sceneTex: texture_2d<f32>; // the new screen
@group(0) @binding(2) var oldTex: texture_2d<f32>;   // the captured old screen
@group(0) @binding(3) var<storage, read> meltY: array<f32>; // per-column offset, 0..1
@group(0) @binding(4) var<uniform> melting: f32;

@fragment fn fs(in: VSOut) -> @location(0) vec4f {
  // textureSampleLevel (explicit LOD, no derivatives) so these are legal inside
  // the melt's data-dependent branching.
  if (melting < 0.5) {
    return textureSampleLevel(sceneTex, samp, in.uv, 0.0);
  }
  let col = min(${NCOLS}u - 1u, u32(in.uv.x * ${NCOLS}.0));
  let y = meltY[col];
  if (in.uv.y < y) {
    return textureSampleLevel(sceneTex, samp, in.uv, 0.0);            // new revealed at the top
  }
  return textureSampleLevel(oldTex, samp, vec2f(in.uv.x, in.uv.y - y), 0.0); // old slid down by y
}
`;

export interface Wipe {
  /** True while a melt is animating — the caller freezes the sim during it. */
  melting(): boolean;
  /** Render each frame's scene into this view instead of the swapchain. */
  sceneView(): GPUTextureView;
  /** Recreate the offscreen targets after a canvas resize. */
  resize(w: number, h: number): void;
  /** Request a melt: the current scene becomes the "old" screen. */
  request(): void;
  /** Copy the old screen if a melt was requested — call BEFORE the scene pass. */
  capture(enc: GPUCommandEncoder): void;
  /** Blit (or melt) the scene to the swapchain — call AFTER the scene pass. */
  present(enc: GPUCommandEncoder, swapView: GPUTextureView, dtMs: number): void;
}

export function createWipe(device: GPUDevice, format: GPUTextureFormat): Wipe {
  const module = device.createShaderModule({ code: SHADER });
  const pipeline = device.createRenderPipeline({
    layout: 'auto',
    vertex: { module, entryPoint: 'vs' },
    fragment: { module, entryPoint: 'fs', targets: [{ format }] },
    primitive: { topology: 'triangle-list' },
  });
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

  const meltBuf = device.createBuffer({ size: NCOLS * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
  const flagBuf = device.createBuffer({ size: 16, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const meltNorm = new Float32Array(NCOLS);
  const melt = createMeltColumns();
  const flagData = new Float32Array(1);

  let scene: GPUTexture | null = null;
  let old: GPUTexture | null = null;
  let bind: GPUBindGroup | null = null;
  let pending = false;
  let active = false;
  let acc = 0;

  function resize(w: number, h: number): void {
    scene?.destroy();
    old?.destroy();
    scene = device.createTexture({
      size: [w, h], format,
      usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
    });
    old = device.createTexture({
      size: [w, h], format,
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    bind = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: scene.createView() },
        { binding: 2, resource: old.createView() },
        { binding: 3, resource: { buffer: meltBuf } },
        { binding: 4, resource: { buffer: flagBuf } },
      ],
    });
    active = false; // a resize invalidates any in-flight melt
    pending = false;
  }

  return {
    melting: () => active,
    sceneView: () => scene!.createView(),
    resize,
    request(): void { if (!active) { pending = true; melt.init(); } },
    capture(enc: GPUCommandEncoder): void {
      if (!pending || !scene || !old) return;
      enc.copyTextureToTexture({ texture: scene }, { texture: old },
        [scene.width, scene.height]);
      pending = false;
      active = true;
      acc = 0;
    },
    present(enc: GPUCommandEncoder, swapView: GPUTextureView, dtMs: number): void {
      if (active) {
        acc += Math.min(dtMs, 250);
        let done = false;
        while (acc >= WIPE_TIC_MS) { acc -= WIPE_TIC_MS; if (melt.step()) { done = true; break; } }
        melt.normalized(meltNorm);
        device.queue.writeBuffer(meltBuf, 0, meltNorm);
        if (done) active = false;
      }
      flagData[0] = active ? 1 : 0;
      device.queue.writeBuffer(flagBuf, 0, flagData);

      const rp = enc.beginRenderPass({
        colorAttachments: [{ view: swapView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
      });
      rp.setPipeline(pipeline);
      rp.setBindGroup(0, bind!);
      rp.draw(3);
      rp.end();
    },
  };
}
