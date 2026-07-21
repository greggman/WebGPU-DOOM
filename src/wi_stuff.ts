// The intermission ("finished" / "entering" screens). Ported from
// linuxdoom-1.10/wi_stuff.c, episode-1 (shareware) data only.
//
// Two screens over the animated episode map (WIMAP0 + the WIA* light anims):
//   StatCount  — the finished level's name, then kills/items/secret counting
//                up on the right while their labels sit on the left, then the
//                completion time and the par time along the bottom.
//   ShowNextLoc— splats on every level visited so far and a flashing "you are
//                here" pointer on the next one.
// A "use"/fire press accelerates each stage (snap the count, then advance).
//
// This is browser-only display code: it never runs in the headless timedemo or
// an attract demo (the intermission isn't part of a recorded demo), and it
// draws no P_Random, so demo playback is untouched. Sounds go straight to the
// audio backend like the weapon/pickup code does.

import type { Quad } from './hud2d.js';
import type { IndexedImage } from './patch.js';
import { S_StartSound } from './s_sound.js';

const TICRATE = 35;
const NUMMAPS = 9;

// wi_stuff.c layout constants (320x200 virtual space).
const WI_TITLEY = 2;
const SP_STATSX = 50;
const SP_STATSY = 50;
const SP_TIMEX = 16;
const SP_TIMEY = 200 - 32;
const SHOWNEXTLOCDELAY = 4;

// Where each level sits on the episode-1 world map (wi_stuff.c lnodes[0]).
const LNODES: [number, number][] = [
  [185, 164], [148, 143], [69, 122], [209, 102], [116, 89],
  [166, 55], [71, 56], [135, 29], [71, 24],
];

// The blinking lights on the episode-1 map (wi_stuff.c epsd0animinfo). Every
// entry is ANIM_ALWAYS with three frames cycling every TICRATE/3 tics; only the
// location differs. Frame lumps are WIA0<anim><frame>, e.g. WIA00000.
const ANIM_LOCS: [number, number][] = [
  [224, 104], [184, 160], [112, 136], [72, 112], [88, 96],
  [64, 48], [192, 40], [136, 16], [80, 16], [64, 24],
];
const ANIM_PERIOD = (TICRATE / 3) | 0;
const ANIM_FRAMES = 3;

const pad2 = (n: number): string => (n < 10 ? '0' + n : '' + n);

export interface WIStart {
  /** 0-based index of the finished level (E1M1 = 0). */
  last: number;
  /** 0-based index of the level being entered. */
  next: number;
  /** Percentages 0..100 (already computed by the caller). */
  kills: number;
  items: number;
  secret: number;
  /** Completion time and par time, in seconds. */
  time: number;
  par: number;
  /** Episode ender: show the tally, then finish — no "entering next" screen. */
  episodeEnd?: boolean;
}

export interface Intermission {
  /** True once the whole intermission is over — load the next level. */
  done: boolean;
  /** Begin the "finished" screen for a just-completed level. */
  start(a: WIStart): void;
  /** Advance one 35Hz tic: animations, the count-up, sounds. */
  tick(): void;
  /** A use/fire press: accelerate the current stage. */
  advance(): void;
  /** Build this frame's patch quads. */
  draw(patchOf: Map<string, IndexedImage>): Quad[];
}

/** Every WAD lump the intermission needs, for the HUD atlas. */
export function wiLumps(): string[] {
  const names = [
    'WIMAP0', 'WIF', 'WIENTER', 'WIOSTK', 'WIOSTI', 'WISCRT2',
    'WITIME', 'WIPAR', 'WIPCNT', 'WICOLON', 'WIMINUS', 'WISUCKS',
    'WISPLAT', 'WIURH0', 'WIURH1',
  ];
  for (let i = 0; i <= 9; i++) names.push('WINUM' + i);
  for (let i = 0; i < NUMMAPS; i++) names.push('WILV0' + i);
  for (let a = 0; a < ANIM_LOCS.length; a++)
    for (let f = 0; f < ANIM_FRAMES; f++) names.push('WIA0' + pad2(a) + pad2(f));
  return names;
}

export function createIntermission(): Intermission {
  // Per-animation runtime: ctr is the current frame (-1 = not yet shown).
  const anims = ANIM_LOCS.map(() => ({ ctr: -1, nexttic: 0 }));

  let bcnt = 0;                 // background tic counter (drives anims + sound cadence)
  let state: 'stat' | 'next' | 'done' = 'stat';
  let accelerate = false;

  let last = 0, next = 0;
  let episodeEnd = false; // last level of the episode: skip the "entering" screen
  let tKills = 0, tItems = 0, tSecret = 0, tTime = 0, tPar = 0; // targets

  let spState = 1;
  let cntPause = TICRATE;
  let cntKills = -1, cntItems = -1, cntSecret = -1, cntTime = -1, cntPar = -1;
  let cnt = 0;                  // ShowNextLoc countdown
  let pointerOn = true;         // "you are here" flash

  const wi: Intermission = { done: false, start, tick, advance, draw };

  function initAnimatedBack(): void {
    for (let i = 0; i < anims.length; i++) {
      anims[i].ctr = -1;
      // Stagger the initial phase so the lights don't blink in unison. Vanilla
      // uses M_Random here; a fixed offset is fine (display-only, demo-safe).
      anims[i].nexttic = bcnt + 1 + ((i * 7) % ANIM_PERIOD);
    }
  }

  function updateAnimatedBack(): void {
    for (const a of anims) {
      if (bcnt >= a.nexttic) {
        if (++a.ctr >= ANIM_FRAMES) a.ctr = 0;
        a.nexttic = bcnt + ANIM_PERIOD;
      }
    }
  }

  function initStats(): void {
    state = 'stat';
    accelerate = false;
    spState = 1;
    cntKills = cntItems = cntSecret = cntTime = cntPar = -1;
    cntPause = TICRATE;
    initAnimatedBack();
  }

  function initShowNextLoc(): void {
    state = 'next';
    accelerate = false;
    cnt = SHOWNEXTLOCDELAY * TICRATE;
    initAnimatedBack();
  }

  function start(a: WIStart): void {
    last = a.last; next = a.next;
    episodeEnd = a.episodeEnd ?? false;
    tKills = a.kills; tItems = a.items; tSecret = a.secret;
    tTime = a.time; tPar = a.par;
    bcnt = 0;
    wi.done = false;
    initStats();
  }

  function advance(): void { accelerate = true; }

  function updateStats(): void {
    updateAnimatedBack();

    // A press before the tally finishes snaps every counter to its final value.
    if (accelerate && spState !== 10) {
      accelerate = false;
      cntKills = tKills; cntItems = tItems; cntSecret = tSecret;
      cntTime = tTime; cntPar = tPar;
      S_StartSound(null, 'sfx_barexp');
      spState = 10;
    }

    if (spState === 2) {
      cntKills += 2;
      if (!(bcnt & 3)) S_StartSound(null, 'sfx_pistol');
      if (cntKills >= tKills) { cntKills = tKills; S_StartSound(null, 'sfx_barexp'); spState++; }
    } else if (spState === 4) {
      cntItems += 2;
      if (!(bcnt & 3)) S_StartSound(null, 'sfx_pistol');
      if (cntItems >= tItems) { cntItems = tItems; S_StartSound(null, 'sfx_barexp'); spState++; }
    } else if (spState === 6) {
      cntSecret += 2;
      if (!(bcnt & 3)) S_StartSound(null, 'sfx_pistol');
      if (cntSecret >= tSecret) { cntSecret = tSecret; S_StartSound(null, 'sfx_barexp'); spState++; }
    } else if (spState === 8) {
      if (!(bcnt & 3)) S_StartSound(null, 'sfx_pistol');
      cntTime += 3;
      if (cntTime >= tTime) cntTime = tTime;
      cntPar += 3;
      if (cntPar >= tPar) {
        cntPar = tPar;
        if (cntTime >= tTime) { S_StartSound(null, 'sfx_barexp'); spState++; }
      }
    } else if (spState === 10) {
      // After the tally: the episode ender finishes straight away (the finale
      // follows); otherwise show the "entering next level" map.
      if (accelerate) {
        S_StartSound(null, 'sfx_sgcock');
        if (episodeEnd) { state = 'done'; wi.done = true; }
        else initShowNextLoc();
      }
    } else if (spState & 1) {
      if (!--cntPause) { spState++; cntPause = TICRATE; }
    }
  }

  function updateShowNextLoc(): void {
    updateAnimatedBack();
    if (!--cnt || accelerate) { state = 'done'; wi.done = true; }
    else pointerOn = (cnt & 31) < 20;
  }

  function tick(): void {
    bcnt++;
    if (state === 'stat') updateStats();
    else if (state === 'next') updateShowNextLoc();
  }

  // --- drawing -----------------------------------------------------------
  // All coordinates are wi_stuff.c's V_DrawPatch origins; the HUD applies the
  // patch's own left/top offset, exactly as V_DrawPatch does.

  function draw(patchOf: Map<string, IndexedImage>): Quad[] {
    const q: Quad[] = [{ name: 'WIMAP0', x: 0, y: 0 }];
    for (let i = 0; i < anims.length; i++) {
      if (anims[i].ctr >= 0) {
        q.push({ name: 'WIA0' + pad2(i) + pad2(anims[i].ctr), x: ANIM_LOCS[i][0], y: ANIM_LOCS[i][1] });
      }
    }
    if (state === 'next') drawShowNextLoc(q, patchOf);
    else drawStats(q, patchOf);
    return q;
  }

  function centered(q: Quad[], patchOf: Map<string, IndexedImage>, name: string, y: number): number {
    const img = patchOf.get(name);
    const w = img ? img.width : 0;
    const h = img ? img.height : 0;
    q.push({ name, x: ((320 - w) / 2) | 0, y });
    return h;
  }

  // WI_drawNum: n right-aligned so its right edge is at x. Returns the new
  // (leftmost) x. `digits < 0` means "as many as the number needs".
  function drawNum(q: Quad[], patchOf: Map<string, IndexedImage>, x: number, y: number, n: number, digits: number): number {
    const fw = patchOf.get('WINUM0')?.width ?? 0;
    if (digits < 0) {
      if (n === 0) digits = 1;
      else { digits = 0; let t = n; while (t) { t = (t / 10) | 0; digits++; } }
    }
    const neg = n < 0;
    if (neg) n = -n;
    while (digits-- > 0) {
      x -= fw;
      q.push({ name: 'WINUM' + (n % 10), x, y });
      n = (n / 10) | 0;
    }
    if (neg) { x -= 8; q.push({ name: 'WIMINUS', x, y }); }
    return x;
  }

  // WI_drawPercent: the digits then a "%" whose left edge is at x.
  function drawPercent(q: Quad[], patchOf: Map<string, IndexedImage>, x: number, y: number, p: number): void {
    if (p < 0) return;
    q.push({ name: 'WIPCNT', x, y });
    drawNum(q, patchOf, x, y, p, -1);
  }

  // WI_drawTime: t seconds as M:SS, right-aligned ending at x. The minutes field
  // is dropped entirely for sub-minute times (":30"), exactly like DOOM — so the
  // par time shows ":30" while a longer completion time shows "1:23".
  function drawTime(q: Quad[], patchOf: Map<string, IndexedImage>, x: number, y: number, t: number): void {
    if (t < 0) return;
    const colonW = patchOf.get('WICOLON')?.width ?? 0;
    if (t <= 61 * 59) {
      let div = 1;
      do {
        const n = ((t / div) | 0) % 60;
        x = drawNum(q, patchOf, x, y, n, 2) - colonW;
        div *= 60;
        if (div === 60 || ((t / div) | 0) > 0) q.push({ name: 'WICOLON', x, y });
      } while (((t / div) | 0) > 0);
    } else {
      const sucksW = patchOf.get('WISUCKS')?.width ?? 0;
      q.push({ name: 'WISUCKS', x: x - sucksW, y });
    }
  }

  function drawStats(q: Quad[], patchOf: Map<string, IndexedImage>): void {
    const numH = patchOf.get('WINUM0')?.height ?? 0;
    const lh = ((3 * numH) / 2) | 0;

    // "Level name" then "finished", centered near the top.
    let y = WI_TITLEY;
    const nameH = centered(q, patchOf, 'WILV0' + last, y);
    y += ((5 * nameH) / 4) | 0;
    centered(q, patchOf, 'WIF', y);

    // Labels on the left, percentages right-aligned on the right.
    const right = 320 - SP_STATSX;
    q.push({ name: 'WIOSTK', x: SP_STATSX, y: SP_STATSY });
    drawPercent(q, patchOf, right, SP_STATSY, cntKills);
    q.push({ name: 'WIOSTI', x: SP_STATSX, y: SP_STATSY + lh });
    drawPercent(q, patchOf, right, SP_STATSY + lh, cntItems);
    q.push({ name: 'WISCRT2', x: SP_STATSX, y: SP_STATSY + 2 * lh });
    drawPercent(q, patchOf, right, SP_STATSY + 2 * lh, cntSecret);

    // Time and par along the bottom.
    q.push({ name: 'WITIME', x: SP_TIMEX, y: SP_TIMEY });
    drawTime(q, patchOf, 160 - SP_TIMEX, SP_TIMEY, cntTime);
    q.push({ name: 'WIPAR', x: 160 + SP_TIMEX, y: SP_TIMEY });
    drawTime(q, patchOf, 320 - SP_TIMEX, SP_TIMEY, cntPar);
  }

  function drawOnLnode(q: Quad[], patchOf: Map<string, IndexedImage>, n: number, names: string[]): void {
    const [lx, ly] = LNODES[n];
    for (const name of names) {
      const img = patchOf.get(name);
      if (!img) continue;
      const left = lx - img.leftOffset, top = ly - img.topOffset;
      if (left >= 0 && left + img.width < 320 && top >= 0 && top + img.height < 200) {
        q.push({ name, x: lx, y: ly });
        return;
      }
    }
  }

  function drawShowNextLoc(q: Quad[], patchOf: Map<string, IndexedImage>): void {
    // A splat on every level already finished (E1M9 is the secret exception).
    const splatLast = last === 8 ? next - 1 : last;
    for (let i = 0; i <= splatLast; i++) drawOnLnode(q, patchOf, i, ['WISPLAT']);
    // Flashing "you are here" on the level being entered.
    if (pointerOn) drawOnLnode(q, patchOf, next, ['WIURH0', 'WIURH1']);

    // "Entering" then the next level's name, centered near the top.
    let y = WI_TITLEY;
    const enterH = centered(q, patchOf, 'WIENTER', y);
    y += ((5 * enterH) / 4) | 0;
    centered(q, patchOf, 'WILV0' + next, y);
  }

  return wi;
}
