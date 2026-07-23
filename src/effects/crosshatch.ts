import type { PostEffect } from './effect.js';

// Pen-and-ink cross-hatching. The hatch technique is adapted from thespite's
// (Jaume Sanchez Elias) "cross-hatch-viii" from his 2020 #inktober sketch set
// (MIT): procedural sinusoidal line patterns projected triplanar-ally onto the
// surface (texCube), tonal LAYERING that multiplies in extra cross directions as
// a pixel darkens past thresholds, and a color-burn blend of ink over paper. No
// texture stack — it's all analytic.
//
// Adapted to the DOOM G-buffer by Claude:
//  - Tone comes from the real shaded scene luma (iColor0), so DOOM's own
//    distance/sector lighting drives hatch density.
//  - DOOM surfaces are flat-lit, so a wall would hatch at one monotone density.
//    We add an ARTIFICIAL key light + a camera headlamp (angle + distance) off
//    the G-buffer normal/world-pos to give flat surfaces form and variation.
//  - Sprites are flat billboards: we fake a domed normal from the sprite UV
//    (iUV0) so they hatch like rounded volumes instead of flat cards.
export const crosshatch: PostEffect = {
  name: 'crosshatch',
  author: 'thespite (Jaume Sanchez Elias)',
  authorUrl: 'https://spite.github.io/sketch/',
  src: 'https://github.com/spite/sketch/tree/master/cross-hatch-viii',
  license: 'MIT',
  licenseUrl: 'https://github.com/spite/sketch/blob/master/LICENSE',
  hidden: true,
  wgsl: `
fn luma3(c: vec3f) -> f32 { return dot(c, vec3f(0.299, 0.587, 0.114)); }
// Tone source: a small blur of scene luma. DOOM's floor/ceiling textures shimmer
// per-pixel at grazing angles; sampling raw luma makes the hatch thresholds flip
// pixel-to-pixel (salt-and-pepper). Averaging a few taps smooths the density.
fn sceneLuma(uv: vec2f) -> f32 {
  let px = 1.4 / U.iResolution.xy;
  var s = luma3(iColor0(uv).rgb) * 2.0;
  s = s + luma3(iColor0(uv + vec2f( px.x,  px.y)).rgb);
  s = s + luma3(iColor0(uv + vec2f(-px.x,  px.y)).rgb);
  s = s + luma3(iColor0(uv + vec2f( px.x, -px.y)).rgb);
  s = s + luma3(iColor0(uv + vec2f(-px.x, -px.y)).rgb);
  return s / 6.0;
}
fn rot2(p: vec2f, a: f32) -> vec2f { let c = cos(a); let s = sin(a); return vec2f(p.x * c - p.y * s, p.x * s + p.y * c); }
// One set of thin parallel ink strokes, returned as PAPER-ness (1 = paper, 0 =
// ink at a stroke centre). A thin anti-aliased line (distance-to-centre vs the
// pixel footprint fwidth) rather than a 50%-duty sine, so it reads as pen strokes
// instead of fat bands. When a pixel spans more than a stroke (grazing / far) the
// smoothstep naturally widens and the strokes fade to light tone — free LOD, no
// aliasing.
fn hpattern(qr: vec2f, angle: f32) -> f32 {
  let c = rot2(qr, angle);
  let x = c.y * 0.15915494;                                // /2pi: one stroke per unit
  let dc = min(fract(x), 1.0 - fract(x));                  // 0 at a stroke centre, 0.5 between
  let w = fwidth(x) + 1e-4;
  return smoothstep(0.09 - w, 0.09 + w, dc);               // thin ink line, AA + LOD fade
}
// Project the line pattern on the three world planes, weighted by the squared
// normal — strokes lie ON the surface (thespite's texCube).
fn texCube(p: vec3f, angle: f32, n: vec3f) -> f32 {
  let v = vec3f(hpattern(p.yz, angle), hpattern(p.zx, angle), hpattern(p.xy, angle));
  return dot(v, n * n);
}
fn burn1(base: f32, blend: f32) -> f32 { if (blend <= 0.0) { return 0.0; } return max(1.0 - (1.0 - base) / blend, 0.0); }
fn colorBurn(base: vec3f, blend: vec3f, opacity: f32) -> vec3f {
  let b = vec3f(burn1(base.x, blend.x), burn1(base.y, blend.y), burn1(base.z, blend.z));
  return mix(base, b, opacity);
}

fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let grain = iChan(iNoiseValue, fragCoord / 512.0).r;
  let paper = vec3f(0.94, 0.92, 0.86) * (0.93 + 0.07 * grain);
  let ink = vec3f(0.06, 0.07, 0.10);

  let d = iDepth0(uv);
  let P = iWorldPos(uv);
  var N = normalize(iNormal0(uv));
  N = N * select(1.0, -1.0, dot(N, normalize(U.iCamPos - P)) < 0.0);

  // Sprites are flat billboards; fake a domed normal from the sprite UV so they
  // hatch like rounded volumes (centre faces the camera, edges bow away).
  var Nsh = N;
  if (iSprite(uv) > 0.5) {
    let pc = (iUV0(uv) - vec2f(0.5, 0.5)) * 2.0;
    let z = sqrt(max(0.0, 1.0 - dot(pc, pc)));
    Nsh = normalize(U.iCamRight * pc.x - U.iCamUp * pc.y - U.iCamFwd * z);
  }

  // DOOM shades per-sector/-distance, so a flat wall is one tone -> one hatch
  // density. Add an artificial key light + a camera headlamp (angle + distance
  // falloff) so different-facing surfaces and nearer spots read lighter.
  let key = normalize(vec3f(0.5, 0.8, 0.35));
  let kL = max(dot(Nsh, key), 0.0);
  let toEye = U.iCamPos - P;
  let dist = length(toEye);
  let L = toEye / max(dist, 0.001);
  let head = max(dot(Nsh, L), 0.0) * clamp(1.0 - dist / 1400.0, 0.0, 1.0);
  // Brightness is the real scene tone PLUS additive artificial light, so lit /
  // near / camera-facing surfaces read lighter (fewer strokes) and shaded ones
  // stay dense — flat DOOM walls stop being one uniform field.
  let scn = sceneLuma(uv);
  let b = clamp(0.12 + 0.62 * scn + 0.24 * kL + 0.30 * head, 0.0, 1.0);
  let l = min(1.0 - b, 0.82);                             // ink density (capped: never solid black)

  // Layered procedural hatch: add a cross direction each time the tone crosses a
  // darker threshold; pow() fades each layer in smoothly near its threshold.
  // Frequency is compensated by depth so stroke spacing stays ~constant in screen
  // space instead of aliasing to noise at distance.
  // All three layers are evaluated unconditionally (uniform control flow, so the
  // band-limiting derivatives are legal); tone gates how strongly each darkens.
  let TAU = 6.28318530718;
  let angle = 1.45;
  let coords = P * 0.12;                                 // fixed world-space stroke spacing
  let h0 = texCube(coords, angle, Nsh);
  let h1 = texCube(2.0 * coords, angle - TAU / 8.0, Nsh);
  let h2 = texCube(2.0 * coords, angle + TAU / 8.0, Nsh);
  // Multiply the layers' paper-ness: darker tone activates more cross directions,
  // each stamping thin ink strokes onto the paper.
  var line = 1.0;
  line = line * mix(1.0, h0, smoothstep(0.12, 0.28, l));
  line = line * mix(1.0, h1, smoothstep(0.42, 0.58, l));
  line = line * mix(1.0, h2, smoothstep(0.72, 0.88, l));
  var col = colorBurn(paper, ink, 1.0 - line);

  // Ink outline from G-buffer depth + normal discontinuities (silhouettes and
  // creases) — the same detector as the outline effect, drawn over the hatch.
  let px = 2.0 / U.iResolution.xy;
  let d0 = iDepth0(uv);
  let n0 = normalize(iNormal0(uv));
  var e = 0.0;
  var offs = array(vec2f(px.x, 0.0), vec2f(-px.x, 0.0), vec2f(0.0, px.y), vec2f(0.0, -px.y));
  for (var i = 0; i < 4; i = i + 1) {
    e = e + abs(iDepth0(uv + offs[i]) - d0) / max(d0, 1.0);
    e = e + (1.0 - clamp(dot(normalize(iNormal0(uv + offs[i])), n0), 0.0, 1.0));
  }
  col = mix(col, ink, smoothstep(0.55, 1.1, e));

  if (iDepth01(uv) >= 0.999) { col = paper; }             // sky / far = blank paper
  if (d < 1.0) { col = iColor0(uv).rgb; }                 // UI / weapon: leave alone
  return vec4f(col, 1.0);
}`,
  glsl: `
float luma3(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
// Blurred scene luma for tone (see WGSL note): smooths grazing-angle texture
// shimmer so the hatch density doesn't flip pixel-to-pixel.
float sceneLuma(vec2 uv) {
  vec2 px = 1.4 / iResolution.xy;
  float s = luma3(iColor0(uv).rgb) * 2.0;
  s += luma3(iColor0(uv + vec2( px.x,  px.y)).rgb);
  s += luma3(iColor0(uv + vec2(-px.x,  px.y)).rgb);
  s += luma3(iColor0(uv + vec2( px.x, -px.y)).rgb);
  s += luma3(iColor0(uv + vec2(-px.x, -px.y)).rgb);
  return s / 6.0;
}
vec2 rot2(vec2 p, float a) { float c = cos(a); float s = sin(a); return vec2(p.x * c - p.y * s, p.x * s + p.y * c); }
// Thin ink stroke as paper-ness (see WGSL note): distance-to-centre vs pixel
// footprint, so strokes stay thin and fade to light tone when under-sampled.
float hpattern(vec2 qr, float angle) {
  vec2 c = rot2(qr, angle);
  float x = c.y * 0.15915494;                              // /2pi: one stroke per unit
  float dc = min(fract(x), 1.0 - fract(x));                // 0 at a stroke centre, 0.5 between
  float w = fwidth(x) + 1e-4;
  return smoothstep(0.09 - w, 0.09 + w, dc);
}
float texCube(vec3 p, float angle, vec3 n) {
  vec3 v = vec3(hpattern(p.yz, angle), hpattern(p.zx, angle), hpattern(p.xy, angle));
  return dot(v, n * n);
}
float burn1(float base, float blend) { return (blend <= 0.0) ? 0.0 : max(1.0 - (1.0 - base) / blend, 0.0); }
vec3 colorBurn(vec3 base, vec3 blend, float opacity) {
  vec3 b = vec3(burn1(base.r, blend.r), burn1(base.g, blend.g), burn1(base.b, blend.b));
  return mix(base, b, opacity);
}

void mainImage(out vec4 fragColor, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  float grain = iChan(iNoiseValue, fc / 512.0).r;
  vec3 paper = vec3(0.94, 0.92, 0.86) * (0.93 + 0.07 * grain);
  vec3 ink = vec3(0.06, 0.07, 0.10);

  float d = iDepth0(uv);
  vec3 P = iWorldPos(uv);
  vec3 N = normalize(iNormal0(uv));
  if (dot(N, normalize(iCamPos - P)) < 0.0) N = -N;

  vec3 Nsh = N;
  if (iSprite(uv) > 0.5) {
    vec2 pc = (iUV0(uv) - vec2(0.5)) * 2.0;
    float z = sqrt(max(0.0, 1.0 - dot(pc, pc)));
    Nsh = normalize(iCamRight * pc.x - iCamUp * pc.y - iCamFwd * z);
  }

  vec3 key = normalize(vec3(0.5, 0.8, 0.35));
  float kL = max(dot(Nsh, key), 0.0);
  vec3 toEye = iCamPos - P;
  float dist = length(toEye);
  vec3 L = toEye / max(dist, 0.001);
  float head = max(dot(Nsh, L), 0.0) * clamp(1.0 - dist / 1400.0, 0.0, 1.0);
  float scn = sceneLuma(uv);
  float b = clamp(0.12 + 0.62 * scn + 0.24 * kL + 0.30 * head, 0.0, 1.0);
  float l = min(1.0 - b, 0.82);

  float TAU = 6.28318530718;
  float angle = 1.45;
  vec3 coords = P * 0.12;
  float h0 = texCube(coords, angle, Nsh);
  float h1 = texCube(2.0 * coords, angle - TAU / 8.0, Nsh);
  float h2 = texCube(2.0 * coords, angle + TAU / 8.0, Nsh);
  float line = 1.0;
  line *= mix(1.0, h0, smoothstep(0.12, 0.28, l));
  line *= mix(1.0, h1, smoothstep(0.42, 0.58, l));
  line *= mix(1.0, h2, smoothstep(0.72, 0.88, l));
  vec3 col = colorBurn(paper, ink, 1.0 - line);

  // Ink outline from G-buffer depth + normal discontinuities (silhouettes/creases).
  vec2 px = 2.0 / iResolution.xy;
  float d0 = iDepth0(uv);
  vec3 n0 = normalize(iNormal0(uv));
  vec2 offs[4];
  offs[0] = vec2(px.x, 0.0); offs[1] = vec2(-px.x, 0.0);
  offs[2] = vec2(0.0, px.y); offs[3] = vec2(0.0, -px.y);
  float e = 0.0;
  for (int i = 0; i < 4; i++) {
    e += abs(iDepth0(uv + offs[i]) - d0) / max(d0, 1.0);
    e += 1.0 - clamp(dot(normalize(iNormal0(uv + offs[i])), n0), 0.0, 1.0);
  }
  col = mix(col, ink, smoothstep(0.55, 1.1, e));

  if (iDepth01(uv) >= 0.999) col = paper;
  if (d < 1.0) col = iColor0(uv).rgb;
  fragColor = vec4(col, 1.0);
}`,
};
