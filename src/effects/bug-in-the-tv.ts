import type { PostEffect } from './effect.js';

// Right-click (iMouse.z) shows the untouched image. All the #define'd sub-effects
// of the original are always on in this port.
export const bugInTheTV: PostEffect = {
  name: "There's a bug in the TV",
  author: 'thiagoborn',
  authorUrl: 'https://www.shadertoy.com/user/thiagoborn',
  src: 'https://www.shadertoy.com/view/WsBGRW',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn rand2d(co: vec2f) -> f32 { return fract(sin(dot(co, vec2f(12.9898, 78.233))) * 43758.5453); }
fn rand1(n: f32) -> f32 { return fract(sin(n) * 43758.5453123); }
fn noise1(p: f32) -> f32 { let fl = floor(p); return mix(rand1(fl), rand1(fl + 1.0), fract(p)); }
fn map1(val: f32, amin: f32, amax: f32, bmin: f32, bmax: f32) -> f32 {
  return bmin + ((val - amin) / (amax - amin)) * (bmax - bmin);
}
fn snoise1(p: f32) -> f32 { return map1(noise1(p), 0.0, 1.0, -1.0, 1.0); }
fn threshold(val: f32, cut: f32) -> f32 {
  var v = clamp(abs(val) - cut, 0.0, 1.0);
  v = sign(val) * v;
  return v * (1.0 / (1.0 - cut));
}
fn uv_curve(uv0: vec2f) -> vec2f {
  var uv = (uv0 - 0.5) * 2.0;
  uv = uv * 1.2;
  uv.x = uv.x * (1.0 + pow(abs(uv.y)/5.0, 2.0));
  uv.y = uv.y * (1.0 + pow(abs(uv.x)/4.0, 2.0));
  uv = uv / 1.15;
  uv = uv / 2.0 + 0.5;
  return uv;
}
fn colorAt(uv: vec2f) -> vec3f {
  var color = texture0(uv).rgb;
  let bw = (color.r + color.g + color.b) / 3.0;
  color = mix(color, vec3f(bw), 0.95);
  color.r = pow(color.r, 1.5);
  color.g = pow(color.g, 1.4);
  color.b = pow(color.b, 1.5);
  return color;
}
fn ghost(uv: vec2f) -> vec3f {
  let n1 = threshold(snoise1(U.iTime*10.0), 0.85);
  let n2 = threshold(snoise1(2000.0 + U.iTime*10.0), 0.85);
  let n3 = threshold(snoise1(3000.0 + U.iTime*10.0), 0.85);
  let os = 0.05;
  let r = colorAt(uv + vec2f(n1*os, 0.0)).r;
  let g = colorAt(uv + vec2f(n2*os, 0.0)).g;
  let b = colorAt(uv + vec2f(0.0, n3*os)).b;
  return vec3f(r, g, b);
}
fn uv_ybug(uv0: vec2f) -> vec2f {
  var uv = uv0;
  uv.y = uv.y + clamp(noise1(200.0 + U.iTime*2.0)*14.0, 0.0, 2.0);
  uv.y = fmod(uv.y, 1.0);
  return uv;
}
fn uv_hstrip(uv0: vec2f) -> vec2f {
  var uv = uv0;
  let vn = snoise1(U.iTime*6.0);
  let hn = threshold(snoise1(U.iTime*10.0), 0.5);
  var line = (sin(uv.y*10.0 + vn) + 1.0) / 2.0;
  line = (clamp(line, 0.9, 1.0) - 0.9) * 10.0;
  uv.x = uv.x + line*0.03*hn;
  uv.x = fmod(uv.x, 1.0);
  return uv;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let t = f32(i32(U.iTime * 11.0));
  var uv = fragCoord / U.iResolution.xy;
  if (U.iMouse.z > 0.0) { return texture0(uv); }
  uv = uv_curve(uv);
  let ouv = uv;
  let xn = threshold(snoise1(U.iTime*10.0), 0.7) * 0.05;
  let yn = threshold(snoise1((500.0 + U.iTime)*10.0), 0.7) * 0.05;
  uv = uv + vec2f(xn, yn) * rand2d(uv + (t + 100.0)*0.01);
  uv = uv_ybug(uv);
  uv = uv_hstrip(uv);
  var color = ghost(uv);
  let scanA = (sin(uv.y*3.1415*U.iResolution.y/2.7) + 1.0) / 2.0;
  color = color * (0.75 + scanA*0.25);
  color = color * (0.96 + 0.04*(sin(U.iTime*100.0) + 1.0)/2.0);
  var vig = 44.0 * (ouv.x*(1.0-ouv.x)*ouv.y*(1.0-ouv.y));
  vig = vig * mix(0.7, 1.0, rand1(t + 0.5));
  color = color * (0.6 + 0.4*vig);
  color = color * (1.0 + rand2d(uv + t*0.01)*0.2);
  let backColor = vec3f(0.4, 0.4, 0.4);
  if (ouv.x < 0.0 || ouv.x > 1.0) { color = backColor; }
  if (ouv.y < 0.0 || ouv.y > 1.0) { color = backColor; }
  return vec4f(color, 1.0);
}`,
  glsl: `
float rand2d(vec2 co) { return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
float rand(float n) { return fract(sin(n) * 43758.5453123); }
float noise(float p) { float fl = floor(p); return mix(rand(fl), rand(fl + 1.0), fract(p)); }
float map(float val, float amin, float amax, float bmin, float bmax) {
  float n = (val - amin) / (amax-amin);
  return bmin + n * (bmax-bmin);
}
float snoise(float p){ return map(noise(p),0.0,1.0,-1.0,1.0); }
float threshold(float val,float cut){
  float v = clamp(abs(val)-cut,0.0,1.0);
  v = sign(val) * v;
  return v * (1.0 / (1.0 - cut));
}
float FREQUENCY = 11.0;
vec2 uv_curve(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv *= 1.2;
  uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
  uv /= 1.15;
  uv = (uv / 2.0) + 0.5;
  return uv;
}
vec3 color(vec2 uv){
  vec3 color = texture2D(iChannel0,uv).rgb;
  float bw = (color.r + color.g + color.b) / 3.0;
  color = mix(color,vec3(bw,bw,bw),.95);
  color.r = pow(color.r,1.5);
  color.g = pow(color.g,1.4);
  color.b = pow(color.b,1.5);
  return color;
}
vec3 ghost(vec2 uv){
  float n1 = threshold(snoise(iTime*10.),.85);
  float n2 = threshold(snoise(2000.0+iTime*10.),.85);
  float n3 = threshold(snoise(3000.0+iTime*10.),.85);
  float os = .05;
  float r = color(uv + vec2(n1*os,0.)).r;
  float g = color(uv + vec2(n2*os,0.)).g;
  float b = color(uv + vec2(0.,n3*os)).b;
  return vec3(r,g,b);
}
vec2 uv_ybug(vec2 uv){
  float n4 = clamp(noise(200.0+iTime*2.)*14.,0.,2.);
  uv.y += n4; uv.y = mod(uv.y,1.);
  return uv;
}
vec2 uv_hstrip(vec2 uv){
  float vnoise = snoise(iTime*6.);
  float hnoise = threshold(snoise(iTime*10.),.5);
  float line = (sin(uv.y*10.+vnoise)+1.)/2.;
  line = (clamp(line,.9,1.)-.9)*10.;
  uv.x += line * 0.03 * hnoise; uv.x = mod(uv.x,1.);
  return uv;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  float t = float(int(iTime * FREQUENCY));
  vec2 uv = fragCoord / iResolution.xy;
  if(iMouse.z>0.){ fragColor = texture2D(iChannel0,uv); return; }
  uv = uv_curve(uv);
  vec2 ouv = uv;
  float xn = threshold(snoise(iTime*10.),.7) * 0.05;
  float yn = threshold(snoise((500.0+iTime)*10.),.7) * 0.05;
  float r = rand2d(uv+(t+100.0)*.01);
  uv = uv + vec2(xn,yn) * r;
  uv = uv_ybug(uv);
  uv = uv_hstrip(uv);
  vec3 color = ghost(uv);
  float scanA = (sin(uv.y*3.1415*iResolution.y/2.7)+1.)/2.;
  color *= .75 + scanA * .25;
  float blink = .96 + .04*(sin(iTime*100.)+1.)/2.;
  color *= blink;
  float vig = 44.0 * (ouv.x * (1.0-ouv.x) * ouv.y * (1.0-ouv.y));
  vig *= mix( 0.7, 1.0, rand(t + 0.5));
  color *= .6 + .4*vig;
  color *= 1.0 + rand2d(uv+t*.01) * 0.2;
  vec3 backColor = vec3(.4,.4,.4);
  if (ouv.x < 0.0 || ouv.x > 1.0) color = backColor;
  if (ouv.y < 0.0 || ouv.y > 1.0) color = backColor;
  fragColor = vec4(color,1.0);
}`,
};
