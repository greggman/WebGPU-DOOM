import type { PostEffect } from './effect.js';

// "Matrix" digital rain mapped onto the world. Using iWorldPos (reconstructed
// from depth + camera) and the surface normal, the code is projected onto the
// walls and floor in world space, so it sticks to the geometry in perspective as
// the camera moves. The dominant normal axis picks the surface's coordinate
// frame: on walls the streams fall down world-Y; on floors/ceilings they flow
// along world-Z. Each column runs several independent streams, and brightness is
// modulated by the scene's luma so lit surfaces glow (lit by the level's lights).
//
// Sprites (enemies, items, flagged via iSpriteCategory) are camera-facing billboards, so
// instead of the geometric normal they get a forced vertical fall and render as a
// glowing green figure with code streaming down it.
//
// On top of it all, a glowing green outline traces the geometry: the same
// depth+normal edge detector as `outline`, sampled over a small disk so the glow
// is brightest on the edge and falls off outward (and bleeds into the void around
// silhouettes). Additive.
//
// Glyphs are 8x8 bitmaps baked in (digits 0-9, 7px wide in an 8px cell); Phase 2
// swaps them for a sampled atlas. Rows: MSB = leftmost, GLYPHS[g*8 + r].
const GLYPHS = `
    0x3Cu,0x66u,0x6Eu,0x76u,0x66u,0x66u,0x3Cu,0x00u,
    0x18u,0x38u,0x18u,0x18u,0x18u,0x18u,0x7Eu,0x00u,
    0x3Cu,0x66u,0x06u,0x0Cu,0x18u,0x30u,0x7Eu,0x00u,
    0x3Cu,0x66u,0x06u,0x1Cu,0x06u,0x66u,0x3Cu,0x00u,
    0x0Cu,0x1Cu,0x3Cu,0x6Cu,0x7Eu,0x0Cu,0x0Cu,0x00u,
    0x7Eu,0x60u,0x7Cu,0x06u,0x06u,0x66u,0x3Cu,0x00u,
    0x1Cu,0x30u,0x60u,0x7Cu,0x66u,0x66u,0x3Cu,0x00u,
    0x7Eu,0x06u,0x0Cu,0x18u,0x30u,0x30u,0x30u,0x00u,
    0x3Cu,0x66u,0x66u,0x3Cu,0x66u,0x66u,0x3Cu,0x00u,
    0x3Cu,0x66u,0x66u,0x3Eu,0x06u,0x0Cu,0x38u,0x00u`;

export const matrix: PostEffect = {
  name: 'matrix',
  author: 'Claude',
  wgsl: `
fn mHash(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(127.1, 311.7))) * 43758.5453); }
fn mLuma(c: vec3f) -> f32 { return dot(c, vec3f(0.299, 0.587, 0.114)); }
fn mGlyphBit(g: i32, gx: i32, gy: i32) -> f32 {
  var rows = array<u32, 80>(${GLYPHS});
  return f32((rows[g * 8 + gy] >> u32(7 - gx)) & 1u);
}
// Rain in a surface frame: c = across, f = fall. Returns (glyph intensity, head glow).
fn mRain(c: f32, f: f32, cell: f32, span: f32) -> vec2f {
  let col = floor(c / cell);
  var inten = 0.0; var headGlow = 0.0;
  for (var s = 0; s < 3; s = s + 1) {                              // several streams per column
    let h = mHash(vec2f(col, f32(s) * 17.0));
    let speed = 12.0 + h * 40.0;                                   // world units / sec
    let phase = mHash(vec2f(col, f32(s) * 5.0 + 1.0)) * span;
    let headF = fmod(U.iTime * speed + phase, span);
    let t = fmod(headF - fmod(f, span), span);                     // distance up-trail from the head
    let trail = span * (0.35 + h * 0.55);                          // scales with span -> gaps at any cell
    if (t < trail) {
      inten = max(inten, 1.0 - t / trail);
      headGlow = max(headGlow, 1.0 - smoothstep(0.0, cell * 1.5, t));
    }
  }
  let flip = floor(U.iTime * 6.0 + f * 0.02);
  let gi = i32(mHash(vec2f(col * 1.3 + floor(f / cell) * 2.7, flip)) * 10.0);
  let inCell = vec2f(fract(c / cell), fract(f / cell));
  return vec2f(inten * mGlyphBit(gi, i32(inCell.x * 8.0), i32(inCell.y * 8.0)), headGlow);
}
// Depth+normal edge strength at uv (0..1), same detector as the outline effect.
fn mNd(uv: vec2f) -> vec4f { return textureSampleLevel(iChannelND, iSampler, uv, 0.0); }
fn mEdge(uv: vec2f) -> f32 {
  let px = 1.5 / U.iResolution.xy;
  let cc = mNd(uv);
  let d0 = cc.w; let n0 = normalize(cc.xyz);
  var o = array(vec2f(px.x, 0.0), vec2f(-px.x, 0.0), vec2f(0.0, px.y), vec2f(0.0, -px.y));
  var e = 0.0;
  for (var i = 0; i < 4; i = i + 1) {
    let s = mNd(uv + o[i]);
    e = e + abs(s.w - d0) / max(d0, 1.0) + (1.0 - clamp(dot(normalize(s.xyz), n0), 0.0, 1.0));
  }
  return smoothstep(0.35, 0.7, e);
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let d = iDepth0(uv);
  if (d < 1.0) { return iColor0(uv); }                             // UI / weapon: leave alone

  // Glowing outline: brightest on the edge (core), a disk of samples out to R px
  // for the falloff halo. Computed before the sky test so it bleeds into the void.
  let R = 6.0;
  let core = mEdge(uv);
  var halo = core;
  for (var i = 0; i < 12; i = i + 1) {
    let a = f32(i) * 2.39996323;                                   // golden angle spiral
    let r = R * (f32(i) + 1.0) / 12.0;
    halo = max(halo, mEdge(uv + vec2f(cos(a), sin(a)) * r / U.iResolution.xy) * (1.0 - r / R));
  }
  let outline = vec3f(0.1, 1.0, 0.35) * halo * 0.3                 // green glow
              + vec3f(0.7, 1.0, 0.85) * core * 0.1;                // white-hot core

  if (iDepth01(uv) >= 0.999) { return vec4f(outline, 1.0); }       // sky / far: just the glow

  let P = iWorldPos(uv);
  let N = normalize(iNormal0(uv));
  let aN = abs(N);
  let isSpr = step(1.5, iSpriteCategory(uv));   // 1 on world sprites (category >= 2)
  // Surface frame. c = across, f = fall/flow. Sprites are billboards, so ignore
  // the fake normal and force a vertical fall down their world-space plane.
  var c = 0.0; var f = 0.0;
  if (isSpr > 0.5) { c = (P.x + P.z) * 0.7071; f = -P.y; }
  else if (aN.y >= aN.x && aN.y >= aN.z) { c = P.x; f = P.z; }     // floor/ceiling: flow along Z
  else if (aN.x >= aN.z) { c = P.z; f = -P.y; }                    // X-facing wall: fall down
  else { c = P.x; f = -P.y; }                                      // Z-facing wall: fall down

  let cell = select(4.0, 2.0, isSpr > 0.5);                        // sprites: finer, faster code
  let span = select(60.0, 30.0, isSpr > 0.5);
  let rr = mRain(c, f, cell, span);
  let code = mix(vec3f(0.15, 1.0, 0.35), vec3f(0.75, 1.0, 0.85), rr.y) * rr.x;
  let lum = mLuma(iColor0(uv).rgb);

  if (isSpr > 0.5) {
    // Glowing green figure with the code streaming over it (the sprite as code).
    let body = vec3f(0.12, 0.9, 0.35) * (0.3 + 1.2 * lum);
    return vec4f(body + code + outline, 1.0);
  }
  let fade = clamp(1.0 - d / 12000.0, 0.15, 1.0);
  return vec4f(code * (0.25 + 1.6 * lum) * fade + outline, 1.0);
}`,
  glsl: `
float mHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mLuma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
float mGlyphBit(int g, int gx, int gy){
  uint rows[80] = uint[80](${GLYPHS});
  return float((rows[g * 8 + gy] >> uint(7 - gx)) & 1u);
}
vec2 mRain(float c, float f, float cell, float span){
  float col = floor(c / cell);
  float inten = 0.0, headGlow = 0.0;
  for (int s = 0; s < 3; s++) {
    float h = mHash(vec2(col, float(s) * 17.0));
    float speed = 12.0 + h * 40.0;
    float phase = mHash(vec2(col, float(s) * 5.0 + 1.0)) * span;
    float headF = mod(iTime * speed + phase, span);
    float t = mod(headF - mod(f, span), span);
    float trail = span * (0.35 + h * 0.55);
    if (t < trail) {
      inten = max(inten, 1.0 - t / trail);
      headGlow = max(headGlow, 1.0 - smoothstep(0.0, cell * 1.5, t));
    }
  }
  float flip = floor(iTime * 6.0 + f * 0.02);
  int gi = int(mHash(vec2(col * 1.3 + floor(f / cell) * 2.7, flip)) * 10.0);
  vec2 inCell = vec2(fract(c / cell), fract(f / cell));
  return vec2(inten * mGlyphBit(gi, int(inCell.x * 8.0), int(inCell.y * 8.0)), headGlow);
}
vec4 mNd(vec2 uv){ return texture(iChannelND, uv); }
float mEdge(vec2 uv){
  vec2 px = 1.5 / iResolution.xy;
  vec4 cc = mNd(uv);
  float d0 = cc.w; vec3 n0 = normalize(cc.xyz);
  vec2 o[4];
  o[0]=vec2(px.x,0.0); o[1]=vec2(-px.x,0.0); o[2]=vec2(0.0,px.y); o[3]=vec2(0.0,-px.y);
  float e = 0.0;
  for (int i=0;i<4;i++){
    vec4 s = mNd(uv+o[i]);
    e += abs(s.w-d0)/max(d0,1.0) + (1.0 - clamp(dot(normalize(s.xyz), n0), 0.0, 1.0));
  }
  return smoothstep(0.35, 0.7, e);
}
void mainImage( out vec4 fragColor, in vec2 fc ) {
  vec2 uv = fc / iResolution.xy;
  float d = iDepth0(uv);
  if (d < 1.0) { fragColor = iColor0(uv); return; }

  float R = 6.0;
  float core = mEdge(uv);
  float halo = core;
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 2.39996323;
    float r = R * (float(i) + 1.0) / 12.0;
    halo = max(halo, mEdge(uv + vec2(cos(a), sin(a)) * r / iResolution.xy) * (1.0 - r / R));
  }
  vec3 outline = vec3(0.1, 1.0, 0.35) * halo * 0.3
               + vec3(0.7, 1.0, 0.85) * core * 0.1;

  if (iDepth01(uv) >= 0.999) { fragColor = vec4(outline, 1.0); return; }

  vec3 P = iWorldPos(uv);
  vec3 N = normalize(iNormal0(uv));
  vec3 aN = abs(N);
  float isSpr = step(1.5, iSpriteCategory(uv));   // 1 on world sprites (category >= 2)
  float c, f;
  if (isSpr > 0.5) { c = (P.x + P.z) * 0.7071; f = -P.y; }
  else if (aN.y >= aN.x && aN.y >= aN.z) { c = P.x; f = P.z; }
  else if (aN.x >= aN.z) { c = P.z; f = -P.y; }
  else { c = P.x; f = -P.y; }

  float cell = isSpr > 0.5 ? 2.0 : 4.0;                            // sprites: finer, faster code
  float span = isSpr > 0.5 ? 30.0 : 60.0;
  vec2 rr = mRain(c, f, cell, span);
  vec3 code = mix(vec3(0.15, 1.0, 0.35), vec3(0.75, 1.0, 0.85), rr.y) * rr.x;
  float lum = mLuma(iColor0(uv).rgb);

  if (isSpr > 0.5) {
    vec3 body = vec3(0.12, 0.9, 0.35) * (0.3 + 1.2 * lum);
    fragColor = vec4(body + code + outline, 1.0);
    return;
  }
  float fade = clamp(1.0 - d / 12000.0, 0.15, 1.0);
  fragColor = vec4(code * (0.25 + 1.6 * lum) * fade + outline, 1.0);
}`,
};
