// Logs every P_Random draw made during LEVEL SETUP, to diff our spawn draw
// sequence against the vanilla reference and pinpoint where the order diverges.
//   npm run setupdraws -- DEMO1 > ours_draws.txt

import { readFileSync } from 'node:fs';
import { Wad } from '../src/wad.js';
import { readDemo } from '../src/demo.js';
import { setDrawLog } from '../src/m_random.js';

const buf = readFileSync('./doom1.wad');
const wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);
const demo = readDemo(wad, process.argv[2] ?? 'DEMO1');

const out: string[] = [];
const { setSpawnLog } = await import('../src/p_mobj.js');
setSpawnLog((type, x, y, c) => out.push(`SPWN t=${type} x=${x} y=${y} c=${c}`));

// Import + call AFTER the hook is set, so the setup draws are captured.
const { G_LoadLevel } = await import('../src/g_level.js');
G_LoadLevel(wad, `E${demo.episode}M${demo.map}`);

setDrawLog(null);
setSpawnLog(null);
console.log(out.join('\n'));
