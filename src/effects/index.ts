// The post-process effect registry. Order here is the toolbar dropdown order.
// DOOM-specific G-buffer effects first, then the ported pico-8-post-processing
// collection (WGSL now; GLSL kept for the WebGL2 backend).

import type { PostEffect } from './effect.js';
import { passthrough, showNormals, showDepth, showUVs, outline, dof, sketch } from './gbuffer.js';
import { blueprint, crt, vhs, halftone, grayscale, posterize, pixelate } from './claude.js';
import { mattiasCRT } from './mattias-crt.js';
import { distortedTV } from './distorted-tv.js';
import { vcrDistortion } from './vcr-distortion.js';
import { glitch2 } from './glitch2.js';
import { bugInTheTV } from './bug-in-the-tv.js';
import { ledDisplay } from './led-display.js';
import { gameboyClassic } from './gameboy-classic.js';
import { cmykHalftone } from './cmyk-halftone.js';
import { matrix } from './matrix.js';
import { crosshatch } from './crosshatch.js';
import { chtest } from './chtest.js';
import { spriteId } from './spriteid.js';
import { envmap } from './envmap.js';
import { ssao } from './ssao.js';
import { oneBit } from './1bit.js';

export type { PostEffect } from './effect.js';

export const EFFECTS: PostEffect[] = [
  passthrough,
  showNormals,
  showDepth,
  showUVs,
  outline,
  dof,
  sketch,
  blueprint,
  crt,
  vhs,
  halftone,
  grayscale,
  posterize,
  pixelate,
  mattiasCRT,
  distortedTV,
  vcrDistortion,
  glitch2,
  bugInTheTV,
  ledDisplay,
  gameboyClassic,
  cmykHalftone,
  matrix,
  crosshatch,
  spriteId,
  envmap,
  ssao,
  oneBit,
  chtest,
];
