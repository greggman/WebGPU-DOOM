// Browser audio backend for the sound API in s_sound.ts. Decodes DMX sound
// lumps (DS*) into Web Audio buffers and plays them with DOOM's distance
// attenuation and stereo separation. Music is wired in a later pass; the
// changeMusic/stopMusic hooks are present but delegate to the OPL player once
// it exists.

import { setSoundBackend, type SoundBackend, type SoundOrigin } from './s_sound.js';
import { parseMus } from './mus.js';
import type { Wad } from './wad.js';

const FRACUNIT = 65536;
// s_sound.c: full volume within CLOSE, silent past CLIPPING, linear between.
const S_CLOSE_DIST = 200;
const S_CLIPPING_DIST = 1200;

export interface Audio {
  /** Player position/facing in fixed_t / BAM, for positional sfx. */
  setListener(x: number, y: number, angleBam: number): void;
  /** Resume the context — must be called from a user gesture (autoplay policy). */
  unlock(): void;
  changeMusic(name: string, loop: boolean): void;
  stopMusic(): void;
  /** Menu sound/music volume, 0..1. */
  setSfxVolume(v: number): void;
  setMusicVolume(v: number): void;
}

export function createAudio(wad: Wad): Audio {
  const ctx = new AudioContext();
  const master = ctx.createGain();
  master.gain.value = 0.45;
  master.connect(ctx.destination);

  const cache = new Map<string, AudioBuffer | null>();
  let lx = 0, ly = 0, lang = 0;

  // Music runs on the audio thread in an AudioWorklet, so the main thread pays
  // NOTHING for OPL synthesis (it was ~25% of a core through the old, deprecated
  // ScriptProcessorNode, which runs on the main thread). GENMIDI is handed over
  // once at construction; each track's MUS score is posted to the processor. The
  // worklet bundle sits next to this one — dist/music-worklet.js.
  let musicPort: MessagePort | null = null;
  let currentMusic = '';
  let mgain: GainNode | null = null;
  if (wad.checkNumForName('GENMIDI') >= 0) {
    const mg = mgain = ctx.createGain();
    mg.gain.value = 0.8;
    mg.connect(ctx.destination);
    const genmidi = wad.lump('GENMIDI').slice(); // own copy, detached from the WAD
    const url = import.meta.url.replace(/[^/]*$/, 'music-worklet.js');
    ctx.audioWorklet.addModule(url).then(() => {
      const node = new AudioWorkletNode(ctx, 'music-processor', {
        numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1],
        processorOptions: { genmidi },
      });
      node.connect(mg);
      musicPort = node.port;
      startPending(); // a track requested before the node was ready
    }).catch((e) => console.error('music worklet failed to load', e));
  }

  // Autoplay policy: nothing sounds until the first user gesture calls unlock().
  // Music requested before then (the title jingle) is remembered and started on
  // unlock; sound effects before then are simply dropped.
  let unlocked = false;
  let pendingMusic = '', pendingLoop = true;

  function startPending(): void {
    if (!musicPort || !unlocked || !pendingMusic || pendingMusic === currentMusic) return;
    if (wad.checkNumForName(pendingMusic) < 0) return;
    const mus = parseMus(wad.lump(pendingMusic));
    if (!mus) return;
    const score = mus.score.slice(); // copy out of the WAD, then transfer ownership
    musicPort.postMessage({ type: 'play', score: score.buffer, loop: pendingLoop }, [score.buffer]);
    currentMusic = pendingMusic;
  }

  function changeMusic(name: string, loop: boolean): void {
    pendingMusic = name;
    pendingLoop = loop;
    if (unlocked) startPending();
  }

  function lumpFor(sfx: string): string {
    if (sfx === 'sfx_chgun') return 'DSPISTOL'; // vanilla: chaingun links to pistol
    return 'DS' + sfx.slice(4).toUpperCase();   // sfx_pistol -> DSPISTOL
  }

  function buffer(sfx: string): AudioBuffer | null {
    const hit = cache.get(sfx);
    if (hit !== undefined) return hit;

    let buf: AudioBuffer | null = null;
    const lname = lumpFor(sfx);
    if (wad.checkNumForName(lname) >= 0) {
      const raw = wad.lump(lname);
      const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
      const rate = dv.getUint16(2, true) || 11025;
      const n = dv.getUint32(4, true);
      // The DMX lump pads 16 bytes at each end (a copy of the first/last sample);
      // trimming them avoids a click. Clamp to the real lump bounds regardless.
      let start = 8, end = Math.min(8 + n, raw.length);
      if (end - start > 32) { start += 16; end -= 16; }
      const len = end - start;
      if (len > 0) {
        buf = ctx.createBuffer(1, len, rate);
        const out = buf.getChannelData(0);
        for (let i = 0; i < len; i++) out[i] = (raw[start + i] - 128) / 128;
      }
    }
    cache.set(sfx, buf);
    return buf;
  }

  function play(origin: SoundOrigin | null, sfx: string): void {
    if (!unlocked) return; // no audio before the first user gesture
    const buf = buffer(sfx);
    if (!buf) return;

    let vol = 1, pan = 0;
    // A positioned sound that isn't the local player attenuates with distance.
    if (origin && !origin.player) {
      const dx = origin.x / FRACUNIT - lx;
      const dy = origin.y / FRACUNIT - ly;
      const dist = Math.hypot(dx, dy);
      if (dist > S_CLIPPING_DIST) return; // too far to hear
      vol = dist <= S_CLOSE_DIST ? 1 : 1 - (dist - S_CLOSE_DIST) / (S_CLIPPING_DIST - S_CLOSE_DIST);
      // Stereo: source angle relative to where the player faces. Left is +90 CCW.
      const rel = Math.atan2(dy, dx) - (lang / 4294967296) * Math.PI * 2;
      pan = Math.max(-1, Math.min(1, -Math.sin(rel)));
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    const g = ctx.createGain();
    g.gain.value = vol;
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    src.connect(g).connect(p).connect(master);
    src.start();
  }

  const backend: SoundBackend = {
    startSound: play,
    changeMusic,
    stopMusic: () => { musicPort?.postMessage({ type: 'stop' }); currentMusic = ''; },
  };
  setSoundBackend(backend);

  return {
    setListener(x, y, angleBam) { lx = x / FRACUNIT; ly = y / FRACUNIT; lang = angleBam; },
    unlock() {
      if (unlocked) return;
      unlocked = true;
      if (ctx.state === 'suspended') void ctx.resume();
      startPending(); // start the title music the moment the player interacts
    },
    changeMusic: (name, loop) => backend.changeMusic(name, loop),
    stopMusic: () => backend.stopMusic(),
    setSfxVolume(v) { master.gain.value = Math.max(0, Math.min(1, v)); },
    setMusicVolume(v) { if (mgain) mgain.gain.value = Math.max(0, Math.min(1, v)); },
  };
}
