// Wall texture composites. Ported from linuxdoom-1.10/r_data.c
// (R_InitTextures / R_GenerateComposite).
//
// A wall texture isn't a lump -- it's a recipe. TEXTURE1/TEXTURE2 list textures
// by name with a patch list; each entry places a patch (named via PNAMES) at an
// offset. We composite once at load into an rg8uint (index, coverage) image,
// the same format the flats and sprites use, so one pipeline draws everything.
//
// Vanilla composites lazily per column into the zone heap and re-does it on
// cache eviction. We build eagerly: E1's whole texture set is a few MB and the
// GPU keeps the only copy that matters.

import type { Wad } from './wad.js';
import { decodePatch } from './patch.js';

export interface Texture {
  name: string;
  width: number;
  height: number;
  /** rg8uint: [index, coverage]. Coverage 0 where no patch covers. */
  data: Uint8Array<ArrayBuffer>;
  /** True if any texel is uncovered — two-sided middles need alpha discard. */
  masked: boolean;
  /**
   * patch_t leftoffset/topoffset — the sprite anchor. r_things.c places a
   * sprite's top at thing.z + topOffset and its left edge at -leftOffset from
   * the thing's centre. Zero for walls and flats, which anchor at their corner.
   */
  leftOffset: number;
  topOffset: number;
}

function name8(b: Uint8Array, off: number): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    const c = b[off + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.toUpperCase();
}

/** PNAMES: int32 count, then count x 8-byte patch names. */
function loadPatchNames(wad: Wad): string[] {
  const l = wad.lump('PNAMES');
  const v = new DataView(l.buffer, l.byteOffset, l.byteLength);
  const n = v.getInt32(0, true);
  const out: string[] = [];
  for (let i = 0; i < n; i++) out.push(name8(l, 4 + i * 8));
  return out;
}

function parseTextureLump(
  wad: Wad,
  lumpName: string,
  pnames: string[],
  out: Map<string, Texture>,
): void {
  if (wad.checkNumForName(lumpName) < 0) return; // TEXTURE2 is absent in shareware
  const l = wad.lump(lumpName);
  const v = new DataView(l.buffer, l.byteOffset, l.byteLength);

  const numTextures = v.getInt32(0, true);
  for (let i = 0; i < numTextures; i++) {
    const ofs = v.getInt32(4 + i * 4, true);

    const name = name8(l, ofs);
    const width = v.getInt16(ofs + 12, true);
    const height = v.getInt16(ofs + 14, true);
    // ofs+16..19 is the obsolete columndirectory pointer.
    const patchCount = v.getInt16(ofs + 20, true);

    if (width <= 0 || height <= 0) continue;

    const data = new Uint8Array(width * height * 2); // zero => uncovered

    for (let p = 0; p < patchCount; p++) {
      const po = ofs + 22 + p * 10;
      const originX = v.getInt16(po, true);
      const originY = v.getInt16(po + 2, true);
      const patchIdx = v.getInt16(po + 4, true);

      const pname = pnames[patchIdx];
      if (pname === undefined) continue;
      const pnum = wad.checkNumForName(pname);
      if (pnum < 0) continue;

      let img;
      try {
        img = decodePatch(wad.lumpNum(pnum));
      } catch {
        continue; // a bad patch shouldn't take the whole texture set down
      }

      // Blit, clipped to the texture rect.
      for (let y = 0; y < img.height; y++) {
        const ty = originY + y;
        if (ty < 0 || ty >= height) continue;
        for (let x = 0; x < img.width; x++) {
          const tx = originX + x;
          if (tx < 0 || tx >= width) continue;
          const s = (y * img.width + x) * 2;
          if (img.data[s + 1] === 0) continue; // transparent source texel
          const d = (ty * width + tx) * 2;
          data[d + 0] = img.data[s + 0];
          data[d + 1] = 255;
        }
      }
    }

    let masked = false;
    for (let t = 1; t < data.length; t += 2) {
      if (data[t] === 0) { masked = true; break; }
    }

    out.set(name, { name, width, height, data, masked, leftOffset: 0, topOffset: 0 });
  }
}

export function loadTextures(wad: Wad): Map<string, Texture> {
  const pnames = loadPatchNames(wad);
  const out = new Map<string, Texture>();
  parseTextureLump(wad, 'TEXTURE1', pnames, out);
  parseTextureLump(wad, 'TEXTURE2', pnames, out);
  return out;
}

export interface TextureArray {
  texture: GPUTexture;
  /** Per-layer vec4f: size in .xy (the shader wraps against it), anchor in .zw. */
  sizes: GPUBuffer;
  layerOf: Map<string, number>;
  layerCount: number;
}

/**
 * Pack every texture into one texture_2d_array so the whole level is a single
 * draw. Layers are padded to the largest texture; DOOM's sizes vary 20 ways, so
 * padding wastes ~69% of 8 MB of VRAM, which is a good trade against either a
 * rect packer or a draw call per texture. Tiling still works because the shader
 * wraps manually against each layer's real size (it already had to: an
 * indexed texture can never be hardware-filtered).
 */
export function buildTextureArray(device: GPUDevice, textures: Texture[]): TextureArray {
  let maxW = 1, maxH = 1;
  for (const t of textures) { maxW = Math.max(maxW, t.width); maxH = Math.max(maxH, t.height); }

  const limit = device.limits.maxTextureArrayLayers;
  if (textures.length > limit) {
    throw new Error(`${textures.length} textures exceeds maxTextureArrayLayers (${limit})`);
  }

  const texture = device.createTexture({
    label: 'doom-textures',
    size: [maxW, maxH, textures.length],
    format: 'rg8uint',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });

  const layerOf = new Map<string, number>();
  const sizeData = new Float32Array(textures.length * 4);

  for (let i = 0; i < textures.length; i++) {
    const t = textures[i];
    layerOf.set(t.name, i);
    sizeData[i * 4 + 0] = t.width;
    sizeData[i * 4 + 1] = t.height;
    sizeData[i * 4 + 2] = t.leftOffset;
    sizeData[i * 4 + 3] = t.topOffset;
    // Upload only the real rect; the padding is never sampled because the
    // shader wraps against sizes[layer].
    device.queue.writeTexture(
      { texture, origin: [0, 0, i] },
      t.data,
      { bytesPerRow: t.width * 2, rowsPerImage: t.height },
      [t.width, t.height, 1],
    );
  }

  const sizes = device.createBuffer({
    label: 'texture-sizes',
    size: Math.max(16, sizeData.byteLength),
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
  });
  device.queue.writeBuffer(sizes, 0, sizeData);

  return { texture, sizes, layerOf, layerCount: textures.length };
}
