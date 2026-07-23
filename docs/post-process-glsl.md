# WebGL2 post-processing — writing a GLSL filter

The WebGL2 post-process page (`index-postprocess-webgl2.html`) renders DOOM into a
small **G-buffer** — colour plus a second target holding the world normal and
linear depth — then runs a full-screen **GLSL** filter over it before the screen
melt. Click **edit** in the toolbar to open the live editor; your shader
recompiles as you type, with errors shown inline and in the panel below.

The WebGPU page (`index-postprocess.html`) is the same, but you write **WGSL** —
see [post-process-wgsl.md](post-process-wgsl.md).

The filter is GLSL ES 3.00 with `#define texture2D texture`, so shaders written in
the Shadertoy / WebGL1 style paste in almost verbatim.

## Your entry point

Define one function; it writes the pixel's colour to `fragColor`.

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;   // 0..1 across the screen
  fragColor = iColor0(uv);                 // passthrough
}
```

`fragCoord` is the pixel coordinate (`gl_FragCoord.xy`). Divide by
`iResolution.xy` for 0..1 UVs. This matches Shadertoy's `mainImage` signature.

## Uniforms

| name          | type   | meaning                                             |
| ------------- | ------ | --------------------------------------------------- |
| `iResolution` | `vec3` | viewport size in px (`.xy`), `.z = 1`               |
| `iTime`       | `float`| seconds since the page loaded                       |
| `iFrame`      | `float`| frame counter                                       |
| `iMouse`      | `vec4` | `.xy` = cursor in px, `.z` > 0 while a button is held |
| `iCamPos`     | `vec3` | camera world position                               |
| `iCamRight` / `iCamUp` / `iCamFwd` | `vec3` | camera basis (view matrix rows) |
| `iTanHalfFovX` / `iTanHalfFovY` | `float` | `tan(fov/2)` per axis           |

The camera uniforms exist so a filter can rebuild world position from depth; you
rarely touch them directly — use `iWorldPos(uv)` below.

## Scene inputs (the G-buffer)

The scene colour is the sampler `iChannel0`; the normal/depth target is
`iChannelND`. Convenience helpers (sample with a 0..1 UV):

| helper / sampler          | returns | meaning                                    |
| ------------------------- | ------- | ------------------------------------------ |
| `iColor0(uv)`             | `vec4`  | the rendered scene colour                  |
| `texture2D(iChannel0, uv)`| `vec4`  | same thing, Shadertoy style                |
| `iNormal0(uv)`            | `vec3`  | world-space geometric normal               |
| `iDepth0(uv)`             | `float` | **linear** view depth, in **map units**    |
| `iDepth01(uv)`            | `float` | the same depth **normalized** to 0..1 (0 = eye, 1 = far clip) |
| `iWorldPos(uv)`           | `vec3`  | world-space position of the surface (Y up) |
| `iSprite(uv)`             | `float` | `1.0` on a billboard sprite (enemy/item), `0.0` on world geometry |

Notes on the G-buffer:

- **Normals** come from screen-space derivatives of world position, so floors and
  ceilings point roughly along ±Y and walls are horizontal. Sprites use a
  camera-facing normal. The sky and the HUD write a zero normal. The geometric
  normal's **sign is arbitrary**; flip it toward the camera before lighting it:
  `if (dot(N, normalize(iCamPos - P)) < 0.0) N = -N;`.
- **`iWorldPos`** reconstructs the surface point from depth + the camera, so you
  can project things onto surfaces in world space (see `matrix`, `crosshatch`).
  It's meaningless where there's no geometry (sky) or on UI (depth ~0) — gate with
  `iDepth0`.
- **`iSprite`** is a 2D/3D flag: sprites are camera-facing billboards, so their
  normal is fake — use this to shade them differently.
- **Depth is linear.** `iDepth0` is the real distance from the eye in map units —
  use it for anything range-based (DOF focus, fog), where a world distance is the
  natural unit. `iDepth01` is that value divided by the far clip (`20000`) and
  clamped, for when you just want a 0..1 number. Note the far clip is *far*, so
  typical rooms sit in the low end of 0..1 (a linear grayscale of it looks flat;
  the `depth` built-in applies a display gamma). The sky is written at the far clip
  (~20000, → `iDepth01` ≈ 1); the HUD/weapon are written at 0 (nearest).

## Notes

- `texture2D` is `#define`d to `texture`, and `mod()` / matrices / etc. are all
  standard GLSL ES 3.00.

## Textures

There's a built-in library of procedural noise/patterns — `iChan(iNoiseValue, uv)`
and friends — and you can load your **own** textures (2D / array / cube / 3D) from
URLs with a comment directive (`// iChannel1: url`), sampled Shadertoy-style with
`texture()`. Both are covered in
**[post-process-textures.md](post-process-textures.md)**.

## Examples

Invert:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = vec4(1.0 - iColor0(uv).rgb, 1.0);
}
```

Show depth (normalized):

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  float z = iDepth01(fragCoord / iResolution.xy);
  fragColor = vec4(vec3(1.0 - z), 1.0);   // near = white, far = black
}
```

