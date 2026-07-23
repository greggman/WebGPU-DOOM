import type { PostEffect } from './effect.js';

// The original reads per-pixel offsets from a repeating white-noise texture
// (iChannel1) and uses them to smear/jitter the image — the analogue-TV wobble.
// We removed it once because the WGSL port faked the noise with a smooth value-
// noise hash (wrong look) and the GLSL still wanted an iChannel1 that was never
// bound (broken on WebGL2). Restored here using our built-in mipmapped white
// noise (iNoiseRGBA) via iChan on BOTH backends, so it matches the original's
// texture lookup with no external file.
export const oldTVEffect: PostEffect = {
  name: 'Old TV effect',
  author: 'mackycheese21',
  authorUrl: 'https://www.shadertoy.com/user/mackycheese21',
  src: 'https://www.shadertoy.com/view/XldcDf',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn luma4(c: vec4f) -> f32 { return 0.2126*c.x + 0.7152*c.y + 0.0722*c.z; }
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  var sum = vec4f(0.0);
  var num = 0.0;
  for (var i = 0; i < 3; i = i + 1) {
    let fi = f32(i);
    let np = vec2f(uv.x*124.5523 + 5230.354323*U.iTime + 2523.254*fi,
                   uv.y*0.5364 + 624.667*U.iTime + 2523.789*fi);
    // iChan auto-mips the wildly-varying coord, so the offset stays locally
    // COHERENT: neighbouring pixels shift together and the image survives with a
    // rolling wobble instead of dissolving into snow.
    var offset = iChan(iNoiseRGBA, fract(np)).xy - 0.5;
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
    vec2 np=vec2(uv.x*124.5523+5230.354323*iTime+2523.254*float(i),uv.y*.5364+624.667*iTime+2523.789*float(i));
    vec2 offset=iChan(iNoiseRGBA, fract(np)).xy;
    offset-=0.5;
    offset*=1.9;
    sum+=vec4(luma(iColor0(uv+offset)));
    num++;
  }
  fragColor=sum/num;
}`,
};
