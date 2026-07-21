// DOOM-specific effects that use the G-buffer the pico-8 set has no notion of:
// world normals and linear depth. WGSL for the WebGPU backend, GLSL (ES 3.00,
// via the postprocess harness's texture2D shim) for WebGL2.

import type { PostEffect } from './effect.js';

export const passthrough: PostEffect = {
  name: 'none',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    return iColor0(fragCoord / U.iResolution.xy);
  }`,
  glsl: `void mainImage(out vec4 c, in vec2 fc) {
    c = texture2D(iChannel0, fc / iResolution.xy);
  }`,
};

export const showNormals: PostEffect = {
  name: 'normals',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    return vec4f(normalize(iNormal0(uv)) * 0.5 + 0.5, 1.0);
  }`,
  glsl: `void mainImage(out vec4 c, in vec2 fc) {
    vec2 uv = fc / iResolution.xy;
    c = vec4(normalize(iNormal0(uv)) * 0.5 + 0.5, 1.0);
  }`,
};

export const showDepth: PostEffect = {
  name: 'depth',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    let z = clamp(iDepth0(uv) / 1500.0, 0.0, 1.0);
    return vec4f(vec3f(1.0 - z), 1.0); // near = white, far = black
  }`,
  glsl: `void mainImage(out vec4 c, in vec2 fc) {
    float z = clamp(iDepth0(fc / iResolution.xy) / 1500.0, 0.0, 1.0);
    c = vec4(vec3(1.0 - z), 1.0);
  }`,
};

export const outline: PostEffect = {
  name: 'outline',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    let px = 3.0 / U.iResolution.xy;   // 3px reach -> thicker ink lines
    let d0 = iDepth0(uv);
    let n0 = normalize(iNormal0(uv));
    var e = 0.0;
    var o = array(vec2f(px.x,0.0), vec2f(-px.x,0.0), vec2f(0.0,px.y), vec2f(0.0,-px.y));
    for (var i = 0; i < 4; i = i + 1) {
      e = e + abs(iDepth0(uv + o[i]) - d0) / max(d0, 1.0);
      e = e + (1.0 - clamp(dot(normalize(iNormal0(uv + o[i])), n0), 0.0, 1.0));
    }
    let ink = smoothstep(0.35, 0.7, e);
    return vec4f(mix(iColor0(uv).rgb, vec3f(0.0), ink), 1.0);
  }`,
  glsl: `void mainImage(out vec4 c, in vec2 fc) {
    vec2 uv = fc / iResolution.xy;
    vec2 px = 3.0 / iResolution.xy;
    float d0 = iDepth0(uv);
    vec3 n0 = normalize(iNormal0(uv));
    vec2 o[4];
    o[0] = vec2(px.x, 0.0); o[1] = vec2(-px.x, 0.0);
    o[2] = vec2(0.0, px.y); o[3] = vec2(0.0, -px.y);
    float e = 0.0;
    for (int i = 0; i < 4; i++) {
      e += abs(iDepth0(uv + o[i]) - d0) / max(d0, 1.0);
      e += 1.0 - clamp(dot(normalize(iNormal0(uv + o[i])), n0), 0.0, 1.0);
    }
    float ink = smoothstep(0.35, 0.7, e);
    c = vec4(mix(texture2D(iChannel0, uv).rgb, vec3(0.0), ink), 1.0);
  }`,
};
