// tools/musictest.ts
import { readFileSync, writeFileSync } from "node:fs";

// src/wad.ts
var Wad = class {
  lumps = [];
  // Uint8Array<ArrayBuffer>, not the default Uint8Array<ArrayBufferLike>:
  // queue.writeTexture rejects a possibly-shared buffer, and subarray()
  // propagates whichever we pick here.
  bytes;
  index = /* @__PURE__ */ new Map();
  constructor(buffer) {
    this.bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const magic = String.fromCharCode(...this.bytes.subarray(0, 4));
    if (magic !== "IWAD" && magic !== "PWAD") {
      throw new Error(`not a WAD (magic "${magic}")`);
    }
    const numLumps = view.getInt32(4, true);
    const dirOfs = view.getInt32(8, true);
    for (let i = 0; i < numLumps; i++) {
      const e = dirOfs + i * 16;
      let name2 = "";
      for (let c = 0; c < 8; c++) {
        const ch = this.bytes[e + 8 + c];
        if (ch === 0) break;
        name2 += String.fromCharCode(ch);
      }
      name2 = name2.toUpperCase();
      this.lumps.push({ name: name2, pos: view.getInt32(e, true), size: view.getInt32(e + 4, true) });
      this.index.set(name2, i);
    }
  }
  /** W_CheckNumForName — returns -1 if absent. */
  checkNumForName(name2) {
    const i = this.index.get(name2.toUpperCase());
    return i === void 0 ? -1 : i;
  }
  /** W_GetNumForName — throws if absent. */
  getNumForName(name2) {
    const i = this.checkNumForName(name2);
    if (i < 0) throw new Error(`W_GetNumForName: ${name2} not found`);
    return i;
  }
  /** W_CacheLumpNum — a view into the WAD, not a copy. Do not mutate. */
  lumpNum(num) {
    const l = this.lumps[num];
    if (!l) throw new Error(`W_CacheLumpNum: ${num} out of range`);
    return this.bytes.subarray(l.pos, l.pos + l.size);
  }
  /** W_CacheLumpName */
  lump(name2) {
    return this.lumpNum(this.getNumForName(name2));
  }
};

// src/opl2.ts
var OPL_RATE = 49716;
var LOGSIN = new Uint16Array(256);
var EXP = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  LOGSIN[i] = Math.round(-Math.log2(Math.sin((i + 0.5) * Math.PI / 512)) * 256);
  EXP[i] = Math.round((2 ** (i / 256) - 1) * 1024);
}
function waveSample(phaseIdx, eg, wave, mod) {
  const p = phaseIdx + mod & 1023;
  let logv;
  let sign = 0;
  switch (wave) {
    case 0:
      logv = LOGSIN[p & 256 ? ~p & 255 : p & 255];
      sign = p & 512;
      break;
    case 1:
      if (p & 512) return 0;
      logv = LOGSIN[p & 256 ? ~p & 255 : p & 255];
      break;
    case 2:
      logv = LOGSIN[p & 256 ? ~p & 255 : p & 255];
      break;
    default: {
      if (p & 256) return 0;
      logv = LOGSIN[p & 255];
      break;
    }
  }
  let att = logv + (eg << 3);
  if (att > 8191) att = 8191;
  const out2 = (EXP[att & 255 ^ 255] | 1024) << 1 >> (att >> 8);
  return sign ? -out2 : out2;
}
var MULT = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30];
var EG_INC = new Float64Array(64);
for (let i = 0; i < 64; i++) EG_INC[i] = i < 4 ? 0 : 4e-4 * 2 ** (i / 4);
function newOp() {
  return {
    mult: 1,
    ksr: false,
    ksl: 0,
    tl: 0,
    ar: 0,
    dr: 0,
    sl: 0,
    rr: 0,
    wave: 0,
    sustain: false,
    phase: 0,
    env: 511,
    state: 4 /* Off */,
    out: 0,
    prev: 0
  };
}
var MOD_OFF = [0, 1, 2, 8, 9, 10, 16, 17, 18];
var CAR_OFF = [3, 4, 5, 11, 12, 13, 19, 20, 21];
var OP_LOOKUP = new Int8Array(32).fill(-1);
MOD_OFF.forEach((off, ch) => {
  OP_LOOKUP[off] = 2 * ch;
});
CAR_OFF.forEach((off, ch) => {
  OP_LOOKUP[off] = 2 * ch + 1;
});
var KSL_TAB = [0, 3, 1.5, 6];
var OPL2 = class {
  ch = [];
  ops = [];
  step;
  acc = 0;
  last = 0;
  constructor(outputRate) {
    this.step = OPL_RATE / outputRate;
    for (let i = 0; i < 18; i++) {
      const a = newOp(), b = newOp();
      this.ops.push(a, b);
      this.ch.push({ ops: [a, b], fnum: 0, block: 0, keyOn: false, feedback: 0, connection: false });
    }
  }
  opIndex(reg) {
    const idx = OP_LOOKUP[reg & 31];
    return idx < 0 ? -1 : idx + (reg & 256 ? 18 : 0);
  }
  /** Write one OPL register. 0x100+ addresses the second bank (voices 9..17). */
  write(reg, val) {
    const r = reg & 255;
    const cbase = reg & 256 ? 9 : 0;
    const hi = r & 224;
    if (r >= 160 && r <= 168) {
      const c = this.ch[cbase + r - 160];
      c.fnum = c.fnum & 768 | val;
    } else if (r >= 176 && r <= 184) {
      const c = this.ch[cbase + r - 176];
      c.fnum = c.fnum & 255 | (val & 3) << 8;
      c.block = val >> 2 & 7;
      const on = (val & 32) !== 0;
      if (on && !c.keyOn) for (const o of c.ops) {
        o.state = 0 /* Attack */;
        o.phase = 0;
      }
      else if (!on && c.keyOn) for (const o of c.ops) o.state = 3 /* Release */;
      c.keyOn = on;
    } else if (r >= 192 && r <= 200) {
      const c = this.ch[cbase + r - 192];
      c.feedback = val >> 1 & 7;
      c.connection = (val & 1) !== 0;
    } else if (hi === 32 || hi === 64 || hi === 96 || hi === 128 || hi === 224) {
      const oi = this.opIndex(reg);
      if (oi < 0) return;
      const o = this.ops[oi];
      switch (hi) {
        case 32:
          o.mult = MULT[val & 15];
          o.ksr = (val & 16) !== 0;
          o.sustain = (val & 32) !== 0;
          break;
        case 64:
          o.ksl = val >> 6 & 3;
          o.tl = val & 63;
          break;
        case 96:
          o.ar = val >> 4 & 15;
          o.dr = val & 15;
          break;
        case 128:
          o.sl = val >> 4 & 15;
          o.rr = val & 15;
          break;
        case 224:
          o.wave = val & 3;
          break;
      }
    }
  }
  egRate(nibble, c, o) {
    if (nibble === 0) return 0;
    const ks = o.ksr ? c.block : c.block >> 2;
    return Math.min(63, nibble * 4 + ks);
  }
  // Advance one operator; return its signed sample. `mod` is a phase offset.
  runOp(o, c, mod) {
    switch (o.state) {
      case 0 /* Attack */:
        o.env -= EG_INC[this.egRate(o.ar, c, o)] * (o.env + 16) * 0.5;
        if (o.env <= 0) {
          o.env = 0;
          o.state = 1 /* Decay */;
        }
        break;
      case 1 /* Decay */: {
        const target = o.sl * 32;
        o.env += EG_INC[this.egRate(o.dr, c, o)];
        if (o.env >= target) {
          o.env = target;
          o.state = 2 /* Sustain */;
        }
        break;
      }
      case 2 /* Sustain */:
        if (!o.sustain) {
          o.env += EG_INC[this.egRate(o.rr, c, o)];
          if (o.env >= 511) {
            o.env = 511;
            o.state = 4 /* Off */;
          }
        }
        break;
      case 3 /* Release */:
        o.env += EG_INC[this.egRate(o.rr, c, o)];
        if (o.env >= 511) {
          o.env = 511;
          o.state = 4 /* Off */;
        }
        break;
      case 4 /* Off */:
        o.prev = o.out;
        o.out = 0;
        return 0;
    }
    o.phase = (o.phase + (c.fnum << c.block) * o.mult * 0.5) % (1 << 20);
    const idx = o.phase >> 10 & 1023;
    let eg = o.env + o.tl * 4 + Math.round(KSL_TAB[o.ksl] * c.block * 1.33);
    if (eg > 511) eg = 511;
    o.prev = o.out;
    o.out = waveSample(idx, eg | 0, o.wave, mod);
    return o.out;
  }
  chipSample() {
    let sum = 0;
    for (const c of this.ch) {
      const [mod, car] = c.ops;
      const fb = c.feedback ? mod.prev + mod.out >> 10 - c.feedback >> 4 : 0;
      const m = this.runOp(mod, c, fb);
      if (c.connection) {
        sum += m + this.runOp(car, c, 0);
      } else {
        sum += this.runOp(car, c, m >> 1);
      }
    }
    return sum;
  }
  /** Fill a mono Float32 buffer at the output rate. */
  generate(out2) {
    for (let i = 0; i < out2.length; i++) {
      this.acc += this.step;
      while (this.acc >= 1) {
        this.last = this.chipSample();
        this.acc -= 1;
      }
      out2[i] = Math.max(-1, Math.min(1, this.last / 1e4));
    }
  }
};

// src/genmidi.ts
function readOp(d, o) {
  return {
    char: d.getUint8(o),
    attack: d.getUint8(o + 1),
    sustain: d.getUint8(o + 2),
    wave: d.getUint8(o + 3),
    ksl: d.getUint8(o + 4),
    level: d.getUint8(o + 5)
  };
}
function readVoice(d, o) {
  return {
    mod: readOp(d, o),
    feedback: d.getUint8(o + 6),
    car: readOp(d, o + 7),
    // byte 13 unused; 14..15 the signed note offset.
    noteOffset: d.getInt16(o + 14, true)
  };
}
function parseGenmidi(lump) {
  const d = new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
  const out2 = [];
  for (let i = 0; i < 175; i++) {
    const base = 8 + i * 36;
    const flags = d.getUint16(base, true);
    const inst = {
      flags,
      fineTune: d.getUint8(base + 2),
      fixedNote: d.getUint8(base + 3),
      voices: [readVoice(d, base + 4)]
    };
    if (flags & 4) inst.voices.push(readVoice(d, base + 20));
    out2.push(inst);
  }
  return out2;
}

// src/music.ts
var MUS_RATE = 140;
var OPL_MOD = [0, 1, 2, 8, 9, 10, 16, 17, 18];
var OPL_CAR = [3, 4, 5, 11, 12, 13, 19, 20, 21];
var NVOICES = 18;
var bankOf = (v) => v < 9 ? 0 : 256;
var chIn = (v) => v % 9;
var PERCUSSION = 15;
var MusicPlayer = class {
  opl;
  instruments;
  samplesPerTick;
  tickAcc = 0;
  score = new Uint8Array(0);
  pos = 0;
  delay = 0;
  // ticks until the next event group
  playing = false;
  loop = true;
  ageCounter = 0;
  voices = [];
  chans = [];
  constructor(genmidi, outputRate) {
    this.opl = new OPL2(outputRate);
    this.instruments = parseGenmidi(genmidi);
    this.samplesPerTick = outputRate / MUS_RATE;
    for (let i = 0; i < NVOICES; i++) this.voices.push({ midiCh: -1, note: 0, age: 0, b0: 0 });
    for (let i = 0; i < 16; i++) this.chans.push({ instrument: 0, volume: 100, pitch: 0 });
  }
  play(mus, loop) {
    this.score = mus.score;
    this.pos = 0;
    this.delay = 0;
    this.loop = loop;
    this.playing = true;
    this.allNotesOff();
    for (const c of this.chans) {
      c.volume = 100;
      c.pitch = 0;
      c.instrument = 0;
    }
  }
  stop() {
    this.playing = false;
    this.allNotesOff();
  }
  allNotesOff() {
    for (let i = 0; i < NVOICES; i++) {
      this.opl.write(bankOf(i) | 176 + chIn(i), 0);
      this.voices[i].midiCh = -1;
    }
  }
  // --- OPL voice management ------------------------------------------------
  alloc(midiCh, note) {
    let free = -1, oldest = 0;
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === -1) {
        free = i;
        break;
      }
      if (this.voices[i].age < this.voices[oldest].age) oldest = i;
    }
    const v = free >= 0 ? free : oldest;
    this.voices[v] = { midiCh, note, age: ++this.ageCounter, b0: 0 };
    return v;
  }
  noteToFreq(note, bend) {
    const freq = 440 * 2 ** ((note + bend - 69) / 12);
    let block = Math.floor(note / 12) - 1;
    if (block < 0) block = 0;
    if (block > 7) block = 7;
    let fnum = Math.round(freq * (1 << 20 - block) / 49716);
    if (fnum > 1023) fnum = 1023;
    if (fnum < 0) fnum = 0;
    return { fnum, block };
  }
  startNote(midiCh, note, vol) {
    const ch = this.chans[midiCh];
    let instIdx = ch.instrument;
    let playNote = note;
    if (midiCh === PERCUSSION) {
      instIdx = 128 + (note - 35);
      if (instIdx < 128 || instIdx > 174) return;
    }
    const inst = this.instruments[instIdx];
    if (!inst) return;
    const eff = vol * ch.volume / 127 * (midiCh === PERCUSSION ? 0.55 : 1);
    for (let vi = 0; vi < inst.voices.length; vi++) {
      const voice = inst.voices[vi];
      const detune = vi === 1 ? (inst.fineTune - 128) / 64 : 0;
      this.loadVoice(midiCh, note, voice, inst, playNote, ch, eff, detune);
    }
  }
  loadVoice(midiCh, note, voice, inst, playNote, ch, eff, detune) {
    const v = this.alloc(midiCh, note);
    const bank = bankOf(v), c = chIn(v);
    const mSlot = bank | OPL_MOD[c], cSlot = bank | OPL_CAR[c];
    this.opl.write(32 + mSlot, voice.mod.char);
    this.opl.write(64 + mSlot, voice.mod.ksl << 6 | voice.mod.level);
    this.opl.write(96 + mSlot, voice.mod.attack);
    this.opl.write(128 + mSlot, voice.mod.sustain);
    this.opl.write(224 + mSlot, voice.mod.wave);
    const carAtten = Math.round(voice.car.level + (63 - voice.car.level) * (1 - eff / 127));
    this.opl.write(32 + cSlot, voice.car.char);
    this.opl.write(64 + cSlot, voice.car.ksl << 6 | carAtten & 63);
    this.opl.write(96 + cSlot, voice.car.attack);
    this.opl.write(128 + cSlot, voice.car.sustain);
    this.opl.write(224 + cSlot, voice.car.wave);
    this.opl.write(bank | 192 + c, voice.feedback);
    const useNote = inst.flags & 1 ? inst.fixedNote : playNote + voice.noteOffset;
    const { fnum, block } = this.noteToFreq(useNote, ch.pitch + detune);
    const b0 = block << 2 | fnum >> 8;
    this.voices[v].b0 = b0;
    this.opl.write(bank | 160 + c, fnum & 255);
    this.opl.write(bank | 176 + c, 32 | b0);
  }
  stopNote(midiCh, note) {
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === midiCh && this.voices[i].note === note) {
        this.opl.write(bankOf(i) | 176 + chIn(i), this.voices[i].b0);
        this.voices[i].midiCh = -1;
      }
    }
  }
  // --- MUS event stream ----------------------------------------------------
  readTick() {
    for (; ; ) {
      if (this.pos >= this.score.length) {
        this.restartOrStop();
        return;
      }
      const ev = this.score[this.pos++];
      const type = ev >> 4 & 7;
      const chn = ev & 15;
      switch (type) {
        case 0: {
          const note = this.score[this.pos++] & 127;
          this.stopNote(chn, note);
          break;
        }
        case 1: {
          const b = this.score[this.pos++];
          const note = b & 127;
          let vol = 100;
          if (b & 128) vol = this.score[this.pos++] & 127;
          this.startNote(chn, note, vol);
          break;
        }
        case 2: {
          const amt = this.score[this.pos++];
          this.chans[chn].pitch = (amt - 128) / 128 * 2;
          break;
        }
        case 3:
          this.pos++;
          break;
        // system event
        case 4: {
          const ctrl = this.score[this.pos++];
          const val = this.score[this.pos++];
          this.controller(chn, ctrl, val);
          break;
        }
        case 5:
          break;
        // end of measure
        case 6:
          this.restartOrStop();
          return;
        // score end
        case 7:
          this.pos++;
          break;
      }
      if (ev & 128) {
        let d = 0, b;
        do {
          b = this.score[this.pos++];
          d = d * 128 + (b & 127);
        } while (b & 128);
        this.delay = d;
        return;
      }
    }
  }
  controller(chn, ctrl, val) {
    switch (ctrl) {
      case 0:
        this.chans[chn].instrument = val;
        break;
      // instrument (program) change
      case 3:
        this.chans[chn].volume = val;
        break;
    }
  }
  restartOrStop() {
    if (this.loop) {
      this.pos = 0;
      this.delay = 0;
      this.allNotesOff();
    } else this.playing = false;
  }
  /** Render `out.length` mono samples, driving the 140 Hz tick clock. */
  generate(out2) {
    if (!this.playing) {
      out2.fill(0);
      return;
    }
    let i = 0;
    while (i < out2.length) {
      if (this.tickAcc <= 0) {
        while (this.playing && this.delay <= 0) this.readTick();
        this.delay--;
        this.tickAcc += this.samplesPerTick;
      }
      const n2 = Math.min(out2.length - i, Math.ceil(this.tickAcc));
      this.opl.generate(out2.subarray(i, i + n2));
      i += n2;
      this.tickAcc -= n2;
    }
  }
};

// src/mus.ts
function parseMus(lump) {
  if (lump.length < 16 || lump[0] !== 77 || lump[1] !== 85 || lump[2] !== 83) return null;
  const d = new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
  const scoreLen = d.getUint16(4, true);
  const scoreStart = d.getUint16(6, true);
  const instrCount = d.getUint16(12, true);
  const instruments = [];
  for (let i = 0; i < instrCount; i++) instruments.push(d.getUint16(16 + i * 2, true));
  return {
    score: lump.subarray(scoreStart, scoreStart + scoreLen),
    instruments
  };
}

// tools/musictest.ts
var buf = readFileSync("./doom1.wad");
var wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
var RATE = 44100;
var name = process.argv[2] ?? "D_E1M1";
var player = new MusicPlayer(wad.lump("GENMIDI"), RATE);
player.play(parseMus(wad.lump(name)), false);
var secs = Number(process.argv[3] ?? 20);
var out = new Float32Array(RATE * secs);
for (let i = 0; i < out.length; i += 4096) player.generate(out.subarray(i, Math.min(i + 4096, out.length)));
var rms = 0;
var peak = 0;
var nz = 0;
for (const s of out) {
  rms += s * s;
  peak = Math.max(peak, Math.abs(s));
  if (s !== 0) nz++;
}
console.log(`${name}: rms=${Math.sqrt(rms / out.length).toFixed(4)} peak=${peak.toFixed(4)} nonzero=${(100 * nz / out.length).toFixed(0)}%`);
var n = out.length;
var wav = Buffer.alloc(44 + n * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + n * 2, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(RATE, 24);
wav.writeUInt32LE(RATE * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(n * 2, 40);
for (let i = 0; i < n; i++) wav.writeInt16LE(Math.max(-1, Math.min(1, out[i])) * 32767, 44 + i * 2);
writeFileSync(`${name}.wav`, wav);
console.log(`wrote ${name}.wav (${secs}s)`);
