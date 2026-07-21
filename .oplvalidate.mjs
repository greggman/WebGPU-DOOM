// tools/oplvalidate.ts
import { readFileSync, writeFileSync } from "node:fs";

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
function rd(p2) {
  return p2.o[p2.k];
}
function OPL3_EnvelopeCalcExp(level) {
  if (level > 8191) {
    level = 8191;
  }
  return exprom[level & 255] << 1 >> (level >> 8);
}
function OPL3_EnvelopeCalcSin0(phase, envelope) {
  let out = 0;
  let neg = 0;
  phase &= 1023;
  if (phase & 512) {
    neg = 65535;
  }
  if (phase & 256) {
    out = logsinrom[phase & 255 ^ 255];
  } else {
    out = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
}
function OPL3_EnvelopeCalcSin1(phase, envelope) {
  let out = 0;
  phase &= 1023;
  if (phase & 512) {
    out = 4096;
  } else if (phase & 256) {
    out = logsinrom[phase & 255 ^ 255];
  } else {
    out = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin2(phase, envelope) {
  let out = 0;
  phase &= 1023;
  if (phase & 256) {
    out = logsinrom[phase & 255 ^ 255];
  } else {
    out = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin3(phase, envelope) {
  let out = 0;
  phase &= 1023;
  if (phase & 256) {
    out = 4096;
  } else {
    out = logsinrom[phase & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
}
function OPL3_EnvelopeCalcSin4(phase, envelope) {
  let out = 0;
  let neg = 0;
  phase &= 1023;
  if ((phase & 768) === 256) {
    neg = 65535;
  }
  if (phase & 512) {
    out = 4096;
  } else if (phase & 128) {
    out = logsinrom[(phase ^ 255) << 1 & 255];
  } else {
    out = logsinrom[phase << 1 & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
}
function OPL3_EnvelopeCalcSin5(phase, envelope) {
  let out = 0;
  phase &= 1023;
  if (phase & 512) {
    out = 4096;
  } else if (phase & 128) {
    out = logsinrom[(phase ^ 255) << 1 & 255];
  } else {
    out = logsinrom[phase << 1 & 255];
  }
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)));
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
  let out = 0;
  let neg = 0;
  phase &= 1023;
  if (phase & 512) {
    neg = 65535;
    phase = phase & 511 ^ 511;
  }
  out = phase << 3;
  return i16(OPL3_EnvelopeCalcExp(out + (envelope << 3)) ^ neg);
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
  const rate2 = ks + (reg_rate << 2) & 255;
  let rate_hi = rate2 >> 2;
  const rate_lo = rate2 & 3;
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
  const chip2 = slot.chip;
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
  const noise = chip2.noise;
  slot.pg_phase_out = phase;
  if (slot.slot_num === 13) {
    chip2.rm_hh_bit2 = phase >> 2 & 1;
    chip2.rm_hh_bit3 = phase >> 3 & 1;
    chip2.rm_hh_bit7 = phase >> 7 & 1;
    chip2.rm_hh_bit8 = phase >> 8 & 1;
  }
  if (slot.slot_num === 17 && chip2.rhy & 32) {
    chip2.rm_tc_bit3 = phase >> 3 & 1;
    chip2.rm_tc_bit5 = phase >> 5 & 1;
  }
  if (chip2.rhy & 32) {
    const rm_xor = chip2.rm_hh_bit2 ^ chip2.rm_hh_bit7 | chip2.rm_hh_bit3 ^ chip2.rm_tc_bit5 | chip2.rm_tc_bit3 ^ chip2.rm_tc_bit5;
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
        slot.pg_phase_out = (chip2.rm_hh_bit8 << 9 | (chip2.rm_hh_bit8 ^ noise & 1) << 8) & 65535;
        break;
      case 17:
        slot.pg_phase_out = (rm_xor << 9 | 128) & 65535;
        break;
      default:
        break;
    }
  }
  const n_bit = (noise >>> 14 ^ noise) & 1;
  chip2.noise = (noise >>> 1 | n_bit << 22) >>> 0;
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
function OPL3_ChannelUpdateRhythm(chip2, data) {
  chip2.rhy = data & 63;
  if (chip2.rhy & 32) {
    const channel6 = chip2.channel[6];
    const channel7 = chip2.channel[7];
    const channel8 = chip2.channel[8];
    channel6.out[0] = { o: channel6.slotz[1], k: "out" };
    channel6.out[1] = { o: channel6.slotz[1], k: "out" };
    channel6.out[2] = { o: chip2, k: "zeromod" };
    channel6.out[3] = { o: chip2, k: "zeromod" };
    channel7.out[0] = { o: channel7.slotz[0], k: "out" };
    channel7.out[1] = { o: channel7.slotz[0], k: "out" };
    channel7.out[2] = { o: channel7.slotz[1], k: "out" };
    channel7.out[3] = { o: channel7.slotz[1], k: "out" };
    channel8.out[0] = { o: channel8.slotz[0], k: "out" };
    channel8.out[1] = { o: channel8.slotz[0], k: "out" };
    channel8.out[2] = { o: channel8.slotz[1], k: "out" };
    channel8.out[3] = { o: channel8.slotz[1], k: "out" };
    for (let chnum = 6; chnum < 9; chnum++) {
      chip2.channel[chnum].chtype = ch_drum;
    }
    OPL3_ChannelSetupAlg(channel6);
    OPL3_ChannelSetupAlg(channel7);
    OPL3_ChannelSetupAlg(channel8);
    if (chip2.rhy & 1) {
      OPL3_EnvelopeKeyOn(channel7.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[0], egk_drum);
    }
    if (chip2.rhy & 2) {
      OPL3_EnvelopeKeyOn(channel8.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[1], egk_drum);
    }
    if (chip2.rhy & 4) {
      OPL3_EnvelopeKeyOn(channel8.slotz[0], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel8.slotz[0], egk_drum);
    }
    if (chip2.rhy & 8) {
      OPL3_EnvelopeKeyOn(channel7.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel7.slotz[1], egk_drum);
    }
    if (chip2.rhy & 16) {
      OPL3_EnvelopeKeyOn(channel6.slotz[0], egk_drum);
      OPL3_EnvelopeKeyOn(channel6.slotz[1], egk_drum);
    } else {
      OPL3_EnvelopeKeyOff(channel6.slotz[0], egk_drum);
      OPL3_EnvelopeKeyOff(channel6.slotz[1], egk_drum);
    }
  } else {
    for (let chnum = 6; chnum < 9; chnum++) {
      chip2.channel[chnum].chtype = ch_2op;
      OPL3_ChannelSetupAlg(chip2.channel[chnum]);
      OPL3_EnvelopeKeyOff(chip2.channel[chnum].slotz[0], egk_drum);
      OPL3_EnvelopeKeyOff(chip2.channel[chnum].slotz[1], egk_drum);
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
  const chip2 = channel.chip;
  if (channel.chtype === ch_drum) {
    if (channel.ch_num === 7 || channel.ch_num === 8) {
      channel.slotz[0].mod = { o: chip2, k: "zeromod" };
      channel.slotz[1].mod = { o: chip2, k: "zeromod" };
      return;
    }
    switch (channel.alg & 1) {
      case 0:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        break;
      case 1:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: chip2, k: "zeromod" };
        break;
    }
    return;
  }
  if (channel.alg & 8) {
    return;
  }
  if (channel.alg & 4) {
    channel.pair.out[0] = { o: chip2, k: "zeromod" };
    channel.pair.out[1] = { o: chip2, k: "zeromod" };
    channel.pair.out[2] = { o: chip2, k: "zeromod" };
    channel.pair.out[3] = { o: chip2, k: "zeromod" };
    switch (channel.alg & 3) {
      case 0:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: "out" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.slotz[1], k: "out" };
        channel.out[1] = { o: chip2, k: "zeromod" };
        channel.out[2] = { o: chip2, k: "zeromod" };
        channel.out[3] = { o: chip2, k: "zeromod" };
        break;
      case 1:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: channel.pair.slotz[0], k: "out" };
        channel.slotz[0].mod = { o: chip2, k: "zeromod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.pair.slotz[1], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip2, k: "zeromod" };
        channel.out[3] = { o: chip2, k: "zeromod" };
        break;
      case 2:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: chip2, k: "zeromod" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.pair.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip2, k: "zeromod" };
        channel.out[3] = { o: chip2, k: "zeromod" };
        break;
      case 3:
        channel.pair.slotz[0].mod = { o: channel.pair.slotz[0], k: "fbmod" };
        channel.pair.slotz[1].mod = { o: chip2, k: "zeromod" };
        channel.slotz[0].mod = { o: channel.pair.slotz[1], k: "out" };
        channel.slotz[1].mod = { o: chip2, k: "zeromod" };
        channel.out[0] = { o: channel.pair.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[0], k: "out" };
        channel.out[2] = { o: channel.slotz[1], k: "out" };
        channel.out[3] = { o: chip2, k: "zeromod" };
        break;
    }
  } else {
    switch (channel.alg & 1) {
      case 0:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: channel.slotz[0], k: "out" };
        channel.out[0] = { o: channel.slotz[1], k: "out" };
        channel.out[1] = { o: chip2, k: "zeromod" };
        channel.out[2] = { o: chip2, k: "zeromod" };
        channel.out[3] = { o: chip2, k: "zeromod" };
        break;
      case 1:
        channel.slotz[0].mod = { o: channel.slotz[0], k: "fbmod" };
        channel.slotz[1].mod = { o: chip2, k: "zeromod" };
        channel.out[0] = { o: channel.slotz[0], k: "out" };
        channel.out[1] = { o: channel.slotz[1], k: "out" };
        channel.out[2] = { o: chip2, k: "zeromod" };
        channel.out[3] = { o: chip2, k: "zeromod" };
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
function OPL3_ChannelSet4Op(chip2, data) {
  for (let bit = 0; bit < 6; bit++) {
    let chnum = bit;
    if (bit >= 3) {
      chnum += 9 - 3;
    }
    if (data >> bit & 1) {
      chip2.channel[chnum].chtype = ch_4op;
      chip2.channel[chnum + 3].chtype = ch_4op2;
      OPL3_ChannelUpdateAlg(chip2.channel[chnum]);
    } else {
      chip2.channel[chnum].chtype = ch_2op;
      chip2.channel[chnum + 3].chtype = ch_2op;
      OPL3_ChannelUpdateAlg(chip2.channel[chnum]);
      OPL3_ChannelUpdateAlg(chip2.channel[chnum + 3]);
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
function OPL3_Generate4Ch(chip2, buf4) {
  const mix = [0, 0];
  buf4[1] = OPL3_ClipSample(chip2.mixbuff[1]);
  buf4[3] = OPL3_ClipSample(chip2.mixbuff[3]);
  for (let ii = 0; ii < 15; ii++) {
    OPL3_ProcessSlot(chip2.slot[ii]);
  }
  mix[0] = mix[1] = 0;
  for (let ii = 0; ii < 18; ii++) {
    const channel = chip2.channel[ii];
    const out = channel.out;
    const accm = i16(rd(out[0]) + rd(out[1]) + rd(out[2]) + rd(out[3]));
    mix[0] += i16(accm & channel.cha);
    mix[1] += i16(accm & channel.chc);
  }
  chip2.mixbuff[0] = mix[0] | 0;
  chip2.mixbuff[2] = mix[1] | 0;
  for (let ii = 15; ii < 18; ii++) {
    OPL3_ProcessSlot(chip2.slot[ii]);
  }
  buf4[0] = OPL3_ClipSample(chip2.mixbuff[0]);
  buf4[2] = OPL3_ClipSample(chip2.mixbuff[2]);
  for (let ii = 18; ii < 33; ii++) {
    OPL3_ProcessSlot(chip2.slot[ii]);
  }
  mix[0] = mix[1] = 0;
  for (let ii = 0; ii < 18; ii++) {
    const channel = chip2.channel[ii];
    const out = channel.out;
    const accm = i16(rd(out[0]) + rd(out[1]) + rd(out[2]) + rd(out[3]));
    mix[0] += i16(accm & channel.chb);
    mix[1] += i16(accm & channel.chd);
  }
  chip2.mixbuff[1] = mix[0] | 0;
  chip2.mixbuff[3] = mix[1] | 0;
  for (let ii = 33; ii < 36; ii++) {
    OPL3_ProcessSlot(chip2.slot[ii]);
  }
  if ((chip2.timer & 63) === 63) {
    chip2.tremolopos = (chip2.tremolopos + 1) % 210;
  }
  if (chip2.tremolopos < 105) {
    chip2.tremolo = chip2.tremolopos >> chip2.tremoloshift;
  } else {
    chip2.tremolo = 210 - chip2.tremolopos >> chip2.tremoloshift;
  }
  if ((chip2.timer & 1023) === 1023) {
    chip2.vibpos = chip2.vibpos + 1 & 7;
  }
  chip2.timer = chip2.timer + 1 & 65535;
  if (chip2.eg_state) {
    let shift = 0;
    while (shift < 13 && Math.floor(chip2.eg_timer / Math.pow(2, shift)) % 2 === 0) {
      shift++;
    }
    if (shift > 12) {
      chip2.eg_add = 0;
    } else {
      chip2.eg_add = shift + 1;
    }
    chip2.eg_timer_lo = chip2.eg_timer % 4;
  }
  if (chip2.eg_timerrem || chip2.eg_state) {
    if (chip2.eg_timer === 68719476735) {
      chip2.eg_timer = 0;
      chip2.eg_timerrem = 1;
    } else {
      chip2.eg_timer = chip2.eg_timer + 1;
      chip2.eg_timerrem = 0;
    }
  }
  chip2.eg_state ^= 1;
}
function OPL3_Generate4ChResampled(chip2, buf4) {
  while (chip2.samplecnt >= chip2.rateratio) {
    chip2.oldsamples[0] = chip2.samples[0];
    chip2.oldsamples[1] = chip2.samples[1];
    chip2.oldsamples[2] = chip2.samples[2];
    chip2.oldsamples[3] = chip2.samples[3];
    OPL3_Generate4Ch(chip2, chip2.samples);
    chip2.samplecnt -= chip2.rateratio;
  }
  buf4[0] = i16(Math.trunc((chip2.oldsamples[0] * (chip2.rateratio - chip2.samplecnt) + chip2.samples[0] * chip2.samplecnt) / chip2.rateratio));
  buf4[1] = i16(Math.trunc((chip2.oldsamples[1] * (chip2.rateratio - chip2.samplecnt) + chip2.samples[1] * chip2.samplecnt) / chip2.rateratio));
  buf4[2] = i16(Math.trunc((chip2.oldsamples[2] * (chip2.rateratio - chip2.samplecnt) + chip2.samples[2] * chip2.samplecnt) / chip2.rateratio));
  buf4[3] = i16(Math.trunc((chip2.oldsamples[3] * (chip2.rateratio - chip2.samplecnt) + chip2.samples[3] * chip2.samplecnt) / chip2.rateratio));
  chip2.samplecnt += 1 << RSM_FRAC;
}
function OPL3_Reset(chip2, samplerate) {
  chip2.channel = [];
  chip2.slot = [];
  for (let i = 0; i < 36; i++) {
    chip2.slot.push(new Slot());
  }
  for (let i = 0; i < 18; i++) {
    chip2.channel.push(new Channel());
  }
  chip2.timer = 0;
  chip2.eg_timer = 0;
  chip2.eg_timerrem = 0;
  chip2.eg_state = 0;
  chip2.eg_add = 0;
  chip2.eg_timer_lo = 0;
  chip2.newm = 0;
  chip2.nts = 0;
  chip2.rhy = 0;
  chip2.vibpos = 0;
  chip2.tremolo = 0;
  chip2.tremolopos = 0;
  chip2.zeromod = 0;
  chip2.mixbuff = [0, 0, 0, 0];
  chip2.rm_hh_bit2 = chip2.rm_hh_bit3 = chip2.rm_hh_bit7 = chip2.rm_hh_bit8 = 0;
  chip2.rm_tc_bit3 = chip2.rm_tc_bit5 = 0;
  chip2.samplecnt = 0;
  chip2.oldsamples = [0, 0, 0, 0];
  chip2.samples = [0, 0, 0, 0];
  for (let slotnum = 0; slotnum < 36; slotnum++) {
    const slot = chip2.slot[slotnum];
    slot.chip = chip2;
    slot.mod = { o: chip2, k: "zeromod" };
    slot.eg_rout = 511;
    slot.eg_out = 511;
    slot.eg_gen = envelope_gen_num_release;
    slot.trem = { o: chip2, k: "zeromod" };
    slot.slot_num = slotnum;
  }
  for (let channum = 0; channum < 18; channum++) {
    const channel = chip2.channel[channum];
    const local_ch_slot = ch_slot[channum];
    channel.slotz[0] = chip2.slot[local_ch_slot];
    channel.slotz[1] = chip2.slot[local_ch_slot + 3];
    chip2.slot[local_ch_slot].channel = channel;
    chip2.slot[local_ch_slot + 3].channel = channel;
    if (channum % 9 < 3) {
      channel.pair = chip2.channel[channum + 3];
    } else if (channum % 9 < 6) {
      channel.pair = chip2.channel[channum - 3];
    }
    channel.chip = chip2;
    channel.out[0] = { o: chip2, k: "zeromod" };
    channel.out[1] = { o: chip2, k: "zeromod" };
    channel.out[2] = { o: chip2, k: "zeromod" };
    channel.out[3] = { o: chip2, k: "zeromod" };
    channel.chtype = ch_2op;
    channel.cha = 65535;
    channel.chb = 65535;
    channel.ch_num = channum;
    OPL3_ChannelSetupAlg(channel);
  }
  chip2.noise = 1;
  chip2.rateratio = Math.floor(samplerate * (1 << RSM_FRAC) / 49716);
  chip2.tremoloshift = 4;
  chip2.vibshift = 1;
}
function OPL3_WriteReg(chip2, reg, v) {
  const high = reg >> 8 & 1;
  const regm = reg & 255;
  switch (regm & 240) {
    case 0:
      if (high) {
        switch (regm & 15) {
          case 4:
            OPL3_ChannelSet4Op(chip2, v);
            break;
          case 5:
            chip2.newm = v & 1;
            break;
        }
      } else {
        switch (regm & 15) {
          case 8:
            chip2.nts = v >> 6 & 1;
            break;
        }
      }
      break;
    case 32:
    case 48:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite20(chip2.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 64:
    case 80:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite40(chip2.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 96:
    case 112:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite60(chip2.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 128:
    case 144:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWrite80(chip2.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 224:
    case 240:
      if (ad_slot[regm & 31] >= 0) {
        OPL3_SlotWriteE0(chip2.slot[18 * high + ad_slot[regm & 31]], v);
      }
      break;
    case 160:
      if ((regm & 15) < 9) {
        OPL3_ChannelWriteA0(chip2.channel[9 * high + (regm & 15)], v);
      }
      break;
    case 176:
      if (regm === 189 && !high) {
        chip2.tremoloshift = ((v >> 7 ^ 1) << 1) + 2;
        chip2.vibshift = v >> 6 & 1 ^ 1;
        OPL3_ChannelUpdateRhythm(chip2, v);
      } else if ((regm & 15) < 9) {
        OPL3_ChannelWriteB0(chip2.channel[9 * high + (regm & 15)], v);
        if (v & 32) {
          OPL3_ChannelKeyOn(chip2.channel[9 * high + (regm & 15)]);
        } else {
          OPL3_ChannelKeyOff(chip2.channel[9 * high + (regm & 15)]);
        }
      }
      break;
    case 192:
      if ((regm & 15) < 9) {
        OPL3_ChannelWriteC0(chip2.channel[9 * high + (regm & 15)], v);
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
  generate(out) {
    for (let i = 0; i < out.length; i++) {
      this.sampleClock++;
      OPL3_Generate4ChResampled(this.chip, this.buf4);
      const s = this.buf4[0] / 32768;
      out[i] = s < -1 ? -1 : s > 1 ? 1 : s;
    }
  }
};

// tools/oplvalidate.ts
var capName = process.argv[2] ?? "D_E1M1";
var cap = readFileSync(`${capName}.oplcap`);
if (cap.toString("latin1", 0, 4) !== "OPLC") throw new Error("bad magic");
var rate = cap.readUInt32LE(4);
var N = cap.readUInt32LE(8);
var count = cap.readUInt32LE(12);
console.log(`rate=${rate} samples=${N} writes=${count}`);
var writes = [];
for (let i = 0; i < count; i++) {
  const o = 16 + i * 7;
  writes.push({ t: cap.readUInt32LE(o), reg: cap.readUInt16LE(o + 4), val: cap.readUInt8(o + 6) });
}
var chip = new OPL3(rate);
var pcm = new Int16Array(N);
var one = new Float32Array(1);
var wi = 0;
for (let t = 0; t < N; t++) {
  while (wi < count && writes[wi].t === t) {
    chip.write(writes[wi].reg, writes[wi].val);
    wi++;
  }
  chip.generate(one);
  pcm[t] = Math.round(one[0] * 32768);
}
var wav = Buffer.alloc(44 + N * 2);
wav.write("RIFF", 0);
wav.writeUInt32LE(36 + N * 2, 4);
wav.write("WAVE", 8);
wav.write("fmt ", 12);
wav.writeUInt32LE(16, 16);
wav.writeUInt16LE(1, 20);
wav.writeUInt16LE(1, 22);
wav.writeUInt32LE(rate, 24);
wav.writeUInt32LE(rate * 2, 28);
wav.writeUInt16LE(2, 32);
wav.writeUInt16LE(16, 34);
wav.write("data", 36);
wav.writeUInt32LE(N * 2, 40);
for (let i = 0; i < N; i++) wav.writeInt16LE(pcm[i], 44 + i * 2);
writeFileSync(`${capName}.ts.wav`, wav);
var ref = readFileSync(`${capName}.ref.wav`);
var p = 12;
while (ref.toString("latin1", p, p + 4) !== "data") p += 8 + ref.readUInt32LE(p + 4);
var dataLen = ref.readUInt32LE(p + 4);
var refBase = p + 8;
var refCount = Math.min(N, dataLen >> 1);
var maxDiff = 0;
var over2 = 0;
var firstDiffAt = -1;
var sumSq = 0;
for (let i = 0; i < refCount; i++) {
  const r = ref.readInt16LE(refBase + i * 2);
  const m = pcm[i];
  const d = Math.abs(r - m);
  if (d > maxDiff) maxDiff = d;
  if (d > 2) {
    over2++;
    if (firstDiffAt < 0) firstDiffAt = i;
  }
  sumSq += d * d;
}
console.log(`compared ${refCount} samples`);
console.log(`max abs sample diff: ${maxDiff} (LSB of 32768)`);
console.log(`samples differing by > 2 LSB: ${over2} (${(100 * over2 / refCount).toFixed(4)}%)`);
console.log(`RMS diff: ${Math.sqrt(sumSq / refCount).toFixed(4)}`);
if (firstDiffAt >= 0) {
  console.log(`first >2 diff at sample ${firstDiffAt}: ref=${ref.readInt16LE(refBase + firstDiffAt * 2)} ts=${pcm[firstDiffAt]}`);
}
