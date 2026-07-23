import type { PostEffect } from './effect.js';

// 1-bit ordered-dither, à la the classic Macintosh and Lucas Pope's "Return of
// Obra Dinn". The scene luminance is thresholded against an 8x8 Bayer matrix, so
// every pixel resolves to just two ink/paper tones — the whole frame (world,
// sprites, HUD, weapon) is dithered for the full black-and-white look.
//
// (Obra Dinn additionally stabilises its dither against camera motion with
// reprojection; a single post pass can't, so this is screen-space and will
// shimmer a touch in motion — part of the 1-bit charm.)
export const oneBit: PostEffect = {
  name: '1-bit',
  author: 'Claude',
  wgsl: `
fn luma3(c: vec3f) -> f32 { return dot(c, vec3f(0.299, 0.587, 0.114)); }
// Ordered 8x8 Bayer threshold in [0,1), built recursively from the 2x2 pattern.
fn bayer2(a: vec2f) -> f32 { let b = floor(a); return fract(b.x * 0.5 + b.y * b.y * 0.75); }
fn bayer4(a: vec2f) -> f32 { return bayer2(a * 0.5) * 0.25 + bayer2(a); }
fn bayer8(a: vec2f) -> f32 { return bayer4(a * 0.5) * 0.25 + bayer2(a); }
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  var lum = luma3(iColor0(uv).rgb);
  // DOOM's palette is dark; lift the midtones so the dither lands near a 50/50
  // black/white balance instead of mostly black.
  lum = pow(clamp(lum * 1.5, 0.0, 1.0), 0.55);

  let bit = select(0.0, 1.0, lum > bayer8(fragCoord));
  let ink   = vec3f(0.07, 0.07, 0.09);
  let paper = vec3f(0.93, 0.91, 0.85);
  return vec4f(mix(ink, paper, bit), 1.0);
}`,
  glsl: `
float luma3(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
float bayer2(vec2 a) { vec2 b = floor(a); return fract(b.x * 0.5 + b.y * b.y * 0.75); }
float bayer4(vec2 a) { return bayer2(a * 0.5) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(a * 0.5) * 0.25 + bayer2(a); }
void mainImage(out vec4 fragColor, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  float lum = luma3(iColor0(uv).rgb);
  lum = pow(clamp(lum * 1.5, 0.0, 1.0), 0.55);

  float bit = lum > bayer8(fc) ? 1.0 : 0.0;
  vec3 ink   = vec3(0.07, 0.07, 0.09);
  vec3 paper = vec3(0.93, 0.91, 0.85);
  fragColor = vec4(mix(ink, paper, bit), 1.0);
}`,
};
