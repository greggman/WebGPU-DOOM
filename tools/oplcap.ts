// Capture the OPL register-write stream my sequencer produces for a track, plus
// render my own synth's WAV. The C harness (oplref.c, Nuked-OPL3) replays the
// same register stream to produce a reference WAV for A/B comparison.
//   npm run oplcap -- D_E1M1 40
import { readFileSync, writeFileSync } from 'node:fs';
import { Wad } from '../src/wad.js';
import { MusicPlayer } from '../src/music.js';
import { parseMus } from '../src/mus.js';

const buf = readFileSync('./doom1.wad');
const wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
const RATE = 44100;
const name = process.argv[2] ?? 'D_E1M1';
const secs = Number(process.argv[3] ?? 40);

const player = new MusicPlayer(wad.lump('GENMIDI'), RATE);
const cap = player.enableCapture();
player.play(parseMus(wad.lump(name))!, false);
const N = RATE * secs;
const out = new Float32Array(N);
for (let i = 0; i < N; i += 4096) player.generate(out.subarray(i, Math.min(i + 4096, N)));

// Binary register dump: magic, rate, N, count, then count × (u32 t, u16 reg, u8 val).
const rec = 7;
const dump = Buffer.alloc(16 + cap.length * rec);
dump.write('OPLC', 0); dump.writeUInt32LE(RATE, 4); dump.writeUInt32LE(N, 8); dump.writeUInt32LE(cap.length, 12);
for (let i = 0; i < cap.length; i++) {
  const o = 16 + i * rec;
  dump.writeUInt32LE(cap[i].t, o); dump.writeUInt16LE(cap[i].reg, o + 4); dump.writeUInt8(cap[i].val & 0xff, o + 6);
}
writeFileSync(`${name}.oplcap`, dump);

// My synth's WAV.
const wav = Buffer.alloc(44 + N * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + N * 2, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22); wav.writeUInt32LE(RATE, 24); wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(Math.max(-1, Math.min(1, out[i])) * 32767, 44 + i * 2);
writeFileSync(`${name}.mine.wav`, wav);

console.log(`${name}: ${cap.length} register writes captured over ${secs}s -> ${name}.oplcap, ${name}.mine.wav`);
// A quick tally of which register groups get written, as a sanity check.
const groups: Record<string, number> = {};
for (const w of cap) { const g = (w.reg & 0x100 ? 'B1:' : 'B0:') + (w.reg & 0xe0).toString(16); groups[g] = (groups[g] || 0) + 1; }
console.log('writes by reg-group:', JSON.stringify(groups));
const opl3on = cap.some(w => (w.reg & 0xff) === 0x05 && (w.reg & 0x100) && w.val === 1);
console.log('OPL3 "NEW" bit (reg 0x105=1) ever written by sequencer:', opl3on);
