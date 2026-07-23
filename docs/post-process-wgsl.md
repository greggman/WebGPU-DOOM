# WebGPU post-processing — writing a WGSL filter

The post-process page (`index-postprocess.html`) renders DOOM into a small
**G-buffer** — colour plus a second target holding the world normal and linear
depth — then runs a full-screen **WGSL** filter over it before the screen melt.
Click **edit** in the toolbar to open the live editor; your shader recompiles as
you type, with errors shown inline and in the panel below.

The WebGL2 page (`index-postprocess-webgl2.html`) is the same, but you write
**GLSL** — see [post-process-glsl.md](post-process-glsl.md).

## Your entry point

Define one function. Its return value is the pixel's colour.

```wgsl
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;   // 0..1 across the screen
  return iColor0(uv);                       // passthrough
}
```

`fragCoord` is the pixel coordinate (like `gl_FragCoord.xy` / Shadertoy's
`fragCoord`). Divide by `U.iResolution.xy` for 0..1 UVs.

## Uniforms

All live in a struct named `U` (Shadertoy names, WGSL access):

| field            | type   | meaning                                             |
| ---------------- | ------ | --------------------------------------------------- |
| `U.iResolution`  | `vec3f`| viewport size in px (`.xy`), `.z = 1`               |
| `U.iTime`        | `f32`  | seconds since the page loaded                       |
| `U.iFrame`       | `f32`  | frame counter                                       |
| `U.iMouse`       | `vec4f`| `.xy` = cursor in px, `.z` > 0 while a button is held |
| `U.iCamPos`      | `vec3f`| camera world position                               |
| `U.iCamRight` / `U.iCamUp` / `U.iCamFwd` | `vec3f` | camera basis (view matrix rows) |
| `U.iTanHalfFovX` / `U.iTanHalfFovY` | `f32` | `tan(fov/2)` per axis          |

The camera fields exist so a filter can rebuild world position from depth; you
rarely touch them directly — use `iWorldPos(uv)` below.

## Scene inputs (the G-buffer)

Sample these with a 0..1 UV:

| helper           | returns | meaning                                               |
| ---------------- | ------- | ----------------------------------------------------- |
| `iColor0(uv)`    | `vec4f` | the rendered scene colour (`iChannel0`)               |
| `iNormal0(uv)`   | `vec3f` | world-space geometric normal                          |
| `iDepth0(uv)`    | `f32`   | **linear** view depth, in **map units**               |
| `iDepth01(uv)`   | `f32`   | the same depth **normalized** to 0..1 (0 = eye, 1 = far clip) |
| `iWorldPos(uv)`  | `vec3f` | world-space position of the surface (Y up)            |
| `iUV0(uv)`       | `vec2f` | per-surface texture UV (sprites/HUD 0..1; walls/floors 0..1 within a tile) |
| `iSpriteCategory(uv)` | `f32` | `1` world, `2` enemy, `3` powerup, `4` effect, `5` HUD, `6` HUD number, `7` weapon (`0` sky) |
| `iSpriteType(uv)`     | `f32` | mobj type (`MT_*`, e.g. `11` = imp); `0` on world/HUD/sky |
| `iSpriteFlip(uv)`     | `f32` | `1` if the sprite graphic is mirrored for this facing, else `0` |
| `iSpriteRotation(uv)` | `f32` | which of the 8 view rotations (0..7) the sprite shows |

Notes on the G-buffer:

- **Normals** come from screen-space derivatives of world position, so floors and
  ceilings point roughly along ±Y and walls are horizontal. Sprites use a
  camera-facing normal. The sky and the HUD write a zero normal. The geometric
  normal's **sign is arbitrary**; flip it toward the camera before lighting it:
  `if (dot(N, normalize(U.iCamPos - P)) < 0.0) { N = -N; }`.
- **`iWorldPos`** reconstructs the surface point from depth + the camera, so you
  can project things onto surfaces in world space (see `matrix`, `crosshatch`).
  It's meaningless where there's no geometry (sky) or on UI (depth ~0) — gate with
  `iDepth0`.
- **`iSpriteCategory` / `iSpriteType` / `iSpriteFlip` / `iSpriteRotation`** read a
  point-sampled integer meta target, so they're exact (no blending at silhouettes).
  Category ≥ 2 means a billboard sprite (whose normal is camera-facing/fake) — use
  it to shade sprites differently, or `iSpriteType` for per-monster/-item effects.
- **Depth is linear.** `iDepth0` is the real distance from the eye in map units —
  use it for anything range-based (DOF focus, fog), where a world distance is the
  natural unit. `iDepth01` is that value divided by the far clip (`20000`) and
  clamped, for when you just want a 0..1 number. Note the far clip is *far*, so
  typical rooms sit in the low end of 0..1 (a linear grayscale of it looks flat;
  the `depth` built-in applies a display gamma). The sky is written at the far clip
  (~20000, → `iDepth01` ≈ 1); the HUD/weapon are written at 0 (nearest).

## Helpers

WGSL's `%` is a **truncated** remainder — `e1 - e2*trunc(e1/e2)` — whose sign
follows the dividend (`(-1.5) % 1.0 == -0.5`). GLSL's `mod` is **floored** —
`e1 - e2*floor(e1/e2)` — and always wraps positive (`mod(-1.5, 1.0) == 0.5`).
They agree only when both operands are non-negative. The ported effects use the
floored form (e.g. `mod(-iTime*speed, 1.0)`), so the harness provides it:

- `fmod(x: f32, y: f32) -> f32`         // x - y * floor(x / y)
- `fmod2(x: vec2f, y: vec2f) -> vec2f`

Use these where a GLSL shader uses `mod`; plain `%` is fine when both operands are
non-negative. Everything else is standard WGSL (`sin`, `fract`, `mix`, `clamp`,
`select`, `pow`, `length`, `dot`, `normalize`, `mat2x2f`, …).

## Textures

There's a built-in library of procedural noise/patterns — `iChan(iNoiseValue, uv)`
and friends — and you can load your **own** textures (2D / array / cube / 3D) from
URLs with a comment directive (`// iChannel1: url`). Both are covered in
**[post-process-textures.md](post-process-textures.md)**.

One WGSL-specific trap: `textureSample`/`iChan` pick a mip from derivatives and so
must be called in **uniform control flow** (top level, not inside a per-pixel
`if`). WGSL rejects it at compile time; WebGL2 doesn't. Sample unconditionally and
`select` afterwards, or use `textureSampleLevel(...)`.

## Examples

Invert:

```wgsl
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  return vec4f(1.0 - iColor0(uv).rgb, 1.0);
}
```

Show depth (normalized):

```wgsl
fn mainImage(fragCoord: vec2f) -> vec4f {
  let z = iDepth01(fragCoord / U.iResolution.xy);
  return vec4f(vec3f(1.0 - z), 1.0);   // near = white, far = black
}
```
