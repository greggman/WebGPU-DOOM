import type { PostEffect } from './effect.js';

// The original reads the 4-colour DMG palette from a tiny texture (iChannel1);
// the WGSL port inlines it as constants.
export const gameboyClassic: PostEffect = {
  name: 'Gameboy Classic',
  author: 'jilski',
  authorUrl: 'https://www.shadertoy.com/user/jilski',
  src: 'https://www.shadertoy.com/view/MdyfDR',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn mainImage(fragCoord: vec2f) -> vec4f {
  let blend_factor = 1.0 - pow(0.5 + 0.5*cos(U.iTime/10.0), 2.0);
  let loudness = cos(U.iTime/0.5);
  let pix_size = 8.0;
  var palette = array<vec3f,4>(
    vec3f(180.0,210.0,46.0)/256.0,
    vec3f(155.0,195.0,40.0)/256.0,
    vec3f(108.0,151.0,35.0)/256.0,
    vec3f(54.0,112.0,30.0)/256.0);
  let line = palette[0] * 1.6;
  let coord = fragCoord / U.iResolution.xy;
  let resolution = vec2f(U.iResolution.x/pix_size, U.iResolution.y/pix_size);
  let uv = mix(coord, floor(coord*resolution) / resolution, blend_factor);
  let pix = uv * resolution;
  let orig = texture0(uv).rgb;
  var col = line;
  let line_width = vec2f(1.0/U.iResolution.x, 1.0/U.iResolution.y);
  let pix_thresh = mix(vec2f(0.0), line_width, blend_factor);
  let is_pixel = (coord.x - uv.x) > pix_thresh.x && (coord.y - uv.y) > pix_thresh.y;
  let is_not_broken = i32(pix.x) != i32(resolution.x) - 2
    && (i32(pix.x) != i32(resolution.x) - 4 || fract(4.0*sin(U.iTime/10.0)) > 0.95)
    && i32(pix.x) != 1;
  if (is_pixel && is_not_broken) {
    let val = (orig.r + orig.g + orig.b) / 3.0;
    let shade = i32(min(3.0, 4.0*log(1.0 + val*1.71)));
    col = palette[shade];
    let cen = vec2f(0.5, 0.5) + 3.0*vec2f(0.5+0.5*sin(U.iTime), 0.5+0.5*cos(U.iTime/1.2));
    col = col + vec3f(0.1,0.14,0.01) * (0.5 + 0.5*sin(atan2(cen.x, cen.y)));
    col = col - vec3f(0.8,1.0,0.5) * 5.0 * sin(loudness) * length(uv - coord);
  }
  col = col * (1.1 - 0.3*distance(coord, vec2f(0.5, 0.5)));
  col = mix(orig, col, blend_factor);
  return vec4f(col, 1.0);
}`,
  glsl: `
vec3 rgb(int r, int g, int b) { return vec3(float(r)/256.,float(g)/256.,float(b)/256.); }
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  float blend_factor = 1.0-pow(0.5+0.5*cos(iTime/10.0),2.0);
  float loudness = cos(iTime/0.5);
  float pix_size = 8.0;
  vec3 palette[4];
  palette[0] = rgb(180,210,46); palette[1] = rgb(155,195,40);
  palette[2] = rgb(108,151,35); palette[3] = rgb(54,112,30);
  vec3 line = palette[0]*1.6;
  vec2 coord = fragCoord/iResolution.xy;
  vec2 resolution = vec2(iResolution.x/pix_size,iResolution.y/pix_size);
  vec2 uv = mix(coord,(floor(coord*resolution) / resolution),blend_factor);
  vec2 pix = uv * resolution;
  vec3 orig = texture2D(iChannel0,uv).rgb;
  vec3 col = line;
  vec2 line_width = vec2(1.0/iResolution.x,1.0/iResolution.y);
  vec2 pix_thresh = mix(vec2(0.),line_width,blend_factor);
  bool is_pixel = (coord.x-uv.x) > pix_thresh.x && (coord.y-uv.y) > pix_thresh.y;
  bool is_not_broken = int(pix.x) != int(resolution.x)-2
    && (int(pix.x) != int(resolution.x)-4 || fract(4.0*sin(iTime/10.))>0.95) && int(pix.x) != 1;
  if ( is_pixel && is_not_broken ) {
    float val = (orig.r+orig.g+orig.b)/3.0;
    int shade = int(min(3.0,4.0*log(1.0+val*1.71)));
    col = palette[shade];
    vec2 offs = 3.*vec2(0.5+0.5*sin(iTime), 0.5+0.5*cos(iTime/1.2));
    vec2 cen = vec2(0.5,0.5) + offs;
    col += vec3(0.1,0.14,0.01)*(0.5+0.5*sin(atan(cen.x,cen.y)));
    col -= vec3(0.8,1.0,0.5)*5.0*sin(loudness)*length(uv-coord);
  }
  col *= 1.1 - 0.3*distance(coord,vec2(0.5,0.5));
  col = mix(orig,col,blend_factor);
  fragColor = vec4(col,1.0);
}`,
};
