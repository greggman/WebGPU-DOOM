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

## Scene inputs (the G-buffer)

Sample these with a 0..1 UV:

| helper           | returns | meaning                                               |
| ---------------- | ------- | ----------------------------------------------------- |
| `iColor0(uv)`    | `vec4f` | the rendered scene colour (`iChannel0`)               |
| `iNormal0(uv)`   | `vec3f` | world-space geometric normal                          |
| `iDepth0(uv)`    | `f32`   | **linear** view depth, in **map units**               |
| `iDepth01(uv)`   | `f32`   | the same depth **normalized** to 0..1 (0 = eye, 1 = far clip) |

Notes on the G-buffer:

- **Normals** come from screen-space derivatives of world position, so floors and
  ceilings point roughly along ±Y and walls are horizontal. Sprites use a
  camera-facing normal. The sky and the HUD write a zero normal.
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
