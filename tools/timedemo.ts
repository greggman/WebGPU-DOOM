// Demo playback harness. Runs headless — no WebGPU, no browser, no rendering.
//
//   npm run timedemo -- DEMO1
//
// A demo stores INPUT ONLY: no positions, no checksums. So this cannot verify
// sync against the file — there is nothing in it to compare to. What it can do
// is play the recorded input through the real playsim and report what happened,
// which catches gross divergence (a player stuck in one room is not playing the
// level) even though it can't localise a one-bit fixed-point error.

import { readFileSync } from 'node:fs';
import { Wad } from '../src/wad.js';
import { readDemo } from '../src/demo.js';
import { G_LoadLevel } from '../src/g_level.js';
import { P_Ticker } from '../src/p_ticker.js';
import { thinkerCount } from '../src/p_tick.js';
import { FRACUNIT } from '../src/m_fixed.js';

const WAD_PATH = './doom1.wad';
const which = process.argv[2] ?? 'DEMO1';

const buf = readFileSync(WAD_PATH);
const wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer);

const demo = readDemo(wad, which);
const mapName = `E${demo.episode}M${demo.map}`;
const level = G_LoadLevel(wad, mapName);
const { player } = level;
const mo = player.mo!;

const startX = mo.x / FRACUNIT;
const startY = mo.y / FRACUNIT;
const thingsAtStart = thinkerCount();

// Track coverage: a synced player walks the level, a desynced one grinds in one
// room. 128-unit cells are roughly a doorway wide.
const cells = new Set<string>();
let travelled = 0;
let prevX = startX, prevY = startY;

let exitTic = -1;
const t0 = performance.now();
for (let t = 0; t < demo.cmds.length; t++) {
  const c = demo.cmds[t];
  player.cmd.forwardMove = c.forwardMove;
  player.cmd.sideMove = c.sideMove;
  player.cmd.angleTurn = c.angleTurn;
  player.cmd.buttons = c.buttons;

  P_Ticker([player]);

  if (exitTic < 0 && level.exitRequested()) exitTic = t;

  const x = mo.x / FRACUNIT, y = mo.y / FRACUNIT;
  travelled += Math.hypot(x - prevX, y - prevY);
  prevX = x; prevY = y;
  cells.add(`${Math.floor(x / 128)},${Math.floor(y / 128)}`);
}
const ms = performance.now() - t0;

const endX = mo.x / FRACUNIT, endY = mo.y / FRACUNIT;

console.log(`${demo.name}  ${mapName}  skill ${demo.skill}  (demo version ${demo.version})`);
console.log(`  ${demo.cmds.length} tics simulated in ${ms.toFixed(0)}ms  (${(demo.cmds.length / ms * 1000).toFixed(0)} tics/sec, ${(demo.cmds.length / 35).toFixed(1)}s of gameplay)`);
console.log(`  things: ${thingsAtStart} at load, ${thinkerCount()} now`);
console.log(`  start (${startX.toFixed(0)}, ${startY.toFixed(0)})  ->  end (${endX.toFixed(0)}, ${endY.toFixed(0)})`);
console.log(`  ${Math.hypot(endX - startX, endY - startY).toFixed(0)} units from start, ${travelled.toFixed(0)} units travelled`);
console.log(`  visited ${cells.size} distinct 128-unit cells`);
console.log('');

// The one real pass/fail available without a reference implementation: these
// demos are recorded playthroughs, so a correctly-synced player reaches the
// exit. A desynced one never will — it's nearly impossible to pass by accident.
if (exitTic >= 0) {
  console.log(`  EXIT REACHED at tic ${exitTic} (${(exitTic / 35).toFixed(1)}s) — PASS`);
} else {
  console.log(`  exit not reached in ${demo.cmds.length} tics — FAIL`);
  console.log('  (the demo is a recorded playthrough, so a synced sim reaches the exit)');
}
process.exit(exitTic >= 0 ? 0 : 1);
