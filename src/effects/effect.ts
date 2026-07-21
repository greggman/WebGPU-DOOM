// A post-process effect as a self-contained, backend-agnostic module — the
// pattern from greggman/pico-8-post-processing. Each carries BOTH a WGSL body
// (WebGPU, used today) and the original GLSL body (WebGL2, used when that port
// lands), plus attribution so the toolbar can link src/author/license.
//
// Shader contract (both languages): define a `mainImage` that maps a pixel
// coordinate to a colour, with these provided by the harness:
//   iResolution : vec3   viewport px (xy), z = 1
//   iTime       : float  seconds since load
//   iFrame      : float  frame counter
//   iMouse      : vec4   xy = cursor px, z = button (matches Shadertoy)
//   iChannel0   : the rendered scene colour
//   plus the DOOM G-buffer: world normal + linear depth (see normal0/depth0)
// WGSL accesses the scalars as `U.iResolution` etc. and samples via the helpers
// `texture0(uv)`, `normal0(uv)`, `depth0(uv)`. GLSL keeps the Shadertoy names
// verbatim (`iResolution`, `texture2D(iChannel0, uv)`), so the originals paste
// in with minimal edits.

export interface PostEffect {
  /** Shown in the toolbar dropdown and accepted by ?pp=<name>. */
  name: string;
  author?: string;
  authorUrl?: string;
  /** Where the shader came from. */
  src?: string;
  license?: string;
  licenseUrl?: string;
  /** WGSL body: helpers + `fn mainImage(fragCoord: vec2f) -> vec4f`. */
  wgsl: string;
  /** Original GLSL body (Shadertoy `void mainImage(out vec4, in vec2)`), kept
   *  for the WebGL2 backend. Absent for DOOM-specific G-buffer effects. */
  glsl?: string;
}
