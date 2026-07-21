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
| `iDepth0(uv)`    | `f32`   | linear view depth, in map units                       |

Notes on the G-buffer:

- **Normals** come from screen-space derivatives of world position, so floors and
  ceilings point roughly along ±Y and walls are horizontal. Sprites use a
  camera-facing normal. The sky and the HUD write a zero normal.
- **Depth** is distance from the camera in map units (≈ 0 up close). The sky is
  written as a far value (~20000); the HUD is written as 0 (nearest).

## Helpers

WGSL has no `mod()`, so the harness provides:

- `fmod(x: f32, y: f32) -> f32`
- `fmod2(x: vec2f, y: vec2f) -> vec2f`

Everything else is standard WGSL (`sin`, `fract`, `mix`, `clamp`, `select`,
`pow`, `length`, `dot`, `normalize`, `mat2x2f`, …).

## Examples

Invert:

```wgsl
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  return vec4f(1.0 - iColor0(uv).rgb, 1.0);
}
```

Show the depth buffer:

```wgsl
fn mainImage(fragCoord: vec2f) -> vec4f {
  let uv = fragCoord / U.iResolution.xy;
  let z = clamp(iDepth0(uv) / 1500.0, 0.0, 1.0);
  return vec4f(vec3f(1.0 - z), 1.0);   // near = white, far = black
}
```

## URL parameters

- `?pp=<name>` — start on a built-in effect. Names:
  `none`, `normals`, `depth`, `outline`, `blueprint`, `crt`, `vhs`, `halftone`,
  `grayscale`, `posterize`, `pixelate`, `MattiasCRT`, `Distorted TV`,
  `VCR distortion`, `Old TV effect`, `glitch2`, `There's a bug in the TV`,
  `LED Display`, `Gameboy Classic`, `CMYK Halftone`.
  Example: `index-postprocess.html?pp=crt`
- `#post=<base64>` — a shared custom shader. The editor's **save & copy URL**
  button deflates your shader and writes it here (base64url), then copies the
  link; opening such a URL loads the shader and runs it.

Both can combine, e.g. `index-postprocess.html?pp=none#post=<…>`.
