// The menu system. Ported from linuxdoom-1.10/m_menu.c.
//
// Menus are graphic patches (M_NGAME, M_OPTION, ...) stacked at LINEHEIGHT
// intervals, with an animated skull cursor (M_SKULL1/2) to the left of the
// current item. Main -> New Game -> skill, and Main -> Options -> the volume /
// screen-size / mouse / messages controls, drawn with DOOM's thermo sliders.

import type { Quad } from './hud2d.js';
import { S_StartSound } from './s_sound.js';

const LINEHEIGHT = 16;
const SKULLXOFF = -32;

/** Every menu graphic lump — handed to the HUD atlas builder. */
export function menuLumps(): string[] {
  return [
    'M_DOOM', 'M_NEWG', 'M_SKILL',
    'M_NGAME', 'M_OPTION', 'M_LOADG', 'M_SAVEG', 'M_RDTHIS', 'M_QUITG',
    'M_JKILL', 'M_ROUGH', 'M_HURT', 'M_ULTRA', 'M_NMARE',
    'M_SKULL1', 'M_SKULL2',
    'M_OPTTTL', 'M_MESSG', 'M_MSGON', 'M_MSGOFF', 'M_DETAIL', 'M_GDHIGH', 'M_GDLOW',
    'M_SCRNSZ', 'M_MSENS', 'M_SVOL', 'M_SFXVOL', 'M_MUSVOL',
    'M_THERML', 'M_THERMM', 'M_THERMR', 'M_THERMO',
  ];
}

interface MenuItem {
  lump: string;
  /** Enter / fire. */
  action?: (menu: Menu) => void;
  /** Left/Right adjust a value drawn as a thermo one line below the label. */
  slider?: { value: () => number; width: number; move: (dir: number) => void };
  /** An on/off or hi/lo patch drawn to the right of the label, at label x + dx. */
  indicator?: () => string;
  indicatorX?: number;
}
interface MenuDef {
  title?: { lump: string; x: number; y: number };
  x: number;
  y: number;
  items: MenuItem[];
}

export interface MenuHooks {
  /** Start a new game at the given skill (0..4) on E1M1. */
  newGame: (skill: number) => void;
  /** Sound/music gain, 0..1. */
  setSfxVolume?: (v01: number) => void;
  setMusicVolume?: (v01: number) => void;
  /** Screen-size slider at max hides the status bar (screenblocks 11). */
  setStatusBar?: (visible: boolean) => void;
  /** Head-up message display on/off. */
  setMessages?: (on: boolean) => void;
  /** Mouse look sensitivity, 0..9. */
  setMouseSens?: (v: number) => void;
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

export class Menu {
  active = false;
  private stack: MenuDef[] = [];
  private itemOn = 0;
  private skullTic = 0;
  private whichSkull = 0;

  // Option state (m_menu.c / m_misc.c defaults). Screen size 0..8 maps to
  // screenblocks 3..11; the vanilla default is screenblocks 9 (slider 6).
  private sfxVol = 8;
  private musVol = 8;
  private screenSize = 6;
  private mouseSens = 5;
  private messagesOn = true;
  private detail = 0;

  private readonly mainDef: MenuDef;
  private readonly skillDef: MenuDef;
  private readonly optionsDef: MenuDef;
  private readonly soundDef: MenuDef;

  constructor(private hooks: MenuHooks) {
    this.skillDef = {
      title: { lump: 'M_NEWG', x: 96, y: 14 },
      x: 48, y: 63,
      items: [
        { lump: 'M_JKILL', action: () => this.choose(0) },
        { lump: 'M_ROUGH', action: () => this.choose(1) },
        { lump: 'M_HURT', action: () => this.choose(2) },
        { lump: 'M_ULTRA', action: () => this.choose(3) },
        { lump: 'M_NMARE', action: () => this.choose(4) },
      ],
    };
    this.soundDef = {
      title: { lump: 'M_SVOL', x: 60, y: 38 },
      x: 80, y: 64,
      items: [
        { lump: 'M_SFXVOL', slider: { value: () => this.sfxVol, width: 16, move: (d) => this.setSfx(this.sfxVol + d) } },
        { lump: 'M_MUSVOL', slider: { value: () => this.musVol, width: 16, move: (d) => this.setMus(this.musVol + d) } },
      ],
    };
    this.optionsDef = {
      title: { lump: 'M_OPTTTL', x: 108, y: 15 },
      x: 60, y: 37,
      items: [
        { lump: 'M_MESSG', indicator: () => (this.messagesOn ? 'M_MSGON' : 'M_MSGOFF'), action: () => this.toggleMessages() },
        { lump: 'M_DETAIL', indicator: () => (this.detail ? 'M_GDLOW' : 'M_GDHIGH'), indicatorX: 175, action: () => { this.detail ^= 1; } },
        { lump: 'M_SCRNSZ', slider: { value: () => this.screenSize, width: 9, move: (d) => this.setScreen(this.screenSize + d) } },
        { lump: 'M_MSENS', slider: { value: () => this.mouseSens, width: 10, move: (d) => this.setSens(this.mouseSens + d) } },
        { lump: 'M_SVOL', action: () => this.push(this.soundDef) },
      ],
    };
    this.mainDef = {
      title: { lump: 'M_DOOM', x: 94, y: 2 },
      x: 97, y: 64,
      items: [
        { lump: 'M_NGAME', action: () => this.push(this.skillDef, 2) },
        { lump: 'M_OPTION', action: () => this.push(this.optionsDef) },
        { lump: 'M_RDTHIS', action: () => {} },
        { lump: 'M_QUITG', action: () => {} },
      ],
    };

    // Push the defaults through to the engine so the sliders reflect reality.
    hooks.setSfxVolume?.(this.sfxVol / 15);
    hooks.setMusicVolume?.(this.musVol / 15);
    hooks.setMouseSens?.(this.mouseSens);
    hooks.setStatusBar?.(this.screenSize < 8);
    hooks.setMessages?.(this.messagesOn);
  }

  // --- option setters (clamp, apply, and click) --------------------------
  private setSfx(v: number): void { this.sfxVol = clamp(v, 0, 15); this.hooks.setSfxVolume?.(this.sfxVol / 15); }
  private setMus(v: number): void { this.musVol = clamp(v, 0, 15); this.hooks.setMusicVolume?.(this.musVol / 15); }
  private setSens(v: number): void { this.mouseSens = clamp(v, 0, 9); this.hooks.setMouseSens?.(this.mouseSens); }
  private setScreen(v: number): void { this.screenSize = clamp(v, 0, 8); this.hooks.setStatusBar?.(this.screenSize < 8); }
  private toggleMessages(): void { this.messagesOn = !this.messagesOn; this.hooks.setMessages?.(this.messagesOn); }

  /** Open the top-level menu (Esc from gameplay, or the title screen). */
  open(): void {
    this.active = true;
    this.stack = [this.mainDef];
    this.itemOn = 0;
    S_StartSound(null, 'sfx_swtchn');
  }

  close(): void {
    this.active = false;
    this.stack = [];
  }

  private get current(): MenuDef { return this.stack[this.stack.length - 1]; }

  private push(def: MenuDef, startItem = 0): void {
    this.stack.push(def);
    this.itemOn = startItem;
    S_StartSound(null, 'sfx_pistol');
  }

  private pop(): void {
    S_StartSound(null, 'sfx_swtchx');
    if (this.stack.length > 1) { this.stack.pop(); this.itemOn = 0; }
    else this.close();
  }

  private choose(skill: number): void {
    this.close();
    this.hooks.newGame(skill);
  }

  /** Advance the blinking skull. Call once per frame. */
  tick(): void {
    if (!this.active) return;
    if (++this.skullTic >= 8) { this.skullTic = 0; this.whichSkull ^= 1; }
  }

  /** Returns true if the key was consumed. */
  key(code: string): boolean {
    if (!this.active) {
      if (code === 'Escape') { this.open(); return true; }
      return false;
    }
    const items = this.current.items;
    const it = items[this.itemOn];
    switch (code) {
      case 'ArrowDown': this.itemOn = (this.itemOn + 1) % items.length; S_StartSound(null, 'sfx_pstop'); return true;
      case 'ArrowUp': this.itemOn = (this.itemOn + items.length - 1) % items.length; S_StartSound(null, 'sfx_pstop'); return true;
      case 'ArrowLeft': if (it.slider) { it.slider.move(-1); S_StartSound(null, 'sfx_stnmov'); } return true;
      case 'ArrowRight': if (it.slider) { it.slider.move(1); S_StartSound(null, 'sfx_stnmov'); } return true;
      case 'Enter': case 'Space': it.action?.(this); return true;
      case 'Escape': case 'Backspace': this.pop(); return true;
      default: return false;
    }
  }

  /** y of each item's label line, leaving a blank line under every slider. */
  private itemYs(m: MenuDef): number[] {
    const ys: number[] = [];
    let y = m.y;
    for (const it of m.items) { ys.push(y); y += LINEHEIGHT; if (it.slider) y += LINEHEIGHT; }
    return ys;
  }

  private drawThermo(quads: Quad[], x: number, y: number, width: number, value: number): void {
    quads.push({ name: 'M_THERML', x, y });
    for (let i = 0; i < width; i++) quads.push({ name: 'M_THERMM', x: x + 8 + i * 8, y });
    quads.push({ name: 'M_THERMR', x: x + 8 + width * 8, y });
    quads.push({ name: 'M_THERMO', x: x + 8 + clamp(value, 0, width - 1) * 8, y });
  }

  /** Build the menu as HUD quads. Empty when inactive. */
  build(): Quad[] {
    if (!this.active) return [];
    const m = this.current;
    const quads: Quad[] = [];

    if (m.title) quads.push({ name: m.title.lump, x: m.title.x, y: m.title.y });

    const ys = this.itemYs(m);
    for (let i = 0; i < m.items.length; i++) {
      const it = m.items[i];
      quads.push({ name: it.lump, x: m.x, y: ys[i] });
      if (it.indicator) quads.push({ name: it.indicator(), x: m.x + (it.indicatorX ?? 120), y: ys[i] });
      if (it.slider) this.drawThermo(quads, m.x, ys[i] + LINEHEIGHT, it.slider.width, it.slider.value());
    }

    // The skull sits to the left of the current item, blinking.
    quads.push({
      name: this.whichSkull ? 'M_SKULL2' : 'M_SKULL1',
      x: m.x + SKULLXOFF,
      y: ys[this.itemOn] - 5,
    });

    return quads;
  }
}
