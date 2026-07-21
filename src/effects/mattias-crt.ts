import type { PostEffect } from './effect.js';

// Ported to WGSL from the pico-8-post-processing collection; original GLSL kept
// verbatim below for the WebGL2 backend.
export const mattiasCRT: PostEffect = {
  name: 'MattiasCRT',
  author: 'Mattias',
  authorUrl: 'https://www.shadertoy.com/user/Mattias',
  src: 'https://www.shadertoy.com/view/Ms23DR',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn curve(uv0: vec2f) -> vec2f {
  var uv = (uv0 - 0.5) * 2.0;
  uv = uv * 1.1;
  uv.x = uv.x * (1.0 + pow(abs(uv.y) / 5.0, 2.0));
  uv.y = uv.y * (1.0 + pow(abs(uv.x) / 4.0, 2.0));
  uv = uv / 2.0 + 0.5;
  uv = uv * 0.92 + 0.04;
  return uv;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let q = fragCoord / U.iResolution.xy;
  let uv = curve(q);
  let oricol = iColor0(vec2f(q.x, q.y)).xyz;
  var col: vec3f;
  let x = sin(0.3*U.iTime + uv.y*21.0) * sin(0.7*U.iTime + uv.y*29.0) * sin(0.3 + 0.33*U.iTime + uv.y*31.0) * 0.0017;
  col.r = iColor0(vec2f(x+uv.x+0.001, uv.y+0.001)).x + 0.05;
  col.g = iColor0(vec2f(x+uv.x+0.000, uv.y-0.002)).y + 0.05;
  col.b = iColor0(vec2f(x+uv.x-0.002, uv.y+0.000)).z + 0.05;
  col.r += 0.08 * iColor0(0.75*vec2f(x+0.025, -0.027) + vec2f(uv.x+0.001, uv.y+0.001)).x;
  col.g += 0.05 * iColor0(0.75*vec2f(x-0.022, -0.02) + vec2f(uv.x+0.000, uv.y-0.002)).y;
  col.b += 0.08 * iColor0(0.75*vec2f(x-0.02, -0.018) + vec2f(uv.x-0.002, uv.y+0.000)).z;
  col = clamp(col*0.6 + 0.4*col*col, vec3f(0.0), vec3f(1.0));
  let vig = 16.0 * uv.x*uv.y * (1.0-uv.x) * (1.0-uv.y);
  col = col * pow(vig, 0.3);
  col = col * vec3f(0.95, 1.05, 0.95) * 2.8;
  let scans = clamp(0.35 + 0.35*sin(3.5*U.iTime + uv.y*U.iResolution.y*1.5), 0.0, 1.0);
  col = col * (0.4 + 0.7*pow(scans, 1.7));
  col = col * (1.0 + 0.01*sin(110.0*U.iTime));
  if (uv.x < 0.0 || uv.x > 1.0) { col = col * 0.0; }
  if (uv.y < 0.0 || uv.y > 1.0) { col = col * 0.0; }
  col = col * (1.0 - 0.65 * clamp((fmod(fragCoord.x, 2.0) - 1.0) * 2.0, 0.0, 1.0));
  return vec4f(col, 1.0);
}`,
  glsl: `
vec2 curve(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv *= 1.1;
  uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
  uv = (uv / 2.0) + 0.5;
  uv = uv * 0.92 + 0.04;
  return uv;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 q = fragCoord.xy / iResolution.xy;
  vec2 uv = q;
  uv = curve( uv );
  vec3 col;
  float x = sin(0.3*iTime+uv.y*21.0)*sin(0.7*iTime+uv.y*29.0)*sin(0.3+0.33*iTime+uv.y*31.0)*0.0017;
  col.r = texture2D(iChannel0,vec2(x+uv.x+0.001,uv.y+0.001)).x+0.05;
  col.g = texture2D(iChannel0,vec2(x+uv.x+0.000,uv.y-0.002)).y+0.05;
  col.b = texture2D(iChannel0,vec2(x+uv.x-0.002,uv.y+0.000)).z+0.05;
  col.r += 0.08*texture2D(iChannel0,0.75*vec2(x+0.025, -0.027)+vec2(uv.x+0.001,uv.y+0.001)).x;
  col.g += 0.05*texture2D(iChannel0,0.75*vec2(x+-0.022, -0.02)+vec2(uv.x+0.000,uv.y-0.002)).y;
  col.b += 0.08*texture2D(iChannel0,0.75*vec2(x+-0.02, -0.018)+vec2(uv.x-0.002,uv.y+0.000)).z;
  col = clamp(col*0.6+0.4*col*col*1.0,0.0,1.0);
  float vig = (0.0 + 1.0*16.0*uv.x*uv.y*(1.0-uv.x)*(1.0-uv.y));
  col *= vec3(pow(vig,0.3));
  col *= vec3(0.95,1.05,0.95);
  col *= 2.8;
  float scans = clamp( 0.35+0.35*sin(3.5*iTime+uv.y*iResolution.y*1.5), 0.0, 1.0);
  float s = pow(scans,1.7);
  col = col*vec3( 0.4+0.7*s) ;
  col *= 1.0+0.01*sin(110.0*iTime);
  if (uv.x < 0.0 || uv.x > 1.0) col *= 0.0;
  if (uv.y < 0.0 || uv.y > 1.0) col *= 0.0;
  col*=1.0-0.65*vec3(clamp((mod(fragCoord.x, 2.0)-1.0)*2.0,0.0,1.0));
  fragColor = vec4(col,1.0);
}`,
};
