// tools/oplcap.ts
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

// src/opl3.ts
var RSM_FRAC = 10;
var ch_2op = 0;
var ch_4op = 1;
var ch_4op2 = 2;
var ch_drum = 3;
var egk_norm = 1;
var egk_drum = 2;
var envelope_gen_num_attack = 0;
var envelope_gen_num_decay = 1;
var envelope_gen_num_sustain = 2;
var envelope_gen_num_release = 3;
var logsinrom = new Uint16Array([
  2137,
  1731,
  1543,
  1419,
  1326,
  1252,
  1190,
  1137,
  1091,
  1050,
  1013,
  979,
  949,
  920,
  894,
  869,
  846,
  825,
  804,
  785,
  767,
  749,
  732,
  717,
  701,
  687,
  672,
  659,
  646,
  633,
  621,
  609,
  598,
  587,
  576,
  566,
  556,
  546,
  536,
  527,
  518,
  509,
  501,
  492,
  484,
  476,
  468,
  461,
  453,
  446,
  439,
  432,
  425,
  418,
  411,
  405,
  399,
  392,
  386,
  380,
  375,
  369,
  363,
  358,
  352,
  347,
  341,
  336,
  331,
  326,
  321,
  316,
  311,
  307,
  302,
  297,
  293,
  289,
  284,
  280,
  276,
  271,
  267,
  263,
  259,
  255,
  251,
  248,
  244,
  240,
  236,
  233,
  229,
  226,
  222,
  219,
  215,
  212,
  209,
  205,
  202,
  199,
  196,
  193,
  190,
  187,
  184,
  181,
  178,
  175,
  172,
  169,
  167,
  164,
  161,
  159,
  156,
  153,
  151,
  148,
  146,
  143,
  141,
  138,
  136,
  134,
  131,
  129,
  127,
  125,
  122,
  120,
  118,
  116,
  114,
  112,
  110,
  108,
  106,
  104,
  102,
  100,
  98,
  96,
  94,
  92,
  91,
  89,
  87,
  85,
  83,
  82,
  80,
  78,
  77,
  75,
  74,
  72,
  70,
  69,
  67,
  66,
  64,
  63,
  62,
  60,
  59,
  57,
  56,
  55,
  53,
  52,
  51,
  49,
  48,
  47,
  46,
  45,
  43,
  42,
  41,
  40,
  39,
  38,
  37,
  36,
  35,
  34,
  33,
  32,
  31,
  30,
  29,
  28,
  27,
  26,
  25,
  24,
  23,
  23,
  22,
  21,
  20,
  20,
  19,
  18,
  17,
  17,
  16,
  15,
  15,
  14,
  13,
  13,
  12,
  12,
  11,
  10,
  10,
  9,
  9,
  8,
  8,
  7,
  7,
  7,
  6,
  6,
  5,
  5,
  5,
  4,
  4,
  4,
  3,
  3,
  3,
  2,
  2,
  2,
  2,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0
]);
var exprom = new Uint16Array([
  2042,
  2037,
  2031,
  2026,
  2020,
  2015,
  2010,
  2004,
  1999,
  1993,
  1988,
  1983,
  1977,
  1972,
  1966,
  1961,
  1956,
  1951,
  1945,
  1940,
  1935,
  1930,
  1924,
  1919,
  1914,
  1909,
  1904,
  1898,
  1893,
  1888,
  1883,
  1878,
  1873,
  1868,
  1863,
  1858,
  1853,
  1848,
  1843,
  1838,
  1833,
  1828,
  1823,
  1818,
  1813,
  1808,
  1803,
  1798,
  1794,
  1789,
  1784,
  1779,
  1774,
  1769,
  1765,
  1760,
  1755,
  1750,
  1746,
  1741,
  1736,
  1732,
  1727,
  1722,
  1717,
  1713,
  1708,
  1704,
  1699,
  1694,
  1690,
  1685,
  1681,
  1676,
  1672,
  1667,
  1663,
  1658,
  1654,
  1649,
  1645,
  1640,
  1636,
  1631,
  1627,
  1623,
  1618,
  1614,
  1609,
  1605,
  1601,
  1596,
  1592,
  1588,
  1584,
  1579,
  1575,
  1571,
  1566,
  1562,
  1558,
  1554,
  1550,
  1545,
  1541,
  1537,
  1533,
  1529,
  1525,
  1520,
  1516,
  1512,
  1508,
  1504,
  1500,
  1496,
  1492,
  1488,
  1484,
  1480,
  1476,
  1472,
  1468,
  1464,
  1460,
  1456,
  1452,
  1448,
  1444,
  1440,
  1436,
  1433,
  1429,
  1425,
  1421,
  1417,
  1413,
  1409,
  1406,
  1402,
  1398,
  1394,
  1391,
  1387,
  1383,
  1379,
  1376,
  1372,
  1368,
  1364,
  1361,
  1357,
  1353,
  1350,
  1346,
  1342,
  1339,
  1335,
  1332,
  1328,
  1324,
  1321,
  1317,
  1314,
  1310,
  1307,
  1303,
  1300,
  1296,
  1292,
  1289,
  1286,
  1282,
  1279,
  1275,
  1272,
  1268,
  1265,
  1261,
  1258,
  1255,
  1251,
  1248,
  1244,
  1241,
  1238,
  1234,
  1231,
  1228,
  1224,
  1221,
  1218,
  1214,
  1211,
  1208,
  1205,
  1201,
  1198,
  1195,
  1192,
  1188,
  1185,
  1182,
  1179,
  1176,
  1172,
  1169,
  1166,
  1163,
  1160,
  1157,
  1154,
  1150,
  1147,
  1144,
  1141,
  1138,
  1135,
  1132,
  1129,
  1126,
  1123,
  1120,
  1117,
  1114,
  1111,
  1108,
  1105,
  1102,
  1099,
  1096,
  1093,
  1090,
  1087,
  1084,
  1081,
  1078,
  1075,
  1072,
  1069,
  1066,
  1064,
  1061,
  1058,
  1055,
  1052,
  1049,
  1046,
  1044,
  1041,
  1038,
  1035,
  1032,
  1030,
  1027,
  1024
]);
var mt = new Uint8Array([
  1,
  2,
  4,
  6,
  8,
  10,
  12,
  14,
  16,
  18,
  20,
  20,
  24,
  24,
  30,
  30
]);
var kslrom = new Uint8Array([
  0,
  32,
  40,
  45,
  48,
  51,
  53,
  55,
  56,
  58,
  59,
  60,
  61,
  62,
  63,
  64
]);
var kslshift = new Uint8Array([8, 1, 2, 0]);
var eg_incstep = [
  new Uint8Array([0, 0, 0, 0]),
  new Uint8Array([1, 0, 0, 0]),
  new Uint8Array([1, 0, 1, 0]),
  new Uint8Array([1, 1, 1, 0])
];
var ad_slot = new Int8Array([
  0,
  1,
  2,
  3,
  4,
  5,
  -1,
  -1,
  6,
  7,
  8,
  9,
  10,
  11,
  -1,
  -1,
  12,
  13,
  14,
  15,
  16,
  17,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1,
  -1
]);
var ch_slot = new Uint8Array([
  0,
  1,
  2,
  6,
  7,
  8,
  12,
  13,
  14,
  18,
  19,
  20,
  24,
  25,
  26,
  30,
  31,
  32
]);
function i16(x) {
  return x << 16 >> 16;
}
var Slot = class {
  channel = null;
  chip = null;
  out = 0;
  // int16
  fbmod = 0;
  // int16
  mod = null;
  // int16*
  prout = 0;
  // int16
  eg_rout = 0;
  // uint16
  eg_out = 0;
  // uint16
  eg_inc = 0;
  // uint8 (unused in DSP path)
  eg_gen = 0;
  // uint8
  eg_rate = 0;
  // uint8 (unused in DSP path)
  eg_ksl = 0;
  // uint8
  trem = null;
  // uint8*
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
  key = 0;
  // uint8
  pg_reset = 0;
  // uint32 (0/1)
  pg_phase = 0;
  // uint32
  pg_phase_out = 0;
  // uint16
  slot_num = 0;
};
var Channel = class {
  slotz = [null, null];
  pair = null;
  chip = null;
  out = [null, null, null, null];
  chtype = 0;
  f_num = 0;
  // uint16
  block = 0;
  // uint8
  fb = 0;
  // uint8
  con = 0;
  // uint8
  alg = 0;
  // uint8
  ksv = 0;
  // uint8
  cha = 0;
  // uint16
  chb = 0;
  // uint16
  chc = 0;
  // uint16
  chd = 0;
  // uint16
  ch_num = 0;
  // uint8
};
var Chip = class {
  channel = [];
  slot = [];
  timer = 0;
  // uint16
  eg_timer = 0;
  // uint64 (JS number, < 2^53)
  eg_timerrem = 0;
  // uint8
  eg_state = 0;
  // uint8
  eg_add = 0;
  // uint8
  eg_timer_lo = 0;
  // uint8
  newm = 0;
  // uint8
  nts = 0;
  // uint8
  rhy = 0;
  // uint8
  vibpos = 0;
  // uint8
  vibshift = 0;
  // uint8
  tremolo = 0;
  // uint8
  tremolopos = 0;
  // uint8
  tremoloshift = 0;
  // uint8
  noise = 0;
  // uint32
  zeromod = 0;
  // int16 (always 0)
  mixbuff = [0, 0, 0, 0];
  // int32[4]
  rm_hh_bit2 = 0;
  rm_hh_bit3 = 0;
  rm_hh_bit7 = 0;
  rm_hh_bit8 = 0;
  rm_tc_bit3 = 0;
  rm_tc_bit5 = 0;
  rateratio = 0;
  // int32
  samplecnt = 0;
  // int32
  oldsamples = [0, 0, 0, 0];
  // int16[4]
  samples = [0, 0, 0, 0];
  // int16[4]
};
function rd(p) {
  return p.o[p.k];
}
function OPL3_EnvelopeCalcExp(level) {
  if (level > 8191) {
    level = 8191;
  }
  return exprom[level & 255] << 1 >> (level >> 8);
}
function OPL3_EnvelopeCalcSin0(phase, envelope) {
  let out2 = 0;
  let neg = 0;
  phase &= 1023;
  if (phase & 512) {
    neg = 65535;
  }
  if (phase & 256) {
    out2 = logsinrom[phase & 255 ^ 255];
  } else {
    out2 = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)) ^ neg);
}
function OPL3_EnvelopeCalcSin1(phase, envelope) {
  let out2 = 0;
  phase &= 1023;
  if (phase & 512) {
    out2 = 4096;
  } else if (phase & 256) {
    out2 = logsinrom[phase & 255 ^ 255];
  } else {
    out2 = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin2(phase, envelope) {
  let out2 = 0;
  phase &= 1023;
  if (phase & 256) {
    out2 = logsinrom[phase & 255 ^ 255];
  } else {
    out2 = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin3(phase, envelope) {
  let out2 = 0;
  phase &= 1023;
  if (phase & 256) {
    out2 = 4096;
  } else {
    out2 = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin4(phase, envelope) {
  let out2 = 0;
  let neg = 0;
  phase &= 1023;
  if ((phase & 768) === 256) {
    neg = 65535;
  }
  if (phase & 512) {
    out2 = 4096;
  } else if (phase & 128) {
    out2 = logsinrom[(phase ^ 255) << 1 & 255];
  } else {
    out2 = logsinrom[phase << 1 & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)) ^ neg);
}
function OPL3_EnvelopeCalcSin5(phase, envelope) {
  let out2 = 0;
  phase &= 1023;
  if (phase & 512) {
    out2 = 4096;
  } else if (phase & 128) {
    out2 = logsinrom[(phase ^ 255) << 1 & 255];
  } else {
    out2 = logsinrom[phase << 1 & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin6(phase, envelope) {
  let neg = 0;
  phase &= 1023;
  if (phase & 512) {
    neg = 65535;
  }
  return i16(OPL3_EnvelopeCalcExp(envelope << 3) ^ neg);
}
function OPL3_EnvelopeCalcSin7(phase, envelope) {
  let out2 = 0;
  let neg = 0;
  phase &= 1023;
  if (phase & 512) {
    neg = 65535;
    phase = phase & 511 ^ 511;
  }
  out2 = phase << 3;
  return i16(OPL3_EnvelopeCalcExp(out2 + (envelope << 3)) ^ neg);
}
var envelope_sin = [
  OPL3_EnvelopeCalcSin0,
  OPL3_EnvelopeCalcSin1,
  OPL3_EnvelopeCalcSin2,
  OPL3_EnvelopeCalcSin3,
  OPL3_EnvelopeCalcSin4,
  OPL3_EnvelopeCalcSin5,
  OPL3_EnvelopeCalcSin6,
  OPL3_EnvelopeCalcSin7
];
function OPL3_EnvelopeUpdateKSL(slot) {
  let ksl = (kslrom[slot.channel.f_num >> 6] << 2) - (8 - slot.channel.block << 5);
  if (ksl < 0) {
    ksl = 0;
  }
  slot.eg_ksl = ksl & 255;
}
function OPL3_EnvelopeCalc(slot) {
  let reg_rate = 0;
  let reset = 0;
  slot.eg_out = slot.eg_rout + (slot.reg_tl << 2) + (slot.eg_ksl >> kslshift[slot.reg_ksl]) + rd(slot.trem) & 65535;
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
  const nonzero = reg_rate !== 0 ? 1 : 0;
  const rate = ks + (reg_rate << 2) & 255;
  let rate_hi = rate >> 2;
  const rate_lo = rate & 3;
  if (rate_hi & 16) {
    rate_hi = 15;
  }
  const eg_shift = rate_hi + slot.chip.eg_add & 255;
  let shift = 0;
  if (nonzero) {
    if (rate_hi < 12) {
      if (slot.chip.eg_state) {
        switch (eg_shift) {
          case 12:
            shift = 1;
            break;
          case 13:
            shift = rate_lo >> 1 & 1;
            break;
          case 14:
            shift = rate_lo & 1;
            break;
          default:
            break;
        }
      }
    } else {
      shift = (rate_hi & 3) + eg_incstep[rate_lo][slot.chip.eg_timer_lo] & 255;
      if (shift & 4) {
        shift = 3;
      }
      if (!shift) {
        shift = slot.chip.eg_state;
      }
    }
  }
  let eg_rout = slot.eg_rout;
  let eg_inc = 0;
  let eg_off = 0;
  if (reset && rate_hi === 15) {
    eg_rout = 0;
  }
  if ((slot.eg_rout & 504) === 504) {
    eg_off = 1;
  }
  if (slot.eg_gen !== envelope_gen_num_attack && !reset && eg_off) {
    eg_rout = 511;
  }
  switch (slot.eg_gen) {
    case envelope_gen_num_attack:
      if (!slot.eg_rout) {
        slot.eg_gen = envelope_gen_num_decay;
      } else if (slot.key && shift > 0 && rate_hi !== 15) {
        eg_inc = ~slot.eg_rout >> 4 - shift;
      }
      break;
    case envelope_gen_num_decay:
      if (slot.eg_rout >> 4 === slot.reg_sl) {
        slot.eg_gen = envelope_gen_num_sustain;
      } else if (!eg_off && !reset && shift > 0) {
        eg_inc = 1 << shift - 1;
      }
      break;
    case envelope_gen_num_sustain:
    case envelope_gen_num_release:
      if (!eg_off && !reset && shift > 0) {
        eg_inc = 1 << shift - 1;
      }
      break;
  }
  slot.eg_rout = eg_rout + eg_inc & 511;
  if (reset) {
    slot.eg_gen = envelope_gen_num_attack;
  }
  if (!slot.key) {
    slot.eg_gen = envelope_gen_num_release;
  }
}
function OPL3_EnvelopeKeyOn(slot, type) {
  slot.key |= type;
}
function OPL3_EnvelopeKeyOff(slot, type) {
  slot.key &= ~type;
}
function OPL3_PhaseGenerate(slot) {
  const chip = slot.chip;
  let f_num = slot.channel.f_num;
  if (slot.reg_vib) {
    let range = f_num >> 7 & 7;
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
    f_num = f_num + range & 65535;
  }
  const basefreq = f_num << slot.channel.block >>> 1 >>> 0;
  const phase = slot.pg_phase >>> 9 & 65535;
  if (slot.pg_reset) {
    slot.pg_phase = 0;
  }
  slot.pg_phase = slot.pg_phase + (basefreq * mt[slot.reg_mult] >>> 1 >>> 0) >>> 0;
  const noise = chip.noise;
  slot.pg_phase_out = phase;
  if (slot.slot_num === 13) {
    chip.rm_hh_bit2 = phase >> 2 & 1;
    chip.rm_hh_bit3 = phase >> 3 & 1;
    chip.rm_hh_bit7 = phase >> 7 & 1;
    chip.rm_hh_bit8 = phase >> 8 & 1;
  }
  if (slot.slot_num === 17 && chip.rhy & 32) {
    chip.rm_tc_bit3 = phase >> 3 & 1;
    chip.rm_tc_bit5 = phase >> 5 & 1;
  }
  if (chip.rhy & 32) {
    const rm_xor = chip.rm_hh_bit2 ^ chip.rm_hh_bit7 | chip.rm_hh_bit3 ^ chip.rm_tc_bit5 | chip.rm_tc_bit3 ^ chip.rm_tc_bit5;
    switch (slot.slot_num) {
      case 13:
        slot.pg_phase_out = rm_xor << 9 & 65535;
        if (rm_xor ^ noise & 1) {
          slot.pg_phase_out |= 208;
        } else {
          slot.pg_phase_out |= 52;
        }
        break;
      case 16:
        slot.pg_phase_out = (chip.rm_hh_bit8 << 9 | (chip.rm_hh_bit8 ^ noise & 1) << 8) & 65535;
        break;
      case 17:
        slot.pg_phase_out = (rm_xor << 9 | 128) & 65535;
        break;
      default:
        break;
    }
  }
  const n_bit = (noise >>> 14 ^ noise) & 1;
  chip.noise = (noise >>> 1 | n_bit << 22) >>> 0;
}
function OPL3_SlotWrite20(slot, data) {
  if (data >> 7 & 1) {
    slot.trem = { o: slot.chip, k: "tremolo" };
  } else {
    slot.trem = { o: slot.chip, k: "zeromod" };
  }
  slot.reg_vib = data >> 6 & 1;
  slot.reg_type = data >> 5 & 1;
  slot.reg_ksr = data >> 4 & 1;
  slot.reg_mult = data & 15;
}
function OPL3_SlotWrite40(slot, data) {
  slot.reg_ksl = data >> 6 & 3;
  slot.reg_tl = data & 63;
  OPL3_EnvelopeUpdateKSL(slot);
}
function OPL3_SlotWrite60(slot, data) {
  slot.reg_ar = data >> 4 & 15;
  slot.reg_dr = data & 15;
}
function OPL3_SlotWrite80(slot, data) {
  slot.reg_sl = data >> 4 & 15;
  if (slot.reg_sl === 15) {
    slot.reg_sl = 31;
  }
  slot.reg_rr = data & 15;
}
function OPL3_SlotWriteE0(slot, data) {
  slot.reg_wf = data & 7;
  if (slot.chip.newm === 0) {
    slot.reg_wf &= 3;
  }
}
function OPL3_SlotGenerate(slot) {
  slot.out = envelope_sin[slot.reg_wf](slot.pg_phase_out + rd(slot.mod), slot.eg_out);
}
function OPL3_SlotCalcFB(slot) {
  if (slot.channel.fb !== 0) {
    slot.fbmod = i16(slot.prout + slot.out >> 9 - slot.channel.fb);
  } else {
    slot.fbmod = 0;
  }
  slot.prout = slot.out;
}
function OPL3_ChannelUpdateRhythm(chip, data) {
  chip.rhy = data & 63;
  if (chip.rhy & 32) {
    const channel6 = chip.channel[6];
    const channel7 = chip.channel[7];
    const channel8 = chip.channel[8];
    channel6.out[0] = { o: channel6.slotz[1], k: "out" };
    channel6.out[1] = { o: channel6.slotz[1], k: "out" };
    channel6.out[2] = { o: chip, k: "zeromod" };
    channel6.out[3] = { o: chip, k: "zeromod" };
    channel7.out[0] = { o: channel7.slotz[0], k: "out" };
    channel7.out[1] = { o: channel7.slotz[0], k: "out" };
    channel7.out[2] = { o: channel7.slotz[1], k: "out" };
    channel7.out[3] = { o: channel7.slotz[1], k: "out" };
    channel8.out[0] = { o: channel8.slotz[0], k: "out" };
    channel8.out[1] = { o: channel8.slotz[0], k: "out" };
    channel8.out[2] = { o: channel8.slotz[1], k: "out" };
    channel8.out[3] = { o: channel8.slotz[1], k: "out" };
    for (let chnum = 6; chnum < 9; chnum++) {
      chip.channel[chnum].chtype = ch_drum;
    }
    OPL3_ChannelSetupAlg(channel6);
    OPL3_ChannelSetupAlg(channel7);
    OPL3_ChannelSetupAlg(channel8);
    if (chip.rhy & 1) {
      OPL3_EnvelopeKeyOn(channel7.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[0], egk_drum);
    }
    if (chip.rhy & 2) {
      OPL3_EnvelopeKeyOn(channel8.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[1], egk_drum);
    }
    if (chip.rhy & 4) {
      OPL3_EnvelopeKeyOn(channel8.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[0], egk_drum);
    }
    if (chip.rhy & 8) {
      OPL3_EnvelopeKeyOn(channel7.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[1], egk_drum);
    }
    if (chip.rhy & 16) {
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
function OPL3_ChannelWriteA0(channel, data) {
  if (channel.chip.newm && channel.chtype === ch_4op2) {
    return;
  }
  channel.f_num = channel.f_num & 768 | data;
  channel.ksv = (channel.block << 1 | channel.f_num >> 9 - channel.chip.nts & 1) & 255;
  OPL3_EnvelopeUpdateKSL(channel.slotz[0]);
  OPL3_EnvelopeUpdateKSL(channel.slotz[1]);
  if (channel.chip.newm && channel.chtype === ch_4op) {
    channel.pair.f_num = channel.f_num;
    channel.pair.ksv = channel.ksv;
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[0]);
    OPL3_EnvelopeUpdateKSL(channel.pair.slotz[1]);
  }
}
function OPL3_ChannelWriteB0(channel, data) {
  if (channel.chip.newm && channel.chtype === ch_4op2) {
    return;
  }
  channel.f_num = channel.f_num & 255 | (data & 3) << 8;
  channel.block = data >> 2 & 7;
  channel.ksv = (channel.block << 1 | channel.f_num >> 9 - channel.chip.nts & 1) & 255;
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
function OPL3_ChannelSetupAlg(channel) {
  const chip = channel.chip;
  if (channel.chtype === ch_drum) {
    if (channel.ch_num === 7 || channel.ch_num === 8) {
      channel.slotz[0].mod = { o: chip, k: "zeromod" };
      channel.slotz[1].mod = { o: chip, k: "zeromod" };
      return;
    }
    switch (channel.alg & 1) {
      case 0:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        break;
      case 1:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: chip, k: "zeromod" };
        break;
    }
    return;
  }
  if (channel.alg & 8) {
    return;
  }
  if (channel.alg & 4) {
    channel.pair.out[0] = { o: chip, k: "zeromod" };
    channel.pair.out[1] = { o: chip, k: "zeromod" };
    channel.pair.out[2] = { o: chip, k: "zeromod" };
    channel.pair.out[3] = { o: chip, k: "zeromod" };
    switch (channel.alg & 3) {
      case 0:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: "out" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.slotz[1], k: "out" };
        channel.out[1] = { o: chip, k: "zeromod" };
        channel.out[2] = { o: chip, k: "zeromod" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
      case 1:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: "out" };
        channel.slotz[0].mod = { o: chip, k: "zeromod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.pair.slotz[1], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip, k: "zeromod" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
      case 2:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: chip, k: "zeromod" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.pair.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip, k: "zeromod" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
      case 3:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: chip, k: "zeromod" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: chip, k: "zeromod" };
        channel.out[0] = { o: channel.pair.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[0], k: "out" };
        channel.out[2] = { o: channel.slotz[1], k: "out" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
    }
  } else {
    switch (channel.alg & 1) {
      case 0:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.slotz[1], k: "out" };
        channel.out[1] = { o: chip, k: "zeromod" };
        channel.out[2] = { o: chip, k: "zeromod" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
      case 1:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: chip, k: "zeromod" };
        channel.out[0] = { o: channel.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip, k: "zeromod" };
        channel.out[3] = { o: chip, k: "zeromod" };
        break;
    }
  }
}
function OPL3_ChannelUpdateAlg(channel) {
  channel.alg = channel.con;
  if (channel.chip.newm) {
    if (channel.chtype === ch_4op) {
      channel.pair.alg = 4 | channel.con << 1 | channel.pair.con;
      channel.alg = 8;
      OPL3_ChannelSetupAlg(channel.pair);
    } else if (channel.chtype === ch_4op2) {
      channel.alg = 4 | channel.pair.con << 1 | channel.con;
      channel.pair.alg = 8;
      OPL3_ChannelSetupAlg(channel);
    } else {
      OPL3_ChannelSetupAlg(channel);
    }
  } else {
    OPL3_ChannelSetupAlg(channel);
  }
}
function OPL3_ChannelWriteC0(channel, data) {
  channel.fb = (data & 14) >> 1;
  channel.con = data & 1;
  OPL3_ChannelUpdateAlg(channel);
  if (channel.chip.newm) {
    channel.cha = data >> 4 & 1 ? 65535 : 0;
    channel.chb = data >> 5 & 1 ? 65535 : 0;
    channel.chc = data >> 6 & 1 ? 65535 : 0;
    channel.chd = data >> 7 & 1 ? 65535 : 0;
  } else {
    channel.cha = channel.chb = 65535;
    channel.chc = channel.chd = 0;
  }
}
function OPL3_ChannelKeyOn(channel) {
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
function OPL3_ChannelKeyOff(channel) {
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
function OPL3_ChannelSet4Op(chip, data) {
  for (let bit = 0; bit < 6; bit++) {
    let chnum = bit;
    if (bit >= 3) {
      chnum += 9 - 3;
    }
    if (data >> bit & 1) {
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
function OPL3_ClipSample(sample) {
  if (sample > 32767) {
    sample = 32767;
  } else if (sample < -32768) {
    sample = -32768;
  }
  return sample | 0;
}
function OPL3_ProcessSlot(slot) {
  OPL3_SlotCalcFB(slot);
  OPL3_EnvelopeCalc(slot);
  OPL3_PhaseGenerate(slot);
  OPL3_SlotGenerate(slot);
}
function OPL3_Generate4Ch(chip, buf4) {
  const mix = [0, 0];
  buf4[1] = OPL3_ClipSample(chip.mixbuff[1]);
  buf4[3] = OPL3_ClipSample(chip.mixbuff[3]);
  for (let ii = 0; ii < 15; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }
  mix[0] = mix[1] = 0;
  for (let ii = 0; ii < 18; ii++) {
    const channel = chip.channel[ii];
    const out2 = channel.out;
    const accm = i16(rd(out2[0]) + rd(out2[1]) + rd(out2[2]) + rd(out2[3]));
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
    const out2 = channel.out;
    const accm = i16(rd(out2[0]) + rd(out2[1]) + rd(out2[2]) + rd(out2[3]));
    mix[0] += i16(accm & channel.chb);
    mix[1] += i16(accm & channel.chd);
  }
  chip.mixbuff[1] = mix[0] | 0;
  chip.mixbuff[3] = mix[1] | 0;
  for (let ii = 33; ii < 36; ii++) {
    OPL3_ProcessSlot(chip.slot[ii]);
  }
  if ((chip.timer & 63) === 63) {
    chip.tremolopos = (chip.tremolopos + 1) % 210;
  }
  if (chip.tremolopos < 105) {
    chip.tremolo = chip.tremolopos >> chip.tremoloshift;
  } else {
    chip.tremolo = 210 - chip.tremolopos >> chip.tremoloshift;
  }
  if ((chip.timer & 1023) === 1023) {
    chip.vibpos = chip.vibpos + 1 & 7;
  }
  chip.timer = chip.timer + 1 & 65535;
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
    if (chip.eg_timer === 68719476735) {
      chip.eg_timer = 0;
      chip.eg_timerrem = 1;
    } else {
      chip.eg_timer = chip.eg_timer + 1;
      chip.eg_timerrem = 0;
    }
  }
  chip.eg_state ^= 1;
}
function OPL3_Generate4ChResampled(chip, buf4) {
  while (chip.samplecnt >= chip.rateratio) {
    chip.oldsamples[0] = chip.samples[0];
    chip.oldsamples[1] = chip.samples[1];
    chip.oldsamples[2] = chip.samples[2];
    chip.oldsamples[3] = chip.samples[3];
    OPL3_Generate4Ch(chip, chip.samples);
    chip.samplecnt -= chip.rateratio;
  }
  buf4[0] = i16(Math.trunc((chip.oldsamples[0] * (chip.rateratio - chip.samplecnt) + chip.samples[0] * chip.samplecnt) / chip.rateratio));
  buf4[1] = i16(Math.trunc((chip.oldsamples[1] * (chip.rateratio - chip.samplecnt) + chip.samples[1] * chip.samplecnt) / chip.rateratio));
  buf4[2] = i16(Math.trunc((chip.oldsamples[2] * (chip.rateratio - chip.samplecnt) + chip.samples[2] * chip.samplecnt) / chip.rateratio));
  buf4[3] = i16(Math.trunc((chip.oldsamples[3] * (chip.rateratio - chip.samplecnt) + chip.samples[3] * chip.samplecnt) / chip.rateratio));
  chip.samplecnt += 1 << RSM_FRAC;
}
function OPL3_Reset(chip, samplerate) {
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
    slot.mod = { o: chip, k: "zeromod" };
    slot.eg_rout = 511;
    slot.eg_out = 511;
    slot.eg_gen = envelope_gen_num_release;
    slot.trem = { o: chip, k: "zeromod" };
    slot.slot_num = slotnum;
  }
  for (let channum = 0; channum < 18; channum++) {
    const channel = chip.channel[channum];
    const local_ch_slot = ch_slot[channum];
    channel.slotz[0] = chip.slot[local_ch_slot];
    channel.slotz[1] = chip.slot[local_ch_slot + 3];
    chip.slot[local_ch_slot].channel = channel;
    chip.slot[local_ch_slot + 3].channel = channel;
    if (channum % 9 < 3) {
      channel.pair = chip.channel[channum + 3];
    } else if (channum % 9 < 6) {
      channel.pair = chip.channel[channum - 3];
    }
    channel.chip = chip;
    channel.out[0] = { o: chip, k: "zeromod" };
    channel.out[1] = { o: chip, k: "zeromod" };
    channel.out[2] = { o: chip, k: "zeromod" };
    channel.out[3] = { o: chip, k: "zeromod" };
    channel.chtype = ch_2op;
    channel.cha = 65535;
    channel.chb = 65535;
    channel.ch_num = channum;
    OPL3_ChannelSetupAlg(channel);
  }
  chip.noise = 1;
  chip.rateratio = Math.floor(samplerate * (1 << RSM_FRAC) / 49716);
  chip.tremoloshift = 4;
  chip.vibshift = 1;
}
function OPL3_WriteReg(chip, reg, v) {
  const high = reg >> 8 & 1;
  const regm = reg & 255;
  switch (regm & 240) {
    case 0:
      if (high) {
        switch (regm & 15) {
          case 4:
            OPL3_ChannelSet4Op(chip, v);
            break;
          case 5:
            chip.newm = v & 1;
            break;
        }
      } else {
        switch (regm & 15) {
          case 8:
            chip.nts = v >> 6 & 1;
            break;
        }
      }
      break;
    case 32:
    case 48:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite20(chip.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 64:
    case 80:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite40(chip.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 96:
    case 112:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite60(chip.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 128:
    case 144:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite80(chip.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 224:
    case 240:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWriteE0(chip.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 160:
      if ((regm & 15) < 9) {
        OPL3_ChannelWriteA0(chip.channel[9 * high + (regm & 15)], v);
      }
      break;
    case 176:
      if (regm === 189 && !high) {
        chip.tremoloshift = ((v >> 7 ^ 1) << 1) + 2;
        chip.vibshift = v >> 6 & 1 ^ 1;
        OPL3_ChannelUpdateRhythm(chip, v);
      } else if ((regm & 15) < 9) {
        OPL3_ChannelWriteB0(chip.channel[9 * high + (regm & 15)], v);
        if (v & 32) {
          OPL3_ChannelKeyOn(chip.channel[9 * high + (regm & 15)]);
        } else {
          OPL3_ChannelKeyOff(chip.channel[9 * high + (regm & 15)]);
        }
      }
      break;
    case 192:
      if ((regm & 15) < 9) {
        OPL3_ChannelWriteC0(chip.channel[9 * high + (regm & 15)], v);
      }
      break;
  }
}
var OPL3 = class {
  chip = new Chip();
  buf4 = [0, 0, 0, 0];
  // Optional register-write capture for the offline reference-comparison tool.
  // Null in normal use (zero overhead). Each entry: output-sample time, reg, val.
  capture = null;
  sampleClock = 0;
  constructor(outputRate) {
    OPL3_Reset(this.chip, outputRate);
  }
  /** Write one OPL register. 0x100+ addresses the second bank (voices 9..17). */
  write(reg, val) {
    if (this.capture) this.capture.push({ t: this.sampleClock, reg, val });
    OPL3_WriteReg(this.chip, reg & 511, val & 255);
  }
  /** Fill a mono Float32 buffer at the output rate, using the LEFT channel. */
  generate(out2) {
    for (let i = 0; i < out2.length; i++) {
      this.sampleClock++;
      OPL3_Generate4ChResampled(this.chip, this.buf4);
      const s = this.buf4[0] / 32768;
      out2[i] = s < -1 ? -1 : s > 1 ? 1 : s;
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
    scale: d.getUint8(o + 4),
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
var NVOICES = 9;
var bankOf = (_v) => 0;
var chIn = (v) => v;
var PERCUSSION = 15;
var VOLUME_MAP = [
  0,
  1,
  3,
  5,
  6,
  8,
  10,
  11,
  13,
  14,
  16,
  17,
  19,
  20,
  22,
  23,
  25,
  26,
  27,
  29,
  30,
  32,
  33,
  34,
  36,
  37,
  39,
  41,
  43,
  45,
  47,
  49,
  50,
  52,
  54,
  55,
  57,
  59,
  60,
  61,
  63,
  64,
  66,
  67,
  68,
  69,
  71,
  72,
  73,
  74,
  75,
  76,
  77,
  79,
  80,
  81,
  82,
  83,
  84,
  84,
  85,
  86,
  87,
  88,
  89,
  90,
  91,
  92,
  92,
  93,
  94,
  95,
  96,
  96,
  97,
  98,
  99,
  99,
  100,
  101,
  101,
  102,
  103,
  103,
  104,
  105,
  105,
  106,
  107,
  107,
  108,
  109,
  109,
  110,
  110,
  111,
  112,
  112,
  113,
  113,
  114,
  114,
  115,
  115,
  116,
  117,
  117,
  118,
  118,
  119,
  119,
  120,
  120,
  121,
  121,
  122,
  122,
  123,
  123,
  123,
  124,
  124,
  125,
  125,
  126,
  126,
  127,
  127
];
var FREQ_CURVE = [
  307,
  307,
  308,
  308,
  309,
  310,
  310,
  311,
  311,
  312,
  312,
  313,
  313,
  314,
  315,
  315,
  316,
  316,
  317,
  317,
  318,
  319,
  319,
  320,
  320,
  321,
  322,
  322,
  323,
  323,
  324,
  324,
  325,
  326,
  326,
  327,
  327,
  328,
  329,
  329,
  330,
  330,
  331,
  332,
  332,
  333,
  333,
  334,
  335,
  335,
  336,
  336,
  337,
  338,
  338,
  339,
  339,
  340,
  341,
  341,
  342,
  343,
  343,
  344,
  344,
  345,
  346,
  346,
  347,
  347,
  348,
  349,
  349,
  350,
  351,
  351,
  352,
  353,
  353,
  354,
  354,
  355,
  356,
  356,
  357,
  358,
  358,
  359,
  360,
  360,
  361,
  362,
  362,
  363,
  364,
  364,
  365,
  366,
  366,
  367,
  368,
  368,
  369,
  370,
  370,
  371,
  372,
  372,
  373,
  374,
  374,
  375,
  376,
  376,
  377,
  378,
  378,
  379,
  380,
  380,
  381,
  382,
  382,
  383,
  384,
  385,
  385,
  386,
  387,
  387,
  388,
  389,
  389,
  390,
  391,
  392,
  392,
  393,
  394,
  394,
  395,
  396,
  397,
  397,
  398,
  399,
  399,
  400,
  401,
  402,
  402,
  403,
  404,
  404,
  405,
  406,
  407,
  407,
  408,
  409,
  410,
  410,
  411,
  412,
  413,
  413,
  414,
  415,
  416,
  416,
  417,
  418,
  419,
  419,
  420,
  421,
  422,
  422,
  423,
  424,
  425,
  425,
  426,
  427,
  428,
  429,
  429,
  430,
  431,
  432,
  432,
  433,
  434,
  435,
  436,
  436,
  437,
  438,
  439,
  440,
  440,
  441,
  442,
  443,
  444,
  444,
  445,
  446,
  447,
  448,
  448,
  449,
  450,
  451,
  452,
  452,
  453,
  454,
  455,
  456,
  457,
  457,
  458,
  459,
  460,
  461,
  462,
  462,
  463,
  464,
  465,
  466,
  467,
  467,
  468,
  469,
  470,
  471,
  472,
  472,
  473,
  474,
  475,
  476,
  477,
  478,
  478,
  479,
  480,
  481,
  482,
  483,
  484,
  485,
  485,
  486,
  487,
  488,
  489,
  490,
  491,
  492,
  493,
  493,
  494,
  495,
  496,
  497,
  498,
  499,
  500,
  501,
  502,
  502,
  503,
  504,
  505,
  506,
  507,
  508,
  509,
  510,
  511,
  512,
  513,
  513,
  514,
  515,
  516,
  517,
  518,
  519,
  520,
  521,
  522,
  523,
  524,
  525,
  526,
  527,
  528,
  528,
  529,
  530,
  531,
  532,
  533,
  534,
  535,
  536,
  537,
  538,
  539,
  540,
  541,
  542,
  543,
  544,
  545,
  546,
  547,
  548,
  549,
  550,
  551,
  552,
  553,
  554,
  555,
  556,
  557,
  558,
  559,
  560,
  561,
  562,
  563,
  564,
  565,
  566,
  567,
  568,
  569,
  570,
  571,
  572,
  573,
  574,
  575,
  576,
  577,
  578,
  580,
  581,
  582,
  583,
  584,
  585,
  586,
  587,
  588,
  589,
  590,
  591,
  592,
  593,
  594,
  595,
  596,
  598,
  599,
  600,
  601,
  602,
  603,
  604,
  605,
  606,
  607,
  608,
  610,
  611,
  612,
  613,
  614,
  615,
  616,
  617,
  618,
  620,
  621,
  622,
  623,
  624,
  625,
  626,
  627,
  629,
  630,
  631,
  632,
  633,
  634,
  635,
  637,
  638,
  639,
  640,
  641,
  642,
  644,
  645,
  646,
  647,
  648,
  649,
  651,
  652,
  653,
  654,
  655,
  656,
  658,
  659,
  660,
  661,
  662,
  664,
  665,
  666,
  667,
  668,
  670,
  671,
  672,
  673,
  674,
  676,
  677,
  678,
  679,
  681,
  682,
  683,
  684,
  686,
  687,
  688,
  689,
  690,
  692,
  693,
  694,
  695,
  697,
  698,
  699,
  701,
  702,
  703,
  704,
  706,
  707,
  708,
  709,
  711,
  712,
  713,
  715,
  716,
  717,
  718,
  720,
  721,
  722,
  724,
  725,
  726,
  728,
  729,
  730,
  732,
  733,
  734,
  736,
  737,
  738,
  740,
  741,
  742,
  744,
  745,
  746,
  748,
  749,
  750,
  752,
  753,
  754,
  756,
  757,
  758,
  760,
  761,
  763,
  764,
  765,
  767,
  768,
  770,
  771,
  772,
  774,
  775,
  777,
  778,
  779,
  781,
  782,
  784,
  785,
  786,
  788,
  789,
  791,
  792,
  794,
  795,
  796,
  798,
  799,
  801,
  802,
  804,
  805,
  807,
  808,
  809,
  811,
  812,
  814,
  815,
  817,
  818,
  820,
  821,
  823,
  824,
  826,
  827,
  829,
  830,
  832,
  833,
  835,
  836,
  838,
  839,
  841,
  842,
  844,
  845,
  847,
  848,
  850,
  851,
  853,
  855,
  856,
  858,
  859,
  861,
  862,
  864,
  865,
  867,
  869,
  870,
  872,
  873,
  875,
  876,
  878,
  880,
  881,
  883,
  884,
  886,
  888,
  889,
  891,
  892,
  894,
  896,
  897,
  899,
  900,
  902,
  904,
  905,
  907,
  909,
  910,
  912,
  914,
  915,
  917,
  919,
  920,
  922,
  924,
  925,
  927,
  929,
  930,
  932,
  934,
  935,
  937,
  939,
  940,
  942,
  944,
  945,
  947,
  949,
  951,
  952,
  954,
  956,
  957,
  959,
  961,
  963,
  964,
  966,
  968,
  970,
  971,
  973,
  975,
  977,
  978,
  980,
  982,
  984,
  986,
  987,
  989,
  991,
  993,
  995,
  996,
  998,
  1e3,
  1002,
  1004,
  1005,
  1007,
  1009,
  1011,
  1013,
  1014,
  1016,
  1018,
  1020,
  1022,
  876
];
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
    this.opl = new OPL3(outputRate);
    this.instruments = parseGenmidi(genmidi);
    this.samplesPerTick = outputRate / MUS_RATE;
    for (let i = 0; i < NVOICES; i++) this.voices.push({ midiCh: -1, note: 0, age: 0, b0: 0, useNote: 0, fineOffset: 0 });
    for (let i = 0; i < 16; i++) this.chans.push({ instrument: 0, volume: 100, pitch: 0 });
  }
  /** Begin recording every OPL register write (offline reference tool only). */
  enableCapture() {
    this.opl.capture = [];
    return this.opl.capture;
  }
  play(mus, loop) {
    this.score = mus.score;
    this.pos = 0;
    this.delay = 0;
    this.loop = loop;
    this.playing = true;
    this.opl.write(189, 0);
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
    let bestFree = -1, steal = -1;
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === -1) {
        if (bestFree < 0 || this.voices[i].age < this.voices[bestFree].age) bestFree = i;
      } else if (steal < 0 || this.voices[i].midiCh >= this.voices[steal].midiCh) {
        steal = i;
      }
    }
    const v = bestFree >= 0 ? bestFree : steal;
    this.voices[v] = { midiCh, note, age: ++this.ageCounter, b0: 0, useNote: note, fineOffset: 0 };
    return v;
  }
  // DMX's exact note→register mapping (Chocolate Doom FrequencyForVoice). Returns
  // the raw value: low 10 bits = F-number, bits 10-12 = block. `bend` is in
  // freq-index units (32 per semitone). A hand-rolled formula gave the right
  // pitch to my old synth but the WRONG block for a real OPL, shifting the whole
  // score an octave and mis-keyscaling it — the table is authoritative.
  freqForVoice(note, bend) {
    let n = note;
    while (n < 0) n += 12;
    while (n > 95) n -= 12;
    let fi = 64 + 32 * n + bend;
    if (fi < 0) fi = 0;
    if (fi < 284) return FREQ_CURVE[fi];
    const sub = (fi - 284) % (12 * 32);
    let oct = Math.floor((fi - 284) / (12 * 32));
    if (oct >= 7) oct = 7;
    return FREQ_CURVE[sub + 284] | oct << 10;
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
    const midiVol = 2 * (VOLUME_MAP[ch.volume & 127] + 1);
    const full = VOLUME_MAP[vol & 127] * midiVol >> 9;
    const carVolume = 63 - full;
    for (let vi = 0; vi < inst.voices.length; vi++) {
      const voice = inst.voices[vi];
      const fineOffset = vi === 1 ? (inst.fineTune >> 1) - 64 : 0;
      this.loadVoice(midiCh, note, voice, inst, playNote, ch, carVolume, fineOffset);
    }
  }
  loadVoice(midiCh, note, voice, inst, playNote, ch, carVolume, fineOffset) {
    const v = this.alloc(midiCh, note);
    const bank = bankOf(v), c = chIn(v);
    const mSlot = bank | OPL_MOD[c], cSlot = bank | OPL_CAR[c];
    this.opl.write(32 + mSlot, voice.mod.char);
    this.opl.write(64 + mSlot, voice.mod.scale & 192 | voice.mod.level & 63);
    this.opl.write(96 + mSlot, voice.mod.attack);
    this.opl.write(128 + mSlot, voice.mod.sustain);
    this.opl.write(224 + mSlot, voice.mod.wave);
    this.opl.write(32 + cSlot, voice.car.char);
    this.opl.write(64 + cSlot, voice.car.scale & 192 | carVolume & 63);
    this.opl.write(96 + cSlot, voice.car.attack);
    this.opl.write(128 + cSlot, voice.car.sustain);
    this.opl.write(224 + cSlot, voice.car.wave);
    this.opl.write(bank | 192 + c, voice.feedback);
    const useNote = inst.flags & 1 ? inst.fixedNote : playNote + voice.noteOffset;
    this.voices[v].useNote = useNote;
    this.voices[v].fineOffset = fineOffset;
    this.writeVoiceFreq(v, ch, true);
  }
  /** (Re)program a voice's frequency registers from its note + the channel bend. */
  writeVoiceFreq(v, ch, keyOn) {
    const bank = bankOf(v), c = chIn(v);
    const vc = this.voices[v];
    const val = this.freqForVoice(vc.useNote, ch.pitch + vc.fineOffset);
    const b0 = val >> 8 & 31;
    vc.b0 = b0;
    this.opl.write(bank | 160 + c, val & 255);
    this.opl.write(bank | 176 + c, (keyOn ? 32 : 0) | b0);
  }
  /** A pitch-bend changed: re-tune every note currently held on this channel. */
  bendChannel(midiCh) {
    const ch = this.chans[midiCh];
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === midiCh) this.writeVoiceFreq(i, ch, true);
    }
  }
  stopNote(midiCh, note) {
    for (let i = 0; i < NVOICES; i++) {
      if (this.voices[i].midiCh === midiCh && this.voices[i].note === note) {
        this.opl.write(bankOf(i) | 176 + chIn(i), this.voices[i].b0);
        this.voices[i].midiCh = -1;
        this.voices[i].age = ++this.ageCounter;
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
          this.chans[chn].pitch = (amt >> 1) - 64;
          this.bendChannel(chn);
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
      const n = Math.min(out2.length - i, Math.ceil(this.tickAcc));
      this.opl.generate(out2.subarray(i, i + n));
      i += n;
      this.tickAcc -= n;
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

// tools/oplcap.ts
var buf = readFileSync("./doom1.wad");
var wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
var RATE = 44100;
var name = process.argv[2] ?? "D_E1M1";
var secs = Number(process.argv[3] ?? 40);
var player = new MusicPlayer(wad.lump("GENMIDI"), RATE);
var cap = player.enableCapture();
player.play(parseMus(wad.lump(name)), false);
var N = RATE * secs;
var out = new Float32Array(N);
for (let i = 0; i < N; i += 4096) player.generate(out.subarray(i, Math.min(i + 4096, N)));
var rec = 7;
var dump = Buffer.alloc(16 + cap.length * rec);
dump.write("OPLC", 0);
dump.writeUInt32LE(RATE, 4);
dump.writeUInt32LE(N, 8);
dump.writeUInt32LE(cap.length, 12);
for (let i = 0; i < cap.length; i++) {
  const o = 16 + i * rec;
  dump.writeUInt32LE(cap[i].t, o);
  dump.writeUInt16LE(cap[i].reg, o + 4);
  dump.writeUInt8(cap[i].val & 255, o + 6);
}
writeFileSync(`${name}.oplcap`, dump);
var wav = Buffer.alloc(44 + N * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + N * 2, 4);
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
wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(Math.max(-1, Math.min(1, out[i])) * 32767, 44 + i * 2);
writeFileSync(`${name}.mine.wav`, wav);
console.log(`${name}: ${cap.length} register writes captured over ${secs}s -> ${name}.oplcap, ${name}.mine.wav`);
var groups = {};
for (const w of cap) {
  const g = (w.reg & 256 ? "B1:" : "B0:") + (w.reg & 224).toString(16);
  groups[g] = (groups[g] || 0) + 1;
}
console.log("writes by reg-group:", JSON.stringify(groups));
var opl3on = cap.some((w) => (w.reg & 255) === 5 && w.reg & 256 && w.val === 1);
console.log('OPL3 "NEW" bit (reg 0x105=1) ever written by sequencer:', opl3on);
