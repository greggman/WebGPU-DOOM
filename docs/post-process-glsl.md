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

## Scene inputs (the G-buffer)

The scene colour is the sampler `iChannel0`; the normal/depth target is
`iChannelND`. Convenience helpers (sample with a 0..1 UV):

| helper / sampler          | returns | meaning                                    |
| ------------------------- | ------- | ------------------------------------------ |
| `iColor0(uv)`             | `vec4`  | the rendered scene colour                  |
| `texture2D(iChannel0, uv)`| `vec4`  | same thing, Shadertoy style                |
| `iNormal0(uv)`            | `vec3`  | world-space geometric normal               |
| `iDepth0(uv)`             | `float` | linear view depth, in map units            |

Notes on the G-buffer:

- **Normals** come from screen-space derivatives of world position, so floors and
  ceilings point roughly along ±Y and walls are horizontal. Sprites use a
  camera-facing normal. The sky and the HUD write a zero normal.
- **Depth** is distance from the camera in map units (≈ 0 up close). The sky is
  written as a far value (~20000); the HUD is written as 0 (nearest).

## Notes

- `texture2D` is `#define`d to `texture`, and `mod()` / matrices / etc. are all
  standard GLSL ES 3.00.
- A second scene texture (`iChannel1`) is **not** provided; the ported effects that
  originally needed a noise/LUT texture inline a procedural equivalent instead.

## Examples

Invert:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  fragColor = vec4(1.0 - iColor0(uv).rgb, 1.0);
}
```

Show the depth buffer:

```glsl
void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 uv = fragCoord / iResolution.xy;
  float z = clamp(iDepth0(uv) / 1500.0, 0.0, 1.0);
  fragColor = vec4(vec3(1.0 - z), 1.0);   // near = white, far = black
}
```

## URL parameters

- `?pp=<name>` — start on a built-in effect. Names:
  `none`, `normals`, `depth`, `outline`, `blueprint`, `crt`, `vhs`, `halftone`,
  `grayscale`, `posterize`, `pixelate`, `MattiasCRT`, `Distorted TV`,
  `VCR distortion`, `Old TV effect`, `glitch2`, `There's a bug in the TV`,
  `LED Display`, `Gameboy Classic`, `CMYK Halftone`.
  Example: `index-postprocess-webgl2.html?pp=crt`
- `#post=<base64>` — a shared custom shader. The editor's **save & copy URL**
  button deflates your shader and writes it here (base64url), then copies the
  link; opening such a URL loads the shader and runs it.

Both can combine, e.g. `index-postprocess-webgl2.html?pp=none#post=<…>`.
