// PLAYPAL / COLORMAP upload. Ported from linuxdoom-1.10/r_data.c (R_InitColormaps)
// and v_video.c (I_SetPalette).
//
// PLAYPAL: 14 palettes x 256 entries x 3 bytes RGB.
//   0      normal
//   1-8    damage flash (increasing red)
//   9-12   item pickup (increasing gold)
//   13     radiation suit (green)
// COLORMAP: 34 rows x 256 bytes. Rows 0-31 are distance shading (0 = full
// bright, 31 = black), row 32 is the invulnerability remap, row 33 is unused.
//
// Vanilla swaps the hardware palette outright for damage/pickup tints, so we
// upload all 14 and select one with a uniform. That reproduces the tint exactly
// rather than approximating it with a blended overlay quad.

import type { Wad } from './wad.js';

export const PALETTE_COUNT = 14;
export const COLORMAP_ROWS = 34;

export interface PaletteResources {
  paletteTex: GPUTexture;   // 256 x 14, rgba8unorm
  colormapTex: GPUTexture;  // 256 x 34, r8uint
}

export function createPaletteResources(device: GPUDevice, wad: Wad): PaletteResources {
  const playpal = wad.lump('PLAYPAL');
  const colormap = wad.lump('COLORMAP');

  if (playpal.length < PALETTE_COUNT * 256 * 3) {
    throw new Error(`PLAYPAL too small: ${playpal.length}`);
  }
  if (colormap.length < COLORMAP_ROWS * 256) {
    throw new Error(`COLORMAP too small: ${colormap.length}`);
  }

  // RGB -> RGBA. This is the only palette copy we make; it dies after upload.
  const rgba = new Uint8Array(PALETTE_COUNT * 256 * 4);
  for (let i = 0; i < PALETTE_COUNT * 256; i++) {
    rgba[i * 4 + 0] = playpal[i * 3 + 0];
    rgba[i * 4 + 1] = playpal[i * 3 + 1];
    rgba[i * 4 + 2] = playpal[i * 3 + 2];
    rgba[i * 4 + 3] = 255;
  }

  const paletteTex = device.createTexture({
    label: 'PLAYPAL',
    size: [256, PALETTE_COUNT],
    format: 'rgba8unorm',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: paletteTex },
    rgba,
    { bytesPerRow: 256 * 4, rowsPerImage: PALETTE_COUNT },
    [256, PALETTE_COUNT],
  );

  // r8uint + textureLoad: integer fetch, no sampler, no filtering, no
  // half-texel normalization. An index lookup is not a sample.
  const colormapTex = device.createTexture({
    label: 'COLORMAP',
    size: [256, COLORMAP_ROWS],
    format: 'r8uint',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: colormapTex },
    colormap.subarray(0, COLORMAP_ROWS * 256),
    { bytesPerRow: 256, rowsPerImage: COLORMAP_ROWS },
    [256, COLORMAP_ROWS],
  );

  return { paletteTex, colormapTex };
}
