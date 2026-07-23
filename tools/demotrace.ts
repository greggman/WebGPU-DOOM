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
import { randomIndices, pRandomCount, setDrawLog } from '../src/m_random.js';

const WAD_PATH = './doom1.wad';
const which = process.argv[2] ?? 'DEMO1';
const traceTic = process.argv[3] ? Number(process.argv[3]) : -1; // dump P_Random callers at this tic

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

  if (t === traceTic) {
    setDrawLog((n, v) => {
      const frames = (new Error().stack ?? '').split('\n').slice(2, 8).map((s) => s.trim().replace(/^at\s+/, ''));
      const caller = (frames.find((f) => !/P_Random|setDrawLog|drawLog|<anonymous>|Object\./.test(f)) ?? frames[0]).replace(/\s*\(.*/, '');
      console.error(`DRAW ${n} ${v} <- ${caller}`);
    });
    P_Ticker([player]);
    setDrawLog(null);
  } else {
    P_Ticker([player]);
  }

  // order-independent monster-state checksum, matching the C harness's CK line
  let sx = 0, sy = 0, smc = 0, smd = 0, sst = 0, shp = 0, n = 0, smx = 0, smy = 0, smz = 0;
  for (const sec of level.sim.sectors) {
    for (let m = sec.thingList; m; m = m.snext) {
      sx = (sx + m.x) | 0; sy = (sy + m.y) | 0;
      smc = (smc + m.moveCount) | 0; smd = (smd + m.moveDir) | 0;
      sst = (sst + m.state) | 0; shp = (shp + m.health) | 0; n++;
      smx = (smx + m.momx) | 0; smy = (smy + m.momy) | 0; smz = (smz + m.momz) | 0;
    }
  }
  console.error(`CK ${t} ${sx} ${sy} ${smc} ${smd} ${sst} ${shp} ${n} M ${smx} ${smy} ${smz}`);
  if (t === traceTic) {
    for (const sec of level.sim.sectors) {
      for (let m = sec.thingList; m; m = m.snext) console.error(`MOBJ type=${m.type} hp=${m.health} x=${m.x} y=${m.y} mx=${m.momx} my=${m.momy} fz=${m.floorZ}`);
    }
  }

  const { prndIndex } = randomIndices();
  // angle is unsigned 32-bit BAM; force unsigned for a stable print.
  const ang = mo.angle >>> 0;
  console.log(`${t} ${prndIndex} ${pRandomCount()} ${mo.x} ${mo.y} ${ang} ${player.health}`);
}
