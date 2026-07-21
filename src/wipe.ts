// DOOM's screen "melt" wipe (f_wipe.c). The scene renders into an offscreen
// texture each frame; a final full-screen pass blits it to the swapchain. When a
// screen transition begins we snapshot that texture as the "old" screen and, for
// the next ~1s, melt it downward over the freshly-rendered "new" screen: the
// image is cut into 160 vertical columns that slide down at staggered, ramping
// speeds. Purely a display effect — it never touches the sim (its own RNG, so
// demo playback stays bit-identical).

const NCOLS = 160;   // DOOM melts width/2 columns of a 320-wide screen
const MELT_H = 200;  // DOOM screen height, the melt's vertical unit
const TIC_MS = 1000 / 35;

// A small self-contained PRNG so the melt's stagger never draws from the sim's
// P_Random (which would desync demos).
let seed = 0x1d872b41;
const rnd = (): number => {
  seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
  return (seed >> 16) & 0xff;
};

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
  const meltY = new Int16Array(NCOLS);   // DOOM units, -16..MELT_H
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

  // DOOM wipe_initMelt: column 0 gets a small random head start, each next column
  // drifts by -1..+1 from the previous, clamped so the whole row starts near the
  // top with a ragged edge.
  function initMelt(): void {
    meltY[0] = -(rnd() % 16);
    for (let i = 1; i < NCOLS; i++) {
      let y = meltY[i - 1] + ((rnd() % 3) - 1);
      if (y > 0) y = 0;
      else if (y === -16) y = -15;
      meltY[i] = y;
    }
  }

  // DOOM wipe_doMelt, one 35Hz tic: negative columns count up (their delay),
  // then each column accelerates (dy ramps to 8) until it reaches the bottom.
  function stepMelt(): boolean {
    let done = true;
    for (let i = 0; i < NCOLS; i++) {
      if (meltY[i] < 0) { meltY[i]++; done = false; }
      else if (meltY[i] < MELT_H) {
        let dy = meltY[i] < 16 ? meltY[i] + 1 : 8;
        if (meltY[i] + dy >= MELT_H) dy = MELT_H - meltY[i];
        meltY[i] += dy;
        done = false;
      }
    }
    return done;
  }

  return {
    melting: () => active,
    sceneView: () => scene!.createView(),
    resize,
    request(): void { if (!active) { pending = true; initMelt(); } },
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
        while (acc >= TIC_MS) { acc -= TIC_MS; if (stepMelt()) { done = true; break; } }
        for (let i = 0; i < NCOLS; i++) {
          const y = meltY[i] <= 0 ? 0 : meltY[i] / MELT_H;
          meltNorm[i] = y > 1 ? 1 : y;
        }
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
