import type { PostEffect } from './effect.js';

// TEMP: verifies the iChannel URL loader. Top half = 2D checker (iChannel1),
// bottom half = 3-layer array (iChannel2) shown as three vertical bands.
export const chtest: PostEffect = {
  name: 'chtest',
  author: 'Claude',
  hidden: true, // iChannel-loader test; reachable via ?pp=chtest, not in the dropdown
  wgsl: `
// iChannel1: texture/test-checker.png
// iChannel2:
//   layers:
//     - texture/test-l0.png
//     - texture/test-l1.png
//     - texture/test-l2.png
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let checker = textureSample(iChannel1, iChannelSampler, uv * 4.0);
  let arr = textureSample(iChannel2, iChannelSampler, uv, i32(uv.x * 3.0));
  return select(arr, checker, uv.y > 0.5);
}`,
  glsl: `
// iChannel1: texture/test-checker.png
// iChannel2:
//   layers:
//     - texture/test-l0.png
//     - texture/test-l1.png
//     - texture/test-l2.png
void mainImage(out vec4 c, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  if (uv.y > 0.5) {
    c = texture(iChannel1, uv * 4.0);
  } else {
    int layer = int(uv.x * 3.0);
    c = texture(iChannel2, vec3(uv, float(layer)));
  }
}`,
};
