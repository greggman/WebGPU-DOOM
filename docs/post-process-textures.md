# Post-processing — textures

Beyond the scene **G-buffer** (see the [WGSL](post-process-wgsl.md) /
[GLSL](post-process-glsl.md) docs), a filter can read two more kinds of texture:

1. a **built-in library** of procedural noise/pattern layers, always available; and
2. **your own textures**, fetched from URLs you declare in a comment.

`iChannel0` is the scene colour and `iChannelND` is the normal/depth target, so
**your textures start at `iChannel1`**.

---

## Built-in library

A repeat-wrapped, mip-mapped `texture_2d_array` generated on the CPU at load (no
downloads). Sample a layer by its constant index:

| constant       | contents                                        |
| -------------- | ----------------------------------------------- |
| `iNoiseRGBA`   | uncorrelated per-texel RGBA white noise         |
| `iNoiseValue`  | smooth grey value noise                         |
| `iBlueNoise`   | approximate blue noise (dithering)              |
| `iCrosshatch`  | cross-hatch tonal-art-map (texel = ink threshold) |

```wgsl
let n = iChan(iNoiseValue, uv);          // WGSL — vec4f
```
```glsl
vec4 n = iChan(iNoiseValue, uv);         // GLSL
```

`iChan(layer, uv)` samples with automatic mip selection, so call it in **uniform
control flow** (see the gotcha below).

---

## Loading your own textures

Declare channels in a comment block near the top of your shader. The syntax is a
small YAML-ish subset — a `iChannelN:` key with either an inline URL or a nested
block whose single key is `mips` / `layers` / `faces` / `slices`:

```glsl
// iChannel1: images/wood.png                 2D texture, generated mips

// iChannel2:                                 2D texture, explicit mips
//   mips:
//     - images/wood0.png   # mip 0 (full size)
//     - images/wood1.png   # mip 1 (half)
//     - images/wood2.png   # mip 2 (quarter)

// iChannel3:                                 2D array, generated mips
//   layers:
//     - images/tam0.png
//     - images/tam1.png

// iChannel4:                                 cube map (exactly 6 faces)
//   faces: [ px.png, nx.png, py.png, ny.png, pz.png, nz.png ]

// iChannel5:                                 3D texture (no mips)
//   slices:
//     - images/slice0.png
//     - images/slice1.png
```

URLs are relative to the page. **Same-origin (relative) URLs always work**
(including on the published site); arbitrary cross-origin URLs need CORS headers
and won't load under a strict CSP.

### Rules & errors

Load failures show up in the editor's error panel (and the console), keyed to the
directive's line:

- a URL that 404s or isn't a decodable image;
- **array / 3D**: every `layers` / `slices` image must be the **same size**;
- **cube**: exactly **6** `faces`, each **square** and the same size;
- **explicit mips**: each level must be the previous **halved** (floor, min 1).

A channel is bound to 1×1 black while it loads, so the shader still runs.

---

## Sampling your channels

Each declared channel becomes a sampler of the matching type. In WGSL use the
shared `iChannelSampler`; in GLSL the Shadertoy-style `texture()`:

| kind      | WGSL                                                   | GLSL                              |
| --------- | ------------------------------------------------------ | --------------------------------- |
| 2D        | `textureSample(iChannel1, iChannelSampler, uv)`        | `texture(iChannel1, uv)`          |
| 2D array  | `textureSample(iChannel1, iChannelSampler, uv, layer)` | `texture(iChannel1, vec3(uv, layer))` |
| cube      | `textureSample(iChannel1, iChannelSampler, dir)`       | `texture(iChannel1, dir)`         |
| 3D        | `textureSample(iChannel1, iChannelSampler, uvw)`       | `texture(iChannel1, uvw)`         |

(WGSL array/3D `uv` are `vec2f`/`vec3f`; the layer index is an `i32`. GLSL wraps
2D/cube/3D and array uniformly with `texture()`.)

### Gotcha: WGSL needs uniform control flow

`textureSample` (and `iChan`) pick a mip level from screen-space derivatives, so
WGSL requires them in **uniform control flow** — the top level of `mainImage`, not
inside an `if`/loop that branches per pixel. WGSL **rejects this at compile time**;
WebGL2 has no such rule and **silently** samples an undefined mip, so a shader that
"works" in GLSL can fail to compile as WGSL.

Fix by sampling unconditionally and choosing afterwards:

```wgsl
let a = textureSample(iChannel1, iChannelSampler, uv0);   // both sampled every pixel
let b = textureSample(iChannel1, iChannelSampler, uv1);
return select(a, b, cond);                                 // pick after
```

or sample an explicit LOD (allowed anywhere): `textureSampleLevel(tex, samp, uv, 0.0)`.

---

## A worked example

`crosshatch` (in the effect list) loads a six-level Tonal Art Map as an array and
blends the two levels bracketing the surface's tone — see `src/effects/crosshatch.ts`
and the generator `scripts/gen-tam.mjs`.
