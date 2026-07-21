// Original effects written for webgpu-doom. Screen-space only (iChannel0). WGSL
// for WebGPU, GLSL (ES 3.00, via the harness's texture2D shim) for WebGL2.

import type { PostEffect } from './effect.js';

export const blueprint: PostEffect = {
  name: 'blueprint',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn luma(uv: vec2f) -> f32 { return dot(iColor0(uv).rgb, vec3f(0.299, 0.587, 0.114)); }
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let px = 1.0 / U.iResolution.xy;
  let gx = luma(uv + vec2f(px.x, 0.0)) - luma(uv - vec2f(px.x, 0.0));
  let gy = luma(uv + vec2f(0.0, px.y)) - luma(uv - vec2f(0.0, px.y));
  let e = clamp(length(vec2f(gx, gy)) * 4.0, 0.0, 1.0);
  return vec4f(mix(vec3f(0.05, 0.15, 0.40), vec3f(0.6, 0.8, 1.0), e), 1.0);
}`,
  glsl: `
float luma(vec2 uv) { return dot(texture2D(iChannel0, uv).rgb, vec3(0.299, 0.587, 0.114)); }
void mainImage(out vec4 c, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  vec2 px = 1.0 / iResolution.xy;
  float gx = luma(uv + vec2(px.x, 0.0)) - luma(uv - vec2(px.x, 0.0));
  float gy = luma(uv + vec2(0.0, px.y)) - luma(uv - vec2(0.0, px.y));
  float e = clamp(length(vec2(gx, gy)) * 4.0, 0.0, 1.0);
  c = vec4(mix(vec3(0.05, 0.15, 0.40), vec3(0.6, 0.8, 1.0), e), 1.0);
}`,
};

export const crt: PostEffect = {
  name: 'crt',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  var uv = fragCoord / U.iResolution.xy * 2.0 - 1.0;
  let off = abs(uv.yx) / vec2f(5.0, 4.0);
  uv = uv + uv * off * off;                      // barrel curvature
  uv = uv * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { return vec4f(0.0, 0.0, 0.0, 1.0); }
  let r = iColor0(uv + vec2f(0.0012, 0.0)).r;
  let g = iColor0(uv).g;
  let b = iColor0(uv - vec2f(0.0012, 0.0)).b;
  var c = vec3f(r, g, b);
  c = c * (0.85 + 0.15 * sin(uv.y * U.iResolution.y * 3.14159));       // scanlines
  c = c * (0.9 + 0.1 * sin(fragCoord.x * 3.14159 * 0.5));             // aperture grille
  let vig = uv * (1.0 - uv.yx);
  c = c * pow(vig.x * vig.y * 18.0, 0.20);                            // vignette
  return vec4f(c, 1.0);
}`,
  glsl: `
void mainImage(out vec4 col, in vec2 fc) {
  vec2 uv = fc / iResolution.xy * 2.0 - 1.0;
  vec2 off = abs(uv.yx) / vec2(5.0, 4.0);
  uv = uv + uv * off * off;
  uv = uv * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) { col = vec4(0.0, 0.0, 0.0, 1.0); return; }
  float r = texture2D(iChannel0, uv + vec2(0.0012, 0.0)).r;
  float g = texture2D(iChannel0, uv).g;
  float b = texture2D(iChannel0, uv - vec2(0.0012, 0.0)).b;
  vec3 c = vec3(r, g, b);
  c *= 0.85 + 0.15 * sin(uv.y * iResolution.y * 3.14159);
  c *= 0.9 + 0.1 * sin(fc.x * 3.14159 * 0.5);
  vec2 vig = uv * (1.0 - uv.yx);
  c *= pow(vig.x * vig.y * 18.0, 0.20);
  col = vec4(c, 1.0);
}`,
};

export const vhs: PostEffect = {
  name: 'vhs',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn hash(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453); }
fn mainImage(fragCoord: vec2f) -> vec4f {
  var uv = fragCoord / U.iResolution.xy;
  let line = floor(uv.y * U.iResolution.y);
  uv.x = uv.x + (hash(vec2f(line, floor(U.iTime * 24.0))) - 0.5) * 0.006;  // per-line jitter
  let r = iColor0(uv + vec2f(0.004, 0.0)).r;
  let g = iColor0(uv).g;
  let b = iColor0(uv - vec2f(0.004, 0.0)).b;
  var c = vec3f(r, g, b);
  c = c + (hash(uv * U.iResolution.xy + U.iTime) - 0.5) * 0.14;            // static
  c = c + sin(uv.y * 3.0 - U.iTime * 2.0) * 0.03;                         // rolling band
  return vec4f(c, 1.0);
}`,
  glsl: `
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void mainImage(out vec4 col, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  float line = floor(uv.y * iResolution.y);
  uv.x += (hash(vec2(line, floor(iTime * 24.0))) - 0.5) * 0.006;
  float r = texture2D(iChannel0, uv + vec2(0.004, 0.0)).r;
  float g = texture2D(iChannel0, uv).g;
  float b = texture2D(iChannel0, uv - vec2(0.004, 0.0)).b;
  vec3 c = vec3(r, g, b);
  c += (hash(uv * iResolution.xy + iTime) - 0.5) * 0.14;
  c += sin(uv.y * 3.0 - iTime * 2.0) * 0.03;
  col = vec4(c, 1.0);
}`,
};

export const halftone: PostEffect = {
  name: 'halftone',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  let scale = 5.0;
  let cell = (floor(fragCoord / scale) + 0.5) * scale;
  let c = iColor0(cell / U.iResolution.xy).rgb;
  let l = dot(c, vec3f(0.299, 0.587, 0.114));
  let d = length(fragCoord - cell) / (scale * 0.5);
  return vec4f(select(vec3f(1.0), c, d < (1.0 - l) * 1.3), 1.0);          // ink dots on paper
}`,
  glsl: `
void mainImage(out vec4 col, in vec2 fc) {
  float scale = 5.0;
  vec2 cell = (floor(fc / scale) + 0.5) * scale;
  vec3 c = texture2D(iChannel0, cell / iResolution.xy).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  float d = length(fc - cell) / (scale * 0.5);
  col = vec4(d < (1.0 - l) * 1.3 ? c : vec3(1.0), 1.0);
}`,
};

export const grayscale: PostEffect = {
  name: 'grayscale',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  let l = dot(iColor0(fragCoord / U.iResolution.xy).rgb, vec3f(0.299, 0.587, 0.114));
  return vec4f(vec3f(pow(l, 0.8)), 1.0);                                  // whites wash out
}`,
  glsl: `
void mainImage(out vec4 col, in vec2 fc) {
  float l = dot(texture2D(iChannel0, fc / iResolution.xy).rgb, vec3(0.299, 0.587, 0.114));
  col = vec4(vec3(pow(l, 0.8)), 1.0);
}`,
};

export const posterize: PostEffect = {
  name: 'posterize',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  let n = 5.0;
  return vec4f(floor(iColor0(fragCoord / U.iResolution.xy).rgb * n + 0.5) / n, 1.0);
}`,
  glsl: `
void mainImage(out vec4 col, in vec2 fc) {
  float n = 5.0;
  col = vec4(floor(texture2D(iChannel0, fc / iResolution.xy).rgb * n + 0.5) / n, 1.0);
}`,
};

export const pixelate: PostEffect = {
  name: 'pixelate',
  author: 'Claude',
  license: 'MIT',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  let px = 6.0;
  return vec4f(iColor0((floor(fragCoord / px) + 0.5) * px / U.iResolution.xy).rgb, 1.0);
}`,
  glsl: `
void mainImage(out vec4 col, in vec2 fc) {
  float px = 6.0;
  col = vec4(texture2D(iChannel0, (floor(fc / px) + 0.5) * px / iResolution.xy).rgb, 1.0);
}`,
};
