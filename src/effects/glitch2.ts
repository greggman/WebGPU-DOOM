import type { PostEffect } from './effect.js';

// Chromatic glitch. Uses iMouse.x to scale the glitch amount (drag horizontally).
export const glitch2: PostEffect = {
  name: 'glitch2',
  author: 'Coolok',
  authorUrl: 'https://www.shadertoy.com/user/Coolok',
  src: 'https://www.shadertoy.com/view/4dXBW2',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn sat1(t: f32) -> f32 { return clamp(t, 0.0, 1.0); }
fn remap01(t: f32, a: f32, b: f32) -> f32 { return sat1((t - a) / (b - a)); }
fn linterp(t: f32) -> f32 { return sat1(1.0 - abs(2.0*t - 1.0)); }
fn spectrum_offset(t: f32) -> vec3f {
  let lo = step(t, 0.5);
  let hi = 1.0 - lo;
  let w = linterp(remap01(t, 1.0/6.0, 5.0/6.0));
  let neg_w = 1.0 - w;
  let ret = vec3f(lo, 1.0, hi) * vec3f(neg_w, w, neg_w);
  return pow(ret, vec3f(1.0/2.2));
}
fn rnd(n: vec2f) -> f32 { return fract(sin(dot(n, vec2f(12.9898, 78.233))) * 43758.5453); }
fn mytrunc1(x: f32, levels: f32) -> f32 { return floor(x*levels) / levels; }
fn mytrunc2(x: vec2f, levels: f32) -> vec2f { return floor(x*levels) / levels; }
fn mainImage(fragCoord: vec2f) -> vec4f {
  var uv = fragCoord / U.iResolution.xy;
  let time = fmod(U.iTime*100.0, 32.0) / 110.0;
  let GLITCH = 0.1 + U.iMouse.x / U.iResolution.x;
  let gnm = sat1(GLITCH);
  let rnd0 = rnd(mytrunc2(vec2f(time, time), 6.0));
  let r0 = sat1((1.0-gnm)*0.7 + rnd0);
  let rnd1 = rnd(vec2f(mytrunc1(uv.x, 10.0*r0), time));
  var r1 = 0.5 - 0.5*gnm + rnd1;
  r1 = 1.0 - max(0.0, select(0.9999999, r1, r1 < 1.0));
  let rnd2 = rnd(vec2f(mytrunc1(uv.y, 40.0*r1), time));
  let r2 = sat1(rnd2);
  let rnd3 = rnd(vec2f(mytrunc1(uv.y, 10.0*r0), time));
  let r3 = (1.0 - sat1(rnd3 + 0.8)) - 0.1;
  let pxrnd = rnd(uv + time);
  var ofs = 0.05 * r2 * GLITCH * select(-1.0, 1.0, rnd0 > 0.5);
  ofs = ofs + 0.5*pxrnd*ofs;
  uv.y = uv.y + 0.1*r3*GLITCH;
  let RCP = 1.0 / 20.0;
  var sum = vec4f(0.0);
  var wsum = vec3f(0.0);
  for (var i = 0; i < 20; i = i + 1) {
    let t = f32(i) * RCP;
    uv.x = sat1(uv.x + ofs*t);
    let samplecol = texture0(uv);
    let s = spectrum_offset(t);
    sum = sum + vec4f(samplecol.rgb * s, samplecol.a);
    wsum = wsum + s;
  }
  return vec4f(sum.rgb / wsum, 1.0);
}`,
  glsl: `
float sat( float t ) { return clamp( t, 0.0, 1.0 ); }
vec2 sat( vec2 t ) { return clamp( t, 0.0, 1.0 ); }
float remap  ( float t, float a, float b ) { return sat( (t - a) / (b - a) ); }
float linterp( float t ) { return sat( 1.0 - abs( 2.0*t - 1.0 ) ); }
vec3 spectrum_offset( float t ) {
  vec3 ret;
  float lo = step(t,0.5);
  float hi = 1.0-lo;
  float w = linterp( remap( t, 1.0/6.0, 5.0/6.0 ) );
  float neg_w = 1.0-w;
  ret = vec3(lo,1.0,hi) * vec3(neg_w, w, neg_w);
  return pow( ret, vec3(1.0/2.2) );
}
float rand( vec2 n ) { return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453); }
float mytrunc( float x, float num_levels ) { return floor(x*num_levels) / num_levels; }
vec2 mytrunc( vec2 x, float num_levels ) { return floor(x*num_levels) / num_levels; }
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  vec2 uv = fragCoord.xy / iResolution.xy;
  float time = mod(iTime*100.0, 32.0)/110.0;
  float GLITCH = 0.1 + iMouse.x / iResolution.x;
  float gnm = sat( GLITCH );
  float rnd0 = rand( mytrunc( vec2(time, time), 6.0 ) );
  float r0 = sat((1.0-gnm)*0.7 + rnd0);
  float rnd1 = rand( vec2(mytrunc( uv.x, 10.0*r0 ), time) );
  float r1 = 0.5 - 0.5 * gnm + rnd1;
  r1 = 1.0 - max( 0.0, ((r1<1.0) ? r1 : 0.9999999) );
  float rnd2 = rand( vec2(mytrunc( uv.y, 40.0*r1 ), time) );
  float r2 = sat( rnd2 );
  float rnd3 = rand( vec2(mytrunc( uv.y, 10.0*r0 ), time) );
  float r3 = (1.0-sat(rnd3+0.8)) - 0.1;
  float pxrnd = rand( uv + time );
  float ofs = 0.05 * r2 * GLITCH * ( rnd0 > 0.5 ? 1.0 : -1.0 );
  ofs += 0.5 * pxrnd * ofs;
  uv.y += 0.1 * r3 * GLITCH;
  const int NUM_SAMPLES = 20;
  const float RCP_NUM_SAMPLES_F = 1.0 / float(NUM_SAMPLES);
  vec4 sum = vec4(0.0);
  vec3 wsum = vec3(0.0);
  for( int i=0; i<NUM_SAMPLES; ++i ) {
    float t = float(i) * RCP_NUM_SAMPLES_F;
    uv.x = sat( uv.x + ofs * t );
    vec4 samplecol = texture2D( iChannel0, uv, -10.0 );
    vec3 s = spectrum_offset( t );
    samplecol.rgb = samplecol.rgb * s;
    sum += samplecol;
    wsum += s;
  }
  sum.rgb /= wsum;
  fragColor.rgb = sum.rgb;
  fragColor.a = 1.0;
}`,
};
