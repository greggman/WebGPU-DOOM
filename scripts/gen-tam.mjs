// Offline generator for the Tonal Art Map (Praun/Hoppe "Real-Time Hatching").
// Emits N tone-level cross-hatch images to texture/TAMStack/tam<k>.png. The
// levels NEST: each darker level is the lighter level plus one more stroke set,
// so blending between adjacent tones never pops. crosshatch.ts loads these as an
// array channel and blends the two levels bracketing the (fake-lit) tone.
//
// Run: node scripts/gen-tam.mjs   (Node built-ins only; zero deps.)

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

const crcTab = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTab[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}
function png(w, h, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, y * w * 4 + w * 4); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const S = 256;                 // tile size (repeat-wrapped in the shader)
const D2R = Math.PI / 180;
// Stroke sets added cumulatively, lightest -> darkest. Level k draws sets 0..k.
const SETS = [
  { a: 45, sp: 18, th: 1.4 },   // sparse single-direction
  { a: 135, sp: 18, th: 1.4 },  // begin cross-hatch
  { a: 45, sp: 9, th: 1.3 },    // denser
  { a: 135, sp: 9, th: 1.3 },
  { a: 45, sp: 4.5, th: 1.15 }, // dense
  { a: 135, sp: 4.5, th: 1.15 },
].map((s) => ({ c: Math.cos(s.a * D2R), s: Math.sin(s.a * D2R), sp: s.sp, th: s.th }));

const smooth = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

mkdirSync('texture/TAMStack', { recursive: true });
for (let level = 0; level < SETS.length; level++) {
  const rgba = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      let ink = 0;
      for (let k = 0; k <= level; k++) {
        const st = SETS[k];
        // Toroidal distance to the nearest line of this set, so tiling is seamless.
        const proj = x * st.c + y * st.s;
        let m = proj % st.sp; if (m < 0) m += st.sp;
        const dist = Math.min(m, st.sp - m);
        ink = Math.max(ink, 1 - smooth(st.th - 1, st.th, dist)); // 1 on the line, fades over ~1px
      }
      const v = Math.round((1 - ink) * 255); // white paper, black strokes
      const o = (y * S + x) * 4;
      rgba[o] = v; rgba[o + 1] = v; rgba[o + 2] = v; rgba[o + 3] = 255;
    }
  }
  writeFileSync(`texture/TAMStack/tam${level}.png`, png(S, S, rgba));
}
console.log(`wrote ${SETS.length} TAM levels to texture/TAMStack/ (${S}x${S})`);
