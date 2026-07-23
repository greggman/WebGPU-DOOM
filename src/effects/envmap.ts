import type { PostEffect } from './effect.js';

// Environment-mapped / reflective DOOM. Every surface reflects a cubemap: the
// view ray is reflected off the G-buffer world normal and looked up in the "Pisa"
// courtyard environment (cubemap from thespite's sketch asset set). The
// reflection is tinted by the surface's own colour so the level reads as polished
// coloured metal rather than featureless chrome.
// Sprites are flat billboards, so we fake a domed normal from the sprite UV
// (iUV0) — they reflect the world like curved chrome blobs. The sky/backdrop
// shows the environment straight along the view ray, so the map sits inside it.
//
// The cubemap is loaded through the generic iChannel URL loader (faces block).
export const envmap: PostEffect = {
  name: 'chrome',
  author: 'Claude',
  src: 'https://github.com/spite/sketch',
  license: 'MIT',
  licenseUrl: 'https://github.com/spite/sketch/blob/master/LICENSE',
  wgsl: `
// iChannel1:
//   faces:
//     - texture/pisa/posx.png
//     - texture/pisa/negx.png
//     - texture/pisa/posy.png
//     - texture/pisa/negy.png
//     - texture/pisa/posz.png
//     - texture/pisa/negz.png
fn env(dir: vec3f) -> vec3f {
  return textureSampleLevel(iChannel1, iChannelSampler, dir, 0.0).rgb;
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let d = iDepth0(uv);
  if (d < 1.0) { return iColor0(uv); }                     // UI / weapon: leave alone

  let P = iWorldPos(uv);
  let viewDir = normalize(P - U.iCamPos);

  // Sky / far plane: show the environment straight along the view ray so the
  // level appears to sit inside the courtyard.
  if (iDepth01(uv) >= 0.999) { return vec4f(env(viewDir), 1.0); }

  var N = normalize(iNormal0(uv));
  N = N * select(1.0, -1.0, dot(N, normalize(U.iCamPos - P)) < 0.0);

  // Sprites are flat billboards; fake a domed normal from the sprite UV so they
  // reflect like curved chrome (centre faces the camera, edges bow away).
  if (iSprite(uv) > 0.5) {
    let pc = (iUV0(uv) - vec2f(0.5, 0.5)) * 1.0;
    let z = sqrt(max(0.0, 1.0 - dot(pc, pc)));
    N = normalize(U.iCamRight * pc.x - U.iCamUp * pc.y - U.iCamFwd * z);
  }

  let refl = env(reflect(viewDir, N));
  let base = iColor0(uv).rgb;
  // Coloured metal: mostly the reflection, lightly tinted by the surface albedo,
  // plus a Fresnel rim that whitens at grazing angles like polished metal.
  let fres = pow(1.0 - max(dot(N, -viewDir), 0.0), 4.0);
  let col = mix(refl * (0.7 + 0.6 * base), vec3f(1.0), fres * 0.5);
  return vec4f(col, 1.0);
}`,
  glsl: `
// iChannel1:
//   faces:
//     - texture/pisa/posx.png
//     - texture/pisa/negx.png
//     - texture/pisa/posy.png
//     - texture/pisa/negy.png
//     - texture/pisa/posz.png
//     - texture/pisa/negz.png
vec3 env(vec3 dir) { return textureLod(iChannel1, dir, 0.0).rgb; }
void mainImage(out vec4 fragColor, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  float d = iDepth0(uv);
  if (d < 1.0) { fragColor = iColor0(uv); return; }

  vec3 P = iWorldPos(uv);
  vec3 viewDir = normalize(P - iCamPos);

  if (iDepth01(uv) >= 0.999) { fragColor = vec4(env(viewDir), 1.0); return; }

  vec3 N = normalize(iNormal0(uv));
  if (dot(N, normalize(iCamPos - P)) < 0.0) N = -N;

  if (iSprite(uv) > 0.5) {
    vec2 pc = (iUV0(uv) - vec2(0.5)) * 1.0;
    float z = sqrt(max(0.0, 1.0 - dot(pc, pc)));
    N = normalize(iCamRight * pc.x - iCamUp * pc.y - iCamFwd * z);
  }

  vec3 refl = env(reflect(viewDir, N));
  vec3 base = iColor0(uv).rgb;
  float fres = pow(1.0 - max(dot(N, -viewDir), 0.0), 4.0);
  vec3 col = mix(refl * (0.7 + 0.6 * base), vec3(1.0), fres * 0.5);
  fragColor = vec4(col, 1.0);
}`,
};
