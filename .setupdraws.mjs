var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/m_random.ts
function setDrawLog(fn) {
  drawLog = fn;
}
function P_Random() {
  prndIndex = prndIndex + 1 & 255;
  prndCount++;
  const v = rndtable[prndIndex];
  drawLog?.(prndCount, v);
  return v;
}
function pRandomCount() {
  return prndCount;
}
function M_ClearRandom() {
  rndIndex = 0;
  prndIndex = 0;
}
var rndtable, rndIndex, prndIndex, prndCount, drawLog, RNDTABLE_SIZE;
var init_m_random = __esm({
  "src/m_random.ts"() {
    "use strict";
    rndtable = [
      0,
      8,
      109,
      220,
      222,
      241,
      149,
      107,
      75,
      248,
      254,
      140,
      16,
      66,
      74,
      21,
      211,
      47,
      80,
      242,
      154,
      27,
      205,
      128,
      161,
      89,
      77,
      36,
      95,
      110,
      85,
      48,
      212,
      140,
      211,
      249,
      22,
      79,
      200,
      50,
      28,
      188,
      52,
      140,
      202,
      120,
      68,
      145,
      62,
      70,
      184,
      190,
      91,
      197,
      152,
      224,
      149,
      104,
      25,
      178,
      252,
      182,
      202,
      182,
      141,
      197,
      4,
      81,
      181,
      242,
      145,
      42,
      39,
      227,
      156,
      198,
      225,
      193,
      219,
      93,
      122,
      175,
      249,
      0,
      175,
      143,
      70,
      239,
      46,
      246,
      163,
      53,
      163,
      109,
      168,
      135,
      2,
      235,
      25,
      92,
      20,
      145,
      138,
      77,
      69,
      166,
      78,
      176,
      173,
      212,
      166,
      113,
      94,
      161,
      41,
      50,
      239,
      49,
      111,
      164,
      70,
      60,
      2,
      37,
      171,
      75,
      136,
      156,
      11,
      56,
      42,
      146,
      138,
      229,
      73,
      146,
      77,
      61,
      98,
      196,
      135,
      106,
      63,
      197,
      195,
      86,
      96,
      203,
      113,
      101,
      170,
      247,
      181,
      113,
      80,
      250,
      108,
      7,
      255,
      237,
      129,
      226,
      79,
      107,
      112,
      166,
      103,
      241,
      24,
      223,
      239,
      120,
      198,
      58,
      60,
      82,
      128,
      3,
      184,
      66,
      143,
      224,
      145,
      224,
      81,
      206,
      163,
      45,
      63,
      90,
      168,
      114,
      59,
      33,
      159,
      95,
      28,
      139,
      123,
      98,
      125,
      196,
      15,
      70,
      194,
      253,
      54,
      14,
      109,
      226,
      71,
      17,
      161,
      93,
      186,
      87,
      244,
      138,
      20,
      52,
      123,
      251,
      26,
      36,
      17,
      46,
      52,
      231,
      232,
      76,
      31,
      221,
      84,
      37,
      216,
      165,
      212,
      106,
      197,
      242,
      98,
      43,
      39,
      175,
      254,
      145,
      190,
      84,
      118,
      222,
      187,
      136,
      120,
      163,
      236,
      249
    ];
    rndIndex = 0;
    prndIndex = 0;
    prndCount = 0;
    drawLog = null;
    RNDTABLE_SIZE = rndtable.length;
  }
});

// src/m_fixed.ts
function FixedMul(a, b) {
  const ah = a >> 16, al = a & 65535;
  const bh = b >> 16, bl = b & 65535;
  return (Math.imul(ah, bh) << 16) + Math.imul(ah, bl) + Math.imul(al, bh) + (al * bl >>> 16) | 0;
}
function FixedDiv(a, b) {
  const absA = Math.abs(a) | 0;
  const absB = Math.abs(b) | 0;
  if (absA >> 14 >= absB) {
    return (a ^ b) < 0 ? MININT : MAXINT;
  }
  return truncInt32(a / b * FRACUNIT);
}
function truncInt32(c) {
  return Math.trunc(c) | 0;
}
var FRACBITS, FRACUNIT, MININT, MAXINT;
var init_m_fixed = __esm({
  "src/m_fixed.ts"() {
    "use strict";
    FRACBITS = 16;
    FRACUNIT = 1 << FRACBITS;
    MININT = -2147483648;
    MAXINT = 2147483647;
  }
});

// src/info.ts
var MF, sprNames, states, mobjInfo, byDoomedNum, S, MT, ACTION_NAMES, weaponInfo, WP, AM, maxAmmo, clipAmmo;
var init_info = __esm({
  "src/info.ts"() {
    "use strict";
    MF = {
      MF_SPECIAL: 1,
      MF_SOLID: 2,
      MF_SHOOTABLE: 4,
      MF_NOSECTOR: 8,
      MF_NOBLOCKMAP: 16,
      MF_AMBUSH: 32,
      MF_JUSTHIT: 64,
      MF_JUSTATTACKED: 128,
      MF_SPAWNCEILING: 256,
      MF_NOGRAVITY: 512,
      MF_DROPOFF: 1024,
      MF_PICKUP: 2048,
      MF_NOCLIP: 4096,
      MF_SLIDE: 8192,
      MF_FLOAT: 16384,
      MF_TELEPORT: 32768,
      MF_MISSILE: 65536,
      MF_DROPPED: 131072,
      MF_SHADOW: 262144,
      MF_NOBLOOD: 524288,
      MF_CORPSE: 1048576,
      MF_INFLOAT: 2097152,
      MF_COUNTKILL: 4194304,
      MF_COUNTITEM: 8388608,
      MF_SKULLFLY: 16777216,
      MF_NOTDMATCH: 33554432,
      MF_TRANSLATION: 201326592,
      MF_TRANSSHIFT: 26
    };
    sprNames = ["TROO", "SHTG", "PUNG", "PISG", "PISF", "SHTF", "SHT2", "CHGG", "CHGF", "MISG", "MISF", "SAWG", "PLSG", "PLSF", "BFGG", "BFGF", "BLUD", "PUFF", "BAL1", "BAL2", "PLSS", "PLSE", "MISL", "BFS1", "BFE1", "BFE2", "TFOG", "IFOG", "PLAY", "POSS", "SPOS", "VILE", "FIRE", "FATB", "FBXP", "SKEL", "MANF", "FATT", "CPOS", "SARG", "HEAD", "BAL7", "BOSS", "BOS2", "SKUL", "SPID", "BSPI", "APLS", "APBX", "CYBR", "PAIN", "SSWV", "KEEN", "BBRN", "BOSF", "ARM1", "ARM2", "BAR1", "BEXP", "FCAN", "BON1", "BON2", "BKEY", "RKEY", "YKEY", "BSKU", "RSKU", "YSKU", "STIM", "MEDI", "SOUL", "PINV", "PSTR", "PINS", "MEGA", "SUIT", "PMAP", "PVIS", "CLIP", "AMMO", "ROCK", "BROK", "CELL", "CELP", "SHEL", "SBOX", "BPAK", "BFUG", "MGUN", "CSAW", "LAUN", "PLAS", "SHOT", "SGN2", "COLU", "SMT2", "GOR1", "POL2", "POL5", "POL4", "POL3", "POL1", "POL6", "GOR2", "GOR3", "GOR4", "GOR5", "SMIT", "COL1", "COL2", "COL3", "COL4", "CAND", "CBRA", "COL6", "TRE1", "TRE2", "ELEC", "CEYE", "FSKU", "COL5", "TBLU", "TGRN", "TRED", "SMBT", "SMGT", "SMRT", "HDB1", "HDB2", "HDB3", "HDB4", "HDB5", "HDB6", "POB1", "POB2", "BRS1", "TLMP", "TLP2"];
    states = [{ "sprite": 0, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 1, "frame": 4, "fullbright": false, "tics": 0, "action": "A_Light0", "nextState": 0 }, { "sprite": 2, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 2 }, { "sprite": 2, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 3 }, { "sprite": 2, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 4 }, { "sprite": 2, "frame": 1, "fullbright": false, "tics": 4, "action": null, "nextState": 6 }, { "sprite": 2, "frame": 2, "fullbright": false, "tics": 4, "action": "A_Punch", "nextState": 7 }, { "sprite": 2, "frame": 3, "fullbright": false, "tics": 5, "action": null, "nextState": 8 }, { "sprite": 2, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 9 }, { "sprite": 2, "frame": 1, "fullbright": false, "tics": 5, "action": "A_ReFire", "nextState": 2 }, { "sprite": 3, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 10 }, { "sprite": 3, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 11 }, { "sprite": 3, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 12 }, { "sprite": 3, "frame": 0, "fullbright": false, "tics": 4, "action": null, "nextState": 14 }, { "sprite": 3, "frame": 1, "fullbright": false, "tics": 6, "action": "A_FirePistol", "nextState": 15 }, { "sprite": 3, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 16 }, { "sprite": 3, "frame": 1, "fullbright": false, "tics": 5, "action": "A_ReFire", "nextState": 10 }, { "sprite": 4, "frame": 0, "fullbright": true, "tics": 7, "action": "A_Light1", "nextState": 1 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 18 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 19 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 20 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 3, "action": null, "nextState": 22 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 7, "action": "A_FireShotgun", "nextState": 23 }, { "sprite": 1, "frame": 1, "fullbright": false, "tics": 5, "action": null, "nextState": 24 }, { "sprite": 1, "frame": 2, "fullbright": false, "tics": 5, "action": null, "nextState": 25 }, { "sprite": 1, "frame": 3, "fullbright": false, "tics": 4, "action": null, "nextState": 26 }, { "sprite": 1, "frame": 2, "fullbright": false, "tics": 5, "action": null, "nextState": 27 }, { "sprite": 1, "frame": 1, "fullbright": false, "tics": 5, "action": null, "nextState": 28 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 3, "action": null, "nextState": 29 }, { "sprite": 1, "frame": 0, "fullbright": false, "tics": 7, "action": "A_ReFire", "nextState": 18 }, { "sprite": 5, "frame": 0, "fullbright": true, "tics": 4, "action": "A_Light1", "nextState": 31 }, { "sprite": 5, "frame": 1, "fullbright": true, "tics": 3, "action": "A_Light2", "nextState": 1 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 32 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 33 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 34 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 3, "action": null, "nextState": 36 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 7, "action": "A_FireShotgun2", "nextState": 37 }, { "sprite": 6, "frame": 1, "fullbright": false, "tics": 7, "action": null, "nextState": 38 }, { "sprite": 6, "frame": 2, "fullbright": false, "tics": 7, "action": "A_CheckReload", "nextState": 39 }, { "sprite": 6, "frame": 3, "fullbright": false, "tics": 7, "action": "A_OpenShotgun2", "nextState": 40 }, { "sprite": 6, "frame": 4, "fullbright": false, "tics": 7, "action": null, "nextState": 41 }, { "sprite": 6, "frame": 5, "fullbright": false, "tics": 7, "action": "A_LoadShotgun2", "nextState": 42 }, { "sprite": 6, "frame": 6, "fullbright": false, "tics": 6, "action": null, "nextState": 43 }, { "sprite": 6, "frame": 7, "fullbright": false, "tics": 6, "action": "A_CloseShotgun2", "nextState": 44 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 5, "action": "A_ReFire", "nextState": 32 }, { "sprite": 6, "frame": 1, "fullbright": false, "tics": 7, "action": null, "nextState": 46 }, { "sprite": 6, "frame": 0, "fullbright": false, "tics": 3, "action": null, "nextState": 33 }, { "sprite": 6, "frame": 8, "fullbright": true, "tics": 5, "action": "A_Light1", "nextState": 48 }, { "sprite": 6, "frame": 9, "fullbright": true, "tics": 4, "action": "A_Light2", "nextState": 1 }, { "sprite": 7, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 49 }, { "sprite": 7, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 50 }, { "sprite": 7, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 51 }, { "sprite": 7, "frame": 0, "fullbright": false, "tics": 4, "action": "A_FireCGun", "nextState": 53 }, { "sprite": 7, "frame": 1, "fullbright": false, "tics": 4, "action": "A_FireCGun", "nextState": 54 }, { "sprite": 7, "frame": 1, "fullbright": false, "tics": 0, "action": "A_ReFire", "nextState": 49 }, { "sprite": 8, "frame": 0, "fullbright": true, "tics": 5, "action": "A_Light1", "nextState": 1 }, { "sprite": 8, "frame": 1, "fullbright": true, "tics": 5, "action": "A_Light2", "nextState": 1 }, { "sprite": 9, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 57 }, { "sprite": 9, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 58 }, { "sprite": 9, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 59 }, { "sprite": 9, "frame": 1, "fullbright": false, "tics": 8, "action": "A_GunFlash", "nextState": 61 }, { "sprite": 9, "frame": 1, "fullbright": false, "tics": 12, "action": "A_FireMissile", "nextState": 62 }, { "sprite": 9, "frame": 1, "fullbright": false, "tics": 0, "action": "A_ReFire", "nextState": 57 }, { "sprite": 10, "frame": 0, "fullbright": true, "tics": 3, "action": "A_Light1", "nextState": 64 }, { "sprite": 10, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 65 }, { "sprite": 10, "frame": 2, "fullbright": true, "tics": 4, "action": "A_Light2", "nextState": 66 }, { "sprite": 10, "frame": 3, "fullbright": true, "tics": 4, "action": "A_Light2", "nextState": 1 }, { "sprite": 11, "frame": 2, "fullbright": false, "tics": 4, "action": "A_WeaponReady", "nextState": 68 }, { "sprite": 11, "frame": 3, "fullbright": false, "tics": 4, "action": "A_WeaponReady", "nextState": 67 }, { "sprite": 11, "frame": 2, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 69 }, { "sprite": 11, "frame": 2, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 70 }, { "sprite": 11, "frame": 0, "fullbright": false, "tics": 4, "action": "A_Saw", "nextState": 72 }, { "sprite": 11, "frame": 1, "fullbright": false, "tics": 4, "action": "A_Saw", "nextState": 73 }, { "sprite": 11, "frame": 1, "fullbright": false, "tics": 0, "action": "A_ReFire", "nextState": 67 }, { "sprite": 12, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 74 }, { "sprite": 12, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 75 }, { "sprite": 12, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 76 }, { "sprite": 12, "frame": 0, "fullbright": false, "tics": 3, "action": "A_FirePlasma", "nextState": 78 }, { "sprite": 12, "frame": 1, "fullbright": false, "tics": 20, "action": "A_ReFire", "nextState": 74 }, { "sprite": 13, "frame": 0, "fullbright": true, "tics": 4, "action": "A_Light1", "nextState": 1 }, { "sprite": 13, "frame": 1, "fullbright": true, "tics": 4, "action": "A_Light1", "nextState": 1 }, { "sprite": 14, "frame": 0, "fullbright": false, "tics": 1, "action": "A_WeaponReady", "nextState": 81 }, { "sprite": 14, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Lower", "nextState": 82 }, { "sprite": 14, "frame": 0, "fullbright": false, "tics": 1, "action": "A_Raise", "nextState": 83 }, { "sprite": 14, "frame": 0, "fullbright": false, "tics": 20, "action": "A_BFGsound", "nextState": 85 }, { "sprite": 14, "frame": 1, "fullbright": false, "tics": 10, "action": "A_GunFlash", "nextState": 86 }, { "sprite": 14, "frame": 1, "fullbright": false, "tics": 10, "action": "A_FireBFG", "nextState": 87 }, { "sprite": 14, "frame": 1, "fullbright": false, "tics": 20, "action": "A_ReFire", "nextState": 81 }, { "sprite": 15, "frame": 0, "fullbright": true, "tics": 11, "action": "A_Light1", "nextState": 89 }, { "sprite": 15, "frame": 1, "fullbright": true, "tics": 6, "action": "A_Light2", "nextState": 1 }, { "sprite": 16, "frame": 2, "fullbright": false, "tics": 8, "action": null, "nextState": 91 }, { "sprite": 16, "frame": 1, "fullbright": false, "tics": 8, "action": null, "nextState": 92 }, { "sprite": 16, "frame": 0, "fullbright": false, "tics": 8, "action": null, "nextState": 0 }, { "sprite": 17, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 94 }, { "sprite": 17, "frame": 1, "fullbright": false, "tics": 4, "action": null, "nextState": 95 }, { "sprite": 17, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 96 }, { "sprite": 17, "frame": 3, "fullbright": false, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 18, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 98 }, { "sprite": 18, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 97 }, { "sprite": 18, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 100 }, { "sprite": 18, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 101 }, { "sprite": 18, "frame": 4, "fullbright": true, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 19, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 103 }, { "sprite": 19, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 102 }, { "sprite": 19, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 105 }, { "sprite": 19, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 106 }, { "sprite": 19, "frame": 4, "fullbright": true, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 20, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 108 }, { "sprite": 20, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 107 }, { "sprite": 21, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 110 }, { "sprite": 21, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 111 }, { "sprite": 21, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 112 }, { "sprite": 21, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 113 }, { "sprite": 21, "frame": 4, "fullbright": true, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 22, "frame": 0, "fullbright": true, "tics": 1, "action": null, "nextState": 114 }, { "sprite": 23, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 116 }, { "sprite": 23, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 115 }, { "sprite": 24, "frame": 0, "fullbright": true, "tics": 8, "action": null, "nextState": 118 }, { "sprite": 24, "frame": 1, "fullbright": true, "tics": 8, "action": null, "nextState": 119 }, { "sprite": 24, "frame": 2, "fullbright": true, "tics": 8, "action": "A_BFGSpray", "nextState": 120 }, { "sprite": 24, "frame": 3, "fullbright": true, "tics": 8, "action": null, "nextState": 121 }, { "sprite": 24, "frame": 4, "fullbright": true, "tics": 8, "action": null, "nextState": 122 }, { "sprite": 24, "frame": 5, "fullbright": true, "tics": 8, "action": null, "nextState": 0 }, { "sprite": 25, "frame": 0, "fullbright": true, "tics": 8, "action": null, "nextState": 124 }, { "sprite": 25, "frame": 1, "fullbright": true, "tics": 8, "action": null, "nextState": 125 }, { "sprite": 25, "frame": 2, "fullbright": true, "tics": 8, "action": null, "nextState": 126 }, { "sprite": 25, "frame": 3, "fullbright": true, "tics": 8, "action": null, "nextState": 0 }, { "sprite": 22, "frame": 1, "fullbright": true, "tics": 8, "action": "A_Explode", "nextState": 128 }, { "sprite": 22, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 129 }, { "sprite": 22, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 26, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 131 }, { "sprite": 26, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 132 }, { "sprite": 26, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 133 }, { "sprite": 26, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 134 }, { "sprite": 26, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 135 }, { "sprite": 26, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 136 }, { "sprite": 26, "frame": 4, "fullbright": true, "tics": 6, "action": null, "nextState": 137 }, { "sprite": 26, "frame": 5, "fullbright": true, "tics": 6, "action": null, "nextState": 138 }, { "sprite": 26, "frame": 6, "fullbright": true, "tics": 6, "action": null, "nextState": 139 }, { "sprite": 26, "frame": 7, "fullbright": true, "tics": 6, "action": null, "nextState": 140 }, { "sprite": 26, "frame": 8, "fullbright": true, "tics": 6, "action": null, "nextState": 141 }, { "sprite": 26, "frame": 9, "fullbright": true, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 27, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 143 }, { "sprite": 27, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 144 }, { "sprite": 27, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 145 }, { "sprite": 27, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 146 }, { "sprite": 27, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 147 }, { "sprite": 27, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 148 }, { "sprite": 27, "frame": 4, "fullbright": true, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 28, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 28, "frame": 0, "fullbright": false, "tics": 4, "action": null, "nextState": 151 }, { "sprite": 28, "frame": 1, "fullbright": false, "tics": 4, "action": null, "nextState": 152 }, { "sprite": 28, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 153 }, { "sprite": 28, "frame": 3, "fullbright": false, "tics": 4, "action": null, "nextState": 150 }, { "sprite": 28, "frame": 4, "fullbright": false, "tics": 12, "action": null, "nextState": 149 }, { "sprite": 28, "frame": 5, "fullbright": true, "tics": 6, "action": null, "nextState": 154 }, { "sprite": 28, "frame": 6, "fullbright": false, "tics": 4, "action": null, "nextState": 157 }, { "sprite": 28, "frame": 6, "fullbright": false, "tics": 4, "action": "A_Pain", "nextState": 149 }, { "sprite": 28, "frame": 7, "fullbright": false, "tics": 10, "action": null, "nextState": 159 }, { "sprite": 28, "frame": 8, "fullbright": false, "tics": 10, "action": "A_PlayerScream", "nextState": 160 }, { "sprite": 28, "frame": 9, "fullbright": false, "tics": 10, "action": "A_Fall", "nextState": 161 }, { "sprite": 28, "frame": 10, "fullbright": false, "tics": 10, "action": null, "nextState": 162 }, { "sprite": 28, "frame": 11, "fullbright": false, "tics": 10, "action": null, "nextState": 163 }, { "sprite": 28, "frame": 12, "fullbright": false, "tics": 10, "action": null, "nextState": 164 }, { "sprite": 28, "frame": 13, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 28, "frame": 14, "fullbright": false, "tics": 5, "action": null, "nextState": 166 }, { "sprite": 28, "frame": 15, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 167 }, { "sprite": 28, "frame": 16, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 168 }, { "sprite": 28, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 169 }, { "sprite": 28, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 170 }, { "sprite": 28, "frame": 19, "fullbright": false, "tics": 5, "action": null, "nextState": 171 }, { "sprite": 28, "frame": 20, "fullbright": false, "tics": 5, "action": null, "nextState": 172 }, { "sprite": 28, "frame": 21, "fullbright": false, "tics": 5, "action": null, "nextState": 173 }, { "sprite": 28, "frame": 22, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 29, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 175 }, { "sprite": 29, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 174 }, { "sprite": 29, "frame": 0, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 177 }, { "sprite": 29, "frame": 0, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 178 }, { "sprite": 29, "frame": 1, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 179 }, { "sprite": 29, "frame": 1, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 180 }, { "sprite": 29, "frame": 2, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 181 }, { "sprite": 29, "frame": 2, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 182 }, { "sprite": 29, "frame": 3, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 183 }, { "sprite": 29, "frame": 3, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 176 }, { "sprite": 29, "frame": 4, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 185 }, { "sprite": 29, "frame": 5, "fullbright": false, "tics": 8, "action": "A_PosAttack", "nextState": 186 }, { "sprite": 29, "frame": 4, "fullbright": false, "tics": 8, "action": null, "nextState": 176 }, { "sprite": 29, "frame": 6, "fullbright": false, "tics": 3, "action": null, "nextState": 188 }, { "sprite": 29, "frame": 6, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 176 }, { "sprite": 29, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 190 }, { "sprite": 29, "frame": 8, "fullbright": false, "tics": 5, "action": "A_Scream", "nextState": 191 }, { "sprite": 29, "frame": 9, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 192 }, { "sprite": 29, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 193 }, { "sprite": 29, "frame": 11, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 29, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 195 }, { "sprite": 29, "frame": 13, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 196 }, { "sprite": 29, "frame": 14, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 197 }, { "sprite": 29, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 198 }, { "sprite": 29, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 199 }, { "sprite": 29, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 200 }, { "sprite": 29, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 201 }, { "sprite": 29, "frame": 19, "fullbright": false, "tics": 5, "action": null, "nextState": 202 }, { "sprite": 29, "frame": 20, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 29, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 204 }, { "sprite": 29, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 205 }, { "sprite": 29, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 206 }, { "sprite": 29, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 176 }, { "sprite": 30, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 208 }, { "sprite": 30, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 207 }, { "sprite": 30, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 210 }, { "sprite": 30, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 211 }, { "sprite": 30, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 212 }, { "sprite": 30, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 213 }, { "sprite": 30, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 214 }, { "sprite": 30, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 215 }, { "sprite": 30, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 216 }, { "sprite": 30, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 209 }, { "sprite": 30, "frame": 4, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 218 }, { "sprite": 30, "frame": 5, "fullbright": true, "tics": 10, "action": "A_SPosAttack", "nextState": 219 }, { "sprite": 30, "frame": 4, "fullbright": false, "tics": 10, "action": null, "nextState": 209 }, { "sprite": 30, "frame": 6, "fullbright": false, "tics": 3, "action": null, "nextState": 221 }, { "sprite": 30, "frame": 6, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 209 }, { "sprite": 30, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 223 }, { "sprite": 30, "frame": 8, "fullbright": false, "tics": 5, "action": "A_Scream", "nextState": 224 }, { "sprite": 30, "frame": 9, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 225 }, { "sprite": 30, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 226 }, { "sprite": 30, "frame": 11, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 30, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 228 }, { "sprite": 30, "frame": 13, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 229 }, { "sprite": 30, "frame": 14, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 230 }, { "sprite": 30, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 231 }, { "sprite": 30, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 232 }, { "sprite": 30, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 233 }, { "sprite": 30, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 234 }, { "sprite": 30, "frame": 19, "fullbright": false, "tics": 5, "action": null, "nextState": 235 }, { "sprite": 30, "frame": 20, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 30, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 237 }, { "sprite": 30, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 238 }, { "sprite": 30, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 239 }, { "sprite": 30, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 240 }, { "sprite": 30, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 209 }, { "sprite": 31, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 242 }, { "sprite": 31, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 241 }, { "sprite": 31, "frame": 0, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 244 }, { "sprite": 31, "frame": 0, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 245 }, { "sprite": 31, "frame": 1, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 246 }, { "sprite": 31, "frame": 1, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 247 }, { "sprite": 31, "frame": 2, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 248 }, { "sprite": 31, "frame": 2, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 249 }, { "sprite": 31, "frame": 3, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 250 }, { "sprite": 31, "frame": 3, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 251 }, { "sprite": 31, "frame": 4, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 252 }, { "sprite": 31, "frame": 4, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 253 }, { "sprite": 31, "frame": 5, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 254 }, { "sprite": 31, "frame": 5, "fullbright": false, "tics": 2, "action": "A_VileChase", "nextState": 243 }, { "sprite": 31, "frame": 6, "fullbright": true, "tics": 0, "action": "A_VileStart", "nextState": 256 }, { "sprite": 31, "frame": 6, "fullbright": true, "tics": 10, "action": "A_FaceTarget", "nextState": 257 }, { "sprite": 31, "frame": 7, "fullbright": true, "tics": 8, "action": "A_VileTarget", "nextState": 258 }, { "sprite": 31, "frame": 8, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 259 }, { "sprite": 31, "frame": 9, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 260 }, { "sprite": 31, "frame": 10, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 261 }, { "sprite": 31, "frame": 11, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 262 }, { "sprite": 31, "frame": 12, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 263 }, { "sprite": 31, "frame": 13, "fullbright": true, "tics": 8, "action": "A_FaceTarget", "nextState": 264 }, { "sprite": 31, "frame": 14, "fullbright": true, "tics": 8, "action": "A_VileAttack", "nextState": 265 }, { "sprite": 31, "frame": 15, "fullbright": true, "tics": 20, "action": null, "nextState": 243 }, { "sprite": 31, "frame": 26, "fullbright": true, "tics": 10, "action": null, "nextState": 267 }, { "sprite": 31, "frame": 27, "fullbright": true, "tics": 10, "action": null, "nextState": 268 }, { "sprite": 31, "frame": 28, "fullbright": true, "tics": 10, "action": null, "nextState": 243 }, { "sprite": 31, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 270 }, { "sprite": 31, "frame": 16, "fullbright": false, "tics": 5, "action": "A_Pain", "nextState": 243 }, { "sprite": 31, "frame": 16, "fullbright": false, "tics": 7, "action": null, "nextState": 272 }, { "sprite": 31, "frame": 17, "fullbright": false, "tics": 7, "action": "A_Scream", "nextState": 273 }, { "sprite": 31, "frame": 18, "fullbright": false, "tics": 7, "action": "A_Fall", "nextState": 274 }, { "sprite": 31, "frame": 19, "fullbright": false, "tics": 7, "action": null, "nextState": 275 }, { "sprite": 31, "frame": 20, "fullbright": false, "tics": 7, "action": null, "nextState": 276 }, { "sprite": 31, "frame": 21, "fullbright": false, "tics": 7, "action": null, "nextState": 277 }, { "sprite": 31, "frame": 22, "fullbright": false, "tics": 7, "action": null, "nextState": 278 }, { "sprite": 31, "frame": 23, "fullbright": false, "tics": 5, "action": null, "nextState": 279 }, { "sprite": 31, "frame": 24, "fullbright": false, "tics": 5, "action": null, "nextState": 280 }, { "sprite": 31, "frame": 25, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 32, "frame": 0, "fullbright": true, "tics": 2, "action": "A_StartFire", "nextState": 282 }, { "sprite": 32, "frame": 1, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 283 }, { "sprite": 32, "frame": 0, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 284 }, { "sprite": 32, "frame": 1, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 285 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 2, "action": "A_FireCrackle", "nextState": 286 }, { "sprite": 32, "frame": 1, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 287 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 288 }, { "sprite": 32, "frame": 1, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 289 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 290 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 291 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 292 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 293 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 294 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 295 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 296 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 297 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 298 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 299 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 2, "action": "A_FireCrackle", "nextState": 300 }, { "sprite": 32, "frame": 5, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 301 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 302 }, { "sprite": 32, "frame": 5, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 303 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 304 }, { "sprite": 32, "frame": 5, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 305 }, { "sprite": 32, "frame": 6, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 306 }, { "sprite": 32, "frame": 7, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 307 }, { "sprite": 32, "frame": 6, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 308 }, { "sprite": 32, "frame": 7, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 309 }, { "sprite": 32, "frame": 6, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 310 }, { "sprite": 32, "frame": 7, "fullbright": true, "tics": 2, "action": "A_Fire", "nextState": 0 }, { "sprite": 17, "frame": 1, "fullbright": false, "tics": 4, "action": null, "nextState": 312 }, { "sprite": 17, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 313 }, { "sprite": 17, "frame": 1, "fullbright": false, "tics": 4, "action": null, "nextState": 314 }, { "sprite": 17, "frame": 2, "fullbright": false, "tics": 4, "action": null, "nextState": 315 }, { "sprite": 17, "frame": 3, "fullbright": false, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 33, "frame": 0, "fullbright": true, "tics": 2, "action": "A_Tracer", "nextState": 317 }, { "sprite": 33, "frame": 1, "fullbright": true, "tics": 2, "action": "A_Tracer", "nextState": 316 }, { "sprite": 34, "frame": 0, "fullbright": true, "tics": 8, "action": null, "nextState": 319 }, { "sprite": 34, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 320 }, { "sprite": 34, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 35, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 322 }, { "sprite": 35, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 321 }, { "sprite": 35, "frame": 0, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 324 }, { "sprite": 35, "frame": 0, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 325 }, { "sprite": 35, "frame": 1, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 326 }, { "sprite": 35, "frame": 1, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 327 }, { "sprite": 35, "frame": 2, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 328 }, { "sprite": 35, "frame": 2, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 329 }, { "sprite": 35, "frame": 3, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 330 }, { "sprite": 35, "frame": 3, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 331 }, { "sprite": 35, "frame": 4, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 332 }, { "sprite": 35, "frame": 4, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 333 }, { "sprite": 35, "frame": 5, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 334 }, { "sprite": 35, "frame": 5, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 323 }, { "sprite": 35, "frame": 6, "fullbright": false, "tics": 0, "action": "A_FaceTarget", "nextState": 336 }, { "sprite": 35, "frame": 6, "fullbright": false, "tics": 6, "action": "A_SkelWhoosh", "nextState": 337 }, { "sprite": 35, "frame": 7, "fullbright": false, "tics": 6, "action": "A_FaceTarget", "nextState": 338 }, { "sprite": 35, "frame": 8, "fullbright": false, "tics": 6, "action": "A_SkelFist", "nextState": 323 }, { "sprite": 35, "frame": 9, "fullbright": true, "tics": 0, "action": "A_FaceTarget", "nextState": 340 }, { "sprite": 35, "frame": 9, "fullbright": true, "tics": 10, "action": "A_FaceTarget", "nextState": 341 }, { "sprite": 35, "frame": 10, "fullbright": false, "tics": 10, "action": "A_SkelMissile", "nextState": 342 }, { "sprite": 35, "frame": 10, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 323 }, { "sprite": 35, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 344 }, { "sprite": 35, "frame": 11, "fullbright": false, "tics": 5, "action": "A_Pain", "nextState": 323 }, { "sprite": 35, "frame": 11, "fullbright": false, "tics": 7, "action": null, "nextState": 346 }, { "sprite": 35, "frame": 12, "fullbright": false, "tics": 7, "action": null, "nextState": 347 }, { "sprite": 35, "frame": 13, "fullbright": false, "tics": 7, "action": "A_Scream", "nextState": 348 }, { "sprite": 35, "frame": 14, "fullbright": false, "tics": 7, "action": "A_Fall", "nextState": 349 }, { "sprite": 35, "frame": 15, "fullbright": false, "tics": 7, "action": null, "nextState": 350 }, { "sprite": 35, "frame": 16, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 35, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 352 }, { "sprite": 35, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 353 }, { "sprite": 35, "frame": 14, "fullbright": false, "tics": 5, "action": null, "nextState": 354 }, { "sprite": 35, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 355 }, { "sprite": 35, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 356 }, { "sprite": 35, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 323 }, { "sprite": 36, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 358 }, { "sprite": 36, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 357 }, { "sprite": 22, "frame": 1, "fullbright": true, "tics": 8, "action": null, "nextState": 360 }, { "sprite": 22, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 361 }, { "sprite": 22, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 0 }, { "sprite": 37, "frame": 0, "fullbright": false, "tics": 15, "action": "A_Look", "nextState": 363 }, { "sprite": 37, "frame": 1, "fullbright": false, "tics": 15, "action": "A_Look", "nextState": 362 }, { "sprite": 37, "frame": 0, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 365 }, { "sprite": 37, "frame": 0, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 366 }, { "sprite": 37, "frame": 1, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 367 }, { "sprite": 37, "frame": 1, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 368 }, { "sprite": 37, "frame": 2, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 369 }, { "sprite": 37, "frame": 2, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 370 }, { "sprite": 37, "frame": 3, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 371 }, { "sprite": 37, "frame": 3, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 372 }, { "sprite": 37, "frame": 4, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 373 }, { "sprite": 37, "frame": 4, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 374 }, { "sprite": 37, "frame": 5, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 375 }, { "sprite": 37, "frame": 5, "fullbright": false, "tics": 4, "action": "A_Chase", "nextState": 364 }, { "sprite": 37, "frame": 6, "fullbright": false, "tics": 20, "action": "A_FatRaise", "nextState": 377 }, { "sprite": 37, "frame": 7, "fullbright": true, "tics": 10, "action": "A_FatAttack1", "nextState": 378 }, { "sprite": 37, "frame": 8, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 379 }, { "sprite": 37, "frame": 6, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 380 }, { "sprite": 37, "frame": 7, "fullbright": true, "tics": 10, "action": "A_FatAttack2", "nextState": 381 }, { "sprite": 37, "frame": 8, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 382 }, { "sprite": 37, "frame": 6, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 383 }, { "sprite": 37, "frame": 7, "fullbright": true, "tics": 10, "action": "A_FatAttack3", "nextState": 384 }, { "sprite": 37, "frame": 8, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 385 }, { "sprite": 37, "frame": 6, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 364 }, { "sprite": 37, "frame": 9, "fullbright": false, "tics": 3, "action": null, "nextState": 387 }, { "sprite": 37, "frame": 9, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 364 }, { "sprite": 37, "frame": 10, "fullbright": false, "tics": 6, "action": null, "nextState": 389 }, { "sprite": 37, "frame": 11, "fullbright": false, "tics": 6, "action": "A_Scream", "nextState": 390 }, { "sprite": 37, "frame": 12, "fullbright": false, "tics": 6, "action": "A_Fall", "nextState": 391 }, { "sprite": 37, "frame": 13, "fullbright": false, "tics": 6, "action": null, "nextState": 392 }, { "sprite": 37, "frame": 14, "fullbright": false, "tics": 6, "action": null, "nextState": 393 }, { "sprite": 37, "frame": 15, "fullbright": false, "tics": 6, "action": null, "nextState": 394 }, { "sprite": 37, "frame": 16, "fullbright": false, "tics": 6, "action": null, "nextState": 395 }, { "sprite": 37, "frame": 17, "fullbright": false, "tics": 6, "action": null, "nextState": 396 }, { "sprite": 37, "frame": 18, "fullbright": false, "tics": 6, "action": null, "nextState": 397 }, { "sprite": 37, "frame": 19, "fullbright": false, "tics": -1, "action": "A_BossDeath", "nextState": 0 }, { "sprite": 37, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 399 }, { "sprite": 37, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 400 }, { "sprite": 37, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 401 }, { "sprite": 37, "frame": 14, "fullbright": false, "tics": 5, "action": null, "nextState": 402 }, { "sprite": 37, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 403 }, { "sprite": 37, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 404 }, { "sprite": 37, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 405 }, { "sprite": 37, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 364 }, { "sprite": 38, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 407 }, { "sprite": 38, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 406 }, { "sprite": 38, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 409 }, { "sprite": 38, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 410 }, { "sprite": 38, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 411 }, { "sprite": 38, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 412 }, { "sprite": 38, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 413 }, { "sprite": 38, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 414 }, { "sprite": 38, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 415 }, { "sprite": 38, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 408 }, { "sprite": 38, "frame": 4, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 417 }, { "sprite": 38, "frame": 5, "fullbright": true, "tics": 4, "action": "A_CPosAttack", "nextState": 418 }, { "sprite": 38, "frame": 4, "fullbright": true, "tics": 4, "action": "A_CPosAttack", "nextState": 419 }, { "sprite": 38, "frame": 5, "fullbright": false, "tics": 1, "action": "A_CPosRefire", "nextState": 417 }, { "sprite": 38, "frame": 6, "fullbright": false, "tics": 3, "action": null, "nextState": 421 }, { "sprite": 38, "frame": 6, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 408 }, { "sprite": 38, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 423 }, { "sprite": 38, "frame": 8, "fullbright": false, "tics": 5, "action": "A_Scream", "nextState": 424 }, { "sprite": 38, "frame": 9, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 425 }, { "sprite": 38, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 426 }, { "sprite": 38, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 427 }, { "sprite": 38, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 428 }, { "sprite": 38, "frame": 13, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 38, "frame": 14, "fullbright": false, "tics": 5, "action": null, "nextState": 430 }, { "sprite": 38, "frame": 15, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 431 }, { "sprite": 38, "frame": 16, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 432 }, { "sprite": 38, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 433 }, { "sprite": 38, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 434 }, { "sprite": 38, "frame": 19, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 38, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 436 }, { "sprite": 38, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 437 }, { "sprite": 38, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 438 }, { "sprite": 38, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 439 }, { "sprite": 38, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 440 }, { "sprite": 38, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 441 }, { "sprite": 38, "frame": 7, "fullbright": false, "tics": 5, "action": null, "nextState": 408 }, { "sprite": 0, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 443 }, { "sprite": 0, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 442 }, { "sprite": 0, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 445 }, { "sprite": 0, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 446 }, { "sprite": 0, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 447 }, { "sprite": 0, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 448 }, { "sprite": 0, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 449 }, { "sprite": 0, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 450 }, { "sprite": 0, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 451 }, { "sprite": 0, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 444 }, { "sprite": 0, "frame": 4, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 453 }, { "sprite": 0, "frame": 5, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 454 }, { "sprite": 0, "frame": 6, "fullbright": false, "tics": 6, "action": "A_TroopAttack", "nextState": 444 }, { "sprite": 0, "frame": 7, "fullbright": false, "tics": 2, "action": null, "nextState": 456 }, { "sprite": 0, "frame": 7, "fullbright": false, "tics": 2, "action": "A_Pain", "nextState": 444 }, { "sprite": 0, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 458 }, { "sprite": 0, "frame": 9, "fullbright": false, "tics": 8, "action": "A_Scream", "nextState": 459 }, { "sprite": 0, "frame": 10, "fullbright": false, "tics": 6, "action": null, "nextState": 460 }, { "sprite": 0, "frame": 11, "fullbright": false, "tics": 6, "action": "A_Fall", "nextState": 461 }, { "sprite": 0, "frame": 12, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 0, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 463 }, { "sprite": 0, "frame": 14, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 464 }, { "sprite": 0, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 465 }, { "sprite": 0, "frame": 16, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 466 }, { "sprite": 0, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 467 }, { "sprite": 0, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 468 }, { "sprite": 0, "frame": 19, "fullbright": false, "tics": 5, "action": null, "nextState": 469 }, { "sprite": 0, "frame": 20, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 0, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 471 }, { "sprite": 0, "frame": 11, "fullbright": false, "tics": 8, "action": null, "nextState": 472 }, { "sprite": 0, "frame": 10, "fullbright": false, "tics": 6, "action": null, "nextState": 473 }, { "sprite": 0, "frame": 9, "fullbright": false, "tics": 6, "action": null, "nextState": 474 }, { "sprite": 0, "frame": 8, "fullbright": false, "tics": 6, "action": null, "nextState": 444 }, { "sprite": 39, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 476 }, { "sprite": 39, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 475 }, { "sprite": 39, "frame": 0, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 478 }, { "sprite": 39, "frame": 0, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 479 }, { "sprite": 39, "frame": 1, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 480 }, { "sprite": 39, "frame": 1, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 481 }, { "sprite": 39, "frame": 2, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 482 }, { "sprite": 39, "frame": 2, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 483 }, { "sprite": 39, "frame": 3, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 484 }, { "sprite": 39, "frame": 3, "fullbright": false, "tics": 2, "action": "A_Chase", "nextState": 477 }, { "sprite": 39, "frame": 4, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 486 }, { "sprite": 39, "frame": 5, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 487 }, { "sprite": 39, "frame": 6, "fullbright": false, "tics": 8, "action": "A_SargAttack", "nextState": 477 }, { "sprite": 39, "frame": 7, "fullbright": false, "tics": 2, "action": null, "nextState": 489 }, { "sprite": 39, "frame": 7, "fullbright": false, "tics": 2, "action": "A_Pain", "nextState": 477 }, { "sprite": 39, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 491 }, { "sprite": 39, "frame": 9, "fullbright": false, "tics": 8, "action": "A_Scream", "nextState": 492 }, { "sprite": 39, "frame": 10, "fullbright": false, "tics": 4, "action": null, "nextState": 493 }, { "sprite": 39, "frame": 11, "fullbright": false, "tics": 4, "action": "A_Fall", "nextState": 494 }, { "sprite": 39, "frame": 12, "fullbright": false, "tics": 4, "action": null, "nextState": 495 }, { "sprite": 39, "frame": 13, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 39, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 497 }, { "sprite": 39, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 498 }, { "sprite": 39, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 499 }, { "sprite": 39, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 500 }, { "sprite": 39, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 501 }, { "sprite": 39, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 477 }, { "sprite": 40, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 502 }, { "sprite": 40, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 503 }, { "sprite": 40, "frame": 1, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 505 }, { "sprite": 40, "frame": 2, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 506 }, { "sprite": 40, "frame": 3, "fullbright": true, "tics": 5, "action": "A_HeadAttack", "nextState": 503 }, { "sprite": 40, "frame": 4, "fullbright": false, "tics": 3, "action": null, "nextState": 508 }, { "sprite": 40, "frame": 4, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 509 }, { "sprite": 40, "frame": 5, "fullbright": false, "tics": 6, "action": null, "nextState": 503 }, { "sprite": 40, "frame": 6, "fullbright": false, "tics": 8, "action": null, "nextState": 511 }, { "sprite": 40, "frame": 7, "fullbright": false, "tics": 8, "action": "A_Scream", "nextState": 512 }, { "sprite": 40, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 513 }, { "sprite": 40, "frame": 9, "fullbright": false, "tics": 8, "action": null, "nextState": 514 }, { "sprite": 40, "frame": 10, "fullbright": false, "tics": 8, "action": "A_Fall", "nextState": 515 }, { "sprite": 40, "frame": 11, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 40, "frame": 11, "fullbright": false, "tics": 8, "action": null, "nextState": 517 }, { "sprite": 40, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 518 }, { "sprite": 40, "frame": 9, "fullbright": false, "tics": 8, "action": null, "nextState": 519 }, { "sprite": 40, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 520 }, { "sprite": 40, "frame": 7, "fullbright": false, "tics": 8, "action": null, "nextState": 521 }, { "sprite": 40, "frame": 6, "fullbright": false, "tics": 8, "action": null, "nextState": 503 }, { "sprite": 41, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 523 }, { "sprite": 41, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 522 }, { "sprite": 41, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 525 }, { "sprite": 41, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 526 }, { "sprite": 41, "frame": 4, "fullbright": true, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 42, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 528 }, { "sprite": 42, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 527 }, { "sprite": 42, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 530 }, { "sprite": 42, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 531 }, { "sprite": 42, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 532 }, { "sprite": 42, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 533 }, { "sprite": 42, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 534 }, { "sprite": 42, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 535 }, { "sprite": 42, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 536 }, { "sprite": 42, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 529 }, { "sprite": 42, "frame": 4, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 538 }, { "sprite": 42, "frame": 5, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 539 }, { "sprite": 42, "frame": 6, "fullbright": false, "tics": 8, "action": "A_BruisAttack", "nextState": 529 }, { "sprite": 42, "frame": 7, "fullbright": false, "tics": 2, "action": null, "nextState": 541 }, { "sprite": 42, "frame": 7, "fullbright": false, "tics": 2, "action": "A_Pain", "nextState": 529 }, { "sprite": 42, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 543 }, { "sprite": 42, "frame": 9, "fullbright": false, "tics": 8, "action": "A_Scream", "nextState": 544 }, { "sprite": 42, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 545 }, { "sprite": 42, "frame": 11, "fullbright": false, "tics": 8, "action": "A_Fall", "nextState": 546 }, { "sprite": 42, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 547 }, { "sprite": 42, "frame": 13, "fullbright": false, "tics": 8, "action": null, "nextState": 548 }, { "sprite": 42, "frame": 14, "fullbright": false, "tics": -1, "action": "A_BossDeath", "nextState": 0 }, { "sprite": 42, "frame": 14, "fullbright": false, "tics": 8, "action": null, "nextState": 550 }, { "sprite": 42, "frame": 13, "fullbright": false, "tics": 8, "action": null, "nextState": 551 }, { "sprite": 42, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 552 }, { "sprite": 42, "frame": 11, "fullbright": false, "tics": 8, "action": null, "nextState": 553 }, { "sprite": 42, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 554 }, { "sprite": 42, "frame": 9, "fullbright": false, "tics": 8, "action": null, "nextState": 555 }, { "sprite": 42, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 529 }, { "sprite": 43, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 557 }, { "sprite": 43, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 556 }, { "sprite": 43, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 559 }, { "sprite": 43, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 560 }, { "sprite": 43, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 561 }, { "sprite": 43, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 562 }, { "sprite": 43, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 563 }, { "sprite": 43, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 564 }, { "sprite": 43, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 565 }, { "sprite": 43, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 558 }, { "sprite": 43, "frame": 4, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 567 }, { "sprite": 43, "frame": 5, "fullbright": false, "tics": 8, "action": "A_FaceTarget", "nextState": 568 }, { "sprite": 43, "frame": 6, "fullbright": false, "tics": 8, "action": "A_BruisAttack", "nextState": 558 }, { "sprite": 43, "frame": 7, "fullbright": false, "tics": 2, "action": null, "nextState": 570 }, { "sprite": 43, "frame": 7, "fullbright": false, "tics": 2, "action": "A_Pain", "nextState": 558 }, { "sprite": 43, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 572 }, { "sprite": 43, "frame": 9, "fullbright": false, "tics": 8, "action": "A_Scream", "nextState": 573 }, { "sprite": 43, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 574 }, { "sprite": 43, "frame": 11, "fullbright": false, "tics": 8, "action": "A_Fall", "nextState": 575 }, { "sprite": 43, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 576 }, { "sprite": 43, "frame": 13, "fullbright": false, "tics": 8, "action": null, "nextState": 577 }, { "sprite": 43, "frame": 14, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 43, "frame": 14, "fullbright": false, "tics": 8, "action": null, "nextState": 579 }, { "sprite": 43, "frame": 13, "fullbright": false, "tics": 8, "action": null, "nextState": 580 }, { "sprite": 43, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 581 }, { "sprite": 43, "frame": 11, "fullbright": false, "tics": 8, "action": null, "nextState": 582 }, { "sprite": 43, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 583 }, { "sprite": 43, "frame": 9, "fullbright": false, "tics": 8, "action": null, "nextState": 584 }, { "sprite": 43, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 558 }, { "sprite": 44, "frame": 0, "fullbright": true, "tics": 10, "action": "A_Look", "nextState": 586 }, { "sprite": 44, "frame": 1, "fullbright": true, "tics": 10, "action": "A_Look", "nextState": 585 }, { "sprite": 44, "frame": 0, "fullbright": true, "tics": 6, "action": "A_Chase", "nextState": 588 }, { "sprite": 44, "frame": 1, "fullbright": true, "tics": 6, "action": "A_Chase", "nextState": 587 }, { "sprite": 44, "frame": 2, "fullbright": true, "tics": 10, "action": "A_FaceTarget", "nextState": 590 }, { "sprite": 44, "frame": 3, "fullbright": true, "tics": 4, "action": "A_SkullAttack", "nextState": 591 }, { "sprite": 44, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 592 }, { "sprite": 44, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 591 }, { "sprite": 44, "frame": 4, "fullbright": true, "tics": 3, "action": null, "nextState": 594 }, { "sprite": 44, "frame": 4, "fullbright": true, "tics": 3, "action": "A_Pain", "nextState": 587 }, { "sprite": 44, "frame": 5, "fullbright": true, "tics": 6, "action": null, "nextState": 596 }, { "sprite": 44, "frame": 6, "fullbright": true, "tics": 6, "action": "A_Scream", "nextState": 597 }, { "sprite": 44, "frame": 7, "fullbright": true, "tics": 6, "action": null, "nextState": 598 }, { "sprite": 44, "frame": 8, "fullbright": true, "tics": 6, "action": "A_Fall", "nextState": 599 }, { "sprite": 44, "frame": 9, "fullbright": false, "tics": 6, "action": null, "nextState": 600 }, { "sprite": 44, "frame": 10, "fullbright": false, "tics": 6, "action": null, "nextState": 0 }, { "sprite": 45, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 602 }, { "sprite": 45, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 601 }, { "sprite": 45, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Metal", "nextState": 604 }, { "sprite": 45, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 605 }, { "sprite": 45, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 606 }, { "sprite": 45, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 607 }, { "sprite": 45, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Metal", "nextState": 608 }, { "sprite": 45, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 609 }, { "sprite": 45, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 610 }, { "sprite": 45, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 611 }, { "sprite": 45, "frame": 4, "fullbright": false, "tics": 3, "action": "A_Metal", "nextState": 612 }, { "sprite": 45, "frame": 4, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 613 }, { "sprite": 45, "frame": 5, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 614 }, { "sprite": 45, "frame": 5, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 603 }, { "sprite": 45, "frame": 0, "fullbright": true, "tics": 20, "action": "A_FaceTarget", "nextState": 616 }, { "sprite": 45, "frame": 6, "fullbright": true, "tics": 4, "action": "A_SPosAttack", "nextState": 617 }, { "sprite": 45, "frame": 7, "fullbright": true, "tics": 4, "action": "A_SPosAttack", "nextState": 618 }, { "sprite": 45, "frame": 7, "fullbright": true, "tics": 1, "action": "A_SpidRefire", "nextState": 616 }, { "sprite": 45, "frame": 8, "fullbright": false, "tics": 3, "action": null, "nextState": 620 }, { "sprite": 45, "frame": 8, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 603 }, { "sprite": 45, "frame": 9, "fullbright": false, "tics": 20, "action": "A_Scream", "nextState": 622 }, { "sprite": 45, "frame": 10, "fullbright": false, "tics": 10, "action": "A_Fall", "nextState": 623 }, { "sprite": 45, "frame": 11, "fullbright": false, "tics": 10, "action": null, "nextState": 624 }, { "sprite": 45, "frame": 12, "fullbright": false, "tics": 10, "action": null, "nextState": 625 }, { "sprite": 45, "frame": 13, "fullbright": false, "tics": 10, "action": null, "nextState": 626 }, { "sprite": 45, "frame": 14, "fullbright": false, "tics": 10, "action": null, "nextState": 627 }, { "sprite": 45, "frame": 15, "fullbright": false, "tics": 10, "action": null, "nextState": 628 }, { "sprite": 45, "frame": 16, "fullbright": false, "tics": 10, "action": null, "nextState": 629 }, { "sprite": 45, "frame": 17, "fullbright": false, "tics": 10, "action": null, "nextState": 630 }, { "sprite": 45, "frame": 18, "fullbright": false, "tics": 30, "action": null, "nextState": 631 }, { "sprite": 45, "frame": 18, "fullbright": false, "tics": -1, "action": "A_BossDeath", "nextState": 0 }, { "sprite": 46, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 633 }, { "sprite": 46, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 632 }, { "sprite": 46, "frame": 0, "fullbright": false, "tics": 20, "action": null, "nextState": 635 }, { "sprite": 46, "frame": 0, "fullbright": false, "tics": 3, "action": "A_BabyMetal", "nextState": 636 }, { "sprite": 46, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 637 }, { "sprite": 46, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 638 }, { "sprite": 46, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 639 }, { "sprite": 46, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 640 }, { "sprite": 46, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 641 }, { "sprite": 46, "frame": 3, "fullbright": false, "tics": 3, "action": "A_BabyMetal", "nextState": 642 }, { "sprite": 46, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 643 }, { "sprite": 46, "frame": 4, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 644 }, { "sprite": 46, "frame": 4, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 645 }, { "sprite": 46, "frame": 5, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 646 }, { "sprite": 46, "frame": 5, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 635 }, { "sprite": 46, "frame": 0, "fullbright": true, "tics": 20, "action": "A_FaceTarget", "nextState": 648 }, { "sprite": 46, "frame": 6, "fullbright": true, "tics": 4, "action": "A_BspiAttack", "nextState": 649 }, { "sprite": 46, "frame": 7, "fullbright": true, "tics": 4, "action": null, "nextState": 650 }, { "sprite": 46, "frame": 7, "fullbright": true, "tics": 1, "action": "A_SpidRefire", "nextState": 648 }, { "sprite": 46, "frame": 8, "fullbright": false, "tics": 3, "action": null, "nextState": 652 }, { "sprite": 46, "frame": 8, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 635 }, { "sprite": 46, "frame": 9, "fullbright": false, "tics": 20, "action": "A_Scream", "nextState": 654 }, { "sprite": 46, "frame": 10, "fullbright": false, "tics": 7, "action": "A_Fall", "nextState": 655 }, { "sprite": 46, "frame": 11, "fullbright": false, "tics": 7, "action": null, "nextState": 656 }, { "sprite": 46, "frame": 12, "fullbright": false, "tics": 7, "action": null, "nextState": 657 }, { "sprite": 46, "frame": 13, "fullbright": false, "tics": 7, "action": null, "nextState": 658 }, { "sprite": 46, "frame": 14, "fullbright": false, "tics": 7, "action": null, "nextState": 659 }, { "sprite": 46, "frame": 15, "fullbright": false, "tics": -1, "action": "A_BossDeath", "nextState": 0 }, { "sprite": 46, "frame": 15, "fullbright": false, "tics": 5, "action": null, "nextState": 661 }, { "sprite": 46, "frame": 14, "fullbright": false, "tics": 5, "action": null, "nextState": 662 }, { "sprite": 46, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 663 }, { "sprite": 46, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 664 }, { "sprite": 46, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 665 }, { "sprite": 46, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 666 }, { "sprite": 46, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 635 }, { "sprite": 47, "frame": 0, "fullbright": true, "tics": 5, "action": null, "nextState": 668 }, { "sprite": 47, "frame": 1, "fullbright": true, "tics": 5, "action": null, "nextState": 667 }, { "sprite": 48, "frame": 0, "fullbright": true, "tics": 5, "action": null, "nextState": 670 }, { "sprite": 48, "frame": 1, "fullbright": true, "tics": 5, "action": null, "nextState": 671 }, { "sprite": 48, "frame": 2, "fullbright": true, "tics": 5, "action": null, "nextState": 672 }, { "sprite": 48, "frame": 3, "fullbright": true, "tics": 5, "action": null, "nextState": 673 }, { "sprite": 48, "frame": 4, "fullbright": true, "tics": 5, "action": null, "nextState": 0 }, { "sprite": 49, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 675 }, { "sprite": 49, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 674 }, { "sprite": 49, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Hoof", "nextState": 677 }, { "sprite": 49, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 678 }, { "sprite": 49, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 679 }, { "sprite": 49, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 680 }, { "sprite": 49, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 681 }, { "sprite": 49, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 682 }, { "sprite": 49, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Metal", "nextState": 683 }, { "sprite": 49, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 676 }, { "sprite": 49, "frame": 4, "fullbright": false, "tics": 6, "action": "A_FaceTarget", "nextState": 685 }, { "sprite": 49, "frame": 5, "fullbright": false, "tics": 12, "action": "A_CyberAttack", "nextState": 686 }, { "sprite": 49, "frame": 4, "fullbright": false, "tics": 12, "action": "A_FaceTarget", "nextState": 687 }, { "sprite": 49, "frame": 5, "fullbright": false, "tics": 12, "action": "A_CyberAttack", "nextState": 688 }, { "sprite": 49, "frame": 4, "fullbright": false, "tics": 12, "action": "A_FaceTarget", "nextState": 689 }, { "sprite": 49, "frame": 5, "fullbright": false, "tics": 12, "action": "A_CyberAttack", "nextState": 676 }, { "sprite": 49, "frame": 6, "fullbright": false, "tics": 10, "action": "A_Pain", "nextState": 676 }, { "sprite": 49, "frame": 7, "fullbright": false, "tics": 10, "action": null, "nextState": 692 }, { "sprite": 49, "frame": 8, "fullbright": false, "tics": 10, "action": "A_Scream", "nextState": 693 }, { "sprite": 49, "frame": 9, "fullbright": false, "tics": 10, "action": null, "nextState": 694 }, { "sprite": 49, "frame": 10, "fullbright": false, "tics": 10, "action": null, "nextState": 695 }, { "sprite": 49, "frame": 11, "fullbright": false, "tics": 10, "action": null, "nextState": 696 }, { "sprite": 49, "frame": 12, "fullbright": false, "tics": 10, "action": "A_Fall", "nextState": 697 }, { "sprite": 49, "frame": 13, "fullbright": false, "tics": 10, "action": null, "nextState": 698 }, { "sprite": 49, "frame": 14, "fullbright": false, "tics": 10, "action": null, "nextState": 699 }, { "sprite": 49, "frame": 15, "fullbright": false, "tics": 30, "action": null, "nextState": 700 }, { "sprite": 49, "frame": 15, "fullbright": false, "tics": -1, "action": "A_BossDeath", "nextState": 0 }, { "sprite": 50, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 701 }, { "sprite": 50, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 703 }, { "sprite": 50, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 704 }, { "sprite": 50, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 705 }, { "sprite": 50, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 706 }, { "sprite": 50, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 707 }, { "sprite": 50, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 702 }, { "sprite": 50, "frame": 3, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 709 }, { "sprite": 50, "frame": 4, "fullbright": false, "tics": 5, "action": "A_FaceTarget", "nextState": 710 }, { "sprite": 50, "frame": 5, "fullbright": true, "tics": 5, "action": "A_FaceTarget", "nextState": 711 }, { "sprite": 50, "frame": 5, "fullbright": true, "tics": 0, "action": "A_PainAttack", "nextState": 702 }, { "sprite": 50, "frame": 6, "fullbright": false, "tics": 6, "action": null, "nextState": 713 }, { "sprite": 50, "frame": 6, "fullbright": false, "tics": 6, "action": "A_Pain", "nextState": 702 }, { "sprite": 50, "frame": 7, "fullbright": true, "tics": 8, "action": null, "nextState": 715 }, { "sprite": 50, "frame": 8, "fullbright": true, "tics": 8, "action": "A_Scream", "nextState": 716 }, { "sprite": 50, "frame": 9, "fullbright": true, "tics": 8, "action": null, "nextState": 717 }, { "sprite": 50, "frame": 10, "fullbright": true, "tics": 8, "action": null, "nextState": 718 }, { "sprite": 50, "frame": 11, "fullbright": true, "tics": 8, "action": "A_PainDie", "nextState": 719 }, { "sprite": 50, "frame": 12, "fullbright": true, "tics": 8, "action": null, "nextState": 0 }, { "sprite": 50, "frame": 12, "fullbright": false, "tics": 8, "action": null, "nextState": 721 }, { "sprite": 50, "frame": 11, "fullbright": false, "tics": 8, "action": null, "nextState": 722 }, { "sprite": 50, "frame": 10, "fullbright": false, "tics": 8, "action": null, "nextState": 723 }, { "sprite": 50, "frame": 9, "fullbright": false, "tics": 8, "action": null, "nextState": 724 }, { "sprite": 50, "frame": 8, "fullbright": false, "tics": 8, "action": null, "nextState": 725 }, { "sprite": 50, "frame": 7, "fullbright": false, "tics": 8, "action": null, "nextState": 702 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 727 }, { "sprite": 51, "frame": 1, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 726 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 729 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 730 }, { "sprite": 51, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 731 }, { "sprite": 51, "frame": 1, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 732 }, { "sprite": 51, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 733 }, { "sprite": 51, "frame": 2, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 734 }, { "sprite": 51, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 735 }, { "sprite": 51, "frame": 3, "fullbright": false, "tics": 3, "action": "A_Chase", "nextState": 728 }, { "sprite": 51, "frame": 4, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 737 }, { "sprite": 51, "frame": 5, "fullbright": false, "tics": 10, "action": "A_FaceTarget", "nextState": 738 }, { "sprite": 51, "frame": 6, "fullbright": true, "tics": 4, "action": "A_CPosAttack", "nextState": 739 }, { "sprite": 51, "frame": 5, "fullbright": false, "tics": 6, "action": "A_FaceTarget", "nextState": 740 }, { "sprite": 51, "frame": 6, "fullbright": true, "tics": 4, "action": "A_CPosAttack", "nextState": 741 }, { "sprite": 51, "frame": 5, "fullbright": false, "tics": 1, "action": "A_CPosRefire", "nextState": 737 }, { "sprite": 51, "frame": 7, "fullbright": false, "tics": 3, "action": null, "nextState": 743 }, { "sprite": 51, "frame": 7, "fullbright": false, "tics": 3, "action": "A_Pain", "nextState": 728 }, { "sprite": 51, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 745 }, { "sprite": 51, "frame": 9, "fullbright": false, "tics": 5, "action": "A_Scream", "nextState": 746 }, { "sprite": 51, "frame": 10, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 747 }, { "sprite": 51, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 748 }, { "sprite": 51, "frame": 12, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 51, "frame": 13, "fullbright": false, "tics": 5, "action": null, "nextState": 750 }, { "sprite": 51, "frame": 14, "fullbright": false, "tics": 5, "action": "A_XScream", "nextState": 751 }, { "sprite": 51, "frame": 15, "fullbright": false, "tics": 5, "action": "A_Fall", "nextState": 752 }, { "sprite": 51, "frame": 16, "fullbright": false, "tics": 5, "action": null, "nextState": 753 }, { "sprite": 51, "frame": 17, "fullbright": false, "tics": 5, "action": null, "nextState": 754 }, { "sprite": 51, "frame": 18, "fullbright": false, "tics": 5, "action": null, "nextState": 755 }, { "sprite": 51, "frame": 19, "fullbright": false, "tics": 5, "action": null, "nextState": 756 }, { "sprite": 51, "frame": 20, "fullbright": false, "tics": 5, "action": null, "nextState": 757 }, { "sprite": 51, "frame": 21, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 51, "frame": 12, "fullbright": false, "tics": 5, "action": null, "nextState": 759 }, { "sprite": 51, "frame": 11, "fullbright": false, "tics": 5, "action": null, "nextState": 760 }, { "sprite": 51, "frame": 10, "fullbright": false, "tics": 5, "action": null, "nextState": 761 }, { "sprite": 51, "frame": 9, "fullbright": false, "tics": 5, "action": null, "nextState": 762 }, { "sprite": 51, "frame": 8, "fullbright": false, "tics": 5, "action": null, "nextState": 728 }, { "sprite": 52, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 763 }, { "sprite": 52, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 765 }, { "sprite": 52, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 766 }, { "sprite": 52, "frame": 2, "fullbright": false, "tics": 6, "action": "A_Scream", "nextState": 767 }, { "sprite": 52, "frame": 3, "fullbright": false, "tics": 6, "action": null, "nextState": 768 }, { "sprite": 52, "frame": 4, "fullbright": false, "tics": 6, "action": null, "nextState": 769 }, { "sprite": 52, "frame": 5, "fullbright": false, "tics": 6, "action": null, "nextState": 770 }, { "sprite": 52, "frame": 6, "fullbright": false, "tics": 6, "action": null, "nextState": 771 }, { "sprite": 52, "frame": 7, "fullbright": false, "tics": 6, "action": null, "nextState": 772 }, { "sprite": 52, "frame": 8, "fullbright": false, "tics": 6, "action": null, "nextState": 773 }, { "sprite": 52, "frame": 9, "fullbright": false, "tics": 6, "action": null, "nextState": 774 }, { "sprite": 52, "frame": 10, "fullbright": false, "tics": 6, "action": "A_KeenDie", "nextState": 775 }, { "sprite": 52, "frame": 11, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 52, "frame": 12, "fullbright": false, "tics": 4, "action": null, "nextState": 777 }, { "sprite": 52, "frame": 12, "fullbright": false, "tics": 8, "action": "A_Pain", "nextState": 763 }, { "sprite": 53, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 53, "frame": 1, "fullbright": false, "tics": 36, "action": "A_BrainPain", "nextState": 778 }, { "sprite": 53, "frame": 0, "fullbright": false, "tics": 100, "action": "A_BrainScream", "nextState": 781 }, { "sprite": 53, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 782 }, { "sprite": 53, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 783 }, { "sprite": 53, "frame": 0, "fullbright": false, "tics": -1, "action": "A_BrainDie", "nextState": 0 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 10, "action": "A_Look", "nextState": 784 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 181, "action": "A_BrainAwake", "nextState": 786 }, { "sprite": 51, "frame": 0, "fullbright": false, "tics": 150, "action": "A_BrainSpit", "nextState": 786 }, { "sprite": 54, "frame": 0, "fullbright": true, "tics": 3, "action": "A_SpawnSound", "nextState": 788 }, { "sprite": 54, "frame": 1, "fullbright": true, "tics": 3, "action": "A_SpawnFly", "nextState": 789 }, { "sprite": 54, "frame": 2, "fullbright": true, "tics": 3, "action": "A_SpawnFly", "nextState": 790 }, { "sprite": 54, "frame": 3, "fullbright": true, "tics": 3, "action": "A_SpawnFly", "nextState": 787 }, { "sprite": 32, "frame": 0, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 792 }, { "sprite": 32, "frame": 1, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 793 }, { "sprite": 32, "frame": 2, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 794 }, { "sprite": 32, "frame": 3, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 795 }, { "sprite": 32, "frame": 4, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 796 }, { "sprite": 32, "frame": 5, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 797 }, { "sprite": 32, "frame": 6, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 798 }, { "sprite": 32, "frame": 7, "fullbright": true, "tics": 4, "action": "A_Fire", "nextState": 0 }, { "sprite": 22, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 800 }, { "sprite": 22, "frame": 2, "fullbright": true, "tics": 10, "action": null, "nextState": 801 }, { "sprite": 22, "frame": 3, "fullbright": true, "tics": 10, "action": "A_BrainExplode", "nextState": 0 }, { "sprite": 55, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 803 }, { "sprite": 55, "frame": 1, "fullbright": true, "tics": 7, "action": null, "nextState": 802 }, { "sprite": 56, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 805 }, { "sprite": 56, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 804 }, { "sprite": 57, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 807 }, { "sprite": 57, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 806 }, { "sprite": 58, "frame": 0, "fullbright": true, "tics": 5, "action": null, "nextState": 809 }, { "sprite": 58, "frame": 1, "fullbright": true, "tics": 5, "action": "A_Scream", "nextState": 810 }, { "sprite": 58, "frame": 2, "fullbright": true, "tics": 5, "action": null, "nextState": 811 }, { "sprite": 58, "frame": 3, "fullbright": true, "tics": 10, "action": "A_Explode", "nextState": 812 }, { "sprite": 58, "frame": 4, "fullbright": true, "tics": 10, "action": null, "nextState": 0 }, { "sprite": 59, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 814 }, { "sprite": 59, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 815 }, { "sprite": 59, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 813 }, { "sprite": 60, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 817 }, { "sprite": 60, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 818 }, { "sprite": 60, "frame": 2, "fullbright": false, "tics": 6, "action": null, "nextState": 819 }, { "sprite": 60, "frame": 3, "fullbright": false, "tics": 6, "action": null, "nextState": 820 }, { "sprite": 60, "frame": 2, "fullbright": false, "tics": 6, "action": null, "nextState": 821 }, { "sprite": 60, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 816 }, { "sprite": 61, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 823 }, { "sprite": 61, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 824 }, { "sprite": 61, "frame": 2, "fullbright": false, "tics": 6, "action": null, "nextState": 825 }, { "sprite": 61, "frame": 3, "fullbright": false, "tics": 6, "action": null, "nextState": 826 }, { "sprite": 61, "frame": 2, "fullbright": false, "tics": 6, "action": null, "nextState": 827 }, { "sprite": 61, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 822 }, { "sprite": 62, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 829 }, { "sprite": 62, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 828 }, { "sprite": 63, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 831 }, { "sprite": 63, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 830 }, { "sprite": 64, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 833 }, { "sprite": 64, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 832 }, { "sprite": 65, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 835 }, { "sprite": 65, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 834 }, { "sprite": 66, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 837 }, { "sprite": 66, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 836 }, { "sprite": 67, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 839 }, { "sprite": 67, "frame": 1, "fullbright": true, "tics": 10, "action": null, "nextState": 838 }, { "sprite": 68, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 69, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 70, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 843 }, { "sprite": 70, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 844 }, { "sprite": 70, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 845 }, { "sprite": 70, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 846 }, { "sprite": 70, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 847 }, { "sprite": 70, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 842 }, { "sprite": 71, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 849 }, { "sprite": 71, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 850 }, { "sprite": 71, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 851 }, { "sprite": 71, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 848 }, { "sprite": 72, "frame": 0, "fullbright": true, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 73, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 854 }, { "sprite": 73, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 855 }, { "sprite": 73, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 856 }, { "sprite": 73, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 853 }, { "sprite": 74, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 858 }, { "sprite": 74, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 859 }, { "sprite": 74, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 860 }, { "sprite": 74, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 857 }, { "sprite": 75, "frame": 0, "fullbright": true, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 76, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 863 }, { "sprite": 76, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 864 }, { "sprite": 76, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 865 }, { "sprite": 76, "frame": 3, "fullbright": true, "tics": 6, "action": null, "nextState": 866 }, { "sprite": 76, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 867 }, { "sprite": 76, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 862 }, { "sprite": 77, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 869 }, { "sprite": 77, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 868 }, { "sprite": 78, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 79, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 80, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 81, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 82, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 83, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 84, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 85, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 86, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 87, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 88, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 89, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 90, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 91, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 92, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 93, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 94, "frame": 0, "fullbright": true, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 95, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 96, "frame": 0, "fullbright": false, "tics": 10, "action": null, "nextState": 889 }, { "sprite": 96, "frame": 1, "fullbright": false, "tics": 15, "action": null, "nextState": 890 }, { "sprite": 96, "frame": 2, "fullbright": false, "tics": 8, "action": null, "nextState": 891 }, { "sprite": 96, "frame": 1, "fullbright": false, "tics": 6, "action": null, "nextState": 888 }, { "sprite": 28, "frame": 13, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 28, "frame": 18, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 97, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 98, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 99, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 100, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 898 }, { "sprite": 100, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 897 }, { "sprite": 101, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 102, "frame": 0, "fullbright": false, "tics": 6, "action": null, "nextState": 901 }, { "sprite": 102, "frame": 1, "fullbright": false, "tics": 8, "action": null, "nextState": 900 }, { "sprite": 103, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 104, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 105, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 106, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 107, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 108, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 109, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 110, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 111, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 112, "frame": 0, "fullbright": true, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 113, "frame": 0, "fullbright": true, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 114, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 115, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 116, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 117, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 118, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 918 }, { "sprite": 118, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 919 }, { "sprite": 118, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 920 }, { "sprite": 118, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 917 }, { "sprite": 119, "frame": 0, "fullbright": true, "tics": 6, "action": null, "nextState": 922 }, { "sprite": 119, "frame": 1, "fullbright": true, "tics": 6, "action": null, "nextState": 923 }, { "sprite": 119, "frame": 2, "fullbright": true, "tics": 6, "action": null, "nextState": 921 }, { "sprite": 120, "frame": 0, "fullbright": false, "tics": 14, "action": null, "nextState": 925 }, { "sprite": 120, "frame": 1, "fullbright": false, "tics": 14, "action": null, "nextState": 924 }, { "sprite": 121, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 927 }, { "sprite": 121, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 928 }, { "sprite": 121, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 929 }, { "sprite": 121, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 926 }, { "sprite": 122, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 931 }, { "sprite": 122, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 932 }, { "sprite": 122, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 933 }, { "sprite": 122, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 930 }, { "sprite": 123, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 935 }, { "sprite": 123, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 936 }, { "sprite": 123, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 937 }, { "sprite": 123, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 934 }, { "sprite": 124, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 939 }, { "sprite": 124, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 940 }, { "sprite": 124, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 941 }, { "sprite": 124, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 938 }, { "sprite": 125, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 943 }, { "sprite": 125, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 944 }, { "sprite": 125, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 945 }, { "sprite": 125, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 942 }, { "sprite": 126, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 947 }, { "sprite": 126, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 948 }, { "sprite": 126, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 949 }, { "sprite": 126, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 946 }, { "sprite": 127, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 128, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 129, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 130, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 131, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 132, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 133, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 134, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 135, "frame": 0, "fullbright": false, "tics": -1, "action": null, "nextState": 0 }, { "sprite": 136, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 960 }, { "sprite": 136, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 961 }, { "sprite": 136, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 962 }, { "sprite": 136, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 959 }, { "sprite": 137, "frame": 0, "fullbright": true, "tics": 4, "action": null, "nextState": 964 }, { "sprite": 137, "frame": 1, "fullbright": true, "tics": 4, "action": null, "nextState": 965 }, { "sprite": 137, "frame": 2, "fullbright": true, "tics": 4, "action": null, "nextState": 966 }, { "sprite": 137, "frame": 3, "fullbright": true, "tics": 4, "action": null, "nextState": 963 }];
    mobjInfo = [{ "doomedNum": -1, "spawnState": 149, "spawnHealth": 100, "seeState": 150, "seeSound": "sfx_None", "reactionTime": 0, "painState": 156, "painChance": 255, "meleeState": 0, "missileState": 154, "deathState": 158, "xdeathState": 165, "deathSound": "sfx_pldeth", "speed": 0, "radius": 1048576, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33557510, "raiseState": 0 }, { "doomedNum": 3004, "spawnState": 174, "spawnHealth": 20, "seeState": 176, "seeSound": "sfx_posit1", "reactionTime": 8, "painState": 187, "painChance": 200, "meleeState": 0, "missileState": 184, "deathState": 189, "xdeathState": 194, "deathSound": "sfx_podth1", "speed": 8, "radius": 1310720, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_posact", "flags": 4194310, "raiseState": 203 }, { "doomedNum": 9, "spawnState": 207, "spawnHealth": 30, "seeState": 209, "seeSound": "sfx_posit2", "reactionTime": 8, "painState": 220, "painChance": 170, "meleeState": 0, "missileState": 217, "deathState": 222, "xdeathState": 227, "deathSound": "sfx_podth2", "speed": 8, "radius": 1310720, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_posact", "flags": 4194310, "raiseState": 236 }, { "doomedNum": 64, "spawnState": 241, "spawnHealth": 700, "seeState": 243, "seeSound": "sfx_vilsit", "reactionTime": 8, "painState": 269, "painChance": 10, "meleeState": 0, "missileState": 255, "deathState": 271, "xdeathState": 0, "deathSound": "sfx_vildth", "speed": 15, "radius": 1310720, "height": 3670016, "mass": 500, "damage": 0, "activeSound": "sfx_vilact", "flags": 4194310, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 281, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": 66, "spawnState": 321, "spawnHealth": 300, "seeState": 323, "seeSound": "sfx_skesit", "reactionTime": 8, "painState": 343, "painChance": 100, "meleeState": 335, "missileState": 339, "deathState": 345, "xdeathState": 0, "deathSound": "sfx_skedth", "speed": 10, "radius": 1310720, "height": 3670016, "mass": 500, "damage": 0, "activeSound": "sfx_skeact", "flags": 4194310, "raiseState": 351 }, { "doomedNum": -1, "spawnState": 316, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_skeatk", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 318, "xdeathState": 0, "deathSound": "sfx_barexp", "speed": 655360, "radius": 720896, "height": 524288, "mass": 100, "damage": 10, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 311, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": 67, "spawnState": 362, "spawnHealth": 600, "seeState": 364, "seeSound": "sfx_mansit", "reactionTime": 8, "painState": 386, "painChance": 80, "meleeState": 0, "missileState": 376, "deathState": 388, "xdeathState": 0, "deathSound": "sfx_mandth", "speed": 8, "radius": 3145728, "height": 4194304, "mass": 1e3, "damage": 0, "activeSound": "sfx_posact", "flags": 4194310, "raiseState": 398 }, { "doomedNum": -1, "spawnState": 357, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_firsht", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 359, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 1310720, "radius": 393216, "height": 524288, "mass": 100, "damage": 8, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": 65, "spawnState": 406, "spawnHealth": 70, "seeState": 408, "seeSound": "sfx_posit2", "reactionTime": 8, "painState": 420, "painChance": 170, "meleeState": 0, "missileState": 416, "deathState": 422, "xdeathState": 429, "deathSound": "sfx_podth2", "speed": 8, "radius": 1310720, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_posact", "flags": 4194310, "raiseState": 435 }, { "doomedNum": 3001, "spawnState": 442, "spawnHealth": 60, "seeState": 444, "seeSound": "sfx_bgsit1", "reactionTime": 8, "painState": 455, "painChance": 200, "meleeState": 452, "missileState": 452, "deathState": 457, "xdeathState": 462, "deathSound": "sfx_bgdth1", "speed": 8, "radius": 1310720, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_bgact", "flags": 4194310, "raiseState": 470 }, { "doomedNum": 3002, "spawnState": 475, "spawnHealth": 150, "seeState": 477, "seeSound": "sfx_sgtsit", "reactionTime": 8, "painState": 488, "painChance": 180, "meleeState": 485, "missileState": 0, "deathState": 490, "xdeathState": 0, "deathSound": "sfx_sgtdth", "speed": 10, "radius": 1966080, "height": 3670016, "mass": 400, "damage": 0, "activeSound": "sfx_dmact", "flags": 4194310, "raiseState": 496 }, { "doomedNum": 58, "spawnState": 475, "spawnHealth": 150, "seeState": 477, "seeSound": "sfx_sgtsit", "reactionTime": 8, "painState": 488, "painChance": 180, "meleeState": 485, "missileState": 0, "deathState": 490, "xdeathState": 0, "deathSound": "sfx_sgtdth", "speed": 10, "radius": 1966080, "height": 3670016, "mass": 400, "damage": 0, "activeSound": "sfx_dmact", "flags": 4456454, "raiseState": 496 }, { "doomedNum": 3005, "spawnState": 502, "spawnHealth": 400, "seeState": 503, "seeSound": "sfx_cacsit", "reactionTime": 8, "painState": 507, "painChance": 128, "meleeState": 0, "missileState": 504, "deathState": 510, "xdeathState": 0, "deathSound": "sfx_cacdth", "speed": 8, "radius": 2031616, "height": 3670016, "mass": 400, "damage": 0, "activeSound": "sfx_dmact", "flags": 4211206, "raiseState": 516 }, { "doomedNum": 3003, "spawnState": 527, "spawnHealth": 1e3, "seeState": 529, "seeSound": "sfx_brssit", "reactionTime": 8, "painState": 540, "painChance": 50, "meleeState": 537, "missileState": 537, "deathState": 542, "xdeathState": 0, "deathSound": "sfx_brsdth", "speed": 8, "radius": 1572864, "height": 4194304, "mass": 1e3, "damage": 0, "activeSound": "sfx_dmact", "flags": 4194310, "raiseState": 549 }, { "doomedNum": -1, "spawnState": 522, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_firsht", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 524, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 983040, "radius": 393216, "height": 524288, "mass": 100, "damage": 8, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": 69, "spawnState": 556, "spawnHealth": 500, "seeState": 558, "seeSound": "sfx_kntsit", "reactionTime": 8, "painState": 569, "painChance": 50, "meleeState": 566, "missileState": 566, "deathState": 571, "xdeathState": 0, "deathSound": "sfx_kntdth", "speed": 8, "radius": 1572864, "height": 4194304, "mass": 1e3, "damage": 0, "activeSound": "sfx_dmact", "flags": 4194310, "raiseState": 578 }, { "doomedNum": 3006, "spawnState": 585, "spawnHealth": 100, "seeState": 587, "seeSound": "0", "reactionTime": 8, "painState": 593, "painChance": 256, "meleeState": 0, "missileState": 589, "deathState": 595, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 8, "radius": 1048576, "height": 3670016, "mass": 50, "damage": 3, "activeSound": "sfx_dmact", "flags": 16902, "raiseState": 0 }, { "doomedNum": 7, "spawnState": 601, "spawnHealth": 3e3, "seeState": 603, "seeSound": "sfx_spisit", "reactionTime": 8, "painState": 619, "painChance": 40, "meleeState": 0, "missileState": 615, "deathState": 621, "xdeathState": 0, "deathSound": "sfx_spidth", "speed": 12, "radius": 8388608, "height": 6553600, "mass": 1e3, "damage": 0, "activeSound": "sfx_dmact", "flags": 4194310, "raiseState": 0 }, { "doomedNum": 68, "spawnState": 632, "spawnHealth": 500, "seeState": 634, "seeSound": "sfx_bspsit", "reactionTime": 8, "painState": 651, "painChance": 128, "meleeState": 0, "missileState": 647, "deathState": 653, "xdeathState": 0, "deathSound": "sfx_bspdth", "speed": 12, "radius": 4194304, "height": 4194304, "mass": 600, "damage": 0, "activeSound": "sfx_bspact", "flags": 4194310, "raiseState": 660 }, { "doomedNum": 16, "spawnState": 674, "spawnHealth": 4e3, "seeState": 676, "seeSound": "sfx_cybsit", "reactionTime": 8, "painState": 690, "painChance": 20, "meleeState": 0, "missileState": 684, "deathState": 691, "xdeathState": 0, "deathSound": "sfx_cybdth", "speed": 16, "radius": 2621440, "height": 7208960, "mass": 1e3, "damage": 0, "activeSound": "sfx_dmact", "flags": 4194310, "raiseState": 0 }, { "doomedNum": 71, "spawnState": 701, "spawnHealth": 400, "seeState": 702, "seeSound": "sfx_pesit", "reactionTime": 8, "painState": 712, "painChance": 128, "meleeState": 0, "missileState": 708, "deathState": 714, "xdeathState": 0, "deathSound": "sfx_pedth", "speed": 8, "radius": 2031616, "height": 3670016, "mass": 400, "damage": 0, "activeSound": "sfx_dmact", "flags": 4211206, "raiseState": 720 }, { "doomedNum": 84, "spawnState": 726, "spawnHealth": 50, "seeState": 728, "seeSound": "sfx_sssit", "reactionTime": 8, "painState": 742, "painChance": 170, "meleeState": 0, "missileState": 736, "deathState": 744, "xdeathState": 749, "deathSound": "sfx_ssdth", "speed": 8, "radius": 1310720, "height": 3670016, "mass": 100, "damage": 0, "activeSound": "sfx_posact", "flags": 4194310, "raiseState": 758 }, { "doomedNum": 72, "spawnState": 763, "spawnHealth": 100, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 776, "painChance": 256, "meleeState": 0, "missileState": 0, "deathState": 764, "xdeathState": 0, "deathSound": "sfx_keendt", "speed": 0, "radius": 1048576, "height": 4718592, "mass": 1e7, "damage": 0, "activeSound": "sfx_None", "flags": 4195078, "raiseState": 0 }, { "doomedNum": 88, "spawnState": 778, "spawnHealth": 250, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 779, "painChance": 255, "meleeState": 0, "missileState": 0, "deathState": 780, "xdeathState": 0, "deathSound": "sfx_bosdth", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 1e7, "damage": 0, "activeSound": "sfx_None", "flags": 6, "raiseState": 0 }, { "doomedNum": 89, "spawnState": 784, "spawnHealth": 1e3, "seeState": 785, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 2097152, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 24, "raiseState": 0 }, { "doomedNum": 87, "spawnState": 0, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 2097152, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 24, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 787, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_bospit", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 655360, "radius": 393216, "height": 2097152, "mass": 100, "damage": 3, "activeSound": "sfx_None", "flags": 71184, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 791, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": 2035, "spawnState": 806, "spawnHealth": 20, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 808, "xdeathState": 0, "deathSound": "sfx_barexp", "speed": 0, "radius": 655360, "height": 2752512, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 524294, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 97, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_firsht", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 99, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 655360, "radius": 393216, "height": 524288, "mass": 100, "damage": 3, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 102, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_firsht", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 104, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 655360, "radius": 393216, "height": 524288, "mass": 100, "damage": 5, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 114, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_rlaunc", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 127, "xdeathState": 0, "deathSound": "sfx_barexp", "speed": 1310720, "radius": 720896, "height": 524288, "mass": 100, "damage": 20, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 107, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_plasma", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 109, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 1638400, "radius": 851968, "height": 524288, "mass": 100, "damage": 5, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 115, "spawnHealth": 1e3, "seeState": 0, "seeSound": "0", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 117, "xdeathState": 0, "deathSound": "sfx_rxplod", "speed": 1638400, "radius": 851968, "height": 524288, "mass": 100, "damage": 100, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 667, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_plasma", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 669, "xdeathState": 0, "deathSound": "sfx_firxpl", "speed": 1638400, "radius": 851968, "height": 524288, "mass": 100, "damage": 5, "activeSound": "sfx_None", "flags": 67088, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 93, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 90, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 16, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 130, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 142, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": 14, "spawnState": 0, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 24, "raiseState": 0 }, { "doomedNum": -1, "spawnState": 123, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 528, "raiseState": 0 }, { "doomedNum": 2018, "spawnState": 802, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2019, "spawnState": 804, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2014, "spawnState": 816, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2015, "spawnState": 822, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 5, "spawnState": 828, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 13, "spawnState": 830, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 6, "spawnState": 832, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 39, "spawnState": 838, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 38, "spawnState": 836, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 40, "spawnState": 834, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 33554433, "raiseState": 0 }, { "doomedNum": 2011, "spawnState": 840, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2012, "spawnState": 841, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2013, "spawnState": 842, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2022, "spawnState": 848, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2023, "spawnState": 852, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2024, "spawnState": 853, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2025, "spawnState": 861, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2026, "spawnState": 862, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2045, "spawnState": 868, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 83, "spawnState": 857, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 8388609, "raiseState": 0 }, { "doomedNum": 2007, "spawnState": 870, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2048, "spawnState": 871, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2010, "spawnState": 872, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2046, "spawnState": 873, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2047, "spawnState": 874, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 17, "spawnState": 875, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2008, "spawnState": 876, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2049, "spawnState": 877, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 8, "spawnState": 878, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2006, "spawnState": 879, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2002, "spawnState": 880, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2005, "spawnState": 881, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2003, "spawnState": 882, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2004, "spawnState": 883, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 2001, "spawnState": 884, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 82, "spawnState": 885, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 1, "raiseState": 0 }, { "doomedNum": 85, "spawnState": 959, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 86, "spawnState": 963, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 2028, "spawnState": 886, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 30, "spawnState": 907, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 31, "spawnState": 908, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 32, "spawnState": 909, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 33, "spawnState": 910, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 37, "spawnState": 913, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 36, "spawnState": 924, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 41, "spawnState": 917, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 42, "spawnState": 921, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 43, "spawnState": 914, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 44, "spawnState": 926, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 45, "spawnState": 930, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 46, "spawnState": 934, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 55, "spawnState": 938, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 56, "spawnState": 942, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 57, "spawnState": 946, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 47, "spawnState": 906, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 48, "spawnState": 916, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 34, "spawnState": 911, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 35, "spawnState": 912, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 49, "spawnState": 888, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4456448, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 50, "spawnState": 902, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 5505024, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 51, "spawnState": 903, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 5505024, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 52, "spawnState": 904, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4456448, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 53, "spawnState": 905, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 3407872, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 59, "spawnState": 902, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 5505024, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 768, "raiseState": 0 }, { "doomedNum": 60, "spawnState": 904, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 4456448, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 768, "raiseState": 0 }, { "doomedNum": 61, "spawnState": 903, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 3407872, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 768, "raiseState": 0 }, { "doomedNum": 62, "spawnState": 905, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 3407872, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 768, "raiseState": 0 }, { "doomedNum": 63, "spawnState": 888, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 4456448, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 768, "raiseState": 0 }, { "doomedNum": 22, "spawnState": 515, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 15, "spawnState": 164, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 18, "spawnState": 193, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 21, "spawnState": 495, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 23, "spawnState": 600, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 20, "spawnState": 461, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 19, "spawnState": 226, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 10, "spawnState": 173, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 12, "spawnState": 173, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 28, "spawnState": 894, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 24, "spawnState": 895, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 0, "raiseState": 0 }, { "doomedNum": 27, "spawnState": 896, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 29, "spawnState": 897, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 25, "spawnState": 899, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 26, "spawnState": 900, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 54, "spawnState": 915, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 2097152, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 70, "spawnState": 813, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 2, "raiseState": 0 }, { "doomedNum": 73, "spawnState": 950, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 5767168, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 74, "spawnState": 951, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 5767168, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 75, "spawnState": 952, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4194304, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 76, "spawnState": 953, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4194304, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 77, "spawnState": 954, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4194304, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 78, "spawnState": 955, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1048576, "height": 4194304, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 770, "raiseState": 0 }, { "doomedNum": 79, "spawnState": 956, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 16, "raiseState": 0 }, { "doomedNum": 80, "spawnState": 957, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 16, "raiseState": 0 }, { "doomedNum": 81, "spawnState": 958, "spawnHealth": 1e3, "seeState": 0, "seeSound": "sfx_None", "reactionTime": 8, "painState": 0, "painChance": 0, "meleeState": 0, "missileState": 0, "deathState": 0, "xdeathState": 0, "deathSound": "sfx_None", "speed": 0, "radius": 1310720, "height": 1048576, "mass": 100, "damage": 0, "activeSound": "sfx_None", "flags": 16, "raiseState": 0 }];
    byDoomedNum = new Map(
      mobjInfo.map((m, i) => [m.doomedNum, i]).filter(([n]) => n >= 0)
    );
    S = {
      S_NULL: 0,
      S_LIGHTDONE: 1,
      S_PUNCH: 2,
      S_PUNCHDOWN: 3,
      S_PUNCHUP: 4,
      S_PUNCH1: 5,
      S_PUNCH2: 6,
      S_PUNCH3: 7,
      S_PUNCH4: 8,
      S_PUNCH5: 9,
      S_PISTOL: 10,
      S_PISTOLDOWN: 11,
      S_PISTOLUP: 12,
      S_PISTOL1: 13,
      S_PISTOL2: 14,
      S_PISTOL3: 15,
      S_PISTOL4: 16,
      S_PISTOLFLASH: 17,
      S_SGUN: 18,
      S_SGUNDOWN: 19,
      S_SGUNUP: 20,
      S_SGUN1: 21,
      S_SGUN2: 22,
      S_SGUN3: 23,
      S_SGUN4: 24,
      S_SGUN5: 25,
      S_SGUN6: 26,
      S_SGUN7: 27,
      S_SGUN8: 28,
      S_SGUN9: 29,
      S_SGUNFLASH1: 30,
      S_SGUNFLASH2: 31,
      S_DSGUN: 32,
      S_DSGUNDOWN: 33,
      S_DSGUNUP: 34,
      S_DSGUN1: 35,
      S_DSGUN2: 36,
      S_DSGUN3: 37,
      S_DSGUN4: 38,
      S_DSGUN5: 39,
      S_DSGUN6: 40,
      S_DSGUN7: 41,
      S_DSGUN8: 42,
      S_DSGUN9: 43,
      S_DSGUN10: 44,
      S_DSNR1: 45,
      S_DSNR2: 46,
      S_DSGUNFLASH1: 47,
      S_DSGUNFLASH2: 48,
      S_CHAIN: 49,
      S_CHAINDOWN: 50,
      S_CHAINUP: 51,
      S_CHAIN1: 52,
      S_CHAIN2: 53,
      S_CHAIN3: 54,
      S_CHAINFLASH1: 55,
      S_CHAINFLASH2: 56,
      S_MISSILE: 57,
      S_MISSILEDOWN: 58,
      S_MISSILEUP: 59,
      S_MISSILE1: 60,
      S_MISSILE2: 61,
      S_MISSILE3: 62,
      S_MISSILEFLASH1: 63,
      S_MISSILEFLASH2: 64,
      S_MISSILEFLASH3: 65,
      S_MISSILEFLASH4: 66,
      S_SAW: 67,
      S_SAWB: 68,
      S_SAWDOWN: 69,
      S_SAWUP: 70,
      S_SAW1: 71,
      S_SAW2: 72,
      S_SAW3: 73,
      S_PLASMA: 74,
      S_PLASMADOWN: 75,
      S_PLASMAUP: 76,
      S_PLASMA1: 77,
      S_PLASMA2: 78,
      S_PLASMAFLASH1: 79,
      S_PLASMAFLASH2: 80,
      S_BFG: 81,
      S_BFGDOWN: 82,
      S_BFGUP: 83,
      S_BFG1: 84,
      S_BFG2: 85,
      S_BFG3: 86,
      S_BFG4: 87,
      S_BFGFLASH1: 88,
      S_BFGFLASH2: 89,
      S_BLOOD1: 90,
      S_BLOOD2: 91,
      S_BLOOD3: 92,
      S_PUFF1: 93,
      S_PUFF2: 94,
      S_PUFF3: 95,
      S_PUFF4: 96,
      S_TBALL1: 97,
      S_TBALL2: 98,
      S_TBALLX1: 99,
      S_TBALLX2: 100,
      S_TBALLX3: 101,
      S_RBALL1: 102,
      S_RBALL2: 103,
      S_RBALLX1: 104,
      S_RBALLX2: 105,
      S_RBALLX3: 106,
      S_PLASBALL: 107,
      S_PLASBALL2: 108,
      S_PLASEXP: 109,
      S_PLASEXP2: 110,
      S_PLASEXP3: 111,
      S_PLASEXP4: 112,
      S_PLASEXP5: 113,
      S_ROCKET: 114,
      S_BFGSHOT: 115,
      S_BFGSHOT2: 116,
      S_BFGLAND: 117,
      S_BFGLAND2: 118,
      S_BFGLAND3: 119,
      S_BFGLAND4: 120,
      S_BFGLAND5: 121,
      S_BFGLAND6: 122,
      S_BFGEXP: 123,
      S_BFGEXP2: 124,
      S_BFGEXP3: 125,
      S_BFGEXP4: 126,
      S_EXPLODE1: 127,
      S_EXPLODE2: 128,
      S_EXPLODE3: 129,
      S_TFOG: 130,
      S_TFOG01: 131,
      S_TFOG02: 132,
      S_TFOG2: 133,
      S_TFOG3: 134,
      S_TFOG4: 135,
      S_TFOG5: 136,
      S_TFOG6: 137,
      S_TFOG7: 138,
      S_TFOG8: 139,
      S_TFOG9: 140,
      S_TFOG10: 141,
      S_IFOG: 142,
      S_IFOG01: 143,
      S_IFOG02: 144,
      S_IFOG2: 145,
      S_IFOG3: 146,
      S_IFOG4: 147,
      S_IFOG5: 148,
      S_PLAY: 149,
      S_PLAY_RUN1: 150,
      S_PLAY_RUN2: 151,
      S_PLAY_RUN3: 152,
      S_PLAY_RUN4: 153,
      S_PLAY_ATK1: 154,
      S_PLAY_ATK2: 155,
      S_PLAY_PAIN: 156,
      S_PLAY_PAIN2: 157,
      S_PLAY_DIE1: 158,
      S_PLAY_DIE2: 159,
      S_PLAY_DIE3: 160,
      S_PLAY_DIE4: 161,
      S_PLAY_DIE5: 162,
      S_PLAY_DIE6: 163,
      S_PLAY_DIE7: 164,
      S_PLAY_XDIE1: 165,
      S_PLAY_XDIE2: 166,
      S_PLAY_XDIE3: 167,
      S_PLAY_XDIE4: 168,
      S_PLAY_XDIE5: 169,
      S_PLAY_XDIE6: 170,
      S_PLAY_XDIE7: 171,
      S_PLAY_XDIE8: 172,
      S_PLAY_XDIE9: 173,
      S_POSS_STND: 174,
      S_POSS_STND2: 175,
      S_POSS_RUN1: 176,
      S_POSS_RUN2: 177,
      S_POSS_RUN3: 178,
      S_POSS_RUN4: 179,
      S_POSS_RUN5: 180,
      S_POSS_RUN6: 181,
      S_POSS_RUN7: 182,
      S_POSS_RUN8: 183,
      S_POSS_ATK1: 184,
      S_POSS_ATK2: 185,
      S_POSS_ATK3: 186,
      S_POSS_PAIN: 187,
      S_POSS_PAIN2: 188,
      S_POSS_DIE1: 189,
      S_POSS_DIE2: 190,
      S_POSS_DIE3: 191,
      S_POSS_DIE4: 192,
      S_POSS_DIE5: 193,
      S_POSS_XDIE1: 194,
      S_POSS_XDIE2: 195,
      S_POSS_XDIE3: 196,
      S_POSS_XDIE4: 197,
      S_POSS_XDIE5: 198,
      S_POSS_XDIE6: 199,
      S_POSS_XDIE7: 200,
      S_POSS_XDIE8: 201,
      S_POSS_XDIE9: 202,
      S_POSS_RAISE1: 203,
      S_POSS_RAISE2: 204,
      S_POSS_RAISE3: 205,
      S_POSS_RAISE4: 206,
      S_SPOS_STND: 207,
      S_SPOS_STND2: 208,
      S_SPOS_RUN1: 209,
      S_SPOS_RUN2: 210,
      S_SPOS_RUN3: 211,
      S_SPOS_RUN4: 212,
      S_SPOS_RUN5: 213,
      S_SPOS_RUN6: 214,
      S_SPOS_RUN7: 215,
      S_SPOS_RUN8: 216,
      S_SPOS_ATK1: 217,
      S_SPOS_ATK2: 218,
      S_SPOS_ATK3: 219,
      S_SPOS_PAIN: 220,
      S_SPOS_PAIN2: 221,
      S_SPOS_DIE1: 222,
      S_SPOS_DIE2: 223,
      S_SPOS_DIE3: 224,
      S_SPOS_DIE4: 225,
      S_SPOS_DIE5: 226,
      S_SPOS_XDIE1: 227,
      S_SPOS_XDIE2: 228,
      S_SPOS_XDIE3: 229,
      S_SPOS_XDIE4: 230,
      S_SPOS_XDIE5: 231,
      S_SPOS_XDIE6: 232,
      S_SPOS_XDIE7: 233,
      S_SPOS_XDIE8: 234,
      S_SPOS_XDIE9: 235,
      S_SPOS_RAISE1: 236,
      S_SPOS_RAISE2: 237,
      S_SPOS_RAISE3: 238,
      S_SPOS_RAISE4: 239,
      S_SPOS_RAISE5: 240,
      S_VILE_STND: 241,
      S_VILE_STND2: 242,
      S_VILE_RUN1: 243,
      S_VILE_RUN2: 244,
      S_VILE_RUN3: 245,
      S_VILE_RUN4: 246,
      S_VILE_RUN5: 247,
      S_VILE_RUN6: 248,
      S_VILE_RUN7: 249,
      S_VILE_RUN8: 250,
      S_VILE_RUN9: 251,
      S_VILE_RUN10: 252,
      S_VILE_RUN11: 253,
      S_VILE_RUN12: 254,
      S_VILE_ATK1: 255,
      S_VILE_ATK2: 256,
      S_VILE_ATK3: 257,
      S_VILE_ATK4: 258,
      S_VILE_ATK5: 259,
      S_VILE_ATK6: 260,
      S_VILE_ATK7: 261,
      S_VILE_ATK8: 262,
      S_VILE_ATK9: 263,
      S_VILE_ATK10: 264,
      S_VILE_ATK11: 265,
      S_VILE_HEAL1: 266,
      S_VILE_HEAL2: 267,
      S_VILE_HEAL3: 268,
      S_VILE_PAIN: 269,
      S_VILE_PAIN2: 270,
      S_VILE_DIE1: 271,
      S_VILE_DIE2: 272,
      S_VILE_DIE3: 273,
      S_VILE_DIE4: 274,
      S_VILE_DIE5: 275,
      S_VILE_DIE6: 276,
      S_VILE_DIE7: 277,
      S_VILE_DIE8: 278,
      S_VILE_DIE9: 279,
      S_VILE_DIE10: 280,
      S_FIRE1: 281,
      S_FIRE2: 282,
      S_FIRE3: 283,
      S_FIRE4: 284,
      S_FIRE5: 285,
      S_FIRE6: 286,
      S_FIRE7: 287,
      S_FIRE8: 288,
      S_FIRE9: 289,
      S_FIRE10: 290,
      S_FIRE11: 291,
      S_FIRE12: 292,
      S_FIRE13: 293,
      S_FIRE14: 294,
      S_FIRE15: 295,
      S_FIRE16: 296,
      S_FIRE17: 297,
      S_FIRE18: 298,
      S_FIRE19: 299,
      S_FIRE20: 300,
      S_FIRE21: 301,
      S_FIRE22: 302,
      S_FIRE23: 303,
      S_FIRE24: 304,
      S_FIRE25: 305,
      S_FIRE26: 306,
      S_FIRE27: 307,
      S_FIRE28: 308,
      S_FIRE29: 309,
      S_FIRE30: 310,
      S_SMOKE1: 311,
      S_SMOKE2: 312,
      S_SMOKE3: 313,
      S_SMOKE4: 314,
      S_SMOKE5: 315,
      S_TRACER: 316,
      S_TRACER2: 317,
      S_TRACEEXP1: 318,
      S_TRACEEXP2: 319,
      S_TRACEEXP3: 320,
      S_SKEL_STND: 321,
      S_SKEL_STND2: 322,
      S_SKEL_RUN1: 323,
      S_SKEL_RUN2: 324,
      S_SKEL_RUN3: 325,
      S_SKEL_RUN4: 326,
      S_SKEL_RUN5: 327,
      S_SKEL_RUN6: 328,
      S_SKEL_RUN7: 329,
      S_SKEL_RUN8: 330,
      S_SKEL_RUN9: 331,
      S_SKEL_RUN10: 332,
      S_SKEL_RUN11: 333,
      S_SKEL_RUN12: 334,
      S_SKEL_FIST1: 335,
      S_SKEL_FIST2: 336,
      S_SKEL_FIST3: 337,
      S_SKEL_FIST4: 338,
      S_SKEL_MISS1: 339,
      S_SKEL_MISS2: 340,
      S_SKEL_MISS3: 341,
      S_SKEL_MISS4: 342,
      S_SKEL_PAIN: 343,
      S_SKEL_PAIN2: 344,
      S_SKEL_DIE1: 345,
      S_SKEL_DIE2: 346,
      S_SKEL_DIE3: 347,
      S_SKEL_DIE4: 348,
      S_SKEL_DIE5: 349,
      S_SKEL_DIE6: 350,
      S_SKEL_RAISE1: 351,
      S_SKEL_RAISE2: 352,
      S_SKEL_RAISE3: 353,
      S_SKEL_RAISE4: 354,
      S_SKEL_RAISE5: 355,
      S_SKEL_RAISE6: 356,
      S_FATSHOT1: 357,
      S_FATSHOT2: 358,
      S_FATSHOTX1: 359,
      S_FATSHOTX2: 360,
      S_FATSHOTX3: 361,
      S_FATT_STND: 362,
      S_FATT_STND2: 363,
      S_FATT_RUN1: 364,
      S_FATT_RUN2: 365,
      S_FATT_RUN3: 366,
      S_FATT_RUN4: 367,
      S_FATT_RUN5: 368,
      S_FATT_RUN6: 369,
      S_FATT_RUN7: 370,
      S_FATT_RUN8: 371,
      S_FATT_RUN9: 372,
      S_FATT_RUN10: 373,
      S_FATT_RUN11: 374,
      S_FATT_RUN12: 375,
      S_FATT_ATK1: 376,
      S_FATT_ATK2: 377,
      S_FATT_ATK3: 378,
      S_FATT_ATK4: 379,
      S_FATT_ATK5: 380,
      S_FATT_ATK6: 381,
      S_FATT_ATK7: 382,
      S_FATT_ATK8: 383,
      S_FATT_ATK9: 384,
      S_FATT_ATK10: 385,
      S_FATT_PAIN: 386,
      S_FATT_PAIN2: 387,
      S_FATT_DIE1: 388,
      S_FATT_DIE2: 389,
      S_FATT_DIE3: 390,
      S_FATT_DIE4: 391,
      S_FATT_DIE5: 392,
      S_FATT_DIE6: 393,
      S_FATT_DIE7: 394,
      S_FATT_DIE8: 395,
      S_FATT_DIE9: 396,
      S_FATT_DIE10: 397,
      S_FATT_RAISE1: 398,
      S_FATT_RAISE2: 399,
      S_FATT_RAISE3: 400,
      S_FATT_RAISE4: 401,
      S_FATT_RAISE5: 402,
      S_FATT_RAISE6: 403,
      S_FATT_RAISE7: 404,
      S_FATT_RAISE8: 405,
      S_CPOS_STND: 406,
      S_CPOS_STND2: 407,
      S_CPOS_RUN1: 408,
      S_CPOS_RUN2: 409,
      S_CPOS_RUN3: 410,
      S_CPOS_RUN4: 411,
      S_CPOS_RUN5: 412,
      S_CPOS_RUN6: 413,
      S_CPOS_RUN7: 414,
      S_CPOS_RUN8: 415,
      S_CPOS_ATK1: 416,
      S_CPOS_ATK2: 417,
      S_CPOS_ATK3: 418,
      S_CPOS_ATK4: 419,
      S_CPOS_PAIN: 420,
      S_CPOS_PAIN2: 421,
      S_CPOS_DIE1: 422,
      S_CPOS_DIE2: 423,
      S_CPOS_DIE3: 424,
      S_CPOS_DIE4: 425,
      S_CPOS_DIE5: 426,
      S_CPOS_DIE6: 427,
      S_CPOS_DIE7: 428,
      S_CPOS_XDIE1: 429,
      S_CPOS_XDIE2: 430,
      S_CPOS_XDIE3: 431,
      S_CPOS_XDIE4: 432,
      S_CPOS_XDIE5: 433,
      S_CPOS_XDIE6: 434,
      S_CPOS_RAISE1: 435,
      S_CPOS_RAISE2: 436,
      S_CPOS_RAISE3: 437,
      S_CPOS_RAISE4: 438,
      S_CPOS_RAISE5: 439,
      S_CPOS_RAISE6: 440,
      S_CPOS_RAISE7: 441,
      S_TROO_STND: 442,
      S_TROO_STND2: 443,
      S_TROO_RUN1: 444,
      S_TROO_RUN2: 445,
      S_TROO_RUN3: 446,
      S_TROO_RUN4: 447,
      S_TROO_RUN5: 448,
      S_TROO_RUN6: 449,
      S_TROO_RUN7: 450,
      S_TROO_RUN8: 451,
      S_TROO_ATK1: 452,
      S_TROO_ATK2: 453,
      S_TROO_ATK3: 454,
      S_TROO_PAIN: 455,
      S_TROO_PAIN2: 456,
      S_TROO_DIE1: 457,
      S_TROO_DIE2: 458,
      S_TROO_DIE3: 459,
      S_TROO_DIE4: 460,
      S_TROO_DIE5: 461,
      S_TROO_XDIE1: 462,
      S_TROO_XDIE2: 463,
      S_TROO_XDIE3: 464,
      S_TROO_XDIE4: 465,
      S_TROO_XDIE5: 466,
      S_TROO_XDIE6: 467,
      S_TROO_XDIE7: 468,
      S_TROO_XDIE8: 469,
      S_TROO_RAISE1: 470,
      S_TROO_RAISE2: 471,
      S_TROO_RAISE3: 472,
      S_TROO_RAISE4: 473,
      S_TROO_RAISE5: 474,
      S_SARG_STND: 475,
      S_SARG_STND2: 476,
      S_SARG_RUN1: 477,
      S_SARG_RUN2: 478,
      S_SARG_RUN3: 479,
      S_SARG_RUN4: 480,
      S_SARG_RUN5: 481,
      S_SARG_RUN6: 482,
      S_SARG_RUN7: 483,
      S_SARG_RUN8: 484,
      S_SARG_ATK1: 485,
      S_SARG_ATK2: 486,
      S_SARG_ATK3: 487,
      S_SARG_PAIN: 488,
      S_SARG_PAIN2: 489,
      S_SARG_DIE1: 490,
      S_SARG_DIE2: 491,
      S_SARG_DIE3: 492,
      S_SARG_DIE4: 493,
      S_SARG_DIE5: 494,
      S_SARG_DIE6: 495,
      S_SARG_RAISE1: 496,
      S_SARG_RAISE2: 497,
      S_SARG_RAISE3: 498,
      S_SARG_RAISE4: 499,
      S_SARG_RAISE5: 500,
      S_SARG_RAISE6: 501,
      S_HEAD_STND: 502,
      S_HEAD_RUN1: 503,
      S_HEAD_ATK1: 504,
      S_HEAD_ATK2: 505,
      S_HEAD_ATK3: 506,
      S_HEAD_PAIN: 507,
      S_HEAD_PAIN2: 508,
      S_HEAD_PAIN3: 509,
      S_HEAD_DIE1: 510,
      S_HEAD_DIE2: 511,
      S_HEAD_DIE3: 512,
      S_HEAD_DIE4: 513,
      S_HEAD_DIE5: 514,
      S_HEAD_DIE6: 515,
      S_HEAD_RAISE1: 516,
      S_HEAD_RAISE2: 517,
      S_HEAD_RAISE3: 518,
      S_HEAD_RAISE4: 519,
      S_HEAD_RAISE5: 520,
      S_HEAD_RAISE6: 521,
      S_BRBALL1: 522,
      S_BRBALL2: 523,
      S_BRBALLX1: 524,
      S_BRBALLX2: 525,
      S_BRBALLX3: 526,
      S_BOSS_STND: 527,
      S_BOSS_STND2: 528,
      S_BOSS_RUN1: 529,
      S_BOSS_RUN2: 530,
      S_BOSS_RUN3: 531,
      S_BOSS_RUN4: 532,
      S_BOSS_RUN5: 533,
      S_BOSS_RUN6: 534,
      S_BOSS_RUN7: 535,
      S_BOSS_RUN8: 536,
      S_BOSS_ATK1: 537,
      S_BOSS_ATK2: 538,
      S_BOSS_ATK3: 539,
      S_BOSS_PAIN: 540,
      S_BOSS_PAIN2: 541,
      S_BOSS_DIE1: 542,
      S_BOSS_DIE2: 543,
      S_BOSS_DIE3: 544,
      S_BOSS_DIE4: 545,
      S_BOSS_DIE5: 546,
      S_BOSS_DIE6: 547,
      S_BOSS_DIE7: 548,
      S_BOSS_RAISE1: 549,
      S_BOSS_RAISE2: 550,
      S_BOSS_RAISE3: 551,
      S_BOSS_RAISE4: 552,
      S_BOSS_RAISE5: 553,
      S_BOSS_RAISE6: 554,
      S_BOSS_RAISE7: 555,
      S_BOS2_STND: 556,
      S_BOS2_STND2: 557,
      S_BOS2_RUN1: 558,
      S_BOS2_RUN2: 559,
      S_BOS2_RUN3: 560,
      S_BOS2_RUN4: 561,
      S_BOS2_RUN5: 562,
      S_BOS2_RUN6: 563,
      S_BOS2_RUN7: 564,
      S_BOS2_RUN8: 565,
      S_BOS2_ATK1: 566,
      S_BOS2_ATK2: 567,
      S_BOS2_ATK3: 568,
      S_BOS2_PAIN: 569,
      S_BOS2_PAIN2: 570,
      S_BOS2_DIE1: 571,
      S_BOS2_DIE2: 572,
      S_BOS2_DIE3: 573,
      S_BOS2_DIE4: 574,
      S_BOS2_DIE5: 575,
      S_BOS2_DIE6: 576,
      S_BOS2_DIE7: 577,
      S_BOS2_RAISE1: 578,
      S_BOS2_RAISE2: 579,
      S_BOS2_RAISE3: 580,
      S_BOS2_RAISE4: 581,
      S_BOS2_RAISE5: 582,
      S_BOS2_RAISE6: 583,
      S_BOS2_RAISE7: 584,
      S_SKULL_STND: 585,
      S_SKULL_STND2: 586,
      S_SKULL_RUN1: 587,
      S_SKULL_RUN2: 588,
      S_SKULL_ATK1: 589,
      S_SKULL_ATK2: 590,
      S_SKULL_ATK3: 591,
      S_SKULL_ATK4: 592,
      S_SKULL_PAIN: 593,
      S_SKULL_PAIN2: 594,
      S_SKULL_DIE1: 595,
      S_SKULL_DIE2: 596,
      S_SKULL_DIE3: 597,
      S_SKULL_DIE4: 598,
      S_SKULL_DIE5: 599,
      S_SKULL_DIE6: 600,
      S_SPID_STND: 601,
      S_SPID_STND2: 602,
      S_SPID_RUN1: 603,
      S_SPID_RUN2: 604,
      S_SPID_RUN3: 605,
      S_SPID_RUN4: 606,
      S_SPID_RUN5: 607,
      S_SPID_RUN6: 608,
      S_SPID_RUN7: 609,
      S_SPID_RUN8: 610,
      S_SPID_RUN9: 611,
      S_SPID_RUN10: 612,
      S_SPID_RUN11: 613,
      S_SPID_RUN12: 614,
      S_SPID_ATK1: 615,
      S_SPID_ATK2: 616,
      S_SPID_ATK3: 617,
      S_SPID_ATK4: 618,
      S_SPID_PAIN: 619,
      S_SPID_PAIN2: 620,
      S_SPID_DIE1: 621,
      S_SPID_DIE2: 622,
      S_SPID_DIE3: 623,
      S_SPID_DIE4: 624,
      S_SPID_DIE5: 625,
      S_SPID_DIE6: 626,
      S_SPID_DIE7: 627,
      S_SPID_DIE8: 628,
      S_SPID_DIE9: 629,
      S_SPID_DIE10: 630,
      S_SPID_DIE11: 631,
      S_BSPI_STND: 632,
      S_BSPI_STND2: 633,
      S_BSPI_SIGHT: 634,
      S_BSPI_RUN1: 635,
      S_BSPI_RUN2: 636,
      S_BSPI_RUN3: 637,
      S_BSPI_RUN4: 638,
      S_BSPI_RUN5: 639,
      S_BSPI_RUN6: 640,
      S_BSPI_RUN7: 641,
      S_BSPI_RUN8: 642,
      S_BSPI_RUN9: 643,
      S_BSPI_RUN10: 644,
      S_BSPI_RUN11: 645,
      S_BSPI_RUN12: 646,
      S_BSPI_ATK1: 647,
      S_BSPI_ATK2: 648,
      S_BSPI_ATK3: 649,
      S_BSPI_ATK4: 650,
      S_BSPI_PAIN: 651,
      S_BSPI_PAIN2: 652,
      S_BSPI_DIE1: 653,
      S_BSPI_DIE2: 654,
      S_BSPI_DIE3: 655,
      S_BSPI_DIE4: 656,
      S_BSPI_DIE5: 657,
      S_BSPI_DIE6: 658,
      S_BSPI_DIE7: 659,
      S_BSPI_RAISE1: 660,
      S_BSPI_RAISE2: 661,
      S_BSPI_RAISE3: 662,
      S_BSPI_RAISE4: 663,
      S_BSPI_RAISE5: 664,
      S_BSPI_RAISE6: 665,
      S_BSPI_RAISE7: 666,
      S_ARACH_PLAZ: 667,
      S_ARACH_PLAZ2: 668,
      S_ARACH_PLEX: 669,
      S_ARACH_PLEX2: 670,
      S_ARACH_PLEX3: 671,
      S_ARACH_PLEX4: 672,
      S_ARACH_PLEX5: 673,
      S_CYBER_STND: 674,
      S_CYBER_STND2: 675,
      S_CYBER_RUN1: 676,
      S_CYBER_RUN2: 677,
      S_CYBER_RUN3: 678,
      S_CYBER_RUN4: 679,
      S_CYBER_RUN5: 680,
      S_CYBER_RUN6: 681,
      S_CYBER_RUN7: 682,
      S_CYBER_RUN8: 683,
      S_CYBER_ATK1: 684,
      S_CYBER_ATK2: 685,
      S_CYBER_ATK3: 686,
      S_CYBER_ATK4: 687,
      S_CYBER_ATK5: 688,
      S_CYBER_ATK6: 689,
      S_CYBER_PAIN: 690,
      S_CYBER_DIE1: 691,
      S_CYBER_DIE2: 692,
      S_CYBER_DIE3: 693,
      S_CYBER_DIE4: 694,
      S_CYBER_DIE5: 695,
      S_CYBER_DIE6: 696,
      S_CYBER_DIE7: 697,
      S_CYBER_DIE8: 698,
      S_CYBER_DIE9: 699,
      S_CYBER_DIE10: 700,
      S_PAIN_STND: 701,
      S_PAIN_RUN1: 702,
      S_PAIN_RUN2: 703,
      S_PAIN_RUN3: 704,
      S_PAIN_RUN4: 705,
      S_PAIN_RUN5: 706,
      S_PAIN_RUN6: 707,
      S_PAIN_ATK1: 708,
      S_PAIN_ATK2: 709,
      S_PAIN_ATK3: 710,
      S_PAIN_ATK4: 711,
      S_PAIN_PAIN: 712,
      S_PAIN_PAIN2: 713,
      S_PAIN_DIE1: 714,
      S_PAIN_DIE2: 715,
      S_PAIN_DIE3: 716,
      S_PAIN_DIE4: 717,
      S_PAIN_DIE5: 718,
      S_PAIN_DIE6: 719,
      S_PAIN_RAISE1: 720,
      S_PAIN_RAISE2: 721,
      S_PAIN_RAISE3: 722,
      S_PAIN_RAISE4: 723,
      S_PAIN_RAISE5: 724,
      S_PAIN_RAISE6: 725,
      S_SSWV_STND: 726,
      S_SSWV_STND2: 727,
      S_SSWV_RUN1: 728,
      S_SSWV_RUN2: 729,
      S_SSWV_RUN3: 730,
      S_SSWV_RUN4: 731,
      S_SSWV_RUN5: 732,
      S_SSWV_RUN6: 733,
      S_SSWV_RUN7: 734,
      S_SSWV_RUN8: 735,
      S_SSWV_ATK1: 736,
      S_SSWV_ATK2: 737,
      S_SSWV_ATK3: 738,
      S_SSWV_ATK4: 739,
      S_SSWV_ATK5: 740,
      S_SSWV_ATK6: 741,
      S_SSWV_PAIN: 742,
      S_SSWV_PAIN2: 743,
      S_SSWV_DIE1: 744,
      S_SSWV_DIE2: 745,
      S_SSWV_DIE3: 746,
      S_SSWV_DIE4: 747,
      S_SSWV_DIE5: 748,
      S_SSWV_XDIE1: 749,
      S_SSWV_XDIE2: 750,
      S_SSWV_XDIE3: 751,
      S_SSWV_XDIE4: 752,
      S_SSWV_XDIE5: 753,
      S_SSWV_XDIE6: 754,
      S_SSWV_XDIE7: 755,
      S_SSWV_XDIE8: 756,
      S_SSWV_XDIE9: 757,
      S_SSWV_RAISE1: 758,
      S_SSWV_RAISE2: 759,
      S_SSWV_RAISE3: 760,
      S_SSWV_RAISE4: 761,
      S_SSWV_RAISE5: 762,
      S_KEENSTND: 763,
      S_COMMKEEN: 764,
      S_COMMKEEN2: 765,
      S_COMMKEEN3: 766,
      S_COMMKEEN4: 767,
      S_COMMKEEN5: 768,
      S_COMMKEEN6: 769,
      S_COMMKEEN7: 770,
      S_COMMKEEN8: 771,
      S_COMMKEEN9: 772,
      S_COMMKEEN10: 773,
      S_COMMKEEN11: 774,
      S_COMMKEEN12: 775,
      S_KEENPAIN: 776,
      S_KEENPAIN2: 777,
      S_BRAIN: 778,
      S_BRAIN_PAIN: 779,
      S_BRAIN_DIE1: 780,
      S_BRAIN_DIE2: 781,
      S_BRAIN_DIE3: 782,
      S_BRAIN_DIE4: 783,
      S_BRAINEYE: 784,
      S_BRAINEYESEE: 785,
      S_BRAINEYE1: 786,
      S_SPAWN1: 787,
      S_SPAWN2: 788,
      S_SPAWN3: 789,
      S_SPAWN4: 790,
      S_SPAWNFIRE1: 791,
      S_SPAWNFIRE2: 792,
      S_SPAWNFIRE3: 793,
      S_SPAWNFIRE4: 794,
      S_SPAWNFIRE5: 795,
      S_SPAWNFIRE6: 796,
      S_SPAWNFIRE7: 797,
      S_SPAWNFIRE8: 798,
      S_BRAINEXPLODE1: 799,
      S_BRAINEXPLODE2: 800,
      S_BRAINEXPLODE3: 801,
      S_ARM1: 802,
      S_ARM1A: 803,
      S_ARM2: 804,
      S_ARM2A: 805,
      S_BAR1: 806,
      S_BAR2: 807,
      S_BEXP: 808,
      S_BEXP2: 809,
      S_BEXP3: 810,
      S_BEXP4: 811,
      S_BEXP5: 812,
      S_BBAR1: 813,
      S_BBAR2: 814,
      S_BBAR3: 815,
      S_BON1: 816,
      S_BON1A: 817,
      S_BON1B: 818,
      S_BON1C: 819,
      S_BON1D: 820,
      S_BON1E: 821,
      S_BON2: 822,
      S_BON2A: 823,
      S_BON2B: 824,
      S_BON2C: 825,
      S_BON2D: 826,
      S_BON2E: 827,
      S_BKEY: 828,
      S_BKEY2: 829,
      S_RKEY: 830,
      S_RKEY2: 831,
      S_YKEY: 832,
      S_YKEY2: 833,
      S_BSKULL: 834,
      S_BSKULL2: 835,
      S_RSKULL: 836,
      S_RSKULL2: 837,
      S_YSKULL: 838,
      S_YSKULL2: 839,
      S_STIM: 840,
      S_MEDI: 841,
      S_SOUL: 842,
      S_SOUL2: 843,
      S_SOUL3: 844,
      S_SOUL4: 845,
      S_SOUL5: 846,
      S_SOUL6: 847,
      S_PINV: 848,
      S_PINV2: 849,
      S_PINV3: 850,
      S_PINV4: 851,
      S_PSTR: 852,
      S_PINS: 853,
      S_PINS2: 854,
      S_PINS3: 855,
      S_PINS4: 856,
      S_MEGA: 857,
      S_MEGA2: 858,
      S_MEGA3: 859,
      S_MEGA4: 860,
      S_SUIT: 861,
      S_PMAP: 862,
      S_PMAP2: 863,
      S_PMAP3: 864,
      S_PMAP4: 865,
      S_PMAP5: 866,
      S_PMAP6: 867,
      S_PVIS: 868,
      S_PVIS2: 869,
      S_CLIP: 870,
      S_AMMO: 871,
      S_ROCK: 872,
      S_BROK: 873,
      S_CELL: 874,
      S_CELP: 875,
      S_SHEL: 876,
      S_SBOX: 877,
      S_BPAK: 878,
      S_BFUG: 879,
      S_MGUN: 880,
      S_CSAW: 881,
      S_LAUN: 882,
      S_PLAS: 883,
      S_SHOT: 884,
      S_SHOT2: 885,
      S_COLU: 886,
      S_STALAG: 887,
      S_BLOODYTWITCH: 888,
      S_BLOODYTWITCH2: 889,
      S_BLOODYTWITCH3: 890,
      S_BLOODYTWITCH4: 891,
      S_DEADTORSO: 892,
      S_DEADBOTTOM: 893,
      S_HEADSONSTICK: 894,
      S_GIBS: 895,
      S_HEADONASTICK: 896,
      S_HEADCANDLES: 897,
      S_HEADCANDLES2: 898,
      S_DEADSTICK: 899,
      S_LIVESTICK: 900,
      S_LIVESTICK2: 901,
      S_MEAT2: 902,
      S_MEAT3: 903,
      S_MEAT4: 904,
      S_MEAT5: 905,
      S_STALAGTITE: 906,
      S_TALLGRNCOL: 907,
      S_SHRTGRNCOL: 908,
      S_TALLREDCOL: 909,
      S_SHRTREDCOL: 910,
      S_CANDLESTIK: 911,
      S_CANDELABRA: 912,
      S_SKULLCOL: 913,
      S_TORCHTREE: 914,
      S_BIGTREE: 915,
      S_TECHPILLAR: 916,
      S_EVILEYE: 917,
      S_EVILEYE2: 918,
      S_EVILEYE3: 919,
      S_EVILEYE4: 920,
      S_FLOATSKULL: 921,
      S_FLOATSKULL2: 922,
      S_FLOATSKULL3: 923,
      S_HEARTCOL: 924,
      S_HEARTCOL2: 925,
      S_BLUETORCH: 926,
      S_BLUETORCH2: 927,
      S_BLUETORCH3: 928,
      S_BLUETORCH4: 929,
      S_GREENTORCH: 930,
      S_GREENTORCH2: 931,
      S_GREENTORCH3: 932,
      S_GREENTORCH4: 933,
      S_REDTORCH: 934,
      S_REDTORCH2: 935,
      S_REDTORCH3: 936,
      S_REDTORCH4: 937,
      S_BTORCHSHRT: 938,
      S_BTORCHSHRT2: 939,
      S_BTORCHSHRT3: 940,
      S_BTORCHSHRT4: 941,
      S_GTORCHSHRT: 942,
      S_GTORCHSHRT2: 943,
      S_GTORCHSHRT3: 944,
      S_GTORCHSHRT4: 945,
      S_RTORCHSHRT: 946,
      S_RTORCHSHRT2: 947,
      S_RTORCHSHRT3: 948,
      S_RTORCHSHRT4: 949,
      S_HANGNOGUTS: 950,
      S_HANGBNOBRAIN: 951,
      S_HANGTLOOKDN: 952,
      S_HANGTSKULL: 953,
      S_HANGTLOOKUP: 954,
      S_HANGTNOBRAIN: 955,
      S_COLONGIBS: 956,
      S_SMALLPOOL: 957,
      S_BRAINSTEM: 958,
      S_TECHLAMP: 959,
      S_TECHLAMP2: 960,
      S_TECHLAMP3: 961,
      S_TECHLAMP4: 962,
      S_TECH2LAMP: 963,
      S_TECH2LAMP2: 964,
      S_TECH2LAMP3: 965,
      S_TECH2LAMP4: 966
    };
    MT = {
      MT_PLAYER: 0,
      MT_POSSESSED: 1,
      MT_SHOTGUY: 2,
      MT_VILE: 3,
      MT_FIRE: 4,
      MT_UNDEAD: 5,
      MT_TRACER: 6,
      MT_SMOKE: 7,
      MT_FATSO: 8,
      MT_FATSHOT: 9,
      MT_CHAINGUY: 10,
      MT_TROOP: 11,
      MT_SERGEANT: 12,
      MT_SHADOWS: 13,
      MT_HEAD: 14,
      MT_BRUISER: 15,
      MT_BRUISERSHOT: 16,
      MT_KNIGHT: 17,
      MT_SKULL: 18,
      MT_SPIDER: 19,
      MT_BABY: 20,
      MT_CYBORG: 21,
      MT_PAIN: 22,
      MT_WOLFSS: 23,
      MT_KEEN: 24,
      MT_BOSSBRAIN: 25,
      MT_BOSSSPIT: 26,
      MT_BOSSTARGET: 27,
      MT_SPAWNSHOT: 28,
      MT_SPAWNFIRE: 29,
      MT_BARREL: 30,
      MT_TROOPSHOT: 31,
      MT_HEADSHOT: 32,
      MT_ROCKET: 33,
      MT_PLASMA: 34,
      MT_BFG: 35,
      MT_ARACHPLAZ: 36,
      MT_PUFF: 37,
      MT_BLOOD: 38,
      MT_TFOG: 39,
      MT_IFOG: 40,
      MT_TELEPORTMAN: 41,
      MT_EXTRABFG: 42,
      MT_MISC0: 43,
      MT_MISC1: 44,
      MT_MISC2: 45,
      MT_MISC3: 46,
      MT_MISC4: 47,
      MT_MISC5: 48,
      MT_MISC6: 49,
      MT_MISC7: 50,
      MT_MISC8: 51,
      MT_MISC9: 52,
      MT_MISC10: 53,
      MT_MISC11: 54,
      MT_MISC12: 55,
      MT_INV: 56,
      MT_MISC13: 57,
      MT_INS: 58,
      MT_MISC14: 59,
      MT_MISC15: 60,
      MT_MISC16: 61,
      MT_MEGA: 62,
      MT_CLIP: 63,
      MT_MISC17: 64,
      MT_MISC18: 65,
      MT_MISC19: 66,
      MT_MISC20: 67,
      MT_MISC21: 68,
      MT_MISC22: 69,
      MT_MISC23: 70,
      MT_MISC24: 71,
      MT_MISC25: 72,
      MT_CHAINGUN: 73,
      MT_MISC26: 74,
      MT_MISC27: 75,
      MT_MISC28: 76,
      MT_SHOTGUN: 77,
      MT_SUPERSHOTGUN: 78,
      MT_MISC29: 79,
      MT_MISC30: 80,
      MT_MISC31: 81,
      MT_MISC32: 82,
      MT_MISC33: 83,
      MT_MISC34: 84,
      MT_MISC35: 85,
      MT_MISC36: 86,
      MT_MISC37: 87,
      MT_MISC38: 88,
      MT_MISC39: 89,
      MT_MISC40: 90,
      MT_MISC41: 91,
      MT_MISC42: 92,
      MT_MISC43: 93,
      MT_MISC44: 94,
      MT_MISC45: 95,
      MT_MISC46: 96,
      MT_MISC47: 97,
      MT_MISC48: 98,
      MT_MISC49: 99,
      MT_MISC50: 100,
      MT_MISC51: 101,
      MT_MISC52: 102,
      MT_MISC53: 103,
      MT_MISC54: 104,
      MT_MISC55: 105,
      MT_MISC56: 106,
      MT_MISC57: 107,
      MT_MISC58: 108,
      MT_MISC59: 109,
      MT_MISC60: 110,
      MT_MISC61: 111,
      MT_MISC62: 112,
      MT_MISC63: 113,
      MT_MISC64: 114,
      MT_MISC65: 115,
      MT_MISC66: 116,
      MT_MISC67: 117,
      MT_MISC68: 118,
      MT_MISC69: 119,
      MT_MISC70: 120,
      MT_MISC71: 121,
      MT_MISC72: 122,
      MT_MISC73: 123,
      MT_MISC74: 124,
      MT_MISC75: 125,
      MT_MISC76: 126,
      MT_MISC77: 127,
      MT_MISC78: 128,
      MT_MISC79: 129,
      MT_MISC80: 130,
      MT_MISC81: 131,
      MT_MISC82: 132,
      MT_MISC83: 133,
      MT_MISC84: 134,
      MT_MISC85: 135,
      MT_MISC86: 136
    };
    ACTION_NAMES = ["A_BFGSpray", "A_BFGsound", "A_BabyMetal", "A_BossDeath", "A_BrainAwake", "A_BrainDie", "A_BrainExplode", "A_BrainPain", "A_BrainScream", "A_BrainSpit", "A_BruisAttack", "A_BspiAttack", "A_CPosAttack", "A_CPosRefire", "A_Chase", "A_CheckReload", "A_CloseShotgun2", "A_CyberAttack", "A_Explode", "A_FaceTarget", "A_Fall", "A_FatAttack1", "A_FatAttack2", "A_FatAttack3", "A_FatRaise", "A_Fire", "A_FireBFG", "A_FireCGun", "A_FireCrackle", "A_FireMissile", "A_FirePistol", "A_FirePlasma", "A_FireShotgun", "A_FireShotgun2", "A_GunFlash", "A_HeadAttack", "A_Hoof", "A_KeenDie", "A_Light0", "A_Light1", "A_Light2", "A_LoadShotgun2", "A_Look", "A_Lower", "A_Metal", "A_OpenShotgun2", "A_Pain", "A_PainAttack", "A_PainDie", "A_PlayerScream", "A_PosAttack", "A_Punch", "A_Raise", "A_ReFire", "A_SPosAttack", "A_SargAttack", "A_Saw", "A_Scream", "A_SkelFist", "A_SkelMissile", "A_SkelWhoosh", "A_SkullAttack", "A_SpawnFly", "A_SpawnSound", "A_SpidRefire", "A_StartFire", "A_Tracer", "A_TroopAttack", "A_VileAttack", "A_VileChase", "A_VileStart", "A_VileTarget", "A_WeaponReady", "A_XScream"];
    weaponInfo = [{ "ammo": 4, "upState": 4, "downState": 3, "readyState": 2, "atkState": 5, "flashState": 0 }, { "ammo": 0, "upState": 12, "downState": 11, "readyState": 10, "atkState": 13, "flashState": 17 }, { "ammo": 1, "upState": 20, "downState": 19, "readyState": 18, "atkState": 21, "flashState": 30 }, { "ammo": 0, "upState": 51, "downState": 50, "readyState": 49, "atkState": 52, "flashState": 55 }, { "ammo": 3, "upState": 59, "downState": 58, "readyState": 57, "atkState": 60, "flashState": 63 }, { "ammo": 2, "upState": 76, "downState": 75, "readyState": 74, "atkState": 77, "flashState": 79 }, { "ammo": 2, "upState": 83, "downState": 82, "readyState": 81, "atkState": 84, "flashState": 88 }, { "ammo": 4, "upState": 70, "downState": 69, "readyState": 67, "atkState": 71, "flashState": 0 }, { "ammo": 1, "upState": 34, "downState": 33, "readyState": 32, "atkState": 35, "flashState": 47 }];
    WP = {
      wp_fist: 0,
      wp_pistol: 1,
      wp_shotgun: 2,
      wp_chaingun: 3,
      wp_missile: 4,
      wp_plasma: 5,
      wp_bfg: 6,
      wp_chainsaw: 7,
      wp_supershotgun: 8,
      wp_nochange: 9
    };
    AM = {
      am_clip: 0,
      am_shell: 1,
      am_cell: 2,
      am_misl: 3,
      am_noammo: 4
    };
    maxAmmo = [200, 50, 300, 50];
    clipAmmo = [10, 4, 20, 1];
  }
});

// src/tables.ts
var FINEANGLES, FINEMASK, ANGLETOFINESHIFT, SLOPERANGE, SLOPEBITS, DBITS, finesine, finecosine, finetangent, tantoangle;
var init_tables = __esm({
  "src/tables.ts"() {
    "use strict";
    FINEANGLES = 8192;
    FINEMASK = FINEANGLES - 1;
    ANGLETOFINESHIFT = 19;
    SLOPERANGE = 2048;
    SLOPEBITS = 11;
    DBITS = 16 - SLOPEBITS;
    finesine = new Int32Array([25, 75, 125, 175, 226, 276, 326, 376, 427, 477, 527, 578, 628, 678, 728, 779, 829, 879, 929, 980, 1030, 1080, 1130, 1181, 1231, 1281, 1331, 1382, 1432, 1482, 1532, 1583, 1633, 1683, 1733, 1784, 1834, 1884, 1934, 1985, 2035, 2085, 2135, 2186, 2236, 2286, 2336, 2387, 2437, 2487, 2537, 2587, 2638, 2688, 2738, 2788, 2839, 2889, 2939, 2989, 3039, 3090, 3140, 3190, 3240, 3291, 3341, 3391, 3441, 3491, 3541, 3592, 3642, 3692, 3742, 3792, 3843, 3893, 3943, 3993, 4043, 4093, 4144, 4194, 4244, 4294, 4344, 4394, 4445, 4495, 4545, 4595, 4645, 4695, 4745, 4796, 4846, 4896, 4946, 4996, 5046, 5096, 5146, 5197, 5247, 5297, 5347, 5397, 5447, 5497, 5547, 5597, 5647, 5697, 5748, 5798, 5848, 5898, 5948, 5998, 6048, 6098, 6148, 6198, 6248, 6298, 6348, 6398, 6448, 6498, 6548, 6598, 6648, 6698, 6748, 6798, 6848, 6898, 6948, 6998, 7048, 7098, 7148, 7198, 7248, 7298, 7348, 7398, 7448, 7498, 7548, 7598, 7648, 7697, 7747, 7797, 7847, 7897, 7947, 7997, 8047, 8097, 8147, 8196, 8246, 8296, 8346, 8396, 8446, 8496, 8545, 8595, 8645, 8695, 8745, 8794, 8844, 8894, 8944, 8994, 9043, 9093, 9143, 9193, 9243, 9292, 9342, 9392, 9442, 9491, 9541, 9591, 9640, 9690, 9740, 9790, 9839, 9889, 9939, 9988, 10038, 10088, 10137, 10187, 10237, 10286, 10336, 10386, 10435, 10485, 10534, 10584, 10634, 10683, 10733, 10782, 10832, 10882, 10931, 10981, 11030, 11080, 11129, 11179, 11228, 11278, 11327, 11377, 11426, 11476, 11525, 11575, 11624, 11674, 11723, 11773, 11822, 11872, 11921, 11970, 12020, 12069, 12119, 12168, 12218, 12267, 12316, 12366, 12415, 12464, 12514, 12563, 12612, 12662, 12711, 12760, 12810, 12859, 12908, 12957, 13007, 13056, 13105, 13154, 13204, 13253, 13302, 13351, 13401, 13450, 13499, 13548, 13597, 13647, 13696, 13745, 13794, 13843, 13892, 13941, 13990, 14040, 14089, 14138, 14187, 14236, 14285, 14334, 14383, 14432, 14481, 14530, 14579, 14628, 14677, 14726, 14775, 14824, 14873, 14922, 14971, 15020, 15069, 15118, 15167, 15215, 15264, 15313, 15362, 15411, 15460, 15509, 15557, 15606, 15655, 15704, 15753, 15802, 15850, 15899, 15948, 15997, 16045, 16094, 16143, 16191, 16240, 16289, 16338, 16386, 16435, 16484, 16532, 16581, 16629, 16678, 16727, 16775, 16824, 16872, 16921, 16970, 17018, 17067, 17115, 17164, 17212, 17261, 17309, 17358, 17406, 17455, 17503, 17551, 17600, 17648, 17697, 17745, 17793, 17842, 17890, 17939, 17987, 18035, 18084, 18132, 18180, 18228, 18277, 18325, 18373, 18421, 18470, 18518, 18566, 18614, 18663, 18711, 18759, 18807, 18855, 18903, 18951, 19e3, 19048, 19096, 19144, 19192, 19240, 19288, 19336, 19384, 19432, 19480, 19528, 19576, 19624, 19672, 19720, 19768, 19816, 19864, 19912, 19959, 20007, 20055, 20103, 20151, 20199, 20246, 20294, 20342, 20390, 20438, 20485, 20533, 20581, 20629, 20676, 20724, 20772, 20819, 20867, 20915, 20962, 21010, 21057, 21105, 21153, 21200, 21248, 21295, 21343, 21390, 21438, 21485, 21533, 21580, 21628, 21675, 21723, 21770, 21817, 21865, 21912, 21960, 22007, 22054, 22102, 22149, 22196, 22243, 22291, 22338, 22385, 22433, 22480, 22527, 22574, 22621, 22668, 22716, 22763, 22810, 22857, 22904, 22951, 22998, 23045, 23092, 23139, 23186, 23233, 23280, 23327, 23374, 23421, 23468, 23515, 23562, 23609, 23656, 23703, 23750, 23796, 23843, 23890, 23937, 23984, 24030, 24077, 24124, 24171, 24217, 24264, 24311, 24357, 24404, 24451, 24497, 24544, 24591, 24637, 24684, 24730, 24777, 24823, 24870, 24916, 24963, 25009, 25056, 25102, 25149, 25195, 25241, 25288, 25334, 25381, 25427, 25473, 25520, 25566, 25612, 25658, 25705, 25751, 25797, 25843, 25889, 25936, 25982, 26028, 26074, 26120, 26166, 26212, 26258, 26304, 26350, 26396, 26442, 26488, 26534, 26580, 26626, 26672, 26718, 26764, 26810, 26856, 26902, 26947, 26993, 27039, 27085, 27131, 27176, 27222, 27268, 27313, 27359, 27405, 27450, 27496, 27542, 27587, 27633, 27678, 27724, 27770, 27815, 27861, 27906, 27952, 27997, 28042, 28088, 28133, 28179, 28224, 28269, 28315, 28360, 28405, 28451, 28496, 28541, 28586, 28632, 28677, 28722, 28767, 28812, 28858, 28903, 28948, 28993, 29038, 29083, 29128, 29173, 29218, 29263, 29308, 29353, 29398, 29443, 29488, 29533, 29577, 29622, 29667, 29712, 29757, 29801, 29846, 29891, 29936, 29980, 30025, 30070, 30114, 30159, 30204, 30248, 30293, 30337, 30382, 30426, 30471, 30515, 30560, 30604, 30649, 30693, 30738, 30782, 30826, 30871, 30915, 30959, 31004, 31048, 31092, 31136, 31181, 31225, 31269, 31313, 31357, 31402, 31446, 31490, 31534, 31578, 31622, 31666, 31710, 31754, 31798, 31842, 31886, 31930, 31974, 32017, 32061, 32105, 32149, 32193, 32236, 32280, 32324, 32368, 32411, 32455, 32499, 32542, 32586, 32630, 32673, 32717, 32760, 32804, 32847, 32891, 32934, 32978, 33021, 33065, 33108, 33151, 33195, 33238, 33281, 33325, 33368, 33411, 33454, 33498, 33541, 33584, 33627, 33670, 33713, 33756, 33799, 33843, 33886, 33929, 33972, 34015, 34057, 34100, 34143, 34186, 34229, 34272, 34315, 34358, 34400, 34443, 34486, 34529, 34571, 34614, 34657, 34699, 34742, 34785, 34827, 34870, 34912, 34955, 34997, 35040, 35082, 35125, 35167, 35210, 35252, 35294, 35337, 35379, 35421, 35464, 35506, 35548, 35590, 35633, 35675, 35717, 35759, 35801, 35843, 35885, 35927, 35969, 36011, 36053, 36095, 36137, 36179, 36221, 36263, 36305, 36347, 36388, 36430, 36472, 36514, 36555, 36597, 36639, 36681, 36722, 36764, 36805, 36847, 36889, 36930, 36972, 37013, 37055, 37096, 37137, 37179, 37220, 37262, 37303, 37344, 37386, 37427, 37468, 37509, 37551, 37592, 37633, 37674, 37715, 37756, 37797, 37838, 37879, 37920, 37961, 38002, 38043, 38084, 38125, 38166, 38207, 38248, 38288, 38329, 38370, 38411, 38451, 38492, 38533, 38573, 38614, 38655, 38695, 38736, 38776, 38817, 38857, 38898, 38938, 38979, 39019, 39059, 39100, 39140, 39180, 39221, 39261, 39301, 39341, 39382, 39422, 39462, 39502, 39542, 39582, 39622, 39662, 39702, 39742, 39782, 39822, 39862, 39902, 39942, 39982, 40021, 40061, 40101, 40141, 40180, 40220, 40260, 40300, 40339, 40379, 40418, 40458, 40497, 40537, 40576, 40616, 40655, 40695, 40734, 40773, 40813, 40852, 40891, 40931, 40970, 41009, 41048, 41087, 41127, 41166, 41205, 41244, 41283, 41322, 41361, 41400, 41439, 41478, 41517, 41556, 41595, 41633, 41672, 41711, 41750, 41788, 41827, 41866, 41904, 41943, 41982, 42020, 42059, 42097, 42136, 42174, 42213, 42251, 42290, 42328, 42366, 42405, 42443, 42481, 42520, 42558, 42596, 42634, 42672, 42711, 42749, 42787, 42825, 42863, 42901, 42939, 42977, 43015, 43053, 43091, 43128, 43166, 43204, 43242, 43280, 43317, 43355, 43393, 43430, 43468, 43506, 43543, 43581, 43618, 43656, 43693, 43731, 43768, 43806, 43843, 43880, 43918, 43955, 43992, 44029, 44067, 44104, 44141, 44178, 44215, 44252, 44289, 44326, 44363, 44400, 44437, 44474, 44511, 44548, 44585, 44622, 44659, 44695, 44732, 44769, 44806, 44842, 44879, 44915, 44952, 44989, 45025, 45062, 45098, 45135, 45171, 45207, 45244, 45280, 45316, 45353, 45389, 45425, 45462, 45498, 45534, 45570, 45606, 45642, 45678, 45714, 45750, 45786, 45822, 45858, 45894, 45930, 45966, 46002, 46037, 46073, 46109, 46145, 46180, 46216, 46252, 46287, 46323, 46358, 46394, 46429, 46465, 46500, 46536, 46571, 46606, 46642, 46677, 46712, 46747, 46783, 46818, 46853, 46888, 46923, 46958, 46993, 47028, 47063, 47098, 47133, 47168, 47203, 47238, 47273, 47308, 47342, 47377, 47412, 47446, 47481, 47516, 47550, 47585, 47619, 47654, 47688, 47723, 47757, 47792, 47826, 47860, 47895, 47929, 47963, 47998, 48032, 48066, 48100, 48134, 48168, 48202, 48237, 48271, 48305, 48338, 48372, 48406, 48440, 48474, 48508, 48542, 48575, 48609, 48643, 48676, 48710, 48744, 48777, 48811, 48844, 48878, 48911, 48945, 48978, 49012, 49045, 49078, 49112, 49145, 49178, 49211, 49244, 49278, 49311, 49344, 49377, 49410, 49443, 49476, 49509, 49542, 49575, 49608, 49640, 49673, 49706, 49739, 49771, 49804, 49837, 49869, 49902, 49935, 49967, 5e4, 50032, 50065, 50097, 50129, 50162, 50194, 50226, 50259, 50291, 50323, 50355, 50387, 50420, 50452, 50484, 50516, 50548, 50580, 50612, 50644, 50675, 50707, 50739, 50771, 50803, 50834, 50866, 50898, 50929, 50961, 50993, 51024, 51056, 51087, 51119, 51150, 51182, 51213, 51244, 51276, 51307, 51338, 51369, 51401, 51432, 51463, 51494, 51525, 51556, 51587, 51618, 51649, 51680, 51711, 51742, 51773, 51803, 51834, 51865, 51896, 51926, 51957, 51988, 52018, 52049, 52079, 52110, 52140, 52171, 52201, 52231, 52262, 52292, 52322, 52353, 52383, 52413, 52443, 52473, 52503, 52534, 52564, 52594, 52624, 52653, 52683, 52713, 52743, 52773, 52803, 52832, 52862, 52892, 52922, 52951, 52981, 53010, 53040, 53069, 53099, 53128, 53158, 53187, 53216, 53246, 53275, 53304, 53334, 53363, 53392, 53421, 53450, 53479, 53508, 53537, 53566, 53595, 53624, 53653, 53682, 53711, 53739, 53768, 53797, 53826, 53854, 53883, 53911, 53940, 53969, 53997, 54026, 54054, 54082, 54111, 54139, 54167, 54196, 54224, 54252, 54280, 54308, 54337, 54365, 54393, 54421, 54449, 54477, 54505, 54533, 54560, 54588, 54616, 54644, 54672, 54699, 54727, 54755, 54782, 54810, 54837, 54865, 54892, 54920, 54947, 54974, 55002, 55029, 55056, 55084, 55111, 55138, 55165, 55192, 55219, 55246, 55274, 55300, 55327, 55354, 55381, 55408, 55435, 55462, 55489, 55515, 55542, 55569, 55595, 55622, 55648, 55675, 55701, 55728, 55754, 55781, 55807, 55833, 55860, 55886, 55912, 55938, 55965, 55991, 56017, 56043, 56069, 56095, 56121, 56147, 56173, 56199, 56225, 56250, 56276, 56302, 56328, 56353, 56379, 56404, 56430, 56456, 56481, 56507, 56532, 56557, 56583, 56608, 56633, 56659, 56684, 56709, 56734, 56760, 56785, 56810, 56835, 56860, 56885, 56910, 56935, 56959, 56984, 57009, 57034, 57059, 57083, 57108, 57133, 57157, 57182, 57206, 57231, 57255, 57280, 57304, 57329, 57353, 57377, 57402, 57426, 57450, 57474, 57498, 57522, 57546, 57570, 57594, 57618, 57642, 57666, 57690, 57714, 57738, 57762, 57785, 57809, 57833, 57856, 57880, 57903, 57927, 57950, 57974, 57997, 58021, 58044, 58067, 58091, 58114, 58137, 58160, 58183, 58207, 58230, 58253, 58276, 58299, 58322, 58345, 58367, 58390, 58413, 58436, 58459, 58481, 58504, 58527, 58549, 58572, 58594, 58617, 58639, 58662, 58684, 58706, 58729, 58751, 58773, 58795, 58818, 58840, 58862, 58884, 58906, 58928, 58950, 58972, 58994, 59016, 59038, 59059, 59081, 59103, 59125, 59146, 59168, 59190, 59211, 59233, 59254, 59276, 59297, 59318, 59340, 59361, 59382, 59404, 59425, 59446, 59467, 59488, 59509, 59530, 59551, 59572, 59593, 59614, 59635, 59656, 59677, 59697, 59718, 59739, 59759, 59780, 59801, 59821, 59842, 59862, 59883, 59903, 59923, 59944, 59964, 59984, 60004, 60025, 60045, 60065, 60085, 60105, 60125, 60145, 60165, 60185, 60205, 60225, 60244, 60264, 60284, 60304, 60323, 60343, 60363, 60382, 60402, 60421, 60441, 60460, 60479, 60499, 60518, 60537, 60556, 60576, 60595, 60614, 60633, 60652, 60671, 60690, 60709, 60728, 60747, 60766, 60785, 60803, 60822, 60841, 60859, 60878, 60897, 60915, 60934, 60952, 60971, 60989, 61007, 61026, 61044, 61062, 61081, 61099, 61117, 61135, 61153, 61171, 61189, 61207, 61225, 61243, 61261, 61279, 61297, 61314, 61332, 61350, 61367, 61385, 61403, 61420, 61438, 61455, 61473, 61490, 61507, 61525, 61542, 61559, 61577, 61594, 61611, 61628, 61645, 61662, 61679, 61696, 61713, 61730, 61747, 61764, 61780, 61797, 61814, 61831, 61847, 61864, 61880, 61897, 61913, 61930, 61946, 61963, 61979, 61995, 62012, 62028, 62044, 62060, 62076, 62092, 62108, 62125, 62141, 62156, 62172, 62188, 62204, 62220, 62236, 62251, 62267, 62283, 62298, 62314, 62329, 62345, 62360, 62376, 62391, 62407, 62422, 62437, 62453, 62468, 62483, 62498, 62513, 62528, 62543, 62558, 62573, 62588, 62603, 62618, 62633, 62648, 62662, 62677, 62692, 62706, 62721, 62735, 62750, 62764, 62779, 62793, 62808, 62822, 62836, 62850, 62865, 62879, 62893, 62907, 62921, 62935, 62949, 62963, 62977, 62991, 63005, 63019, 63032, 63046, 63060, 63074, 63087, 63101, 63114, 63128, 63141, 63155, 63168, 63182, 63195, 63208, 63221, 63235, 63248, 63261, 63274, 63287, 63300, 63313, 63326, 63339, 63352, 63365, 63378, 63390, 63403, 63416, 63429, 63441, 63454, 63466, 63479, 63491, 63504, 63516, 63528, 63541, 63553, 63565, 63578, 63590, 63602, 63614, 63626, 63638, 63650, 63662, 63674, 63686, 63698, 63709, 63721, 63733, 63745, 63756, 63768, 63779, 63791, 63803, 63814, 63825, 63837, 63848, 63859, 63871, 63882, 63893, 63904, 63915, 63927, 63938, 63949, 63960, 63971, 63981, 63992, 64003, 64014, 64025, 64035, 64046, 64057, 64067, 64078, 64088, 64099, 64109, 64120, 64130, 64140, 64151, 64161, 64171, 64181, 64192, 64202, 64212, 64222, 64232, 64242, 64252, 64261, 64271, 64281, 64291, 64301, 64310, 64320, 64330, 64339, 64349, 64358, 64368, 64377, 64387, 64396, 64405, 64414, 64424, 64433, 64442, 64451, 64460, 64469, 64478, 64487, 64496, 64505, 64514, 64523, 64532, 64540, 64549, 64558, 64566, 64575, 64584, 64592, 64601, 64609, 64617, 64626, 64634, 64642, 64651, 64659, 64667, 64675, 64683, 64691, 64699, 64707, 64715, 64723, 64731, 64739, 64747, 64754, 64762, 64770, 64777, 64785, 64793, 64800, 64808, 64815, 64822, 64830, 64837, 64844, 64852, 64859, 64866, 64873, 64880, 64887, 64895, 64902, 64908, 64915, 64922, 64929, 64936, 64943, 64949, 64956, 64963, 64969, 64976, 64982, 64989, 64995, 65002, 65008, 65015, 65021, 65027, 65033, 65040, 65046, 65052, 65058, 65064, 65070, 65076, 65082, 65088, 65094, 65099, 65105, 65111, 65117, 65122, 65128, 65133, 65139, 65144, 65150, 65155, 65161, 65166, 65171, 65177, 65182, 65187, 65192, 65197, 65202, 65207, 65212, 65217, 65222, 65227, 65232, 65237, 65242, 65246, 65251, 65256, 65260, 65265, 65270, 65274, 65279, 65283, 65287, 65292, 65296, 65300, 65305, 65309, 65313, 65317, 65321, 65325, 65329, 65333, 65337, 65341, 65345, 65349, 65352, 65356, 65360, 65363, 65367, 65371, 65374, 65378, 65381, 65385, 65388, 65391, 65395, 65398, 65401, 65404, 65408, 65411, 65414, 65417, 65420, 65423, 65426, 65429, 65431, 65434, 65437, 65440, 65442, 65445, 65448, 65450, 65453, 65455, 65458, 65460, 65463, 65465, 65467, 65470, 65472, 65474, 65476, 65478, 65480, 65482, 65484, 65486, 65488, 65490, 65492, 65494, 65496, 65497, 65499, 65501, 65502, 65504, 65505, 65507, 65508, 65510, 65511, 65513, 65514, 65515, 65516, 65518, 65519, 65520, 65521, 65522, 65523, 65524, 65525, 65526, 65527, 65527, 65528, 65529, 65530, 65530, 65531, 65531, 65532, 65532, 65533, 65533, 65534, 65534, 65534, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65535, 65534, 65534, 65534, 65533, 65533, 65532, 65532, 65531, 65531, 65530, 65530, 65529, 65528, 65527, 65527, 65526, 65525, 65524, 65523, 65522, 65521, 65520, 65519, 65518, 65516, 65515, 65514, 65513, 65511, 65510, 65508, 65507, 65505, 65504, 65502, 65501, 65499, 65497, 65496, 65494, 65492, 65490, 65488, 65486, 65484, 65482, 65480, 65478, 65476, 65474, 65472, 65470, 65467, 65465, 65463, 65460, 65458, 65455, 65453, 65450, 65448, 65445, 65442, 65440, 65437, 65434, 65431, 65429, 65426, 65423, 65420, 65417, 65414, 65411, 65408, 65404, 65401, 65398, 65395, 65391, 65388, 65385, 65381, 65378, 65374, 65371, 65367, 65363, 65360, 65356, 65352, 65349, 65345, 65341, 65337, 65333, 65329, 65325, 65321, 65317, 65313, 65309, 65305, 65300, 65296, 65292, 65287, 65283, 65279, 65274, 65270, 65265, 65260, 65256, 65251, 65246, 65242, 65237, 65232, 65227, 65222, 65217, 65212, 65207, 65202, 65197, 65192, 65187, 65182, 65177, 65171, 65166, 65161, 65155, 65150, 65144, 65139, 65133, 65128, 65122, 65117, 65111, 65105, 65099, 65094, 65088, 65082, 65076, 65070, 65064, 65058, 65052, 65046, 65040, 65033, 65027, 65021, 65015, 65008, 65002, 64995, 64989, 64982, 64976, 64969, 64963, 64956, 64949, 64943, 64936, 64929, 64922, 64915, 64908, 64902, 64895, 64887, 64880, 64873, 64866, 64859, 64852, 64844, 64837, 64830, 64822, 64815, 64808, 64800, 64793, 64785, 64777, 64770, 64762, 64754, 64747, 64739, 64731, 64723, 64715, 64707, 64699, 64691, 64683, 64675, 64667, 64659, 64651, 64642, 64634, 64626, 64617, 64609, 64600, 64592, 64584, 64575, 64566, 64558, 64549, 64540, 64532, 64523, 64514, 64505, 64496, 64487, 64478, 64469, 64460, 64451, 64442, 64433, 64424, 64414, 64405, 64396, 64387, 64377, 64368, 64358, 64349, 64339, 64330, 64320, 64310, 64301, 64291, 64281, 64271, 64261, 64252, 64242, 64232, 64222, 64212, 64202, 64192, 64181, 64171, 64161, 64151, 64140, 64130, 64120, 64109, 64099, 64088, 64078, 64067, 64057, 64046, 64035, 64025, 64014, 64003, 63992, 63981, 63971, 63960, 63949, 63938, 63927, 63915, 63904, 63893, 63882, 63871, 63859, 63848, 63837, 63825, 63814, 63803, 63791, 63779, 63768, 63756, 63745, 63733, 63721, 63709, 63698, 63686, 63674, 63662, 63650, 63638, 63626, 63614, 63602, 63590, 63578, 63565, 63553, 63541, 63528, 63516, 63504, 63491, 63479, 63466, 63454, 63441, 63429, 63416, 63403, 63390, 63378, 63365, 63352, 63339, 63326, 63313, 63300, 63287, 63274, 63261, 63248, 63235, 63221, 63208, 63195, 63182, 63168, 63155, 63141, 63128, 63114, 63101, 63087, 63074, 63060, 63046, 63032, 63019, 63005, 62991, 62977, 62963, 62949, 62935, 62921, 62907, 62893, 62879, 62865, 62850, 62836, 62822, 62808, 62793, 62779, 62764, 62750, 62735, 62721, 62706, 62692, 62677, 62662, 62648, 62633, 62618, 62603, 62588, 62573, 62558, 62543, 62528, 62513, 62498, 62483, 62468, 62453, 62437, 62422, 62407, 62391, 62376, 62360, 62345, 62329, 62314, 62298, 62283, 62267, 62251, 62236, 62220, 62204, 62188, 62172, 62156, 62141, 62125, 62108, 62092, 62076, 62060, 62044, 62028, 62012, 61995, 61979, 61963, 61946, 61930, 61913, 61897, 61880, 61864, 61847, 61831, 61814, 61797, 61780, 61764, 61747, 61730, 61713, 61696, 61679, 61662, 61645, 61628, 61611, 61594, 61577, 61559, 61542, 61525, 61507, 61490, 61473, 61455, 61438, 61420, 61403, 61385, 61367, 61350, 61332, 61314, 61297, 61279, 61261, 61243, 61225, 61207, 61189, 61171, 61153, 61135, 61117, 61099, 61081, 61062, 61044, 61026, 61007, 60989, 60971, 60952, 60934, 60915, 60897, 60878, 60859, 60841, 60822, 60803, 60785, 60766, 60747, 60728, 60709, 60690, 60671, 60652, 60633, 60614, 60595, 60576, 60556, 60537, 60518, 60499, 60479, 60460, 60441, 60421, 60402, 60382, 60363, 60343, 60323, 60304, 60284, 60264, 60244, 60225, 60205, 60185, 60165, 60145, 60125, 60105, 60085, 60065, 60045, 60025, 60004, 59984, 59964, 59944, 59923, 59903, 59883, 59862, 59842, 59821, 59801, 59780, 59759, 59739, 59718, 59697, 59677, 59656, 59635, 59614, 59593, 59572, 59551, 59530, 59509, 59488, 59467, 59446, 59425, 59404, 59382, 59361, 59340, 59318, 59297, 59276, 59254, 59233, 59211, 59190, 59168, 59146, 59125, 59103, 59081, 59059, 59038, 59016, 58994, 58972, 58950, 58928, 58906, 58884, 58862, 58840, 58818, 58795, 58773, 58751, 58729, 58706, 58684, 58662, 58639, 58617, 58594, 58572, 58549, 58527, 58504, 58481, 58459, 58436, 58413, 58390, 58367, 58345, 58322, 58299, 58276, 58253, 58230, 58207, 58183, 58160, 58137, 58114, 58091, 58067, 58044, 58021, 57997, 57974, 57950, 57927, 57903, 57880, 57856, 57833, 57809, 57785, 57762, 57738, 57714, 57690, 57666, 57642, 57618, 57594, 57570, 57546, 57522, 57498, 57474, 57450, 57426, 57402, 57377, 57353, 57329, 57304, 57280, 57255, 57231, 57206, 57182, 57157, 57133, 57108, 57083, 57059, 57034, 57009, 56984, 56959, 56935, 56910, 56885, 56860, 56835, 56810, 56785, 56760, 56734, 56709, 56684, 56659, 56633, 56608, 56583, 56557, 56532, 56507, 56481, 56456, 56430, 56404, 56379, 56353, 56328, 56302, 56276, 56250, 56225, 56199, 56173, 56147, 56121, 56095, 56069, 56043, 56017, 55991, 55965, 55938, 55912, 55886, 55860, 55833, 55807, 55781, 55754, 55728, 55701, 55675, 55648, 55622, 55595, 55569, 55542, 55515, 55489, 55462, 55435, 55408, 55381, 55354, 55327, 55300, 55274, 55246, 55219, 55192, 55165, 55138, 55111, 55084, 55056, 55029, 55002, 54974, 54947, 54920, 54892, 54865, 54837, 54810, 54782, 54755, 54727, 54699, 54672, 54644, 54616, 54588, 54560, 54533, 54505, 54477, 54449, 54421, 54393, 54365, 54337, 54308, 54280, 54252, 54224, 54196, 54167, 54139, 54111, 54082, 54054, 54026, 53997, 53969, 53940, 53911, 53883, 53854, 53826, 53797, 53768, 53739, 53711, 53682, 53653, 53624, 53595, 53566, 53537, 53508, 53479, 53450, 53421, 53392, 53363, 53334, 53304, 53275, 53246, 53216, 53187, 53158, 53128, 53099, 53069, 53040, 53010, 52981, 52951, 52922, 52892, 52862, 52832, 52803, 52773, 52743, 52713, 52683, 52653, 52624, 52594, 52564, 52534, 52503, 52473, 52443, 52413, 52383, 52353, 52322, 52292, 52262, 52231, 52201, 52171, 52140, 52110, 52079, 52049, 52018, 51988, 51957, 51926, 51896, 51865, 51834, 51803, 51773, 51742, 51711, 51680, 51649, 51618, 51587, 51556, 51525, 51494, 51463, 51432, 51401, 51369, 51338, 51307, 51276, 51244, 51213, 51182, 51150, 51119, 51087, 51056, 51024, 50993, 50961, 50929, 50898, 50866, 50834, 50803, 50771, 50739, 50707, 50675, 50644, 50612, 50580, 50548, 50516, 50484, 50452, 50420, 50387, 50355, 50323, 50291, 50259, 50226, 50194, 50162, 50129, 50097, 50065, 50032, 5e4, 49967, 49935, 49902, 49869, 49837, 49804, 49771, 49739, 49706, 49673, 49640, 49608, 49575, 49542, 49509, 49476, 49443, 49410, 49377, 49344, 49311, 49278, 49244, 49211, 49178, 49145, 49112, 49078, 49045, 49012, 48978, 48945, 48911, 48878, 48844, 48811, 48777, 48744, 48710, 48676, 48643, 48609, 48575, 48542, 48508, 48474, 48440, 48406, 48372, 48338, 48304, 48271, 48237, 48202, 48168, 48134, 48100, 48066, 48032, 47998, 47963, 47929, 47895, 47860, 47826, 47792, 47757, 47723, 47688, 47654, 47619, 47585, 47550, 47516, 47481, 47446, 47412, 47377, 47342, 47308, 47273, 47238, 47203, 47168, 47133, 47098, 47063, 47028, 46993, 46958, 46923, 46888, 46853, 46818, 46783, 46747, 46712, 46677, 46642, 46606, 46571, 46536, 46500, 46465, 46429, 46394, 46358, 46323, 46287, 46252, 46216, 46180, 46145, 46109, 46073, 46037, 46002, 45966, 45930, 45894, 45858, 45822, 45786, 45750, 45714, 45678, 45642, 45606, 45570, 45534, 45498, 45462, 45425, 45389, 45353, 45316, 45280, 45244, 45207, 45171, 45135, 45098, 45062, 45025, 44989, 44952, 44915, 44879, 44842, 44806, 44769, 44732, 44695, 44659, 44622, 44585, 44548, 44511, 44474, 44437, 44400, 44363, 44326, 44289, 44252, 44215, 44178, 44141, 44104, 44067, 44029, 43992, 43955, 43918, 43880, 43843, 43806, 43768, 43731, 43693, 43656, 43618, 43581, 43543, 43506, 43468, 43430, 43393, 43355, 43317, 43280, 43242, 43204, 43166, 43128, 43091, 43053, 43015, 42977, 42939, 42901, 42863, 42825, 42787, 42749, 42711, 42672, 42634, 42596, 42558, 42520, 42481, 42443, 42405, 42366, 42328, 42290, 42251, 42213, 42174, 42136, 42097, 42059, 42020, 41982, 41943, 41904, 41866, 41827, 41788, 41750, 41711, 41672, 41633, 41595, 41556, 41517, 41478, 41439, 41400, 41361, 41322, 41283, 41244, 41205, 41166, 41127, 41088, 41048, 41009, 40970, 40931, 40891, 40852, 40813, 40773, 40734, 40695, 40655, 40616, 40576, 40537, 40497, 40458, 40418, 40379, 40339, 40300, 40260, 40220, 40180, 40141, 40101, 40061, 40021, 39982, 39942, 39902, 39862, 39822, 39782, 39742, 39702, 39662, 39622, 39582, 39542, 39502, 39462, 39422, 39382, 39341, 39301, 39261, 39221, 39180, 39140, 39100, 39059, 39019, 38979, 38938, 38898, 38857, 38817, 38776, 38736, 38695, 38655, 38614, 38573, 38533, 38492, 38451, 38411, 38370, 38329, 38288, 38248, 38207, 38166, 38125, 38084, 38043, 38002, 37961, 37920, 37879, 37838, 37797, 37756, 37715, 37674, 37633, 37592, 37551, 37509, 37468, 37427, 37386, 37344, 37303, 37262, 37220, 37179, 37137, 37096, 37055, 37013, 36972, 36930, 36889, 36847, 36805, 36764, 36722, 36681, 36639, 36597, 36556, 36514, 36472, 36430, 36388, 36347, 36305, 36263, 36221, 36179, 36137, 36095, 36053, 36011, 35969, 35927, 35885, 35843, 35801, 35759, 35717, 35675, 35633, 35590, 35548, 35506, 35464, 35421, 35379, 35337, 35294, 35252, 35210, 35167, 35125, 35082, 35040, 34997, 34955, 34912, 34870, 34827, 34785, 34742, 34699, 34657, 34614, 34571, 34529, 34486, 34443, 34400, 34358, 34315, 34272, 34229, 34186, 34143, 34100, 34057, 34015, 33972, 33929, 33886, 33843, 33799, 33756, 33713, 33670, 33627, 33584, 33541, 33498, 33454, 33411, 33368, 33325, 33281, 33238, 33195, 33151, 33108, 33065, 33021, 32978, 32934, 32891, 32847, 32804, 32760, 32717, 32673, 32630, 32586, 32542, 32499, 32455, 32411, 32368, 32324, 32280, 32236, 32193, 32149, 32105, 32061, 32017, 31974, 31930, 31886, 31842, 31798, 31754, 31710, 31666, 31622, 31578, 31534, 31490, 31446, 31402, 31357, 31313, 31269, 31225, 31181, 31136, 31092, 31048, 31004, 30959, 30915, 30871, 30826, 30782, 30738, 30693, 30649, 30604, 30560, 30515, 30471, 30426, 30382, 30337, 30293, 30248, 30204, 30159, 30114, 30070, 30025, 29980, 29936, 29891, 29846, 29801, 29757, 29712, 29667, 29622, 29577, 29533, 29488, 29443, 29398, 29353, 29308, 29263, 29218, 29173, 29128, 29083, 29038, 28993, 28948, 28903, 28858, 28812, 28767, 28722, 28677, 28632, 28586, 28541, 28496, 28451, 28405, 28360, 28315, 28269, 28224, 28179, 28133, 28088, 28042, 27997, 27952, 27906, 27861, 27815, 27770, 27724, 27678, 27633, 27587, 27542, 27496, 27450, 27405, 27359, 27313, 27268, 27222, 27176, 27131, 27085, 27039, 26993, 26947, 26902, 26856, 26810, 26764, 26718, 26672, 26626, 26580, 26534, 26488, 26442, 26396, 26350, 26304, 26258, 26212, 26166, 26120, 26074, 26028, 25982, 25936, 25889, 25843, 25797, 25751, 25705, 25658, 25612, 25566, 25520, 25473, 25427, 25381, 25334, 25288, 25241, 25195, 25149, 25102, 25056, 25009, 24963, 24916, 24870, 24823, 24777, 24730, 24684, 24637, 24591, 24544, 24497, 24451, 24404, 24357, 24311, 24264, 24217, 24171, 24124, 24077, 24030, 23984, 23937, 23890, 23843, 23796, 23750, 23703, 23656, 23609, 23562, 23515, 23468, 23421, 23374, 23327, 23280, 23233, 23186, 23139, 23092, 23045, 22998, 22951, 22904, 22857, 22810, 22763, 22716, 22668, 22621, 22574, 22527, 22480, 22433, 22385, 22338, 22291, 22243, 22196, 22149, 22102, 22054, 22007, 21960, 21912, 21865, 21817, 21770, 21723, 21675, 21628, 21580, 21533, 21485, 21438, 21390, 21343, 21295, 21248, 21200, 21153, 21105, 21057, 21010, 20962, 20915, 20867, 20819, 20772, 20724, 20676, 20629, 20581, 20533, 20485, 20438, 20390, 20342, 20294, 20246, 20199, 20151, 20103, 20055, 20007, 19959, 19912, 19864, 19816, 19768, 19720, 19672, 19624, 19576, 19528, 19480, 19432, 19384, 19336, 19288, 19240, 19192, 19144, 19096, 19048, 19e3, 18951, 18903, 18855, 18807, 18759, 18711, 18663, 18614, 18566, 18518, 18470, 18421, 18373, 18325, 18277, 18228, 18180, 18132, 18084, 18035, 17987, 17939, 17890, 17842, 17793, 17745, 17697, 17648, 17600, 17551, 17503, 17455, 17406, 17358, 17309, 17261, 17212, 17164, 17115, 17067, 17018, 16970, 16921, 16872, 16824, 16775, 16727, 16678, 16629, 16581, 16532, 16484, 16435, 16386, 16338, 16289, 16240, 16191, 16143, 16094, 16045, 15997, 15948, 15899, 15850, 15802, 15753, 15704, 15655, 15606, 15557, 15509, 15460, 15411, 15362, 15313, 15264, 15215, 15167, 15118, 15069, 15020, 14971, 14922, 14873, 14824, 14775, 14726, 14677, 14628, 14579, 14530, 14481, 14432, 14383, 14334, 14285, 14236, 14187, 14138, 14089, 14040, 13990, 13941, 13892, 13843, 13794, 13745, 13696, 13646, 13597, 13548, 13499, 13450, 13401, 13351, 13302, 13253, 13204, 13154, 13105, 13056, 13007, 12957, 12908, 12859, 12810, 12760, 12711, 12662, 12612, 12563, 12514, 12464, 12415, 12366, 12316, 12267, 12218, 12168, 12119, 12069, 12020, 11970, 11921, 11872, 11822, 11773, 11723, 11674, 11624, 11575, 11525, 11476, 11426, 11377, 11327, 11278, 11228, 11179, 11129, 11080, 11030, 10981, 10931, 10882, 10832, 10782, 10733, 10683, 10634, 10584, 10534, 10485, 10435, 10386, 10336, 10286, 10237, 10187, 10137, 10088, 10038, 9988, 9939, 9889, 9839, 9790, 9740, 9690, 9640, 9591, 9541, 9491, 9442, 9392, 9342, 9292, 9243, 9193, 9143, 9093, 9043, 8994, 8944, 8894, 8844, 8794, 8745, 8695, 8645, 8595, 8545, 8496, 8446, 8396, 8346, 8296, 8246, 8196, 8147, 8097, 8047, 7997, 7947, 7897, 7847, 7797, 7747, 7697, 7648, 7598, 7548, 7498, 7448, 7398, 7348, 7298, 7248, 7198, 7148, 7098, 7048, 6998, 6948, 6898, 6848, 6798, 6748, 6698, 6648, 6598, 6548, 6498, 6448, 6398, 6348, 6298, 6248, 6198, 6148, 6098, 6048, 5998, 5948, 5898, 5848, 5798, 5748, 5697, 5647, 5597, 5547, 5497, 5447, 5397, 5347, 5297, 5247, 5197, 5146, 5096, 5046, 4996, 4946, 4896, 4846, 4796, 4745, 4695, 4645, 4595, 4545, 4495, 4445, 4394, 4344, 4294, 4244, 4194, 4144, 4093, 4043, 3993, 3943, 3893, 3843, 3792, 3742, 3692, 3642, 3592, 3541, 3491, 3441, 3391, 3341, 3291, 3240, 3190, 3140, 3090, 3039, 2989, 2939, 2889, 2839, 2788, 2738, 2688, 2638, 2587, 2537, 2487, 2437, 2387, 2336, 2286, 2236, 2186, 2135, 2085, 2035, 1985, 1934, 1884, 1834, 1784, 1733, 1683, 1633, 1583, 1532, 1482, 1432, 1382, 1331, 1281, 1231, 1181, 1130, 1080, 1030, 980, 929, 879, 829, 779, 728, 678, 628, 578, 527, 477, 427, 376, 326, 276, 226, 175, 125, 75, 25, -25, -75, -125, -175, -226, -276, -326, -376, -427, -477, -527, -578, -628, -678, -728, -779, -829, -879, -929, -980, -1030, -1080, -1130, -1181, -1231, -1281, -1331, -1382, -1432, -1482, -1532, -1583, -1633, -1683, -1733, -1784, -1834, -1884, -1934, -1985, -2035, -2085, -2135, -2186, -2236, -2286, -2336, -2387, -2437, -2487, -2537, -2588, -2638, -2688, -2738, -2788, -2839, -2889, -2939, -2989, -3039, -3090, -3140, -3190, -3240, -3291, -3341, -3391, -3441, -3491, -3541, -3592, -3642, -3692, -3742, -3792, -3843, -3893, -3943, -3993, -4043, -4093, -4144, -4194, -4244, -4294, -4344, -4394, -4445, -4495, -4545, -4595, -4645, -4695, -4745, -4796, -4846, -4896, -4946, -4996, -5046, -5096, -5146, -5197, -5247, -5297, -5347, -5397, -5447, -5497, -5547, -5597, -5647, -5697, -5748, -5798, -5848, -5898, -5948, -5998, -6048, -6098, -6148, -6198, -6248, -6298, -6348, -6398, -6448, -6498, -6548, -6598, -6648, -6698, -6748, -6798, -6848, -6898, -6948, -6998, -7048, -7098, -7148, -7198, -7248, -7298, -7348, -7398, -7448, -7498, -7548, -7598, -7648, -7697, -7747, -7797, -7847, -7897, -7947, -7997, -8047, -8097, -8147, -8196, -8246, -8296, -8346, -8396, -8446, -8496, -8545, -8595, -8645, -8695, -8745, -8794, -8844, -8894, -8944, -8994, -9043, -9093, -9143, -9193, -9243, -9292, -9342, -9392, -9442, -9491, -9541, -9591, -9640, -9690, -9740, -9790, -9839, -9889, -9939, -9988, -10038, -10088, -10137, -10187, -10237, -10286, -10336, -10386, -10435, -10485, -10534, -10584, -10634, -10683, -10733, -10782, -10832, -10882, -10931, -10981, -11030, -11080, -11129, -11179, -11228, -11278, -11327, -11377, -11426, -11476, -11525, -11575, -11624, -11674, -11723, -11773, -11822, -11872, -11921, -11970, -12020, -12069, -12119, -12168, -12218, -12267, -12316, -12366, -12415, -12464, -12514, -12563, -12612, -12662, -12711, -12760, -12810, -12859, -12908, -12957, -13007, -13056, -13105, -13154, -13204, -13253, -13302, -13351, -13401, -13450, -13499, -13548, -13597, -13647, -13696, -13745, -13794, -13843, -13892, -13941, -13990, -14040, -14089, -14138, -14187, -14236, -14285, -14334, -14383, -14432, -14481, -14530, -14579, -14628, -14677, -14726, -14775, -14824, -14873, -14922, -14971, -15020, -15069, -15118, -15167, -15215, -15264, -15313, -15362, -15411, -15460, -15509, -15557, -15606, -15655, -15704, -15753, -15802, -15850, -15899, -15948, -15997, -16045, -16094, -16143, -16191, -16240, -16289, -16338, -16386, -16435, -16484, -16532, -16581, -16629, -16678, -16727, -16775, -16824, -16872, -16921, -16970, -17018, -17067, -17115, -17164, -17212, -17261, -17309, -17358, -17406, -17455, -17503, -17551, -17600, -17648, -17697, -17745, -17793, -17842, -17890, -17939, -17987, -18035, -18084, -18132, -18180, -18228, -18277, -18325, -18373, -18421, -18470, -18518, -18566, -18614, -18663, -18711, -18759, -18807, -18855, -18903, -18951, -19e3, -19048, -19096, -19144, -19192, -19240, -19288, -19336, -19384, -19432, -19480, -19528, -19576, -19624, -19672, -19720, -19768, -19816, -19864, -19912, -19959, -20007, -20055, -20103, -20151, -20199, -20246, -20294, -20342, -20390, -20438, -20485, -20533, -20581, -20629, -20676, -20724, -20772, -20819, -20867, -20915, -20962, -21010, -21057, -21105, -21153, -21200, -21248, -21295, -21343, -21390, -21438, -21485, -21533, -21580, -21628, -21675, -21723, -21770, -21817, -21865, -21912, -21960, -22007, -22054, -22102, -22149, -22196, -22243, -22291, -22338, -22385, -22433, -22480, -22527, -22574, -22621, -22668, -22716, -22763, -22810, -22857, -22904, -22951, -22998, -23045, -23092, -23139, -23186, -23233, -23280, -23327, -23374, -23421, -23468, -23515, -23562, -23609, -23656, -23703, -23750, -23796, -23843, -23890, -23937, -23984, -24030, -24077, -24124, -24171, -24217, -24264, -24311, -24357, -24404, -24451, -24497, -24544, -24591, -24637, -24684, -24730, -24777, -24823, -24870, -24916, -24963, -25009, -25056, -25102, -25149, -25195, -25241, -25288, -25334, -25381, -25427, -25473, -25520, -25566, -25612, -25658, -25705, -25751, -25797, -25843, -25889, -25936, -25982, -26028, -26074, -26120, -26166, -26212, -26258, -26304, -26350, -26396, -26442, -26488, -26534, -26580, -26626, -26672, -26718, -26764, -26810, -26856, -26902, -26947, -26993, -27039, -27085, -27131, -27176, -27222, -27268, -27313, -27359, -27405, -27450, -27496, -27542, -27587, -27633, -27678, -27724, -27770, -27815, -27861, -27906, -27952, -27997, -28042, -28088, -28133, -28179, -28224, -28269, -28315, -28360, -28405, -28451, -28496, -28541, -28586, -28632, -28677, -28722, -28767, -28812, -28858, -28903, -28948, -28993, -29038, -29083, -29128, -29173, -29218, -29263, -29308, -29353, -29398, -29443, -29488, -29533, -29577, -29622, -29667, -29712, -29757, -29801, -29846, -29891, -29936, -29980, -30025, -30070, -30114, -30159, -30204, -30248, -30293, -30337, -30382, -30426, -30471, -30515, -30560, -30604, -30649, -30693, -30738, -30782, -30826, -30871, -30915, -30959, -31004, -31048, -31092, -31136, -31181, -31225, -31269, -31313, -31357, -31402, -31446, -31490, -31534, -31578, -31622, -31666, -31710, -31754, -31798, -31842, -31886, -31930, -31974, -32017, -32061, -32105, -32149, -32193, -32236, -32280, -32324, -32368, -32411, -32455, -32499, -32542, -32586, -32630, -32673, -32717, -32760, -32804, -32847, -32891, -32934, -32978, -33021, -33065, -33108, -33151, -33195, -33238, -33281, -33325, -33368, -33411, -33454, -33498, -33541, -33584, -33627, -33670, -33713, -33756, -33799, -33843, -33886, -33929, -33972, -34015, -34057, -34100, -34143, -34186, -34229, -34272, -34315, -34358, -34400, -34443, -34486, -34529, -34571, -34614, -34657, -34699, -34742, -34785, -34827, -34870, -34912, -34955, -34997, -35040, -35082, -35125, -35167, -35210, -35252, -35294, -35337, -35379, -35421, -35464, -35506, -35548, -35590, -35633, -35675, -35717, -35759, -35801, -35843, -35885, -35927, -35969, -36011, -36053, -36095, -36137, -36179, -36221, -36263, -36305, -36347, -36388, -36430, -36472, -36514, -36555, -36597, -36639, -36681, -36722, -36764, -36805, -36847, -36889, -36930, -36972, -37013, -37055, -37096, -37137, -37179, -37220, -37262, -37303, -37344, -37386, -37427, -37468, -37509, -37551, -37592, -37633, -37674, -37715, -37756, -37797, -37838, -37879, -37920, -37961, -38002, -38043, -38084, -38125, -38166, -38207, -38248, -38288, -38329, -38370, -38411, -38451, -38492, -38533, -38573, -38614, -38655, -38695, -38736, -38776, -38817, -38857, -38898, -38938, -38979, -39019, -39059, -39100, -39140, -39180, -39221, -39261, -39301, -39341, -39382, -39422, -39462, -39502, -39542, -39582, -39622, -39662, -39702, -39742, -39782, -39822, -39862, -39902, -39942, -39982, -40021, -40061, -40101, -40141, -40180, -40220, -40260, -40299, -40339, -40379, -40418, -40458, -40497, -40537, -40576, -40616, -40655, -40695, -40734, -40773, -40813, -40852, -40891, -40931, -40970, -41009, -41048, -41087, -41127, -41166, -41205, -41244, -41283, -41322, -41361, -41400, -41439, -41478, -41517, -41556, -41595, -41633, -41672, -41711, -41750, -41788, -41827, -41866, -41904, -41943, -41982, -42020, -42059, -42097, -42136, -42174, -42213, -42251, -42290, -42328, -42366, -42405, -42443, -42481, -42520, -42558, -42596, -42634, -42672, -42711, -42749, -42787, -42825, -42863, -42901, -42939, -42977, -43015, -43053, -43091, -43128, -43166, -43204, -43242, -43280, -43317, -43355, -43393, -43430, -43468, -43506, -43543, -43581, -43618, -43656, -43693, -43731, -43768, -43806, -43843, -43880, -43918, -43955, -43992, -44029, -44067, -44104, -44141, -44178, -44215, -44252, -44289, -44326, -44363, -44400, -44437, -44474, -44511, -44548, -44585, -44622, -44659, -44695, -44732, -44769, -44806, -44842, -44879, -44915, -44952, -44989, -45025, -45062, -45098, -45135, -45171, -45207, -45244, -45280, -45316, -45353, -45389, -45425, -45462, -45498, -45534, -45570, -45606, -45642, -45678, -45714, -45750, -45786, -45822, -45858, -45894, -45930, -45966, -46002, -46037, -46073, -46109, -46145, -46180, -46216, -46252, -46287, -46323, -46358, -46394, -46429, -46465, -46500, -46536, -46571, -46606, -46642, -46677, -46712, -46747, -46783, -46818, -46853, -46888, -46923, -46958, -46993, -47028, -47063, -47098, -47133, -47168, -47203, -47238, -47273, -47308, -47342, -47377, -47412, -47446, -47481, -47516, -47550, -47585, -47619, -47654, -47688, -47723, -47757, -47792, -47826, -47860, -47895, -47929, -47963, -47998, -48032, -48066, -48100, -48134, -48168, -48202, -48236, -48271, -48304, -48338, -48372, -48406, -48440, -48474, -48508, -48542, -48575, -48609, -48643, -48676, -48710, -48744, -48777, -48811, -48844, -48878, -48911, -48945, -48978, -49012, -49045, -49078, -49112, -49145, -49178, -49211, -49244, -49278, -49311, -49344, -49377, -49410, -49443, -49476, -49509, -49542, -49575, -49608, -49640, -49673, -49706, -49739, -49771, -49804, -49837, -49869, -49902, -49935, -49967, -5e4, -50032, -50065, -50097, -50129, -50162, -50194, -50226, -50259, -50291, -50323, -50355, -50387, -50420, -50452, -50484, -50516, -50548, -50580, -50612, -50644, -50675, -50707, -50739, -50771, -50803, -50834, -50866, -50898, -50929, -50961, -50993, -51024, -51056, -51087, -51119, -51150, -51182, -51213, -51244, -51276, -51307, -51338, -51369, -51401, -51432, -51463, -51494, -51525, -51556, -51587, -51618, -51649, -51680, -51711, -51742, -51773, -51803, -51834, -51865, -51896, -51926, -51957, -51988, -52018, -52049, -52079, -52110, -52140, -52171, -52201, -52231, -52262, -52292, -52322, -52353, -52383, -52413, -52443, -52473, -52503, -52534, -52564, -52594, -52624, -52653, -52683, -52713, -52743, -52773, -52803, -52832, -52862, -52892, -52922, -52951, -52981, -53010, -53040, -53069, -53099, -53128, -53158, -53187, -53216, -53246, -53275, -53304, -53334, -53363, -53392, -53421, -53450, -53479, -53508, -53537, -53566, -53595, -53624, -53653, -53682, -53711, -53739, -53768, -53797, -53826, -53854, -53883, -53911, -53940, -53969, -53997, -54026, -54054, -54082, -54111, -54139, -54167, -54196, -54224, -54252, -54280, -54308, -54337, -54365, -54393, -54421, -54449, -54477, -54505, -54533, -54560, -54588, -54616, -54644, -54672, -54699, -54727, -54755, -54782, -54810, -54837, -54865, -54892, -54920, -54947, -54974, -55002, -55029, -55056, -55084, -55111, -55138, -55165, -55192, -55219, -55246, -55274, -55300, -55327, -55354, -55381, -55408, -55435, -55462, -55489, -55515, -55542, -55569, -55595, -55622, -55648, -55675, -55701, -55728, -55754, -55781, -55807, -55833, -55860, -55886, -55912, -55938, -55965, -55991, -56017, -56043, -56069, -56095, -56121, -56147, -56173, -56199, -56225, -56250, -56276, -56302, -56328, -56353, -56379, -56404, -56430, -56456, -56481, -56507, -56532, -56557, -56583, -56608, -56633, -56659, -56684, -56709, -56734, -56760, -56785, -56810, -56835, -56860, -56885, -56910, -56935, -56959, -56984, -57009, -57034, -57059, -57083, -57108, -57133, -57157, -57182, -57206, -57231, -57255, -57280, -57304, -57329, -57353, -57377, -57402, -57426, -57450, -57474, -57498, -57522, -57546, -57570, -57594, -57618, -57642, -57666, -57690, -57714, -57738, -57762, -57785, -57809, -57833, -57856, -57880, -57903, -57927, -57950, -57974, -57997, -58021, -58044, -58067, -58091, -58114, -58137, -58160, -58183, -58207, -58230, -58253, -58276, -58299, -58322, -58345, -58367, -58390, -58413, -58436, -58459, -58481, -58504, -58527, -58549, -58572, -58594, -58617, -58639, -58662, -58684, -58706, -58729, -58751, -58773, -58795, -58818, -58840, -58862, -58884, -58906, -58928, -58950, -58972, -58994, -59016, -59038, -59059, -59081, -59103, -59125, -59146, -59168, -59190, -59211, -59233, -59254, -59276, -59297, -59318, -59340, -59361, -59382, -59404, -59425, -59446, -59467, -59488, -59509, -59530, -59551, -59572, -59593, -59614, -59635, -59656, -59677, -59697, -59718, -59739, -59759, -59780, -59801, -59821, -59842, -59862, -59883, -59903, -59923, -59944, -59964, -59984, -60004, -60025, -60045, -60065, -60085, -60105, -60125, -60145, -60165, -60185, -60205, -60225, -60244, -60264, -60284, -60304, -60323, -60343, -60363, -60382, -60402, -60421, -60441, -60460, -60479, -60499, -60518, -60537, -60556, -60576, -60595, -60614, -60633, -60652, -60671, -60690, -60709, -60728, -60747, -60766, -60785, -60803, -60822, -60841, -60859, -60878, -60897, -60915, -60934, -60952, -60971, -60989, -61007, -61026, -61044, -61062, -61081, -61099, -61117, -61135, -61153, -61171, -61189, -61207, -61225, -61243, -61261, -61279, -61297, -61314, -61332, -61350, -61367, -61385, -61403, -61420, -61438, -61455, -61473, -61490, -61507, -61525, -61542, -61559, -61577, -61594, -61611, -61628, -61645, -61662, -61679, -61696, -61713, -61730, -61747, -61764, -61780, -61797, -61814, -61831, -61847, -61864, -61880, -61897, -61913, -61930, -61946, -61963, -61979, -61995, -62012, -62028, -62044, -62060, -62076, -62092, -62108, -62125, -62141, -62156, -62172, -62188, -62204, -62220, -62236, -62251, -62267, -62283, -62298, -62314, -62329, -62345, -62360, -62376, -62391, -62407, -62422, -62437, -62453, -62468, -62483, -62498, -62513, -62528, -62543, -62558, -62573, -62588, -62603, -62618, -62633, -62648, -62662, -62677, -62692, -62706, -62721, -62735, -62750, -62764, -62779, -62793, -62808, -62822, -62836, -62850, -62865, -62879, -62893, -62907, -62921, -62935, -62949, -62963, -62977, -62991, -63005, -63019, -63032, -63046, -63060, -63074, -63087, -63101, -63114, -63128, -63141, -63155, -63168, -63182, -63195, -63208, -63221, -63235, -63248, -63261, -63274, -63287, -63300, -63313, -63326, -63339, -63352, -63365, -63378, -63390, -63403, -63416, -63429, -63441, -63454, -63466, -63479, -63491, -63504, -63516, -63528, -63541, -63553, -63565, -63578, -63590, -63602, -63614, -63626, -63638, -63650, -63662, -63674, -63686, -63698, -63709, -63721, -63733, -63745, -63756, -63768, -63779, -63791, -63803, -63814, -63825, -63837, -63848, -63859, -63871, -63882, -63893, -63904, -63915, -63927, -63938, -63949, -63960, -63971, -63981, -63992, -64003, -64014, -64025, -64035, -64046, -64057, -64067, -64078, -64088, -64099, -64109, -64120, -64130, -64140, -64151, -64161, -64171, -64181, -64192, -64202, -64212, -64222, -64232, -64242, -64252, -64261, -64271, -64281, -64291, -64301, -64310, -64320, -64330, -64339, -64349, -64358, -64368, -64377, -64387, -64396, -64405, -64414, -64424, -64433, -64442, -64451, -64460, -64469, -64478, -64487, -64496, -64505, -64514, -64523, -64532, -64540, -64549, -64558, -64566, -64575, -64584, -64592, -64601, -64609, -64617, -64626, -64634, -64642, -64651, -64659, -64667, -64675, -64683, -64691, -64699, -64707, -64715, -64723, -64731, -64739, -64747, -64754, -64762, -64770, -64777, -64785, -64793, -64800, -64808, -64815, -64822, -64830, -64837, -64844, -64852, -64859, -64866, -64873, -64880, -64887, -64895, -64902, -64908, -64915, -64922, -64929, -64936, -64943, -64949, -64956, -64963, -64969, -64976, -64982, -64989, -64995, -65002, -65008, -65015, -65021, -65027, -65033, -65040, -65046, -65052, -65058, -65064, -65070, -65076, -65082, -65088, -65094, -65099, -65105, -65111, -65117, -65122, -65128, -65133, -65139, -65144, -65150, -65155, -65161, -65166, -65171, -65177, -65182, -65187, -65192, -65197, -65202, -65207, -65212, -65217, -65222, -65227, -65232, -65237, -65242, -65246, -65251, -65256, -65260, -65265, -65270, -65274, -65279, -65283, -65287, -65292, -65296, -65300, -65305, -65309, -65313, -65317, -65321, -65325, -65329, -65333, -65337, -65341, -65345, -65349, -65352, -65356, -65360, -65363, -65367, -65371, -65374, -65378, -65381, -65385, -65388, -65391, -65395, -65398, -65401, -65404, -65408, -65411, -65414, -65417, -65420, -65423, -65426, -65429, -65431, -65434, -65437, -65440, -65442, -65445, -65448, -65450, -65453, -65455, -65458, -65460, -65463, -65465, -65467, -65470, -65472, -65474, -65476, -65478, -65480, -65482, -65484, -65486, -65488, -65490, -65492, -65494, -65496, -65497, -65499, -65501, -65502, -65504, -65505, -65507, -65508, -65510, -65511, -65513, -65514, -65515, -65516, -65518, -65519, -65520, -65521, -65522, -65523, -65524, -65525, -65526, -65527, -65527, -65528, -65529, -65530, -65530, -65531, -65531, -65532, -65532, -65533, -65533, -65534, -65534, -65534, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65535, -65534, -65534, -65534, -65533, -65533, -65532, -65532, -65531, -65531, -65530, -65530, -65529, -65528, -65527, -65527, -65526, -65525, -65524, -65523, -65522, -65521, -65520, -65519, -65518, -65516, -65515, -65514, -65513, -65511, -65510, -65508, -65507, -65505, -65504, -65502, -65501, -65499, -65497, -65496, -65494, -65492, -65490, -65488, -65486, -65484, -65482, -65480, -65478, -65476, -65474, -65472, -65470, -65467, -65465, -65463, -65460, -65458, -65455, -65453, -65450, -65448, -65445, -65442, -65440, -65437, -65434, -65431, -65429, -65426, -65423, -65420, -65417, -65414, -65411, -65408, -65404, -65401, -65398, -65395, -65391, -65388, -65385, -65381, -65378, -65374, -65371, -65367, -65363, -65360, -65356, -65352, -65349, -65345, -65341, -65337, -65333, -65329, -65325, -65321, -65317, -65313, -65309, -65305, -65300, -65296, -65292, -65287, -65283, -65279, -65274, -65270, -65265, -65260, -65256, -65251, -65246, -65242, -65237, -65232, -65227, -65222, -65217, -65212, -65207, -65202, -65197, -65192, -65187, -65182, -65177, -65171, -65166, -65161, -65155, -65150, -65144, -65139, -65133, -65128, -65122, -65117, -65111, -65105, -65099, -65094, -65088, -65082, -65076, -65070, -65064, -65058, -65052, -65046, -65040, -65033, -65027, -65021, -65015, -65008, -65002, -64995, -64989, -64982, -64976, -64969, -64963, -64956, -64949, -64943, -64936, -64929, -64922, -64915, -64908, -64902, -64895, -64887, -64880, -64873, -64866, -64859, -64852, -64844, -64837, -64830, -64822, -64815, -64808, -64800, -64793, -64785, -64777, -64770, -64762, -64754, -64747, -64739, -64731, -64723, -64715, -64707, -64699, -64691, -64683, -64675, -64667, -64659, -64651, -64642, -64634, -64626, -64617, -64609, -64601, -64592, -64584, -64575, -64566, -64558, -64549, -64540, -64532, -64523, -64514, -64505, -64496, -64487, -64478, -64469, -64460, -64451, -64442, -64433, -64424, -64414, -64405, -64396, -64387, -64377, -64368, -64358, -64349, -64339, -64330, -64320, -64310, -64301, -64291, -64281, -64271, -64261, -64252, -64242, -64232, -64222, -64212, -64202, -64192, -64181, -64171, -64161, -64151, -64140, -64130, -64120, -64109, -64099, -64088, -64078, -64067, -64057, -64046, -64035, -64025, -64014, -64003, -63992, -63981, -63971, -63960, -63949, -63938, -63927, -63915, -63904, -63893, -63882, -63871, -63859, -63848, -63837, -63825, -63814, -63803, -63791, -63779, -63768, -63756, -63745, -63733, -63721, -63709, -63698, -63686, -63674, -63662, -63650, -63638, -63626, -63614, -63602, -63590, -63578, -63565, -63553, -63541, -63528, -63516, -63504, -63491, -63479, -63466, -63454, -63441, -63429, -63416, -63403, -63390, -63378, -63365, -63352, -63339, -63326, -63313, -63300, -63287, -63274, -63261, -63248, -63235, -63221, -63208, -63195, -63182, -63168, -63155, -63141, -63128, -63114, -63101, -63087, -63074, -63060, -63046, -63032, -63019, -63005, -62991, -62977, -62963, -62949, -62935, -62921, -62907, -62893, -62879, -62865, -62850, -62836, -62822, -62808, -62793, -62779, -62764, -62750, -62735, -62721, -62706, -62692, -62677, -62662, -62648, -62633, -62618, -62603, -62588, -62573, -62558, -62543, -62528, -62513, -62498, -62483, -62468, -62453, -62437, -62422, -62407, -62391, -62376, -62360, -62345, -62329, -62314, -62298, -62283, -62267, -62251, -62236, -62220, -62204, -62188, -62172, -62156, -62141, -62125, -62108, -62092, -62076, -62060, -62044, -62028, -62012, -61995, -61979, -61963, -61946, -61930, -61913, -61897, -61880, -61864, -61847, -61831, -61814, -61797, -61780, -61764, -61747, -61730, -61713, -61696, -61679, -61662, -61645, -61628, -61611, -61594, -61577, -61559, -61542, -61525, -61507, -61490, -61473, -61455, -61438, -61420, -61403, -61385, -61367, -61350, -61332, -61314, -61297, -61279, -61261, -61243, -61225, -61207, -61189, -61171, -61153, -61135, -61117, -61099, -61081, -61062, -61044, -61026, -61007, -60989, -60971, -60952, -60934, -60915, -60897, -60878, -60859, -60841, -60822, -60803, -60785, -60766, -60747, -60728, -60709, -60690, -60671, -60652, -60633, -60614, -60595, -60576, -60556, -60537, -60518, -60499, -60479, -60460, -60441, -60421, -60402, -60382, -60363, -60343, -60323, -60304, -60284, -60264, -60244, -60225, -60205, -60185, -60165, -60145, -60125, -60105, -60085, -60065, -60045, -60025, -60004, -59984, -59964, -59944, -59923, -59903, -59883, -59862, -59842, -59821, -59801, -59780, -59759, -59739, -59718, -59697, -59677, -59656, -59635, -59614, -59593, -59572, -59551, -59530, -59509, -59488, -59467, -59446, -59425, -59404, -59382, -59361, -59340, -59318, -59297, -59276, -59254, -59233, -59211, -59189, -59168, -59146, -59125, -59103, -59081, -59059, -59038, -59016, -58994, -58972, -58950, -58928, -58906, -58884, -58862, -58840, -58818, -58795, -58773, -58751, -58729, -58706, -58684, -58662, -58639, -58617, -58594, -58572, -58549, -58527, -58504, -58481, -58459, -58436, -58413, -58390, -58367, -58345, -58322, -58299, -58276, -58253, -58230, -58207, -58183, -58160, -58137, -58114, -58091, -58067, -58044, -58021, -57997, -57974, -57950, -57927, -57903, -57880, -57856, -57833, -57809, -57785, -57762, -57738, -57714, -57690, -57666, -57642, -57618, -57594, -57570, -57546, -57522, -57498, -57474, -57450, -57426, -57402, -57377, -57353, -57329, -57304, -57280, -57255, -57231, -57206, -57182, -57157, -57133, -57108, -57083, -57059, -57034, -57009, -56984, -56959, -56935, -56910, -56885, -56860, -56835, -56810, -56785, -56760, -56734, -56709, -56684, -56659, -56633, -56608, -56583, -56557, -56532, -56507, -56481, -56456, -56430, -56404, -56379, -56353, -56328, -56302, -56276, -56250, -56225, -56199, -56173, -56147, -56121, -56095, -56069, -56043, -56017, -55991, -55965, -55938, -55912, -55886, -55860, -55833, -55807, -55781, -55754, -55728, -55701, -55675, -55648, -55622, -55595, -55569, -55542, -55515, -55489, -55462, -55435, -55408, -55381, -55354, -55327, -55300, -55274, -55246, -55219, -55192, -55165, -55138, -55111, -55084, -55056, -55029, -55002, -54974, -54947, -54920, -54892, -54865, -54837, -54810, -54782, -54755, -54727, -54699, -54672, -54644, -54616, -54588, -54560, -54533, -54505, -54477, -54449, -54421, -54393, -54365, -54337, -54308, -54280, -54252, -54224, -54196, -54167, -54139, -54111, -54082, -54054, -54026, -53997, -53969, -53940, -53911, -53883, -53854, -53826, -53797, -53768, -53739, -53711, -53682, -53653, -53624, -53595, -53566, -53537, -53508, -53479, -53450, -53421, -53392, -53363, -53334, -53304, -53275, -53246, -53216, -53187, -53158, -53128, -53099, -53069, -53040, -53010, -52981, -52951, -52922, -52892, -52862, -52832, -52803, -52773, -52743, -52713, -52683, -52653, -52624, -52594, -52564, -52534, -52503, -52473, -52443, -52413, -52383, -52353, -52322, -52292, -52262, -52231, -52201, -52171, -52140, -52110, -52079, -52049, -52018, -51988, -51957, -51926, -51896, -51865, -51834, -51803, -51773, -51742, -51711, -51680, -51649, -51618, -51587, -51556, -51525, -51494, -51463, -51432, -51401, -51369, -51338, -51307, -51276, -51244, -51213, -51182, -51150, -51119, -51087, -51056, -51024, -50993, -50961, -50929, -50898, -50866, -50834, -50803, -50771, -50739, -50707, -50675, -50644, -50612, -50580, -50548, -50516, -50484, -50452, -50420, -50387, -50355, -50323, -50291, -50259, -50226, -50194, -50162, -50129, -50097, -50065, -50032, -5e4, -49967, -49935, -49902, -49869, -49837, -49804, -49771, -49739, -49706, -49673, -49640, -49608, -49575, -49542, -49509, -49476, -49443, -49410, -49377, -49344, -49311, -49278, -49244, -49211, -49178, -49145, -49112, -49078, -49045, -49012, -48978, -48945, -48911, -48878, -48844, -48811, -48777, -48744, -48710, -48676, -48643, -48609, -48575, -48542, -48508, -48474, -48440, -48406, -48372, -48338, -48305, -48271, -48237, -48202, -48168, -48134, -48100, -48066, -48032, -47998, -47963, -47929, -47895, -47860, -47826, -47792, -47757, -47723, -47688, -47654, -47619, -47585, -47550, -47516, -47481, -47446, -47412, -47377, -47342, -47307, -47273, -47238, -47203, -47168, -47133, -47098, -47063, -47028, -46993, -46958, -46923, -46888, -46853, -46818, -46783, -46747, -46712, -46677, -46642, -46606, -46571, -46536, -46500, -46465, -46429, -46394, -46358, -46323, -46287, -46251, -46216, -46180, -46145, -46109, -46073, -46037, -46002, -45966, -45930, -45894, -45858, -45822, -45786, -45750, -45714, -45678, -45642, -45606, -45570, -45534, -45498, -45462, -45425, -45389, -45353, -45316, -45280, -45244, -45207, -45171, -45135, -45098, -45062, -45025, -44989, -44952, -44915, -44879, -44842, -44806, -44769, -44732, -44695, -44659, -44622, -44585, -44548, -44511, -44474, -44437, -44400, -44363, -44326, -44289, -44252, -44215, -44178, -44141, -44104, -44067, -44029, -43992, -43955, -43918, -43880, -43843, -43806, -43768, -43731, -43693, -43656, -43618, -43581, -43543, -43506, -43468, -43430, -43393, -43355, -43317, -43280, -43242, -43204, -43166, -43128, -43091, -43053, -43015, -42977, -42939, -42901, -42863, -42825, -42787, -42749, -42711, -42672, -42634, -42596, -42558, -42520, -42481, -42443, -42405, -42366, -42328, -42290, -42251, -42213, -42174, -42136, -42097, -42059, -42020, -41982, -41943, -41904, -41866, -41827, -41788, -41750, -41711, -41672, -41633, -41595, -41556, -41517, -41478, -41439, -41400, -41361, -41322, -41283, -41244, -41205, -41166, -41127, -41087, -41048, -41009, -40970, -40931, -40891, -40852, -40813, -40773, -40734, -40695, -40655, -40616, -40576, -40537, -40497, -40458, -40418, -40379, -40339, -40299, -40260, -40220, -40180, -40141, -40101, -40061, -40021, -39982, -39942, -39902, -39862, -39822, -39782, -39742, -39702, -39662, -39622, -39582, -39542, -39502, -39462, -39422, -39382, -39341, -39301, -39261, -39221, -39180, -39140, -39100, -39059, -39019, -38979, -38938, -38898, -38857, -38817, -38776, -38736, -38695, -38655, -38614, -38573, -38533, -38492, -38451, -38411, -38370, -38329, -38288, -38248, -38207, -38166, -38125, -38084, -38043, -38002, -37961, -37920, -37879, -37838, -37797, -37756, -37715, -37674, -37633, -37592, -37550, -37509, -37468, -37427, -37386, -37344, -37303, -37262, -37220, -37179, -37137, -37096, -37055, -37013, -36972, -36930, -36889, -36847, -36805, -36764, -36722, -36681, -36639, -36597, -36556, -36514, -36472, -36430, -36388, -36347, -36305, -36263, -36221, -36179, -36137, -36095, -36053, -36011, -35969, -35927, -35885, -35843, -35801, -35759, -35717, -35675, -35633, -35590, -35548, -35506, -35464, -35421, -35379, -35337, -35294, -35252, -35210, -35167, -35125, -35082, -35040, -34997, -34955, -34912, -34870, -34827, -34785, -34742, -34699, -34657, -34614, -34571, -34529, -34486, -34443, -34400, -34358, -34315, -34272, -34229, -34186, -34143, -34100, -34057, -34015, -33972, -33929, -33886, -33843, -33799, -33756, -33713, -33670, -33627, -33584, -33541, -33498, -33454, -33411, -33368, -33325, -33281, -33238, -33195, -33151, -33108, -33065, -33021, -32978, -32934, -32891, -32847, -32804, -32760, -32717, -32673, -32630, -32586, -32542, -32499, -32455, -32411, -32368, -32324, -32280, -32236, -32193, -32149, -32105, -32061, -32017, -31974, -31930, -31886, -31842, -31798, -31754, -31710, -31666, -31622, -31578, -31534, -31490, -31446, -31402, -31357, -31313, -31269, -31225, -31181, -31136, -31092, -31048, -31004, -30959, -30915, -30871, -30826, -30782, -30738, -30693, -30649, -30604, -30560, -30515, -30471, -30426, -30382, -30337, -30293, -30248, -30204, -30159, -30114, -30070, -30025, -29980, -29936, -29891, -29846, -29801, -29757, -29712, -29667, -29622, -29577, -29533, -29488, -29443, -29398, -29353, -29308, -29263, -29218, -29173, -29128, -29083, -29038, -28993, -28948, -28903, -28858, -28812, -28767, -28722, -28677, -28632, -28586, -28541, -28496, -28451, -28405, -28360, -28315, -28269, -28224, -28179, -28133, -28088, -28042, -27997, -27952, -27906, -27861, -27815, -27770, -27724, -27678, -27633, -27587, -27542, -27496, -27450, -27405, -27359, -27313, -27268, -27222, -27176, -27131, -27085, -27039, -26993, -26947, -26902, -26856, -26810, -26764, -26718, -26672, -26626, -26580, -26534, -26488, -26442, -26396, -26350, -26304, -26258, -26212, -26166, -26120, -26074, -26028, -25982, -25936, -25889, -25843, -25797, -25751, -25705, -25658, -25612, -25566, -25520, -25473, -25427, -25381, -25334, -25288, -25241, -25195, -25149, -25102, -25056, -25009, -24963, -24916, -24870, -24823, -24777, -24730, -24684, -24637, -24591, -24544, -24497, -24451, -24404, -24357, -24311, -24264, -24217, -24171, -24124, -24077, -24030, -23984, -23937, -23890, -23843, -23796, -23750, -23703, -23656, -23609, -23562, -23515, -23468, -23421, -23374, -23327, -23280, -23233, -23186, -23139, -23092, -23045, -22998, -22951, -22904, -22857, -22810, -22763, -22716, -22668, -22621, -22574, -22527, -22480, -22432, -22385, -22338, -22291, -22243, -22196, -22149, -22102, -22054, -22007, -21960, -21912, -21865, -21817, -21770, -21723, -21675, -21628, -21580, -21533, -21485, -21438, -21390, -21343, -21295, -21248, -21200, -21153, -21105, -21057, -21010, -20962, -20915, -20867, -20819, -20772, -20724, -20676, -20629, -20581, -20533, -20485, -20438, -20390, -20342, -20294, -20246, -20199, -20151, -20103, -20055, -20007, -19959, -19912, -19864, -19816, -19768, -19720, -19672, -19624, -19576, -19528, -19480, -19432, -19384, -19336, -19288, -19240, -19192, -19144, -19096, -19048, -19e3, -18951, -18903, -18855, -18807, -18759, -18711, -18663, -18614, -18566, -18518, -18470, -18421, -18373, -18325, -18277, -18228, -18180, -18132, -18084, -18035, -17987, -17939, -17890, -17842, -17793, -17745, -17697, -17648, -17600, -17551, -17503, -17455, -17406, -17358, -17309, -17261, -17212, -17164, -17115, -17067, -17018, -16970, -16921, -16872, -16824, -16775, -16727, -16678, -16629, -16581, -16532, -16484, -16435, -16386, -16338, -16289, -16240, -16191, -16143, -16094, -16045, -15997, -15948, -15899, -15850, -15802, -15753, -15704, -15655, -15606, -15557, -15509, -15460, -15411, -15362, -15313, -15264, -15215, -15167, -15118, -15069, -15020, -14971, -14922, -14873, -14824, -14775, -14726, -14677, -14628, -14579, -14530, -14481, -14432, -14383, -14334, -14285, -14236, -14187, -14138, -14089, -14040, -13990, -13941, -13892, -13843, -13794, -13745, -13696, -13647, -13597, -13548, -13499, -13450, -13401, -13351, -13302, -13253, -13204, -13154, -13105, -13056, -13007, -12957, -12908, -12859, -12810, -12760, -12711, -12662, -12612, -12563, -12514, -12464, -12415, -12366, -12316, -12267, -12217, -12168, -12119, -12069, -12020, -11970, -11921, -11872, -11822, -11773, -11723, -11674, -11624, -11575, -11525, -11476, -11426, -11377, -11327, -11278, -11228, -11179, -11129, -11080, -11030, -10981, -10931, -10882, -10832, -10782, -10733, -10683, -10634, -10584, -10534, -10485, -10435, -10386, -10336, -10286, -10237, -10187, -10137, -10088, -10038, -9988, -9939, -9889, -9839, -9790, -9740, -9690, -9640, -9591, -9541, -9491, -9442, -9392, -9342, -9292, -9243, -9193, -9143, -9093, -9043, -8994, -8944, -8894, -8844, -8794, -8745, -8695, -8645, -8595, -8545, -8496, -8446, -8396, -8346, -8296, -8246, -8196, -8147, -8097, -8047, -7997, -7947, -7897, -7847, -7797, -7747, -7697, -7648, -7598, -7548, -7498, -7448, -7398, -7348, -7298, -7248, -7198, -7148, -7098, -7048, -6998, -6948, -6898, -6848, -6798, -6748, -6698, -6648, -6598, -6548, -6498, -6448, -6398, -6348, -6298, -6248, -6198, -6148, -6098, -6048, -5998, -5948, -5898, -5848, -5798, -5747, -5697, -5647, -5597, -5547, -5497, -5447, -5397, -5347, -5297, -5247, -5197, -5146, -5096, -5046, -4996, -4946, -4896, -4846, -4796, -4745, -4695, -4645, -4595, -4545, -4495, -4445, -4394, -4344, -4294, -4244, -4194, -4144, -4093, -4043, -3993, -3943, -3893, -3843, -3792, -3742, -3692, -3642, -3592, -3541, -3491, -3441, -3391, -3341, -3291, -3240, -3190, -3140, -3090, -3039, -2989, -2939, -2889, -2839, -2788, -2738, -2688, -2638, -2588, -2537, -2487, -2437, -2387, -2336, -2286, -2236, -2186, -2135, -2085, -2035, -1985, -1934, -1884, -1834, -1784, -1733, -1683, -1633, -1583, -1532, -1482, -1432, -1382, -1331, -1281, -1231, -1181, -1130, -1080, -1030, -980, -929, -879, -829, -779, -728, -678, -628, -578, -527, -477, -427, -376, -326, -276, -226, -175, -125, -75, -25, 25, 75, 125, 175, 226, 276, 326, 376, 427, 477, 527, 578, 628, 678, 728, 779, 829, 879, 929, 980, 1030, 1080, 1130, 1181, 1231, 1281, 1331, 1382, 1432, 1482, 1532, 1583, 1633, 1683, 1733, 1784, 1834, 1884, 1934, 1985, 2035, 2085, 2135, 2186, 2236, 2286, 2336, 2387, 2437, 2487, 2537, 2587, 2638, 2688, 2738, 2788, 2839, 2889, 2939, 2989, 3039, 3090, 3140, 3190, 3240, 3291, 3341, 3391, 3441, 3491, 3542, 3592, 3642, 3692, 3742, 3792, 3843, 3893, 3943, 3993, 4043, 4093, 4144, 4194, 4244, 4294, 4344, 4394, 4445, 4495, 4545, 4595, 4645, 4695, 4745, 4796, 4846, 4896, 4946, 4996, 5046, 5096, 5146, 5197, 5247, 5297, 5347, 5397, 5447, 5497, 5547, 5597, 5647, 5697, 5747, 5798, 5848, 5898, 5948, 5998, 6048, 6098, 6148, 6198, 6248, 6298, 6348, 6398, 6448, 6498, 6548, 6598, 6648, 6698, 6748, 6798, 6848, 6898, 6948, 6998, 7048, 7098, 7148, 7198, 7248, 7298, 7348, 7398, 7448, 7498, 7548, 7598, 7648, 7697, 7747, 7797, 7847, 7897, 7947, 7997, 8047, 8097, 8147, 8196, 8246, 8296, 8346, 8396, 8446, 8496, 8545, 8595, 8645, 8695, 8745, 8794, 8844, 8894, 8944, 8994, 9043, 9093, 9143, 9193, 9243, 9292, 9342, 9392, 9442, 9491, 9541, 9591, 9640, 9690, 9740, 9790, 9839, 9889, 9939, 9988, 10038, 10088, 10137, 10187, 10237, 10286, 10336, 10386, 10435, 10485, 10534, 10584, 10634, 10683, 10733, 10782, 10832, 10882, 10931, 10981, 11030, 11080, 11129, 11179, 11228, 11278, 11327, 11377, 11426, 11476, 11525, 11575, 11624, 11674, 11723, 11773, 11822, 11872, 11921, 11970, 12020, 12069, 12119, 12168, 12218, 12267, 12316, 12366, 12415, 12464, 12514, 12563, 12612, 12662, 12711, 12760, 12810, 12859, 12908, 12957, 13007, 13056, 13105, 13154, 13204, 13253, 13302, 13351, 13401, 13450, 13499, 13548, 13597, 13647, 13696, 13745, 13794, 13843, 13892, 13941, 13990, 14040, 14089, 14138, 14187, 14236, 14285, 14334, 14383, 14432, 14481, 14530, 14579, 14628, 14677, 14726, 14775, 14824, 14873, 14922, 14971, 15020, 15069, 15118, 15167, 15215, 15264, 15313, 15362, 15411, 15460, 15509, 15557, 15606, 15655, 15704, 15753, 15802, 15850, 15899, 15948, 15997, 16045, 16094, 16143, 16191, 16240, 16289, 16338, 16386, 16435, 16484, 16532, 16581, 16629, 16678, 16727, 16775, 16824, 16872, 16921, 16970, 17018, 17067, 17115, 17164, 17212, 17261, 17309, 17358, 17406, 17455, 17503, 17551, 17600, 17648, 17697, 17745, 17793, 17842, 17890, 17939, 17987, 18035, 18084, 18132, 18180, 18228, 18277, 18325, 18373, 18421, 18470, 18518, 18566, 18614, 18663, 18711, 18759, 18807, 18855, 18903, 18951, 19e3, 19048, 19096, 19144, 19192, 19240, 19288, 19336, 19384, 19432, 19480, 19528, 19576, 19624, 19672, 19720, 19768, 19816, 19864, 19912, 19959, 20007, 20055, 20103, 20151, 20199, 20246, 20294, 20342, 20390, 20438, 20485, 20533, 20581, 20629, 20676, 20724, 20772, 20819, 20867, 20915, 20962, 21010, 21057, 21105, 21153, 21200, 21248, 21295, 21343, 21390, 21438, 21485, 21533, 21580, 21628, 21675, 21723, 21770, 21817, 21865, 21912, 21960, 22007, 22054, 22102, 22149, 22196, 22243, 22291, 22338, 22385, 22432, 22480, 22527, 22574, 22621, 22668, 22716, 22763, 22810, 22857, 22904, 22951, 22998, 23045, 23092, 23139, 23186, 23233, 23280, 23327, 23374, 23421, 23468, 23515, 23562, 23609, 23656, 23703, 23750, 23796, 23843, 23890, 23937, 23984, 24030, 24077, 24124, 24171, 24217, 24264, 24311, 24357, 24404, 24451, 24497, 24544, 24591, 24637, 24684, 24730, 24777, 24823, 24870, 24916, 24963, 25009, 25056, 25102, 25149, 25195, 25241, 25288, 25334, 25381, 25427, 25473, 25520, 25566, 25612, 25658, 25705, 25751, 25797, 25843, 25889, 25936, 25982, 26028, 26074, 26120, 26166, 26212, 26258, 26304, 26350, 26396, 26442, 26488, 26534, 26580, 26626, 26672, 26718, 26764, 26810, 26856, 26902, 26947, 26993, 27039, 27085, 27131, 27176, 27222, 27268, 27313, 27359, 27405, 27450, 27496, 27542, 27587, 27633, 27678, 27724, 27770, 27815, 27861, 27906, 27952, 27997, 28042, 28088, 28133, 28179, 28224, 28269, 28315, 28360, 28405, 28451, 28496, 28541, 28586, 28632, 28677, 28722, 28767, 28812, 28858, 28903, 28948, 28993, 29038, 29083, 29128, 29173, 29218, 29263, 29308, 29353, 29398, 29443, 29488, 29533, 29577, 29622, 29667, 29712, 29757, 29801, 29846, 29891, 29936, 29980, 30025, 30070, 30114, 30159, 30204, 30248, 30293, 30337, 30382, 30427, 30471, 30516, 30560, 30604, 30649, 30693, 30738, 30782, 30826, 30871, 30915, 30959, 31004, 31048, 31092, 31136, 31181, 31225, 31269, 31313, 31357, 31402, 31446, 31490, 31534, 31578, 31622, 31666, 31710, 31754, 31798, 31842, 31886, 31930, 31974, 32017, 32061, 32105, 32149, 32193, 32236, 32280, 32324, 32368, 32411, 32455, 32499, 32542, 32586, 32630, 32673, 32717, 32760, 32804, 32847, 32891, 32934, 32978, 33021, 33065, 33108, 33151, 33195, 33238, 33281, 33325, 33368, 33411, 33454, 33498, 33541, 33584, 33627, 33670, 33713, 33756, 33799, 33843, 33886, 33929, 33972, 34015, 34057, 34100, 34143, 34186, 34229, 34272, 34315, 34358, 34400, 34443, 34486, 34529, 34571, 34614, 34657, 34699, 34742, 34785, 34827, 34870, 34912, 34955, 34997, 35040, 35082, 35125, 35167, 35210, 35252, 35294, 35337, 35379, 35421, 35464, 35506, 35548, 35590, 35633, 35675, 35717, 35759, 35801, 35843, 35885, 35927, 35969, 36011, 36053, 36095, 36137, 36179, 36221, 36263, 36305, 36347, 36388, 36430, 36472, 36514, 36556, 36597, 36639, 36681, 36722, 36764, 36805, 36847, 36889, 36930, 36972, 37013, 37055, 37096, 37137, 37179, 37220, 37262, 37303, 37344, 37386, 37427, 37468, 37509, 37551, 37592, 37633, 37674, 37715, 37756, 37797, 37838, 37879, 37920, 37961, 38002, 38043, 38084, 38125, 38166, 38207, 38248, 38288, 38329, 38370, 38411, 38451, 38492, 38533, 38573, 38614, 38655, 38695, 38736, 38776, 38817, 38857, 38898, 38938, 38979, 39019, 39059, 39100, 39140, 39180, 39221, 39261, 39301, 39341, 39382, 39422, 39462, 39502, 39542, 39582, 39622, 39662, 39702, 39742, 39782, 39822, 39862, 39902, 39942, 39982, 40021, 40061, 40101, 40141, 40180, 40220, 40260, 40299, 40339, 40379, 40418, 40458, 40497, 40537, 40576, 40616, 40655, 40695, 40734, 40773, 40813, 40852, 40891, 40931, 40970, 41009, 41048, 41087, 41127, 41166, 41205, 41244, 41283, 41322, 41361, 41400, 41439, 41478, 41517, 41556, 41595, 41633, 41672, 41711, 41750, 41788, 41827, 41866, 41904, 41943, 41982, 42020, 42059, 42097, 42136, 42174, 42213, 42251, 42290, 42328, 42366, 42405, 42443, 42481, 42520, 42558, 42596, 42634, 42672, 42711, 42749, 42787, 42825, 42863, 42901, 42939, 42977, 43015, 43053, 43091, 43128, 43166, 43204, 43242, 43280, 43317, 43355, 43393, 43430, 43468, 43506, 43543, 43581, 43618, 43656, 43693, 43731, 43768, 43806, 43843, 43880, 43918, 43955, 43992, 44029, 44067, 44104, 44141, 44178, 44215, 44252, 44289, 44326, 44363, 44400, 44437, 44474, 44511, 44548, 44585, 44622, 44659, 44695, 44732, 44769, 44806, 44842, 44879, 44915, 44952, 44989, 45025, 45062, 45098, 45135, 45171, 45207, 45244, 45280, 45316, 45353, 45389, 45425, 45462, 45498, 45534, 45570, 45606, 45642, 45678, 45714, 45750, 45786, 45822, 45858, 45894, 45930, 45966, 46002, 46037, 46073, 46109, 46145, 46180, 46216, 46252, 46287, 46323, 46358, 46394, 46429, 46465, 46500, 46536, 46571, 46606, 46642, 46677, 46712, 46747, 46783, 46818, 46853, 46888, 46923, 46958, 46993, 47028, 47063, 47098, 47133, 47168, 47203, 47238, 47273, 47308, 47342, 47377, 47412, 47446, 47481, 47516, 47550, 47585, 47619, 47654, 47688, 47723, 47757, 47792, 47826, 47861, 47895, 47929, 47963, 47998, 48032, 48066, 48100, 48134, 48168, 48202, 48237, 48271, 48305, 48338, 48372, 48406, 48440, 48474, 48508, 48542, 48575, 48609, 48643, 48676, 48710, 48744, 48777, 48811, 48844, 48878, 48911, 48945, 48978, 49012, 49045, 49078, 49112, 49145, 49178, 49211, 49244, 49278, 49311, 49344, 49377, 49410, 49443, 49476, 49509, 49542, 49575, 49608, 49640, 49673, 49706, 49739, 49771, 49804, 49837, 49869, 49902, 49935, 49967, 5e4, 50032, 50064, 50097, 50129, 50162, 50194, 50226, 50259, 50291, 50323, 50355, 50387, 50420, 50452, 50484, 50516, 50548, 50580, 50612, 50644, 50675, 50707, 50739, 50771, 50803, 50834, 50866, 50898, 50929, 50961, 50993, 51024, 51056, 51087, 51119, 51150, 51182, 51213, 51244, 51276, 51307, 51338, 51369, 51401, 51432, 51463, 51494, 51525, 51556, 51587, 51618, 51649, 51680, 51711, 51742, 51773, 51803, 51834, 51865, 51896, 51926, 51957, 51988, 52018, 52049, 52079, 52110, 52140, 52171, 52201, 52231, 52262, 52292, 52322, 52353, 52383, 52413, 52443, 52473, 52503, 52534, 52564, 52594, 52624, 52653, 52683, 52713, 52743, 52773, 52803, 52832, 52862, 52892, 52922, 52951, 52981, 53010, 53040, 53069, 53099, 53128, 53158, 53187, 53216, 53246, 53275, 53304, 53334, 53363, 53392, 53421, 53450, 53479, 53508, 53537, 53566, 53595, 53624, 53653, 53682, 53711, 53739, 53768, 53797, 53826, 53854, 53883, 53912, 53940, 53969, 53997, 54026, 54054, 54082, 54111, 54139, 54167, 54196, 54224, 54252, 54280, 54309, 54337, 54365, 54393, 54421, 54449, 54477, 54505, 54533, 54560, 54588, 54616, 54644, 54672, 54699, 54727, 54755, 54782, 54810, 54837, 54865, 54892, 54920, 54947, 54974, 55002, 55029, 55056, 55084, 55111, 55138, 55165, 55192, 55219, 55246, 55274, 55300, 55327, 55354, 55381, 55408, 55435, 55462, 55489, 55515, 55542, 55569, 55595, 55622, 55648, 55675, 55701, 55728, 55754, 55781, 55807, 55833, 55860, 55886, 55912, 55938, 55965, 55991, 56017, 56043, 56069, 56095, 56121, 56147, 56173, 56199, 56225, 56250, 56276, 56302, 56328, 56353, 56379, 56404, 56430, 56456, 56481, 56507, 56532, 56557, 56583, 56608, 56633, 56659, 56684, 56709, 56734, 56760, 56785, 56810, 56835, 56860, 56885, 56910, 56935, 56959, 56984, 57009, 57034, 57059, 57083, 57108, 57133, 57157, 57182, 57206, 57231, 57255, 57280, 57304, 57329, 57353, 57377, 57402, 57426, 57450, 57474, 57498, 57522, 57546, 57570, 57594, 57618, 57642, 57666, 57690, 57714, 57738, 57762, 57785, 57809, 57833, 57856, 57880, 57903, 57927, 57950, 57974, 57997, 58021, 58044, 58067, 58091, 58114, 58137, 58160, 58183, 58207, 58230, 58253, 58276, 58299, 58322, 58345, 58367, 58390, 58413, 58436, 58459, 58481, 58504, 58527, 58549, 58572, 58594, 58617, 58639, 58662, 58684, 58706, 58729, 58751, 58773, 58795, 58818, 58840, 58862, 58884, 58906, 58928, 58950, 58972, 58994, 59016, 59038, 59059, 59081, 59103, 59125, 59146, 59168, 59190, 59211, 59233, 59254, 59276, 59297, 59318, 59340, 59361, 59382, 59404, 59425, 59446, 59467, 59488, 59509, 59530, 59551, 59572, 59593, 59614, 59635, 59656, 59677, 59697, 59718, 59739, 59759, 59780, 59801, 59821, 59842, 59862, 59883, 59903, 59923, 59944, 59964, 59984, 60004, 60025, 60045, 60065, 60085, 60105, 60125, 60145, 60165, 60185, 60205, 60225, 60244, 60264, 60284, 60304, 60323, 60343, 60363, 60382, 60402, 60421, 60441, 60460, 60479, 60499, 60518, 60537, 60556, 60576, 60595, 60614, 60633, 60652, 60671, 60690, 60709, 60728, 60747, 60766, 60785, 60803, 60822, 60841, 60859, 60878, 60897, 60915, 60934, 60952, 60971, 60989, 61007, 61026, 61044, 61062, 61081, 61099, 61117, 61135, 61153, 61171, 61189, 61207, 61225, 61243, 61261, 61279, 61297, 61314, 61332, 61350, 61367, 61385, 61403, 61420, 61438, 61455, 61473, 61490, 61507, 61525, 61542, 61559, 61577, 61594, 61611, 61628, 61645, 61662, 61679, 61696, 61713, 61730, 61747, 61764, 61780, 61797, 61814, 61831, 61847, 61864, 61880, 61897, 61913, 61930, 61946, 61963, 61979, 61995, 62012, 62028, 62044, 62060, 62076, 62092, 62108, 62125, 62141, 62156, 62172, 62188, 62204, 62220, 62236, 62251, 62267, 62283, 62298, 62314, 62329, 62345, 62360, 62376, 62391, 62407, 62422, 62437, 62453, 62468, 62483, 62498, 62513, 62528, 62543, 62558, 62573, 62588, 62603, 62618, 62633, 62648, 62662, 62677, 62692, 62706, 62721, 62735, 62750, 62764, 62779, 62793, 62808, 62822, 62836, 62850, 62865, 62879, 62893, 62907, 62921, 62935, 62949, 62963, 62977, 62991, 63005, 63019, 63032, 63046, 63060, 63074, 63087, 63101, 63114, 63128, 63141, 63155, 63168, 63182, 63195, 63208, 63221, 63235, 63248, 63261, 63274, 63287, 63300, 63313, 63326, 63339, 63352, 63365, 63378, 63390, 63403, 63416, 63429, 63441, 63454, 63466, 63479, 63491, 63504, 63516, 63528, 63541, 63553, 63565, 63578, 63590, 63602, 63614, 63626, 63638, 63650, 63662, 63674, 63686, 63698, 63709, 63721, 63733, 63745, 63756, 63768, 63779, 63791, 63803, 63814, 63825, 63837, 63848, 63859, 63871, 63882, 63893, 63904, 63915, 63927, 63938, 63949, 63960, 63971, 63981, 63992, 64003, 64014, 64025, 64035, 64046, 64057, 64067, 64078, 64088, 64099, 64109, 64120, 64130, 64140, 64151, 64161, 64171, 64181, 64192, 64202, 64212, 64222, 64232, 64242, 64252, 64261, 64271, 64281, 64291, 64301, 64310, 64320, 64330, 64339, 64349, 64358, 64368, 64377, 64387, 64396, 64405, 64414, 64424, 64433, 64442, 64451, 64460, 64469, 64478, 64487, 64496, 64505, 64514, 64523, 64532, 64540, 64549, 64558, 64566, 64575, 64584, 64592, 64600, 64609, 64617, 64626, 64634, 64642, 64651, 64659, 64667, 64675, 64683, 64691, 64699, 64707, 64715, 64723, 64731, 64739, 64747, 64754, 64762, 64770, 64777, 64785, 64793, 64800, 64808, 64815, 64822, 64830, 64837, 64844, 64852, 64859, 64866, 64873, 64880, 64887, 64895, 64902, 64908, 64915, 64922, 64929, 64936, 64943, 64949, 64956, 64963, 64969, 64976, 64982, 64989, 64995, 65002, 65008, 65015, 65021, 65027, 65033, 65040, 65046, 65052, 65058, 65064, 65070, 65076, 65082, 65088, 65094, 65099, 65105, 65111, 65117, 65122, 65128, 65133, 65139, 65144, 65150, 65155, 65161, 65166, 65171, 65177, 65182, 65187, 65192, 65197, 65202, 65207, 65212, 65217, 65222, 65227, 65232, 65237, 65242, 65246, 65251, 65256, 65260, 65265, 65270, 65274, 65279, 65283, 65287, 65292, 65296, 65300, 65305, 65309, 65313, 65317, 65321, 65325, 65329, 65333, 65337, 65341, 65345, 65349, 65352, 65356, 65360, 65363, 65367, 65371, 65374, 65378, 65381, 65385, 65388, 65391, 65395, 65398, 65401, 65404, 65408, 65411, 65414, 65417, 65420, 65423, 65426, 65429, 65431, 65434, 65437, 65440, 65442, 65445, 65448, 65450, 65453, 65455, 65458, 65460, 65463, 65465, 65467, 65470, 65472, 65474, 65476, 65478, 65480, 65482, 65484, 65486, 65488, 65490, 65492, 65494, 65496, 65497, 65499, 65501, 65502, 65504, 65505, 65507, 65508, 65510, 65511, 65513, 65514, 65515, 65516, 65518, 65519, 65520, 65521, 65522, 65523, 65524, 65525, 65526, 65527, 65527, 65528, 65529, 65530, 65530, 65531, 65531, 65532, 65532, 65533, 65533, 65534, 65534, 65534, 65535, 65535, 65535, 65535, 65535, 65535, 65535]);
    finecosine = finesine.subarray(FINEANGLES / 4);
    finetangent = new Int32Array([-170910304, -56965752, -34178904, -24413316, -18988036, -15535599, -13145455, -11392683, -10052327, -8994149, -8137527, -7429880, -6835455, -6329090, -5892567, -5512368, -5178251, -4882318, -4618375, -4381502, -4167737, -3973855, -3797206, -3635590, -3487165, -3350381, -3223918, -3106651, -2997613, -2895966, -2800983, -2712030, -2628549, -2550052, -2476104, -2406322, -2340362, -2277919, -2218719, -2162516, -2109087, -2058233, -2009771, -1963536, -1919378, -1877161, -1836758, -1798063, -1760956, -1725348, -1691149, -1658278, -1626658, -1596220, -1566898, -1538632, -1511367, -1485049, -1459630, -1435065, -1411312, -1388330, -1366084, -1344537, -1323658, -1303416, -1283783, -1264730, -1246234, -1228269, -1210813, -1193846, -1177345, -1161294, -1145673, -1130465, -1115654, -1101225, -1087164, -1073455, -1060087, -1047046, -1034322, -1021901, -1009774, -997931, -986361, -975054, -964003, -953199, -942633, -932298, -922186, -912289, -902602, -893117, -883829, -874730, -865817, -857081, -848520, -840127, -831898, -823827, -815910, -808143, -800521, -793041, -785699, -778490, -771411, -764460, -757631, -750922, -744331, -737853, -731486, -725227, -719074, -713023, -707072, -701219, -695462, -689797, -684223, -678737, -673338, -668024, -662792, -657640, -652568, -647572, -642651, -637803, -633028, -628323, -623686, -619117, -614613, -610174, -605798, -601483, -597229, -593033, -588896, -584815, -580789, -576818, -572901, -569035, -565221, -561456, -557741, -554074, -550455, -546881, -543354, -539870, -536431, -533034, -529680, -526366, -523094, -519861, -516667, -513512, -510394, -507313, -504269, -501261, -498287, -495348, -492443, -489571, -486732, -483925, -481150, -478406, -475692, -473009, -470355, -467730, -465133, -462565, -460024, -457511, -455024, -452564, -450129, -447720, -445337, -442978, -440643, -438332, -436045, -433781, -431540, -429321, -427125, -424951, -422798, -420666, -418555, -416465, -414395, -412344, -410314, -408303, -406311, -404338, -402384, -400448, -398530, -396630, -394747, -392882, -391034, -389202, -387387, -385589, -383807, -382040, -380290, -378555, -376835, -375130, -373440, -371765, -370105, -368459, -366826, -365208, -363604, -362013, -360436, -358872, -357321, -355783, -354257, -352744, -351244, -349756, -348280, -346816, -345364, -343924, -342495, -341078, -339671, -338276, -336892, -335519, -334157, -332805, -331464, -330133, -328812, -327502, -326201, -324910, -323629, -322358, -321097, -319844, -318601, -317368, -316143, -314928, -313721, -312524, -311335, -310154, -308983, -307819, -306664, -305517, -304379, -303248, -302126, -301011, -299904, -298805, -297714, -296630, -295554, -294485, -293423, -292369, -291322, -290282, -289249, -288223, -287204, -286192, -285186, -284188, -283195, -282210, -281231, -280258, -279292, -278332, -277378, -276430, -275489, -274553, -273624, -272700, -271782, -270871, -269965, -269064, -268169, -267280, -266397, -265519, -264646, -263779, -262917, -262060, -261209, -260363, -259522, -258686, -257855, -257029, -256208, -255392, -254581, -253774, -252973, -252176, -251384, -250596, -249813, -249035, -248261, -247492, -246727, -245966, -245210, -244458, -243711, -242967, -242228, -241493, -240763, -240036, -239314, -238595, -237881, -237170, -236463, -235761, -235062, -234367, -233676, -232988, -232304, -231624, -230948, -230275, -229606, -228941, -228279, -227621, -226966, -226314, -225666, -225022, -224381, -223743, -223108, -222477, -221849, -221225, -220603, -219985, -219370, -218758, -218149, -217544, -216941, -216341, -215745, -215151, -214561, -213973, -213389, -212807, -212228, -211652, -211079, -210509, -209941, -209376, -208815, -208255, -207699, -207145, -206594, -206045, -205500, -204956, -204416, -203878, -203342, -202809, -202279, -201751, -201226, -200703, -200182, -199664, -199149, -198636, -198125, -197616, -197110, -196606, -196105, -195606, -195109, -194614, -194122, -193631, -193143, -192658, -192174, -191693, -191213, -190736, -190261, -189789, -189318, -188849, -188382, -187918, -187455, -186995, -186536, -186080, -185625, -185173, -184722, -184274, -183827, -183382, -182939, -182498, -182059, -181622, -181186, -180753, -180321, -179891, -179463, -179037, -178612, -178190, -177769, -177349, -176932, -176516, -176102, -175690, -175279, -174870, -174463, -174057, -173653, -173251, -172850, -172451, -172053, -171657, -171263, -170870, -170479, -170089, -169701, -169315, -168930, -168546, -168164, -167784, -167405, -167027, -166651, -166277, -165904, -165532, -165162, -164793, -164426, -164060, -163695, -163332, -162970, -162610, -162251, -161893, -161537, -161182, -160828, -160476, -160125, -159775, -159427, -159079, -158734, -158389, -158046, -157704, -157363, -157024, -156686, -156349, -156013, -155678, -155345, -155013, -154682, -154352, -154024, -153697, -153370, -153045, -152722, -152399, -152077, -151757, -151438, -151120, -150803, -150487, -150172, -149859, -149546, -149235, -148924, -148615, -148307, -148e3, -147693, -147388, -147084, -146782, -146480, -146179, -145879, -145580, -145282, -144986, -144690, -144395, -144101, -143808, -143517, -143226, -142936, -142647, -142359, -142072, -141786, -141501, -141217, -140934, -140651, -140370, -140090, -139810, -139532, -139254, -138977, -138701, -138426, -138152, -137879, -137607, -137335, -137065, -136795, -136526, -136258, -135991, -135725, -135459, -135195, -134931, -134668, -134406, -134145, -133884, -133625, -133366, -133108, -132851, -132594, -132339, -132084, -131830, -131576, -131324, -131072, -130821, -130571, -130322, -130073, -129825, -129578, -129332, -129086, -128841, -128597, -128353, -128111, -127869, -127627, -127387, -127147, -126908, -126669, -126432, -126195, -125959, -125723, -125488, -125254, -125020, -124787, -124555, -124324, -124093, -123863, -123633, -123404, -123176, -122949, -122722, -122496, -122270, -122045, -121821, -121597, -121374, -121152, -120930, -120709, -120489, -120269, -120050, -119831, -119613, -119396, -119179, -118963, -118747, -118532, -118318, -118104, -117891, -117678, -117466, -117254, -117044, -116833, -116623, -116414, -116206, -115998, -115790, -115583, -115377, -115171, -114966, -114761, -114557, -114354, -114151, -113948, -113746, -113545, -113344, -113143, -112944, -112744, -112546, -112347, -112150, -111952, -111756, -111560, -111364, -111169, -110974, -110780, -110586, -110393, -110200, -110008, -109817, -109626, -109435, -109245, -109055, -108866, -108677, -108489, -108301, -108114, -107927, -107741, -107555, -107369, -107184, -107e3, -106816, -106632, -106449, -106266, -106084, -105902, -105721, -105540, -105360, -105180, -105e3, -104821, -104643, -104465, -104287, -104109, -103933, -103756, -103580, -103404, -103229, -103054, -102880, -102706, -102533, -102360, -102187, -102015, -101843, -101671, -101500, -101330, -101159, -100990, -100820, -100651, -100482, -100314, -100146, -99979, -99812, -99645, -99479, -99313, -99148, -98982, -98818, -98653, -98489, -98326, -98163, -98e3, -97837, -97675, -97513, -97352, -97191, -97030, -96870, -96710, -96551, -96391, -96233, -96074, -95916, -95758, -95601, -95444, -95287, -95131, -94975, -94819, -94664, -94509, -94354, -94200, -94046, -93892, -93739, -93586, -93434, -93281, -93129, -92978, -92826, -92675, -92525, -92375, -92225, -92075, -91926, -91777, -91628, -91480, -91332, -91184, -91036, -90889, -90742, -90596, -90450, -90304, -90158, -90013, -89868, -89724, -89579, -89435, -89292, -89148, -89005, -88862, -88720, -88577, -88435, -88294, -88152, -88011, -87871, -87730, -87590, -87450, -87310, -87171, -87032, -86893, -86755, -86616, -86479, -86341, -86204, -86066, -85930, -85793, -85657, -85521, -85385, -85250, -85114, -84980, -84845, -84710, -84576, -84443, -84309, -84176, -84043, -83910, -83777, -83645, -83513, -83381, -83250, -83118, -82987, -82857, -82726, -82596, -82466, -82336, -82207, -82078, -81949, -81820, -81691, -81563, -81435, -81307, -81180, -81053, -80925, -80799, -80672, -80546, -80420, -80294, -80168, -80043, -79918, -79793, -79668, -79544, -79420, -79296, -79172, -79048, -78925, -78802, -78679, -78557, -78434, -78312, -78190, -78068, -77947, -77826, -77705, -77584, -77463, -77343, -77223, -77103, -76983, -76864, -76744, -76625, -76506, -76388, -76269, -76151, -76033, -75915, -75797, -75680, -75563, -75446, -75329, -75213, -75096, -74980, -74864, -74748, -74633, -74517, -74402, -74287, -74172, -74058, -73944, -73829, -73715, -73602, -73488, -73375, -73262, -73149, -73036, -72923, -72811, -72699, -72587, -72475, -72363, -72252, -72140, -72029, -71918, -71808, -71697, -71587, -71477, -71367, -71257, -71147, -71038, -70929, -70820, -70711, -70602, -70494, -70385, -70277, -70169, -70061, -69954, -69846, -69739, -69632, -69525, -69418, -69312, -69205, -69099, -68993, -68887, -68781, -68676, -68570, -68465, -68360, -68255, -68151, -68046, -67942, -67837, -67733, -67629, -67526, -67422, -67319, -67216, -67113, -67010, -66907, -66804, -66702, -66600, -66498, -66396, -66294, -66192, -66091, -65989, -65888, -65787, -65686, -65586, -65485, -65385, -65285, -65185, -65085, -64985, -64885, -64786, -64687, -64587, -64488, -64389, -64291, -64192, -64094, -63996, -63897, -63799, -63702, -63604, -63506, -63409, -63312, -63215, -63118, -63021, -62924, -62828, -62731, -62635, -62539, -62443, -62347, -62251, -62156, -62060, -61965, -61870, -61775, -61680, -61585, -61491, -61396, -61302, -61208, -61114, -61020, -60926, -60833, -60739, -60646, -60552, -60459, -60366, -60273, -60181, -60088, -59996, -59903, -59811, -59719, -59627, -59535, -59444, -59352, -59261, -59169, -59078, -58987, -58896, -58805, -58715, -58624, -58534, -58443, -58353, -58263, -58173, -58083, -57994, -57904, -57815, -57725, -57636, -57547, -57458, -57369, -57281, -57192, -57104, -57015, -56927, -56839, -56751, -56663, -56575, -56487, -56400, -56312, -56225, -56138, -56051, -55964, -55877, -55790, -55704, -55617, -55531, -55444, -55358, -55272, -55186, -55100, -55015, -54929, -54843, -54758, -54673, -54587, -54502, -54417, -54333, -54248, -54163, -54079, -53994, -53910, -53826, -53741, -53657, -53574, -53490, -53406, -53322, -53239, -53156, -53072, -52989, -52906, -52823, -52740, -52657, -52575, -52492, -52410, -52327, -52245, -52163, -52081, -51999, -51917, -51835, -51754, -51672, -51591, -51509, -51428, -51347, -51266, -51185, -51104, -51023, -50942, -50862, -50781, -50701, -50621, -50540, -50460, -50380, -50300, -50221, -50141, -50061, -49982, -49902, -49823, -49744, -49664, -49585, -49506, -49427, -49349, -49270, -49191, -49113, -49034, -48956, -48878, -48799, -48721, -48643, -48565, -48488, -48410, -48332, -48255, -48177, -48100, -48022, -47945, -47868, -47791, -47714, -47637, -47560, -47484, -47407, -47331, -47254, -47178, -47102, -47025, -46949, -46873, -46797, -46721, -46646, -46570, -46494, -46419, -46343, -46268, -46193, -46118, -46042, -45967, -45892, -45818, -45743, -45668, -45593, -45519, -45444, -45370, -45296, -45221, -45147, -45073, -44999, -44925, -44851, -44778, -44704, -44630, -44557, -44483, -44410, -44337, -44263, -44190, -44117, -44044, -43971, -43898, -43826, -43753, -43680, -43608, -43535, -43463, -43390, -43318, -43246, -43174, -43102, -43030, -42958, -42886, -42814, -42743, -42671, -42600, -42528, -42457, -42385, -42314, -42243, -42172, -42101, -42030, -41959, -41888, -41817, -41747, -41676, -41605, -41535, -41465, -41394, -41324, -41254, -41184, -41113, -41043, -40973, -40904, -40834, -40764, -40694, -40625, -40555, -40486, -40416, -40347, -40278, -40208, -40139, -40070, -40001, -39932, -39863, -39794, -39726, -39657, -39588, -39520, -39451, -39383, -39314, -39246, -39178, -39110, -39042, -38973, -38905, -38837, -38770, -38702, -38634, -38566, -38499, -38431, -38364, -38296, -38229, -38161, -38094, -38027, -37960, -37893, -37826, -37759, -37692, -37625, -37558, -37491, -37425, -37358, -37291, -37225, -37158, -37092, -37026, -36959, -36893, -36827, -36761, -36695, -36629, -36563, -36497, -36431, -36365, -36300, -36234, -36168, -36103, -36037, -35972, -35907, -35841, -35776, -35711, -35646, -35580, -35515, -35450, -35385, -35321, -35256, -35191, -35126, -35062, -34997, -34932, -34868, -34803, -34739, -34675, -34610, -34546, -34482, -34418, -34354, -34289, -34225, -34162, -34098, -34034, -33970, -33906, -33843, -33779, -33715, -33652, -33588, -33525, -33461, -33398, -33335, -33272, -33208, -33145, -33082, -33019, -32956, -32893, -32830, -32767, -32705, -32642, -32579, -32516, -32454, -32391, -32329, -32266, -32204, -32141, -32079, -32017, -31955, -31892, -31830, -31768, -31706, -31644, -31582, -31520, -31458, -31396, -31335, -31273, -31211, -31150, -31088, -31026, -30965, -30904, -30842, -30781, -30719, -30658, -30597, -30536, -30474, -30413, -30352, -30291, -30230, -30169, -30108, -30048, -29987, -29926, -29865, -29805, -29744, -29683, -29623, -29562, -29502, -29441, -29381, -29321, -29260, -29200, -29140, -29080, -29020, -28959, -28899, -28839, -28779, -28719, -28660, -28600, -28540, -28480, -28420, -28361, -28301, -28241, -28182, -28122, -28063, -28003, -27944, -27884, -27825, -27766, -27707, -27647, -27588, -27529, -27470, -27411, -27352, -27293, -27234, -27175, -27116, -27057, -26998, -26940, -26881, -26822, -26763, -26705, -26646, -26588, -26529, -26471, -26412, -26354, -26295, -26237, -26179, -26120, -26062, -26004, -25946, -25888, -25830, -25772, -25714, -25656, -25598, -25540, -25482, -25424, -25366, -25308, -25251, -25193, -25135, -25078, -25020, -24962, -24905, -24847, -24790, -24732, -24675, -24618, -24560, -24503, -24446, -24389, -24331, -24274, -24217, -24160, -24103, -24046, -23989, -23932, -23875, -23818, -23761, -23704, -23647, -23591, -23534, -23477, -23420, -23364, -23307, -23250, -23194, -23137, -23081, -23024, -22968, -22911, -22855, -22799, -22742, -22686, -22630, -22573, -22517, -22461, -22405, -22349, -22293, -22237, -22181, -22125, -22069, -22013, -21957, -21901, -21845, -21789, -21733, -21678, -21622, -21566, -21510, -21455, -21399, -21343, -21288, -21232, -21177, -21121, -21066, -21010, -20955, -20900, -20844, -20789, -20734, -20678, -20623, -20568, -20513, -20457, -20402, -20347, -20292, -20237, -20182, -20127, -20072, -20017, -19962, -19907, -19852, -19797, -19742, -19688, -19633, -19578, -19523, -19469, -19414, -19359, -19305, -19250, -19195, -19141, -19086, -19032, -18977, -18923, -18868, -18814, -18760, -18705, -18651, -18597, -18542, -18488, -18434, -18380, -18325, -18271, -18217, -18163, -18109, -18055, -18001, -17946, -17892, -17838, -17784, -17731, -17677, -17623, -17569, -17515, -17461, -17407, -17353, -17300, -17246, -17192, -17138, -17085, -17031, -16977, -16924, -16870, -16817, -16763, -16710, -16656, -16603, -16549, -16496, -16442, -16389, -16335, -16282, -16229, -16175, -16122, -16069, -16015, -15962, -15909, -15856, -15802, -15749, -15696, -15643, -15590, -15537, -15484, -15431, -15378, -15325, -15272, -15219, -15166, -15113, -15060, -15007, -14954, -14901, -14848, -14795, -14743, -14690, -14637, -14584, -14531, -14479, -14426, -14373, -14321, -14268, -14215, -14163, -14110, -14057, -14005, -13952, -13900, -13847, -13795, -13742, -13690, -13637, -13585, -13533, -13480, -13428, -13375, -13323, -13271, -13218, -13166, -13114, -13062, -13009, -12957, -12905, -12853, -12800, -12748, -12696, -12644, -12592, -12540, -12488, -12436, -12383, -12331, -12279, -12227, -12175, -12123, -12071, -12019, -11967, -11916, -11864, -11812, -11760, -11708, -11656, -11604, -11552, -11501, -11449, -11397, -11345, -11293, -11242, -11190, -11138, -11086, -11035, -10983, -10931, -10880, -10828, -10777, -10725, -10673, -10622, -10570, -10519, -10467, -10415, -10364, -10312, -10261, -10209, -10158, -10106, -10055, -10004, -9952, -9901, -9849, -9798, -9747, -9695, -9644, -9592, -9541, -9490, -9438, -9387, -9336, -9285, -9233, -9182, -9131, -9080, -9028, -8977, -8926, -8875, -8824, -8772, -8721, -8670, -8619, -8568, -8517, -8466, -8414, -8363, -8312, -8261, -8210, -8159, -8108, -8057, -8006, -7955, -7904, -7853, -7802, -7751, -7700, -7649, -7598, -7547, -7496, -7445, -7395, -7344, -7293, -7242, -7191, -7140, -7089, -7038, -6988, -6937, -6886, -6835, -6784, -6733, -6683, -6632, -6581, -6530, -6480, -6429, -6378, -6327, -6277, -6226, -6175, -6124, -6074, -6023, -5972, -5922, -5871, -5820, -5770, -5719, -5668, -5618, -5567, -5517, -5466, -5415, -5365, -5314, -5264, -5213, -5162, -5112, -5061, -5011, -4960, -4910, -4859, -4808, -4758, -4707, -4657, -4606, -4556, -4505, -4455, -4404, -4354, -4303, -4253, -4202, -4152, -4101, -4051, -4001, -3950, -3900, -3849, -3799, -3748, -3698, -3648, -3597, -3547, -3496, -3446, -3395, -3345, -3295, -3244, -3194, -3144, -3093, -3043, -2992, -2942, -2892, -2841, -2791, -2741, -2690, -2640, -2590, -2539, -2489, -2439, -2388, -2338, -2288, -2237, -2187, -2137, -2086, -2036, -1986, -1935, -1885, -1835, -1784, -1734, -1684, -1633, -1583, -1533, -1483, -1432, -1382, -1332, -1281, -1231, -1181, -1131, -1080, -1030, -980, -929, -879, -829, -779, -728, -678, -628, -578, -527, -477, -427, -376, -326, -276, -226, -175, -125, -75, -25, 25, 75, 125, 175, 226, 276, 326, 376, 427, 477, 527, 578, 628, 678, 728, 779, 829, 879, 929, 980, 1030, 1080, 1131, 1181, 1231, 1281, 1332, 1382, 1432, 1483, 1533, 1583, 1633, 1684, 1734, 1784, 1835, 1885, 1935, 1986, 2036, 2086, 2137, 2187, 2237, 2288, 2338, 2388, 2439, 2489, 2539, 2590, 2640, 2690, 2741, 2791, 2841, 2892, 2942, 2992, 3043, 3093, 3144, 3194, 3244, 3295, 3345, 3395, 3446, 3496, 3547, 3597, 3648, 3698, 3748, 3799, 3849, 3900, 3950, 4001, 4051, 4101, 4152, 4202, 4253, 4303, 4354, 4404, 4455, 4505, 4556, 4606, 4657, 4707, 4758, 4808, 4859, 4910, 4960, 5011, 5061, 5112, 5162, 5213, 5264, 5314, 5365, 5415, 5466, 5517, 5567, 5618, 5668, 5719, 5770, 5820, 5871, 5922, 5972, 6023, 6074, 6124, 6175, 6226, 6277, 6327, 6378, 6429, 6480, 6530, 6581, 6632, 6683, 6733, 6784, 6835, 6886, 6937, 6988, 7038, 7089, 7140, 7191, 7242, 7293, 7344, 7395, 7445, 7496, 7547, 7598, 7649, 7700, 7751, 7802, 7853, 7904, 7955, 8006, 8057, 8108, 8159, 8210, 8261, 8312, 8363, 8414, 8466, 8517, 8568, 8619, 8670, 8721, 8772, 8824, 8875, 8926, 8977, 9028, 9080, 9131, 9182, 9233, 9285, 9336, 9387, 9438, 9490, 9541, 9592, 9644, 9695, 9747, 9798, 9849, 9901, 9952, 10004, 10055, 10106, 10158, 10209, 10261, 10312, 10364, 10415, 10467, 10519, 10570, 10622, 10673, 10725, 10777, 10828, 10880, 10931, 10983, 11035, 11086, 11138, 11190, 11242, 11293, 11345, 11397, 11449, 11501, 11552, 11604, 11656, 11708, 11760, 11812, 11864, 11916, 11967, 12019, 12071, 12123, 12175, 12227, 12279, 12331, 12383, 12436, 12488, 12540, 12592, 12644, 12696, 12748, 12800, 12853, 12905, 12957, 13009, 13062, 13114, 13166, 13218, 13271, 13323, 13375, 13428, 13480, 13533, 13585, 13637, 13690, 13742, 13795, 13847, 13900, 13952, 14005, 14057, 14110, 14163, 14215, 14268, 14321, 14373, 14426, 14479, 14531, 14584, 14637, 14690, 14743, 14795, 14848, 14901, 14954, 15007, 15060, 15113, 15166, 15219, 15272, 15325, 15378, 15431, 15484, 15537, 15590, 15643, 15696, 15749, 15802, 15856, 15909, 15962, 16015, 16069, 16122, 16175, 16229, 16282, 16335, 16389, 16442, 16496, 16549, 16603, 16656, 16710, 16763, 16817, 16870, 16924, 16977, 17031, 17085, 17138, 17192, 17246, 17300, 17353, 17407, 17461, 17515, 17569, 17623, 17677, 17731, 17784, 17838, 17892, 17946, 18001, 18055, 18109, 18163, 18217, 18271, 18325, 18380, 18434, 18488, 18542, 18597, 18651, 18705, 18760, 18814, 18868, 18923, 18977, 19032, 19086, 19141, 19195, 19250, 19305, 19359, 19414, 19469, 19523, 19578, 19633, 19688, 19742, 19797, 19852, 19907, 19962, 20017, 20072, 20127, 20182, 20237, 20292, 20347, 20402, 20457, 20513, 20568, 20623, 20678, 20734, 20789, 20844, 20900, 20955, 21010, 21066, 21121, 21177, 21232, 21288, 21343, 21399, 21455, 21510, 21566, 21622, 21678, 21733, 21789, 21845, 21901, 21957, 22013, 22069, 22125, 22181, 22237, 22293, 22349, 22405, 22461, 22517, 22573, 22630, 22686, 22742, 22799, 22855, 22911, 22968, 23024, 23081, 23137, 23194, 23250, 23307, 23364, 23420, 23477, 23534, 23591, 23647, 23704, 23761, 23818, 23875, 23932, 23989, 24046, 24103, 24160, 24217, 24274, 24331, 24389, 24446, 24503, 24560, 24618, 24675, 24732, 24790, 24847, 24905, 24962, 25020, 25078, 25135, 25193, 25251, 25308, 25366, 25424, 25482, 25540, 25598, 25656, 25714, 25772, 25830, 25888, 25946, 26004, 26062, 26120, 26179, 26237, 26295, 26354, 26412, 26471, 26529, 26588, 26646, 26705, 26763, 26822, 26881, 26940, 26998, 27057, 27116, 27175, 27234, 27293, 27352, 27411, 27470, 27529, 27588, 27647, 27707, 27766, 27825, 27884, 27944, 28003, 28063, 28122, 28182, 28241, 28301, 28361, 28420, 28480, 28540, 28600, 28660, 28719, 28779, 28839, 28899, 28959, 29020, 29080, 29140, 29200, 29260, 29321, 29381, 29441, 29502, 29562, 29623, 29683, 29744, 29805, 29865, 29926, 29987, 30048, 30108, 30169, 30230, 30291, 30352, 30413, 30474, 30536, 30597, 30658, 30719, 30781, 30842, 30904, 30965, 31026, 31088, 31150, 31211, 31273, 31335, 31396, 31458, 31520, 31582, 31644, 31706, 31768, 31830, 31892, 31955, 32017, 32079, 32141, 32204, 32266, 32329, 32391, 32454, 32516, 32579, 32642, 32705, 32767, 32830, 32893, 32956, 33019, 33082, 33145, 33208, 33272, 33335, 33398, 33461, 33525, 33588, 33652, 33715, 33779, 33843, 33906, 33970, 34034, 34098, 34162, 34225, 34289, 34354, 34418, 34482, 34546, 34610, 34675, 34739, 34803, 34868, 34932, 34997, 35062, 35126, 35191, 35256, 35321, 35385, 35450, 35515, 35580, 35646, 35711, 35776, 35841, 35907, 35972, 36037, 36103, 36168, 36234, 36300, 36365, 36431, 36497, 36563, 36629, 36695, 36761, 36827, 36893, 36959, 37026, 37092, 37158, 37225, 37291, 37358, 37425, 37491, 37558, 37625, 37692, 37759, 37826, 37893, 37960, 38027, 38094, 38161, 38229, 38296, 38364, 38431, 38499, 38566, 38634, 38702, 38770, 38837, 38905, 38973, 39042, 39110, 39178, 39246, 39314, 39383, 39451, 39520, 39588, 39657, 39726, 39794, 39863, 39932, 40001, 40070, 40139, 40208, 40278, 40347, 40416, 40486, 40555, 40625, 40694, 40764, 40834, 40904, 40973, 41043, 41113, 41184, 41254, 41324, 41394, 41465, 41535, 41605, 41676, 41747, 41817, 41888, 41959, 42030, 42101, 42172, 42243, 42314, 42385, 42457, 42528, 42600, 42671, 42743, 42814, 42886, 42958, 43030, 43102, 43174, 43246, 43318, 43390, 43463, 43535, 43608, 43680, 43753, 43826, 43898, 43971, 44044, 44117, 44190, 44263, 44337, 44410, 44483, 44557, 44630, 44704, 44778, 44851, 44925, 44999, 45073, 45147, 45221, 45296, 45370, 45444, 45519, 45593, 45668, 45743, 45818, 45892, 45967, 46042, 46118, 46193, 46268, 46343, 46419, 46494, 46570, 46646, 46721, 46797, 46873, 46949, 47025, 47102, 47178, 47254, 47331, 47407, 47484, 47560, 47637, 47714, 47791, 47868, 47945, 48022, 48100, 48177, 48255, 48332, 48410, 48488, 48565, 48643, 48721, 48799, 48878, 48956, 49034, 49113, 49191, 49270, 49349, 49427, 49506, 49585, 49664, 49744, 49823, 49902, 49982, 50061, 50141, 50221, 50300, 50380, 50460, 50540, 50621, 50701, 50781, 50862, 50942, 51023, 51104, 51185, 51266, 51347, 51428, 51509, 51591, 51672, 51754, 51835, 51917, 51999, 52081, 52163, 52245, 52327, 52410, 52492, 52575, 52657, 52740, 52823, 52906, 52989, 53072, 53156, 53239, 53322, 53406, 53490, 53574, 53657, 53741, 53826, 53910, 53994, 54079, 54163, 54248, 54333, 54417, 54502, 54587, 54673, 54758, 54843, 54929, 55015, 55100, 55186, 55272, 55358, 55444, 55531, 55617, 55704, 55790, 55877, 55964, 56051, 56138, 56225, 56312, 56400, 56487, 56575, 56663, 56751, 56839, 56927, 57015, 57104, 57192, 57281, 57369, 57458, 57547, 57636, 57725, 57815, 57904, 57994, 58083, 58173, 58263, 58353, 58443, 58534, 58624, 58715, 58805, 58896, 58987, 59078, 59169, 59261, 59352, 59444, 59535, 59627, 59719, 59811, 59903, 59996, 60088, 60181, 60273, 60366, 60459, 60552, 60646, 60739, 60833, 60926, 61020, 61114, 61208, 61302, 61396, 61491, 61585, 61680, 61775, 61870, 61965, 62060, 62156, 62251, 62347, 62443, 62539, 62635, 62731, 62828, 62924, 63021, 63118, 63215, 63312, 63409, 63506, 63604, 63702, 63799, 63897, 63996, 64094, 64192, 64291, 64389, 64488, 64587, 64687, 64786, 64885, 64985, 65085, 65185, 65285, 65385, 65485, 65586, 65686, 65787, 65888, 65989, 66091, 66192, 66294, 66396, 66498, 66600, 66702, 66804, 66907, 67010, 67113, 67216, 67319, 67422, 67526, 67629, 67733, 67837, 67942, 68046, 68151, 68255, 68360, 68465, 68570, 68676, 68781, 68887, 68993, 69099, 69205, 69312, 69418, 69525, 69632, 69739, 69846, 69954, 70061, 70169, 70277, 70385, 70494, 70602, 70711, 70820, 70929, 71038, 71147, 71257, 71367, 71477, 71587, 71697, 71808, 71918, 72029, 72140, 72252, 72363, 72475, 72587, 72699, 72811, 72923, 73036, 73149, 73262, 73375, 73488, 73602, 73715, 73829, 73944, 74058, 74172, 74287, 74402, 74517, 74633, 74748, 74864, 74980, 75096, 75213, 75329, 75446, 75563, 75680, 75797, 75915, 76033, 76151, 76269, 76388, 76506, 76625, 76744, 76864, 76983, 77103, 77223, 77343, 77463, 77584, 77705, 77826, 77947, 78068, 78190, 78312, 78434, 78557, 78679, 78802, 78925, 79048, 79172, 79296, 79420, 79544, 79668, 79793, 79918, 80043, 80168, 80294, 80420, 80546, 80672, 80799, 80925, 81053, 81180, 81307, 81435, 81563, 81691, 81820, 81949, 82078, 82207, 82336, 82466, 82596, 82726, 82857, 82987, 83118, 83250, 83381, 83513, 83645, 83777, 83910, 84043, 84176, 84309, 84443, 84576, 84710, 84845, 84980, 85114, 85250, 85385, 85521, 85657, 85793, 85930, 86066, 86204, 86341, 86479, 86616, 86755, 86893, 87032, 87171, 87310, 87450, 87590, 87730, 87871, 88011, 88152, 88294, 88435, 88577, 88720, 88862, 89005, 89148, 89292, 89435, 89579, 89724, 89868, 90013, 90158, 90304, 90450, 90596, 90742, 90889, 91036, 91184, 91332, 91480, 91628, 91777, 91926, 92075, 92225, 92375, 92525, 92675, 92826, 92978, 93129, 93281, 93434, 93586, 93739, 93892, 94046, 94200, 94354, 94509, 94664, 94819, 94975, 95131, 95287, 95444, 95601, 95758, 95916, 96074, 96233, 96391, 96551, 96710, 96870, 97030, 97191, 97352, 97513, 97675, 97837, 98e3, 98163, 98326, 98489, 98653, 98818, 98982, 99148, 99313, 99479, 99645, 99812, 99979, 100146, 100314, 100482, 100651, 100820, 100990, 101159, 101330, 101500, 101671, 101843, 102015, 102187, 102360, 102533, 102706, 102880, 103054, 103229, 103404, 103580, 103756, 103933, 104109, 104287, 104465, 104643, 104821, 105e3, 105180, 105360, 105540, 105721, 105902, 106084, 106266, 106449, 106632, 106816, 107e3, 107184, 107369, 107555, 107741, 107927, 108114, 108301, 108489, 108677, 108866, 109055, 109245, 109435, 109626, 109817, 110008, 110200, 110393, 110586, 110780, 110974, 111169, 111364, 111560, 111756, 111952, 112150, 112347, 112546, 112744, 112944, 113143, 113344, 113545, 113746, 113948, 114151, 114354, 114557, 114761, 114966, 115171, 115377, 115583, 115790, 115998, 116206, 116414, 116623, 116833, 117044, 117254, 117466, 117678, 117891, 118104, 118318, 118532, 118747, 118963, 119179, 119396, 119613, 119831, 120050, 120269, 120489, 120709, 120930, 121152, 121374, 121597, 121821, 122045, 122270, 122496, 122722, 122949, 123176, 123404, 123633, 123863, 124093, 124324, 124555, 124787, 125020, 125254, 125488, 125723, 125959, 126195, 126432, 126669, 126908, 127147, 127387, 127627, 127869, 128111, 128353, 128597, 128841, 129086, 129332, 129578, 129825, 130073, 130322, 130571, 130821, 131072, 131324, 131576, 131830, 132084, 132339, 132594, 132851, 133108, 133366, 133625, 133884, 134145, 134406, 134668, 134931, 135195, 135459, 135725, 135991, 136258, 136526, 136795, 137065, 137335, 137607, 137879, 138152, 138426, 138701, 138977, 139254, 139532, 139810, 140090, 140370, 140651, 140934, 141217, 141501, 141786, 142072, 142359, 142647, 142936, 143226, 143517, 143808, 144101, 144395, 144690, 144986, 145282, 145580, 145879, 146179, 146480, 146782, 147084, 147388, 147693, 148e3, 148307, 148615, 148924, 149235, 149546, 149859, 150172, 150487, 150803, 151120, 151438, 151757, 152077, 152399, 152722, 153045, 153370, 153697, 154024, 154352, 154682, 155013, 155345, 155678, 156013, 156349, 156686, 157024, 157363, 157704, 158046, 158389, 158734, 159079, 159427, 159775, 160125, 160476, 160828, 161182, 161537, 161893, 162251, 162610, 162970, 163332, 163695, 164060, 164426, 164793, 165162, 165532, 165904, 166277, 166651, 167027, 167405, 167784, 168164, 168546, 168930, 169315, 169701, 170089, 170479, 170870, 171263, 171657, 172053, 172451, 172850, 173251, 173653, 174057, 174463, 174870, 175279, 175690, 176102, 176516, 176932, 177349, 177769, 178190, 178612, 179037, 179463, 179891, 180321, 180753, 181186, 181622, 182059, 182498, 182939, 183382, 183827, 184274, 184722, 185173, 185625, 186080, 186536, 186995, 187455, 187918, 188382, 188849, 189318, 189789, 190261, 190736, 191213, 191693, 192174, 192658, 193143, 193631, 194122, 194614, 195109, 195606, 196105, 196606, 197110, 197616, 198125, 198636, 199149, 199664, 200182, 200703, 201226, 201751, 202279, 202809, 203342, 203878, 204416, 204956, 205500, 206045, 206594, 207145, 207699, 208255, 208815, 209376, 209941, 210509, 211079, 211652, 212228, 212807, 213389, 213973, 214561, 215151, 215745, 216341, 216941, 217544, 218149, 218758, 219370, 219985, 220603, 221225, 221849, 222477, 223108, 223743, 224381, 225022, 225666, 226314, 226966, 227621, 228279, 228941, 229606, 230275, 230948, 231624, 232304, 232988, 233676, 234367, 235062, 235761, 236463, 237170, 237881, 238595, 239314, 240036, 240763, 241493, 242228, 242967, 243711, 244458, 245210, 245966, 246727, 247492, 248261, 249035, 249813, 250596, 251384, 252176, 252973, 253774, 254581, 255392, 256208, 257029, 257855, 258686, 259522, 260363, 261209, 262060, 262917, 263779, 264646, 265519, 266397, 267280, 268169, 269064, 269965, 270871, 271782, 272700, 273624, 274553, 275489, 276430, 277378, 278332, 279292, 280258, 281231, 282210, 283195, 284188, 285186, 286192, 287204, 288223, 289249, 290282, 291322, 292369, 293423, 294485, 295554, 296630, 297714, 298805, 299904, 301011, 302126, 303248, 304379, 305517, 306664, 307819, 308983, 310154, 311335, 312524, 313721, 314928, 316143, 317368, 318601, 319844, 321097, 322358, 323629, 324910, 326201, 327502, 328812, 330133, 331464, 332805, 334157, 335519, 336892, 338276, 339671, 341078, 342495, 343924, 345364, 346816, 348280, 349756, 351244, 352744, 354257, 355783, 357321, 358872, 360436, 362013, 363604, 365208, 366826, 368459, 370105, 371765, 373440, 375130, 376835, 378555, 380290, 382040, 383807, 385589, 387387, 389202, 391034, 392882, 394747, 396630, 398530, 400448, 402384, 404338, 406311, 408303, 410314, 412344, 414395, 416465, 418555, 420666, 422798, 424951, 427125, 429321, 431540, 433781, 436045, 438332, 440643, 442978, 445337, 447720, 450129, 452564, 455024, 457511, 460024, 462565, 465133, 467730, 470355, 473009, 475692, 478406, 481150, 483925, 486732, 489571, 492443, 495348, 498287, 501261, 504269, 507313, 510394, 513512, 516667, 519861, 523094, 526366, 529680, 533034, 536431, 539870, 543354, 546881, 550455, 554074, 557741, 561456, 565221, 569035, 572901, 576818, 580789, 584815, 588896, 593033, 597229, 601483, 605798, 610174, 614613, 619117, 623686, 628323, 633028, 637803, 642651, 647572, 652568, 657640, 662792, 668024, 673338, 678737, 684223, 689797, 695462, 701219, 707072, 713023, 719074, 725227, 731486, 737853, 744331, 750922, 757631, 764460, 771411, 778490, 785699, 793041, 800521, 808143, 815910, 823827, 831898, 840127, 848520, 857081, 865817, 874730, 883829, 893117, 902602, 912289, 922186, 932298, 942633, 953199, 964003, 975054, 986361, 997931, 1009774, 1021901, 1034322, 1047046, 1060087, 1073455, 1087164, 1101225, 1115654, 1130465, 1145673, 1161294, 1177345, 1193846, 1210813, 1228269, 1246234, 1264730, 1283783, 1303416, 1323658, 1344537, 1366084, 1388330, 1411312, 1435065, 1459630, 1485049, 1511367, 1538632, 1566898, 1596220, 1626658, 1658278, 1691149, 1725348, 1760956, 1798063, 1836758, 1877161, 1919378, 1963536, 2009771, 2058233, 2109087, 2162516, 2218719, 2277919, 2340362, 2406322, 2476104, 2550052, 2628549, 2712030, 2800983, 2895966, 2997613, 3106651, 3223918, 3350381, 3487165, 3635590, 3797206, 3973855, 4167737, 4381502, 4618375, 4882318, 5178251, 5512368, 5892567, 6329090, 6835455, 7429880, 8137527, 8994149, 10052327, 11392683, 13145455, 15535599, 18988036, 24413316, 34178904, 56965752, 170910304]);
    tantoangle = new Uint32Array([0, 333772, 667544, 1001315, 1335086, 1668857, 2002626, 2336395, 2670163, 3003929, 3337694, 3671457, 4005219, 4338979, 4672736, 5006492, 5340245, 5673995, 6007743, 6341488, 6675230, 7008968, 7342704, 7676435, 8010164, 8343888, 8677609, 9011325, 9345037, 9678744, 10012447, 10346145, 10679838, 11013526, 11347209, 11680887, 12014558, 12348225, 12681885, 13015539, 13349187, 13682829, 14016464, 14350092, 14683714, 15017328, 15350936, 15684536, 16018129, 16351714, 16685291, 17018860, 17352422, 17685974, 18019518, 18353054, 18686582, 19020100, 19353610, 19687110, 20020600, 20354080, 20687552, 21021014, 21354466, 21687906, 22021338, 22354758, 22688168, 23021568, 23354956, 23688332, 24021698, 24355052, 24688396, 25021726, 25355046, 25688352, 26021648, 26354930, 26688200, 27021456, 27354702, 27687932, 28021150, 28354356, 28687548, 29020724, 29353888, 29687038, 30020174, 30353296, 30686404, 31019496, 31352574, 31685636, 32018684, 32351718, 32684734, 33017736, 33350722, 33683692, 34016648, 34349584, 34682508, 35015412, 35348300, 35681172, 36014028, 36346868, 36679688, 37012492, 37345276, 37678044, 38010792, 38343524, 38676240, 39008936, 39341612, 39674272, 40006912, 40339532, 40672132, 41004716, 41337276, 41669820, 42002344, 42334848, 42667332, 42999796, 43332236, 43664660, 43997060, 44329444, 44661800, 44994140, 45326456, 45658752, 45991028, 46323280, 46655512, 46987720, 47319908, 47652072, 47984212, 48316332, 48648428, 48980500, 49312548, 49644576, 49976580, 50308556, 50640512, 50972444, 51304352, 51636236, 51968096, 52299928, 52631740, 52963524, 53295284, 53627020, 53958728, 54290412, 54622068, 54953704, 55285308, 55616888, 55948444, 56279972, 56611472, 56942948, 57274396, 57605816, 57937212, 58268576, 58599916, 58931228, 59262512, 59593768, 59924992, 60256192, 60587364, 60918508, 61249620, 61580704, 61911760, 62242788, 62573788, 62904756, 63235692, 63566604, 63897480, 64228332, 64559148, 64889940, 65220696, 65551424, 65882120, 66212788, 66543420, 66874024, 67204600, 67535136, 67865648, 68196120, 68526568, 68856984, 69187360, 69517712, 69848024, 70178304, 70508560, 70838776, 71168960, 71499112, 71829224, 72159312, 72489360, 72819376, 73149360, 73479304, 73809216, 74139096, 74468936, 74798744, 75128520, 75458264, 75787968, 76117632, 76447264, 76776864, 77106424, 77435952, 77765440, 78094888, 78424304, 78753688, 79083032, 79412336, 79741608, 80070840, 80400032, 80729192, 81058312, 81387392, 81716432, 82045440, 82374408, 82703336, 83032224, 83361080, 83689896, 84018664, 84347400, 84676096, 85004760, 85333376, 85661952, 85990488, 86318984, 86647448, 86975864, 87304240, 87632576, 87960872, 88289128, 88617344, 88945520, 89273648, 89601736, 89929792, 90257792, 90585760, 90913688, 91241568, 91569408, 91897200, 92224960, 92552672, 92880336, 93207968, 93535552, 93863088, 94190584, 94518040, 94845448, 95172816, 95500136, 95827416, 96154648, 96481832, 96808976, 97136080, 97463136, 97790144, 98117112, 98444032, 98770904, 99097736, 99424520, 99751256, 100077944, 100404592, 100731192, 101057744, 101384248, 101710712, 102037128, 102363488, 102689808, 103016080, 103342312, 103668488, 103994616, 104320696, 104646736, 104972720, 105298656, 105624552, 105950392, 106276184, 106601928, 106927624, 107253272, 107578872, 107904416, 108229920, 108555368, 108880768, 109206120, 109531416, 109856664, 110181872, 110507016, 110832120, 111157168, 111482168, 111807112, 112132008, 112456856, 112781648, 113106392, 113431080, 113755720, 114080312, 114404848, 114729328, 115053760, 115378136, 115702464, 116026744, 116350960, 116675128, 116999248, 117323312, 117647320, 117971272, 118295176, 118619024, 118942816, 119266560, 119590248, 119913880, 120237456, 120560984, 120884456, 121207864, 121531224, 121854528, 122177784, 122500976, 122824112, 123147200, 123470224, 123793200, 124116120, 124438976, 124761784, 125084528, 125407224, 125729856, 126052432, 126374960, 126697424, 127019832, 127342184, 127664472, 127986712, 128308888, 128631008, 128953072, 129275080, 129597024, 129918912, 130240744, 130562520, 130884232, 131205888, 131527480, 131849016, 132170496, 132491912, 132813272, 133134576, 133455816, 133776992, 134098120, 134419184, 134740176, 135061120, 135382e3, 135702816, 136023584, 136344272, 136664912, 136985488, 137306016, 137626464, 137946864, 138267184, 138587456, 138907664, 139227808, 139547904, 139867920, 140187888, 140507776, 140827616, 141147392, 141467104, 141786752, 142106336, 142425856, 142745312, 143064720, 143384048, 143703312, 144022512, 144341664, 144660736, 144979744, 145298704, 145617584, 145936400, 146255168, 146573856, 146892480, 147211040, 147529536, 147847968, 148166336, 148484640, 148802880, 149121056, 149439152, 149757200, 150075168, 150393072, 150710912, 151028688, 151346400, 151664048, 151981616, 152299136, 152616576, 152933952, 153251264, 153568496, 153885680, 154202784, 154519824, 154836784, 155153696, 155470528, 155787296, 156104e3, 156420624, 156737200, 157053696, 157370112, 157686480, 158002768, 158318976, 158635136, 158951216, 159267232, 159583168, 159899040, 160214848, 160530592, 160846256, 161161840, 161477376, 161792832, 162108208, 162423520, 162738768, 163053952, 163369040, 163684080, 163999040, 164313936, 164628752, 164943504, 165258176, 165572784, 165887312, 166201776, 166516160, 166830480, 167144736, 167458912, 167773008, 168087040, 168400992, 168714880, 169028688, 169342432, 169656096, 169969696, 170283216, 170596672, 170910032, 171223344, 171536576, 171849728, 172162800, 172475808, 172788736, 173101600, 173414384, 173727104, 174039728, 174352288, 174664784, 174977200, 175289536, 175601792, 175913984, 176226096, 176538144, 176850096, 177161984, 177473792, 177785536, 178097200, 178408784, 178720288, 179031728, 179343088, 179654368, 179965568, 180276704, 180587744, 180898720, 181209616, 181520448, 181831184, 182141856, 182452448, 182762960, 183073408, 183383760, 183694048, 184004240, 184314368, 184624416, 184934400, 185244288, 185554096, 185863840, 186173504, 186483072, 186792576, 187102e3, 187411344, 187720608, 188029808, 188338912, 188647936, 188956896, 189265760, 189574560, 189883264, 190191904, 190500448, 190808928, 191117312, 191425632, 191733872, 192042016, 192350096, 192658096, 192966e3, 193273840, 193581584, 193889264, 194196848, 194504352, 194811792, 195119136, 195426400, 195733584, 196040688, 196347712, 196654656, 196961520, 197268304, 197574992, 197881616, 198188144, 198494592, 198800960, 199107248, 199413456, 199719584, 200025616, 200331584, 200637456, 200943248, 201248960, 201554576, 201860128, 202165584, 202470960, 202776256, 203081456, 203386592, 203691632, 203996592, 204301472, 204606256, 204910976, 205215600, 205520144, 205824592, 206128960, 206433248, 206737456, 207041584, 207345616, 207649568, 207953424, 208257216, 208560912, 208864512, 209168048, 209471488, 209774832, 210078112, 210381296, 210684384, 210987408, 211290336, 211593184, 211895936, 212198608, 212501184, 212803680, 213106096, 213408432, 213710672, 214012816, 214314880, 214616864, 214918768, 215220576, 215522288, 215823920, 216125472, 216426928, 216728304, 217029584, 217330784, 217631904, 217932928, 218233856, 218534704, 218835472, 219136144, 219436720, 219737216, 220037632, 220337952, 220638192, 220938336, 221238384, 221538352, 221838240, 222138032, 222437728, 222737344, 223036880, 223336304, 223635664, 223934912, 224234096, 224533168, 224832160, 225131072, 225429872, 225728608, 226027232, 226325776, 226624240, 226922608, 227220880, 227519056, 227817152, 228115168, 228413088, 228710912, 229008640, 229306288, 229603840, 229901312, 230198688, 230495968, 230793152, 231090256, 231387280, 231684192, 231981024, 232277760, 232574416, 232870960, 233167440, 233463808, 233760096, 234056288, 234352384, 234648384, 234944304, 235240128, 235535872, 235831504, 236127056, 236422512, 236717888, 237013152, 237308336, 237603424, 237898416, 238193328, 238488144, 238782864, 239077488, 239372016, 239666464, 239960816, 240255072, 240549232, 240843312, 241137280, 241431168, 241724960, 242018656, 242312256, 242605776, 242899200, 243192512, 243485744, 243778896, 244071936, 244364880, 244657744, 244950496, 245243168, 245535744, 245828224, 246120608, 246412912, 246705104, 246997216, 247289216, 247581136, 247872960, 248164688, 248456320, 248747856, 249039296, 249330640, 249621904, 249913056, 250204128, 250495088, 250785968, 251076736, 251367424, 251658016, 251948512, 252238912, 252529200, 252819408, 253109520, 253399536, 253689456, 253979280, 254269008, 254558640, 254848176, 255137632, 255426976, 255716224, 256005376, 256294432, 256583392, 256872256, 257161024, 257449696, 257738272, 258026752, 258315136, 258603424, 258891600, 259179696, 259467696, 259755600, 260043392, 260331104, 260618704, 260906224, 261193632, 261480960, 261768176, 262055296, 262342320, 262629248, 262916080, 263202816, 263489456, 263776e3, 264062432, 264348784, 264635024, 264921168, 265207216, 265493168, 265779024, 266064784, 266350448, 266636e3, 266921472, 267206832, 267492096, 267777264, 268062336, 268347312, 268632192, 268916960, 269201632, 269486208, 269770688, 270055072, 270339360, 270623552, 270907616, 271191616, 271475488, 271759296, 272042976, 272326560, 272610048, 272893440, 273176736, 273459936, 273743040, 274026048, 274308928, 274591744, 274874432, 275157024, 275439520, 275721920, 276004224, 276286432, 276568512, 276850528, 277132416, 277414240, 277695936, 277977536, 278259040, 278540448, 278821728, 279102944, 279384032, 279665056, 279945952, 280226752, 280507456, 280788064, 281068544, 281348960, 281629248, 281909472, 282189568, 282469568, 282749440, 283029248, 283308960, 283588544, 283868032, 284147424, 284426720, 284705920, 284985024, 285264e3, 285542912, 285821696, 286100384, 286378976, 286657440, 286935840, 287214112, 287492320, 287770400, 288048384, 288326240, 288604032, 288881696, 289159264, 289436768, 289714112, 289991392, 290268576, 290545632, 290822592, 291099456, 291376224, 291652896, 291929440, 292205888, 292482272, 292758528, 293034656, 293310720, 293586656, 293862496, 294138240, 294413888, 294689440, 294964864, 295240192, 295515424, 295790560, 296065600, 296340512, 296615360, 296890080, 297164704, 297439200, 297713632, 297987936, 298262144, 298536256, 298810240, 299084160, 299357952, 299631648, 299905248, 300178720, 300452128, 300725408, 300998592, 301271680, 301544640, 301817536, 302090304, 302362976, 302635520, 302908e3, 303180352, 303452608, 303724768, 303996800, 304268768, 304540608, 304812320, 305083968, 305355520, 305626944, 305898272, 306169472, 306440608, 306711616, 306982528, 307253344, 307524064, 307794656, 308065152, 308335552, 308605856, 308876032, 309146112, 309416096, 309685984, 309955744, 310225408, 310494976, 310764448, 311033824, 311303072, 311572224, 311841280, 312110208, 312379040, 312647776, 312916416, 313184960, 313453376, 313721696, 313989920, 314258016, 314526016, 314793920, 315061728, 315329408, 315597024, 315864512, 316131872, 316399168, 316666336, 316933408, 317200384, 317467232, 317733984, 318000640, 318267200, 318533632, 318799968, 319066208, 319332352, 319598368, 319864288, 320130112, 320395808, 320661408, 320926912, 321192320, 321457632, 321722816, 321987904, 322252864, 322517760, 322782528, 323047200, 323311744, 323576192, 323840544, 324104800, 324368928, 324632992, 324896928, 325160736, 325424448, 325688096, 325951584, 326215008, 326478304, 326741504, 327004608, 327267584, 327530464, 327793248, 328055904, 328318496, 328580960, 328843296, 329105568, 329367712, 329629760, 329891680, 330153536, 330415264, 330676864, 330938400, 331199808, 331461120, 331722304, 331983392, 332244384, 332505280, 332766048, 333026752, 333287296, 333547776, 333808128, 334068384, 334328544, 334588576, 334848512, 335108352, 335368064, 335627712, 335887200, 336146624, 336405920, 336665120, 336924224, 337183200, 337442112, 337700864, 337959552, 338218112, 338476576, 338734944, 338993184, 339251328, 339509376, 339767296, 340025120, 340282848, 340540480, 340797984, 341055392, 341312704, 341569888, 341826976, 342083968, 342340832, 342597600, 342854272, 343110848, 343367296, 343623648, 343879904, 344136032, 344392064, 344648e3, 344903808, 345159520, 345415136, 345670656, 345926048, 346181344, 346436512, 346691616, 346946592, 347201440, 347456224, 347710880, 347965440, 348219872, 348474208, 348728448, 348982592, 349236608, 349490528, 349744320, 349998048, 350251648, 350505152, 350758528, 351011808, 351264992, 351518048, 351771040, 352023872, 352276640, 352529280, 352781824, 353034272, 353286592, 353538816, 353790944, 354042944, 354294880, 354546656, 354798368, 355049952, 355301440, 355552800, 355804096, 356055264, 356306304, 356557280, 356808128, 357058848, 357309504, 357560032, 357810464, 358060768, 358311008, 358561088, 358811104, 359060992, 359310784, 359560480, 359810048, 360059520, 360308896, 360558144, 360807296, 361056352, 361305312, 361554144, 361802880, 362051488, 362300032, 362548448, 362796736, 363044960, 363293056, 363541024, 363788928, 364036704, 364284384, 364531936, 364779392, 365026752, 365274016, 365521152, 365768192, 366015136, 366261952, 366508672, 366755296, 367001792, 367248192, 367494496, 367740704, 367986784, 368232768, 368478656, 368724416, 368970080, 369215648, 369461088, 369706432, 369951680, 370196800, 370441824, 370686752, 370931584, 371176288, 371420896, 371665408, 371909792, 372154080, 372398272, 372642336, 372886304, 373130176, 373373952, 373617600, 373861152, 374104608, 374347936, 374591168, 374834304, 375077312, 375320224, 375563040, 375805760, 376048352, 376290848, 376533248, 376775520, 377017696, 377259776, 377501728, 377743584, 377985344, 378227008, 378468544, 378709984, 378951328, 379192544, 379433664, 379674688, 379915584, 380156416, 380397088, 380637696, 380878176, 381118560, 381358848, 381599040, 381839104, 382079072, 382318912, 382558656, 382798304, 383037856, 383277280, 383516640, 383755840, 383994976, 384233984, 384472896, 384711712, 384950400, 385188992, 385427488, 385665888, 385904160, 386142336, 386380384, 386618368, 386856224, 387093984, 387331616, 387569152, 387806592, 388043936, 388281152, 388518272, 388755296, 388992224, 389229024, 389465728, 389702336, 389938816, 390175200, 390411488, 390647680, 390883744, 391119712, 391355584, 391591328, 391826976, 392062528, 392297984, 392533312, 392768544, 393003680, 393238720, 393473632, 393708448, 393943168, 394177760, 394412256, 394646656, 394880960, 395115136, 395349216, 395583200, 395817088, 396050848, 396284512, 396518080, 396751520, 396984864, 397218112, 397451264, 397684288, 397917248, 398150080, 398382784, 398615424, 398847936, 399080320, 399312640, 399544832, 399776928, 400008928, 400240832, 400472608, 400704288, 400935872, 401167328, 401398720, 401629984, 401861120, 402092192, 402323136, 402553984, 402784736, 403015360, 403245888, 403476320, 403706656, 403936896, 404167008, 404397024, 404626944, 404856736, 405086432, 405316032, 405545536, 405774912, 406004224, 406233408, 406462464, 406691456, 406920320, 407149088, 407377760, 407606336, 407834784, 408063136, 408291392, 408519520, 408747584, 408975520, 409203360, 409431072, 409658720, 409886240, 410113664, 410340992, 410568192, 410795296, 411022304, 411249216, 411476032, 411702720, 411929312, 412155808, 412382176, 412608480, 412834656, 413060736, 413286720, 413512576, 413738336, 413964e3, 414189568, 414415040, 414640384, 414865632, 415090784, 415315840, 415540800, 415765632, 415990368, 416215008, 416439552, 416663968, 416888288, 417112512, 417336640, 417560672, 417784576, 418008384, 418232096, 418455712, 418679200, 418902624, 419125920, 419349120, 419572192, 419795200, 420018080, 420240864, 420463552, 420686144, 420908608, 421130976, 421353280, 421575424, 421797504, 422019488, 422241344, 422463104, 422684768, 422906336, 423127776, 423349120, 423570400, 423791520, 424012576, 424233536, 424454368, 424675104, 424895744, 425116288, 425336736, 425557056, 425777280, 425997408, 426217440, 426437376, 426657184, 426876928, 427096544, 427316064, 427535488, 427754784, 427974016, 428193120, 428412128, 428631040, 428849856, 429068544, 429287168, 429505664, 429724064, 429942368, 430160576, 430378656, 430596672, 430814560, 431032352, 431250048, 431467616, 431685120, 431902496, 432119808, 432336992, 432554080, 432771040, 432987936, 433204736, 433421408, 433637984, 433854464, 434070848, 434287104, 434503296, 434719360, 434935360, 435151232, 435367008, 435582656, 435798240, 436013696, 436229088, 436444352, 436659520, 436874592, 437089568, 437304416, 437519200, 437733856, 437948416, 438162880, 438377248, 438591520, 438805696, 439019744, 439233728, 439447584, 439661344, 439875008, 440088576, 440302048, 440515392, 440728672, 440941824, 441154880, 441367872, 441580736, 441793472, 442006144, 442218720, 442431168, 442643552, 442855808, 443067968, 443280032, 443492e3, 443703872, 443915648, 444127296, 444338880, 444550336, 444761696, 444972992, 445184160, 445395232, 445606176, 445817056, 446027840, 446238496, 446449088, 446659552, 446869920, 447080192, 447290400, 447500448, 447710432, 447920320, 448130112, 448339776, 448549376, 448758848, 448968224, 449177536, 449386720, 449595808, 449804800, 450013664, 450222464, 450431168, 450639776, 450848256, 451056640, 451264960, 451473152, 451681248, 451889248, 452097152, 452304960, 452512672, 452720288, 452927808, 453135232, 453342528, 453549760, 453756864, 453963904, 454170816, 454377632, 454584384, 454791008, 454997536, 455203968, 455410304, 455616544, 455822688, 456028704, 456234656, 456440512, 456646240, 456851904, 457057472, 457262912, 457468256, 457673536, 457878688, 458083744, 458288736, 458493600, 458698368, 458903040, 459107616, 459312096, 459516480, 459720768, 459924960, 460129056, 460333056, 460536960, 460740736, 460944448, 461148064, 461351584, 461554976, 461758304, 461961536, 462164640, 462367680, 462570592, 462773440, 462976160, 463178816, 463381344, 463583776, 463786144, 463988384, 464190560, 464392608, 464594560, 464796448, 464998208, 465199872, 465401472, 465602944, 465804320, 466005600, 466206816, 466407904, 466608896, 466809824, 467010624, 467211328, 467411936, 467612480, 467812896, 468013216, 468213440, 468413600, 468613632, 468813568, 469013440, 469213184, 469412832, 469612416, 469811872, 470011232, 470210528, 470409696, 470608800, 470807776, 471006688, 471205472, 471404192, 471602784, 471801312, 471999712, 472198048, 472396288, 472594400, 472792448, 472990400, 473188256, 473385984, 473583648, 473781216, 473978688, 474176064, 474373344, 474570528, 474767616, 474964608, 475161504, 475358336, 475555040, 475751648, 475948192, 476144608, 476340928, 476537184, 476733312, 476929376, 477125344, 477321184, 477516960, 477712640, 477908224, 478103712, 478299104, 478494400, 478689600, 478884704, 479079744, 479274656, 479469504, 479664224, 479858880, 480053408, 480247872, 480442240, 480636512, 480830656, 481024736, 481218752, 481412640, 481606432, 481800128, 481993760, 482187264, 482380704, 482574016, 482767264, 482960416, 483153472, 483346432, 483539296, 483732064, 483924768, 484117344, 484309856, 484502240, 484694560, 484886784, 485078912, 485270944, 485462880, 485654720, 485846464, 486038144, 486229696, 486421184, 486612576, 486803840, 486995040, 487186176, 487377184, 487568096, 487758912, 487949664, 488140320, 488330880, 488521312, 488711712, 488901984, 489092160, 489282240, 489472256, 489662176, 489851968, 490041696, 490231328, 490420896, 490610336, 490799712, 490988960, 491178144, 491367232, 491556224, 491745120, 491933920, 492122656, 492311264, 492499808, 492688256, 492876608, 493064864, 493253056, 493441120, 493629120, 493817024, 494004832, 494192544, 494380160, 494567712, 494755136, 494942496, 495129760, 495316928, 495504e3, 495691008, 495877888, 496064704, 496251424, 496438048, 496624608, 496811040, 496997408, 497183680, 497369856, 497555936, 497741920, 497927840, 498113632, 498299360, 498484992, 498670560, 498856e3, 499041376, 499226656, 499411840, 499596928, 499781920, 499966848, 500151680, 500336416, 500521056, 500705600, 500890080, 501074464, 501258752, 501442944, 501627040, 501811072, 501995008, 502178848, 502362592, 502546240, 502729824, 502913312, 503096704, 50328e4, 503463232, 503646368, 503829408, 504012352, 504195200, 504377984, 504560672, 504743264, 504925760, 505108192, 505290496, 505472736, 505654912, 505836960, 506018944, 506200832, 506382624, 506564320, 506745952, 506927488, 507108928, 507290272, 507471552, 507652736, 507833824, 508014816, 508195744, 508376576, 508557312, 508737952, 508918528, 509099008, 509279392, 509459680, 509639904, 509820032, 510000064, 51018e4, 510359872, 510539648, 510719328, 510898944, 511078432, 511257856, 511437216, 511616448, 511795616, 511974688, 512153664, 512332576, 512511392, 512690112, 512868768, 513047296, 513225792, 513404160, 513582432, 513760640, 513938784, 514116800, 514294752, 514472608, 514650368, 514828064, 515005664, 515183168, 515360608, 515537952, 515715200, 515892352, 516069440, 516246432, 516423328, 516600160, 516776896, 516953536, 517130112, 517306592, 517482976, 517659264, 517835488, 518011616, 518187680, 518363648, 518539520, 518715296, 518891008, 519066624, 519242144, 519417600, 519592960, 519768256, 519943424, 520118528, 520293568, 520468480, 520643328, 520818112, 520992800, 521167392, 521341888, 521516320, 521690656, 521864896, 522039072, 522213152, 522387168, 522561056, 522734912, 522908640, 523082304, 523255872, 523429376, 523602784, 523776096, 523949312, 524122464, 524295552, 524468512, 524641440, 524814240, 524986976, 525159616, 525332192, 525504640, 525677056, 525849344, 526021568, 526193728, 526365792, 526537760, 526709632, 526881440, 527053152, 527224800, 527396352, 527567840, 527739200, 527910528, 528081728, 528252864, 528423936, 528594880, 528765760, 528936576, 529107296, 529277920, 529448480, 529618944, 529789344, 529959648, 530129856, 5303e5, 530470048, 53064e4, 530809888, 530979712, 531149440, 531319072, 531488608, 531658080, 531827488, 531996800, 532166016, 532335168, 532504224, 532673184, 532842080, 533010912, 533179616, 533348288, 533516832, 533685312, 533853728, 534022048, 534190272, 534358432, 534526496, 534694496, 534862400, 535030240, 535197984, 535365632, 535533216, 535700704, 535868128, 536035456, 536202720, 536369888, 536536992, 536704e3, 536870912]);
  }
});

// src/r_point.ts
function SlopeDiv(num, den) {
  den = den >>> 0;
  if (den < 512) return SLOPERANGE;
  const ans = (num >>> 0 << 3) / (den >>> 8);
  const a = Math.floor(ans) >>> 0;
  return a <= SLOPERANGE ? a : SLOPERANGE;
}
function R_PointToAngle2(x1, y1, x2, y2) {
  let x = x2 - x1 | 0;
  let y = y2 - y1 | 0;
  if (x === 0 && y === 0) return 0;
  if (x >= 0) {
    if (y >= 0) {
      if (x > y) return tantoangle[SlopeDiv(y, x)] >>> 0;
      return ANG90 - 1 - tantoangle[SlopeDiv(x, y)] >>> 0;
    }
    y = -y;
    if (x > y) return -tantoangle[SlopeDiv(y, x)] >>> 0;
    return ANG270 + tantoangle[SlopeDiv(x, y)] >>> 0;
  }
  x = -x;
  if (y >= 0) {
    if (x > y) return ANG180 - 1 - tantoangle[SlopeDiv(y, x)] >>> 0;
    return ANG90 + tantoangle[SlopeDiv(x, y)] >>> 0;
  }
  y = -y;
  if (x > y) return ANG180 + tantoangle[SlopeDiv(y, x)] >>> 0;
  return ANG270 - 1 - tantoangle[SlopeDiv(x, y)] >>> 0;
}
var ANG45, ANG90, ANG180, ANG270;
var init_r_point = __esm({
  "src/r_point.ts"() {
    "use strict";
    init_tables();
    ANG45 = 536870912;
    ANG90 = 1073741824;
    ANG180 = 2147483648;
    ANG270 = 3221225472;
  }
});

// src/p_tick.ts
function P_InitThinkers() {
  thinkers = [];
  running = false;
}
function P_AddThinker(t) {
  thinkers.push(t);
}
function P_RemoveThinker(t) {
  t.removed = true;
}
var thinkers, running;
var init_p_tick = __esm({
  "src/p_tick.ts"() {
    "use strict";
    thinkers = [];
    running = false;
  }
});

// src/p_local.ts
var MAXRADIUS, ONFLOORZ, ONCEILINGZ, VIEWHEIGHT;
var init_p_local = __esm({
  "src/p_local.ts"() {
    "use strict";
    init_m_fixed();
    init_info();
    MAXRADIUS = 32 * FRACUNIT;
    ONFLOORZ = -2147483648;
    ONCEILINGZ = 2147483647;
    VIEWHEIGHT = 41 * FRACUNIT;
  }
});

// src/map.ts
function name8(bytes, off) {
  let s = "";
  for (let i = 0; i < 8; i++) {
    const c = bytes[off + i];
    if (c === 0) break;
    s += String.fromCharCode(c);
  }
  return s.toUpperCase();
}
function dv(lump) {
  return new DataView(lump.buffer, lump.byteOffset, lump.byteLength);
}
function loadMap(wad2, name) {
  const label = wad2.getNumForName(name);
  const vertexes = [];
  {
    const l = wad2.lumpNum(label + ML_VERTEXES), v = dv(l);
    for (let i = 0; i + 4 <= l.length; i += 4) {
      vertexes.push({ x: v.getInt16(i, true), y: v.getInt16(i + 2, true) });
    }
  }
  const sectors = [];
  {
    const l = wad2.lumpNum(label + ML_SECTORS), v = dv(l);
    for (let i = 0; i + 26 <= l.length; i += 26) {
      sectors.push({
        floorHeight: v.getInt16(i, true),
        ceilingHeight: v.getInt16(i + 2, true),
        floorPic: name8(l, i + 4),
        ceilingPic: name8(l, i + 12),
        lightLevel: v.getInt16(i + 20, true),
        special: v.getInt16(i + 22, true),
        tag: v.getInt16(i + 24, true),
        lines: []
      });
    }
  }
  const sideDefs = [];
  {
    const l = wad2.lumpNum(label + ML_SIDEDEFS), v = dv(l);
    for (let i = 0; i + 30 <= l.length; i += 30) {
      sideDefs.push({
        textureOffset: v.getInt16(i, true),
        rowOffset: v.getInt16(i + 2, true),
        topTexture: name8(l, i + 4),
        bottomTexture: name8(l, i + 12),
        midTexture: name8(l, i + 20),
        sector: v.getInt16(i + 28, true)
      });
    }
  }
  const lineDefs = [];
  {
    const l = wad2.lumpNum(label + ML_LINEDEFS), v = dv(l);
    for (let i = 0; i + 14 <= l.length; i += 14) {
      lineDefs.push({
        v1: v.getUint16(i, true),
        v2: v.getUint16(i + 2, true),
        flags: v.getInt16(i + 4, true),
        special: v.getInt16(i + 6, true),
        tag: v.getInt16(i + 8, true),
        // -1 (0xffff) means no back side. getInt16 gives us that directly.
        sideNum: [v.getInt16(i + 10, true), v.getInt16(i + 12, true)]
      });
    }
  }
  const segs = [];
  {
    const l = wad2.lumpNum(label + ML_SEGS), v = dv(l);
    for (let i = 0; i + 12 <= l.length; i += 12) {
      segs.push({
        v1: v.getUint16(i, true),
        v2: v.getUint16(i + 2, true),
        angle: v.getInt16(i + 4, true),
        lineDef: v.getUint16(i + 6, true),
        side: v.getInt16(i + 8, true),
        offset: v.getInt16(i + 10, true)
      });
    }
  }
  const subSectors = [];
  {
    const l = wad2.lumpNum(label + ML_SSECTORS), v = dv(l);
    for (let i = 0; i + 4 <= l.length; i += 4) {
      subSectors.push({ numSegs: v.getUint16(i, true), firstSeg: v.getUint16(i + 2, true) });
    }
  }
  const nodes = [];
  {
    const l = wad2.lumpNum(label + ML_NODES), v = dv(l);
    for (let i = 0; i + 28 <= l.length; i += 28) {
      const bb = (c) => [
        v.getInt16(i + 8 + c * 8, true),
        v.getInt16(i + 10 + c * 8, true),
        v.getInt16(i + 12 + c * 8, true),
        v.getInt16(i + 14 + c * 8, true)
      ];
      nodes.push({
        x: v.getInt16(i, true),
        y: v.getInt16(i + 2, true),
        dx: v.getInt16(i + 4, true),
        dy: v.getInt16(i + 6, true),
        bbox: [bb(0), bb(1)],
        children: [v.getUint16(i + 24, true), v.getUint16(i + 26, true)]
      });
    }
  }
  const bmLump = wad2.lumpNum(label + ML_BLOCKMAP);
  const bmShorts = new Int16Array(bmLump.length >> 1);
  {
    const v = dv(bmLump);
    for (let i = 0; i < bmShorts.length; i++) bmShorts[i] = v.getInt16(i * 2, true);
  }
  const blockMap = {
    originX: bmShorts[0],
    originY: bmShorts[1],
    width: bmShorts[2],
    height: bmShorts[3],
    data: bmShorts
  };
  const rjLump = wad2.lumpNum(label + ML_REJECT);
  const needed = Math.ceil(sectors.length * sectors.length / 8);
  const reject = rjLump.length >= needed ? rjLump : new Uint8Array(needed);
  for (let i = 0; i < lineDefs.length; i++) {
    const ld = lineDefs[i];
    const front = ld.sideNum[0] >= 0 ? sideDefs[ld.sideNum[0]] : void 0;
    const back = ld.sideNum[1] >= 0 ? sideDefs[ld.sideNum[1]] : void 0;
    if (front && sectors[front.sector]) sectors[front.sector].lines.push(i);
    if (back && sectors[back.sector] && back.sector !== front?.sector) {
      sectors[back.sector].lines.push(i);
    }
  }
  return { name, vertexes, sectors, sideDefs, lineDefs, segs, subSectors, nodes, blockMap, reject };
}
function blockLines(map2, bx, by) {
  const bm = map2.blockMap;
  if (bx < 0 || by < 0 || bx >= bm.width || by >= bm.height) return [];
  let p = bm.data[4 + by * bm.width + bx];
  const out2 = [];
  p++;
  for (; p < bm.data.length && bm.data[p] !== -1; p++) out2.push(bm.data[p]);
  return out2;
}
var ML_LINEDEFS, ML_SIDEDEFS, ML_VERTEXES, ML_SEGS, ML_SSECTORS, ML_NODES, ML_SECTORS, ML_REJECT, ML_BLOCKMAP, MAPBLOCKUNITS, MAPBLOCKSIZE, MAPBLOCKSHIFT, MAPBTOFRAC;
var init_map = __esm({
  "src/map.ts"() {
    "use strict";
    ML_LINEDEFS = 2;
    ML_SIDEDEFS = 3;
    ML_VERTEXES = 4;
    ML_SEGS = 5;
    ML_SSECTORS = 6;
    ML_NODES = 7;
    ML_SECTORS = 8;
    ML_REJECT = 9;
    ML_BLOCKMAP = 10;
    MAPBLOCKUNITS = 128;
    MAPBLOCKSIZE = MAPBLOCKUNITS * 65536;
    MAPBLOCKSHIFT = 16 + 7;
    MAPBTOFRAC = MAPBLOCKSHIFT - 16;
  }
});

// src/p_blockmap.ts
function P_InitBlockLinks(map2, env8) {
  const bm = map2.blockMap;
  bmWidth = bm.width;
  bmHeight = bm.height;
  bmOrgX = bm.originX << 16;
  bmOrgY = bm.originY << 16;
  blockLinks = new Array(bmWidth * bmHeight).fill(null);
  sectorAt = env8.sectorAt;
  subSectorAt = env8.subSectorAt;
}
function P_UnsetThingPosition(thing) {
  if (!(thing.flags & MF.MF_NOSECTOR)) {
    if (thing.snext) thing.snext.sprev = thing.sprev;
    if (thing.sprev) thing.sprev.snext = thing.snext;
    else if (thing.sector) thing.sector.thingList = thing.snext;
    thing.snext = thing.sprev = null;
    thing.sector = null;
  }
  if (!(thing.flags & MF.MF_NOBLOCKMAP)) {
    if (thing.bnext) thing.bnext.bprev = thing.bprev;
    if (thing.bprev) thing.bprev.bnext = thing.bnext;
    else if (thing.blockIndex >= 0) blockLinks[thing.blockIndex] = thing.bnext;
    thing.bnext = thing.bprev = null;
    thing.blockIndex = -1;
  }
}
function P_SetThingPosition(thing) {
  thing.subSector = subSectorAt(thing.x, thing.y);
  if (!(thing.flags & MF.MF_NOSECTOR)) {
    const sec = sectorAt(thing.x, thing.y);
    thing.sector = sec;
    thing.sprev = null;
    thing.snext = sec.thingList;
    if (sec.thingList) sec.thingList.sprev = thing;
    sec.thingList = thing;
  }
  if (!(thing.flags & MF.MF_NOBLOCKMAP)) {
    const bx = thing.x - bmOrgX >> MAPBLOCKSHIFT;
    const by = thing.y - bmOrgY >> MAPBLOCKSHIFT;
    if (bx >= 0 && bx < bmWidth && by >= 0 && by < bmHeight) {
      const idx = by * bmWidth + bx;
      const head = blockLinks[idx];
      thing.bprev = null;
      thing.bnext = head;
      if (head) head.bprev = thing;
      blockLinks[idx] = thing;
      thing.blockIndex = idx;
    } else {
      thing.bnext = thing.bprev = null;
      thing.blockIndex = -1;
    }
  }
}
function P_BlockThingsIterator(x, y, func) {
  if (x < 0 || y < 0 || x >= bmWidth || y >= bmHeight) return true;
  let mobj = blockLinks[y * bmWidth + x];
  while (mobj) {
    const next = mobj.bnext;
    if (!func(mobj)) return false;
    mobj = next;
  }
  return true;
}
var blockLinks, bmWidth, bmHeight, bmOrgX, bmOrgY, sectorAt, subSectorAt;
var init_p_blockmap = __esm({
  "src/p_blockmap.ts"() {
    "use strict";
    init_map();
    init_info();
    blockLinks = [];
    bmWidth = 0;
    bmHeight = 0;
    bmOrgX = 0;
    bmOrgY = 0;
  }
});

// src/p_maputl.ts
function P_AproxDistance(dx, dy) {
  dx = Math.abs(dx) | 0;
  dy = Math.abs(dy) | 0;
  if (dx < dy) return dx + dy - (dx >> 1) | 0;
  return dx + dy - (dy >> 1) | 0;
}
function P_PointOnLineSide(x, y, line) {
  if (line.dx === 0) {
    if (x <= line.v1x) return line.dy > 0 ? 1 : 0;
    return line.dy < 0 ? 1 : 0;
  }
  if (line.dy === 0) {
    if (y <= line.v1y) return line.dx < 0 ? 1 : 0;
    return line.dx > 0 ? 1 : 0;
  }
  const dx = x - line.v1x | 0;
  const dy = y - line.v1y | 0;
  const left = FixedMul(line.dy >> FRACBITS, dx);
  const right = FixedMul(dy, line.dx >> FRACBITS);
  return right < left ? 0 : 1;
}
function P_MakeDivline(line) {
  return { x: line.v1x, y: line.v1y, dx: line.dx, dy: line.dy };
}
function P_PointOnDivlineSide(x, y, line) {
  if (line.dx === 0) {
    if (x <= line.x) return line.dy > 0 ? 1 : 0;
    return line.dy < 0 ? 1 : 0;
  }
  if (line.dy === 0) {
    if (y <= line.y) return line.dx < 0 ? 1 : 0;
    return line.dx > 0 ? 1 : 0;
  }
  const dx = x - line.x | 0;
  const dy = y - line.y | 0;
  if ((line.dy ^ line.dx ^ dx ^ dy) & 2147483648) {
    if ((line.dy ^ dx) & 2147483648) return 1;
    return 0;
  }
  const left = FixedMul(line.dy >> 8, dx >> 8);
  const right = FixedMul(dy >> 8, line.dx >> 8);
  return right < left ? 0 : 1;
}
function slopeTypeOf(dx, dy) {
  if (dx === 0) return 1 /* Vertical */;
  if (dy === 0) return 0 /* Horizontal */;
  return (dy ^ dx) < 0 ? 3 /* Negative */ : 2 /* Positive */;
}
function P_LineOpening(line) {
  if (line.sideNum[1] === -1 || !line.frontSector || !line.backSector) {
    return { top: 0, bottom: 0, range: 0, lowFloor: 0 };
  }
  const front = line.frontSector;
  const back = line.backSector;
  const top = front.ceilingHeight < back.ceilingHeight ? front.ceilingHeight : back.ceilingHeight;
  let bottom;
  let lowFloor;
  if (front.floorHeight > back.floorHeight) {
    bottom = front.floorHeight;
    lowFloor = back.floorHeight;
  } else {
    bottom = back.floorHeight;
    lowFloor = front.floorHeight;
  }
  return { top, bottom, range: top - bottom | 0, lowFloor };
}
function P_BoxOnLineSide(box, line) {
  let p1;
  let p2;
  switch (line.slopeType) {
    case 0 /* Horizontal */:
      p1 = box[BOXTOP] > line.v1y ? 1 : 0;
      p2 = box[BOXBOTTOM] > line.v1y ? 1 : 0;
      if (line.dx < 0) {
        p1 ^= 1;
        p2 ^= 1;
      }
      break;
    case 1 /* Vertical */:
      p1 = box[BOXRIGHT] < line.v1x ? 1 : 0;
      p2 = box[BOXLEFT] < line.v1x ? 1 : 0;
      if (line.dy < 0) {
        p1 ^= 1;
        p2 ^= 1;
      }
      break;
    case 2 /* Positive */:
      p1 = P_PointOnLineSide(box[BOXLEFT], box[BOXTOP], line);
      p2 = P_PointOnLineSide(box[BOXRIGHT], box[BOXBOTTOM], line);
      break;
    case 3 /* Negative */:
      p1 = P_PointOnLineSide(box[BOXRIGHT], box[BOXTOP], line);
      p2 = P_PointOnLineSide(box[BOXLEFT], box[BOXBOTTOM], line);
      break;
    default:
      return -1;
  }
  return p1 === p2 ? p1 : -1;
}
function P_SetTraceLevel(l) {
  traceLevel = l;
  traceMap = l.source;
  traceValidCount = 0;
}
function P_InterceptVector(v2, v1) {
  const den = FixedMul(v1.dy >> 8, v2.dx) - FixedMul(v1.dx >> 8, v2.dy) | 0;
  if (den === 0) return 0;
  const num = FixedMul(v1.x - v2.x >> 8, v1.dy) + FixedMul(v2.y - v1.y >> 8, v1.dx) | 0;
  return FixedDiv(num, den);
}
function PIT_AddLineIntercepts(ld) {
  let s1;
  let s2;
  if (trace.dx > FRACUNIT * 16 || trace.dy > FRACUNIT * 16 || trace.dx < -FRACUNIT * 16 || trace.dy < -FRACUNIT * 16) {
    s1 = P_PointOnDivlineSide(ld.v1x, ld.v1y, trace);
    s2 = P_PointOnDivlineSide(ld.v2x, ld.v2y, trace);
  } else {
    s1 = P_PointOnLineSide(trace.x, trace.y, ld);
    s2 = P_PointOnLineSide(trace.x + trace.dx | 0, trace.y + trace.dy | 0, ld);
  }
  if (s1 === s2) return true;
  const dl = P_MakeDivline(ld);
  const frac = P_InterceptVector(trace, dl);
  if (frac < 0) return true;
  if (earlyOut && frac < FRACUNIT && !ld.backSector) return false;
  if (interceptCount < MAXINTERCEPTS) {
    const ic = intercepts[interceptCount++];
    ic.frac = frac;
    ic.isALine = true;
    ic.line = ld;
    ic.thing = null;
  }
  return true;
}
function PIT_AddThingIntercepts(thing) {
  const tracePositive = (trace.dx ^ trace.dy) > 0;
  let x1, y1, x2, y2;
  if (tracePositive) {
    x1 = thing.x - thing.radius | 0;
    y1 = thing.y + thing.radius | 0;
    x2 = thing.x + thing.radius | 0;
    y2 = thing.y - thing.radius | 0;
  } else {
    x1 = thing.x - thing.radius | 0;
    y1 = thing.y - thing.radius | 0;
    x2 = thing.x + thing.radius | 0;
    y2 = thing.y + thing.radius | 0;
  }
  const s1 = P_PointOnDivlineSide(x1, y1, trace);
  const s2 = P_PointOnDivlineSide(x2, y2, trace);
  if (s1 === s2) return true;
  const dl = { x: x1, y: y1, dx: x2 - x1 | 0, dy: y2 - y1 | 0 };
  const frac = P_InterceptVector(trace, dl);
  if (frac < 0) return true;
  if (interceptCount < MAXINTERCEPTS) {
    const ic = intercepts[interceptCount++];
    ic.frac = frac;
    ic.isALine = false;
    ic.line = null;
    ic.thing = thing;
  }
  return true;
}
function P_TraverseIntercepts(func, maxFrac) {
  let count = interceptCount;
  while (count-- > 0) {
    let dist = MAXINT;
    let inIdx = -1;
    for (let i = 0; i < interceptCount; i++) {
      if (intercepts[i].frac < dist) {
        dist = intercepts[i].frac;
        inIdx = i;
      }
    }
    if (dist > maxFrac) return true;
    if (inIdx < 0) return true;
    if (!func(intercepts[inIdx])) return false;
    intercepts[inIdx].frac = MAXINT;
  }
  return true;
}
function traceBlockLines(bx, by, fn) {
  for (const li of blockLines(traceMap, bx, by)) {
    const ld = traceLevel.lines[li];
    if (!ld) continue;
    if (ld.validCount === traceValidCount) continue;
    ld.validCount = traceValidCount;
    if (!fn(ld)) return false;
  }
  return true;
}
function P_PathTraverse(x1, y1, x2, y2, flags, trav) {
  earlyOut = (flags & PT_EARLYOUT) !== 0;
  traceValidCount++;
  interceptCount = 0;
  const bm = traceMap.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;
  if ((x1 - orgX & MAPBLOCKSIZE - 1) === 0) x1 = x1 + FRACUNIT | 0;
  if ((y1 - orgY & MAPBLOCKSIZE - 1) === 0) y1 = y1 + FRACUNIT | 0;
  trace.x = x1;
  trace.y = y1;
  trace.dx = x2 - x1 | 0;
  trace.dy = y2 - y1 | 0;
  x1 = x1 - orgX | 0;
  y1 = y1 - orgY | 0;
  const xt1 = x1 >> MAPBLOCKSHIFT;
  const yt1 = y1 >> MAPBLOCKSHIFT;
  x2 = x2 - orgX | 0;
  y2 = y2 - orgY | 0;
  const xt2 = x2 >> MAPBLOCKSHIFT;
  const yt2 = y2 >> MAPBLOCKSHIFT;
  let mapXStep;
  let mapYStep;
  let partial;
  let xStep;
  let yStep;
  if (xt2 > xt1) {
    mapXStep = 1;
    partial = FRACUNIT - (x1 >> MAPBTOFRAC & FRACUNIT - 1);
    yStep = FixedDiv(y2 - y1 | 0, Math.abs(x2 - x1) | 0);
  } else if (xt2 < xt1) {
    mapXStep = -1;
    partial = x1 >> MAPBTOFRAC & FRACUNIT - 1;
    yStep = FixedDiv(y2 - y1 | 0, Math.abs(x2 - x1) | 0);
  } else {
    mapXStep = 0;
    partial = FRACUNIT;
    yStep = 256 * FRACUNIT;
  }
  let yIntercept = (y1 >> MAPBTOFRAC) + FixedMul(partial, yStep) | 0;
  if (yt2 > yt1) {
    mapYStep = 1;
    partial = FRACUNIT - (y1 >> MAPBTOFRAC & FRACUNIT - 1);
    xStep = FixedDiv(x2 - x1 | 0, Math.abs(y2 - y1) | 0);
  } else if (yt2 < yt1) {
    mapYStep = -1;
    partial = y1 >> MAPBTOFRAC & FRACUNIT - 1;
    xStep = FixedDiv(x2 - x1 | 0, Math.abs(y2 - y1) | 0);
  } else {
    mapYStep = 0;
    partial = FRACUNIT;
    xStep = 256 * FRACUNIT;
  }
  let xIntercept = (x1 >> MAPBTOFRAC) + FixedMul(partial, xStep) | 0;
  let mapX = xt1;
  let mapY = yt1;
  for (let count = 0; count < 64; count++) {
    if (flags & PT_ADDLINES) {
      if (!traceBlockLines(mapX, mapY, PIT_AddLineIntercepts)) return false;
    }
    if (flags & PT_ADDTHINGS) {
      if (!P_BlockThingsIterator(mapX, mapY, PIT_AddThingIntercepts)) return false;
    }
    if (mapX === xt2 && mapY === yt2) break;
    if (yIntercept >> FRACBITS === mapY) {
      yIntercept = yIntercept + yStep | 0;
      mapX += mapXStep;
    } else if (xIntercept >> FRACBITS === mapX) {
      xIntercept = xIntercept + xStep | 0;
      mapY += mapYStep;
    }
  }
  return P_TraverseIntercepts(trav, FRACUNIT);
}
var BOXTOP, BOXBOTTOM, BOXLEFT, BOXRIGHT, PT_ADDLINES, PT_ADDTHINGS, PT_EARLYOUT, MAXINTERCEPTS, intercepts, interceptCount, trace, earlyOut, traceLevel, traceMap, traceValidCount;
var init_p_maputl = __esm({
  "src/p_maputl.ts"() {
    "use strict";
    init_m_fixed();
    init_p_local();
    init_map();
    init_p_blockmap();
    BOXTOP = 0;
    BOXBOTTOM = 1;
    BOXLEFT = 2;
    BOXRIGHT = 3;
    PT_ADDLINES = 1;
    PT_ADDTHINGS = 2;
    PT_EARLYOUT = 4;
    MAXINTERCEPTS = 128;
    intercepts = Array.from({ length: MAXINTERCEPTS }, () => ({
      frac: 0,
      isALine: false,
      line: null,
      thing: null
    }));
    interceptCount = 0;
    trace = { x: 0, y: 0, dx: 0, dy: 0 };
    earlyOut = false;
    traceValidCount = 0;
  }
});

// src/p_action.ts
function P_RegisterActions(table) {
  for (const [name, fn] of Object.entries(table)) actions.set(name, fn);
}
function P_CallAction(name, mo) {
  const fn = actions.get(name);
  if (!fn) {
    if (!reportedMissing.has(name)) {
      reportedMissing.add(name);
      console.warn(`action ${name}() not implemented \u2014 state will animate but do nothing`);
    }
    return false;
  }
  fn(mo);
  return true;
}
var actions, reportedMissing;
var init_p_action = __esm({
  "src/p_action.ts"() {
    "use strict";
    init_info();
    actions = /* @__PURE__ */ new Map();
    reportedMissing = /* @__PURE__ */ new Set();
  }
});

// src/p_sight.ts
function P_SetSightLevel(l) {
  level = l;
}
function P_DivlineSide(x, y, node) {
  if (node.dx === 0) {
    if (x === node.x) return 2;
    if (x <= node.x) return node.dy > 0 ? 1 : 0;
    return node.dy < 0 ? 1 : 0;
  }
  if (node.dy === 0) {
    if (x === node.y) return 2;
    if (y <= node.y) return node.dx < 0 ? 1 : 0;
    return node.dx > 0 ? 1 : 0;
  }
  const dx = x - node.x | 0;
  const dy = y - node.y | 0;
  const left = Math.imul(node.dy >> FRACBITS, dx >> FRACBITS);
  const right = Math.imul(dy >> FRACBITS, node.dx >> FRACBITS);
  if (right < left) return 0;
  if (left === right) return 2;
  return 1;
}
function P_InterceptVector2(v2, v1) {
  const den = FixedMul(v1.dy >> 8, v2.dx) - FixedMul(v1.dx >> 8, v2.dy) | 0;
  if (den === 0) return 0;
  const num = FixedMul(v1.x - v2.x >> 8, v1.dy) + FixedMul(v2.y - v1.y >> 8, v1.dx) | 0;
  return FixedDiv(num, den);
}
function P_CrossSubsector(num) {
  const map2 = level.source;
  const sub = map2.subSectors[num];
  if (!sub) return true;
  for (let i = 0; i < sub.numSegs; i++) {
    const seg = map2.segs[sub.firstSeg + i];
    if (!seg) continue;
    const line = level.lines[seg.lineDef];
    if (!line) continue;
    if (line.validCount === sightValidCount) continue;
    line.validCount = sightValidCount;
    let s1 = P_DivlineSide(line.v1x, line.v1y, strace);
    let s2 = P_DivlineSide(line.v2x, line.v2y, strace);
    if (s1 === s2) continue;
    const divl = { x: line.v1x, y: line.v1y, dx: line.dx, dy: line.dy };
    s1 = P_DivlineSide(strace.x, strace.y, divl);
    s2 = P_DivlineSide(t2x, t2y, divl);
    if (s1 === s2) continue;
    if (!(line.flags & ML_TWOSIDED)) return false;
    const front = line.frontSector;
    const back = line.backSector;
    if (!front || !back) return false;
    if (front.floorHeight === back.floorHeight && front.ceilingHeight === back.ceilingHeight) continue;
    const openTop = front.ceilingHeight < back.ceilingHeight ? front.ceilingHeight : back.ceilingHeight;
    const openBottom = front.floorHeight > back.floorHeight ? front.floorHeight : back.floorHeight;
    if (openBottom >= openTop) return false;
    const frac = P_InterceptVector2(strace, divl);
    if (front.floorHeight !== back.floorHeight) {
      const slope = FixedDiv(openBottom - sightZStart | 0, frac);
      if (slope > bottomSlope) bottomSlope = slope;
    }
    if (front.ceilingHeight !== back.ceilingHeight) {
      const slope = FixedDiv(openTop - sightZStart | 0, frac);
      if (slope < topSlope) topSlope = slope;
    }
    if (topSlope <= bottomSlope) return false;
  }
  return true;
}
function P_CrossBSPNode(bspnum) {
  if (bspnum & NF_SUBSECTOR) {
    if (bspnum === -1) return P_CrossSubsector(0);
    return P_CrossSubsector(bspnum & ~NF_SUBSECTOR);
  }
  const bsp = level.nodes[bspnum];
  if (!bsp) return true;
  let side = P_DivlineSide(strace.x, strace.y, bsp);
  if (side === 2) side = 0;
  if (!P_CrossBSPNode(bsp.children[side])) return false;
  if (side === P_DivlineSide(t2x, t2y, bsp)) return true;
  return P_CrossBSPNode(bsp.children[side ^ 1]);
}
function P_CheckSight(t1, t2) {
  const map2 = level.source;
  const s1 = sectorNumOf(t1);
  const s2 = sectorNumOf(t2);
  const pnum = s1 * level.sectors.length + s2;
  const byteNum = pnum >> 3;
  const bitNum = 1 << (pnum & 7);
  if (map2.reject.length > byteNum && map2.reject[byteNum] & bitNum) return false;
  sightValidCount++;
  sightZStart = t1.z + t1.height - (t1.height >> 2) | 0;
  topSlope = t2.z + t2.height - sightZStart | 0;
  bottomSlope = t2.z - sightZStart | 0;
  strace.x = t1.x;
  strace.y = t1.y;
  t2x = t2.x;
  t2y = t2.y;
  strace.dx = t2.x - t1.x | 0;
  strace.dy = t2.y - t1.y | 0;
  return P_CrossBSPNode(level.nodes.length - 1);
}
function sectorNumOf(mo) {
  return mo.sector ? mo.sector.index : 0;
}
var NF_SUBSECTOR, ML_TWOSIDED, level, strace, t2x, t2y, sightZStart, topSlope, bottomSlope, sightValidCount;
var init_p_sight = __esm({
  "src/p_sight.ts"() {
    "use strict";
    init_m_fixed();
    NF_SUBSECTOR = 32768;
    ML_TWOSIDED = 4;
    strace = { x: 0, y: 0, dx: 0, dy: 0 };
    t2x = 0;
    t2y = 0;
    sightZStart = 0;
    topSlope = 0;
    bottomSlope = 0;
    sightValidCount = 0;
  }
});

// src/p_enemy.ts
function P_SetEnemyEnv(e) {
  env = e;
}
function P_LookForPlayers(actor, allAround) {
  let c = 0;
  const stop = actor.lastLook - 1 & 3;
  const players = env.players();
  for (; ; actor.lastLook = actor.lastLook + 1 & 3) {
    if (!players[actor.lastLook]) continue;
    if (c++ === 2 || actor.lastLook === stop) return false;
    const player = players[actor.lastLook];
    if (player.health <= 0) continue;
    if (!player.mo) continue;
    if (!P_CheckSight(actor, player.mo)) continue;
    if (!allAround) {
      const an = R_PointToAngle2(actor.x, actor.y, player.mo.x, player.mo.y) - actor.angle >>> 0;
      if (an > ANG90 && an < ANG270) {
        const dist = P_AproxDistance(player.mo.x - actor.x, player.mo.y - actor.y);
        if (dist > MELEERANGE) continue;
      }
    }
    actor.target = player.mo;
    return true;
  }
}
function P_RecursiveSound(sec, soundblocks) {
  if (sec.validCount === soundValidCount && sec.soundTraversed <= soundblocks + 1) {
    return;
  }
  sec.validCount = soundValidCount;
  sec.soundTraversed = soundblocks + 1;
  sec.soundTarget = soundTargetRef;
  const lines = env.lines();
  for (const li of sec.lineIndices) {
    const check = lines[li];
    if (!(check.flags & ML_TWOSIDED2)) continue;
    if (P_LineOpening(check).range <= 0) continue;
    const other = check.frontSector === sec ? check.backSector : check.frontSector;
    if (!other) continue;
    if (check.flags & ML_SOUNDBLOCK) {
      if (!soundblocks) P_RecursiveSound(other, 1);
    } else {
      P_RecursiveSound(other, soundblocks);
    }
  }
}
function P_NoiseAlert(target, emitter) {
  soundTargetRef = target;
  soundValidCount++;
  if (emitter.sector) P_RecursiveSound(emitter.sector, 0);
}
function A_Look(actor) {
  actor.threshold = 0;
  const targ = actor.sector?.soundTarget ?? null;
  let seeYou = false;
  if (targ && targ.flags & MF.MF_SHOOTABLE) {
    actor.target = targ;
    seeYou = actor.flags & MF.MF_AMBUSH ? P_CheckSight(actor, targ) : true;
  }
  if (!seeYou && !P_LookForPlayers(actor, false)) return;
  switch (mobjInfo[actor.type].seeSound) {
    case "sfx_posit1":
    case "sfx_posit2":
    case "sfx_posit3":
      P_Random() % 3;
      break;
    case "sfx_bgsit1":
    case "sfx_bgsit2":
      P_Random() % 2;
      break;
    default:
      break;
  }
  wakeHook?.(actor);
  P_SetMobjState(actor, mobjInfo[actor.type].seeState);
}
function P_CheckMeleeRange(actor) {
  if (!actor.target) return false;
  const pl = actor.target;
  const dist = P_AproxDistance(pl.x - actor.x, pl.y - actor.y);
  if (dist >= MELEERANGE - 20 * FRACUNIT + pl.radius) return false;
  return P_CheckSight(actor, pl);
}
function P_CheckMissileRange(actor) {
  if (!actor.target) return false;
  if (!P_CheckSight(actor, actor.target)) return false;
  if (actor.flags & MF.MF_JUSTHIT) {
    actor.flags &= ~MF.MF_JUSTHIT;
    return true;
  }
  if (actor.reactionTime) return false;
  let dist = P_AproxDistance(actor.x - actor.target.x, actor.y - actor.target.y) - 64 * FRACUNIT | 0;
  if (mobjInfo[actor.type].meleeState === 0) dist -= 128 * FRACUNIT;
  dist >>= 16;
  if (dist > 200) dist = 200;
  return P_Random() >= dist;
}
function P_Move(actor) {
  if (actor.moveDir === DI_NODIR) return false;
  if (actor.moveDir >= 8) throw new Error("bad moveDir");
  const speed = mobjInfo[actor.type].speed;
  const tryX = actor.x + speed * xspeed[actor.moveDir] | 0;
  const tryY = actor.y + speed * yspeed[actor.moveDir] | 0;
  if (!env.tryMove(actor, tryX, tryY)) {
    const hits = env.takeSpecHits();
    if (hits.length === 0) return false;
    actor.moveDir = DI_NODIR;
    let good = false;
    for (let i = hits.length - 1; i >= 0; i--) {
      if (env.useSpecialLine(actor, hits[i].lineIndex, 0)) good = true;
    }
    return good;
  }
  actor.flags &= ~MF.MF_INFLOAT;
  if (!(actor.flags & MF.MF_FLOAT)) actor.z = actor.floorZ;
  return true;
}
function P_TryWalk(actor) {
  if (!P_Move(actor)) return false;
  actor.moveCount = P_Random() & 15;
  return true;
}
function P_NewChaseDir(actor) {
  if (!actor.target) return;
  const olddir = actor.moveDir;
  const turnaround = opposite[olddir];
  const deltax = actor.target.x - actor.x | 0;
  const deltay = actor.target.y - actor.y | 0;
  const d = [0, 0, 0];
  if (deltax > 10 * FRACUNIT) d[1] = DI_EAST;
  else if (deltax < -10 * FRACUNIT) d[1] = DI_WEST;
  else d[1] = DI_NODIR;
  if (deltay < -10 * FRACUNIT) d[2] = DI_SOUTH;
  else if (deltay > 10 * FRACUNIT) d[2] = DI_NORTH;
  else d[2] = DI_NODIR;
  if (d[1] !== DI_NODIR && d[2] !== DI_NODIR) {
    actor.moveDir = diags[((deltay < 0 ? 1 : 0) << 1) + (deltax > 0 ? 1 : 0)];
    if (actor.moveDir !== turnaround && P_TryWalk(actor)) return;
  }
  if (P_Random() > 200 || Math.abs(deltay) > Math.abs(deltax)) {
    const tdir = d[1];
    d[1] = d[2];
    d[2] = tdir;
  }
  if (d[1] === turnaround) d[1] = DI_NODIR;
  if (d[2] === turnaround) d[2] = DI_NODIR;
  if (d[1] !== DI_NODIR) {
    actor.moveDir = d[1];
    if (P_TryWalk(actor)) return;
  }
  if (d[2] !== DI_NODIR) {
    actor.moveDir = d[2];
    if (P_TryWalk(actor)) return;
  }
  if (olddir !== DI_NODIR) {
    actor.moveDir = olddir;
    if (P_TryWalk(actor)) return;
  }
  if (P_Random() & 1) {
    for (let tdir = DI_EAST; tdir <= DI_SOUTHEAST; tdir++) {
      if (tdir === turnaround) continue;
      actor.moveDir = tdir;
      if (P_TryWalk(actor)) return;
    }
  } else {
    for (let tdir = DI_SOUTHEAST; tdir !== DI_EAST - 1; tdir--) {
      if (tdir === turnaround) continue;
      actor.moveDir = tdir;
      if (P_TryWalk(actor)) return;
    }
  }
  if (turnaround !== DI_NODIR) {
    actor.moveDir = turnaround;
    if (P_TryWalk(actor)) return;
  }
  actor.moveDir = DI_NODIR;
}
function A_FaceTarget(actor) {
  if (!actor.target) return;
  actor.flags &= ~MF.MF_AMBUSH;
  actor.angle = R_PointToAngle2(actor.x, actor.y, actor.target.x, actor.target.y);
}
function A_PosAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  const angle = actor.angle;
  const slope = env.aimLineAttack(actor, angle, MISSILERANGE);
  const spread = P_Random() - P_Random() << 20 | 0;
  const damage = (P_Random() % 5 + 1) * 3;
  env.lineAttack(actor, angle + spread >>> 0, MISSILERANGE, slope, damage);
}
function A_SPosAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  const bangle = actor.angle;
  const slope = env.aimLineAttack(actor, bangle, MISSILERANGE);
  for (let i = 0; i < 3; i++) {
    const angle = bangle + (P_Random() - P_Random() << 20) >>> 0;
    const damage = (P_Random() % 5 + 1) * 3;
    env.lineAttack(actor, angle, MISSILERANGE, slope, damage);
  }
}
function A_TroopAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = (P_Random() % 8 + 1) * 3;
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
}
function A_SargAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = (P_Random() % 10 + 1) * 4;
    env.damageMobj(actor.target, actor, actor, damage);
  }
}
function A_HeadAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = (P_Random() % 6 + 1) * 10;
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
  env.spawnMissile(actor, actor.target, MT.MT_HEADSHOT);
}
function A_CyberAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.spawnMissile(actor, actor.target, MT.MT_ROCKET);
}
function A_BruisAttack(actor) {
  if (!actor.target) return;
  if (P_CheckMeleeRange(actor)) {
    const damage = (P_Random() % 8 + 1) * 10;
    env.damageMobj(actor.target, actor, actor, damage);
    return;
  }
  env.spawnMissile(actor, actor.target, MT.MT_BRUISERSHOT);
}
function A_SkelMissile(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  actor.z = actor.z + 16 * FRACUNIT | 0;
  const mo = env.spawnMissile(actor, actor.target, MT.MT_TRACER);
  actor.z = actor.z - 16 * FRACUNIT | 0;
  mo.x = mo.x + mo.momx | 0;
  mo.y = mo.y + mo.momy | 0;
  mo.tracer = actor.target;
}
function A_Tracer(actor) {
  if (env.gameTic() & 3) return;
  env.spawnPuff(actor.x, actor.y, actor.z, false);
  const th = env.spawnMobj(
    actor.x - actor.momx | 0,
    actor.y - actor.momy | 0,
    actor.z,
    MT.MT_SMOKE
  );
  th.momz = FRACUNIT;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;
  const dest = actor.tracer;
  if (!dest || dest.health <= 0) return;
  const exact = R_PointToAngle2(actor.x, actor.y, dest.x, dest.y);
  if (exact !== actor.angle) {
    if (exact - actor.angle >>> 0 > 2147483648) {
      actor.angle = actor.angle - TRACEANGLE >>> 0;
      if (exact - actor.angle >>> 0 < 2147483648) actor.angle = exact;
    } else {
      actor.angle = actor.angle + TRACEANGLE >>> 0;
      if (exact - actor.angle >>> 0 > 2147483648) actor.angle = exact;
    }
  }
  const fine = actor.angle >>> ANGLETOFINESHIFT & FINEMASK;
  const speed = mobjInfo[actor.type].speed;
  actor.momx = FixedMul(speed, finecosine[fine]);
  actor.momy = FixedMul(speed, finesine[fine]);
  let dist = P_AproxDistance(dest.x - actor.x, dest.y - actor.y);
  dist = dist / speed | 0;
  if (dist < 1) dist = 1;
  const slope = (dest.z + 40 * FRACUNIT - actor.z) / dist | 0;
  if (slope < actor.momz) actor.momz = actor.momz - FRACUNIT / 8 | 0;
  else actor.momz = actor.momz + FRACUNIT / 8 | 0;
}
function A_SkelWhoosh(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
}
function A_SkelFist(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (P_CheckMeleeRange(actor)) {
    const damage = (P_Random() % 10 + 1) * 6;
    env.damageMobj(actor.target, actor, actor, damage);
  }
}
function A_FatRaise(actor) {
  A_FaceTarget(actor);
}
function A_FatAttack1(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  actor.angle = actor.angle + FATSPREAD >>> 0;
  env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  const mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = mo.angle + FATSPREAD >>> 0;
  const fine = mo.angle >>> ANGLETOFINESHIFT & FINEMASK;
  const speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}
function A_FatAttack2(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  actor.angle = actor.angle - FATSPREAD >>> 0;
  env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  const mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = mo.angle - FATSPREAD * 2 >>> 0;
  const fine = mo.angle >>> ANGLETOFINESHIFT & FINEMASK;
  const speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}
function A_FatAttack3(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  let mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = mo.angle - FATSPREAD / 2 >>> 0;
  let fine = mo.angle >>> ANGLETOFINESHIFT & FINEMASK;
  let speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
  mo = env.spawnMissile(actor, actor.target, MT.MT_FATSHOT);
  mo.angle = mo.angle + FATSPREAD / 2 >>> 0;
  fine = mo.angle >>> ANGLETOFINESHIFT & FINEMASK;
  speed = mobjInfo[mo.type].speed;
  mo.momx = FixedMul(speed, finecosine[fine]);
  mo.momy = FixedMul(speed, finesine[fine]);
}
function A_SkullAttack(actor) {
  if (!actor.target) return;
  const dest = actor.target;
  actor.flags |= MF.MF_SKULLFLY;
  A_FaceTarget(actor);
  const fine = actor.angle >>> ANGLETOFINESHIFT & FINEMASK;
  actor.momx = FixedMul(SKULLSPEED, finecosine[fine]);
  actor.momy = FixedMul(SKULLSPEED, finesine[fine]);
  let dist = P_AproxDistance(dest.x - actor.x, dest.y - actor.y);
  dist = dist / SKULLSPEED | 0;
  if (dist < 1) dist = 1;
  actor.momz = (dest.z + (dest.height >> 1) - actor.z) / dist | 0;
}
function A_CPosAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  const bangle = actor.angle;
  const slope = env.aimLineAttack(actor, bangle, MISSILERANGE);
  const angle = bangle + (P_Random() - P_Random() << 20) >>> 0;
  const damage = (P_Random() % 5 + 1) * 3;
  env.lineAttack(actor, angle, MISSILERANGE, slope, damage);
}
function A_CPosRefire(actor) {
  A_FaceTarget(actor);
  if (P_Random() < 40) return;
  if (!actor.target || actor.target.health <= 0 || !P_CheckSight(actor, actor.target)) {
    P_SetMobjState(actor, mobjInfo[actor.type].seeState);
  }
}
function A_SpidRefire(actor) {
  A_FaceTarget(actor);
  if (P_Random() < 10) return;
  if (!actor.target || actor.target.health <= 0 || !P_CheckSight(actor, actor.target)) {
    P_SetMobjState(actor, mobjInfo[actor.type].seeState);
  }
}
function A_BspiAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.spawnMissile(actor, actor.target, MT.MT_ARACHPLAZ);
}
function A_Explode(thing) {
  env.radiusAttack(thing, thing.target, 128);
}
function A_PlayerScream(mo) {
  void mo;
}
function A_Metal(actor) {
  A_Chase(actor);
}
function A_BabyMetal(actor) {
  A_Chase(actor);
}
function A_Hoof(actor) {
  A_Chase(actor);
}
function A_BossDeath(mo) {
  env.bossDeath?.(mo);
}
function A_KeenDie(mo) {
  A_Fall(mo);
  env.bossDeath?.(mo);
}
function A_VileStart(actor) {
  void actor;
}
function A_StartFire(actor) {
  A_Fire(actor);
}
function A_FireCrackle(actor) {
  A_Fire(actor);
}
function A_Fire(actor) {
  const dest = actor.tracer;
  if (!dest) return;
  if (!actor.target) return;
  if (!P_CheckSight(actor.target, dest)) return;
  const fine = dest.angle >>> ANGLETOFINESHIFT & FINEMASK;
  env.unsetThingPosition(actor);
  actor.x = dest.x + FixedMul(24 * FRACUNIT, finecosine[fine]) | 0;
  actor.y = dest.y + FixedMul(24 * FRACUNIT, finesine[fine]) | 0;
  actor.z = dest.z;
  env.setThingPosition(actor);
}
function A_VileTarget(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  const fog = env.spawnMobj(actor.target.x, actor.target.y, actor.target.z, MT.MT_FIRE);
  actor.tracer = fog;
  fog.target = actor;
  fog.tracer = actor.target;
  A_Fire(fog);
}
function A_VileAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  if (!P_CheckSight(actor, actor.target)) return;
  env.damageMobj(actor.target, actor, actor, 20);
  actor.target.momz = 1e3 * FRACUNIT / mobjInfo[actor.target.type].mass | 0;
  const fire = actor.tracer;
  if (!fire) return;
  const fine = actor.angle >>> ANGLETOFINESHIFT & FINEMASK;
  fire.x = actor.target.x - FixedMul(24 * FRACUNIT, finecosine[fine]) | 0;
  fire.y = actor.target.y - FixedMul(24 * FRACUNIT, finesine[fine]) | 0;
  env.radiusAttack(fire, actor, 70);
}
function A_VileChase(actor) {
  A_Chase(actor);
}
function A_PainAttack(actor) {
  if (!actor.target) return;
  A_FaceTarget(actor);
  env.painShootSkull?.(actor, actor.angle);
}
function A_PainDie(actor) {
  A_Fall(actor);
  env.painShootSkull?.(actor, actor.angle + ANG90 >>> 0);
  env.painShootSkull?.(actor, actor.angle + ANG180 >>> 0);
  env.painShootSkull?.(actor, actor.angle + ANG270 >>> 0);
}
function A_BrainAwake(_mo) {
}
function A_BrainPain(_mo) {
}
function A_BrainScream(_mo) {
}
function A_BrainExplode(_mo) {
}
function A_BrainDie(_mo) {
}
function A_BrainSpit(_mo) {
}
function A_SpawnSound(_mo) {
}
function A_SpawnFly(_mo) {
}
function A_Fall(actor) {
  actor.flags &= ~MF.MF_SOLID;
}
function A_Scream(actor) {
  const ds = mobjInfo[actor.type].deathSound;
  switch (ds) {
    case "sfx_None":
    case "0":
      return;
    case "sfx_podth1":
    case "sfx_podth2":
    case "sfx_podth3":
      P_Random() % 3;
      break;
    case "sfx_bgdth1":
    case "sfx_bgdth2":
      P_Random() % 2;
      break;
    default:
      break;
  }
}
function A_XScream(_actor) {
}
function A_Pain(_actor) {
}
function A_Chase(actor) {
  if (actor.reactionTime) actor.reactionTime--;
  if (actor.threshold) {
    if (!actor.target || actor.target.health <= 0) actor.threshold = 0;
    else actor.threshold--;
  }
  if (actor.moveDir < 8) {
    actor.angle = (actor.angle & 7 << 29) >>> 0;
    const delta = actor.angle - (actor.moveDir << 29) | 0;
    if (delta > 0) actor.angle = actor.angle - ANG90 / 2 >>> 0;
    else if (delta < 0) actor.angle = actor.angle + ANG90 / 2 >>> 0;
  }
  if (!actor.target || !(actor.target.flags & MF.MF_SHOOTABLE)) {
    if (P_LookForPlayers(actor, true)) return;
    P_SetMobjState(actor, mobjInfo[actor.type].spawnState);
    return;
  }
  if (actor.flags & MF.MF_JUSTATTACKED) {
    actor.flags &= ~MF.MF_JUSTATTACKED;
    P_NewChaseDir(actor);
    return;
  }
  const info = mobjInfo[actor.type];
  if (info.meleeState && P_CheckMeleeRange(actor)) {
    P_SetMobjState(actor, info.meleeState);
    return;
  }
  if (info.missileState) {
    if (!actor.moveCount && P_CheckMissileRange(actor)) {
      P_SetMobjState(actor, info.missileState);
      actor.flags |= MF.MF_JUSTATTACKED;
      return;
    }
  }
  if (--actor.moveCount < 0 || !P_Move(actor)) {
    P_NewChaseDir(actor);
  }
  if (info.activeSound !== "sfx_None" && P_Random() < 3) {
  }
}
var ML_TWOSIDED2, ML_SOUNDBLOCK, DI_EAST, DI_NORTHEAST, DI_NORTH, DI_NORTHWEST, DI_WEST, DI_SOUTHWEST, DI_SOUTH, DI_SOUTHEAST, DI_NODIR, MAXPLAYERS, MELEERANGE, MISSILERANGE, xspeed, yspeed, opposite, diags, env, soundValidCount, soundTargetRef, wakeHook, TRACEANGLE, FATSPREAD, SKULLSPEED;
var init_p_enemy = __esm({
  "src/p_enemy.ts"() {
    "use strict";
    init_m_fixed();
    init_m_random();
    init_info();
    init_p_mobj();
    init_p_maputl();
    init_p_sight();
    init_r_point();
    init_tables();
    ML_TWOSIDED2 = 4;
    ML_SOUNDBLOCK = 64;
    DI_EAST = 0;
    DI_NORTHEAST = 1;
    DI_NORTH = 2;
    DI_NORTHWEST = 3;
    DI_WEST = 4;
    DI_SOUTHWEST = 5;
    DI_SOUTH = 6;
    DI_SOUTHEAST = 7;
    DI_NODIR = 8;
    MAXPLAYERS = 4;
    MELEERANGE = 64 * FRACUNIT;
    MISSILERANGE = 32 * 64 * FRACUNIT;
    xspeed = [FRACUNIT, 47e3, 0, -47e3, -FRACUNIT, -47e3, 0, 47e3];
    yspeed = [0, 47e3, FRACUNIT, 47e3, 0, -47e3, -FRACUNIT, -47e3];
    opposite = [
      DI_WEST,
      DI_SOUTHWEST,
      DI_SOUTH,
      DI_SOUTHEAST,
      DI_EAST,
      DI_NORTHEAST,
      DI_NORTH,
      DI_NORTHWEST,
      DI_NODIR
    ];
    diags = [DI_NORTHWEST, DI_NORTHEAST, DI_SOUTHWEST, DI_SOUTHEAST];
    soundValidCount = 0;
    soundTargetRef = null;
    wakeHook = null;
    TRACEANGLE = 201326592;
    FATSPREAD = ANG90 / 8;
    SKULLSPEED = 20 * FRACUNIT;
  }
});

// src/p_mobj.ts
var p_mobj_exports = {};
__export(p_mobj_exports, {
  FRICTION: () => FRICTION,
  GRAVITY: () => GRAVITY,
  MAXMOVE: () => MAXMOVE,
  P_AproxDistance: () => P_AproxDistance,
  P_CheckMissileSpawn: () => P_CheckMissileSpawn,
  P_ExplodeMissile: () => P_ExplodeMissile,
  P_MobjThinker: () => P_MobjThinker,
  P_RemoveMobj: () => P_RemoveMobj,
  P_SetMissileEnv: () => P_SetMissileEnv,
  P_SetMobjEnv: () => P_SetMobjEnv,
  P_SetMobjState: () => P_SetMobjState,
  P_SpawnBlood: () => P_SpawnBlood,
  P_SpawnMissile: () => P_SpawnMissile,
  P_SpawnMobj: () => P_SpawnMobj,
  P_SpawnPlayerMissile: () => P_SpawnPlayerMissile,
  P_SpawnPuff: () => P_SpawnPuff,
  P_XYMovement: () => P_XYMovement,
  P_ZMovement: () => P_ZMovement,
  STOPSPEED: () => STOPSPEED,
  S_NULL: () => S_NULL,
  setSpawnLog: () => setSpawnLog
});
function setSpawnLog(fn) {
  spawnLog = fn;
}
function P_SetMobjEnv(e) {
  env2 = e;
}
function P_SetMobjState(mo, state) {
  do {
    if (state === S_NULL) {
      mo.state = S_NULL;
      P_RemoveMobj(mo);
      return false;
    }
    const st = states[state];
    mo.state = state;
    mo.tics = st.tics;
    mo.sprite = st.sprite;
    mo.frame = st.frame;
    if (st.action) {
      P_CallAction(st.action, mo);
      if (mo.removed) return false;
    }
    state = st.nextState;
  } while (mo.tics === 0);
  return true;
}
function P_SpawnMobj(x, y, z, type) {
  const info = mobjInfo[type];
  const st = states[info.spawnState];
  const mo = {
    x,
    y,
    z: 0,
    angle: 0,
    momx: 0,
    momy: 0,
    momz: 0,
    radius: info.radius,
    height: info.height,
    floorZ: 0,
    ceilingZ: 0,
    type,
    state: info.spawnState,
    tics: st.tics,
    sprite: st.sprite,
    frame: st.frame,
    flags: info.flags,
    health: info.spawnHealth,
    subSector: 0,
    player: null,
    removed: false,
    bnext: null,
    bprev: null,
    snext: null,
    sprev: null,
    sector: null,
    blockIndex: -1,
    target: null,
    tracer: null,
    lastLook: 0,
    reactionTime: info.reactionTime,
    threshold: 0,
    moveDir: DI_NODIR,
    moveCount: 0
  };
  mo.lastLook = P_Random() % MAXPLAYERS;
  spawnLog?.(type, x, y, pRandomCount());
  P_SetThingPosition(mo);
  const sec = env2.sectorAt(x, y);
  mo.floorZ = sec.floorHeight;
  mo.ceilingZ = sec.ceilingHeight;
  if (z === ONFLOORZ) mo.z = mo.floorZ;
  else if (z === ONCEILINGZ) mo.z = mo.ceilingZ - info.height | 0;
  else mo.z = z;
  const thinker = { removed: false, tick: () => P_MobjThinker(mo) };
  thinkerOf.set(mo, thinker);
  P_AddThinker(thinker);
  return mo;
}
function P_RemoveMobj(mo) {
  P_UnsetThingPosition(mo);
  mo.removed = true;
  const t = thinkerOf.get(mo);
  if (t) P_RemoveThinker(t);
}
function P_XYMovement(mo) {
  if (mo.momx === 0 && mo.momy === 0) return;
  const player = mo.player;
  if (mo.momx > MAXMOVE) mo.momx = MAXMOVE;
  else if (mo.momx < -MAXMOVE) mo.momx = -MAXMOVE;
  if (mo.momy > MAXMOVE) mo.momy = MAXMOVE;
  else if (mo.momy < -MAXMOVE) mo.momy = -MAXMOVE;
  let xmove = mo.momx;
  let ymove = mo.momy;
  do {
    let ptryx;
    let ptryy;
    if (xmove > MAXMOVE / 2 || ymove > MAXMOVE / 2) {
      ptryx = mo.x + xmove / 2 | 0;
      ptryy = mo.y + ymove / 2 | 0;
      xmove >>= 1;
      ymove >>= 1;
    } else {
      ptryx = mo.x + xmove | 0;
      ptryy = mo.y + ymove | 0;
      xmove = ymove = 0;
    }
    if (!env2.tryMove(mo, ptryx, ptryy)) {
      if (mo.player) {
        env2.slideMove(mo);
      } else if (mo.flags & MF.MF_MISSILE) {
        env2.explodeMissile(mo);
        return;
      } else {
        mo.momx = 0;
        mo.momy = 0;
      }
    }
  } while (xmove !== 0 || ymove !== 0);
  if (mo.flags & (MF.MF_MISSILE | MF.MF_NOGRAVITY)) return;
  if (mo.z > mo.floorZ) return;
  if (mo.flags & MF.MF_CORPSE) {
    if (mo.momx > FRACUNIT / 4 || mo.momx < -FRACUNIT / 4 || mo.momy > FRACUNIT / 4 || mo.momy < -FRACUNIT / 4) {
      if (mo.floorZ !== env2.sectorAt(mo.x, mo.y).floorHeight) return;
    }
  }
  if (mo.momx > -STOPSPEED && mo.momx < STOPSPEED && mo.momy > -STOPSPEED && mo.momy < STOPSPEED && (!player || player.cmd.forwardMove === 0 && player.cmd.sideMove === 0)) {
    mo.momx = 0;
    mo.momy = 0;
  } else {
    mo.momx = FixedMul(mo.momx, FRICTION);
    mo.momy = FixedMul(mo.momy, FRICTION);
  }
}
function P_ZMovement(mo) {
  if (mo.player && mo.z < mo.floorZ) {
    mo.player.viewHeight -= mo.floorZ - mo.z | 0;
    mo.player.deltaViewHeight = VIEWHEIGHT - mo.player.viewHeight >> 3;
  }
  mo.z = mo.z + mo.momz | 0;
  if (mo.z <= mo.floorZ) {
    if (mo.momz < 0) {
      if (mo.player && mo.momz < -GRAVITY * 8) {
        mo.player.deltaViewHeight = mo.momz >> 3;
      }
      mo.momz = 0;
    }
    mo.z = mo.floorZ;
    if (mo.flags & MF.MF_MISSILE && !(mo.flags & MF.MF_NOCLIP)) {
      env2.explodeMissile(mo);
      return;
    }
  } else if (!(mo.flags & MF.MF_NOGRAVITY)) {
    if (mo.momz === 0) mo.momz = -GRAVITY * 2;
    else mo.momz = mo.momz - GRAVITY | 0;
  }
  if (mo.z + mo.height > mo.ceilingZ) {
    if (mo.momz > 0) mo.momz = 0;
    mo.z = mo.ceilingZ - mo.height | 0;
    if (mo.flags & MF.MF_MISSILE && !(mo.flags & MF.MF_NOCLIP)) {
      env2.explodeMissile(mo);
      return;
    }
  }
}
function P_MobjThinker(mo) {
  if (mo.momx !== 0 || mo.momy !== 0) {
    P_XYMovement(mo);
    if (mo.removed) return;
  }
  if (mo.z !== mo.floorZ || mo.momz !== 0) {
    P_ZMovement(mo);
    if (mo.removed) return;
  }
  if (mo.tics === -1) return;
  mo.tics--;
  if (mo.tics <= 0) {
    P_SetMobjState(mo, states[mo.state].nextState);
  }
}
function P_ExplodeMissile(mo) {
  mo.momx = mo.momy = mo.momz = 0;
  P_SetMobjState(mo, mobjInfo[mo.type].deathState);
  mo.tics -= P_Random() & 3;
  if (mo.tics < 1) mo.tics = 1;
  mo.flags &= ~MF.MF_MISSILE;
}
function P_SpawnPuff(x, y, z, meleeRange) {
  z = z + (P_Random() - P_Random() << 10) | 0;
  const th = P_SpawnMobj(x, y, z, MT.MT_PUFF);
  th.momz = FRACUNIT;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;
  if (meleeRange) P_SetMobjState(th, S.S_PUFF3);
}
function P_SpawnBlood(x, y, z, damage) {
  z = z + (P_Random() - P_Random() << 10) | 0;
  const th = P_SpawnMobj(x, y, z, MT.MT_BLOOD);
  th.momz = FRACUNIT * 2;
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;
  if (damage <= 12 && damage >= 9) P_SetMobjState(th, S.S_BLOOD2);
  else if (damage < 9) P_SetMobjState(th, S.S_BLOOD3);
}
function P_CheckMissileSpawn(th) {
  th.tics -= P_Random() & 3;
  if (th.tics < 1) th.tics = 1;
  th.x = th.x + (th.momx >> 1) | 0;
  th.y = th.y + (th.momy >> 1) | 0;
  th.z = th.z + (th.momz >> 1) | 0;
  if (!env2.tryMove(th, th.x, th.y)) P_ExplodeMissile(th);
}
function P_SpawnMissile(source, dest, type) {
  const th = P_SpawnMobj(source.x, source.y, source.z + 4 * 8 * FRACUNIT | 0, type);
  th.target = source;
  let an = R_PointToAngle2(source.x, source.y, dest.x, dest.y);
  if (dest.flags & MF.MF_SHADOW) an = an + (P_Random() - P_Random() << 20) >>> 0;
  th.angle = an;
  const fine = an >>> ANGLETOFINESHIFT & FINEMASK;
  const speed = mobjInfo[th.type].speed;
  th.momx = FixedMul(speed, finecosine[fine]);
  th.momy = FixedMul(speed, finesine[fine]);
  let dist = P_AproxDistance(dest.x - source.x, dest.y - source.y);
  dist = dist / speed | 0;
  if (dist < 1) dist = 1;
  th.momz = (dest.z - source.z) / dist | 0;
  P_CheckMissileSpawn(th);
  return th;
}
function P_SetMissileEnv(e) {
  missileEnv = e;
}
function P_SpawnPlayerMissile(source, type) {
  let an = source.angle;
  let slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
  if (!missileEnv.lineTarget()) {
    an = an + (1 << 26) >>> 0;
    slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    if (!missileEnv.lineTarget()) {
      an = an - (2 << 26) >>> 0;
      slope = missileEnv.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    }
    if (!missileEnv.lineTarget()) {
      an = source.angle;
      slope = 0;
    }
  }
  const th = P_SpawnMobj(source.x, source.y, source.z + 4 * 8 * FRACUNIT | 0, type);
  th.target = source;
  th.angle = an;
  const fine = an >>> ANGLETOFINESHIFT & FINEMASK;
  const speed = mobjInfo[type].speed;
  th.momx = FixedMul(speed, finecosine[fine]);
  th.momy = FixedMul(speed, finesine[fine]);
  th.momz = FixedMul(speed, slope);
  P_CheckMissileSpawn(th);
  return th;
}
var spawnLog, GRAVITY, MAXMOVE, STOPSPEED, FRICTION, S_NULL, env2, thinkerOf, missileEnv;
var init_p_mobj = __esm({
  "src/p_mobj.ts"() {
    "use strict";
    init_m_fixed();
    init_m_random();
    init_info();
    init_r_point();
    init_tables();
    init_p_tick();
    init_p_maputl();
    init_p_blockmap();
    init_p_action();
    init_p_enemy();
    init_p_local();
    spawnLog = null;
    GRAVITY = FRACUNIT;
    MAXMOVE = 30 * FRACUNIT;
    STOPSPEED = 4096;
    FRICTION = 59392;
    S_NULL = 0;
    thinkerOf = /* @__PURE__ */ new WeakMap();
  }
});

// src/p_setup.ts
function P_SetupLevel(map2) {
  const sectors = map2.sectors.map((s, i) => ({
    floorHeight: s.floorHeight << FRACBITS,
    ceilingHeight: s.ceilingHeight << FRACBITS,
    floorPic: s.floorPic,
    ceilingPic: s.ceilingPic,
    lightLevel: s.lightLevel,
    special: s.special,
    tag: s.tag,
    index: i,
    thingList: null,
    specialData: null,
    soundTarget: null,
    soundTraversed: 0,
    validCount: 0,
    blockBox: [0, 0, 0, 0],
    lineIndices: []
  }));
  const lines = map2.lineDefs.map((ld, i) => {
    const a = map2.vertexes[ld.v1];
    const b = map2.vertexes[ld.v2];
    const v1x = a.x << FRACBITS, v1y = a.y << FRACBITS;
    const v2x = b.x << FRACBITS, v2y = b.y << FRACBITS;
    const dx = v2x - v1x | 0;
    const dy = v2y - v1y | 0;
    const bbox = [0, 0, 0, 0];
    bbox[BOXTOP] = Math.max(v1y, v2y);
    bbox[BOXBOTTOM] = Math.min(v1y, v2y);
    bbox[BOXLEFT] = Math.min(v1x, v2x);
    bbox[BOXRIGHT] = Math.max(v1x, v2x);
    const frontSide = ld.sideNum[0] >= 0 ? map2.sideDefs[ld.sideNum[0]] : void 0;
    const backSide = ld.sideNum[1] >= 0 ? map2.sideDefs[ld.sideNum[1]] : void 0;
    return {
      index: i,
      v1x,
      v1y,
      v2x,
      v2y,
      dx,
      dy,
      flags: ld.flags,
      special: ld.special,
      tag: ld.tag,
      sideNum: [ld.sideNum[0], ld.sideNum[1]],
      bbox,
      slopeType: slopeTypeOf(dx, dy),
      frontSector: frontSide ? sectors[frontSide.sector] ?? null : null,
      backSector: backSide ? sectors[backSide.sector] ?? null : null,
      validCount: 0
    };
  });
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.frontSector) l.frontSector.lineIndices.push(i);
    if (l.backSector && l.backSector !== l.frontSector) l.backSector.lineIndices.push(i);
  }
  const bm = map2.blockMap;
  const orgX = bm.originX << FRACBITS;
  const orgY = bm.originY << FRACBITS;
  for (const sec of sectors) {
    let top = -Infinity, bottom = Infinity, left = Infinity, right = -Infinity;
    for (const li of sec.lineIndices) {
      const l = lines[li];
      top = Math.max(top, l.v1y, l.v2y);
      bottom = Math.min(bottom, l.v1y, l.v2y);
      left = Math.min(left, l.v1x, l.v2x);
      right = Math.max(right, l.v1x, l.v2x);
    }
    if (!Number.isFinite(top)) {
      top = bottom = left = right = 0;
    }
    const clamp = (v, hi) => v < 0 ? 0 : v >= hi ? hi - 1 : v;
    sec.blockBox[BOXTOP] = clamp(top - orgY + MAXRADIUS >> MAPBLOCKSHIFT, bm.height);
    sec.blockBox[BOXBOTTOM] = clamp(bottom - orgY - MAXRADIUS >> MAPBLOCKSHIFT, bm.height);
    sec.blockBox[BOXRIGHT] = clamp(right - orgX + MAXRADIUS >> MAPBLOCKSHIFT, bm.width);
    sec.blockBox[BOXLEFT] = clamp(left - orgX - MAXRADIUS >> MAPBLOCKSHIFT, bm.width);
  }
  const nodes = map2.nodes.map((n) => ({
    x: n.x << FRACBITS,
    y: n.y << FRACBITS,
    dx: n.dx << FRACBITS,
    dy: n.dy << FRACBITS,
    children: [n.children[0], n.children[1]]
  }));
  return { sectors, lines, nodes, source: map2 };
}
var init_p_setup = __esm({
  "src/p_setup.ts"() {
    "use strict";
    init_map();
    init_m_fixed();
    init_p_maputl();
    init_p_local();
  }
});

// src/p_map.ts
function P_SetMapLevel(l, e) {
  level2 = l;
  map = l.source;
  mapEnv = e;
  validCount = 0;
  P_SetTraceLevel(l);
}
function PIT_CheckLine(ld) {
  if (tmBBox[BOXRIGHT] <= ld.bbox[BOXLEFT] || tmBBox[BOXLEFT] >= ld.bbox[BOXRIGHT] || tmBBox[BOXTOP] <= ld.bbox[BOXBOTTOM] || tmBBox[BOXBOTTOM] >= ld.bbox[BOXTOP]) {
    return true;
  }
  if (P_BoxOnLineSide(tmBBox, ld) !== -1) return true;
  if (!ld.backSector) return false;
  if (!(tmFlags & MF.MF_MISSILE)) {
    if (ld.flags & ML_BLOCKING) return false;
    if (!tmThing.player && ld.flags & ML_BLOCKMONSTERS) return false;
  }
  const open = P_LineOpening(ld);
  if (open.top < tmCeilingZ) {
    tmCeilingZ = open.top;
    ceilingLine = ld;
  }
  if (open.bottom > tmFloorZ) tmFloorZ = open.bottom;
  if (open.lowFloor < tmDropoffZ) tmDropoffZ = open.lowFloor;
  if (ld.special) {
    if (numSpecHit < MAXSPECIALCROSS) specHit[numSpecHit++] = ld;
  }
  return true;
}
function PIT_CheckThing(thing) {
  if (!(thing.flags & (MF.MF_SOLID | MF.MF_SPECIAL | MF.MF_SHOOTABLE))) return true;
  const blockDist = thing.radius + tmThing.radius | 0;
  if (Math.abs(thing.x - tmX) >= blockDist || Math.abs(thing.y - tmY) >= blockDist) {
    return true;
  }
  if (thing === tmThing) return true;
  if (thing.flags & MF.MF_SPECIAL) {
    const solid = (thing.flags & MF.MF_SOLID) !== 0;
    if (tmFlags & MF.MF_PICKUP) {
      mapEnv.touchSpecialThing?.(thing, tmThing);
    }
    return !solid;
  }
  return !(thing.flags & MF.MF_SOLID);
}
function blockLinesIterator(bx, by, fn) {
  for (const li of blockLines(map, bx, by)) {
    const ld = level2.lines[li];
    if (!ld) continue;
    if (ld.validCount === validCount) continue;
    ld.validCount = validCount;
    if (!fn(ld)) return false;
  }
  return true;
}
function P_CheckPosition(thing, x, y) {
  tmThing = thing;
  tmFlags = thing.flags;
  tmX = x;
  tmY = y;
  tmBBox[BOXTOP] = y + thing.radius | 0;
  tmBBox[BOXBOTTOM] = y - thing.radius | 0;
  tmBBox[BOXRIGHT] = x + thing.radius | 0;
  tmBBox[BOXLEFT] = x - thing.radius | 0;
  const sec = mapEnv.sectorAt(x, y);
  ceilingLine = null;
  tmFloorZ = tmDropoffZ = sec.floorHeight;
  tmCeilingZ = sec.ceilingHeight;
  validCount++;
  numSpecHit = 0;
  if (tmFlags & MF.MF_NOCLIP) return true;
  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;
  {
    const txl = tmBBox[BOXLEFT] - orgX - MAXRADIUS >> MAPBLOCKSHIFT;
    const txh = tmBBox[BOXRIGHT] - orgX + MAXRADIUS >> MAPBLOCKSHIFT;
    const tyl = tmBBox[BOXBOTTOM] - orgY - MAXRADIUS >> MAPBLOCKSHIFT;
    const tyh = tmBBox[BOXTOP] - orgY + MAXRADIUS >> MAPBLOCKSHIFT;
    for (let bx = txl; bx <= txh; bx++) {
      for (let by = tyl; by <= tyh; by++) {
        if (!P_BlockThingsIterator(bx, by, PIT_CheckThing)) return false;
      }
    }
  }
  const xl = tmBBox[BOXLEFT] - orgX >> MAPBLOCKSHIFT;
  const xh = tmBBox[BOXRIGHT] - orgX >> MAPBLOCKSHIFT;
  const yl = tmBBox[BOXBOTTOM] - orgY >> MAPBLOCKSHIFT;
  const yh = tmBBox[BOXTOP] - orgY >> MAPBLOCKSHIFT;
  for (let bx = xl; bx <= xh; bx++) {
    for (let by = yl; by <= yh; by++) {
      if (!blockLinesIterator(bx, by, PIT_CheckLine)) return false;
    }
  }
  return true;
}
function P_TakeSpecHits() {
  const out2 = [];
  for (let i = 0; i < numSpecHit; i++) out2.push({ lineIndex: specHit[i].index });
  return out2;
}
function P_TryMove(thing, x, y) {
  floatOk = false;
  if (!P_CheckPosition(thing, x, y)) return false;
  if (!(thing.flags & MF.MF_NOCLIP)) {
    if (tmCeilingZ - tmFloorZ < thing.height) return false;
    floatOk = true;
    if (!(thing.flags & MF.MF_TELEPORT) && tmCeilingZ - thing.z < thing.height) {
      return false;
    }
    if (!(thing.flags & MF.MF_TELEPORT) && tmFloorZ - thing.z > MAXSTEP) {
      return false;
    }
    if (!(thing.flags & (MF.MF_DROPOFF | MF.MF_FLOAT)) && tmFloorZ - tmDropoffZ > MAXSTEP) {
      return false;
    }
  }
  P_UnsetThingPosition(thing);
  const oldX = thing.x;
  const oldY = thing.y;
  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;
  thing.x = x;
  thing.y = y;
  P_SetThingPosition(thing);
  if (!(thing.flags & (MF.MF_TELEPORT | MF.MF_NOCLIP))) {
    while (numSpecHit-- > 0) {
      const ld = specHit[numSpecHit];
      const side = P_PointOnLineSide(thing.x, thing.y, ld);
      const oldSide = P_PointOnLineSide(oldX, oldY, ld);
      if (side !== oldSide && ld.special) {
        mapEnv.crossSpecialLine?.(ld.index, oldSide, thing);
      }
    }
    numSpecHit = 0;
  }
  return true;
}
function PTR_AimTraverse(inter) {
  if (inter.isALine) {
    const li = inter.line;
    if (!(li.flags & ML_TWOSIDED3)) return false;
    const open = P_LineOpening(li);
    if (open.bottom >= open.top) return false;
    const dist2 = FixedMul(attackRange, inter.frac);
    if (li.frontSector.floorHeight !== li.backSector.floorHeight) {
      const slope = FixedDiv(open.bottom - shootZ | 0, dist2);
      if (slope > bottomSlope2) bottomSlope2 = slope;
    }
    if (li.frontSector.ceilingHeight !== li.backSector.ceilingHeight) {
      const slope = FixedDiv(open.top - shootZ | 0, dist2);
      if (slope < topSlope2) topSlope2 = slope;
    }
    if (topSlope2 <= bottomSlope2) return false;
    return true;
  }
  const th = inter.thing;
  if (th === shootThing) return true;
  if (!(th.flags & MF.MF_SHOOTABLE)) return true;
  const dist = FixedMul(attackRange, inter.frac);
  let thingTopSlope = FixedDiv(th.z + th.height - shootZ | 0, dist);
  if (thingTopSlope < bottomSlope2) return true;
  let thingBottomSlope = FixedDiv(th.z - shootZ | 0, dist);
  if (thingBottomSlope > topSlope2) return true;
  if (thingTopSlope > topSlope2) thingTopSlope = topSlope2;
  if (thingBottomSlope < bottomSlope2) thingBottomSlope = bottomSlope2;
  aimSlope = (thingTopSlope + thingBottomSlope) / 2 | 0;
  lineTarget = th;
  return false;
}
function P_AimLineAttack(t1, angle, distance) {
  const fine = angle >>> ANGLETOFINESHIFT & FINEMASK;
  shootThing = t1;
  const x2 = t1.x + (distance >> 16) * finecosine[fine] | 0;
  const y2 = t1.y + (distance >> 16) * finesine[fine] | 0;
  shootZ = t1.z + (t1.height >> 1) + 8 * FRACUNIT | 0;
  topSlope2 = 100 * FRACUNIT / 160 | 0;
  bottomSlope2 = -100 * FRACUNIT / 160 | 0;
  attackRange = distance;
  lineTarget = null;
  P_PathTraverse(t1.x, t1.y, x2, y2, PT_ADDLINES | PT_ADDTHINGS, PTR_AimTraverse);
  return lineTarget ? aimSlope : 0;
}
function P_SetShootEnv(e) {
  shootEnv = e;
}
function PTR_ShootTraverse(inter) {
  if (inter.isALine) {
    const li = inter.line;
    if (li.special) {
    }
    if (!(li.flags & ML_TWOSIDED3)) {
      const frac2 = inter.frac - FixedDiv(4 * FRACUNIT, attackRange) | 0;
      const x2 = trace.x + FixedMul(trace.dx, frac2) | 0;
      const y2 = trace.y + FixedMul(trace.dy, frac2) | 0;
      const z2 = shootZ + FixedMul(aimSlope, FixedMul(frac2, attackRange)) | 0;
      P_SpawnPuff(x2, y2, z2, attackRange === MELEERANGE2);
      return false;
    }
    const open = P_LineOpening(li);
    const dist2 = FixedMul(attackRange, inter.frac);
    if (li.frontSector.floorHeight !== li.backSector.floorHeight) {
      const slope = FixedDiv(open.bottom - shootZ | 0, dist2);
      if (slope > aimSlope) return false;
    }
    if (li.frontSector.ceilingHeight !== li.backSector.ceilingHeight) {
      const slope = FixedDiv(open.top - shootZ | 0, dist2);
      if (slope < aimSlope) return false;
    }
    return true;
  }
  const th = inter.thing;
  if (th === shootThing) return true;
  if (!(th.flags & MF.MF_SHOOTABLE)) return true;
  const dist = FixedMul(attackRange, inter.frac);
  const thingTopSlope = FixedDiv(th.z + th.height - shootZ | 0, dist);
  if (thingTopSlope < aimSlope) return true;
  const thingBottomSlope = FixedDiv(th.z - shootZ | 0, dist);
  if (thingBottomSlope > aimSlope) return true;
  const frac = inter.frac - FixedDiv(10 * FRACUNIT, attackRange) | 0;
  const x = trace.x + FixedMul(trace.dx, frac) | 0;
  const y = trace.y + FixedMul(trace.dy, frac) | 0;
  const z = shootZ + FixedMul(aimSlope, FixedMul(frac, attackRange)) | 0;
  if (th.flags & MF.MF_NOBLOOD) {
    P_SpawnPuff(x, y, z, attackRange === MELEERANGE2);
  } else {
    P_SpawnBlood(x, y, z, laDamage);
  }
  if (laDamage && shootEnv.damageMobj) {
    shootEnv.damageMobj(th, shootThing, shootThing, laDamage);
  }
  return false;
}
function P_LineAttack(t1, angle, distance, slope, damage) {
  const fine = angle >>> ANGLETOFINESHIFT & FINEMASK;
  shootThing = t1;
  laDamage = damage;
  const x2 = t1.x + (distance >> 16) * finecosine[fine] | 0;
  const y2 = t1.y + (distance >> 16) * finesine[fine] | 0;
  shootZ = t1.z + (t1.height >> 1) + 8 * FRACUNIT | 0;
  attackRange = distance;
  aimSlope = slope;
  P_PathTraverse(t1.x, t1.y, x2, y2, PT_ADDLINES | PT_ADDTHINGS, PTR_ShootTraverse);
}
function PIT_StompThing(thing) {
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;
  const blockDist = thing.radius + tmThing.radius | 0;
  if (Math.abs(thing.x - tmX) >= blockDist || Math.abs(thing.y - tmY) >= blockDist) {
    return true;
  }
  if (thing === tmThing) return true;
  if (!tmThing.player) return false;
  shootEnv.damageMobj?.(thing, tmThing, tmThing, 1e4);
  return true;
}
function P_TeleportMove(thing, x, y) {
  tmThing = thing;
  tmFlags = thing.flags;
  tmX = x;
  tmY = y;
  tmBBox[BOXTOP] = y + thing.radius | 0;
  tmBBox[BOXBOTTOM] = y - thing.radius | 0;
  tmBBox[BOXRIGHT] = x + thing.radius | 0;
  tmBBox[BOXLEFT] = x - thing.radius | 0;
  const sec = mapEnv.sectorAt(x, y);
  ceilingLine = null;
  tmFloorZ = tmDropoffZ = sec.floorHeight;
  tmCeilingZ = sec.ceilingHeight;
  validCount++;
  numSpecHit = 0;
  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;
  const xl = tmBBox[BOXLEFT] - orgX - MAXRADIUS >> MAPBLOCKSHIFT;
  const xh = tmBBox[BOXRIGHT] - orgX + MAXRADIUS >> MAPBLOCKSHIFT;
  const yl = tmBBox[BOXBOTTOM] - orgY - MAXRADIUS >> MAPBLOCKSHIFT;
  const yh = tmBBox[BOXTOP] - orgY + MAXRADIUS >> MAPBLOCKSHIFT;
  for (let bx = xl; bx <= xh; bx++) {
    for (let by = yl; by <= yh; by++) {
      if (!P_BlockThingsIterator(bx, by, PIT_StompThing)) return false;
    }
  }
  P_UnsetThingPosition(thing);
  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;
  thing.x = x;
  thing.y = y;
  P_SetThingPosition(thing);
  return true;
}
function PIT_RadiusAttack(thing) {
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;
  if (thing.type === MT.MT_CYBORG || thing.type === MT.MT_SPIDER) return true;
  const dx = Math.abs(thing.x - bombSpot.x);
  const dy = Math.abs(thing.y - bombSpot.y);
  let dist = dx > dy ? dx : dy;
  dist = dist - thing.radius >> 16;
  if (dist < 0) dist = 0;
  if (dist >= bombDamage) return true;
  if (P_CheckSight(thing, bombSpot)) {
    shootEnv.damageMobj?.(thing, bombSpot, bombSource, bombDamage - dist);
  }
  return true;
}
function P_RadiusAttack(spot, source, damage) {
  const bm = map.blockMap;
  const orgX = bm.originX << 16;
  const orgY = bm.originY << 16;
  const dist = damage + 32 << 16;
  const yh = spot.y + dist - orgY >> MAPBLOCKSHIFT;
  const yl = spot.y - dist - orgY >> MAPBLOCKSHIFT;
  const xh = spot.x + dist - orgX >> MAPBLOCKSHIFT;
  const xl = spot.x - dist - orgX >> MAPBLOCKSHIFT;
  bombSpot = spot;
  bombSource = source;
  bombDamage = damage;
  for (let y = yl; y <= yh; y++) {
    for (let x = xl; x <= xh; x++) P_BlockThingsIterator(x, y, PIT_RadiusAttack);
  }
}
function P_ThingHeightClip(thing) {
  const onFloor = thing.z === thing.floorZ;
  P_CheckPosition(thing, thing.x, thing.y);
  thing.floorZ = tmFloorZ;
  thing.ceilingZ = tmCeilingZ;
  if (onFloor) {
    thing.z = thing.floorZ;
  } else {
    if (thing.z + thing.height > thing.ceilingZ) {
      thing.z = thing.ceilingZ - thing.height | 0;
    }
  }
  return thing.ceilingZ - thing.floorZ >= thing.height;
}
function PIT_ChangeSector(thing) {
  if (P_ThingHeightClip(thing)) return true;
  if (thing.health <= 0) {
    P_SetMobjState(thing, S.S_GIBS);
    thing.flags &= ~MF.MF_SOLID;
    thing.height = 0;
    thing.radius = 0;
    return true;
  }
  if (thing.flags & MF.MF_DROPPED) {
    P_RemoveMobj(thing);
    return true;
  }
  if (!(thing.flags & MF.MF_SHOOTABLE)) return true;
  noFit = true;
  return true;
}
function P_ChangeSector(sector, crunch) {
  noFit = false;
  crushChange = crunch;
  for (let x = sector.blockBox[BOXLEFT]; x <= sector.blockBox[BOXRIGHT]; x++) {
    for (let y = sector.blockBox[BOXBOTTOM]; y <= sector.blockBox[BOXTOP]; y++) {
      P_BlockThingsIterator(x, y, PIT_ChangeSector);
    }
  }
  return noFit;
}
function P_HitSlideLine(ld) {
  if (ld.slopeType === 0 /* Horizontal */) {
    tmYMove = 0;
    return;
  }
  if (ld.slopeType === 1 /* Vertical */) {
    tmXMove = 0;
    return;
  }
  const side = P_PointOnLineSide(slideMo.x, slideMo.y, ld);
  let lineAngle = R_PointToAngle2(0, 0, ld.dx, ld.dy);
  if (side === 1) lineAngle = lineAngle + ANG180 >>> 0;
  const moveAngle = R_PointToAngle2(0, 0, tmXMove, tmYMove);
  let deltaAngle = moveAngle - lineAngle >>> 0;
  if (deltaAngle > ANG180) deltaAngle = deltaAngle + ANG180 >>> 0;
  const lineFine = lineAngle >>> ANGLETOFINESHIFT & FINEMASK;
  const deltaFine = deltaAngle >>> ANGLETOFINESHIFT & FINEMASK;
  const moveLen = P_AproxDistance(tmXMove, tmYMove);
  const newLen = FixedMul(moveLen, finecosine[deltaFine]);
  tmXMove = FixedMul(newLen, finecosine[lineFine]);
  tmYMove = FixedMul(newLen, finesine[lineFine]);
}
function PTR_SlideTraverse(inter) {
  const li = inter.line;
  if (!inter.isALine || !li) return true;
  let blocking;
  if (!(li.flags & ML_TWOSIDED3)) {
    if (P_PointOnLineSide(slideMo.x, slideMo.y, li)) return true;
    blocking = true;
  } else {
    const open = P_LineOpening(li);
    blocking = open.range < slideMo.height || // doesn't fit
    open.top - slideMo.z < slideMo.height || // too high
    open.bottom - slideMo.z > MAXSTEP;
  }
  if (!blocking) return true;
  if (inter.frac < bestSlideFrac) {
    bestSlideFrac = inter.frac;
    bestSlideLine = li;
  }
  return false;
}
function stairStep(mo) {
  if (!P_TryMove(mo, mo.x, mo.y + mo.momy | 0)) {
    P_TryMove(mo, mo.x + mo.momx | 0, mo.y);
  }
}
function P_SlideMove(mo) {
  slideMo = mo;
  let hitCount = 0;
  for (; ; ) {
    if (++hitCount === 3) {
      stairStep(mo);
      return;
    }
    let leadX, trailX;
    if (mo.momx > 0) {
      leadX = mo.x + mo.radius | 0;
      trailX = mo.x - mo.radius | 0;
    } else {
      leadX = mo.x - mo.radius | 0;
      trailX = mo.x + mo.radius | 0;
    }
    let leadY, trailY;
    if (mo.momy > 0) {
      leadY = mo.y + mo.radius | 0;
      trailY = mo.y - mo.radius | 0;
    } else {
      leadY = mo.y - mo.radius | 0;
      trailY = mo.y + mo.radius | 0;
    }
    bestSlideFrac = FRACUNIT + 1;
    bestSlideLine = null;
    P_PathTraverse(
      leadX,
      leadY,
      leadX + mo.momx | 0,
      leadY + mo.momy | 0,
      PT_ADDLINES,
      PTR_SlideTraverse
    );
    P_PathTraverse(
      trailX,
      leadY,
      trailX + mo.momx | 0,
      leadY + mo.momy | 0,
      PT_ADDLINES,
      PTR_SlideTraverse
    );
    P_PathTraverse(
      leadX,
      trailY,
      leadX + mo.momx | 0,
      trailY + mo.momy | 0,
      PT_ADDLINES,
      PTR_SlideTraverse
    );
    if (bestSlideFrac === FRACUNIT + 1) {
      stairStep(mo);
      return;
    }
    bestSlideFrac = bestSlideFrac - 2048 | 0;
    if (bestSlideFrac > 0) {
      const newX = FixedMul(mo.momx, bestSlideFrac);
      const newY = FixedMul(mo.momy, bestSlideFrac);
      if (!P_TryMove(mo, mo.x + newX | 0, mo.y + newY | 0)) {
        stairStep(mo);
        return;
      }
    }
    bestSlideFrac = FRACUNIT - (bestSlideFrac + 2048) | 0;
    if (bestSlideFrac > FRACUNIT) bestSlideFrac = FRACUNIT;
    if (bestSlideFrac <= 0) return;
    tmXMove = FixedMul(mo.momx, bestSlideFrac);
    tmYMove = FixedMul(mo.momy, bestSlideFrac);
    if (bestSlideLine) P_HitSlideLine(bestSlideLine);
    mo.momx = tmXMove;
    mo.momy = tmYMove;
    if (P_TryMove(mo, mo.x + tmXMove | 0, mo.y + tmYMove | 0)) return;
  }
}
var MELEERANGE2, ML_BLOCKING, ML_BLOCKMONSTERS, MAXSPECIALCROSS, tmThing, tmFlags, tmX, tmY, tmBBox, tmFloorZ, tmCeilingZ, tmDropoffZ, ceilingLine, floatOk, specHit, numSpecHit, validCount, level2, map, mapEnv, MAXSTEP, shootThing, shootZ, attackRange, aimSlope, topSlope2, bottomSlope2, laDamage, lineTarget, shootEnv, bombSpot, bombSource, bombDamage, noFit, crushChange, USERANGE, slideMo, bestSlideFrac, bestSlideLine, tmXMove, tmYMove, ML_TWOSIDED3;
var init_p_map = __esm({
  "src/p_map.ts"() {
    "use strict";
    init_m_fixed();
    init_map();
    init_p_maputl();
    init_tables();
    init_p_blockmap();
    init_r_point();
    init_p_local();
    init_p_mobj();
    init_p_sight();
    init_p_maputl();
    init_info();
    MELEERANGE2 = 64 * FRACUNIT;
    ML_BLOCKING = 1;
    ML_BLOCKMONSTERS = 2;
    MAXSPECIALCROSS = 8;
    tmFlags = 0;
    tmX = 0;
    tmY = 0;
    tmBBox = [0, 0, 0, 0];
    tmFloorZ = 0;
    tmCeilingZ = 0;
    tmDropoffZ = 0;
    ceilingLine = null;
    floatOk = false;
    specHit = [];
    numSpecHit = 0;
    validCount = 0;
    MAXSTEP = 24 * FRACUNIT;
    shootZ = 0;
    attackRange = 0;
    aimSlope = 0;
    topSlope2 = 0;
    bottomSlope2 = 0;
    laDamage = 0;
    lineTarget = null;
    shootEnv = {};
    bombSource = null;
    bombDamage = 0;
    noFit = false;
    crushChange = false;
    USERANGE = 64 * FRACUNIT;
    bestSlideFrac = 0;
    bestSlideLine = null;
    tmXMove = 0;
    tmYMove = 0;
    ML_TWOSIDED3 = 4;
  }
});

// src/p_telept.ts
function P_SetTeleportEnv(l, e) {
  level3 = l;
  env3 = e;
}
function EV_Teleport(line, side, thing) {
  if (thing.flags & 65536) return false;
  if (side === 1) return false;
  const tag = line.tag;
  for (const sec of level3.sectors) {
    if (sec.tag !== tag) continue;
    for (let m = sec.thingList; m; m = m.snext) {
      if (m.type !== MT.MT_TELEPORTMAN) continue;
      if (m.sector !== sec) continue;
      const oldX = thing.x;
      const oldY = thing.y;
      const oldZ = thing.z;
      if (!env3.teleportMove(thing, m.x, m.y)) return false;
      thing.z = thing.floorZ;
      if (thing.player) thing.player.viewZ = thing.z + thing.player.viewHeight | 0;
      env3.spawnMobj(oldX, oldY, oldZ, MT.MT_TFOG);
      const fine = m.angle >>> ANGLETOFINESHIFT & FINEMASK;
      env3.spawnMobj(
        m.x + 20 * finecosine[fine] | 0,
        m.y + 20 * finesine[fine] | 0,
        thing.z,
        MT.MT_TFOG
      );
      if (thing.player) thing.reactionTime = 18;
      thing.angle = m.angle;
      thing.momx = thing.momy = thing.momz = 0;
      return true;
    }
  }
  return false;
}
var env3, level3;
var init_p_telept = __esm({
  "src/p_telept.ts"() {
    "use strict";
    init_info();
    init_tables();
  }
});

// src/p_user.ts
var PST_LIVE, PST_DEAD;
var init_p_user = __esm({
  "src/p_user.ts"() {
    "use strict";
    init_m_fixed();
    init_tables();
    init_p_local();
    init_p_mobj();
    init_info();
    init_p_map();
    init_p_pspr();
    PST_LIVE = 0;
    PST_DEAD = 1;
  }
});

// src/p_pspr.ts
function newPSprites() {
  return Array.from({ length: NUMPSPRITES }, () => ({ state: 0, tics: 0, sx: 0, sy: 0 }));
}
function P_SetPsprEnv(e) {
  env4 = e;
}
function P_SetPsprite(player, position, stnum) {
  const psp = player.psprites[position];
  do {
    if (!stnum) {
      psp.state = 0;
      break;
    }
    const state = states[stnum];
    psp.state = stnum;
    psp.tics = state.tics;
    if (state.action) {
      callWeaponAction(state.action, player, psp);
      if (!psp.state) break;
    }
    stnum = states[psp.state].nextState;
  } while (!psp.tics);
}
function P_BringUpWeapon(player) {
  if (player.pendingWeapon === WP_NOCHANGE) player.pendingWeapon = player.readyWeapon;
  const newState = weaponInfo[player.pendingWeapon].upState;
  player.pendingWeapon = WP_NOCHANGE;
  player.psprites[ps_weapon].sy = WEAPONBOTTOM;
  P_SetPsprite(player, ps_weapon, newState);
}
function P_CheckAmmo(player) {
  const ammo = weaponInfo[player.readyWeapon].ammo;
  let count = 1;
  if (player.readyWeapon === WP.wp_bfg) count = BFGCELLS;
  else if (player.readyWeapon === WP.wp_supershotgun) count = 2;
  if (ammo === AM.am_noammo || player.ammo[ammo] >= count) return true;
  do {
    if (player.weaponOwned[WP.wp_plasma] && player.ammo[AM.am_cell]) {
      player.pendingWeapon = WP.wp_plasma;
    } else if (player.weaponOwned[WP.wp_chaingun] && player.ammo[AM.am_clip]) {
      player.pendingWeapon = WP.wp_chaingun;
    } else if (player.weaponOwned[WP.wp_shotgun] && player.ammo[AM.am_shell]) {
      player.pendingWeapon = WP.wp_shotgun;
    } else if (player.ammo[AM.am_clip]) {
      player.pendingWeapon = WP.wp_pistol;
    } else if (player.weaponOwned[WP.wp_chainsaw]) {
      player.pendingWeapon = WP.wp_chainsaw;
    } else if (player.weaponOwned[WP.wp_missile] && player.ammo[AM.am_misl]) {
      player.pendingWeapon = WP.wp_missile;
    } else if (player.weaponOwned[WP.wp_bfg] && player.ammo[AM.am_cell] > 40) {
      player.pendingWeapon = WP.wp_bfg;
    } else {
      player.pendingWeapon = WP.wp_fist;
    }
  } while (player.pendingWeapon === WP_NOCHANGE);
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].downState);
  return false;
}
function P_FireWeapon(player) {
  if (!P_CheckAmmo(player)) return;
  P_SetMobjState(player.mo, S.S_PLAY_ATK1);
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].atkState);
  env4.noiseAlert(player.mo, player.mo);
}
function A_WeaponReady(player, psp) {
  const mo = player.mo;
  if (mo.state === S.S_PLAY_ATK1 || mo.state === S.S_PLAY_ATK2) {
    P_SetMobjState(mo, S.S_PLAY);
  }
  if (player.pendingWeapon !== WP_NOCHANGE || !player.health) {
    P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].downState);
    return;
  }
  if (player.cmd.buttons & 1) {
    if (!player.attackDown || player.readyWeapon !== WP.wp_missile && player.readyWeapon !== WP.wp_bfg) {
      player.attackDown = true;
      P_FireWeapon(player);
      return;
    }
  } else {
    player.attackDown = false;
  }
  let angle = 128 * levelTime() & FINEMASK;
  psp.sx = FRACUNIT + FixedMul(player.bob, finecosine[angle]) | 0;
  angle &= FINEANGLES / 2 - 1;
  psp.sy = WEAPONTOP + FixedMul(player.bob, finesine[angle]) | 0;
}
function A_ReFire(player, _psp) {
  if (player.cmd.buttons & 1 && player.pendingWeapon === WP_NOCHANGE && player.health) {
    player.refire++;
    P_FireWeapon(player);
  } else {
    player.refire = 0;
    P_CheckAmmo(player);
  }
}
function A_CheckReload(player, _psp) {
  P_CheckAmmo(player);
}
function A_Lower(player, psp) {
  psp.sy = psp.sy + LOWERSPEED | 0;
  if (psp.sy < WEAPONBOTTOM) return;
  if (player.state === PST_DEAD) {
    psp.sy = WEAPONBOTTOM;
    return;
  }
  if (!player.health) {
    P_SetPsprite(player, ps_weapon, 0);
    return;
  }
  player.readyWeapon = player.pendingWeapon;
  P_BringUpWeapon(player);
}
function A_Raise(player, psp) {
  psp.sy = psp.sy - RAISESPEED | 0;
  if (psp.sy > WEAPONTOP) return;
  psp.sy = WEAPONTOP;
  P_SetPsprite(player, ps_weapon, weaponInfo[player.readyWeapon].readyState);
}
function A_GunFlash(player, _psp) {
  P_SetMobjState(player.mo, S.S_PLAY_ATK2);
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
}
function P_BulletSlope(mo) {
  let an = mo.angle;
  bulletSlope = env4.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);
  if (!env4.lineTarget()) {
    an = an + (1 << 26) >>> 0;
    bulletSlope = env4.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);
    if (!env4.lineTarget()) {
      an = an - (2 << 26) >>> 0;
      bulletSlope = env4.aimLineAttack(mo, an, 16 * 64 * FRACUNIT);
    }
  }
}
function P_GunShot(mo, accurate) {
  const damage = 5 * (P_Random() % 3 + 1);
  let angle = mo.angle;
  if (!accurate) angle = angle + (P_Random() - P_Random() << 18) >>> 0;
  env4.lineAttack(mo, angle, MISSILERANGE2, bulletSlope, damage);
}
function A_Punch(player, _psp) {
  let damage = P_Random() % 10 + 1 << 1;
  if (player.powers[1]) damage *= 10;
  const mo = player.mo;
  const angle = mo.angle + (P_Random() - P_Random() << 18) >>> 0;
  const slope = env4.aimLineAttack(mo, angle, MELEERANGE3);
  env4.lineAttack(mo, angle, MELEERANGE3, slope, damage);
  const t = env4.lineTarget();
  if (t) mo.angle = R_PointToAngle2(mo.x, mo.y, t.x, t.y);
}
function A_FirePistol(player, _psp) {
  const mo = player.mo;
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
  P_BulletSlope(mo);
  P_GunShot(mo, !player.refire);
}
function A_FireShotgun(player, _psp) {
  const mo = player.mo;
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
  P_BulletSlope(mo);
  for (let i = 0; i < 7; i++) P_GunShot(mo, false);
}
function A_FireCGun(player, psp) {
  const mo = player.mo;
  if (!player.ammo[weaponInfo[player.readyWeapon].ammo]) return;
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  P_SetPsprite(
    player,
    ps_flash,
    weaponInfo[player.readyWeapon].flashState + psp.state - S.S_CHAIN1
  );
  P_BulletSlope(mo);
  P_GunShot(mo, !player.refire);
}
function A_Saw(player, _psp) {
  const damage = 2 * (P_Random() % 10 + 1);
  const mo = player.mo;
  const angle = mo.angle + (P_Random() - P_Random() << 18) >>> 0;
  const slope = env4.aimLineAttack(mo, angle, MELEERANGE3 + 1);
  env4.lineAttack(mo, angle, MELEERANGE3 + 1, slope, damage);
  const t = env4.lineTarget();
  if (!t) return;
  const targetAngle = R_PointToAngle2(mo.x, mo.y, t.x, t.y);
  const delta = targetAngle - mo.angle >>> 0;
  if (delta > ANG180) {
    if ((delta | 0) < -ANG90 / 20) mo.angle = targetAngle + ANG90 / 21 >>> 0;
    else mo.angle = mo.angle - ANG90 / 20 >>> 0;
  } else {
    if (delta > ANG90 / 20) mo.angle = targetAngle - ANG90 / 21 >>> 0;
    else mo.angle = mo.angle + ANG90 / 20 >>> 0;
  }
  mo.flags |= MF.MF_JUSTATTACKED;
}
function A_FireMissile(player, _psp) {
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  env4.spawnPlayerMissile(player.mo, MT.MT_ROCKET);
}
function A_FirePlasma(player, _psp) {
  player.ammo[weaponInfo[player.readyWeapon].ammo]--;
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState + (P_Random() & 1));
  env4.spawnPlayerMissile(player.mo, MT.MT_PLASMA);
}
function A_FireBFG(player, _psp) {
  player.ammo[weaponInfo[player.readyWeapon].ammo] -= BFGCELLS;
  env4.spawnPlayerMissile(player.mo, MT.MT_BFG);
}
function A_BFGsound(_player, _psp) {
}
function A_BFGSpray(mo) {
  const source = mo.target;
  if (!source) return;
  for (let i = 0; i < 40; i++) {
    const an = mo.angle - ANG90 / 2 + ANG90 / 40 * i >>> 0;
    env4.aimLineAttack(source, an, 16 * 64 * FRACUNIT);
    const t = env4.lineTarget();
    if (!t) continue;
    env4.spawnMobj(t.x, t.y, t.z + (t.height >> 2) | 0, MT.MT_EXTRABFG);
    let damage = 0;
    for (let j = 0; j < 15; j++) damage += (P_Random() & 7) + 1;
    env4.damageMobj(t, source, source, damage);
  }
}
function A_FireShotgun2(player, _psp) {
  const mo = player.mo;
  P_SetMobjState(mo, S.S_PLAY_ATK2);
  player.ammo[weaponInfo[player.readyWeapon].ammo] -= 2;
  P_SetPsprite(player, ps_flash, weaponInfo[player.readyWeapon].flashState);
  P_BulletSlope(mo);
  for (let i = 0; i < 20; i++) {
    const damage = 5 * (P_Random() % 3 + 1);
    const angle = mo.angle + (P_Random() - P_Random() << 19) >>> 0;
    env4.lineAttack(
      mo,
      angle,
      MISSILERANGE2,
      bulletSlope + (P_Random() - P_Random() << 5) | 0,
      damage
    );
  }
}
function A_OpenShotgun2(_player, _psp) {
}
function A_LoadShotgun2(_player, _psp) {
}
function A_CloseShotgun2(player, psp) {
  A_ReFire(player, psp);
}
function A_Light0(player, _psp) {
  player.extraLight = 0;
}
function A_Light1(player, _psp) {
  player.extraLight = 1;
}
function A_Light2(player, _psp) {
  player.extraLight = 2;
}
function P_SetupPsprites(player) {
  for (let i = 0; i < NUMPSPRITES; i++) player.psprites[i].state = 0;
  player.pendingWeapon = player.readyWeapon;
  P_BringUpWeapon(player);
}
function P_RegisterWeaponActions(table) {
  for (const [name, fn] of Object.entries(table)) weaponActions.set(name, fn);
}
function callWeaponAction(name, player, psp) {
  weaponActions.get(name)?.(player, psp);
}
function P_SetPsprLevelTime(fn) {
  levelTimeFn = fn;
}
var LOWERSPEED, RAISESPEED, WEAPONBOTTOM, WEAPONTOP, BFGCELLS, ps_weapon, ps_flash, NUMPSPRITES, WP_NOCHANGE, env4, MELEERANGE3, MISSILERANGE2, bulletSlope, weaponActions, levelTimeFn, levelTime;
var init_p_pspr = __esm({
  "src/p_pspr.ts"() {
    "use strict";
    init_m_fixed();
    init_m_random();
    init_info();
    init_tables();
    init_p_mobj();
    init_r_point();
    init_p_user();
    LOWERSPEED = FRACUNIT * 6;
    RAISESPEED = FRACUNIT * 6;
    WEAPONBOTTOM = 128 * FRACUNIT;
    WEAPONTOP = 32 * FRACUNIT;
    BFGCELLS = 40;
    ps_weapon = 0;
    ps_flash = 1;
    NUMPSPRITES = 2;
    WP_NOCHANGE = -1;
    MELEERANGE3 = 64 * FRACUNIT;
    MISSILERANGE2 = 32 * 64 * FRACUNIT;
    bulletSlope = 0;
    weaponActions = /* @__PURE__ */ new Map();
    levelTimeFn = () => 0;
    levelTime = () => levelTimeFn();
  }
});

// src/p_sectors.ts
function getNextSector(line, sec) {
  if (!(line.flags & 4)) return null;
  if (line.frontSector === sec) return line.backSector;
  return line.frontSector;
}
function P_FindLowestFloorSurrounding(level9, sec) {
  let floor = sec.floorHeight;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (other && other.floorHeight < floor) floor = other.floorHeight;
  }
  return floor;
}
function P_FindHighestFloorSurrounding(level9, sec) {
  let floor = -500 * 65536;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (other && other.floorHeight > floor) floor = other.floorHeight;
  }
  return floor;
}
function P_FindNextHighestFloor(level9, sec, currentHeight) {
  let best = Number.MAX_SAFE_INTEGER;
  let found = false;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (!other) continue;
    if (other.floorHeight > currentHeight && other.floorHeight < best) {
      best = other.floorHeight;
      found = true;
    }
  }
  return found ? best : currentHeight;
}
function P_FindLowestCeilingSurrounding(level9, sec) {
  let height = 2147483647;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (other && other.ceilingHeight < height) height = other.ceilingHeight;
  }
  return height;
}
function P_FindHighestCeilingSurrounding(level9, sec) {
  let height = 0;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (other && other.ceilingHeight > height) height = other.ceilingHeight;
  }
  return height;
}
function P_FindMinSurroundingLight(level9, sec, max) {
  let min = max;
  for (const li of sec.lineIndices) {
    const other = getNextSector(level9.lines[li], sec);
    if (other && other.lightLevel < min) min = other.lightLevel;
  }
  return min;
}
var init_p_sectors = __esm({
  "src/p_sectors.ts"() {
    "use strict";
  }
});

// src/p_floor.ts
function P_SetFloorEnv(e) {
  env5 = e;
}
function T_MovePlane(sector, speed, dest, crush, floorOrCeiling, direction) {
  if (floorOrCeiling === FLOOR) {
    if (direction === -1) {
      if (sector.floorHeight - speed < dest) {
        const lastPos3 = sector.floorHeight;
        sector.floorHeight = dest;
        if (env5.changeSector(sector, crush)) {
          sector.floorHeight = lastPos3;
          env5.changeSector(sector, crush);
        }
        return 2 /* PastDest */;
      }
      const lastPos2 = sector.floorHeight;
      sector.floorHeight = sector.floorHeight - speed | 0;
      if (env5.changeSector(sector, crush)) {
        sector.floorHeight = lastPos2;
        env5.changeSector(sector, crush);
        return 1 /* Crushed */;
      }
      return 0 /* Ok */;
    }
    if (sector.floorHeight + speed > dest) {
      const lastPos2 = sector.floorHeight;
      sector.floorHeight = dest;
      if (env5.changeSector(sector, crush)) {
        sector.floorHeight = lastPos2;
        env5.changeSector(sector, crush);
      }
      return 2 /* PastDest */;
    }
    const lastPos = sector.floorHeight;
    sector.floorHeight = sector.floorHeight + speed | 0;
    if (env5.changeSector(sector, crush)) {
      if (crush) return 1 /* Crushed */;
      sector.floorHeight = lastPos;
      env5.changeSector(sector, crush);
      return 1 /* Crushed */;
    }
    return 0 /* Ok */;
  }
  if (direction === -1) {
    if (sector.ceilingHeight - speed < dest) {
      const lastPos2 = sector.ceilingHeight;
      sector.ceilingHeight = dest;
      if (env5.changeSector(sector, crush)) {
        sector.ceilingHeight = lastPos2;
        env5.changeSector(sector, crush);
      }
      return 2 /* PastDest */;
    }
    const lastPos = sector.ceilingHeight;
    sector.ceilingHeight = sector.ceilingHeight - speed | 0;
    if (env5.changeSector(sector, crush)) {
      if (crush) return 1 /* Crushed */;
      sector.ceilingHeight = lastPos;
      env5.changeSector(sector, crush);
      return 1 /* Crushed */;
    }
    return 0 /* Ok */;
  }
  if (sector.ceilingHeight + speed > dest) {
    const lastPos = sector.ceilingHeight;
    sector.ceilingHeight = dest;
    if (env5.changeSector(sector, crush)) {
      sector.ceilingHeight = lastPos;
      env5.changeSector(sector, crush);
    }
    return 2 /* PastDest */;
  }
  sector.ceilingHeight = sector.ceilingHeight + speed | 0;
  env5.changeSector(sector, crush);
  return 0 /* Ok */;
}
function P_SetFloorLevel(l) {
  level4 = l;
}
function T_MoveFloor(floor) {
  const res = T_MovePlane(
    floor.sector,
    floor.speed,
    floor.floorDestHeight,
    floor.crush,
    FLOOR,
    floor.direction
  );
  if (res === 2 /* PastDest */) {
    floor.sector.specialData = null;
    if (floor.direction === 1 && floor.type === 11 /* DonutRaise */) {
      floor.sector.special = floor.newSpecial;
      floor.sector.floorPic = floor.texture;
    } else if (floor.direction === -1 && floor.type === 6 /* LowerAndChange */) {
      floor.sector.special = floor.newSpecial;
      floor.sector.floorPic = floor.texture;
    }
    P_RemoveThinker(floor.thinker);
  }
}
function EV_DoFloor(line, floorType) {
  let rtn = false;
  for (const sec of level4.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue;
    rtn = true;
    const floor = {
      thinker: { removed: false, tick: null },
      type: floorType,
      crush: false,
      sector: sec,
      direction: 1,
      newSpecial: 0,
      texture: sec.floorPic,
      floorDestHeight: 0,
      speed: FLOORSPEED
    };
    floor.thinker.tick = () => T_MoveFloor(floor);
    sec.specialData = floor;
    P_AddThinker(floor.thinker);
    switch (floorType) {
      case 0 /* LowerFloor */:
        floor.direction = -1;
        floor.floorDestHeight = P_FindHighestFloorSurrounding(level4, sec);
        break;
      case 1 /* LowerFloorToLowest */:
        floor.direction = -1;
        floor.floorDestHeight = P_FindLowestFloorSurrounding(level4, sec);
        break;
      case 2 /* TurboLower */:
        floor.direction = -1;
        floor.speed = FLOORSPEED * 4;
        floor.floorDestHeight = P_FindHighestFloorSurrounding(level4, sec);
        if (floor.floorDestHeight !== sec.floorHeight) {
          floor.floorDestHeight = floor.floorDestHeight + 8 * 65536 | 0;
        }
        break;
      case 9 /* RaiseFloorCrush */:
      case 3 /* RaiseFloor */:
        floor.crush = floorType === 9 /* RaiseFloorCrush */;
        floor.direction = 1;
        floor.floorDestHeight = P_FindLowestCeilingSurrounding(level4, sec);
        if (floor.floorDestHeight > sec.ceilingHeight) floor.floorDestHeight = sec.ceilingHeight;
        if (floorType === 9 /* RaiseFloorCrush */) {
          floor.floorDestHeight = floor.floorDestHeight - 8 * 65536 | 0;
        }
        break;
      case 10 /* RaiseFloorTurbo */:
        floor.direction = 1;
        floor.speed = FLOORSPEED * 4;
        floor.floorDestHeight = P_FindNextHighestFloor(level4, sec, sec.floorHeight);
        break;
      case 4 /* RaiseFloorToNearest */:
        floor.direction = 1;
        floor.floorDestHeight = P_FindNextHighestFloor(level4, sec, sec.floorHeight);
        break;
      case 7 /* RaiseFloor24 */:
        floor.direction = 1;
        floor.floorDestHeight = sec.floorHeight + 24 * 65536 | 0;
        break;
      case 12 /* RaiseFloor512 */:
        floor.direction = 1;
        floor.floorDestHeight = sec.floorHeight + 512 * 65536 | 0;
        break;
      case 8 /* RaiseFloor24AndChange */:
        floor.direction = 1;
        floor.floorDestHeight = sec.floorHeight + 24 * 65536 | 0;
        sec.floorPic = line.frontSector.floorPic;
        sec.special = line.frontSector.special;
        break;
      case 6 /* LowerAndChange */:
        floor.direction = -1;
        floor.floorDestHeight = P_FindLowestFloorSurrounding(level4, sec);
        floor.texture = sec.floorPic;
        break;
      case 5 /* RaiseToTexture */:
        floor.direction = 1;
        floor.floorDestHeight = sec.floorHeight;
        break;
      default:
        break;
    }
  }
  return rtn;
}
function EV_BuildStairs(line, type) {
  let rtn = false;
  const stairSize = type === 1 /* Turbo16 */ ? 16 * 65536 : 8 * 65536;
  const speed = type === 1 /* Turbo16 */ ? FLOORSPEED * 4 : FLOORSPEED / 4;
  for (const start of level4.sectors) {
    if (start.tag !== line.tag) continue;
    if (start.specialData) continue;
    rtn = true;
    let sec = start;
    let height = sec.floorHeight + stairSize | 0;
    const texture = sec.floorPic;
    const makeStep = (s, dest) => {
      const floor = {
        thinker: { removed: false, tick: null },
        type: 0 /* LowerFloor */,
        // unused for stairs; only direction matters
        crush: false,
        sector: s,
        direction: 1,
        newSpecial: 0,
        texture: s.floorPic,
        floorDestHeight: dest,
        speed
      };
      floor.thinker.tick = () => T_MoveFloor(floor);
      s.specialData = floor;
      P_AddThinker(floor.thinker);
    };
    makeStep(sec, height);
    let ok = true;
    while (ok) {
      ok = false;
      for (const li of sec.lineIndices) {
        const l = level4.lines[li];
        if (!(l.flags & 4)) continue;
        if (l.frontSector !== sec) continue;
        const next = l.backSector;
        if (!next || next.floorPic !== texture) continue;
        height = height + stairSize | 0;
        if (next.specialData) continue;
        makeStep(next, height);
        sec = next;
        ok = true;
        break;
      }
    }
  }
  return rtn;
}
var FLOOR, CEILING, env5, FLOORSPEED, level4;
var init_p_floor = __esm({
  "src/p_floor.ts"() {
    "use strict";
    init_p_tick();
    init_p_sectors();
    FLOOR = 0;
    CEILING = 1;
    FLOORSPEED = 65536;
  }
});

// src/p_doors.ts
function P_SetDoorLevel(l) {
  level5 = l;
}
function findLowestCeilingSurrounding(sec) {
  let height = 2147483647;
  for (const line of level5.lines) {
    if (line.frontSector !== sec && line.backSector !== sec) continue;
    const other = line.frontSector === sec ? line.backSector : line.frontSector;
    if (!other) continue;
    if (other.ceilingHeight < height) height = other.ceilingHeight;
  }
  return height;
}
function T_VerticalDoor(door) {
  switch (door.direction) {
    case 0:
      if (--door.topCountdown === 0) {
        switch (door.type) {
          case 5 /* BlazeRaise */:
          case 0 /* Normal */:
            door.direction = -1;
            break;
          case 1 /* Close30ThenOpen */:
            door.direction = 1;
            break;
          default:
            break;
        }
      }
      break;
    case 2:
      if (--door.topCountdown === 0) {
        if (door.type === 4 /* RaiseIn5Mins */) {
          door.direction = 1;
          door.type = 0 /* Normal */;
        }
      }
      break;
    case -1: {
      const res = T_MovePlane(
        door.sector,
        door.speed,
        door.sector.floorHeight,
        false,
        CEILING,
        door.direction
      );
      if (res === 2 /* PastDest */) {
        switch (door.type) {
          case 5 /* BlazeRaise */:
          case 7 /* BlazeClose */:
          case 0 /* Normal */:
          case 2 /* Close */:
            door.sector.specialData = null;
            P_RemoveThinker(door.thinker);
            break;
          case 1 /* Close30ThenOpen */:
            door.direction = 0;
            door.topCountdown = 35 * 30;
            break;
          default:
            break;
        }
      } else if (res === 1 /* Crushed */) {
        switch (door.type) {
          case 7 /* BlazeClose */:
          case 2 /* Close */:
            break;
          default:
            door.direction = 1;
            break;
        }
      }
      break;
    }
    case 1: {
      const res = T_MovePlane(
        door.sector,
        door.speed,
        door.topHeight,
        false,
        CEILING,
        door.direction
      );
      if (res === 2 /* PastDest */) {
        switch (door.type) {
          case 5 /* BlazeRaise */:
          case 0 /* Normal */:
            door.direction = 0;
            door.topCountdown = door.topWait;
            break;
          case 1 /* Close30ThenOpen */:
          case 6 /* BlazeOpen */:
          case 3 /* Open */:
            door.sector.specialData = null;
            P_RemoveThinker(door.thinker);
            break;
          default:
            break;
        }
      }
      break;
    }
  }
}
function newDoor(sector, type) {
  const door = {
    thinker: { removed: false, tick: null },
    type,
    sector,
    topHeight: 0,
    speed: VDOORSPEED,
    direction: 1,
    topWait: VDOORWAIT,
    topCountdown: 0
  };
  door.thinker.tick = () => T_VerticalDoor(door);
  sector.specialData = door;
  P_AddThinker(door.thinker);
  return door;
}
function EV_VerticalDoor(line, thing) {
  const backSideNum = line.sideNum[1];
  if (backSideNum < 0) return;
  const sec = line.backSector;
  if (!sec) return;
  if (sec.specialData) {
    const door2 = sec.specialData;
    switch (line.special) {
      case 1:
      // raise doors only, not opens
      case 26:
      case 27:
      case 28:
      case 117:
        if (door2.direction === -1) {
          door2.direction = 1;
        } else {
          if (!thing.player) return;
          door2.direction = -1;
        }
        return;
      default:
        return;
    }
  }
  const door = newDoor(sec, 0 /* Normal */);
  switch (line.special) {
    case 1:
    case 26:
    case 27:
    case 28:
      door.type = 0 /* Normal */;
      break;
    case 31:
    case 32:
    case 33:
    case 34:
      door.type = 3 /* Open */;
      line.special = 0;
      break;
    case 117:
      door.type = 5 /* BlazeRaise */;
      door.speed = VDOORSPEED * 4;
      break;
    case 118:
      door.type = 6 /* BlazeOpen */;
      line.special = 0;
      door.speed = VDOORSPEED * 4;
      break;
    default:
      break;
  }
  door.topHeight = findLowestCeilingSurrounding(sec) - 4 * FRACUNIT | 0;
  door.direction = 1;
}
function EV_DoDoor(line, type) {
  let didSomething = false;
  for (const sec of level5.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue;
    didSomething = true;
    const door = newDoor(sec, type);
    switch (type) {
      case 7 /* BlazeClose */:
        door.topHeight = findLowestCeilingSurrounding(sec) - 4 * FRACUNIT | 0;
        door.direction = -1;
        door.speed = VDOORSPEED * 4;
        break;
      case 2 /* Close */:
        door.topHeight = findLowestCeilingSurrounding(sec) - 4 * FRACUNIT | 0;
        door.direction = -1;
        break;
      case 1 /* Close30ThenOpen */:
        door.topHeight = sec.ceilingHeight;
        door.direction = -1;
        break;
      case 5 /* BlazeRaise */:
      case 6 /* BlazeOpen */:
        door.direction = 1;
        door.speed = VDOORSPEED * 4;
        door.topHeight = findLowestCeilingSurrounding(sec) - 4 * FRACUNIT | 0;
        break;
      case 0 /* Normal */:
      case 3 /* Open */:
        door.direction = 1;
        door.topHeight = findLowestCeilingSurrounding(sec) - 4 * FRACUNIT | 0;
        break;
      default:
        break;
    }
  }
  return didSomething;
}
var VDOORSPEED, VDOORWAIT, level5;
var init_p_doors = __esm({
  "src/p_doors.ts"() {
    "use strict";
    init_m_fixed();
    init_p_tick();
    init_p_floor();
    VDOORSPEED = FRACUNIT * 2;
    VDOORWAIT = 150;
  }
});

// src/p_plats.ts
function P_SetPlatLevel(l) {
  level6 = l;
  activePlats.length = 0;
}
function T_PlatRaise(plat) {
  switch (plat.status) {
    case 0 /* Up */: {
      const res = T_MovePlane(plat.sector, plat.speed, plat.high, plat.crush, FLOOR, 1);
      if (res === 1 /* Crushed */ && !plat.crush) {
        plat.count = plat.wait;
        plat.status = 1 /* Down */;
      } else if (res === 2 /* PastDest */) {
        plat.count = plat.wait;
        plat.status = 2 /* Waiting */;
        switch (plat.type) {
          case 4 /* BlazeDWUS */:
          case 1 /* DownWaitUpStay */:
          case 2 /* RaiseAndChange */:
          case 3 /* RaiseToNearestAndChange */:
            P_RemoveActivePlat(plat);
            break;
          default:
            break;
        }
      }
      break;
    }
    case 1 /* Down */: {
      const res = T_MovePlane(plat.sector, plat.speed, plat.low, false, FLOOR, -1);
      if (res === 2 /* PastDest */) {
        plat.count = plat.wait;
        plat.status = 2 /* Waiting */;
      }
      break;
    }
    case 2 /* Waiting */:
      if (!--plat.count) {
        plat.status = plat.sector.floorHeight === plat.low ? 0 /* Up */ : 1 /* Down */;
      }
      break;
    case 3 /* InStasis */:
      break;
  }
}
function P_AddActivePlat(plat) {
  activePlats.push(plat);
}
function P_RemoveActivePlat(plat) {
  plat.sector.specialData = null;
  P_RemoveThinker(plat.thinker);
  const i = activePlats.indexOf(plat);
  if (i >= 0) activePlats.splice(i, 1);
}
function P_ActivateInStasis(tag) {
  for (const plat of activePlats) {
    if (plat.tag === tag && plat.status === 3 /* InStasis */) {
      plat.status = plat.oldStatus;
      plat.thinker.tick = () => T_PlatRaise(plat);
    }
  }
}
function EV_StopPlat(line) {
  for (const plat of activePlats) {
    if (plat.status !== 3 /* InStasis */ && plat.tag === line.tag) {
      plat.oldStatus = plat.status;
      plat.status = 3 /* InStasis */;
      plat.thinker.tick = null;
    }
  }
}
function EV_DoPlat(line, type, amount) {
  let rtn = false;
  if (type === 0 /* PerpetualRaise */) P_ActivateInStasis(line.tag);
  for (const sec of level6.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue;
    rtn = true;
    const plat = {
      thinker: { removed: false, tick: null },
      sector: sec,
      speed: PLATSPEED,
      low: 0,
      high: 0,
      wait: 0,
      count: 0,
      status: 0 /* Up */,
      oldStatus: 0 /* Up */,
      crush: false,
      tag: line.tag,
      type
    };
    plat.thinker.tick = () => T_PlatRaise(plat);
    sec.specialData = plat;
    P_AddThinker(plat.thinker);
    switch (type) {
      case 3 /* RaiseToNearestAndChange */:
        plat.speed = PLATSPEED / 2;
        sec.floorPic = line.frontSector.floorPic;
        plat.high = P_FindNextHighestFloor(level6, sec, sec.floorHeight);
        plat.wait = 0;
        plat.status = 0 /* Up */;
        sec.special = 0;
        break;
      case 2 /* RaiseAndChange */:
        plat.speed = PLATSPEED / 2;
        sec.floorPic = line.frontSector.floorPic;
        plat.high = sec.floorHeight + amount * FRACUNIT | 0;
        plat.wait = 0;
        plat.status = 0 /* Up */;
        break;
      case 1 /* DownWaitUpStay */:
        plat.speed = PLATSPEED * 4;
        plat.low = P_FindLowestFloorSurrounding(level6, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        plat.status = 1 /* Down */;
        break;
      case 4 /* BlazeDWUS */:
        plat.speed = PLATSPEED * 8;
        plat.low = P_FindLowestFloorSurrounding(level6, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        plat.status = 1 /* Down */;
        break;
      case 0 /* PerpetualRaise */:
        plat.speed = PLATSPEED;
        plat.low = P_FindLowestFloorSurrounding(level6, sec);
        if (plat.low > sec.floorHeight) plat.low = sec.floorHeight;
        plat.high = P_FindHighestFloorSurrounding(level6, sec);
        if (plat.high < sec.floorHeight) plat.high = sec.floorHeight;
        plat.wait = 35 * PLATWAIT;
        plat.status = platRandom() & 1 ? 0 /* Up */ : 1 /* Down */;
        break;
      default:
        break;
    }
    P_AddActivePlat(plat);
  }
  return rtn;
}
var PLATWAIT, PLATSPEED, level6, activePlats, platRandom;
var init_p_plats = __esm({
  "src/p_plats.ts"() {
    "use strict";
    init_m_fixed();
    init_p_tick();
    init_p_floor();
    init_p_sectors();
    init_m_random();
    init_p_sectors();
    PLATWAIT = 3;
    PLATSPEED = FRACUNIT;
    activePlats = [];
    platRandom = () => P_Random();
  }
});

// src/p_ceilng.ts
function P_SetCeilingLevel(l) {
  level7 = l;
  activeCeilings.length = 0;
}
function T_MoveCeiling(ceiling) {
  switch (ceiling.direction) {
    case 0:
      break;
    case 1: {
      const res = T_MovePlane(
        ceiling.sector,
        ceiling.speed,
        ceiling.topHeight,
        false,
        CEILING,
        ceiling.direction
      );
      if (res === 2 /* PastDest */) {
        switch (ceiling.type) {
          case 1 /* RaiseToHighest */:
            P_RemoveActiveCeiling(ceiling);
            break;
          case 5 /* SilentCrushAndRaise */:
          case 4 /* FastCrushAndRaise */:
          case 3 /* CrushAndRaise */:
            ceiling.direction = -1;
            break;
          default:
            break;
        }
      }
      break;
    }
    case -1: {
      const res = T_MovePlane(
        ceiling.sector,
        ceiling.speed,
        ceiling.bottomHeight,
        ceiling.crush,
        CEILING,
        ceiling.direction
      );
      if (res === 2 /* PastDest */) {
        switch (ceiling.type) {
          case 5 /* SilentCrushAndRaise */:
          case 3 /* CrushAndRaise */:
            ceiling.speed = CEILSPEED;
            ceiling.direction = 1;
            break;
          case 4 /* FastCrushAndRaise */:
            ceiling.direction = 1;
            break;
          case 2 /* LowerAndCrush */:
          case 0 /* LowerToFloor */:
            P_RemoveActiveCeiling(ceiling);
            break;
          default:
            break;
        }
      } else if (res === 1 /* Crushed */) {
        switch (ceiling.type) {
          case 5 /* SilentCrushAndRaise */:
          case 3 /* CrushAndRaise */:
          case 2 /* LowerAndCrush */:
            ceiling.speed = CEILSPEED / 8;
            break;
          default:
            break;
        }
      }
      break;
    }
  }
}
function P_AddActiveCeiling(c) {
  activeCeilings.push(c);
}
function P_RemoveActiveCeiling(c) {
  c.sector.specialData = null;
  P_RemoveThinker(c.thinker);
  const i = activeCeilings.indexOf(c);
  if (i >= 0) activeCeilings.splice(i, 1);
}
function P_ActivateInStasisCeiling(line) {
  for (const c of activeCeilings) {
    if (c.tag === line.tag && c.direction === 0) {
      c.direction = c.oldDirection;
      c.thinker.tick = () => T_MoveCeiling(c);
    }
  }
}
function EV_CeilingCrushStop(line) {
  let rtn = false;
  for (const c of activeCeilings) {
    if (c.tag === line.tag && c.direction !== 0) {
      c.oldDirection = c.direction;
      c.direction = 0;
      c.thinker.tick = null;
      rtn = true;
    }
  }
  return rtn;
}
function EV_DoCeiling(line, type) {
  if (type === 4 /* FastCrushAndRaise */ || type === 5 /* SilentCrushAndRaise */ || type === 3 /* CrushAndRaise */) {
    P_ActivateInStasisCeiling(line);
  }
  let rtn = false;
  for (const sec of level7.sectors) {
    if (sec.tag !== line.tag) continue;
    if (sec.specialData) continue;
    rtn = true;
    const ceiling = {
      thinker: { removed: false, tick: null },
      type,
      sector: sec,
      bottomHeight: 0,
      topHeight: 0,
      speed: CEILSPEED,
      crush: false,
      direction: -1,
      tag: sec.tag,
      oldDirection: -1
    };
    ceiling.thinker.tick = () => T_MoveCeiling(ceiling);
    sec.specialData = ceiling;
    P_AddThinker(ceiling.thinker);
    switch (type) {
      case 4 /* FastCrushAndRaise */:
        ceiling.crush = true;
        ceiling.topHeight = sec.ceilingHeight;
        ceiling.bottomHeight = sec.floorHeight + 8 * FRACUNIT | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED * 2;
        break;
      case 5 /* SilentCrushAndRaise */:
      case 3 /* CrushAndRaise */:
        ceiling.crush = true;
        ceiling.topHeight = sec.ceilingHeight;
        ceiling.bottomHeight = sec.floorHeight + 8 * FRACUNIT | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED;
        break;
      case 2 /* LowerAndCrush */:
      case 0 /* LowerToFloor */:
        ceiling.bottomHeight = sec.floorHeight;
        if (type !== 0 /* LowerToFloor */) ceiling.bottomHeight = ceiling.bottomHeight + 8 * FRACUNIT | 0;
        ceiling.direction = -1;
        ceiling.speed = CEILSPEED;
        break;
      case 1 /* RaiseToHighest */:
        ceiling.topHeight = P_FindHighestCeilingSurrounding(level7, sec);
        ceiling.direction = 1;
        ceiling.speed = CEILSPEED;
        break;
    }
    P_AddActiveCeiling(ceiling);
  }
  return rtn;
}
var CEILSPEED, level7, activeCeilings;
var init_p_ceilng = __esm({
  "src/p_ceilng.ts"() {
    "use strict";
    init_m_fixed();
    init_p_tick();
    init_p_floor();
    init_p_sectors();
    CEILSPEED = FRACUNIT;
    activeCeilings = [];
  }
});

// src/p_spec.ts
function P_SetSpecEnv(e) {
  env6 = e;
}
function P_UseSpecialLine(thing, line, side) {
  if (!thing.player) {
    if (line.flags & 4) return false;
    switch (line.special) {
      case 1:
      // manual door raise
      case 32:
      // blue
      case 33:
      // red
      case 34:
        break;
      default:
        return false;
    }
  }
  switch (line.special) {
    // --- manual doors (no tag: the line's own back sector) ---
    case 1:
    // DR Door raise
    case 26:
    // DR Blue lock
    case 27:
    // DR Yellow lock
    case 28:
    // DR Red lock
    case 31:
    // D1 Door open stay
    case 32:
    // D1 Blue lock
    case 33:
    // D1 Red lock
    case 34:
    // D1 Yellow lock
    case 117:
    // DR Blazing raise
    case 118:
      EV_VerticalDoor(line, thing);
      break;
    // --- switched doors (tagged) ---
    case 29:
      if (EV_DoDoor(line, 0 /* Normal */)) line.special = 0;
      break;
    case 50:
      if (EV_DoDoor(line, 2 /* Close */)) line.special = 0;
      break;
    case 103:
      if (EV_DoDoor(line, 3 /* Open */)) line.special = 0;
      break;
    case 111:
      if (EV_DoDoor(line, 5 /* BlazeRaise */)) line.special = 0;
      break;
    case 112:
      if (EV_DoDoor(line, 6 /* BlazeOpen */)) line.special = 0;
      break;
    case 113:
      if (EV_DoDoor(line, 7 /* BlazeClose */)) line.special = 0;
      break;
    // --- repeatable switched doors ---
    case 42:
      EV_DoDoor(line, 2 /* Close */);
      break;
    // SR Door close
    case 61:
      EV_DoDoor(line, 3 /* Open */);
      break;
    // SR Door open
    case 63:
      EV_DoDoor(line, 0 /* Normal */);
      break;
    // SR Door raise
    case 114:
      EV_DoDoor(line, 5 /* BlazeRaise */);
      break;
    case 115:
      EV_DoDoor(line, 6 /* BlazeOpen */);
      break;
    case 116:
      EV_DoDoor(line, 7 /* BlazeClose */);
      break;
    // --- exits. THE most important special: without 11 no level ends. ---
    case 11:
      env6.exitLevel?.(false);
      line.special = 0;
      break;
    case 51:
      env6.exitLevel?.(true);
      line.special = 0;
      break;
    // --- lifts (switched) ---
    case 62:
      EV_DoPlat(line, 1 /* DownWaitUpStay */, 1);
      break;
    // SR
    case 21:
      if (EV_DoPlat(line, 1 /* DownWaitUpStay */, 0)) line.special = 0;
      break;
    case 122:
      if (EV_DoPlat(line, 4 /* BlazeDWUS */, 0)) line.special = 0;
      break;
    case 123:
      EV_DoPlat(line, 4 /* BlazeDWUS */, 0);
      break;
    // SR
    // --- perpetual lifts ---
    case 87:
      EV_DoPlat(line, 0 /* PerpetualRaise */, 0);
      break;
    // WR
    case 89:
      EV_StopPlat(line);
      break;
    // WR stop
    // --- floors (switched) ---
    case 18:
      if (EV_DoFloor(line, 4 /* RaiseFloorToNearest */)) line.special = 0;
      break;
    case 20:
      if (EV_DoPlat(line, 3 /* RaiseToNearestAndChange */, 0)) line.special = 0;
      break;
    case 23:
      if (EV_DoFloor(line, 1 /* LowerFloorToLowest */)) line.special = 0;
      break;
    case 55:
      if (EV_DoFloor(line, 9 /* RaiseFloorCrush */)) line.special = 0;
      break;
    case 71:
      if (EV_DoFloor(line, 2 /* TurboLower */)) line.special = 0;
      break;
    case 101:
      if (EV_DoFloor(line, 3 /* RaiseFloor */)) line.special = 0;
      break;
    case 102:
      if (EV_DoFloor(line, 0 /* LowerFloor */)) line.special = 0;
      break;
    case 140:
      if (EV_DoFloor(line, 12 /* RaiseFloor512 */)) line.special = 0;
      break;
    // --- floors (repeatable) ---
    case 45:
      EV_DoFloor(line, 0 /* LowerFloor */);
      break;
    // SR
    case 60:
      EV_DoFloor(line, 1 /* LowerFloorToLowest */);
      break;
    // SR
    case 64:
      EV_DoFloor(line, 3 /* RaiseFloor */);
      break;
    // SR
    case 65:
      EV_DoFloor(line, 9 /* RaiseFloorCrush */);
      break;
    // SR
    case 69:
      EV_DoFloor(line, 4 /* RaiseFloorToNearest */);
      break;
    // SR
    case 70:
      EV_DoFloor(line, 2 /* TurboLower */);
      break;
    // SR
    default:
      return false;
  }
  return true;
}
function P_CrossSpecialLine(line, side, thing) {
  if (!thing.player) {
    if (thing.flags & 65536) return false;
    switch (line.special) {
      case 39:
      // TELEPORT TRIGGER
      case 97:
      // TELEPORT RETRIGGER
      case 125:
      // TELEPORT MONSTERONLY TRIGGER
      case 126:
      // TELEPORT MONSTERONLY RETRIGGER
      case 4:
      // RAISE DOOR
      case 10:
      // PLAT DOWN-WAIT-UP-STAY TRIGGER
      case 88:
        break;
      default:
        return false;
    }
  }
  switch (line.special) {
    // --- W1: once only ---
    case 2:
      if (EV_DoDoor(line, 3 /* Open */)) line.special = 0;
      return true;
    case 3:
      if (EV_DoDoor(line, 2 /* Close */)) line.special = 0;
      return true;
    case 4:
      if (EV_DoDoor(line, 0 /* Normal */)) line.special = 0;
      return true;
    case 16:
      if (EV_DoDoor(line, 1 /* Close30ThenOpen */)) line.special = 0;
      return true;
    case 108:
      if (EV_DoDoor(line, 5 /* BlazeRaise */)) line.special = 0;
      return true;
    case 109:
      if (EV_DoDoor(line, 6 /* BlazeOpen */)) line.special = 0;
      return true;
    case 110:
      if (EV_DoDoor(line, 7 /* BlazeClose */)) line.special = 0;
      return true;
    case 5:
      if (EV_DoFloor(line, 3 /* RaiseFloor */)) line.special = 0;
      return true;
    case 8:
      if (EV_BuildStairs(line, 0 /* Build8 */)) line.special = 0;
      return true;
    case 19:
      if (EV_DoFloor(line, 0 /* LowerFloor */)) line.special = 0;
      return true;
    case 22:
      if (EV_DoPlat(line, 3 /* RaiseToNearestAndChange */, 0)) line.special = 0;
      return true;
    case 30:
      if (EV_DoFloor(line, 5 /* RaiseToTexture */)) line.special = 0;
      return true;
    case 36:
      if (EV_DoFloor(line, 2 /* TurboLower */)) line.special = 0;
      return true;
    case 37:
      if (EV_DoFloor(line, 6 /* LowerAndChange */)) line.special = 0;
      return true;
    case 38:
      if (EV_DoFloor(line, 1 /* LowerFloorToLowest */)) line.special = 0;
      return true;
    case 56:
      if (EV_DoFloor(line, 9 /* RaiseFloorCrush */)) line.special = 0;
      return true;
    case 58:
      if (EV_DoFloor(line, 7 /* RaiseFloor24 */)) line.special = 0;
      return true;
    case 59:
      if (EV_DoFloor(line, 8 /* RaiseFloor24AndChange */)) line.special = 0;
      return true;
    case 119:
      if (EV_DoFloor(line, 4 /* RaiseFloorToNearest */)) line.special = 0;
      return true;
    case 130:
      if (EV_DoFloor(line, 10 /* RaiseFloorTurbo */)) line.special = 0;
      return true;
    case 10:
      if (EV_DoPlat(line, 1 /* DownWaitUpStay */, 0)) line.special = 0;
      return true;
    case 121:
      if (EV_DoPlat(line, 4 /* BlazeDWUS */, 0)) line.special = 0;
      return true;
    case 6:
      if (EV_DoCeiling(line, 4 /* FastCrushAndRaise */)) line.special = 0;
      return true;
    case 25:
      if (EV_DoCeiling(line, 3 /* CrushAndRaise */)) line.special = 0;
      return true;
    case 44:
      if (EV_DoCeiling(line, 2 /* LowerAndCrush */)) line.special = 0;
      return true;
    case 39:
      if (env6.teleport?.(line, side, thing)) line.special = 0;
      return true;
    case 52:
      env6.exitLevel?.(false);
      return true;
    case 124:
      env6.exitLevel?.(true);
      return true;
    // --- WR: repeatable ---
    case 72:
      EV_DoCeiling(line, 2 /* LowerAndCrush */);
      return true;
    case 73:
      EV_DoCeiling(line, 3 /* CrushAndRaise */);
      return true;
    case 74:
      EV_CeilingCrushStop(line);
      return true;
    case 75:
      EV_DoDoor(line, 2 /* Close */);
      return true;
    case 76:
      EV_DoDoor(line, 1 /* Close30ThenOpen */);
      return true;
    case 77:
      EV_DoCeiling(line, 4 /* FastCrushAndRaise */);
      return true;
    case 82:
      EV_DoFloor(line, 1 /* LowerFloorToLowest */);
      return true;
    case 83:
      EV_DoFloor(line, 0 /* LowerFloor */);
      return true;
    case 84:
      EV_DoFloor(line, 6 /* LowerAndChange */);
      return true;
    case 86:
      EV_DoDoor(line, 3 /* Open */);
      return true;
    case 87:
      EV_DoPlat(line, 0 /* PerpetualRaise */, 0);
      return true;
    case 88:
      EV_DoPlat(line, 1 /* DownWaitUpStay */, 0);
      return true;
    case 89:
      EV_StopPlat(line);
      return true;
    case 90:
      EV_DoDoor(line, 0 /* Normal */);
      return true;
    case 91:
      EV_DoFloor(line, 3 /* RaiseFloor */);
      return true;
    case 92:
      EV_DoFloor(line, 7 /* RaiseFloor24 */);
      return true;
    case 93:
      EV_DoFloor(line, 8 /* RaiseFloor24AndChange */);
      return true;
    case 94:
      EV_DoFloor(line, 9 /* RaiseFloorCrush */);
      return true;
    case 95:
      EV_DoPlat(line, 3 /* RaiseToNearestAndChange */, 0);
      return true;
    case 96:
      EV_DoFloor(line, 5 /* RaiseToTexture */);
      return true;
    case 97:
      env6.teleport?.(line, side, thing);
      return true;
    case 98:
      EV_DoFloor(line, 2 /* TurboLower */);
      return true;
    case 105:
      EV_DoDoor(line, 5 /* BlazeRaise */);
      return true;
    case 106:
      EV_DoDoor(line, 6 /* BlazeOpen */);
      return true;
    case 107:
      EV_DoDoor(line, 7 /* BlazeClose */);
      return true;
    case 120:
      EV_DoPlat(line, 4 /* BlazeDWUS */, 0);
      return true;
    case 128:
      EV_DoFloor(line, 4 /* RaiseFloorToNearest */);
      return true;
    case 129:
      EV_DoFloor(line, 10 /* RaiseFloorTurbo */);
      return true;
    default:
      return false;
  }
}
var env6;
var init_p_spec = __esm({
  "src/p_spec.ts"() {
    "use strict";
    init_p_doors();
    init_p_floor();
    init_p_plats();
    init_p_ceilng();
    init_m_random();
    env6 = {};
  }
});

// src/p_ticker.ts
function P_ResetLevelTime() {
  levelTime2 = 0;
}
function P_LevelTime() {
  return levelTime2;
}
var levelTime2;
var init_p_ticker = __esm({
  "src/p_ticker.ts"() {
    "use strict";
    init_p_tick();
    init_p_user();
    init_p_spec();
    levelTime2 = 0;
  }
});

// src/p_lights.ts
function P_SetLightLevel(l) {
  level8 = l;
}
function T_LightFlash(flash) {
  if (--flash.count) return;
  if (flash.sector.lightLevel === flash.maxLight) {
    flash.sector.lightLevel = flash.minLight;
    flash.count = (P_Random() & flash.minTime) + 1;
  } else {
    flash.sector.lightLevel = flash.maxLight;
    flash.count = (P_Random() & flash.maxTime) + 1;
  }
}
function P_SpawnLightFlash(sector) {
  sector.special = 0;
  const flash = {
    sector,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level8, sector, sector.lightLevel),
    maxTime: 64,
    minTime: 7,
    count: 0
  };
  flash.count = (P_Random() & flash.maxTime) + 1;
  const t = { removed: false, tick: () => T_LightFlash(flash) };
  P_AddThinker(t);
}
function T_StrobeFlash(flash) {
  if (--flash.count) return;
  if (flash.sector.lightLevel === flash.minLight) {
    flash.sector.lightLevel = flash.maxLight;
    flash.count = flash.brightTime;
  } else {
    flash.sector.lightLevel = flash.minLight;
    flash.count = flash.darkTime;
  }
}
function P_SpawnStrobeFlash(sector, darkTime, inSync) {
  const flash = {
    sector,
    darkTime,
    brightTime: STROBEBRIGHT,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level8, sector, sector.lightLevel),
    count: 0
  };
  if (flash.minLight === flash.maxLight) flash.minLight = 0;
  sector.special = 0;
  flash.count = inSync ? 1 : (P_Random() & 7) + 1;
  const t = { removed: false, tick: () => T_StrobeFlash(flash) };
  P_AddThinker(t);
}
function T_Glow(g) {
  if (g.direction === -1) {
    g.sector.lightLevel -= GLOWSPEED;
    if (g.sector.lightLevel <= g.minLight) {
      g.sector.lightLevel += GLOWSPEED;
      g.direction = 1;
    }
  } else {
    g.sector.lightLevel += GLOWSPEED;
    if (g.sector.lightLevel >= g.maxLight) {
      g.sector.lightLevel -= GLOWSPEED;
      g.direction = -1;
    }
  }
}
function P_SpawnGlowingLight(sector) {
  const g = {
    sector,
    minLight: P_FindMinSurroundingLight(level8, sector, sector.lightLevel),
    maxLight: sector.lightLevel,
    direction: -1
  };
  sector.special = 0;
  const t = { removed: false, tick: () => T_Glow(g) };
  P_AddThinker(t);
}
function T_FireFlicker(f) {
  if (--f.count) return;
  const amount = (P_Random() & 3) * 16;
  if (f.sector.lightLevel - amount < f.minLight) f.sector.lightLevel = f.minLight;
  else f.sector.lightLevel = f.maxLight - amount;
  f.count = 4;
}
function P_SpawnFireFlicker(sector) {
  sector.special = 0;
  const f = {
    sector,
    maxLight: sector.lightLevel,
    minLight: P_FindMinSurroundingLight(level8, sector, sector.lightLevel) + 16,
    count: 4
  };
  const t = { removed: false, tick: () => T_FireFlicker(f) };
  P_AddThinker(t);
}
function P_SpawnLightSpecials() {
  let totalSecret = 0;
  for (const sector of level8.sectors) {
    switch (sector.special) {
      case 1:
        P_SpawnLightFlash(sector);
        break;
      case 2:
        P_SpawnStrobeFlash(sector, FASTDARK, false);
        break;
      case 3:
        P_SpawnStrobeFlash(sector, SLOWDARK, false);
        break;
      case 4:
        P_SpawnStrobeFlash(sector, FASTDARK, false);
        sector.special = 4;
        break;
      case 8:
        P_SpawnGlowingLight(sector);
        break;
      case 9:
        totalSecret++;
        break;
      case 12:
        P_SpawnStrobeFlash(sector, SLOWDARK, true);
        break;
      case 13:
        P_SpawnStrobeFlash(sector, FASTDARK, true);
        break;
      case 17:
        P_SpawnFireFlicker(sector);
        break;
      default:
        break;
    }
  }
  return totalSecret;
}
var STROBEBRIGHT, FASTDARK, SLOWDARK, GLOWSPEED, level8;
var init_p_lights = __esm({
  "src/p_lights.ts"() {
    "use strict";
    init_m_random();
    init_p_tick();
    init_p_sectors();
    STROBEBRIGHT = 5;
    FASTDARK = 15;
    SLOWDARK = 35;
    GLOWSPEED = 8;
  }
});

// src/p_inter.ts
function P_GiveAmmo(player, ammo, num) {
  if (ammo === AM.am_noammo) return false;
  if (ammo < 0 || ammo >= maxAmmo.length) return false;
  if (player.ammo[ammo] === player.maxAmmo[ammo]) return false;
  let amount = num ? num * clipAmmo[ammo] : clipAmmo[ammo] / 2 | 0;
  const skill = env7.skill();
  if (skill === 0 || skill === 4) amount <<= 1;
  const oldAmmo = player.ammo[ammo];
  player.ammo[ammo] += amount;
  if (player.ammo[ammo] > player.maxAmmo[ammo]) player.ammo[ammo] = player.maxAmmo[ammo];
  if (oldAmmo) return true;
  switch (ammo) {
    case AM.am_clip:
      if (player.readyWeapon === WP.wp_fist) {
        player.pendingWeapon = player.weaponOwned[WP.wp_chaingun] ? WP.wp_chaingun : WP.wp_pistol;
      }
      break;
    case AM.am_shell:
      if (player.readyWeapon === WP.wp_fist || player.readyWeapon === WP.wp_pistol) {
        if (player.weaponOwned[WP.wp_shotgun]) player.pendingWeapon = WP.wp_shotgun;
      }
      break;
    case AM.am_cell:
      if (player.readyWeapon === WP.wp_fist || player.readyWeapon === WP.wp_pistol) {
        if (player.weaponOwned[WP.wp_plasma]) player.pendingWeapon = WP.wp_plasma;
      }
      break;
    case AM.am_misl:
      if (player.readyWeapon === WP.wp_fist) {
        if (player.weaponOwned[WP.wp_missile]) player.pendingWeapon = WP.wp_missile;
      }
      break;
    default:
      break;
  }
  return true;
}
function P_GiveWeapon(player, weapon, dropped) {
  const ammo = weaponInfo[weapon].ammo;
  let gaveAmmo = false;
  let gaveWeapon = false;
  if (ammo !== AM.am_noammo) {
    gaveAmmo = P_GiveAmmo(player, ammo, dropped ? 1 : 2);
  }
  if (!player.weaponOwned[weapon]) {
    gaveWeapon = true;
    player.weaponOwned[weapon] = true;
    player.pendingWeapon = weapon;
  }
  return gaveWeapon || gaveAmmo;
}
function P_GiveBody(player, num) {
  if (player.health >= 100) return false;
  player.health += num;
  if (player.health > 100) player.health = 100;
  if (player.mo) player.mo.health = player.health;
  return true;
}
function P_GiveArmor(player, armorType) {
  const hits = armorPointsFor[armorType];
  if (player.armorPoints >= hits) return false;
  player.armorType = armorType;
  player.armorPoints = hits;
  return true;
}
function P_GiveCard(player, card) {
  if (player.cards[card]) return;
  player.bonusCount = BONUSADD;
  player.cards[card] = true;
}
function P_GivePower(player, power) {
  if (player.powers[power]) return false;
  player.powers[power] = 1;
  return true;
}
function P_TouchSpecialThing(special, toucher) {
  const delta = special.z - toucher.z;
  if (delta > toucher.height || delta < -8 * FRACUNIT) return;
  const player = toucher.player;
  if (!player) return;
  if (toucher.health <= 0) return;
  const spr = sprNames[special.sprite];
  switch (spr) {
    // --- armour ---
    case "ARM1":
      if (!P_GiveArmor(player, 1)) return;
      break;
    case "ARM2":
      if (!P_GiveArmor(player, 2)) return;
      break;
    // --- bonuses: these go ABOVE 100, which is the whole point of them ---
    case "BON1":
      player.health++;
      if (player.health > 200) player.health = 200;
      if (player.mo) player.mo.health = player.health;
      break;
    case "BON2":
      player.armorPoints++;
      if (player.armorPoints > 200) player.armorPoints = 200;
      if (!player.armorType) player.armorType = 1;
      break;
    case "SOUL":
      player.health += 100;
      if (player.health > 200) player.health = 200;
      if (player.mo) player.mo.health = player.health;
      break;
    // --- keys. NOTE: no `return` in single-player, so they're picked up. ---
    case "BKEY":
      P_GiveCard(player, 0);
      break;
    case "YKEY":
      P_GiveCard(player, 1);
      break;
    case "RKEY":
      P_GiveCard(player, 2);
      break;
    case "BSKU":
      P_GiveCard(player, 3);
      break;
    case "YSKU":
      P_GiveCard(player, 4);
      break;
    case "RSKU":
      P_GiveCard(player, 5);
      break;
    // --- health ---
    case "STIM":
      if (!P_GiveBody(player, 10)) return;
      break;
    case "MEDI":
      if (!P_GiveBody(player, 25)) return;
      break;
    // --- powerups ---
    case "PINV":
      if (!P_GivePower(player, 0)) return;
      break;
    case "PSTR":
      if (!P_GivePower(player, 1)) return;
      if (player.readyWeapon !== WP.wp_fist) player.pendingWeapon = WP.wp_fist;
      break;
    case "PINS":
      if (!P_GivePower(player, 2)) return;
      break;
    case "SUIT":
      if (!P_GivePower(player, 3)) return;
      break;
    case "PMAP":
      if (!P_GivePower(player, 4)) return;
      break;
    case "PVIS":
      if (!P_GivePower(player, 5)) return;
      break;
    // --- ammo ---
    case "CLIP":
      if (!P_GiveAmmo(player, AM.am_clip, special.flags & MF.MF_DROPPED ? 0 : 1)) return;
      break;
    case "AMMO":
      if (!P_GiveAmmo(player, AM.am_clip, 5)) return;
      break;
    case "ROCK":
      if (!P_GiveAmmo(player, AM.am_misl, 1)) return;
      break;
    case "BROK":
      if (!P_GiveAmmo(player, AM.am_misl, 5)) return;
      break;
    case "CELL":
      if (!P_GiveAmmo(player, AM.am_cell, 1)) return;
      break;
    case "CELP":
      if (!P_GiveAmmo(player, AM.am_cell, 5)) return;
      break;
    case "SHEL":
      if (!P_GiveAmmo(player, AM.am_shell, 1)) return;
      break;
    case "SBOX":
      if (!P_GiveAmmo(player, AM.am_shell, 5)) return;
      break;
    case "BPAK": {
      if (!player.backpack) {
        for (let i = 0; i < maxAmmo.length; i++) player.maxAmmo[i] = maxAmmo[i] * 2;
        player.backpack = true;
      }
      for (let i = 0; i < maxAmmo.length; i++) P_GiveAmmo(player, i, 1);
      break;
    }
    // --- weapons ---
    case "BFUG":
      if (!P_GiveWeapon(player, WP.wp_bfg, false)) return;
      break;
    case "MGUN":
      if (!P_GiveWeapon(player, WP.wp_chaingun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;
    case "CSAW":
      if (!P_GiveWeapon(player, WP.wp_chainsaw, false)) return;
      break;
    case "LAUN":
      if (!P_GiveWeapon(player, WP.wp_missile, false)) return;
      break;
    case "PLAS":
      if (!P_GiveWeapon(player, WP.wp_plasma, false)) return;
      break;
    case "SHOT":
      if (!P_GiveWeapon(player, WP.wp_shotgun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;
    case "SGN2":
      if (!P_GiveWeapon(player, WP.wp_supershotgun, (special.flags & MF.MF_DROPPED) !== 0)) return;
      break;
    default:
      return;
  }
  if (special.flags & MF.MF_COUNTITEM) player.itemCount++;
  P_RemoveMobj(special);
  player.bonusCount += BONUSADD;
}
function P_KillMobj(source, target) {
  target.flags &= ~(MF.MF_SHOOTABLE | MF.MF_FLOAT | MF.MF_SKULLFLY);
  if (target.type !== MT.MT_SKULL) target.flags &= ~MF.MF_NOGRAVITY;
  target.flags |= MF.MF_CORPSE | MF.MF_DROPOFF;
  target.height >>= 2;
  if (target.player) {
    target.flags &= ~MF.MF_SOLID;
    target.player.state = PST_DEAD;
  }
  const info = mobjInfo[target.type];
  if (target.health < -info.spawnHealth && info.xdeathState) {
    P_SetMobjState(target, info.xdeathState);
  } else {
    P_SetMobjState(target, info.deathState);
  }
  target.tics -= P_Random() & 3;
  if (target.tics < 1) target.tics = 1;
}
function P_SetInterEnv(e) {
  env7 = e;
}
function P_DamageMobj(target, inflictor, source, damage) {
  if (!(target.flags & MF.MF_SHOOTABLE)) return;
  if (target.health <= 0) return;
  if (target.flags & MF.MF_SKULLFLY) {
    target.momx = target.momy = target.momz = 0;
  }
  const player = target.player;
  if (player && env7.skill() === 0) damage >>= 1;
  if (inflictor && !(target.flags & MF.MF_NOCLIP)) {
    let ang = R_PointToAngle2(inflictor.x, inflictor.y, target.x, target.y);
    let thrust = damage * (FRACUNIT >> 3) * 100 / mobjInfo[target.type].mass | 0;
    if (damage < 40 && damage > target.health && target.z - inflictor.z > 64 * FRACUNIT && P_Random() & 1) {
      ang = ang + ANG180 >>> 0;
      thrust *= 4;
    }
    const fine = ang >>> ANGLETOFINESHIFT & FINEMASK;
    target.momx = target.momx + FixedMul(thrust, finecosine[fine]) | 0;
    target.momy = target.momy + FixedMul(thrust, finesine[fine]) | 0;
  }
  if (player) {
    if (damage < 1e3 && (player.cheatGod || player.powers[
      0
      /* invuln */
    ])) return;
    if (player.armorType) {
      let saved = player.armorType === 1 ? Math.floor(damage / 3) : Math.floor(damage / 2);
      if (player.armorPoints <= saved) {
        saved = player.armorPoints;
        player.armorType = 0;
      }
      player.armorPoints -= saved;
      damage -= saved;
    }
    player.health -= damage;
    if (player.health < 0) player.health = 0;
    player.attacker = source;
    player.damageCount += damage;
    if (player.damageCount > 100) player.damageCount = 100;
  }
  target.health -= damage;
  if (target.health <= 0) {
    P_KillMobj(source, target);
    return;
  }
  if (P_Random() < mobjInfo[target.type].painChance && !(target.flags & MF.MF_SKULLFLY)) {
    target.flags |= MF.MF_JUSTHIT;
    P_SetMobjState(target, mobjInfo[target.type].painState);
  }
  target.reactionTime = 0;
  if ((!target.threshold || target.type === MT.MT_VILE) && source && source !== target && source.type !== MT.MT_VILE) {
    target.target = source;
    target.threshold = BASETHRESHOLD;
    if (target.state === mobjInfo[target.type].spawnState && mobjInfo[target.type].seeState !== S.S_NULL) {
      P_SetMobjState(target, mobjInfo[target.type].seeState);
    }
  }
}
var BASETHRESHOLD, armorPointsFor, BONUSADD, env7;
var init_p_inter = __esm({
  "src/p_inter.ts"() {
    "use strict";
    init_m_fixed();
    init_m_random();
    init_info();
    init_p_mobj();
    init_r_point();
    init_tables();
    init_p_user();
    BASETHRESHOLD = 100;
    armorPointsFor = [0, 100, 200];
    BONUSADD = 6;
    env7 = { skill: () => 2 };
  }
});

// src/g_level.ts
var g_level_exports = {};
__export(g_level_exports, {
  G_LoadLevel: () => G_LoadLevel
});
function makeSubSectorAt(map2) {
  const root = map2.nodes.length - 1;
  return (fx, fy) => {
    if (root < 0) return 0;
    const x = fx >> FRACBITS;
    const y = fy >> FRACBITS;
    let n = root;
    while (!(n & 32768)) {
      const nd = map2.nodes[n];
      n = nd.children[(x - nd.x) * nd.dy - (y - nd.y) * nd.dx >= 0 ? 0 : 1];
    }
    return n & 32767;
  };
}
function makeSectorOfSubSector(map2) {
  return (i) => {
    const ss = map2.subSectors[i];
    if (!ss) return 0;
    const sg = map2.segs[ss.firstSeg];
    if (!sg) return 0;
    const ld = map2.lineDefs[sg.lineDef];
    if (!ld) return 0;
    return map2.sideDefs[ld.sideNum[sg.side]]?.sector ?? 0;
  };
}
function G_LoadLevel(wad2, mapName, skill = 2) {
  let playerRef = null;
  let exitRequested = null;
  const map2 = loadMap(wad2, mapName);
  const sim = P_SetupLevel(map2);
  const subSectorAt2 = makeSubSectorAt(map2);
  const sectorOfSS = makeSectorOfSubSector(map2);
  const sectorAt2 = (x, y) => sim.sectors[sectorOfSS(subSectorAt2(x, y))];
  P_InitBlockLinks(map2, { sectorAt: sectorAt2, subSectorAt: subSectorAt2 });
  P_SetMobjEnv({
    sectorAt: sectorAt2,
    subSectorAt: subSectorAt2,
    tryMove: P_TryMove,
    slideMove: P_SlideMove,
    explodeMissile: P_ExplodeMissile
  });
  P_SetMapLevel(sim, {
    sectorAt: sectorAt2,
    useSpecialLine: (thing, line, side) => {
      P_UseSpecialLine(thing, line, side);
    },
    crossSpecialLine: (lineIndex, side, thing) => {
      P_CrossSpecialLine(sim.lines[lineIndex], side, thing);
    },
    touchSpecialThing: P_TouchSpecialThing
  });
  P_SetFloorEnv({ changeSector: P_ChangeSector });
  P_SetFloorLevel(sim);
  P_SetPlatLevel(sim);
  P_SetCeilingLevel(sim);
  P_SetSightLevel(sim);
  P_SetDoorLevel(sim);
  P_SetTeleportEnv(sim, { teleportMove: P_TeleportMove, spawnMobj: P_SpawnMobj });
  P_SetSpecEnv({
    exitLevel: (secret) => {
      exitRequested = secret ? "secret" : "normal";
    },
    teleport: EV_Teleport,
    damageMobj: P_DamageMobj
  });
  P_SetEnemyEnv({
    players: () => [playerRef, null, null, null],
    tryMove: P_TryMove,
    takeSpecHits: P_TakeSpecHits,
    useSpecialLine: (mo2, lineIndex, side) => P_UseSpecialLine(mo2, sim.lines[lineIndex], side),
    aimLineAttack: P_AimLineAttack,
    lineAttack: P_LineAttack,
    damageMobj: P_DamageMobj,
    spawnMissile: P_SpawnMissile,
    spawnMobj: P_SpawnMobj,
    spawnPuff: P_SpawnPuff,
    radiusAttack: P_RadiusAttack,
    setThingPosition: P_SetThingPosition,
    unsetThingPosition: P_UnsetThingPosition,
    gameTic: P_LevelTime,
    lines: () => sim.lines
  });
  P_SetShootEnv({ damageMobj: P_DamageMobj });
  P_SetInterEnv({ skill: () => skill });
  P_SetMissileEnv({ aimLineAttack: P_AimLineAttack, lineTarget: () => lineTarget });
  P_SetPsprEnv({
    aimLineAttack: P_AimLineAttack,
    lineAttack: P_LineAttack,
    lineTarget: () => lineTarget,
    spawnPlayerMissile: P_SpawnPlayerMissile,
    spawnMobj: P_SpawnMobj,
    damageMobj: P_DamageMobj,
    noiseAlert: P_NoiseAlert
  });
  P_SetPsprLevelTime(P_LevelTime);
  P_RegisterActions({ ...MOBJ_ACTIONS, A_BFGSpray });
  P_RegisterWeaponActions(WEAPON_ACTIONS);
  const missing = ACTION_NAMES.filter(
    (n) => !(n in MOBJ_ACTIONS) && !(n in WEAPON_ACTIONS) && n !== "A_BFGSpray"
  );
  if (missing.length) {
    console.warn(`${missing.length} action(s) unimplemented: ${missing.join(", ")}`);
  }
  P_InitThinkers();
  P_ResetLevelTime();
  M_ClearRandom();
  const things = wad2.lumpNum(wad2.getNumForName(mapName) + 1);
  const v = new DataView(things.buffer, things.byteOffset, things.byteLength);
  const MTF_AMBUSH = 8;
  const MTF_NOTSINGLE = 16;
  const skillBit = skill === 0 ? 1 : skill === 4 ? 4 : 1 << skill - 1;
  let startX = 0, startY = 0, startAngle = 0, foundStart = false;
  let totalKills = 0, totalItems = 0;
  for (let i = 0; i + 10 <= things.length; i += 10) {
    const x = v.getInt16(i, true);
    const y = v.getInt16(i + 2, true);
    const angle = v.getInt16(i + 4, true);
    const type = v.getInt16(i + 6, true);
    const options = v.getInt16(i + 8, true);
    if (type === 1) {
      startX = x;
      startY = y;
      startAngle = angle;
      foundStart = true;
      continue;
    }
    if (type <= 4) continue;
    if (options & MTF_NOTSINGLE) continue;
    if (!(options & skillBit)) continue;
    const mi = byDoomedNum.get(type);
    if (mi === void 0) continue;
    const info = mobjInfo[mi];
    const z = info.flags & MF.MF_SPAWNCEILING ? ONCEILINGZ : ONFLOORZ;
    const mobj = P_SpawnMobj(x << FRACBITS, y << FRACBITS, z, mi);
    if (mobj.tics > 0) mobj.tics = 1 + P_Random() % mobj.tics;
    if (info.flags & MF.MF_COUNTKILL) totalKills++;
    if (info.flags & MF.MF_COUNTITEM) totalItems++;
    mobj.angle = ANG45 * (angle / 45 | 0) >>> 0;
    if (options & MTF_AMBUSH) mobj.flags |= MF.MF_AMBUSH;
  }
  if (!foundStart) throw new Error(`${mapName}: no player 1 start`);
  const mo = P_SpawnMobj(startX << FRACBITS, startY << FRACBITS, ONFLOORZ, MT.MT_PLAYER);
  mo.angle = Math.round(startAngle / 360 * 4294967296) >>> 0;
  const player = {
    mo,
    viewZ: 0,
    viewHeight: VIEWHEIGHT,
    deltaViewHeight: 0,
    bob: 0,
    health: 100,
    state: PST_LIVE,
    armorPoints: 0,
    armorType: 0,
    ammo: [50, 0, 0, 0],
    maxAmmo: [...maxAmmo],
    weaponOwned: Array.from({ length: 9 }, (_, i) => i === WP.wp_fist || i === WP.wp_pistol),
    readyWeapon: WP.wp_pistol,
    pendingWeapon: WP_NOCHANGE,
    cards: [false, false, false, false, false, false],
    powers: [0, 0, 0, 0, 0, 0],
    attacker: null,
    damageCount: 0,
    bonusCount: 0,
    killCount: 0,
    itemCount: 0,
    secretCount: 0,
    attackDown: false,
    backpack: false,
    cheatGod: false,
    cheatNoClip: false,
    psprites: newPSprites(),
    extraLight: 0,
    cmd: { forwardMove: 0, sideMove: 0, angleTurn: 0, buttons: 0 },
    refire: 0,
    useDown: false
  };
  playerRef = player;
  mo.player = player;
  P_SetupPsprites(player);
  P_SetLightLevel(sim);
  const totalSecret = P_SpawnLightSpecials();
  return { map: map2, sim, player, subSectorAt: subSectorAt2, sectorAt: sectorAt2, exitRequested: () => exitRequested, totalKills, totalItems, totalSecret };
}
var MOBJ_ACTIONS, WEAPON_ACTIONS;
var init_g_level = __esm({
  "src/g_level.ts"() {
    "use strict";
    init_map();
    init_m_fixed();
    init_p_setup();
    init_p_tick();
    init_p_blockmap();
    init_p_mobj();
    init_p_blockmap();
    init_p_map();
    init_p_telept();
    init_p_pspr();
    init_p_ticker();
    init_p_floor();
    init_p_plats();
    init_p_ceilng();
    init_p_lights();
    init_p_doors();
    init_p_sight();
    init_p_enemy();
    init_p_enemy();
    init_p_pspr();
    init_p_inter();
    init_p_action();
    init_p_spec();
    init_p_ticker();
    init_m_random();
    init_r_point();
    init_p_user();
    init_info();
    init_p_local();
    MOBJ_ACTIONS = {
      A_Look,
      A_Chase,
      A_FaceTarget,
      A_PosAttack,
      A_SPosAttack,
      A_CPosAttack,
      A_CPosRefire,
      A_SpidRefire,
      A_BspiAttack,
      A_TroopAttack,
      A_SargAttack,
      A_HeadAttack,
      A_BruisAttack,
      A_CyberAttack,
      A_SkullAttack,
      A_SkelMissile,
      A_SkelWhoosh,
      A_SkelFist,
      A_Tracer,
      A_FatRaise,
      A_FatAttack1,
      A_FatAttack2,
      A_FatAttack3,
      A_VileStart,
      A_VileTarget,
      A_VileAttack,
      A_VileChase,
      A_StartFire,
      A_Fire,
      A_FireCrackle,
      A_PainAttack,
      A_PainDie,
      A_Explode,
      A_Fall,
      A_Scream,
      A_XScream,
      A_Pain,
      A_PlayerScream,
      A_BossDeath,
      A_KeenDie,
      A_Metal,
      A_BabyMetal,
      A_Hoof,
      A_BrainAwake,
      A_BrainPain,
      A_BrainScream,
      A_BrainExplode,
      A_BrainDie,
      A_BrainSpit,
      A_SpawnSound,
      A_SpawnFly
    };
    WEAPON_ACTIONS = {
      A_WeaponReady,
      A_ReFire,
      A_CheckReload,
      A_Lower,
      A_Raise,
      A_GunFlash,
      A_Punch,
      A_Saw,
      A_FirePistol,
      A_FireShotgun,
      A_FireShotgun2,
      A_FireCGun,
      A_FireMissile,
      A_FirePlasma,
      A_FireBFG,
      A_BFGsound,
      A_OpenShotgun2,
      A_LoadShotgun2,
      A_CloseShotgun2,
      A_Light0,
      A_Light1,
      A_Light2
    };
  }
});

// tools/setupdraws.ts
import { readFileSync } from "node:fs";

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
      let name = "";
      for (let c = 0; c < 8; c++) {
        const ch = this.bytes[e + 8 + c];
        if (ch === 0) break;
        name += String.fromCharCode(ch);
      }
      name = name.toUpperCase();
      this.lumps.push({ name, pos: view.getInt32(e, true), size: view.getInt32(e + 4, true) });
      this.index.set(name, i);
    }
  }
  /** W_CheckNumForName — returns -1 if absent. */
  checkNumForName(name) {
    const i = this.index.get(name.toUpperCase());
    return i === void 0 ? -1 : i;
  }
  /** W_GetNumForName — throws if absent. */
  getNumForName(name) {
    const i = this.checkNumForName(name);
    if (i < 0) throw new Error(`W_GetNumForName: ${name} not found`);
    return i;
  }
  /** W_CacheLumpNum — a view into the WAD, not a copy. Do not mutate. */
  lumpNum(num) {
    const l = this.lumps[num];
    if (!l) throw new Error(`W_CacheLumpNum: ${num} out of range`);
    return this.bytes.subarray(l.pos, l.pos + l.size);
  }
  /** W_CacheLumpName */
  lump(name) {
    return this.lumpNum(this.getNumForName(name));
  }
};

// src/demo.ts
var DEMOMARKER = 128;
var MIN_VERSION = 104;
var MAX_VERSION = 109;
function readDemo(wad2, name) {
  const l = wad2.lump(name);
  if (l.length < 14) throw new Error(`${name}: too short to be a demo`);
  const version = l[0];
  if (version < MIN_VERSION || version > MAX_VERSION) {
    throw new Error(`${name}: demo version ${version} unsupported (want ${MIN_VERSION}-${MAX_VERSION})`);
  }
  const demo2 = {
    name,
    version,
    skill: l[1],
    episode: l[2],
    map: l[3],
    deathmatch: l[4] !== 0,
    respawnParm: l[5] !== 0,
    fastParm: l[6] !== 0,
    noMonsters: l[7] !== 0,
    consolePlayer: l[8],
    playerInGame: [l[9] !== 0, l[10] !== 0, l[11] !== 0, l[12] !== 0],
    cmds: []
  };
  let p = 13;
  while (p < l.length && l[p] !== DEMOMARKER) {
    if (p + 4 > l.length) throw new Error(`${name}: truncated ticcmd at ${p}`);
    demo2.cmds.push({
      // forwardmove/sidemove are signed chars; angleturn is the high byte only.
      forwardMove: l[p] << 24 >> 24,
      sideMove: l[p + 1] << 24 >> 24,
      angleTurn: l[p + 2] << 8,
      buttons: l[p + 3]
    });
    p += 4;
  }
  if (p >= l.length) throw new Error(`${name}: no DEMOMARKER \u2014 truncated`);
  return demo2;
}

// tools/setupdraws.ts
init_m_random();
var buf = readFileSync("./doom1.wad");
var wad = new Wad(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
var demo = readDemo(wad, process.argv[2] ?? "DEMO1");
var out = [];
var { setSpawnLog: setSpawnLog2 } = await Promise.resolve().then(() => (init_p_mobj(), p_mobj_exports));
setSpawnLog2((type, x, y, c) => out.push(`SPWN t=${type} x=${x} y=${y} c=${c}`));
var { G_LoadLevel: G_LoadLevel2 } = await Promise.resolve().then(() => (init_g_level(), g_level_exports));
G_LoadLevel2(wad, `E${demo.episode}M${demo.map}`);
setDrawLog(null);
setSpawnLog2(null);
console.log(out.join("\n"));
