// Browser entry: run the playsim and render it.
//
// The sim ticks at a fixed 35Hz (DOOM's rate — it's baked into every speed
// constant in the game) while rendering runs at vsync. They are decoupled by an
// accumulator: never tie the sim to the display rate, or the game speed changes
// with the monitor.

import { Wad } from './wad.js';
import { createPaletteResources } from './palette.js';
import { createPass, writeGlobals } from './render.js';
import { buildTextureArray, loadTextures } from './textures.js';
import { buildLevelGeometry, mapYToWorldZ } from './level.js';
import { createSkyPass, writeSkyGlobals } from './sky.js';
import { createBillboardPass, INSTANCE_STRIDE } from './billboard.js';
import { spriteTextures } from './things.js';
import { initSpriteDefs, spriteRotation } from './sprites.js';
import { perspective, lookAt, multiply } from './mat4.js';
import { createWipe } from './wipe.js';
import { createHud2D, type Quad } from './hud2d.js';
import { createIntermission, wiLumps } from './wi_stuff.js';
import { S_ChangeMusic } from './s_sound.js';
import { createAudio } from './sound.js';
import { buildStatusBar, statusBarLumps, weaponSpriteLumps, pspriteLump, fontLumps, drawText } from './st_stuff.js';
import { Menu, menuLumps } from './m_menu.js';
import { G_LoadLevel } from './g_level.js';
import { P_InitSwitchList, P_ConsumeGeoDirty } from './p_switch.js';
import { M_CheatKey, type CheatEnv } from './m_cheat.js';
import { createAutomap, AM_Reveal } from './automap.js';
import { createFreeCamera } from './d_freecamera.js';
import { readDemo } from './demo.js';
import { ps_weapon, ps_flash } from './p_pspr.js';
import { PST_DEAD } from './p_user.js';
import { P_KillMobj } from './p_inter.js';
import { MF } from './info.js';
import type { PPlayer } from './p_local.js';
import { P_Ticker, P_LevelTime } from './p_ticker.js';
import { updateAnimTranslation } from './p_anim.js';
import { allThinkers } from './p_tick.js';
import { FRACBITS, FRACUNIT } from './m_fixed.js';
import { BT_ATTACK, BT_USE } from './p_user.js';
import { sprNames, states, mobjInfo } from './info.js';

declare let Stats: any;
const stats = new Stats();
stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

const WAD_URL = './doom1.wad';
const MAP = 'E1M1';

/** DOOM's tic rate. Every speed constant in the game assumes it. */
const TICRATE = 35;
const MS_PER_TIC = 1000 / TICRATE;

/** Episode-1 par times in seconds (E1M1..E1M9), from g_game.c's pars table. */
const PAR_E1 = [30, 75, 120, 90, 90, 165, 105, 30, 135];

/** Vanilla's field of view is 90 degrees horizontal. */
const FOV_X = Math.PI / 2;
/** g_game.c forwardmove[1] / sidemove[1] — the run speeds. */
const FORWARD_RUN = 50;
const SIDE_RUN = 40;
/** g_game.c angleturn[] — BAM per tic, as the high byte the ticcmd stores. */
const TURN_SPEED = 640;

/**
 * PLAYPAL row for the screen tint. v_video.c: pain flashes red (rows 1-8),
 * pickups gold (9-12), radsuit green (13). The counters decay each tic, so the
 * flash fades — the same mechanism vanilla used, for free, because it's a
 * palette swap.
 */
function paletteRow(p: { damageCount: number; bonusCount: number; powers: number[] }): number {
  if (p.damageCount) {
    const n = Math.min(8, ((p.damageCount + 7) >> 3)); // 1..8, redder when hurt more
    return n;
  }
  if (p.bonusCount) return Math.min(12, 9 + ((p.bonusCount + 7) >> 3) - 1);
  if (p.powers[3 /* ironfeet */] > 0) return 13; // radsuit green
  return 0;
}

const cross = (a: number[], b: number[]): number[] =>
  [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const norm = (v: number[]): number[] => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0]/l, v[1]/l, v[2]/l];
};

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;

  if (!navigator.gpu) throw new Error('WebGPU not available in this browser');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('no WebGPU adapter');

  // The atlas holds every wall/flat the level uses plus ALL 483 sprite lumps in
  // the WAD — 562 layers at worst (E1M2). WebGPU's DEFAULT maxTextureArrayLayers
  // is 256, the spec's guaranteed minimum, but adapters typically expose 2048.
  // Ask for what this one has.
  const NEEDED_LAYERS = 600;
  const wantLayers = Math.min(adapter.limits.maxTextureArrayLayers, 1024);
  const device = await adapter.requestDevice({
    requiredLimits: { maxTextureArrayLayers: wantLayers },
  });
  if (device.limits.maxTextureArrayLayers < NEEDED_LAYERS) {
    console.warn(`maxTextureArrayLayers is ${device.limits.maxTextureArrayLayers}; ` +
                 `levels need up to 562 — the atlas will fail to build. ` +
                 `Splitting walls and sprites into separate arrays would halve this.`);
  }

  // --- diagnostics: surface GPU failure instead of freezing silently -------
  // A WebGPU device loss (OOM, a validation error the driver can't recover) is
  // async — it never throws in JS and never trips "Page Unresponsive", so a
  // frozen canvas is all you'd see. Make it loud.
  const fatal = (msg: string): void => {
    console.error(msg);
    const el = document.createElement('pre');
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;margin:0;padding:8px;z-index:99;' +
      'background:#600;color:#fff;font:12px monospace;white-space:pre-wrap';
    el.textContent = msg;
    document.body.appendChild(el);
  };
  device.lost.then((info) => fatal(`WebGPU DEVICE LOST: ${info.reason} — ${info.message}`));
  device.addEventListener('uncapturederror', (e) => {
    console.error('WebGPU error:', (e as GPUUncapturedErrorEvent).error);
  });

  const context = canvas.getContext('webgpu')!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });

  // DOOM's screen melt: the frame renders into an offscreen texture, then a
  // final pass blits it — or melts the previous screen over it on a transition.
  const wipe = createWipe(device, format);
  const automap = createAutomap(device, format);
  const freeCam = createFreeCamera();

  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());

  const { paletteTex, colormapTex } = createPaletteResources(device, wad);

  // --- create-once resources (survive level changes) -----------------------
  const pass = createPass(device, format);
  const skyPass = createSkyPass(device, format);
  const spritePass = createBillboardPass(device, format);
  const wallTex = loadTextures(wad);
  const spriteDefs = initSpriteDefs(wad);
  // Sprite lumps are the same for every level (blood/puffs/rockets are runtime
  // spawns, so the whole WAD set is always loaded); only wall/flat textures
  // differ. Decode sprites once.
  const sprTex = spriteTextures(wad, spriteDefs);

  const hud = createHud2D(device, format, paletteTex.createView(), wad,
    // TITLEPIC/CREDIT are the full-screen 320x200 attract pages.
    ['TITLEPIC', 'CREDIT', ...statusBarLumps(), ...weaponSpriteLumps(), ...menuLumps(), ...fontLumps(), ...wiLumps()]);

  const intermission = createIntermission();

  // Web Audio backend for sound effects (and music, once the OPL player lands).
  // Registers itself as the s_sound.ts backend; the sim just calls S_StartSound.
  const audio = createAudio(wad);

  const MAX_SPRITES = 1024;
  const instances = new Float32Array(MAX_SPRITES * (INSTANCE_STRIDE / 4));
  const instanceBuf = device.createBuffer({
    label: 'sprite-instances',
    size: MAX_SPRITES * INSTANCE_STRIDE,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const camScratch = new Float32Array(4);

  // --- per-level resources, rebuilt on every level change ------------------
  interface LevelGpu {
    level: ReturnType<typeof G_LoadLevel>;
    geo: ReturnType<typeof buildLevelGeometry>;
    spriteLayer: Map<string, number>;
    atlas: ReturnType<typeof buildTextureArray>;
    vbo: GPUBuffer;
    vboCapacity: number;
    sectorLightData: Float32Array<ArrayBuffer>;
    sectorLightBuf: GPUBuffer;
    /** Per-layer animation redirect (DOOM's flat/texture translation). */
    texTransData: Uint32Array<ArrayBuffer>;
    texTransBuf: GPUBuffer;
    bindGroup: GPUBindGroup;
    skyBindGroup: GPUBindGroup;
    spriteBindGroup: GPUBindGroup;
    /** Snapshots for the "rebuild geometry only when a sector moved" check. */
    lastFloor: number[];
    lastCeil: number[];
  }

  /**
   * Load a map and (re)build all its GPU resources. `carry` inherits the
   * player's inventory from the previous level — DOOM keeps weapons, ammo,
   * health and armour between levels; only keys and position reset.
   */
  function loadLevel(mapName: string, skill: number, carry?: PPlayer): LevelGpu {
    const level = G_LoadLevel(wad, mapName, skill);
    if (carry) {
      const p = level.player;
      p.health = carry.health;
      p.armorPoints = carry.armorPoints;
      p.armorType = carry.armorType;
      p.ammo = [...carry.ammo];
      p.maxAmmo = [...carry.maxAmmo];
      p.weaponOwned = [...carry.weaponOwned];
      p.readyWeapon = carry.readyWeapon;
      p.backpack = carry.backpack;
      if (p.mo) p.mo.health = carry.health;
    }

    const geo = buildLevelGeometry(wad, level.map, wallTex);
    // Switch textures use the WAD's SW1/SW2 pairs; they mutate these sidedefs.
    P_InitSwitchList(new Set(wallTex.keys()), level.map.sideDefs);
    const spriteLayer = new Map<string, number>();
    for (let i = 0; i < sprTex.length; i++) spriteLayer.set(sprTex[i].name, geo.textures.length + i);

    const atlas = buildTextureArray(device, [...geo.textures, ...sprTex]);

    const vboCapacity = Math.ceil(geo.vertices.byteLength * 1.5);
    const vbo = device.createBuffer({
      label: 'level',
      size: vboCapacity,
      usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(vbo, 0, geo.vertices);

    const sectorLightData = new Float32Array(level.sim.sectors.length);
    const sectorLightBuf = device.createBuffer({
      label: 'sector-light',
      size: Math.max(16, sectorLightData.byteLength),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    // Layer-redirect table for animated flats/textures: identity by default, so
    // a static level renders unchanged; the tic loop rewrites the animated slots.
    const texTransData = new Uint32Array(geo.textures.length);
    for (let i = 0; i < texTransData.length; i++) texTransData[i] = i;
    const texTransBuf = device.createBuffer({
      label: 'tex-translation',
      size: Math.max(16, texTransData.byteLength),
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(texTransBuf, 0, texTransData);

    const bindGroup = device.createBindGroup({
      layout: pass.layout,
      entries: [
        { binding: 0, resource: { buffer: pass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: colormapTex.createView() },
        { binding: 3, resource: atlas.texture.createView() },
        { binding: 4, resource: { buffer: atlas.sizes } },
        { binding: 5, resource: { buffer: sectorLightBuf } },
        { binding: 6, resource: { buffer: texTransBuf } },
      ],
    });
    const skyBindGroup = device.createBindGroup({
      layout: skyPass.layout,
      entries: [
        { binding: 0, resource: { buffer: skyPass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: atlas.texture.createView() },
        { binding: 3, resource: { buffer: atlas.sizes } },
      ],
    });
    const spriteBindGroup = device.createBindGroup({
      layout: spritePass.layout,
      entries: [
        { binding: 0, resource: { buffer: pass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: colormapTex.createView() },
        { binding: 3, resource: atlas.texture.createView() },
        { binding: 4, resource: { buffer: atlas.sizes } },
        { binding: 5, resource: { buffer: spritePass.camera } },
      ],
    });

    console.log(`${mapName}: ${geo.count / 3} tris, ${atlas.layerCount} layers, ${allThinkers().length} thinkers`);

    return {
      level, geo, spriteLayer, atlas, vbo, vboCapacity,
      sectorLightData, sectorLightBuf, texTransData, texTransBuf,
      bindGroup, skyBindGroup, spriteBindGroup,
      lastFloor: level.sim.sectors.map((s) => s.floorHeight),
      lastCeil: level.sim.sectors.map((s) => s.ceilingHeight),
    };
  }

  let skill = 2;
  let cur = loadLevel(MAP, skill); // a level must exist before the first frame;
  // the title screen freezes it and the attract loop swaps it for the demo maps.

  /**
   * Switch levels. DESTROYS the outgoing level's GPU resources first — each
   * level's atlas is ~40 MB, and without this every level change (demo cycle,
   * exit, respawn, warp) leaked one, exhausting GPU memory until the device was
   * silently lost and the canvas froze.
   */
  function swap(next: LevelGpu): void {
    const old = cur;
    cur = next;
    old.atlas.texture.destroy();
    old.atlas.sizes.destroy();
    old.vbo.destroy();
    old.sectorLightBuf.destroy();
    old.texTransBuf.destroy();
    // Every level (in play OR a demo) plays its own track, e.g. E1M5 -> D_E1M5.
    S_ChangeMusic('D_' + next.level.map.name, true);
  }

  // Game mode. 'play' runs the sim; 'intermission' shows the between-level
  // stats and waits for a key; the player keeps ticking while dead so the world
  // stays live behind the "press fire" prompt.
  // d_englsh.h E1TEXT — the shareware episode-end screen.
  const E1TEXT = [
    "Once you beat the big badasses and",
    "clean out the moon base you're supposed",
    "to win, aren't you? Aren't you? Where's",
    "your fat reward and ticket home? What",
    "the hell is this? It's not supposed to",
    "end this way!",
    "",
    "It stinks like rotten meat, but looks",
    "like the lost Deimos base.  Looks like",
    "you're stuck on The Shores of Hell.",
    "The only way out is through.",
    "",
    "To continue the DOOM experience, play",
    "The Shores of Hell and its amazing",
    "sequel, Inferno!",
  ];

  type Mode = 'title' | 'play' | 'intermission' | 'finale' | 'attract';
  let mode: Mode = 'title';

  // Dev-only affordances for headless render checks, all no-ops unless ?dev is
  // in the URL. `?magenta` clears to magenta so geometry seams (uncovered
  // pixels) are unmistakable; window.__dev.warp drops the player at an exact
  // spot/angle so a screenshot always frames the same view.
  const devParams = new URLSearchParams(location.search);
  const devMagenta = devParams.has('magenta');
  const devPlayerPos = devParams.has('playerpos'); // overlay live X/Y/angle
  let devFrozen = false; // when a dev warp holds the player still for a screenshot

  // The attract loop, exactly as the shipping game (d_main.c D_DoAdvanceDemo).
  // Shareware order: title screen -> DEMO1 -> credits -> DEMO2 -> title -> DEMO3,
  // then wrap. The recorded demos still desync (the playsim isn't yet frame-exact
  // for the WHOLE demo) — a demo that ends early just advances the sequence.
  let demoSeq = -1;                    // advanceDemo() bumps to 0 first
  let pageName = 'TITLEPIC';           // the full-screen graphic shown in 'title'
  let pageTic = 0;                     // tics until the page auto-advances
  let demo: ReturnType<typeof readDemo> | null = null;
  let demoTic = 0;

  function showPage(name: string, tics: number): void {
    pageName = name;
    pageTic = tics;
    mode = 'title';
    // The title greets you with "At Doom's Gate" (E1M1); the credits keep the
    // quieter D_INTRO. Both loop under the page until the attract advances.
    S_ChangeMusic(name === 'TITLEPIC' ? 'D_E1M1' : 'D_INTRO', true);
  }
  function playDemo(n: number): void {
    demo = readDemo(wad, `DEMO${n}`);
    demoTic = 0;
    swap(loadLevel(`E${demo.episode}M${demo.map}`, demo.skill));
    mode = 'attract';
  }
  function advanceDemo(): void {
    demoSeq = (demoSeq + 1) % 6;
    switch (demoSeq) {
      case 0: showPage('TITLEPIC', 170); break;
      case 1: playDemo(1); break;
      case 2: showPage('CREDIT', 200); break;
      case 3: playDemo(2); break;
      case 4: showPage('TITLEPIC', 170); break;
      case 5: playDemo(3); break;
    }
  }
  let pendingMap = '';                 // where the intermission leads
  let pendingFinale = false;           // after the E1M8 tally, roll the finale
  // Edge-triggered "continue" presses, set by keydown/mousedown, consumed by
  // the frame loop so a held key doesn't skip through screens.
  let interAdvance = false;
  let deadAdvance = false;

  const pct = (n: number, total: number): number => total > 0 ? Math.floor((100 * n) / total) : 100;

  /** Parse "E1M3" -> 0-based level index 2. */
  const levelIndex = (name: string): number => (parseInt(name.slice(3), 10) || 1) - 1;

  function enterIntermission(secret: boolean): void {
    const p = cur.level.player;
    pendingMap = nextMapName(cur.level.map.name, secret);
    intermission.start({
      last: levelIndex(cur.level.map.name),
      next: levelIndex(pendingMap),
      kills: pct(p.killCount, cur.level.totalKills),
      items: pct(p.itemCount, cur.level.totalItems),
      secret: pct(p.secretCount, cur.level.totalSecret),
      time: Math.floor(P_LevelTime() / TICRATE),
      par: PAR_E1[levelIndex(cur.level.map.name)] ?? 0,
      episodeEnd: /M8$/.test(cur.level.map.name) && !secret,
    });
    mode = 'intermission';
    if (document.pointerLockElement === canvas) document.exitPointerLock();
  }

  /** The player is dead. Fire/use restarts the CURRENT level pistol-start. */
  function respawn(): void {
    swap(loadLevel(cur.level.map.name, skill)); // no carry — you lose it all
    mode = 'play';
  }

  // --- console -------------------------------------------------------------
  // DOOM proper had typed cheat codes (iddqd, idclev), not a console — but a
  // console is friendlier for testing. Backtick toggles it.
  let consoleOpen = false;
  let consoleText = '';
  const consoleLog: string[] = ['webgpu-doom console. try: god, noclip, warp E1M3, give, kill'];

  function runConsole(raw: string): void {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    consoleLog.push(`> ${cmd}`);
    const [verb, arg] = cmd.split(/\s+/);
    const p = cur.level.player;
    switch (verb) {
      case 'god':
        p.cheatGod = !p.cheatGod;
        if (p.cheatGod) { p.health = Math.max(p.health, 100); if (p.mo) p.mo.health = p.health; }
        consoleLog.push(`god mode ${p.cheatGod ? 'ON' : 'off'}`);
        break;
      case 'noclip':
        p.cheatNoClip = !p.cheatNoClip;
        if (p.mo) p.mo.flags = p.cheatNoClip ? p.mo.flags | MF.MF_NOCLIP : p.mo.flags & ~MF.MF_NOCLIP;
        consoleLog.push(`noclip ${p.cheatNoClip ? 'ON' : 'off'}`);
        break;
      case 'warp':
      case 'map': {
        const name = (arg ?? '').toUpperCase();
        if (/^E\dM\d$/.test(name) && wad.checkNumForName(name) >= 0) {
          swap(loadLevel(name, skill, p));
          mode = 'play';
          consoleLog.push(`warped to ${name}`);
        } else consoleLog.push(`no such map: ${arg}`);
        break;
      }
      case 'give':
        for (let i = 0; i < 9; i++) p.weaponOwned[i] = true;
        p.ammo = p.maxAmmo.map((m) => m);
        for (let i = 0; i < 6; i++) p.cards[i] = true;
        p.armorPoints = 200; p.armorType = 2;
        consoleLog.push('gave all weapons, ammo, keys, armour');
        break;
      case 'kill': {
        let n = 0;
        for (const sec of cur.level.sim.sectors) {
          for (let m = sec.thingList; m; m = m.snext) {
            if ((m.flags & MF.MF_COUNTKILL) && m.health > 0) { P_KillMobj(null, m); n++; }
          }
        }
        consoleLog.push(`killed ${n} monsters`);
        break;
      }
      case 'skill':
        skill = Math.max(0, Math.min(4, parseInt(arg ?? '2', 10)));
        consoleLog.push(`skill = ${skill} (applies on next level load)`);
        break;
      case 'freecam': {
        const mo = p.mo;
        if (mo) {
          freeCam.toggle([mo.x / FRACUNIT, p.viewZ / FRACUNIT, mapYToWorldZ(mo.y / FRACUNIT)],
            (mo.angle / 4294967296) * Math.PI * 2);
          if (freeCam.active && document.pointerLockElement !== canvas) void canvas.requestPointerLock();
        }
        consoleLog.push(`free camera ${freeCam.active ? 'ON — WASD move, mouse look, Q/E down/up, Shift fast' : 'off'}`);
        consoleOpen = false; // close the console so WASD reaches the camera immediately
        break;
      }
      default:
        consoleLog.push(`unknown: ${verb}`);
    }
    while (consoleLog.length > 6) consoleLog.shift();
  }

  /**
   * ExMy progression for episode 1. A normal exit advances the map number
   * (M8 loops back to M1); a secret exit jumps to M9, which returns to M4.
   */
  function nextMapName(current: string, secret: boolean): string {
    const m = /^E(\d)M(\d)$/.exec(current)!;
    const ep = m[1];
    const map = parseInt(m[2], 10);
    if (secret) return `E${ep}M9`;
    if (map === 9) return `E${ep}M4`;   // return from the secret level
    if (map === 8) return `E${ep}M1`;   // episode end — loop for now
    return `E${ep}M${map + 1}`;
  }

  // Options state the menu drives.
  let messagesEnabled = true;
  let statusBarVisible = true;
  let mouseFactor = 8; // mouse-look pixels->turn; the sensitivity slider scales it
  const menu = new Menu({
    newGame: (chosen) => {
      skill = chosen;
      demo = null;                    // leave the attract demo
      swap(loadLevel('E1M1', skill)); // fresh player, no carry
      mode = 'play';
      menu.close();
    },
    setSfxVolume: (v) => audio.setSfxVolume(v),
    setMusicVolume: (v) => audio.setMusicVolume(v),
    setStatusBar: (visible) => { statusBarVisible = visible; },
    setMessages: (on) => { messagesEnabled = on; },
    setMouseSens: (v) => { mouseFactor = (8 * (v + 1)) / 6; }, // slider 5 -> the old fixed 8
  });

  // --- input ---------------------------------------------------------------
  const keys = new Set<string>();
  const ADVANCE = new Set(['Space', 'Enter', 'ControlLeft']);
  // Death respawns on USE (p_user.c P_DeathThink), never on fire — so dying with
  // the trigger held doesn't instantly restart before you see what happened.
  const RESTART = new Set(['Space', 'Enter', 'KeyE']);
  // Level warp (idclev) and music change (idmus) for the cheat matcher.
  const cheatEnv: CheatEnv = {
    warp: (ep, map) => {
      try { swap(loadLevel(`E${ep}M${map}`, skill)); mode = 'play'; }
      catch { /* no such map in this WAD */ }
    },
    music: (name) => S_ChangeMusic(name, true),
    revealMap: () => automap.cheatCycle(),
  };

  addEventListener('keydown', (e) => {
    audio.unlock(); // browsers only allow audio to start from a user gesture
    // Backtick toggles the console; while open it captures all typing.
    if (e.code === 'Backquote') { consoleOpen = !consoleOpen; consoleText = ''; e.preventDefault(); return; }
    if (consoleOpen) {
      if (e.code === 'Enter') { runConsole(consoleText); consoleText = ''; }
      else if (e.code === 'Backspace') consoleText = consoleText.slice(0, -1);
      else if (e.code === 'Escape') { consoleOpen = false; }
      else if (e.key.length === 1) consoleText += e.key;
      e.preventDefault();
      return;
    }

    // The menu eats keys while open (and Esc opens it). Gameplay never sees them.
    if (menu.key(e.code)) { e.preventDefault(); return; }
    // Any key during the title/attract loop brings up the menu (DOOM's behaviour).
    if ((mode === 'attract' || mode === 'title') && !menu.active) { menu.open(); e.preventDefault(); return; }

    // Intermission, finale and death all wait for a "continue" press.
    if ((mode === 'intermission' || mode === 'finale') && ADVANCE.has(e.code)) { interAdvance = true; e.preventDefault(); return; }
    if (cur.level.player.state === PST_DEAD && RESTART.has(e.code)) { deadAdvance = true; e.preventDefault(); return; }
    // Automap: Tab toggles it; +/- zoom while it's open.
    if (mode === 'play' && e.code === 'Tab') { automap.toggle(); e.preventDefault(); return; }
    if (automap.key(e.code)) { e.preventDefault(); return; }
    // Cheat codes are watched only in live play, so an attract demo (which the
    // player never types into) can't be perturbed. Non-consuming — movement keys
    // still register below.
    if (mode === 'play' && e.key.length === 1) M_CheatKey(e.key.toLowerCase(), cur.level.player, cheatEnv);
    if (freeCam.key(e.code, true)) { e.preventDefault(); return; } // free-cam eats WASD/Q/E/Shift
    keys.add(e.code);
    if (e.code === 'Space') e.preventDefault();
  });
  addEventListener('keyup', (e) => { freeCam.key(e.code, false); keys.delete(e.code); });
  // Left mouse fires; it ALSO grabs the pointer on first click. Right mouse
  // uses (matching DOOM's mouse2 = use). Track the button state and drain it in
  // buildTicCmd, same as the keyboard.
  let mouseFire = false;
  let mouseUse = false;
  canvas.addEventListener('mousedown', async (e) => {
    audio.unlock();
    // On the intermission a click just advances; don't grab the pointer.
    if (mode === 'intermission') { interAdvance = true; return; }
    if (document.pointerLockElement !== canvas) {
      try { await canvas.requestPointerLock({ unadjustedMovement: true }); }
      catch { canvas.requestPointerLock(); }
      return; // the grabbing click doesn't also fire
    }
    if (e.button === 0) mouseFire = true;
    if (e.button === 2) mouseUse = true;
  });
  addEventListener('mouseup', (e) => {
    if (e.button === 0) mouseFire = false;
    if (e.button === 2) mouseUse = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Mouse turn accumulates between tics, then drains into the ticcmd — the sim
  // only sees input 35 times a second regardless of mouse polling rate.
  let mouseTurn = 0;
  const SPIKE_PX = 200;
  addEventListener('mousemove', (e) => {
    if (document.pointerLockElement !== canvas) return;
    if (Math.abs(e.movementX) > SPIKE_PX) return; // cursor warp, not a hand
    if (freeCam.active) { freeCam.mouse(e.movementX, e.movementY); return; }
    mouseTurn -= e.movementX * mouseFactor;
  });

  /** g_game.c G_BuildTiccmd. */
  function buildTicCmd(): void {
    const cmd = cur.level.player.cmd;
    cmd.forwardMove = 0;
    cmd.sideMove = 0;
    cmd.angleTurn = 0;
    cmd.buttons = 0;
    if (freeCam.active) { mouseTurn = 0; return; } // player idles while the free camera flies

    if (keys.has('KeyW') || keys.has('ArrowUp')) cmd.forwardMove += FORWARD_RUN;
    if (keys.has('KeyS') || keys.has('ArrowDown')) cmd.forwardMove -= FORWARD_RUN;
    if (keys.has('KeyD')) cmd.sideMove += SIDE_RUN;
    if (keys.has('KeyA')) cmd.sideMove -= SIDE_RUN;
    if (keys.has('ArrowLeft')) cmd.angleTurn += TURN_SPEED;
    if (keys.has('ArrowRight')) cmd.angleTurn -= TURN_SPEED;
    if (keys.has('Space') || keys.has('KeyE') || mouseUse) cmd.buttons |= BT_USE;
    if (keys.has('ControlLeft') || mouseFire) cmd.buttons |= BT_ATTACK;

    // Drain accumulated mouse motion. angleturn is a signed short in vanilla.
    const t = Math.max(-32768, Math.min(32767, Math.round(mouseTurn)));
    cmd.angleTurn += t;
    mouseTurn = 0;
  }

  // --- moving sectors ------------------------------------------------------
  // The playsim moves sector heights in fixed_t; the renderer bakes them into
  // vertex Y at build time. Mirror them back and rebuild only when something
  // actually moved (~1.8ms, and only while a door is in motion).
  function syncSectorHeights(): boolean {
    const { sim, map } = cur.level;
    let moved = false;
    for (let i = 0; i < sim.sectors.length; i++) {
      const s = sim.sectors[i];
      if (s.floorHeight !== cur.lastFloor[i] || s.ceilingHeight !== cur.lastCeil[i]) {
        cur.lastFloor[i] = s.floorHeight;
        cur.lastCeil[i] = s.ceilingHeight;
        map.sectors[i].floorHeight = s.floorHeight >> FRACBITS;
        map.sectors[i].ceilingHeight = s.ceilingHeight >> FRACBITS;
        moved = true;
      }
    }
    return moved;
  }

  function rebuildGeometry(): void {
    cur.geo = buildLevelGeometry(wad, cur.level.map, wallTex);

    // Grow if the door revealed more than the slack covers.
    if (cur.geo.vertices.byteLength > cur.vboCapacity) {
      cur.vboCapacity = Math.ceil(cur.geo.vertices.byteLength * 1.5);
      cur.vbo.destroy();
      cur.vbo = device.createBuffer({
        label: 'level',
        size: cur.vboCapacity,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
      });
    }
    // The texture->layer assignment is stable across rebuilds (buildLevel
    // geometry pre-registers every texture in fixed sidedef/sector order), so
    // the atlas uploaded at load stays valid — only the vertices change.
    device.queue.writeBuffer(cur.vbo, 0, cur.geo.vertices);
  }

  // --- sprites -------------------------------------------------------------
  const missingWarned = new Set<number>();

  function buildSprites(viewX: number, viewY: number): number {
    const { sim } = cur.level;
    const spriteLayer = cur.spriteLayer;
    let n = 0;
    for (const sec of sim.sectors) {
      let mo = sec.thingList;
      while (mo) {
        if (n >= MAX_SPRITES) break;
        if (mo.player) { mo = mo.snext; continue; } // don't draw yourself
        const st = states[mo.state];
        const def = spriteDefs.get(sprNames[st.sprite]);
        const sf = def?.frames[st.frame];
        if (!sf) { mo = mo.snext; continue; }

        const rot = sf.rotate
          ? spriteRotation(mo.angle / 4294967296 * Math.PI * 2, Math.atan2(mo.y - viewY, mo.x - viewX))
          : 0;
        const lump = sf.lump[rot];
        const layer = lump >= 0 ? spriteLayer.get(wad.lumps[lump].name) : undefined;
        if (layer === undefined) {
          // A frame with no atlas layer used to just vanish — which reads as
          // flicker, not as a bug. Say so once per lump instead.
          if (lump >= 0 && !missingWarned.has(lump)) {
            missingWarned.add(lump);
            console.warn(`sprite lump ${wad.lumps[lump].name} has no atlas layer — frame will not draw`);
          }
          mo = mo.snext;
          continue;
        }

        const o = n * 6;
        instances[o + 0] = mo.x / FRACUNIT;
        instances[o + 1] = mo.z / FRACUNIT;
        instances[o + 2] = mapYToWorldZ(mo.y / FRACUNIT);
        instances[o + 3] = layer;
        // flip field: bit 0 = mirrored, bit 1 = MF_SHADOW (spectre fuzz).
        instances[o + 4] = (sf.flip[rot] ? 1 : 0) | ((mo.flags & MF.MF_SHADOW) ? 2 : 0);
        instances[o + 5] = st.fullbright ? -1 : Math.max(0, Math.min(15, (mo.sector?.lightLevel ?? 255) >> 4));
        n++;
        mo = mo.snext;
      }
    }
    if (n > 0) device.queue.writeBuffer(instanceBuf, 0, instances, 0, n * 6);
    return n;
  }

  // --- frame ---------------------------------------------------------------
  let depth: GPUTexture | null = null;
  const resize = (): void => {
    const dpr = Math.min(window.devicePixelRatio, 2);
    canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    depth?.destroy();
    depth = device.createTexture({
      size: [canvas.width, canvas.height],
      format: 'depth24plus',
      usage: GPUTextureUsage.RENDER_ATTACHMENT,
    });
    wipe.resize(canvas.width, canvas.height);
  };
  resize();
  addEventListener('resize', resize);

  let accumulator = 0;
  let last = performance.now();
  // Identifies "which screen" we're showing; when it changes, melt to the new one.
  let lastScreenKey = '';
  // Transient pickup/HUD message shown at the top of the screen (HU_MSGTIMEOUT).
  let hudMsg = '';
  let hudMsgTimer = 0;
  const HUD_MSG_MS = 4000;

  const frame = (now: number): void => {
      stats.begin();
    // The body has several early `return`s (a demo ends, the player dies, a
    // screen advances). Those must NOT stop the animation loop — reschedule in
    // `finally` no matter how the body exits. (Returning without rescheduling
    // was the "freezes, no error, page still responsive" bug: the loop simply
    // stopped being queued.)
    try {
      frameBody(now);
    } finally {
      stats.end();
      requestAnimationFrame(frame);
    }
  };

  const frameBody = (now: number): void => {
    // Fixed-step sim. Cap the catch-up so a background tab doesn't return and
    // simulate 10,000 tics at once.
    const wipeDt = Math.min(now - last, 250);
    accumulator += wipeDt;
    last = now;
    const player = cur.level.player;

    // Consume any new pickup message (the sim just sets a string); show it for a
    // few seconds, then let it fade.
    if (player.message) { if (messagesEnabled) { hudMsg = player.message; hudMsgTimer = HUD_MSG_MS; } player.message = ''; }
    if (hudMsgTimer > 0) hudMsgTimer -= wipeDt;

    // Freeze the world while a screen melt is playing (DOOM suspends the game
    // during the wipe), so the new screen holds on its first frame as it's
    // revealed. Drain the accumulator so it doesn't fast-forward on resume.
    if (wipe.melting()) {
      accumulator = 0;
    } else if (mode === 'finale') {
      accumulator = 0; // frozen; wait for a key
      if (interAdvance) {
        interAdvance = false;
        mode = 'play';
        swap(loadLevel('E1M1', skill)); // after the episode, restart
        menu.open();
        return;
      }
    } else if (mode === 'intermission') {
      // Drive the wi_stuff state machine at 35Hz: animated map, the count-up
      // with its sounds, then the "you are here" flash. A press accelerates.
      if (interAdvance) { interAdvance = false; intermission.advance(); }
      while (accumulator >= MS_PER_TIC) {
        accumulator -= MS_PER_TIC;
        intermission.tick();
      }
      if (intermission.done) {
        if (pendingFinale) { pendingFinale = false; mode = 'finale'; }
        else { swap(loadLevel(pendingMap, skill, player)); mode = 'play'; }
        return;
      }
    } else {
      while (accumulator >= MS_PER_TIC) {
        if (mode === 'title') {
          // A static page (D_PageTicker): just count down, then advance the loop.
          accumulator -= MS_PER_TIC;
          if (--pageTic <= 0) { advanceDemo(); return; }
          continue;
        }
        if (mode === 'attract') {
          // The demo drives the ticcmd. When it runs out, or the player dies to
          // a desync, roll on to the next entry in the attract sequence.
          if (!demo || demoTic >= demo.cmds.length) { advanceDemo(); return; }
          const c = demo.cmds[demoTic++];
          player.cmd.forwardMove = c.forwardMove;
          player.cmd.sideMove = c.sideMove;
          player.cmd.angleTurn = c.angleTurn;
          player.cmd.buttons = c.buttons;
          P_Ticker([player]);
          accumulator -= MS_PER_TIC;
          if (player.state === PST_DEAD) { advanceDemo(); return; }
          continue;
        }

        if (devFrozen) { accumulator = 0; break; } // dev screenshot: hold the pose
        buildTicCmd();
        P_Ticker([player]);
        // Reveal is a side effect of drawing the 3D view (as in DOOM, where the
        // renderer flags each wall it draws). With the automap up the world isn't
        // rendered, so nothing fills in while you walk it — matching vanilla.
        if (player.mo && !automap.active) AM_Reveal(player.mo);
        accumulator -= MS_PER_TIC;

        // Death: USE (space) restarts the level pistol-start. Not fire — so a
        // held trigger from the killing shot can't instantly respawn.
        if (player.state === PST_DEAD && (deadAdvance)) {
          deadAdvance = false;
          respawn();
          return;
        }

        // A triggered exit goes to the intermission (or the finale after the
        // last level). Break out — `player`/`cur.*` belong to the finished level.
        const exit = cur.level.exitRequested();
        if (exit) {
          // Every level shows its intermission tally first; the episode ender
          // (E1M8, normal exit) then rolls the finale instead of the next level.
          enterIntermission(exit === 'secret');
          pendingFinale = /M8$/.test(cur.level.map.name) && exit === 'normal';
          accumulator = 0;
          break;
        }
      }
    }
    const switchFlipped = P_ConsumeGeoDirty(); // a used switch renamed a texture
    if ((mode === 'play' || mode === 'attract') && (syncSectorHeights() || switchFlipped)) rebuildGeometry();

    const mo = player.mo!;
    audio.setListener(mo.x, mo.y, mo.angle); // positional sfx follow the view
    const px = mo.x / FRACUNIT;
    const pz = player.viewZ / FRACUNIT;
    const yaw = (mo.angle / 4294967296) * Math.PI * 2;

    // Same map->world convention as the geometry: world Z is NEGATED map Y, so
    // the forward vector's Z component negates with it. Miss this and the
    // camera faces a mirrored world.
    let eye = [px, pz, mapYToWorldZ(mo.y / FRACUNIT)];
    let fwd = [Math.cos(yaw), 0, mapYToWorldZ(Math.sin(yaw))];
    let target = [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]];
    // The free camera detaches the view from the player (sim keeps running).
    if (freeCam.active) {
      freeCam.update(wipeDt / 1000);
      const v = freeCam.view();
      eye = v.eye; target = v.target;
      fwd = [target[0] - eye[0], target[1] - eye[1], target[2] - eye[2]];
    }

    const aspect = canvas.width / canvas.height;
    const tanHalfY = Math.tan(FOV_X / 2) / aspect;
    const proj = perspective(2 * Math.atan(tanHalfY), aspect, 8, 20000);
    const view = lookAt(eye, target, [0, 1, 0]);
    // Full-screen colour effects (p_user.c / r_main.c): the invulnerability
    // inverse map and the light-amp full-bright map, each flickering as it runs
    // out; the damage/pickup/radsuit palette tint; and the weapon muzzle flash.
    const inv = player.powers[0 /* invuln */], inf = player.powers[5 /* infrared */];
    let fixedMap = -1;
    if (inv) fixedMap = (inv > 4 * 32 || (inv & 8)) ? 32 : -1;
    else if (inf) fixedMap = (inf > 4 * 32 || (inf & 8)) ? 1 : -1;
    writeGlobals(device, pass, multiply(proj, view), paletteRow(player), fixedMap, player.extraLight);

    // Push live sector light. The sim mutates sector.lightLevel in place, so
    // this just mirrors the current values.
    const sim = cur.level.sim;
    for (let i = 0; i < sim.sectors.length; i++) cur.sectorLightData[i] = sim.sectors[i].lightLevel;
    device.queue.writeBuffer(cur.sectorLightBuf, 0, cur.sectorLightData);

    // Advance animated flats/textures (nukage, blood, lava, the fire walls) to
    // the frame for this level tic. Redirect-only — no geometry touched.
    if (cur.geo.anims.length) {
      updateAnimTranslation(cur.geo.anims, P_LevelTime(), cur.texTransData);
      device.queue.writeBuffer(cur.texTransBuf, 0, cur.texTransData);
    }

    const right = norm(cross(fwd, [0, 1, 0]));
    const up = cross(right, fwd);
    writeSkyGlobals(device, skyPass, right, up, fwd, tanHalfY, aspect, cur.geo.skyLayer);

    camScratch.set(right, 0);
    device.queue.writeBuffer(spritePass.camera, 0, camScratch);
    const spriteCount = buildSprites(mo.x, mo.y);

    // Automap: build its lines from the live level (before the render pass, since
    // it uploads a vertex buffer). The mobj walk is lazy — only used with iddt.
    if (automap.active) {
      automap.prepare(sim.lines, mo, (function* () {
        for (const sec of sim.sectors) { let m = sec.thingList; while (m) { yield m; m = m.snext; } }
      })(), aspect, player.powers[4 /* pw_allmap */] > 0);
    }

    // A melt on every screen change: entering/leaving a level, the intermission,
    // the finale, or a new title/attract page — DOOM wipes on all of these.
    const screenKey = `${mode}:${cur.level.map.name}:${pageName}`;
    if (screenKey !== lastScreenKey) {
      if (lastScreenKey !== '' && !devFrozen) wipe.request(); // no melt on dev warps
      lastScreenKey = screenKey;
      hudMsgTimer = 0; // a stale pickup message shouldn't carry across screens
    }

    const enc = device.createCommandEncoder();
    wipe.capture(enc); // snapshot the old screen first if a melt was requested
    const rp = enc.beginRenderPass({
      colorAttachments: [{
        view: wipe.sceneView(), // render into the offscreen scene, not the swapchain
        clearValue: devMagenta ? { r: 1, g: 0, b: 1, a: 1 } : { r: 0, g: 0, b: 0, a: 1 },
        loadOp: 'clear',
        storeOp: 'store',
      }],
      depthStencilAttachment: {
        view: depth!.createView(),
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store',
      },
    });

    hud.beginFrame(); // reset the per-batch instance cursor

    // The world renders while playing AND during the attract demo. Intermission
    // and the finale are separate screens on black.
    if (mode === 'play' || mode === 'attract') {
      if (automap.active) {
       automap.draw(rp); // the overhead map replaces the 3D view
      } else {
      if (!devMagenta) { // skip the sky so ceiling gaps reveal the magenta clear
        rp.setPipeline(skyPass.pipeline);
        rp.setBindGroup(0, cur.skyBindGroup);
        rp.draw(3);
      }

      rp.setPipeline(pass.pipeline);
      rp.setBindGroup(0, cur.bindGroup);
      rp.setVertexBuffer(0, cur.vbo);
      rp.draw(cur.geo.count);

      if (spriteCount > 0) {
        rp.setPipeline(spritePass.pipeline);
        rp.setBindGroup(0, cur.spriteBindGroup);
        rp.setVertexBuffer(0, instanceBuf);
        rp.draw(6, spriteCount);
      }

      // The player's weapon: both overlays (gun, then flash) at their psprite
      // position. sx/sy are fixed_t; the patch offsets are applied inside
      // hud.draw, so we pass raw sx/sy — see R_DrawPSprite, where the centre
      // terms cancel to exactly this.
      const overlay: Quad[] = [];
      for (const which of [ps_weapon, ps_flash]) {
        const psp = player.psprites[which];
        const lump = pspriteLump(psp.state);
        if (lump) overlay.push({ name: lump, x: psp.sx / FRACUNIT, y: psp.sy / FRACUNIT });
      }
      hud.draw(rp, overlay, paletteRow(player));
      }

      // Status bar over the world (and under the automap), with the damage tint.
      if (statusBarVisible) hud.draw(rp, buildStatusBar(player), paletteRow(player));

      // Dev overlay: live player X/Y/angle so you can read off a spot to warp to.
      if (devPlayerPos && player.mo) {
        const mo = player.mo;
        const a = Math.round((mo.angle >>> 0) / 4294967296 * 360) % 360;
        hud.draw(rp, drawText(hud.patchOf, `X ${mo.x >> 16} Y ${mo.y >> 16} A ${a}`, 4, 4), 0);
      }

      // Pickup notification along the top edge.
      if (hudMsgTimer > 0) hud.draw(rp, drawText(hud.patchOf, hudMsg, 0, 0), 0);
    }

    // Intermission: the animated map with the tally / next-level screens.
    if (mode === 'intermission') {
      hud.draw(rp, intermission.draw(hud.patchOf), 0);
    }

    // Title / credits: a single full-screen page over black.
    if (mode === 'title') {
      hud.draw(rp, [{ name: pageName, x: 0, y: 0 }], 0);
    }

    // Finale: the episode-end text over black.
    if (mode === 'finale') {
      const fin: Quad[] = [];
      E1TEXT.forEach((s, i) => fin.push(...drawText(hud.patchOf, s, 12, 16 + i * 11)));
      fin.push(...drawText(hud.patchOf, 'PRESS SPACE', 120, 190));
      hud.draw(rp, fin, 0);
    }

    // Menu over everything.
    menu.tick();
    hud.draw(rp, menu.build(), 0);

    // Console on top of the menu.
    if (consoleOpen) {
      const con: Quad[] = [];
      consoleLog.forEach((line, i) => con.push(...drawText(hud.patchOf, line, 4, 4 + i * 10)));
      con.push(...drawText(hud.patchOf, `>${consoleText}_`, 4, 4 + consoleLog.length * 10));
      hud.draw(rp, con, 0);
    }

    rp.end();

    // Blit the scene to the swapchain — or melt the previous screen over it.
    wipe.present(enc, context.getCurrentTexture().createView(), wipeDt);
    device.queue.submit([enc.finish()]);
  };

  advanceDemo(); // start on the title screen, then cycle demos (DOOM's attract loop)
  requestAnimationFrame(frame);

  if (devParams.has('dev')) {
    // Headless test hook: load a map and place the player at an exact pose, so a
    // screenshot frames a chosen view. Guarded by ?dev — absent in normal play.
    (globalThis as Record<string, unknown>).__dev = {
      warp(map: string, x: number, y: number, angleDeg: number): void {
        swap(loadLevel(map, skill));
        mode = 'play';
        devFrozen = true;
        const p = cur.level.player, mo = p.mo;
        if (!mo) return;
        mo.x = Math.round(x * FRACUNIT);
        mo.y = Math.round(y * FRACUNIT);
        mo.angle = (Math.round((angleDeg / 360) * 4294967296) >>> 0);
        mo.momx = mo.momy = mo.momz = 0;
        const sec = cur.level.sectorAt(mo.x, mo.y);
        mo.z = mo.floorZ = sec.floorHeight;
        p.viewZ = (mo.z + p.viewHeight) | 0;
      },
    };
  }
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
