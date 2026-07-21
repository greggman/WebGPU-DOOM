import type { PostEffect } from './effect.js';

export const ledDisplay: PostEffect = {
  name: 'LED Display',
  author: 'CloneDeath',
  authorUrl: 'https://www.shadertoy.com/user/CloneDeath',
  src: 'https://www.shadertoy.com/view/lsSSD1',
  license: 'CC-BY-NC-SA',
  licenseUrl: 'http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US',
  wgsl: `
fn Distort(p0: vec2f) -> vec2f {
  var p = p0;
  let theta = atan2(p.y, p.x);
  let radius = pow(length(p), 1.01);   // BarrelPower
  p.x = radius * cos(theta);
  p.y = radius * sin(theta);
  return 0.5 * (p + 1.0);
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let pixelHeight = 100.0;
  let num_samples = 10.0;
  let pixel_vsep = 0.5;
  let scanline_speed = 0.1;
  let aspect = U.iResolution.y / U.iResolution.x;
  let pixelcount = vec2f(pixelHeight / aspect, pixelHeight);
  let pixelsize = 1.0 / pixelcount;
  var pixelpos = fragCoord / U.iResolution.xy;
  pixelpos = Distort(2.0*pixelpos - 1.0);
  var texpos = floor(pixelpos / pixelsize) * pixelsize + pixelsize/2.0;
  var count = 0.0;
  var color = vec4f(0.0);
  for (var x = 0.0; x <= num_samples; x = x + 1.0) {
    for (var y = 0.0; y <= num_samples; y = y + 1.0) {
      count = count + 1.0;
      color = color + texture0(texpos + (vec2f(x, y) * pixelsize / num_samples));
    }
  }
  color = color / count;
  let line = fmod(-U.iTime * scanline_speed, 1.0);
  if (abs(pixelpos.y - line) < pixelsize.y / 4.0) { color = vec4f(color.rgb * 1.5, color.a); }
  var mod_pos = (fmod2(pixelpos, pixelsize) / pixelsize) - 0.5;
  var rgb = color.rgb * (1.0 - sqrt(mod_pos.x*mod_pos.x + mod_pos.y*mod_pos.y));
  mod_pos = mod_pos + 0.5;
  rgb.r = rgb.r * pow(1.0 - abs(mod_pos.x - 0.25), 2.0);
  rgb.g = rgb.g * pow(1.0 - abs(mod_pos.x - 0.5), 2.0);
  rgb.b = rgb.b * pow(1.0 - abs(mod_pos.x - 0.75), 2.0);
  rgb = rgb * vec3f(0.8, 0.75, 0.9) * 2.5;
  rgb = rgb * (0.9 - abs(pixelpos.x - 0.5));
  return vec4f(rgb, color.a);
}`,
  glsl: `
const float pixelHeight = 100.0;
const float num_samples = 10.0;
const float pixel_vsep = 0.5;
const float scanline_speed = 0.1;
const float BarrelPower = 1.01;
vec2 Distort(vec2 p) {
  float theta  = atan(p.y, p.x);
  float radius = length(p);
  radius = pow(radius, BarrelPower);
  p.x = radius * cos(theta);
  p.y = radius * sin(theta);
  return 0.5 * (p + 1.0);
}
void mainImage( out vec4 fragColor, in vec2 fragCoord ) {
  float aspect = iResolution.y / iResolution.x;
  vec2 pixelcount = vec2(pixelHeight / aspect, pixelHeight);
  vec2 pixelsize = 1.0/pixelcount;
  vec2 pixelpos = fragCoord.xy / iResolution.xy;
  vec2 xy = 2.0 * pixelpos - 1.0;
  pixelpos = Distort(xy);
  vec2 texpos = pixelpos;
  texpos.xy = floor(texpos.xy / pixelsize) * pixelsize;
  texpos.xy += pixelsize/2.0;
  float count = 0.0;
  vec4 color = vec4(0);
  for (float x = 0.0; x <= num_samples; x += 1.0){
    for (float y = 0.0; y <= num_samples; y += 1.0){
      count ++;
      color += texture2D(iChannel0, texpos + (vec2(x, y) * pixelsize / num_samples));
    }
  }
  color /= count;
  float line = mod(-iTime * scanline_speed, 1.0);
  if (abs(pixelpos.y - line) < pixelsize.y / 4.0){ color.rgb *= 1.5; }
  vec2 mod_pos = (mod(pixelpos, pixelsize) / pixelsize) - 0.5;
  color.rgb *= 1.0 - sqrt(mod_pos.x * mod_pos.x + mod_pos.y * mod_pos.y);
  mod_pos += 0.5;
  color.r *= pow(1.0 - abs(mod_pos.x - 0.25), 2.0);
  color.g *= pow(1.0 - abs(mod_pos.x - 0.5), 2.0);
  color.b *= pow(1.0 - abs(mod_pos.x - 0.75), 2.0);
  color.rgb *= vec3(0.8, 0.75, 0.9);
  color.rgb *= 2.5;
  color.rgb *= 0.9 - sqrt(pow((pixelpos - 0.5).x, 2.0));
  fragColor = color;
}`,
};
