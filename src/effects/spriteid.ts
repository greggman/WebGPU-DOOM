// Recolour the scene by G-buffer category (see src/spriteid.ts): the category is
// encoded in the surface normal's magnitude and recovered with iSpriteId(uv).
// World geometry keeps its original colour; everything else is painted a flat
// hue modulated by the pixel's own brightness so shape/shading survives:
//   enemies red, powerups green, effects yellow,
//   HUD dark grey, HUD numbers white, the player's gun orange.

import type { PostEffect } from './effect.js';

export const spriteId: PostEffect = {
  name: 'Sprite ID',
  author: 'Claude',
  wgsl: `fn sidTint(id: f32) -> vec3f {
    if (id < 2.5) { return vec3f(1.0, 0.15, 0.1); }   // 2 enemy   -> red
    if (id < 3.5) { return vec3f(0.15, 1.0, 0.2); }   // 3 powerup -> green
    if (id < 4.5) { return vec3f(1.0, 0.9, 0.15); }   // 4 effect  -> yellow
    if (id < 5.5) { return vec3f(0.22, 0.22, 0.25); } // 5 HUD     -> dark grey
    if (id < 6.5) { return vec3f(1.0, 1.0, 1.0); }    // 6 HUD num -> white
    return vec3f(1.0, 0.55, 0.1);                      // 7 weapon  -> orange
  }
  fn mainImage(fragCoord: vec2f) -> vec4f {
    let uv = fragCoord / U.iResolution.xy;
    let c = iColor0(uv).rgb;
    let id = iSpriteId(uv);
    let luma = dot(c, vec3f(0.299, 0.587, 0.114));
    if (id < 1.5) { return vec4f(0.0, pow(luma, 1.5), 0.0, 1.0); }            // 1 world -> untouched
    return vec4f(sidTint(id) * (0.35 + 0.65 * luma), 1.0);
  }`,
  glsl: `vec3 sidTint(float id) {
    if (id < 2.5) return vec3(1.0, 0.15, 0.1);
    if (id < 3.5) return vec3(0.15, 1.0, 0.2);
    if (id < 4.5) return vec3(1.0, 0.9, 0.15);
    if (id < 5.5) return vec3(0.22, 0.22, 0.25);
    if (id < 6.5) return vec3(1.0, 1.0, 1.0);
    return vec3(1.0, 0.55, 0.1);
  }
  void mainImage(out vec4 col, in vec2 fc) {
    vec2 uv = fc / iResolution.xy;
    vec3 c = iColor0(uv).rgb;
    float id = iSpriteId(uv);
    float luma = dot(c, vec3(0.299, 0.587, 0.114));
    if (id < 1.5) { col = vec4(vec3(0.0, pow(luma, 1.5), 0.0, 1.0); return; }
    col = vec4(sidTint(id) * (0.35 + 0.65 * luma), 1.0);
  }`,
};
