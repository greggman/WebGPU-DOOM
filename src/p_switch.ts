// Switch textures (in the spirit of p_switch.c). A wall showing an "off" switch
// texture (SW1*) flips to its "on" pair (SW2*) when the player uses it, plays the
// switch sound at the line, and — if the line is repeatable — flips back after a
// second. It only renames a sidedef's texture and flags the geometry for a
// rebuild; it never draws P_Random, so demo playback stays bit-identical.

import { S_StartSoundAt } from './s_sound.js';
import type { PLine } from './p_local.js';
import type { SideDef } from './map.js';

const BUTTONTIME = 35; // one second at 35 Hz (vanilla BUTTONTIME = TICRATE)

type SlotKey = 'topTexture' | 'midTexture' | 'bottomTexture';
const SLOTS: SlotKey[] = ['topTexture', 'midTexture', 'bottomTexture'];

interface Button { side: SideDef; slot: SlotKey; restore: string; timer: number; x: number; y: number }

let pairs = new Map<string, string>(); // SW1x <-> SW2x, both directions
let sideDefs: SideDef[] = [];
let buttons: Button[] = [];
let geoDirty = false;

/** Build the SW1<->SW2 pairs the WAD actually ships and reset per-level state.
 *  Called at level load with every wall texture name. */
export function P_InitSwitchList(names: Set<string>, sides: SideDef[]): void {
  pairs = new Map();
  for (const name of names) {
    if (!name.startsWith('SW1')) continue;
    const alt = 'SW2' + name.slice(3);
    if (names.has(alt)) { pairs.set(name, alt); pairs.set(alt, name); }
  }
  sideDefs = sides;
  buttons = [];
  geoDirty = false;
}

/** Flip whichever of the front side's textures is a switch. Repeatable lines get
 *  a timer to flip back. `special` is the ORIGINAL line special (the exit switch
 *  clicks with a distinct sound). No-op on non-switch walls, so it's safe to call
 *  for every used line. */
export function P_ChangeSwitchTexture(line: PLine, useAgain: boolean, special: number): void {
  const side = sideDefs[line.sideNum[0]];
  if (!side) return;
  const x = (line.v1x + line.v2x) >> 1, y = (line.v1y + line.v2y) >> 1;
  const sound = special === 11 || special === 51 ? 'sfx_swtchx' : 'sfx_swtchn';
  for (const slot of SLOTS) {
    const alt = pairs.get(side[slot]);
    if (alt === undefined) continue;
    const was = side[slot];
    side[slot] = alt;
    geoDirty = true;
    S_StartSoundAt(x, y, sound);
    if (useAgain) buttons.push({ side, slot, restore: was, timer: BUTTONTIME, x, y });
    return;
  }
}

/** P_UpdateButtons: flip repeatable switches back to their "off" texture. */
export function P_UpdateButtons(): void {
  for (let i = buttons.length - 1; i >= 0; i--) {
    const b = buttons[i];
    if (--b.timer > 0) continue;
    b.side[b.slot] = b.restore;
    geoDirty = true;
    S_StartSoundAt(b.x, b.y, 'sfx_swtchn');
    buttons.splice(i, 1);
  }
}

/** True once when a switch changed a texture and the geometry must be rebuilt. */
export function P_ConsumeGeoDirty(): boolean {
  const d = geoDirty;
  geoDirty = false;
  return d;
}
