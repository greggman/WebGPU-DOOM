// Procedurally-generated texture_2d_array shared by the post-process effects: a
// small Shadertoy-style library of noise + pattern layers, addressed by constant
// layer indices in the shader harness (iNoiseRGBA / iNoiseValue / iBlueNoise /
// iCrosshatch). Generated on the CPU at startup — no fetches, no assets, so it
// stays self-contained and offline/CSP-clean. All layers are PP_TEX_SIZE^2 rgba8,
// repeat-wrapped and mip-mapped by the backends.

export const PP_TEX_SIZE = 1024;
// Order defines the layer index each shader constant maps to.
export const PP_TEX_LAYERS = ['noiseRGBA', 'noiseValue', 'blueNoise', 'crosshatch'] as const;
export const PP_TEX_COUNT = PP_TEX_LAYERS.length;

const N = PP_TEX_SIZE;

/** Deterministic PRNG so the generated textures are identical every build. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smooth = (t: number): number => t * t * (3 - 2 * t);

/** Uncorrelated per-texel noise across all four channels. */
function whiteNoiseRGBA(rng: () => number): Uint8Array<ArrayBuffer> {
  const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < d.length; i++) d[i] = (rng() * 256) | 0;
  return d;
}

/** Smooth value noise (grey) — a coarse random grid, smootherstep-interpolated. */
function valueNoiseGrey(rng: () => number): Uint8Array<ArrayBuffer> {
  const G = 128; // grid cells across the texture
  const grid = new Float32Array(G * G);
  for (let i = 0; i < grid.length; i++) grid[i] = rng();
  const d = new Uint8Array(N * N * 4);
  const scale = G / N;
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const gx = x * scale, gy = y * scale;
      const x0 = Math.floor(gx) % G, y0 = Math.floor(gy) % G;
      const x1 = (x0 + 1) % G, y1 = (y0 + 1) % G;
      const fx = smooth(gx - Math.floor(gx)), fy = smooth(gy - Math.floor(gy));
      const v00 = grid[y0 * G + x0], v10 = grid[y0 * G + x1];
      const v01 = grid[y1 * G + x0], v11 = grid[y1 * G + x1];
      const v = (v00 * (1 - fx) + v10 * fx) * (1 - fy) + (v01 * (1 - fx) + v11 * fx) * fy;
      const b = (v * 255) | 0, o = (y * N + x) * 4;
      d[o] = b; d[o + 1] = b; d[o + 2] = b; d[o + 3] = 255;
    }
  }
  return d;
}

/** Approximate blue noise: white noise minus its low-pass (a wrap-around box
 *  blur), recentred. Not true void-and-cluster, but a usable blue-ish spectrum
 *  for dithering, and cheap enough to generate at load. */
function blueNoiseApprox(rng: () => number): Uint8Array<ArrayBuffer> {
  const w = new Float32Array(N * N);
  for (let i = 0; i < w.length; i++) w[i] = rng();
  const r = 3, inv = 1 / (2 * r + 1);
  const tmp = new Float32Array(N * N), lp = new Float32Array(N * N);
  for (let y = 0; y < N; y++) {
    let acc = 0;
    for (let x = -r; x <= r; x++) acc += w[y * N + ((x + N) % N)];
    for (let x = 0; x < N; x++) { tmp[y * N + x] = acc * inv; acc += w[y * N + ((x + r + 1) % N)] - w[y * N + ((x - r + N) % N)]; }
  }
  for (let x = 0; x < N; x++) {
    let acc = 0;
    for (let y = -r; y <= r; y++) acc += tmp[((y + N) % N) * N + x];
    for (let y = 0; y < N; y++) { lp[y * N + x] = acc * inv; acc += tmp[((y + r + 1) % N) * N + x] - tmp[((y - r + N) % N) * N + x]; }
  }
  const d = new Uint8Array(N * N * 4);
  for (let i = 0; i < N * N; i++) {
    let v = w[i] - lp[i] + 0.5;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    const b = (v * 255) | 0, o = i * 4;
    d[o] = b; d[o + 1] = b; d[o + 2] = b; d[o + 3] = 255;
  }
  return d;
}

/** Cross-hatch tonal-art-map. Each pixel stores (in every channel) the tone
 *  THRESHOLD at which its hatch line turns on: sparse lines carry a high value
 *  (drawn even for light tones), dense lines a low value (only in shadows). An
 *  effect inks a pixel where `luma < texel` — darker luma => more line sets pass
 *  => denser hatching. Four sets: two angles, two spacings. */
function crosshatch(): Uint8Array<ArrayBuffer> {
  const A = 0.785398, B = 2.356194; // +45 deg, +135 deg
  const sets = [
    { c: Math.cos(A), s: Math.sin(A), sp: 8, th: 1.3, t: 0.85 },
    { c: Math.cos(B), s: Math.sin(B), sp: 8, th: 1.3, t: 0.6 },
    { c: Math.cos(A), s: Math.sin(A), sp: 4, th: 1.0, t: 0.4 },
    { c: Math.cos(B), s: Math.sin(B), sp: 4, th: 1.0, t: 0.2 },
  ];
  const d = new Uint8Array(N * N * 4);
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      let v = 0;
      for (const k of sets) {
        let m = (x * k.c + y * k.s) % k.sp;
        if (m < 0) m += k.sp;
        if (m < k.th) v = Math.max(v, k.t);
      }
      const b = (v * 255) | 0, o = (y * N + x) * 4;
      d[o] = b; d[o + 1] = b; d[o + 2] = b; d[o + 3] = 255;
    }
  }
  return d;
}

/** The layer bitmaps, in PP_TEX_LAYERS order (mip level 0 only). */
export function generatePPTextures(): Uint8Array<ArrayBuffer>[] {
  const rng = mulberry32(0x9e3779b9);
  return [whiteNoiseRGBA(rng), valueNoiseGrey(rng), blueNoiseApprox(rng), crosshatch()];
}

/** Box-filtered mip chain (including level 0) for a single rgba8 layer. Used by
 *  the WebGPU backend, which has no generateMipmap. */
export function buildMipChain(level0: Uint8Array<ArrayBuffer>, size: number): Uint8Array<ArrayBuffer>[] {
  const levels = [level0];
  let src = level0, s = size;
  while (s > 1) {
    const ns = s >> 1;
    const dst = new Uint8Array(ns * ns * 4);
    for (let y = 0; y < ns; y++) {
      for (let x = 0; x < ns; x++) {
        const o = (y * ns + x) * 4;
        for (let ch = 0; ch < 4; ch++) {
          const a = src[(2 * y * s + 2 * x) * 4 + ch];
          const b = src[(2 * y * s + 2 * x + 1) * 4 + ch];
          const c = src[((2 * y + 1) * s + 2 * x) * 4 + ch];
          const e = src[((2 * y + 1) * s + 2 * x + 1) * 4 + ch];
          dst[o + ch] = (a + b + c + e + 2) >> 2;
        }
      }
    }
    levels.push(dst); src = dst; s = ns;
  }
  return levels;
}
