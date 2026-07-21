// Headless render of a MUS track through the OPL synth, to a playable WAV.
//   npm run musictest -- D_E1M1        (writes D_E1M1.wav in the project root)
import { readFileSync, writeFileSync } from 'node:fs';
import { Wad } from '../src/wad.js';
import { MusicPlayer } from '../src/music.js';
import { parseMus } from '../src/mus.js';
const buf = readFileSync('./doom1.wad');
const wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
const RATE = 44100;
const name = process.argv[2] ?? 'D_E1M1';
const player = new MusicPlayer(wad.lump('GENMIDI'), RATE);
player.play(parseMus(wad.lump(name))!, false);
const secs = Number(process.argv[3] ?? 20);
const out = new Float32Array(RATE * secs);
for (let i = 0; i < out.length; i += 4096) player.generate(out.subarray(i, Math.min(i + 4096, out.length)));
let rms = 0, peak = 0, nz = 0;
for (const s of out) { rms += s * s; peak = Math.max(peak, Math.abs(s)); if (s !== 0) nz++; }
console.log(`${name}: rms=${(Math.sqrt(rms / out.length)).toFixed(4)} peak=${peak.toFixed(4)} nonzero=${(100 * nz / out.length).toFixed(0)}%`);

// 16-bit mono PCM WAV
const n = out.length;
const wav = Buffer.alloc(44 + n * 2);
wav.write('RIFF', 0); wav.writeUInt32LE(36 + n * 2, 4); wav.write('WAVE', 8);
wav.write('fmt ', 12); wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22); wav.writeUInt32LE(RATE, 24); wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
wav.write('data', 36); wav.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) wav.writeInt16LE(Math.max(-1, Math.min(1, out[i])) * 32767, 44 + i * 2);
writeFileSync(`${name}.wav`, wav);
console.log(`wrote ${name}.wav (${secs}s)`);
