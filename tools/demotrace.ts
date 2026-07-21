// Per-tic state dump for demo-sync debugging. Runs headless.
//
//   npm run demotrace -- DEMO1 > ours.txt
//
// Emits one line per tic: `tic prndIndex x y angle health`, with x/y/angle as
// RAW fixed_t / BAM integers (not divided) so it diffs byte-for-byte against a
// vanilla linuxdoom dump of the same fields. The FIRST line that differs is the
// tic our sim diverged from vanilla — and prndIndex diverging is the tell: it
// means we drew P_Random a different number of times than the original up to
// that tic. Everything downstream is noise; fix the first mismatch.

import { readFileSync } from 'node:fs';
import { Wad } from '../src/wad.js';
import { readDemo } from '../src/demo.js';
import { G_LoadLevel } from '../src/g_level.js';
import { P_Ticker } from '../src/p_ticker.js';
import { randomIndices, pRandomCount } from '../src/m_random.js';

const WAD_PATH = './doom1.wad';
const which = process.argv[2] ?? 'DEMO1';

const buf = readFileSync(WAD_PATH);
const wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);

const demo = readDemo(wad, which);
const level = G_LoadLevel(wad, `E${demo.episode}M${demo.map}`);
const { player } = level;
const mo = player.mo!;

// Header line so a diff points at the demo/map, not just bare numbers.
console.log(`# ${demo.name} E${demo.episode}M${demo.map} skill ${demo.skill} tics ${demo.cmds.length}`);
console.log(`# tic prnd draws x y angle health`);

for (let t = 0; t < demo.cmds.length; t++) {
  const c = demo.cmds[t];
  player.cmd.forwardMove = c.forwardMove;
  player.cmd.sideMove = c.sideMove;
  player.cmd.angleTurn = c.angleTurn;
  player.cmd.buttons = c.buttons;

  P_Ticker([player]);

  const { prndIndex } = randomIndices();
  // angle is unsigned 32-bit BAM; force unsigned for a stable print.
  const ang = mo.angle >>> 0;
  console.log(`${t} ${prndIndex} ${pRandomCount()} ${mo.x} ${mo.y} ${ang} ${player.health}`);
}
