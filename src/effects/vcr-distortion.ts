import type { PostEffect } from './effect.js';

// The original samples a repeating noise texture (iChannel1); the WGSL port
// replaces it with a value-noise hash so no extra texture is needed.
export const vcrDistortion: PostEffect = {
  name: 'VCR distortion',
  author: 'ryk',
  authorUrl: 'https://www.shadertoy.com/user/ryk',
  src: 'https://www.shadertoy.com/view/ldjGzV',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn hash21(p: vec2f) -> f32 { return fract(sin(dot(p, vec2f(12.9898, 78.233))) * 43758.5453); }
fn vnoise(p: vec2f) -> f32 {
  let i = floor(p); let f = fract(p);
  let u = f*f*(3.0 - 2.0*f);
  return mix(mix(hash21(i), hash21(i+vec2f(1.0,0.0)), u.x),
             mix(hash21(i+vec2f(0.0,1.0)), hash21(i+vec2f(1.0,1.0)), u.x), u.y);
}
fn noise(p: vec2f) -> f32 {
  var s = vnoise(vec2f(1.0, 2.0*cos(U.iTime))*U.iTime*8.0 + p);
  s = s*s;
  return s;
}
fn onOff(a: f32, b: f32, c: f32) -> f32 { return step(c, sin(U.iTime + a*cos(U.iTime*b))); }
fn ramp(y: f32, start: f32, end: f32) -> f32 {
  let inside = step(start, y) - step(end, y);
  let fact = (y - start) / (end - start) * inside;
  return (1.0 - fact) * inside;
}
fn stripes(uv: vec2f) -> f32 {
  let noi = noise(uv*vec2f(0.5, 1.0) + vec2f(1.0, 3.0));
  return ramp(fmod(uv.y*4.0 + U.iTime/2.0 + sin(U.iTime + sin(U.iTime*0.63)), 1.0), 0.5, 0.6) * noi;
}
fn getVideo(uv0: vec2f) -> vec3f {
  var look = uv0;
  let window = 1.0 / (1.0 + 20.0*(look.y - fmod(U.iTime/4.0, 1.0))*(look.y - fmod(U.iTime/4.0, 1.0)));
  look.x = look.x + sin(look.y*10.0 + U.iTime)/50.0 * onOff(4.0,4.0,0.3) * (1.0 + cos(U.iTime*80.0)) * window;
  let vShift = 0.4*onOff(2.0,3.0,0.9) * (sin(U.iTime)*sin(U.iTime*20.0) + (0.5 + 0.1*sin(U.iTime*200.0)*cos(U.iTime)));
  look.y = fmod(look.y + vShift, 1.0);
  return iColor0(look).rgb;
}
fn screenDistort(uv0: vec2f) -> vec2f {
  var uv = uv0 - vec2f(0.5, 0.5);
  uv = uv*1.2*(1.0/1.2 + 2.0*uv.x*uv.x*uv.y*uv.y);
  uv = uv + vec2f(0.5, 0.5);
  return uv;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  var uv = fragCoord / U.iResolution.xy;
  uv = screenDistort(uv);
  var video = getVideo(uv);
  let vigAmt = 3.0 + 0.3*sin(U.iTime + 5.0*cos(U.iTime*5.0));
  let vignette = (1.0 - vigAmt*(uv.y-0.5)*(uv.y-0.5)) * (1.0 - vigAmt*(uv.x-0.5)*(uv.x-0.5));
  video = video + stripes(uv);
  video = video + noise(uv*2.0)/2.0;
  video = video * vignette;
  video = video * (12.0 + fmod(uv.y*30.0 + U.iTime, 1.0)) / 13.0;
  return vec4f(video, 1.0);
}`,
  glsl: `
float noise(vec2 p) {
  float s = texture2D(iChannel1,vec2(1.,2.*cos(iTime))*iTime*8. + p*1.).x;
  s *= s;
  return s;
}
float onOff(float a, float b, float c) { return step(c, sin(iTime + a*cos(iTime*b))); }
float ramp(float y, float start, float end) {
  float inside = step(start,y) - step(end,y);
  float fact = (y-start)/(end-start)*inside;
  return (1.-fact) * inside;
}
float stripes(vec2 uv) {
  float noi = noise(uv*vec2(0.5,1.) + vec2(1.,3.));
  return ramp(mod(uv.y*4. + iTime/2.+sin(iTime + sin(iTime*0.63)),1.),0.5,0.6)*noi;
}
vec3 getVideo(vec2 uv) {
  vec2 look = uv;
  float window = 1./(1.+20.*(look.y-mod(iTime/4.,1.))*(look.y-mod(iTime/4.,1.)));
  look.x = look.x + sin(look.y*10. + iTime)/50.*onOff(4.,4.,.3)*(1.+cos(iTime*80.))*window;
  float vShift = 0.4*onOff(2.,3.,.9)*(sin(iTime)*sin(iTime*20.) + (0.5 + 0.1*sin(iTime*200.)*cos(iTime)));
  look.y = mod(look.y + vShift, 1.);
  vec3 video = vec3(texture2D(iChannel0,look));
  return video;
}
vec2 screenDistort(vec2 uv) {
  uv -= vec2(.5,.5);
  uv = uv*1.2*(1./1.2+2.*uv.x*uv.x*uv.y*uv.y);
  uv += vec2(.5,.5);
  return uv;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord.xy / iResolution.xy;
  uv = screenDistort(uv);
  vec3 video = getVideo(uv);
  float vigAmt = 3.+.3*sin(iTime + 5.*cos(iTime*5.));
  float vignette = (1.-vigAmt*(uv.y-.5)*(uv.y-.5))*(1.-vigAmt*(uv.x-.5)*(uv.x-.5));
  video += stripes(uv);
  video += noise(uv*2.)/2.;
  video *= vignette;
  video *= (12.+mod(uv.y*30.+iTime,1.))/13.;
  fragColor = vec4(video,1.0);
}`,
};
