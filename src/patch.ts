// DOOM patch_t decoding. Ported from linuxdoom-1.10/v_video.c (V_DrawPatch)
// and r_data.c (R_GenerateComposite).
//
// A patch is column-major and run-length encoded: for each column, a chain of
// posts { topdelta, length, pad, pixels[length], pad }, terminated by
// topdelta == 0xff. Gaps between posts are transparent.
//
// We decode to two planes -- palette index and coverage -- interleaved as
// rg8uint. The shader does textureLoad on that and discards where coverage is
// 0, so transparency never touches a filter and the index never gets
// interpolated. (Interpolating a palette index is meaningless: the average of
// index 3 and index 200 is not a color between them.)

export interface IndexedImage {
  width: number;
  height: number;
  /** rg8uint: [index, coverage] per texel, row-major. */
  data: Uint8Array<ArrayBuffer>;
  /** patch_t leftoffset/topoffset — sprite anchor, unused for fullscreen art. */
  leftOffset: number;
  topOffset: number;
}

export function decodePatch(lump: Uint8Array): IndexedImage {
  const view = new DataView(lump.buffer, lump.byteOffset, lump.byteLength);

  const width = view.getInt16(0, true);
  const height = view.getInt16(2, true);
  const leftOffset = view.getInt16(4, true);
  const topOffset = view.getInt16(6, true);

  if (width <= 0 || height <= 0 || width > 4096 || height > 4096) {
    throw new Error(`bad patch dimensions ${width}x${height}`);
  }

  const data = new Uint8Array(width * height * 2); // zero-filled => fully transparent

  for (let x = 0; x < width; x++) {
    let ofs = view.getUint32(8 + x * 4, true);

    // Vanilla trusts the WAD; we don't. A corrupt columnofs would otherwise
    // read past the lump and throw deep inside the post loop.
    if (ofs >= lump.length) throw new Error(`patch column ${x} offset out of range`);

    for (;;) {
      const topdelta = lump[ofs++];
      if (topdelta === 0xff) break;

      const length = lump[ofs++];
      ofs++; // leading pad byte, duplicates first pixel

      for (let i = 0; i < length; i++) {
        const y = topdelta + i;
        if (y >= 0 && y < height) {
          const t = (y * width + x) * 2;
          data[t + 0] = lump[ofs + i];
          data[t + 1] = 255;
        }
      }
      ofs += length;
      ofs++; // trailing pad byte
    }
  }

  return { width, height, data, leftOffset, topOffset };
}

export function createIndexedTexture(
  device: GPUDevice,
  img: IndexedImage,
  label: string,
): GPUTexture {
  const tex = device.createTexture({
    label,
    size: [img.width, img.height],
    format: 'rg8uint',
    usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
  });
  device.queue.writeTexture(
    { texture: tex },
    img.data,
    { bytesPerRow: img.width * 2, rowsPerImage: img.height },
    [img.width, img.height],
  );
  // img.data is now garbage-collectable — the GPU has the only copy that matters.
  return tex;
}
