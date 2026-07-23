import type { PostEffect } from './effect.js';

// Screen-space ambient occlusion on white "clay". Pure form study: throw away
// DOOM's textures and shading and render every surface as matte white, darkened
// only where geometry occludes itself (corners, crevices, under sprites).
//
// The estimator needs no forward reprojection: it samples a disk of screen
// neighbours, reconstructs each one's WORLD position with iWorldPos, and counts a
// neighbour as occluding when it sits above this pixel's tangent plane (dot with
// the normal) within a world-space radius. That reuses the same G-buffer the
// other effects do (normal + linear depth), so it is a single pass.
export const ssao: PostEffect = {
  name: 'SSAO',
  author: 'Claude',
  wgsl: `
fn hash12(p: vec2f) -> f32 {
  var p3 = fract(vec3f(p.x, p.y, p.x) * 0.1031);
  p3 = p3 + dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let d = iDepth0(uv);
  if (d < 1.0) { return iColor0(uv); }                     // UI / weapon: leave alone
  if (iDepth01(uv) >= 0.999) { return vec4f(1.0); }        // sky / far = blank white

  let P = iWorldPos(uv);
  var N = normalize(iNormal0(uv));
  N = N * select(1.0, -1.0, dot(N, normalize(U.iCamPos - P)) < 0.0);

  // World AO radius -> screen-space sampling radius at this depth (perspective).
  let R = 96.0;
  let uvR = R / (2.0 * d) * vec2f(1.0 / U.iTanHalfFovX, 1.0 / U.iTanHalfFovY);
  let bias = 0.03;

  let SAMPLES = 24;
  let rot = hash12(fragCoord) * 6.2831853;
  var ao = 0.0;
  for (var i = 0; i < SAMPLES; i = i + 1) {
    let t = (f32(i) + 0.5) / f32(SAMPLES);
    let r = sqrt(t);                                        // uniform disk
    let a = f32(i) * 2.3999632 + rot;                       // golden angle + per-pixel rotation
    let Q = iWorldPos(uv + vec2f(cos(a), sin(a)) * r * uvR);
    let v = Q - P;
    let dl = length(v);
    let ndv = dot(N, v / max(dl, 1e-4));                    // is the neighbour above the tangent plane?
    let rangeW = clamp(1.0 - dl / R, 0.0, 1.0);             // ignore far neighbours (reduces haloing)
    ao = ao + max(ndv - bias, 0.0) * rangeW;
  }
  ao = ao / f32(SAMPLES);
  let occ = pow(clamp(1.0 - ao * 2.4, 0.0, 1.0), 1.4);      // strength + contrast

  let isSpr = iSprite(uv) > 0.5;
  let col = iColor0(uv).rgb;
  if (isSpr) {
    let lum = dot(col, vec3f(0.299, 0.587, 0.114)); // luma
    return vec4f(mix(col * occ, vec3f(1.0), 0.75), 1);
  }

  return vec4f(vec3f(occ), 1.0);
}`,
  glsl: `
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void mainImage(out vec4 fragColor, in vec2 fc) {
  vec2 uv = fc / iResolution.xy;
  float d = iDepth0(uv);
  if (d < 1.0) { fragColor = iColor0(uv); return; }
  if (iDepth01(uv) >= 0.999) { fragColor = vec4(1.0); return; }

  vec3 P = iWorldPos(uv);
  vec3 N = normalize(iNormal0(uv));
  if (dot(N, normalize(iCamPos - P)) < 0.0) N = -N;

  float R = 96.0;
  vec2 uvR = R / (2.0 * d) * vec2(1.0 / iTanHalfFovX, 1.0 / iTanHalfFovY);
  float bias = 0.03;

  const int SAMPLES = 24;
  float rot = hash12(fc) * 6.2831853;
  float ao = 0.0;
  for (int i = 0; i < SAMPLES; i++) {
    float t = (float(i) + 0.5) / float(SAMPLES);
    float r = sqrt(t);
    float a = float(i) * 2.3999632 + rot;
    vec3 Q = iWorldPos(uv + vec2(cos(a), sin(a)) * r * uvR);
    vec3 v = Q - P;
    float dl = length(v);
    float ndv = dot(N, v / max(dl, 1e-4));
    float rangeW = clamp(1.0 - dl / R, 0.0, 1.0);
    ao += max(ndv - bias, 0.0) * rangeW;
  }
  ao /= float(SAMPLES);
  float occ = pow(clamp(1.0 - ao * 2.4, 0.0, 1.0), 1.4);

  bool isSpr = iSprite(uv) > 0.5;
  vec3 col = iColor0(uv).rgb;
  if (isSpr) {
    float lum = dot(col, vec3(0.299, 0.587, 0.114)); // luma
    fragColor = vec4(mix(col * occ, vec3(1.0), 0.75), 1);
    return;
  }

  fragColor = vec4(vec3(occ), 1.0);
}`,
};
