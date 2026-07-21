// Nuked-OPL3 v1.8 — a cycle-exact YMF262 (OPL3) emulator, mechanically ported
// from the reference C (opl3.c / opl3.h, Copyright (C) 2013-2020 Nuke.YKT,
// LGPL-2.1-or-later). This is a faithful translation of the DSP: the same
// tables, the same integer widths, the same evaluation order. It is NOT an
// approximation and must not be "improved".
//
// Differences from the C, all deliberate and behavior-neutral for our use:
//   - OPL_ENABLE_STEREOEXT is OFF, so panpot / leftpan / rightpan / stereoext
//     and the reg 0xD0 path are dropped. OPL_QUIRK_CHANNELSAMPLEDELAY is ON
//     (that is its default when STEREOEXT is off), and is kept.
//   - The write buffer / timing (OPL3_WriteRegBuffered) is dropped; we call
//     OPL3_WriteReg immediately, exactly like the tools/oplref/oplref.c harness.
//   - Output is mono: we take the LEFT channel (buf4[0]) like oplref.c, and
//     convert the int16 result to Float32 by dividing by 32768.
//
// The class OPL3 is a drop-in replacement for OPL2 in src/opl2.ts.

/* eslint-disable @typescript-eslint/naming-convention */

const RSM_FRAC = 10;

// Channel types
const ch_2op = 0;
const ch_4op = 1;
const ch_4op2 = 2;
const ch_drum = 3;

// Envelope key types
const egk_norm = 0x01;
const egk_drum = 0x02;

// Envelope generator phase numbers
const envelope_gen_num_attack = 0;
const envelope_gen_num_decay = 1;
const envelope_gen_num_sustain = 2;
const envelope_gen_num_release = 3;

// logsin table
const logsinrom = new Uint16Array([
  0x859, 0x6c3, 0x607, 0x58b, 0x52e, 0x4e4, 0x4a6, 0x471,
  0x443, 0x41a, 0x3f5, 0x3d3, 0x3b5, 0x398, 0x37e, 0x365,
  0x34e, 0x339, 0x324, 0x311, 0x2ff, 0x2ed, 0x2dc, 0x2cd,
  0x2bd, 0x2af, 0x2a0, 0x293, 0x286, 0x279, 0x26d, 0x261,
  0x256, 0x24b, 0x240, 0x236, 0x22c, 0x222, 0x218, 0x20f,
  0x206, 0x1fd, 0x1f5, 0x1ec, 0x1e4, 0x1dc, 0x1d4, 0x1cd,
  0x1c5, 0x1be, 0x1b7, 0x1b0, 0x1a9, 0x1a2, 0x19b, 0x195,
  0x18f, 0x188, 0x182, 0x17c, 0x177, 0x171, 0x16b, 0x166,
  0x160, 0x15b, 0x155, 0x150, 0x14b, 0x146, 0x141, 0x13c,
  0x137, 0x133, 0x12e, 0x129, 0x125, 0x121, 0x11c, 0x118,
  0x114, 0x10f, 0x10b, 0x107, 0x103, 0x0ff, 0x0fb, 0x0f8,
  0x0f4, 0x0f0, 0x0ec, 0x0e9, 0x0e5, 0x0e2, 0x0de, 0x0db,
  0x0d7, 0x0d4, 0x0d1, 0x0cd, 0x0ca, 0x0c7, 0x0c4, 0x0c1,
  0x0be, 0x0bb, 0x0b8, 0x0b5, 0x0b2, 0x0af, 0x0ac, 0x0a9,
  0x0a7, 0x0a4, 0x0a1, 0x09f, 0x09c, 0x099, 0x097, 0x094,
  0x092, 0x08f, 0x08d, 0x08a, 0x088, 0x086, 0x083, 0x081,
  0x07f, 0x07d, 0x07a, 0x078, 0x076, 0x074, 0x072, 0x070,
  0x06e, 0x06c, 0x06a, 0x068, 0x066, 0x064, 0x062, 0x060,
  0x05e, 0x05c, 0x05b, 0x059, 0x057, 0x055, 0x053, 0x052,
  0x050, 0x04e, 0x04d, 0x04b, 0x04a, 0x048, 0x046, 0x045,
  0x043, 0x042, 0x040, 0x03f, 0x03e, 0x03c, 0x03b, 0x039,
  0x038, 0x037, 0x035, 0x034, 0x033, 0x031, 0x030, 0x02f,
  0x02e, 0x02d, 0x02b, 0x02a, 0x029, 0x028, 0x027, 0x026,
  0x025, 0x024, 0x023, 0x022, 0x021, 0x020, 0x01f, 0x01e,
  0x01d, 0x01c, 0x01b, 0x01a, 0x019, 0x018, 0x017, 0x017,
  0x016, 0x015, 0x014, 0x014, 0x013, 0x012, 0x011, 0x011,
  0x010, 0x00f, 0x00f, 0x00e, 0x00d, 0x00d, 0x00c, 0x00c,
  0x00b, 0x00a, 0x00a, 0x009, 0x009, 0x008, 0x008, 0x007,
  0x007, 0x007, 0x006, 0x006, 0x005, 0x005, 0x005, 0x004,
  0x004, 0x004, 0x003, 0x003, 0x003, 0x002, 0x002, 0x002,
  0x002, 0x001, 0x001, 0x001, 0x001, 0x001, 0x001, 0x001,
  0x000, 0x000, 0x000, 0x000, 0x000, 0x000, 0x000, 0x000,
]);

// exp table
const exprom = new Uint16Array([
  0x7fa, 0x7f5, 0x7ef, 0x7ea, 0x7e4, 0x7df, 0x7da, 0x7d4,
  0x7cf, 0x7c9, 0x7c4, 0x7bf, 0x7b9, 0x7b4, 0x7ae, 0x7a9,
  0x7a4, 0x79f, 0x799, 0x794, 0x78f, 0x78a, 0x784, 0x77f,
  0x77a, 0x775, 0x770, 0x76a, 0x765, 0x760, 0x75b, 0x756,
  0x751, 0x74c, 0x747, 0x742, 0x73d, 0x738, 0x733, 0x72e,
  0x729, 0x724, 0x71f, 0x71a, 0x715, 0x710, 0x70b, 0x706,
  0x702, 0x6fd, 0x6f8, 0x6f3, 0x6ee, 0x6e9, 0x6e5, 0x6e0,
  0x6db, 0x6d6, 0x6d2, 0x6cd, 0x6c8, 0x6c4, 0x6bf, 0x6ba,
  0x6b5, 0x6b1, 0x6ac, 0x6a8, 0x6a3, 0x69e, 0x69a, 0x695,
  0x691, 0x68c, 0x688, 0x683, 0x67f, 0x67a, 0x676, 0x671,
  0x66d, 0x668, 0x664, 0x65f, 0x65b, 0x657, 0x652, 0x64e,
  0x649, 0x645, 0x641, 0x63c, 0x638, 0x634, 0x630, 0x62b,
  0x627, 0x623, 0x61e, 0x61a, 0x616, 0x612, 0x60e, 0x609,
  0x605, 0x601, 0x5fd, 0x5f9, 0x5f5, 0x5f0, 0x5ec, 0x5e8,
  0x5e4, 0x5e0, 0x5dc, 0x5d8, 0x5d4, 0x5d0, 0x5cc, 0x5c8,
  0x5c4, 0x5c0, 0x5bc, 0x5b8, 0x5b4, 0x5b0, 0x5ac, 0x5a8,
  0x5a4, 0x5a0, 0x59c, 0x599, 0x595, 0x591, 0x58d, 0x589,
  0x585, 0x581, 0x57e, 0x57a, 0x576, 0x572, 0x56f, 0x56b,
  0x567, 0x563, 0x560, 0x55c, 0x558, 0x554, 0x551, 0x54d,
  0x549, 0x546, 0x542, 0x53e, 0x53b, 0x537, 0x534, 0x530,
  0x52c, 0x529, 0x525, 0x522, 0x51e, 0x51b, 0x517, 0x514,
  0x510, 0x50c, 0x509, 0x506, 0x502, 0x4ff, 0x4fb, 0x4f8,
  0x4f4, 0x4f1, 0x4ed, 0x4ea, 0x4e7, 0x4e3, 0x4e0, 0x4dc,
  0x4d9, 0x4d6, 0x4d2, 0x4cf, 0x4cc, 0x4c8, 0x4c5, 0x4c2,
  0x4be, 0x4bb, 0x4b8, 0x4b5, 0x4b1, 0x4ae, 0x4ab, 0x4a8,
  0x4a4, 0x4a1, 0x49e, 0x49b, 0x498, 0x494, 0x491, 0x48e,
  0x48b, 0x488, 0x485, 0x482, 0x47e, 0x47b, 0x478, 0x475,
  0x472, 0x46f, 0x46c, 0x469, 0x466, 0x463, 0x460, 0x45d,
  0x45a, 0x457, 0x454, 0x451, 0x44e, 0x44b, 0x448, 0x445,
  0x442, 0x43f, 0x43c, 0x439, 0x436, 0x433, 0x430, 0x42d,
  0x42a, 0x428, 0x425, 0x422, 0x41f, 0x41c, 0x419, 0x416,
  0x414, 0x411, 0x40e, 0x40b, 0x408, 0x406, 0x403, 0x400,
]);

// freq mult table multiplied by 2
const mt = new Uint8Array([
  1, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 20, 24, 24, 30, 30,
]);

// ksl table
const kslrom = new Uint8Array([
  0, 32, 40, 45, 48, 51, 53, 55, 56, 58, 59, 60, 61, 62, 63, 64,
]);

const kslshift = new Uint8Array([8, 1, 2, 0]);

// envelope generator constants
const eg_incstep = [
  new Uint8Array([0, 0, 0, 0]),
  new Uint8Array([1, 0, 0, 0]),
  new Uint8Array([1, 0, 1, 0]),
  new Uint8Array([1, 1, 1, 0]),
];

// address decoding
const ad_slot = new Int8Array([
  0, 1, 2, 3, 4, 5, -1, -1, 6, 7, 8, 9, 10, 11, -1, -1,
  12, 13, 14, 15, 16, 17, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
]);

const ch_slot = new Uint8Array([
  0, 1, 2, 6, 7, 8, 12, 13, 14, 18, 19, 20, 24, 25, 26, 30, 31, 32,
]);

// A pointer-to-int16/uint8-field, matching the C `int16_t *` / `uint8_t *` fields
// (slot->mod, slot->trem, channel->out[4]). `o` is the owning object, `k` the
// field name. Reading dereferences the current value.
interface Ptr { o: Slot | Chip; k: 'out' | 'fbmod' | 'zeromod' | 'tremolo'; }

// Truncate to signed 16-bit, matching C int16_t assignment/overflow.
function i16(x: number): number {
  return (x << 16) >> 16;
}

class Slot {
  channel: Channel = null!;
  chip: Chip = null!;
  out = 0;        // int16
  fbmod = 0;      // int16
  mod: Ptr = null!;   // int16*
  prout = 0;      // int16
  eg_rout = 0;    // uint16
  eg_out = 0;     // uint16
  eg_inc = 0;     // uint8 (unused in DSP path)
  eg_gen = 0;     // uint8
  eg_rate = 0;    // uint8 (unused in DSP path)
  eg_ksl = 0;     // uint8
  trem: Ptr = null!;  // uint8*
  reg_vib = 0;
  reg_type = 0;
  reg_ksr = 0;
  reg_mult = 0;
  reg_ksl = 0;
  reg_tl = 0;
  reg_ar = 0;
  reg_dr = 0;
  reg_sl = 0;
  reg_rr = 0;
  reg_wf = 0;
  key = 0;        // uint8
  pg_reset = 0;   // uint32 (0/1)
  pg_phase = 0;   // uint32
  pg_phase_out = 0; // uint16
  slot_num = 0;
}

class Channel {
  slotz: [Slot, Slot] = [null!, null!];
  pair: Channel = null!;
  chip: Chip = null!;
  out: [Ptr, Ptr, Ptr, Ptr] = [null!, null!, null!, null!];
  chtype = 0;
  f_num = 0;      // uint16
  block = 0;      // uint8
  fb = 0;         // uint8
  con = 0;        // uint8
  alg = 0;        // uint8
  ksv = 0;        // uint8
  cha = 0;        // uint16
  chb = 0;        // uint16
  chc = 0;        // uint16
  chd = 0;        // uint16
  ch_num = 0;     // uint8
}

class Chip {
  channel: Channel[] = [];
  slot: Slot[] = [];
  timer = 0;          // uint16
  eg_timer = 0;       // uint64 (JS number, < 2^53)
  eg_timerrem = 0;    // uint8
  eg_state = 0;       // uint8
  eg_add = 0;         // uint8
  eg_timer_lo = 0;    // uint8
  newm = 0;           // uint8
  nts = 0;            // uint8
  rhy = 0;            // uint8
  vibpos = 0;         // uint8
  vibshift = 0;       // uint8
  tremolo = 0;        // uint8
  tremolopos = 0;     // uint8
  tremoloshift = 0;   // uint8
  noise = 0;          // uint32
  zeromod = 0;        // int16 (always 0)
  mixbuff = [0, 0, 0, 0]; // int32[4]
  rm_hh_bit2 = 0;
  rm_hh_bit3 = 0;
  rm_hh_bit7 = 0;
  rm_hh_bit8 = 0;
  rm_tc_bit3 = 0;
  rm_tc_bit5 = 0;
  rateratio = 0;      // int32
  samplecnt = 0;      // int32
  oldsamples = [0, 0, 0, 0]; // int16[4]
  samples = [0, 0, 0, 0];    // int16[4]
}

// Dereference a Ptr.
function rd(p: Ptr): number {
  return (p.o as unknown as Record<string, number>)[p.k];
}

/*
    Envelope generator
*/

function OPL3_EnvelopeCalcExp(level: number): number {
  if (level > 0x1fff) {
    level = 0x1fff;
  }
  return (exprom[level & 0xff] << 1) >> (level >> 8);
}

function OPL3_EnvelopeCalcSin0(phase: number, envelope: number): number {
  let out = 0;
  let neg = 0;
  phase &= 0x3ff;
  if (phase & 0x200) {
    neg = 0xffff;
  }
  if (phase & 0x100) {
    out = logsinrom[(phase & 0xff) ^ 0xff];
  } else {
    out = logsinrom[phase & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
}

function OPL3_EnvelopeCalcSin1(phase: number, envelope: number): number {
  let out = 0;
  phase &= 0x3ff;
  if (phase & 0x200) {
    out = 0x1000;
  } else if (phase & 0x100) {
    out = logsinrom[(phase & 0xff) ^ 0xff];
  } else {
    out = logsinrom[phase & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}

function OPL3_EnvelopeCalcSin2(phase: number, envelope: number): number {
  let out = 0;
  phase &= 0x3ff;
  if (phase & 0x100) {
    out = logsinrom[(phase & 0xff) ^ 0xff];
  } else {
    out = logsinrom[phase & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}

function OPL3_EnvelopeCalcSin3(phase: number, envelope: number): number {
  let out = 0;
  phase &= 0x3ff;
  if (phase & 0x100) {
    out = 0x1000;
  } else {
    out = logsinrom[phase & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}

function OPL3_EnvelopeCalcSin4(phase: number, envelope: number): number {
  let out = 0;
  let neg = 0;
  phase &= 0x3ff;
  if ((phase & 0x300) === 0x100) {
    neg = 0xffff;
  }
  if (phase & 0x200) {
    out = 0x1000;
  } else if (phase & 0x80) {
    out = logsinrom[((phase ^ 0xff) << 1) & 0xff];
  } else {
    out = logsinrom[(phase << 1) & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
}

function OPL3_EnvelopeCalcSin5(phase: number, envelope: number): number {
  let out = 0;
  phase &= 0x3ff;
  if (phase & 0x200) {
    out = 0x1000;
  } else if (phase & 0x80) {
    out = logsinrom[((phase ^ 0xff) << 1) & 0xff];
  } else {
    out = logsinrom[(phase << 1) & 0xff];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}

function OPL3_EnvelopeCalcSin6(phase: number, envelope: number): number {
  let neg = 0;
  phase &= 0x3ff;
  if (phase & 0x200) {
    neg = 0xffff;
  }
  return i16(OPL3_EnvelopeCalcExp(envelope << 3) ^ neg);
}

function OPL3_EnvelopeCalcSin7(phase: number, envelope: number): number {
  let out = 0;
  let neg = 0;
  phase &= 0x3ff;
  if (phase & 0x200) {
    neg = 0xffff;
    phase = (phase & 0x1ff) ^ 0x1ff;
  }
  out = phase << 3;
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
}

type SinFunc = (phase: number, envelope: number) => number;
const envelope_sin: SinFunc[] = [
  OPL3_EnvelopeCalcSin0,
  OPL3_EnvelopeCalcSin1,
  OPL3_EnvelopeCalcSin2,
  OPL3_EnvelopeCalcSin3,
  OPL3_EnvelopeCalcSin4,
  OPL3_EnvelopeCalcSin5,
  OPL3_EnvelopeCalcSin6,
  OPL3_EnvelopeCalcSin7,
];

function OPL3_EnvelopeUpdateKSL(slot: Slot): void {
  let ksl = (kslrom[slot.channel.f_num >> 6] << 2)
    - ((0x08 - slot.channel.block) << 5);
  if (ksl < 0) {
    ksl = 0;
  }
  slot.eg_ksl = ksl & 0xff;
}

function OPL3_EnvelopeCalc(slot: Slot): void {
  let reg_rate = 0;
  let reset = 0;
  slot.eg_out = (slot.eg_rout + (slot.reg_tl << 2)
    + (slot.eg_ksl >> kslshift[slot.reg_ksl]) + rd(slot.trem)) & 0xffff;
  if (slot.key && slot.eg_gen === envelope_gen_num_release) {
    reset = 1;
    reg_rate = slot.reg_ar;
  } else {
    switch (slot.eg_gen) {
      case envelope_gen_num_attack:
        reg_rate = slot.reg_ar;
        break;
      case envelope_gen_num_decay:
        reg_rate = slot.reg_dr;
        break;
      case envelope_gen_num_sustain:
        if (!slot.reg_type) {
          reg_rate = slot.reg_rr;
        }
        break;
      case envelope_gen_num_release:
        reg_rate = slot.reg_rr;
        break;
    }
  }
  slot.pg_reset = reset;
  const ks = slot.channel.ksv >> ((slot.reg_ksr ^ 1) << 1);
  const nonzero = (reg_rate !== 0) ? 1 : 0;
  const rate = (ks + (reg_rate << 2)) & 0xff;
  let rate_hi = rate >> 2;
  const rate_lo = rate & 0x03;
  if (rate_hi & 0x10) {
    rate_hi = 0x0f;
  }
  const eg_shift = (rate_hi + slot.chip.eg_add) & 0xff;
  let shift = 0;
  if (nonzero) {
    if (rate_hi < 12) {
      if (slot.chip.eg_state) {
        switch (eg_shift) {
          case 12:
            shift = 1;
            break;
          case 13:
            shift = (rate_lo >> 1) & 0x01;
            break;
          case 14:
            shift = rate_lo & 0x01;
            break;
          default:
            break;
        }
      }
    } else {
      shift = ((rate_hi & 0x03) + eg_incstep[rate_lo][slot.chip.eg_timer_lo]) & 0xff;
      if (shift & 0x04) {
        shift = 0x03;
      }
      if (!shift) {
        shift = slot.chip.eg_state;
      }
    }
  }
  let eg_rout = slot.eg_rout;
  let eg_inc = 0;
  let eg_off = 0;
  // Instant attack
  if (reset && rate_hi === 0x0f) {
    eg_rout = 0x00;
  }
  // Envelope off
  if ((slot.eg_rout & 0x1f8) === 0x1f8) {
    eg_off = 1;
  }
  if (slot.eg_gen !== envelope_gen_num_attack && !reset && eg_off) {
    eg_rout = 0x1ff;
  }
  switch (slot.eg_gen) {
    case envelope_gen_num_attack:
      if (!slot.eg_rout) {
        slot.eg_gen = envelope_gen_num_decay;
      } else if (slot.key && shift > 0 && rate_hi !== 0x0f) {
        eg_inc = (~slot.eg_rout) >> (4 - shift);
      }
      break;
    case envelope_gen_num_decay:
      if ((slot.eg_rout >> 4) === slot.reg_sl) {
        slot.eg_gen = envelope_gen_num_sustain;
      } else if (!eg_off && !reset && shift > 0) {
        eg_inc = 1 << (shift - 1);
      }
      break;
    case envelope_gen_num_sustain:
    case envelope_gen_num_release:
      if (!eg_off && !reset && shift > 0) {
        eg_inc = 1 << (shift - 1);
      }
      break;
  }
  slot.eg_rout = (eg_rout + eg_inc) & 0x1ff;
  // Key off
  if (reset) {
    slot.eg_gen = envelope_gen_num_attack;
  }
  if (!slot.key) {
    slot.eg_gen = envelope_gen_num_release;
  }
}

function OPL3_EnvelopeKeyOn(slot: Slot, type: number): void {
  slot.key |= type;
}

function OPL3_EnvelopeKeyOff(slot: Slot, type: number): void {
  slot.key &= ~type;
}

/*
    Phase Generator
*/

function OPL3_PhaseGenerate(slot: Slot): void {
  const chip = slot.chip;
  let f_num = slot.channel.f_num;
  if (slot.reg_vib) {
    let range = (f_num >> 7) & 7;
    const vibpos = slot.chip.vibpos;

    if (!(vibpos & 3)) {
      range = 0;
    } else if (vibpos & 1) {
      range >>= 1;
    }
    range >>= slot.chip.vibshift;

    if (vibpos & 4) {
      range = -range;
    }
    f_num = (f_num + range) & 0xffff;
  }
  const basefreq = ((f_num << slot.channel.block) >>> 1) >>> 0;
  const phase = (slot.pg_phase >>> 9) & 0xffff;
  if (slot.pg_reset) {
    slot.pg_phase = 0;
  }
  slot.pg_phase = (slot.pg_phase + (((basefreq * mt[slot.reg_mult]) >>> 1) >>> 0)) >>> 0;
  // Rhythm mode
  const noise = chip.noise;
  slot.pg_phase_out = phase;
  if (slot.slot_num === 13) { // hh
    chip.rm_hh_bit2 = (phase >> 2) & 1;
    chip.rm_hh_bit3 = (phase >> 3) & 1;
    chip.rm_hh_bit7 = (phase >> 7) & 1;
    chip.rm_hh_bit8 = (phase >> 8) & 1;
  }
  if (slot.slot_num === 17 && (chip.rhy & 0x20)) { // tc
    chip.rm_tc_bit3 = (phase >> 3) & 1;
    chip.rm_tc_bit5 = (phase >> 5) & 1;
  }
  if (chip.rhy & 0x20) {
    const rm_xor = (chip.rm_hh_bit2 ^ chip.rm_hh_bit7)
      | (chip.rm_hh_bit3 ^ chip.rm_tc_bit5)
      | (chip.rm_tc_bit3 ^ chip.rm_tc_bit5);
    switch (slot.slot_num) {
      case 13: // hh
        slot.pg_phase_out = (rm_xor << 9) & 0xffff;
        if (rm_xor ^ (noise & 1)) {
          slot.pg_phase_out |= 0xd0;
        } else {
          slot.pg_phase_out |= 0x34;
        }
        break;
      case 16: // sd
        slot.pg_phase_out = ((chip.rm_hh_bit8 << 9)
          | ((chip.rm_hh_bit8 ^ (noise & 1)) << 8)) & 0xffff;
        break;
      case 17: // tc
        slot.pg_phase_out = ((rm_xor << 9) | 0x80) & 0xffff;
        break;
      default:
        break;
    }
  }
  const n_bit = ((noise >>> 14) ^ noise) & 0x01;
  chip.noise = ((noise >>> 1) | (n_bit << 22)) >>> 0;
}

/*
    Slot
*/

function OPL3_SlotWrite20(slot: Slot, data: number): void {
  if ((data >> 7) & 0x01) {
    slot.trem = { o: slot.chip, k: 'tremolo' };
  } else {
    slot.trem = { o: slot.chip, k: 'zeromod' };
  }
  slot.reg_vib = (data >> 6) & 0x01;
  slot.reg_type = (data >> 5) & 0x01;
  slot.reg_ksr = (data >> 4) & 0x01;
  slot.reg_mult = data & 0x0f;
}

function OPL3_SlotWrite40(slot: Slot, data: number): void {
  slot.reg_ksl = (data >> 6) & 0x03;
  slot.reg_tl = data & 0x3f;
  OPL3_EnvelopeUpdateKSL(slot);
}

function OPL3_SlotWrite60(slot: Slot, data: number): void {
  slot.reg_ar = (data >> 4) & 0x0f;
  slot.reg_dr = data & 0x0f;
}

function OPL3_SlotWrite80(slot: Slot, data: number): void {
  slot.reg_sl = (data >> 4) & 0x0f;
  if (slot.reg_sl === 0x0f) {
    slot.reg_sl = 0x1f;
  }
  slot.reg_rr = data & 0x0f;
}

function OPL3_SlotWriteE0(slot: Slot, data: number): void {
  slot.reg_wf = data & 0x07;
  if (slot.chip.newm === 0x00) {
    slot.reg_wf &= 0x03;
  }
}

function OPL3_SlotGenerate(slot: Slot): void {
  slot.out = envelope_sin[slot.reg_wf](slot.pg_phase_out + rd(slot.mod), slot.eg_out);
}

function OPL3_SlotCalcFB(slot: Slot): void {
  if (slot.channel.fb !== 0x00) {
    slot.fbmod = i16((slot.prout + slot.out) >> (0x09 - slot.channel.fb));
  } else {
    slot.fbmod = 0;
  }
  slot.prout = slot.out;
}

/*
    Channel
*/

function OPL3_ChannelUpdateRhythm(chip: Chip, data: number): void {
  chip.rhy = data & 0x3f;
  if (chip.rhy & 0x20) {
    const channel6 = chip.channel[6];
    const channel7 = chip.channel[7];
    const channel8 = chip.channel[8];
    channel6.out[0] = { o: channel6.slotz[1], k: 'out' };
    channel6.out[1] = { o: channel6.slotz[1], k: 'out' };
    channel6.out[2] = { o: chip, k: 'zeromod' };
    channel6.out[3] = { o: chip, k: 'zeromod' };
    channel7.out[0] = { o: channel7.slotz[0], k: 'out' };
    channel7.out[1] = { o: channel7.slotz[0], k: 'out' };
    channel7.out[2] = { o: channel7.slotz[1], k: 'out' };
    channel7.out[3] = { o: channel7.slotz[1], k: 'out' };
    channel8.out[0] = { o: channel8.slotz[0], k: 'out' };
    channel8.out[1] = { o: channel8.slotz[0], k: 'out' };
    channel8.out[2] = { o: channel8.slotz[1], k: 'out' };
    channel8.out[3] = { o: channel8.slotz[1], k: 'out' };
    for (let chnum = 6; chnum < 9; chnum++) {
      chip.channel[chnum].chtype = ch_drum;
    }
    OPL3_ChannelSetupAlg(channel6);
    OPL3_ChannelSetupAlg(channel7);
    OPL3_ChannelSetupAlg(channel8);
    // hh
    if (chip.rhy & 0x01) {
      OPL3_EnvelopeKeyOn(channel7.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[0], egk_drum);
    }
    // tc
    if (chip.rhy & 0x02) {
      OPL3_EnvelopeKeyOn(channel8.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[1], egk_drum);
    }
    // tom
    if (chip.rhy & 0x04) {
      OPL3_EnvelopeKeyOn(channel8.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[0], egk_drum);
    }
    // sd
    if (chip.rhy & 0x08) {
      OPL3_EnvelopeKeyOn(channel7.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[1], egk_drum);
    }
    // bd
    if (chip.rhy & 0x10) {
      OPL3_EnvelopeKeyOn(channel6.slotz[0], egk_drum);
      OPL3_EnvelopeKeyOn(channel6.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel6.slotz[0], egk_drum);
      OPL3_EnvelopeKeyOff(channel6.slotz[1], egk_drum);
    }
  } else {
    for (let chnum = 6; chnum < 9; chnum++) {
      chip.channel[chnum].chtype = ch_2op;
      OPL3_ChannelSetupAlg(chip.channel[chnum]);
      OPL3_EnvelopeKeyOff(chip.channel[chnum].slotz[0], egk_drum);
      OPL3_EnvelopeKeyOff(chip.channel[chnum].slotz[1], egk_drum);
    }
  }
}

function OPL3_ChannelWriteA0(channel: Channel, data: number): void {
  if (channel.chip.newm && channel.chtype === ch_4op2) {
    return;
  }
  channel.f_num = (channel.f_num & 0x300) | data;
  channel.ksv = ((channel.block << 1)
    | ((channel.f_num >> (0x09 - channel.chip.nts)) & 0x01)) & 0xff;
  OPL3_EnvelopeUpdateKSL(channel.slotz[0]);
  OPL3_EnvelopeUpdateKSL(channel.slotz[1]);
  if (channel.chip.newm && channel.chtype === ch_4op) {
    channel.pair.f_num = channel.f_num;
    channel.pair.ksv = channel.ksv;
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[0]);
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[1]);
  }
}

function OPL3_ChannelWriteB0(channel: Channel, data: number): void {
  if (channel.chip.newm && channel.chtype === ch_4op2) {
    return;
  }
  channel.f_num = (channel.f_num & 0xff) | ((data & 0x03) << 8);
  channel.block = (data >> 2) & 0x07;
  channel.ksv = ((channel.block << 1)
    | ((channel.f_num >> (0x09 - channel.chip.nts)) & 0x01)) & 0xff;
  OPL3_EnvelopeUpdateKSL(channel.slotz[0]);
  OPL3_EnvelopeUpdateKSL(channel.slotz[1]);
  if (channel.chip.newm && channel.chtype === ch_4op) {
    channel.pair.f_num = channel.f_num;
    channel.pair.block = channel.block;
    channel.pair.ksv = channel.ksv;
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[0]);
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[1]);
  }
}

function OPL3_ChannelSetupAlg(channel: Channel): void {
  const chip = channel.chip;
  if (channel.chtype === ch_drum) {
    if (channel.ch_num === 7 || channel.ch_num === 8) {
      channel.slotz[0].mod = { o: chip, k: 'zeromod' };
      channel.slotz[1].mod = { o: chip, k: 'zeromod' };
      return;
    }
    switch (channel.alg & 0x01) {
      case 0x00:
        channel.slotz[0].mod = { o: channel.slotz[0], k: 'fbmod' };
        channel.slotz[1].mod = { o: channel.slotz[0], k: 'out' };
        break;
      case 0x01:
        channel.slotz[0].mod = { o: channel.slotz[0], k: 'fbmod' };
        channel.slotz[1].mod = { o: chip, k: 'zeromod' };
        break;
    }
    return;
  }
  if (channel.alg & 0x08) {
    return;
  }
  if (channel.alg & 0x04) {
    channel.pair.out[0] = { o: chip, k: 'zeromod' };
    channel.pair.out[1] = { o: chip, k: 'zeromod' };
    channel.pair.out[2] = { o: chip, k: 'zeromod' };
    channel.pair.out[3] = { o: chip, k: 'zeromod' };
    switch (channel.alg & 0x03) {
      case 0x00:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: 'fbmod' };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: 'out' };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: 'out' };
        channel.slotz[1].mod = { o: channel.slotz[0], k: 'out' };
        channel.out[0] = { o: channel.slotz[1], k: 'out' };
        channel.out[1] = { o: chip, k: 'zeromod' };
        channel.out[2] = { o: chip, k: 'zeromod' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
      case 0x01:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: 'fbmod' };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: 'out' };
        channel.slotz[0].mod = { o: chip, k: 'zeromod' };
        channel.slotz[1].mod = { o: channel.slotz[0], k: 'out' };
        channel.out[0] = { o: channel.pair.slotz[1], k: 'out' };
        channel.out[1] = { o: channel.slotz[1], k: 'out' };
        channel.out[2] = { o: chip, k: 'zeromod' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
      case 0x02:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: 'fbmod' };
        channel.pair.slotz[1].mod = { o: chip, k: 'zeromod' };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: 'out' };
        channel.slotz[1].mod = { o: channel.slotz[0], k: 'out' };
        channel.out[0] = { o: channel.pair.slotz[0], k: 'out' };
        channel.out[1] = { o: channel.slotz[1], k: 'out' };
        channel.out[2] = { o: chip, k: 'zeromod' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
      case 0x03:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: 'fbmod' };
        channel.pair.slotz[1].mod = { o: chip, k: 'zeromod' };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: 'out' };
        channel.slotz[1].mod = { o: chip, k: 'zeromod' };
        channel.out[0] = { o: channel.pair.slotz[0], k: 'out' };
        channel.out[1] = { o: channel.slotz[0], k: 'out' };
        channel.out[2] = { o: channel.slotz[1], k: 'out' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
    }
  } else {
    switch (channel.alg & 0x01) {
      case 0x00:
        channel.slotz[0].mod = { o: channel.slotz[0], k: 'fbmod' };
        channel.slotz[1].mod = { o: channel.slotz[0], k: 'out' };
        channel.out[0] = { o: channel.slotz[1], k: 'out' };
        channel.out[1] = { o: chip, k: 'zeromod' };
        channel.out[2] = { o: chip, k: 'zeromod' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
      case 0x01:
        channel.slotz[0].mod = { o: channel.slotz[0], k: 'fbmod' };
        channel.slotz[1].mod = { o: chip, k: 'zeromod' };
        channel.out[0] = { o: channel.slotz[0], k: 'out' };
        channel.out[1] = { o: channel.slotz[1], k: 'out' };
        channel.out[2] = { o: chip, k: 'zeromod' };
        channel.out[3] = { o: chip, k: 'zeromod' };
        break;
    }
  }
}

function OPL3_ChannelUpdateAlg(channel: Channel): void {
  channel.alg = channel.con;
  if (channel.chip.newm) {
    if (channel.chtype === ch_4op) {
      channel.pair.alg = 0x04 | (channel.con << 1) | (channel.pair.con);
      channel.alg = 0x08;
      OPL3_ChannelSetupAlg(channel.pair);
    } else if (channel.chtype === ch_4op2) {
      channel.alg = 0x04 | (channel.pair.con << 1) | (channel.con);
      channel.pair.alg = 0x08;
      OPL3_ChannelSetupAlg(channel);
    } else {
      OPL3_ChannelSetupAlg(channel);
    }
  } else {
    OPL3_ChannelSetupAlg(channel);
  }
}

function OPL3_ChannelWriteC0(channel: Channel, data: number): void {
  channel.fb = (data & 0x0e) >> 1;
  channel.con = data & 0x01;
  OPL3_ChannelUpdateAlg(channel);
  if (channel.chip.newm) {
    channel.cha = ((data >> 4) & 0x01) ? 0xffff : 0;
    channel.chb = ((data >> 5) & 0x01) ? 0xffff : 0;
    channel.chc = ((data >> 6) & 0x01) ? 0xffff : 0;
    channel.chd = ((data >> 7) & 0x01) ? 0xffff : 0;
  } else {
    channel.cha = channel.chb = 0xffff;
    channel.chc = channel.chd = 0;
  }
}

function OPL3_ChannelKeyOn(channel: Channel): void {
  if (channel.chip.newm) {
    if (channel.chtype === ch_4op) {
      OPL3_EnvelopeKeyOn(channel.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOn(channel.slotz[1], egk_norm);
      OPL3_EnvelopeKeyOn(channel.pair.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOn(channel.pair.slotz[1], egk_norm);
    } else if (channel.chtype === ch_2op || channel.chtype === ch_drum) {
      OPL3_EnvelopeKeyOn(channel.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOn(channel.slotz[1], egk_norm);
    }
  } else {
    OPL3_EnvelopeKeyOn(channel.slotz[0], egk_norm);
    OPL3_EnvelopeKeyOn(channel.slotz[1], egk_norm);
  }
}

function OPL3_ChannelKeyOff(channel: Channel): void {
  if (channel.chip.newm) {
    if (channel.chtype === ch_4op) {
      OPL3_EnvelopeKeyOff(channel.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOff(channel.slotz[1], egk_norm);
      OPL3_EnvelopeKeyOff(channel.pair.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOff(channel.pair.slotz[1], egk_norm);
    } else if (channel.chtype === ch_2op || channel.chtype === ch_drum) {
      OPL3_EnvelopeKeyOff(channel.slotz[0], egk_norm);
      OPL3_EnvelopeKeyOff(channel.slotz[1], egk_norm);
    }
  } else {
    OPL3_EnvelopeKeyOff(channel.slotz[0], egk_norm);
    OPL3_EnvelopeKeyOff(channel.slotz[1], egk_norm);
  }
}

function OPL3_ChannelSet4Op(chip: Chip, data: number): void {
  for (let bit = 0; bit < 6; bit++) {
    let chnum = bit;
    if (bit >= 3) {
      chnum += 9 - 3;
    }
    if ((data >> bit) & 0x01) {
      chip.channel[chnum].chtype = ch_4op;
      chip.channel[chnum + 3].chtype = ch_4op2;
      OPL3_ChannelUpdateAlg(chip.channel[chnum]);
    } else {
      chip.channel[chnum].chtype = ch_2op;
      chip.channel[chnum + 3].chtype = ch_2op;
      OPL3_ChannelUpdateAlg(chip.channel[chnum]);
      OPL3_ChannelUpdateAlg(chip.channel[chnum + 3]);
    }
  }
}

function OPL3_ClipSample(sample: number): number {
  if (sample > 32767) {
    sample = 32767;
  } else if (sample < -32768) {
    sample = -32768;
  }
  return sample | 0;
}

function OPL3_ProcessSlot(slot: Slot): void {
  OPL3_SlotCalcFB(slot);
  OPL3_EnvelopeCalc(slot);
  OPL3_PhaseGenerate(slot);
  OPL3_SlotGenerate(slot);
}

// OPL_QUIRK_CHANNELSAMPLEDELAY is ON (STEREOEXT off).
function OPL3_Generate4Ch(chip: Chip, buf4: number[]): void {
  const mix = [0, 0];

  buf4[1] = OPL3_ClipSample(chip.mixbuff[1]);
  buf4[3] = OPL3_ClipSample(chip.mixbuff[3]);

  for (let ii = 0; ii < 15; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }

  mix[0] = mix[1] = 0;
  for (let ii = 0; ii < 18; ii++) {
    const channel = chip.channel[ii];
    const out = channel.out;
    const accm = i16(rd(out[0]) + rd(out[1]) + rd(out[2]) + rd(out[3]));
    mix[0] += i16(accm & channel.cha);
    mix[1] += i16(accm & channel.chc);
  }
  chip.mixbuff[0] = mix[0] | 0;
  chip.mixbuff[2] = mix[1] | 0;

  for (let ii = 15; ii < 18; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }

  buf4[0] = OPL3_ClipSample(chip.mixbuff[0]);
  buf4[2] = OPL3_ClipSample(chip.mixbuff[2]);

  for (let ii = 18; ii < 33; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }

  mix[0] = mix[1] = 0;
  for (let ii = 0; ii < 18; ii++) {
    const channel = chip.channel[ii];
    const out = channel.out;
    const accm = i16(rd(out[0]) + rd(out[1]) + rd(out[2]) + rd(out[3]));
    mix[0] += i16(accm & channel.chb);
    mix[1] += i16(accm & channel.chd);
  }
  chip.mixbuff[1] = mix[0] | 0;
  chip.mixbuff[3] = mix[1] | 0;

  for (let ii = 33; ii < 36; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }

  if ((chip.timer & 0x3f) === 0x3f) {
    chip.tremolopos = (chip.tremolopos + 1) % 210;
  }
  if (chip.tremolopos < 105) {
    chip.tremolo = chip.tremolopos >> chip.tremoloshift;
  } else {
    chip.tremolo = (210 - chip.tremolopos) >> chip.tremoloshift;
  }

  if ((chip.timer & 0x3ff) === 0x3ff) {
    chip.vibpos = (chip.vibpos + 1) & 7;
  }

  chip.timer = (chip.timer + 1) & 0xffff;

  if (chip.eg_state) {
    let shift = 0;
    while (shift < 13 && Math.floor(chip.eg_timer / Math.pow(2, shift)) % 2 === 0) {
      shift++;
    }
    if (shift > 12) {
      chip.eg_add = 0;
    } else {
      chip.eg_add = shift + 1;
    }
    chip.eg_timer_lo = chip.eg_timer % 4;
  }

  if (chip.eg_timerrem || chip.eg_state) {
    if (chip.eg_timer === 0xfffffffff) {
      chip.eg_timer = 0;
      chip.eg_timerrem = 1;
    } else {
      chip.eg_timer = chip.eg_timer + 1;
      chip.eg_timerrem = 0;
    }
  }

  chip.eg_state ^= 1;
}

function OPL3_Generate4ChResampled(chip: Chip, buf4: number[]): void {
  while (chip.samplecnt >= chip.rateratio) {
    chip.oldsamples[0] = chip.samples[0];
    chip.oldsamples[1] = chip.samples[1];
    chip.oldsamples[2] = chip.samples[2];
    chip.oldsamples[3] = chip.samples[3];
    OPL3_Generate4Ch(chip, chip.samples);
    chip.samplecnt -= chip.rateratio;
  }
  buf4[0] = i16(Math.trunc((chip.oldsamples[0] * (chip.rateratio - chip.samplecnt)
    + chip.samples[0] * chip.samplecnt) / chip.rateratio));
  buf4[1] = i16(Math.trunc((chip.oldsamples[1] * (chip.rateratio - chip.samplecnt)
    + chip.samples[1] * chip.samplecnt) / chip.rateratio));
  buf4[2] = i16(Math.trunc((chip.oldsamples[2] * (chip.rateratio - chip.samplecnt)
    + chip.samples[2] * chip.samplecnt) / chip.rateratio));
  buf4[3] = i16(Math.trunc((chip.oldsamples[3] * (chip.rateratio - chip.samplecnt)
    + chip.samples[3] * chip.samplecnt) / chip.rateratio));
  chip.samplecnt += 1 << RSM_FRAC;
}

function OPL3_Reset(chip: Chip, samplerate: number): void {
  chip.channel = [];
  chip.slot = [];
  for (let i = 0; i < 36; i++) {
    chip.slot.push(new Slot());
  }
  for (let i = 0; i < 18; i++) {
    chip.channel.push(new Channel());
  }
  chip.timer = 0;
  chip.eg_timer = 0;
  chip.eg_timerrem = 0;
  chip.eg_state = 0;
  chip.eg_add = 0;
  chip.eg_timer_lo = 0;
  chip.newm = 0;
  chip.nts = 0;
  chip.rhy = 0;
  chip.vibpos = 0;
  chip.tremolo = 0;
  chip.tremolopos = 0;
  chip.zeromod = 0;
  chip.mixbuff = [0, 0, 0, 0];
  chip.rm_hh_bit2 = chip.rm_hh_bit3 = chip.rm_hh_bit7 = chip.rm_hh_bit8 = 0;
  chip.rm_tc_bit3 = chip.rm_tc_bit5 = 0;
  chip.samplecnt = 0;
  chip.oldsamples = [0, 0, 0, 0];
  chip.samples = [0, 0, 0, 0];

  for (let slotnum = 0; slotnum < 36; slotnum++) {
    const slot = chip.slot[slotnum];
    slot.chip = chip;
    slot.mod = { o: chip, k: 'zeromod' };
    slot.eg_rout = 0x1ff;
    slot.eg_out = 0x1ff;
    slot.eg_gen = envelope_gen_num_release;
    slot.trem = { o: chip, k: 'zeromod' };
    slot.slot_num = slotnum;
  }
  for (let channum = 0; channum < 18; channum++) {
    const channel = chip.channel[channum];
    const local_ch_slot = ch_slot[channum];
    channel.slotz[0] = chip.slot[local_ch_slot];
    channel.slotz[1] = chip.slot[local_ch_slot + 3];
    chip.slot[local_ch_slot].channel = channel;
    chip.slot[local_ch_slot + 3].channel = channel;
    if ((channum % 9) < 3) {
      channel.pair = chip.channel[channum + 3];
    } else if ((channum % 9) < 6) {
      channel.pair = chip.channel[channum - 3];
    }
    channel.chip = chip;
    channel.out[0] = { o: chip, k: 'zeromod' };
    channel.out[1] = { o: chip, k: 'zeromod' };
    channel.out[2] = { o: chip, k: 'zeromod' };
    channel.out[3] = { o: chip, k: 'zeromod' };
    channel.chtype = ch_2op;
    channel.cha = 0xffff;
    channel.chb = 0xffff;
    channel.ch_num = channum;
    OPL3_ChannelSetupAlg(channel);
  }
  chip.noise = 1;
  chip.rateratio = Math.floor((samplerate * (1 << RSM_FRAC)) / 49716);
  chip.tremoloshift = 4;
  chip.vibshift = 1;
}

function OPL3_WriteReg(chip: Chip, reg: number, v: number): void {
  const high = (reg >> 8) & 0x01;
  const regm = reg & 0xff;
  switch (regm & 0xf0) {
    case 0x00:
      if (high) {
        switch (regm & 0x0f) {
          case 0x04:
            OPL3_ChannelSet4Op(chip, v);
            break;
          case 0x05:
            chip.newm = v & 0x01;
            break;
        }
      } else {
        switch (regm & 0x0f) {
          case 0x08:
            chip.nts = (v >> 6) & 0x01;
            break;
        }
      }
      break;
    case 0x20:
    case 0x30:
      if (ad_slot[regm & 0x1f] >= 0) {
        OPL3_SlotWrite20(chip.slot[18 * high + ad_slot[regm & 0x1f]], v);
      }
      break;
    case 0x40:
    case 0x50:
      if (ad_slot[regm & 0x1f] >= 0) {
        OPL3_SlotWrite40(chip.slot[18 * high + ad_slot[regm & 0x1f]], v);
      }
      break;
    case 0x60:
    case 0x70:
      if (ad_slot[regm & 0x1f] >= 0) {
        OPL3_SlotWrite60(chip.slot[18 * high + ad_slot[regm & 0x1f]], v);
      }
      break;
    case 0x80:
    case 0x90:
      if (ad_slot[regm & 0x1f] >= 0) {
        OPL3_SlotWrite80(chip.slot[18 * high + ad_slot[regm & 0x1f]], v);
      }
      break;
    case 0xe0:
    case 0xf0:
      if (ad_slot[regm & 0x1f] >= 0) {
        OPL3_SlotWriteE0(chip.slot[18 * high + ad_slot[regm & 0x1f]], v);
      }
      break;
    case 0xa0:
      if ((regm & 0x0f) < 9) {
        OPL3_ChannelWriteA0(chip.channel[9 * high + (regm & 0x0f)], v);
      }
      break;
    case 0xb0:
      if (regm === 0xbd && !high) {
        chip.tremoloshift = (((v >> 7) ^ 1) << 1) + 2;
        chip.vibshift = ((v >> 6) & 0x01) ^ 1;
        OPL3_ChannelUpdateRhythm(chip, v);
      } else if ((regm & 0x0f) < 9) {
        OPL3_ChannelWriteB0(chip.channel[9 * high + (regm & 0x0f)], v);
        if (v & 0x20) {
          OPL3_ChannelKeyOn(chip.channel[9 * high + (regm & 0x0f)]);
        } else {
          OPL3_ChannelKeyOff(chip.channel[9 * high + (regm & 0x0f)]);
        }
      }
      break;
    case 0xc0:
      if ((regm & 0x0f) < 9) {
        OPL3_ChannelWriteC0(chip.channel[9 * high + (regm & 0x0f)], v);
      }
      break;
  }
}

// Drop-in replacement for the OPL2 class in src/opl2.ts. Same public surface:
// constructor(outputRate), write(reg, val), generate(out), and the `capture`
// hook used by the offline oplcap tool.
export class OPL3 {
  private chip = new Chip();
  private buf4 = [0, 0, 0, 0];
  // Optional register-write capture for the offline reference-comparison tool.
  // Null in normal use (zero overhead). Each entry: output-sample time, reg, val.
  capture: { t: number; reg: number; val: number }[] | null = null;
  private sampleClock = 0;

  constructor(outputRate: number) {
    OPL3_Reset(this.chip, outputRate);
  }

  /** Write one OPL register. 0x100+ addresses the second bank (voices 9..17). */
  write(reg: number, val: number): void {
    if (this.capture) this.capture.push({ t: this.sampleClock, reg, val });
    OPL3_WriteReg(this.chip, reg & 0x1ff, val & 0xff);
  }

  /** Fill a mono Float32 buffer at the output rate, using the LEFT channel. */
  generate(out: Float32Array): void {
    for (let i = 0; i < out.length; i++) {
      this.sampleClock++;
      OPL3_Generate4ChResampled(this.chip, this.buf4);
      const s = this.buf4[0] / 32768; // left channel, int16 -> float
      out[i] = s < -1 ? -1 : s > 1 ? 1 : s;
    }
  }
}
