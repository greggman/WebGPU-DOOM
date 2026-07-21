import type { PostEffect } from './effect.js';

export const distortedTV: PostEffect = {
  name: 'Distorted TV',
  author: 'ehj1',
  authorUrl: 'https://www.shadertoy.com/user/ehj1',
  src: 'https://www.shadertoy.com/view/ldXGW4',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn mod289_3(x: vec3f) -> vec3f { return x - floor(x * (1.0/289.0)) * 289.0; }
fn mod289_2(x: vec2f) -> vec2f { return x - floor(x * (1.0/289.0)) * 289.0; }
fn permute3(x: vec3f) -> vec3f { return mod289_3(((x*34.0)+1.0)*x); }
fn snoise(v: vec2f) -> f32 {
  let C = vec4f(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  var i = floor(v + dot(v, C.yy));
  let x0 = v - i + dot(i, C.xx);
  let i1 = select(vec2f(0.0, 1.0), vec2f(1.0, 0.0), x0.x > x0.y);
  var x12 = x0.xyxy + C.xxzz;
  x12 = vec4f(x12.x - i1.x, x12.y - i1.y, x12.z, x12.w);
  i = mod289_2(i);
  let p = permute3(permute3(i.y + vec3f(0.0, i1.y, 1.0)) + i.x + vec3f(0.0, i1.x, 1.0));
  var m = max(0.5 - vec3f(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), vec3f(0.0));
  m = m*m; m = m*m;
  let x = 2.0*fract(p * C.www) - 1.0;
  let h = abs(x) - 0.5;
  let ox = floor(x + 0.5);
  let a0 = x - ox;
  m = m * (1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h));
  var g: vec3f;
  g.x = a0.x*x0.x + h.x*x0.y;
  g.y = a0.y*x12.x + h.y*x12.y;
  g.z = a0.z*x12.z + h.z*x12.w;
  return 130.0 * dot(m, g);
}
fn staticV(uv: vec2f) -> f32 {
  let staticHeight = snoise(vec2f(9.0, U.iTime*1.2+3.0))*0.3 + 5.0;
  let staticAmount = snoise(vec2f(1.0, U.iTime*1.2-6.0))*0.1 + 0.3;
  let staticStrength = snoise(vec2f(-9.75, U.iTime*0.6-3.0))*2.0 + 2.0;
  return (1.0 - step(snoise(vec2f(5.0*pow(U.iTime,2.0)+pow(uv.x*7.0,1.2), pow((fmod(U.iTime,100.0)+100.0)*uv.y*0.3+3.0, staticHeight))), staticAmount)) * staticStrength;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let vertMovementOpt = 1.0; let vertJerkOpt = 1.0; let bottomStaticOpt = 1.0;
  let scalinesOpt = 1.0; let rgbOffsetOpt = 1.0; let horzFuzzOpt = 1.0;
  let fuzzOffset = snoise(vec2f(U.iTime*15.0, uv.y*80.0)) * 0.003;
  let largeFuzzOffset = snoise(vec2f(U.iTime*1.0, uv.y*25.0)) * 0.004;
  let vertMovementOn = (1.0 - step(snoise(vec2f(U.iTime*0.2, 8.0)), 0.4)) * vertMovementOpt;
  let vertJerk = (1.0 - step(snoise(vec2f(U.iTime*1.5, 5.0)), 0.6)) * vertJerkOpt;
  let vertJerk2 = (1.0 - step(snoise(vec2f(U.iTime*5.5, 5.0)), 0.2)) * vertJerkOpt;
  let yOffset = abs(sin(U.iTime)*4.0)*vertMovementOn + vertJerk*vertJerk2*0.3;
  let y = fmod(uv.y + yOffset, 1.0);
  let xOffset = (fuzzOffset + largeFuzzOffset) * horzFuzzOpt;
  var staticVal = 0.0;
  for (var yy = -1.0; yy <= 1.0; yy = yy + 1.0) {
    let maxDist = 5.0 / 200.0;
    let dist = yy / 200.0;
    staticVal = staticVal + staticV(vec2f(uv.x, uv.y + dist)) * (maxDist - abs(dist)) * 1.5;
  }
  staticVal = staticVal * bottomStaticOpt;
  let red   = iColor0(vec2f(uv.x + xOffset - 0.01*rgbOffsetOpt, y)).r + staticVal;
  let green = iColor0(vec2f(uv.x + xOffset, y)).g + staticVal;
  let blue  = iColor0(vec2f(uv.x + xOffset + 0.01*rgbOffsetOpt, y)).b + staticVal;
  var color = vec3f(red, green, blue);
  color = color - sin(uv.y*800.0)*0.04*scalinesOpt;
  return vec4f(color, 1.0);
}`,
  glsl: `
float vertJerkOpt = 1.0; float vertMovementOpt = 1.0; float bottomStaticOpt = 1.0;
float scalinesOpt = 1.0; float rgbOffsetOpt = 1.0; float horzFuzzOpt = 1.0;
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 )) + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
float staticV(vec2 uv) {
  float staticHeight = snoise(vec2(9.0,iTime*1.2+3.0))*0.3+5.0;
  float staticAmount = snoise(vec2(1.0,iTime*1.2-6.0))*0.1+0.3;
  float staticStrength = snoise(vec2(-9.75,iTime*0.6-3.0))*2.0+2.0;
  return (1.0-step(snoise(vec2(5.0*pow(iTime,2.0)+pow(uv.x*7.0,1.2),pow((mod(iTime,100.0)+100.0)*uv.y*0.3+3.0,staticHeight))),staticAmount))*staticStrength;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv =  fragCoord.xy/iResolution.xy;
  float fuzzOffset = snoise(vec2(iTime*15.0,uv.y*80.0))*0.003;
  float largeFuzzOffset = snoise(vec2(iTime*1.0,uv.y*25.0))*0.004;
  float vertMovementOn = (1.0-step(snoise(vec2(iTime*0.2,8.0)),0.4))*vertMovementOpt;
  float vertJerk = (1.0-step(snoise(vec2(iTime*1.5,5.0)),0.6))*vertJerkOpt;
  float vertJerk2 = (1.0-step(snoise(vec2(iTime*5.5,5.0)),0.2))*vertJerkOpt;
  float yOffset = abs(sin(iTime)*4.0)*vertMovementOn+vertJerk*vertJerk2*0.3;
  float y = mod(uv.y+yOffset,1.0);
  float xOffset = (fuzzOffset + largeFuzzOffset) * horzFuzzOpt;
  float staticVal = 0.0;
  for (float yy = -1.0; yy <= 1.0; yy += 1.0) {
    float maxDist = 5.0/200.0;
    float dist = yy/200.0;
    staticVal += staticV(vec2(uv.x,uv.y+dist))*(maxDist-abs(dist))*1.5;
  }
  staticVal *= bottomStaticOpt;
  float red   = texture2D(iChannel0, vec2(uv.x + xOffset -0.01*rgbOffsetOpt,y)).r+staticVal;
  float green = texture2D(iChannel0, vec2(uv.x + xOffset,  y)).g+staticVal;
  float blue  = texture2D(iChannel0, vec2(uv.x + xOffset +0.01*rgbOffsetOpt,y)).b+staticVal;
  vec3 color = vec3(red,green,blue);
  float scanline = sin(uv.y*800.0)*0.04*scalinesOpt;
  color -= scanline;
  fragColor = vec4(color,1.0);
}`,
};
