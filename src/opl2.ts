// An OPL FM synthesizer for DOOM's music. DOOM/DMX drives an OPL3 (YMF262):
// EIGHTEEN two-operator voices across two register banks — NOT the 9-voice OPL2,
// which drops half the parts of a busy score.
//
// The operator model follows the real chip: a phase generator indexes a
// quarter-wave log-sine table; that log value plus the envelope/level
// attenuation goes through an exp table to a signed linear sample. FM is genuine
// phase modulation — the modulator's output sample is added to the carrier's
// phase index. Scaling matches the documented YM3812/YMF262 fixed-point so
// GENMIDI patches sound like DOOM.

const OPL_RATE = 49716; // the chip's native sample rate

// --- wave tables (quarter-wave log-sine + exp), the classic OPL trick --------
const LOGSIN = new Uint16Array(256);
const EXP = new Uint16Array(256);
for (let i = 0; i < 256; i++) {
  LOGSIN[i] = Math.round(-Math.log2(Math.sin((i + 0.5) * Math.PI / 512)) * 256);
  EXP[i] = Math.round((2 ** (i / 256) - 1) * 1024);
}

// Signed operator sample. `att` is the total attenuation (log2 domain, 1/256
// units) already including envelope+level; `mod` is a phase offset (0..1023).
function waveSample(phaseIdx: number, eg: number, wave: number, mod: number): number {
  const p = (phaseIdx + mod) & 0x3ff;
  let logv: number;
  let sign = 0;
  switch (wave) {
    case 0: // full sine
      logv = LOGSIN[(p & 0x100) ? (~p & 0xff) : (p & 0xff)];
      sign = p & 0x200;
      break;
    case 1: // half sine — the negative half is silent
      if (p & 0x200) return 0;
      logv = LOGSIN[(p & 0x100) ? (~p & 0xff) : (p & 0xff)];
      break;
    case 2: // absolute sine (full-wave rectified)
      logv = LOGSIN[(p & 0x100) ? (~p & 0xff) : (p & 0xff)];
      break;
    default: { // 3: quarter sine (only the first quarter of each half)
      if (p & 0x100) return 0;
      logv = LOGSIN[p & 0xff];
      break;
    }
  }
  let att = logv + (eg << 3); // eg is 0..511; <<3 aligns it to the log table
  if (att > 0x1fff) att = 0x1fff;
  const out = ((EXP[(att & 0xff) ^ 0xff] | 0x400) << 1) >> (att >> 8);
  return sign ? -out : out;
}

// Multiplier table (reg 0x20 low nibble), in the chip's half-steps.
const MULT = [1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30]; // ×0.5 implied

// Envelope rate ladder: attenuation-units (of 511 full-scale) per CHIP sample.
// Tuned so a mid rate decays in ~100 ms, the fastest in a couple ms, the slowest
// in seconds — the range real OPL envelopes span.
const EG_INC = new Float64Array(64);
for (let i = 0; i < 64; i++) EG_INC[i] = i < 4 ? 0 : 0.0004 * 2 ** (i / 4);

const enum EG { Attack, Decay, Sustain, Release, Off }

interface Op {
  mult: number; ksr: boolean; ksl: number; tl: number;
  ar: number; dr: number; sl: number; rr: number;
  wave: number; sustain: boolean;
  phase: number; env: number; state: EG; out: number; prev: number;
}
function newOp(): Op {
  return { mult: 1, ksr: false, ksl: 0, tl: 0, ar: 0, dr: 0, sl: 0, rr: 0, wave: 0,
    sustain: false, phase: 0, env: 511, state: EG.Off, out: 0, prev: 0 };
}
interface Channel {
  ops: [Op, Op];
  fnum: number; block: number; keyOn: boolean;
  feedback: number; connection: boolean;
}

// A channel's two operators are INTERLEAVED in the register file, not adjacent:
// channel c's modulator is at offset MOD_OFF[c], its carrier at CAR_OFF[c]. Map
// each register offset back to this class's paired-op layout (ops[2c]=mod,
// ops[2c+1]=car) so patch writes land on the right operator.
const MOD_OFF = [0x00, 0x01, 0x02, 0x08, 0x09, 0x0a, 0x10, 0x11, 0x12];
const CAR_OFF = [0x03, 0x04, 0x05, 0x0b, 0x0c, 0x0d, 0x13, 0x14, 0x15];
const OP_LOOKUP = new Int8Array(0x20).fill(-1);
MOD_OFF.forEach((off, ch) => { OP_LOOKUP[off] = 2 * ch; });
CAR_OFF.forEach((off, ch) => { OP_LOOKUP[off] = 2 * ch + 1; });
const KSL_TAB = [0, 3, 1.5, 6]; // dB/octave for the 2-bit KSL setting

export class OPL2 {
  private ch: Channel[] = [];
  private ops: Op[] = [];
  private readonly step: number;
  private acc = 0;
  private last = 0;
  // Optional register-write capture for the offline reference-comparison tool.
  // Null in normal use (zero overhead). Each entry: output-sample time, reg, val.
  capture: { t: number; reg: number; val: number }[] | null = null;
  private sampleClock = 0;

  constructor(outputRate: number) {
    this.step = OPL_RATE / outputRate;
    for (let i = 0; i < 18; i++) { // OPL3's 18 voices (two OPL2 banks)
      const a = newOp(), b = newOp();
      this.ops.push(a, b);
      this.ch.push({ ops: [a, b], fnum: 0, block: 0, keyOn: false, feedback: 0, connection: false });
    }
  }

  private opIndex(reg: number): number {
    const idx = OP_LOOKUP[reg & 0x1f];
    return idx < 0 ? -1 : idx + ((reg & 0x100) ? 18 : 0);
  }

  /** Write one OPL register. 0x100+ addresses the second bank (voices 9..17). */
  write(reg: number, val: number): void {
    if (this.capture) this.capture.push({ t: this.sampleClock, reg, val });
    const r = reg & 0xff;
    const cbase = (reg & 0x100) ? 9 : 0;
    const hi = r & 0xe0;
    if (r >= 0xa0 && r <= 0xa8) {
      const c = this.ch[cbase + r - 0xa0];
      c.fnum = (c.fnum & 0x300) | val;
    } else if (r >= 0xb0 && r <= 0xb8) {
      const c = this.ch[cbase + r - 0xb0];
      c.fnum = (c.fnum & 0xff) | ((val & 3) << 8);
      c.block = (val >> 2) & 7;
      const on = (val & 0x20) !== 0;
      if (on && !c.keyOn) for (const o of c.ops) { o.state = EG.Attack; o.phase = 0; }
      else if (!on && c.keyOn) for (const o of c.ops) o.state = EG.Release;
      c.keyOn = on;
    } else if (r >= 0xc0 && r <= 0xc8) {
      const c = this.ch[cbase + r - 0xc0];
      c.feedback = (val >> 1) & 7;
      c.connection = (val & 1) !== 0;
    } else if (hi === 0x20 || hi === 0x40 || hi === 0x60 || hi === 0x80 || hi === 0xe0) {
      const oi = this.opIndex(reg);
      if (oi < 0) return;
      const o = this.ops[oi];
      switch (hi) {
        case 0x20:
          o.mult = MULT[val & 0xf];
          o.ksr = (val & 0x10) !== 0;
          o.sustain = (val & 0x20) !== 0;
          break;
        case 0x40: o.ksl = (val >> 6) & 3; o.tl = val & 0x3f; break;
        case 0x60: o.ar = (val >> 4) & 0xf; o.dr = val & 0xf; break;
        case 0x80: o.sl = (val >> 4) & 0xf; o.rr = val & 0xf; break;
        case 0xe0: o.wave = val & 3; break;
      }
    }
  }

  private egRate(nibble: number, c: Channel, o: Op): number {
    if (nibble === 0) return 0;
    const ks = o.ksr ? c.block : c.block >> 2;
    return Math.min(63, nibble * 4 + ks);
  }

  // Advance one operator; return its signed sample. `mod` is a phase offset.
  private runOp(o: Op, c: Channel, mod: number): number {
    switch (o.state) {
      case EG.Attack:
        // Exponential rise toward full volume (attenuation env -> 0).
        o.env -= EG_INC[this.egRate(o.ar, c, o)] * (o.env + 16) * 0.5;
        if (o.env <= 0) { o.env = 0; o.state = EG.Decay; }
        break;
      case EG.Decay: {
        const target = o.sl * 32;
        o.env += EG_INC[this.egRate(o.dr, c, o)];
        if (o.env >= target) { o.env = target; o.state = EG.Sustain; }
        break;
      }
      case EG.Sustain:
        // EG-type 0 keeps releasing; EG-type 1 (sustain) holds until key-off.
        if (!o.sustain) { o.env += EG_INC[this.egRate(o.rr, c, o)]; if (o.env >= 511) { o.env = 511; o.state = EG.Off; } }
        break;
      case EG.Release:
        o.env += EG_INC[this.egRate(o.rr, c, o)];
        if (o.env >= 511) { o.env = 511; o.state = EG.Off; }
        break;
      case EG.Off:
        o.prev = o.out; o.out = 0; return 0;
    }

    // Phase generator: index advances by fnum·2^block·(mult/2) per sample; the
    // top bits of the accumulator (>>10) are the 10-bit sine index.
    o.phase = (o.phase + (c.fnum << c.block) * o.mult * 0.5) % (1 << 20);
    const idx = (o.phase >> 10) & 0x3ff;

    // Level: envelope + total level + key-scale level, clamped to the 9-bit range.
    let eg = o.env + o.tl * 4 + Math.round(KSL_TAB[o.ksl] * c.block * 1.33);
    if (eg > 511) eg = 511;

    o.prev = o.out;
    o.out = waveSample(idx, eg | 0, o.wave, mod);
    return o.out;
  }

  private chipSample(): number {
    let sum = 0;
    for (const c of this.ch) {
      const [mod, car] = c.ops;
      // Phase modulation is scaled so a full-scale operator output (~±4084)
      // shifts the target phase by about a quarter cycle — a musical FM depth,
      // not the ±2-cycle scream that turns every note into noise. The modulator's
      // own patch level then dials the brightness within that.
      const fb = c.feedback ? ((mod.prev + mod.out) >> (10 - c.feedback)) >> 4 : 0;
      const m = this.runOp(mod, c, fb);
      if (c.connection) {
        sum += m + this.runOp(car, c, 0);     // additive (AM)
      } else {
        sum += this.runOp(car, c, m >> 1);    // FM: modulator phase-modulates carrier
      }
    }
    return sum;
  }

  /** Fill a mono Float32 buffer at the output rate. */
  generate(out: Float32Array): void {
    for (let i = 0; i < out.length; i++) {
      this.sampleClock++;
      this.acc += this.step;
      while (this.acc >= 1) { this.last = this.chipSample(); this.acc -= 1; }
      out[i] = Math.max(-1, Math.min(1, this.last / 10000));
    }
  }
}
