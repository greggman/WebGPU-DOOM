// Validate src/opl3.ts against the byte-exact Nuked-OPL3 C reference.
// Reads D_E1M1.oplcap (register-write stream), replays it through our TS OPL3
// exactly as tools/oplref/oplref.c does, writes a WAV, and compares sample by
// sample against D_E1M1.ref.wav (rendered by the real C code).
import { readFileSync, writeFileSync } from 'node:fs';
import { OPL3 } from '../src/opl3.js';

const capName = process.argv[2] ?? 'D_E1M1';
const cap = readFileSync(`${capName}.oplcap`);
if (cap.toString('latin1', 0, 4) !== 'OPLC') throw new Error('bad magic');
const rate = cap.readUInt32LE(4);
const N = cap.readUInt32LE(8);
const count = cap.readUInt32LE(12);
console.log(`rate=${rate} samples=${N} writes=${count}`);

interface W { t: number; reg: number; val: number; }
const writes: W[] = [];
for (let i = 0; i < count; i++) {
  const o = 16 + i * 7;
  writes.push({ t: cap.readUInt32LE(o), reg: cap.readUInt16LE(o + 4), val: cap.readUInt8(o + 6) });
}

// Replay exactly like oplref.c: for each output sample t, apply all writes with
// t==current-sample, then generate one sample.
const chip = new OPL3(rate);
const pcm = new Int16Array(N);
const one = new Float32Array(1);
let wi = 0;
for (let t = 0; t < N; t++) {
  while (wi < count && writes[wi].t === t) {
    // Bypass capture; call the register interface directly.
    chip.write(writes[wi].reg, writes[wi].val);
    wi++;
  }
  chip.generate(one);
  // Our OPL3 outputs float = int16/32768 (left channel). Recover the int16 the C
  // harness stored (buf[0]). Round-trip via *32768; C stored the raw int16.
  pcm[t] = Math.round(one[0] * 32768);
}

// Write our WAV.
const wav = Buffer.alloc(44 + N * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 2, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22); wav.writeUInt32LE(rate, 24); wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(pcm[i], 44 + i * 2);
writeFileSync(`${capName}.ts.wav`, wav);

// Compare against the C reference WAV.
const ref = readFileSync(`${capName}.ref.wav`);
// find 'data' chunk
let p = 12;
while (ref.toString('latin1', p, p + 4) !== 'data') p += 8 + ref.readUInt32LE(p + 4);
const dataLen = ref.readUInt32LE(p + 4);
const refBase = p + 8;
const refCount = Math.min(N, dataLen >> 1);

let maxDiff = 0;
let over2 = 0;
let firstDiffAt = -1;
let sumSq = 0;
for (let i = 0; i < refCount; i++) {
  const r = ref.readInt16LE(refBase + i * 2);
  const m = pcm[i];
  const d = Math.abs(r - m);
  if (d > maxDiff) maxDiff = d;
  if (d > 2) { over2++; if (firstDiffAt < 0) firstDiffAt = i; }
  sumSq += d * d;
}
console.log(`compared ${refCount} samples`);
console.log(`max abs sample diff: ${maxDiff} (LSB of 32768)`);
console.log(`samples differing by > 2 LSB: ${over2} (${(100 * over2 / refCount).toFixed(4)}%)`);
console.log(`RMS diff: ${Math.sqrt(sumSq / refCount).toFixed(4)}`);
if (firstDiffAt >= 0) {
  console.log(`first >2 diff at sample ${firstDiffAt}: ref=${ref.readInt16LE(refBase + firstDiffAt * 2)} ts=${pcm[firstDiffAt]}`);
}
