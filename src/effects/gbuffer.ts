// DOOM-specific effects that use the G-buffer the pico-8 set has no notion of:
// world normals and linear depth. No GLSL yet (WebGL2 post-process is a follow-up).

import type { PostEffect } from './effect.js';

export const passthrough: PostEffect = {
  name: 'none',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    return texture0(fragCoord / U.iResolution.xy);
  }`,
};

export const showNormals: PostEffect = {
  name: 'normals',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    return vec4f(normalize(normal0(uv)) * 0.5 + 0.5, 1.0);
  }`,
};

export const showDepth: PostEffect = {
  name: 'depth',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    let z = clamp(depth0(uv) / 1500.0, 0.0, 1.0);
    return vec4f(vec3f(1.0 - z), 1.0); // near = white, far = black
  }`,
};

export const outline: PostEffect = {
  name: 'outline',
  author: 'Claude',
  wgsl: `fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    let px = 3.0 / U.iResolution.xy;   // 3px reach -> thicker ink lines
    let d0 = depth0(uv);
    let n0 = normalize(normal0(uv));
    var e = 0.0;
    var o = array(vec2f(px.x,0.0), vec2f(-px.x,0.0), vec2f(0.0,px.y), vec2f(0.0,-px.y));
    for (var i = 0; i < 4; i = i + 1) {
      e = e + abs(depth0(uv + o[i]) - d0) / max(d0, 1.0);
      e = e + (1.0 - clamp(dot(normalize(normal0(uv + o[i])), n0), 0.0, 1.0));
    }
    let ink = smoothstep(0.35, 0.7, e);
    return vec4f(mix(texture0(uv).rgb, vec3f(0.0), ink), 1.0);
  }`,
};
