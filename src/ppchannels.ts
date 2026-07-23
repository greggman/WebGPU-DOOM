// User-loaded post-process textures (iChannel1..N), declared in the shader with a
// small YAML-ish comment spec and fetched from URLs. iChannel0 stays the scene
// colour and iChannelND the G-buffer, so user channels begin at 1.
//
//   // iChannel1: url                        2D texture, generated mips
//   // iChannel2:                            2D texture, explicit mips
//   //   mips:
//   //     - url  # mip 0
//   //     - url  # mip 1
//   // iChannel3:                            2D array, generated mips
//   //   layers:
//   //     - url  # layer 0
//   //     - url  # layer 1
//   // iChannel4:                            cube map (exactly 6 faces)
//   //   faces: [ +x, -x, +y, -y, +z, -z ]
//   // iChannel5:                            3D texture, generated mips
//   //   slices:
//   //     - url
//
// We're zero-dependency, so this is a hand parser for exactly this schema (not
// general YAML): a directive is `iChannelN:` with either an inline URL or a
// nested block whose single key is mips/layers/faces/slices followed by a `- url`
// list (a `[a, b, c]` flow list is also accepted).

export type ChannelKind = '2d' | 'array' | 'cube' | '3d';

export interface ChannelSpec {
  index: number;      // iChannelN
  kind: ChannelKind;
  urls: string[];
  explicitMips: boolean; // true only for the `mips:` form
  line: number;       // source line of the directive, for error reporting
}

export interface ChannelParse {
  specs: ChannelSpec[];
  errors: { line: number; message: string }[];
}

const KEY_KIND: Record<string, ChannelKind> = { mips: '2d', layers: 'array', faces: 'cube', slices: '3d' };

/** Parse iChannel directives out of a shader's `//` comments. */
export function parseChannels(src: string): ChannelParse {
  const specs: ChannelSpec[] = [];
  const errors: { line: number; message: string }[] = [];
  // Comment content (after `// `), keeping YAML indentation, with source line no.
  const cs: { text: string; line: number }[] = [];
  src.split('\n').forEach((l, i) => {
    const m = l.match(/^\s*\/\/ ?(.*?)\s*$/);
    if (m) cs.push({ text: m[1], line: i + 1 });
  });

  const flowList = (s: string): string[] | null => {
    const m = s.match(/^\[(.*)\]$/);
    return m ? m[1].split(',').map((u) => u.trim()).filter(Boolean) : null;
  };

  for (let i = 0; i < cs.length; i++) {
    const dm = cs[i].text.match(/^iChannel(\d+):\s*(.*)$/);
    if (!dm) continue;
    const index = Number(dm[1]);
    const rest = dm[2].trim();
    const at = cs[i].line;
    if (index === 0) { errors.push({ line: at, message: 'iChannel0 is the scene colour; user channels start at iChannel1' }); continue; }

    if (rest && !rest.startsWith('#')) {
      specs.push({ index, kind: '2d', urls: [rest.replace(/\s+#.*$/, '')], explicitMips: false, line: at });
      continue;
    }

    // Nested block: an indented `key:` then a `- url` list, or `key: [a, b]`.
    const km = i + 1 < cs.length ? cs[i + 1].text.match(/^\s+(mips|layers|faces|slices):\s*(.*)$/) : null;
    if (!km) { errors.push({ line: at, message: `iChannel${index}: expected a url, or mips/layers/faces/slices` }); continue; }
    const kind = KEY_KIND[km[1]];
    const explicitMips = km[1] === 'mips';
    let urls: string[] = [];
    const flow = flowList(km[2].trim());
    if (flow) { urls = flow; i += 1; }
    else {
      i += 1;
      while (i + 1 < cs.length && /^\s+-\s+/.test(cs[i + 1].text)) {
        urls.push(cs[i + 1].text.replace(/^\s+-\s+/, '').replace(/\s+#.*$/, '').trim());
        i += 1;
      }
    }
    if (urls.length === 0) { errors.push({ line: at, message: `iChannel${index}: ${km[1]} list is empty` }); continue; }
    if (kind === 'cube' && urls.length !== 6) { errors.push({ line: at, message: `iChannel${index}: a cube map needs exactly 6 faces, got ${urls.length}` }); continue; }
    specs.push({ index, kind, urls, explicitMips, line: at });
  }
  return { specs, errors };
}

export interface LoadedChannel {
  spec: ChannelSpec;
  width: number;
  height: number;
  /** RGBA8 pixels per url (level 0..n for mips; layer/slice/face otherwise). */
  images: Uint8Array<ArrayBuffer>[];
}

/** Decode an ImageBitmap to RGBA8 pixels via an OffscreenCanvas. */
async function toPixels(bmp: ImageBitmap): Promise<Uint8Array<ArrayBuffer>> {
  const c = new OffscreenCanvas(bmp.width, bmp.height);
  const ctx = c.getContext('2d')!;
  ctx.drawImage(bmp, 0, 0);
  const data = ctx.getImageData(0, 0, bmp.width, bmp.height).data;
  return new Uint8Array(data.buffer.slice(0)) as Uint8Array<ArrayBuffer>;
}

/** Fetch + decode + validate one channel. Rejects with a human-readable message. */
export async function loadChannel(spec: ChannelSpec): Promise<LoadedChannel> {
  const bmps = await Promise.all(spec.urls.map(async (u) => {
    let res: Response;
    try { res = await fetch(u); } catch { throw new Error(`iChannel${spec.index}: cannot fetch ${u}`); }
    if (!res.ok) throw new Error(`iChannel${spec.index}: ${u} -> HTTP ${res.status}`);
    try { return await createImageBitmap(await res.blob()); } catch { throw new Error(`iChannel${spec.index}: ${u} is not a decodable image`); }
  }));

  const w = bmps[0].width, h = bmps[0].height;
  if (spec.kind === 'cube' && w !== h) throw new Error(`iChannel${spec.index}: cube faces must be square (${w}x${h})`);
  if (spec.explicitMips) {
    // each level must be the previous halved (floor, min 1)
    for (let k = 1; k < bmps.length; k++) {
      const ew = Math.max(1, w >> k), eh = Math.max(1, h >> k);
      if (bmps[k].width !== ew || bmps[k].height !== eh) {
        throw new Error(`iChannel${spec.index}: mip ${k} must be ${ew}x${eh}, got ${bmps[k].width}x${bmps[k].height}`);
      }
    }
  } else if (spec.kind !== '2d') {
    // array/cube/3d: every layer/face/slice must match
    for (let k = 1; k < bmps.length; k++) {
      if (bmps[k].width !== w || bmps[k].height !== h) {
        throw new Error(`iChannel${spec.index}: all ${spec.kind} images must be ${w}x${h}, image ${k} is ${bmps[k].width}x${bmps[k].height}`);
      }
    }
  }
  const images = await Promise.all(bmps.map(toPixels));
  return { spec, width: w, height: h, images };
}

/** Box-filtered mip chain (incl. level 0) for arbitrary W x H rgba8 pixels. */
export function mipChain(level0: Uint8Array<ArrayBuffer>, w0: number, h0: number): { data: Uint8Array<ArrayBuffer>; w: number; h: number }[] {
  const levels = [{ data: level0, w: w0, h: h0 }];
  let src = level0, w = w0, h = h0;
  while (w > 1 || h > 1) {
    const nw = Math.max(1, w >> 1), nh = Math.max(1, h >> 1);
    const dst = new Uint8Array(nw * nh * 4) as Uint8Array<ArrayBuffer>;
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        const x0 = Math.min(2 * x, w - 1), x1 = Math.min(2 * x + 1, w - 1);
        const y0 = Math.min(2 * y, h - 1), y1 = Math.min(2 * y + 1, h - 1);
        const o = (y * nw + x) * 4;
        for (let ch = 0; ch < 4; ch++) {
          const a = src[(y0 * w + x0) * 4 + ch], b = src[(y0 * w + x1) * 4 + ch];
          const c = src[(y1 * w + x0) * 4 + ch], e = src[(y1 * w + x1) * 4 + ch];
          dst[o + ch] = (a + b + c + e + 2) >> 2;
        }
      }
    }
    levels.push({ data: dst, w: nw, h: nh });
    src = dst; w = nw; h = nh;
  }
  return levels;
}

/** WGSL / GLSL sampler type + WGSL viewDimension for each kind. */
export const CHANNEL_TYPES: Record<ChannelKind, { wgsl: string; glsl: string; view: GPUTextureViewDimension; glTarget: 'TEXTURE_2D' | 'TEXTURE_2D_ARRAY' | 'TEXTURE_CUBE_MAP' | 'TEXTURE_3D' }> = {
  '2d': { wgsl: 'texture_2d<f32>', glsl: 'sampler2D', view: '2d', glTarget: 'TEXTURE_2D' },
  'array': { wgsl: 'texture_2d_array<f32>', glsl: 'sampler2DArray', view: '2d-array', glTarget: 'TEXTURE_2D_ARRAY' },
  'cube': { wgsl: 'texture_cube<f32>', glsl: 'samplerCube', view: 'cube', glTarget: 'TEXTURE_CUBE_MAP' },
  '3d': { wgsl: 'texture_3d<f32>', glsl: 'highp sampler3D', view: '3d', glTarget: 'TEXTURE_3D' },
};
