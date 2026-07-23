// The status bar. Ported from linuxdoom-1.10/st_stuff.c.
//
// Positions are the vanilla #defines. The bar is a 320x32 STBAR patch at the
// bottom of the 200-tall virtual screen, with number widgets, the face, the
// arms panel and key icons drawn over it.

import { weaponInfo, states, sprNames, AM } from './info.js';
import type { PPlayer } from './p_local.js';
import type { Quad } from './hud2d.js';
import type { IndexedImage } from './patch.js';

/** hu_stuff.c: the HUD font is STCFN033 ('!') .. STCFN095 ('_'). */
export function fontLumps(): string[] {
  const out: string[] = [];
  for (let c = 33; c <= 95; c++) out.push(`STCFN${String(c).padStart(3, '0')}`);
  return out;
}

/**
 * Lay out a string as HUD quads. hu_stuff.c: lowercase maps to uppercase, space
 * advances by 4, every other glyph advances by its own width. `patchOf` gives
 * the widths (from the HUD atlas).
 */
export function drawText(
  patchOf: Map<string, IndexedImage>, text: string, x: number, y: number,
): Quad[] {
  const quads: Quad[] = [];
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const c = ch.charCodeAt(0);
    if (c === 32) { cx += 4; continue; }
    if (c < 33 || c > 95) { cx += 4; continue; }
    const name = `STCFN${String(c).padStart(3, '0')}`;
    const img = patchOf.get(name);
    if (img) { quads.push({ name, x: cx, y }); cx += img.width; }
    else cx += 4;
  }
  return quads;
}

/**
 * Every weapon/flash sprite frame the player can show — the lumps the on-screen
 * gun is drawn from. Walk each weapon's up/down/ready/attack/flash state chains;
 * weapon sprites are always rotation 0 (`<name><frame>0`).
 */
export function weaponSpriteLumps(): string[] {
  const out = new Set<string>();
  const walk = (start: number): void => {
    let s = start;
    for (let g = 0; g < 64; g++) {
      if (s === 0) return;
      const st = states[s];
      out.add(`${sprNames[st.sprite]}${String.fromCharCode(65 + st.frame)}0`);
      s = st.nextState;
    }
  };
  for (const w of weaponInfo) {
    walk(w.upState); walk(w.downState); walk(w.readyState);
    walk(w.atkState); walk(w.flashState);
  }
  return [...out];
}

/** The lump name for a psprite's current state, or null for S_NULL. */
export function pspriteLump(stateNum: number): string | null {
  if (stateNum === 0) return null;
  const st = states[stateNum];
  return `${sprNames[st.sprite]}${String.fromCharCode(65 + st.frame)}0`;
}

/** Every lump the status bar needs — handed to createHud2D. */
export function statusBarLumps(): string[] {
  const l = ['STBAR', 'STARMS', 'STTPRCNT', 'STFB0', 'STFDEAD0', 'STFGOD0'];
  for (let i = 0; i < 10; i++) { l.push(`STTNUM${i}`, `STYSNUM${i}`); }
  for (let i = 2; i <= 7; i++) l.push(`STGNUM${i}`);        // arms weapon numbers
  for (let i = 0; i < 6; i++) l.push(`STKEYS${i}`);         // keycards + skulls
  // Faces: 5 pain levels x (3 straight + turn L/R + ouch + evil + kill).
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 3; j++) l.push(`STFST${i}${j}`);
    l.push(`STFTR${i}0`, `STFTL${i}0`, `STFOUCH${i}`, `STFEVL${i}`, `STFKILL${i}`);
  }
  return l;
}

const ST_Y = 168; // top of the bar in virtual space (200 - 32)

/** Draw a right-justified number: units first, moving left. */
function drawNum(quads: Quad[], value: number, rightX: number, y: number,
                 prefix: string, digitWidth: number): void {
  // Health/ammo of 0 still shows "0".
  let v = Math.abs(value);
  let x = rightX;
  do {
    quads.push({ name: `${prefix}${v % 10}`, x: x - digitWidth, y });
    x -= digitWidth;
    v = Math.floor(v / 10);
  } while (v > 0);
}

/**
 * ST_faceIndex: which face to show. The full logic tracks damage direction and
 * rampage; this covers the states you actually notice — god mode, dead, and the
 * pain level from current health.
 */
function faceLump(player: PPlayer): string {
  if (player.powers[0 /* invuln */] || false) { /* god face handled below */ }
  if (player.health <= 0) return 'STFDEAD0';

  // 5 pain levels: full health = 0, near death = 4.
  const pain = Math.min(4, Math.floor((100 - Math.min(player.health, 100)) / 20));
  return `STFST${pain}1`; // the forward-facing straight look
}

/** Build the status bar as a quad list, given the player. */
export function buildStatusBar(player: PPlayer): Quad[] {
  const quads: Quad[] = [];

  // Background bar.
  quads.push({ name: 'STBAR', x: 0, y: ST_Y });
  quads.push({ name: 'STARMS', x: 104, y: ST_Y }); // arms panel background

  // Ammo for the current weapon (blank for fist/chainsaw).
  const ammoType = currentAmmoType(player);
  if (ammoType >= 0) {
    drawNum(quads, player.ammo[ammoType], 44, 171, 'STTNUM', 14);
  }

  // Health, with a big percent sign.
  drawNum(quads, player.health, 90, 171, 'STTNUM', 14);
  quads.push({ name: 'STTPRCNT', x: 90, y: 171 });

  // Armour.
  drawNum(quads, player.armorPoints, 221, 171, 'STTNUM', 14);
  quads.push({ name: 'STTPRCNT', x: 221, y: 171 });

  // Arms panel: two rows of three, showing digits 2-7. Slot i shows the DIGIT
  // (i+2) and is lit when WEAPON (i+1) is owned — so slot 0 is digit "2" for the
  // pistol (wp_pistol=1), which the player always has. (Earlier I keyed both the
  // digit and the ownership off i+2, so the panel checked the shotgun for slot
  // 0 and never lit the pistol.)
  const armsX = [111, 123, 135, 111, 123, 135];
  const armsY = [172, 172, 172, 182, 182, 182];
  for (let i = 0; i < 6; i++) {
    if (player.weaponOwned[i + 1]) {
      quads.push({ name: `STGNUM${i + 2}`, x: armsX[i], y: armsY[i] });
    }
  }

  // Face.
  quads.push({ name: faceLump(player), x: 143, y: 168 });

  // Per-type ammo counts on the far right, small yellow font: current amount
  // (right edge x=288) and maximum (x=314). Rows are keyed by ammotype but the
  // y's place them as BULL / SHEL / RCKT / CELL (bullets, shells, rockets, cells).
  const ammoY = [173, 179, 191, 185]; // indexed by ammo type (0..3)
  for (let t = 0; t < 4; t++) {
    drawNum(quads, player.ammo[t], 288, ammoY[t], 'STYSNUM', 4);
    drawNum(quads, player.maxAmmo[t], 314, ammoY[t], 'STYSNUM', 4);
  }

  // Keys: blue/yellow/red down the right edge.
  const keyY = [171, 181, 191];
  for (let i = 0; i < 3; i++) {
    // cards[i] is the card; cards[i+3] is the skull. Skull shows if either.
    if (player.cards[i] || player.cards[i + 3]) {
      quads.push({ name: `STKEYS${player.cards[i + 3] && !player.cards[i] ? i + 3 : i}`, x: 239, y: keyY[i] });
    }
  }

  return quads;
}

/** ammotype_t of the ready weapon, or -1 for no-ammo weapons. */
function currentAmmoType(player: PPlayer): number {
  const ammo = weaponInfo[player.readyWeapon].ammo;
  return ammo === AM.am_noammo ? -1 : ammo;
}
