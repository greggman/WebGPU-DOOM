import type { PostEffect } from './effect.js';

export const cmykHalftone: PostEffect = {
  name: 'CMYK Halftone',
  author: 'tsone',
  authorUrl: 'https://www.shadertoy.com/user/tsone',
  src: 'https://www.shadertoy.com/view/Mdf3Dn',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn rgb2cmyki(c: vec3f) -> vec4f {
  let k = max(max(c.r, c.g), c.b);
  return min(vec4f(c / k, k), vec4f(1.0));
}
fn cmyki2rgb(c: vec4f) -> vec3f { return c.rgb * c.a; }
fn grid(px: vec2f, S: f32) -> vec2f { return px - fmod2(px, vec2f(S)); }
fn ss4(v: vec4f) -> vec4f { return smoothstep(vec4f(0.888 - 0.288), vec4f(0.888 + 0.288), v); }
fn rotm(r: f32) -> mat2x2f {
  let cr = cos(r); let sr = sin(r);
  return mat2x2f(cr, -sr, sr, cr);
}
fn halftone(fc: vec2f, m: mat2x2f, S: f32) -> vec4f {
  let ORIGIN = 0.5 * U.iResolution.xy;
  let smp = (grid(m * fc, S) + 0.5*S) * m;
  let s = min(length(fc - smp) / (1.48 * 0.5 * S), 1.0);  // DOTSIZE 1.48
  var texc = iColor0((smp + ORIGIN) / U.iResolution.xy).rgb;
  texc = pow(texc, vec3f(2.2));                            // gamma decode
  return rgb2cmyki(texc) + s;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let SPEED = 0.57; let MIN_S = 2.5; let MAX_S = 19.0;
  let ORIGIN = 0.5 * U.iResolution.xy;
  var R = SPEED * 0.333 * U.iTime;
  var S = MIN_S + (MAX_S - MIN_S) * (0.5 - 0.5*cos(SPEED*U.iTime));
  if (U.iMouse.z > 0.5) {
    S = MIN_S + (MAX_S - MIN_S) * 2.0 * abs(U.iMouse.x - ORIGIN.x) / U.iResolution.x;
    R = radians(180.0 * (U.iMouse.y - ORIGIN.y) / U.iResolution.y);
  }
  let fc = fragCoord - ORIGIN;
  let c = cmyki2rgb(ss4(vec4f(
    halftone(fc, rotm(R + radians(15.0)), S).r,
    halftone(fc, rotm(R + radians(75.0)), S).g,
    halftone(fc, rotm(R), S).b,
    halftone(fc, rotm(R + radians(45.0)), S).a)));
  return vec4f(pow(c, vec3f(1.0 / 2.2)), 1.0);              // gamma encode
}`,
  glsl: `
#define DOTSIZE 1.48
#define D2R(d) radians(d)
#define MIN_S 2.5
#define MAX_S 19.0
#define SPEED 0.57
#define SST 0.888
#define SSQ 0.288
#define ORIGIN (0.5 * iResolution.xy)
float R;
float S;
vec4 rgb2cmyki(in vec3 c) {
  float k = max(max(c.r, c.g), c.b);
  return min(vec4(c.rgb / k, k), 1.0);
}
vec3 cmyki2rgb(in vec4 c) { return c.rgb * c.a; }
vec2 px2uv(in vec2 px) { return vec2(px / iResolution.xy); }
vec2 grid(in vec2 px) { return px - mod(px,S); }
vec4 ss(in vec4 v) { return smoothstep(SST-SSQ, SST+SSQ, v); }
vec4 halftone(in vec2 fc,in mat2 m) {
  vec2 smp = (grid(m*fc) + 0.5*S) * m;
  float s = min(length(fc-smp) / (DOTSIZE*0.5*S), 1.0);
  vec3 texc = texture2D(iChannel0, px2uv(smp+ORIGIN)).rgb;
  texc = pow(texc, vec3(2.2));
  vec4 c = rgb2cmyki(texc);
  return c+s;
}
mat2 rotm(in float r) {
  float cr = cos(r); float sr = sin(r);
  return mat2(cr,-sr, sr,cr);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  R = SPEED*0.333*iTime;
  S = MIN_S + (MAX_S-MIN_S) * (0.5 - 0.5*cos(SPEED*iTime));
  if (iMouse.z > 0.5) {
    S = MIN_S + (MAX_S-MIN_S) * 2.0*abs(iMouse.x-ORIGIN.x) / iResolution.x;
    R = D2R(180.0 * (iMouse.y-ORIGIN.y) / iResolution.y);
  }
  vec2 fc = fragCoord.xy - ORIGIN;
  mat2 mc = rotm(R + D2R(15.0));
  mat2 mm = rotm(R + D2R(75.0));
  mat2 my = rotm(R);
  mat2 mk = rotm(R + D2R(45.0));
  vec3 c = cmyki2rgb(ss(vec4(
    halftone(fc, mc).r, halftone(fc, mm).g,
    halftone(fc, my).b, halftone(fc, mk).a
  )));
  c = pow(c, vec3(1.0/2.2));
  fragColor = vec4(c, 1.0);
}`,
};
