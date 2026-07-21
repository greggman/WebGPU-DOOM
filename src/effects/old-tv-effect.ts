import type { PostEffect } from './effect.js';

// The original reads offsets from a repeating noise texture (iChannel1); the WGSL
// port uses a 2-channel value-noise hash instead.
export const oldTVEffect: PostEffect = {
  name: 'Old TV effect',
  author: 'mackycheese21',
  authorUrl: 'https://www.shadertoy.com/user/mackycheese21',
  src: 'https://www.shadertoy.com/view/XldcDf',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn hash22(p: vec2f) -> vec2f {
  return fract(sin(vec2f(dot(p, vec2f(127.1, 311.7)), dot(p, vec2f(269.5, 183.3)))) * 43758.5453);
}
fn vnoise2(p: vec2f) -> vec2f {
  let i = floor(p); let f = fract(p);
  let u = f*f*(3.0 - 2.0*f);
  return mix(mix(hash22(i), hash22(i+vec2f(1.0,0.0)), u.x),
             mix(hash22(i+vec2f(0.0,1.0)), hash22(i+vec2f(1.0,1.0)), u.x), u.y);
}
fn luma4(c: vec4f) -> f32 { return 0.2126*c.x + 0.7152*c.y + 0.0722*c.z; }
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  var sum = vec4f(0.0);
  var num = 0.0;
  for (var i = 0; i < 3; i = i + 1) {
    let fi = f32(i);
    let np = vec2f(uv.x*124.5523 + 5230.354323*U.iTime + 2523.254*fi,
                   uv.y*0.5364 + 624.667*U.iTime + 2523.789*fi);
    var offset = vnoise2(np) - 0.5;
    offset = offset * 1.9;
    sum = sum + vec4f(luma4(iColor0(uv + offset)));
    num = num + 1.0;
  }
  return sum / num;
}`,
  glsl: `
float luma(vec4 color){
  return 0.2126*color.x+0.7152*color.y+0.0722*color.z;
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv=fragCoord.xy/iResolution.xy;
  vec4 sum=vec4(0.0);
  float num=0.0;
  for(int i=0;i<3;i++){
    vec2 offset=texture2D(iChannel1,mod(vec2(uv.x*124.5523+5230.354323*iTime+2523.254*float(i),uv.y*.5364+624.667*iTime+2523.789*float(i)),1.0)).xy;
    offset-=0.5;
    offset*=1.9;
    sum+=vec4(luma(texture2D(iChannel0,uv+offset)));
    num++;
  }
  fragColor=sum/num;
}`,
};
