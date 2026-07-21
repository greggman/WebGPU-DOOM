// Ported from linuxdoom-1.10/m_random.c.
//
// DOOM's randomness is a fixed 256-byte table walked by an index — not a
// generator. That's what makes demos reproducible: the whole game state is a
// pure function of the input stream, and every P_Random draw is determined by
// how many draws came before it. Draw once too many or too few anywhere in the
// playsim and the demo desyncs from that tic onward, however correct the rest
// of the code is.
//
// P_Random and M_Random walk SEPARATE indices. P_Random is the gameplay one
// (demo-critical); M_Random is for menus and anything outside the sim, so
// calling the wrong one silently corrupts demo sync.

// prettier-ignore
const rndtable: readonly number[] = [
    0,   8, 109, 220, 222, 241, 149, 107,  75, 248, 254, 140,  16,  66,
   74,  21, 211,  47,  80, 242, 154,  27, 205, 128, 161,  89,  77,  36,
   95, 110,  85,  48, 212, 140, 211, 249,  22,  79, 200,  50,  28, 188,
   52, 140, 202, 120,  68, 145,  62,  70, 184, 190,  91, 197, 152, 224,
  149, 104,  25, 178, 252, 182, 202, 182, 141, 197,   4,  81, 181, 242,
  145,  42,  39, 227, 156, 198, 225, 193, 219,  93, 122, 175, 249,   0,
  175, 143,  70, 239,  46, 246, 163,  53, 163, 109, 168, 135,   2, 235,
   25,  92,  20, 145, 138,  77,  69, 166,  78, 176, 173, 212, 166, 113,
   94, 161,  41,  50, 239,  49, 111, 164,  70,  60,   2,  37, 171,  75,
  136, 156,  11,  56,  42, 146, 138, 229,  73, 146,  77,  61,  98, 196,
  135, 106,  63, 197, 195,  86,  96, 203, 113, 101, 170, 247, 181, 113,
   80, 250, 108,   7, 255, 237, 129, 226,  79, 107, 112, 166, 103, 241,
   24, 223, 239, 120, 198,  58,  60,  82, 128,   3, 184,  66, 143, 224,
  145, 224,  81, 206, 163,  45,  63,  90, 168, 114,  59,  33, 159,  95,
   28, 139, 123,  98, 125, 196,  15,  70, 194, 253,  54,  14, 109, 226,
   71,  17, 161,  93, 186,  87, 244, 138,  20,  52, 123, 251,  26,  36,
   17,  46,  52, 231, 232,  76,  31, 221,  84,  37, 216, 165, 212, 106,
  197, 242,  98,  43,  39, 175, 254, 145, 190,  84, 118, 222, 187, 136,
  120, 163, 236, 249,
];

let rndIndex = 0;
let prndIndex = 0;
// Monotonic count of P_Random draws since level start. NOT part of the sim —
// diagnostics only (the desync oracle compares draws-per-tic). Masking prndIndex
// to a byte hides how many draws actually happened; this doesn't.
let prndCount = 0;

// Debug-only: when set, every P_Random draw is logged (draw#, value). Used by
// the demo-sync tooling to diff our draw sequence against the vanilla reference.
let drawLog: ((n: number, v: number) => void) | null = null;
export function setDrawLog(fn: ((n: number, v: number) => void) | null): void {
  drawLog = fn;
}

/** Gameplay RNG. Demo-critical: every call advances the shared sequence. */
export function P_Random(): number {
  prndIndex = (prndIndex + 1) & 0xff;
  prndCount++;
  const v = rndtable[prndIndex];
  drawLog?.(prndCount, v);
  return v;
}

/** Test/debug only: total P_Random draws since the last M_ClearRandom. */
export function pRandomCount(): number {
  return prndCount;
}

/** Non-gameplay RNG (menus, screen wipe). Never call this from the playsim. */
export function M_Random(): number {
  rndIndex = (rndIndex + 1) & 0xff;
  return rndtable[rndIndex];
}

/** g_game.c calls this when a level starts — demos rely on it. */
export function M_ClearRandom(): void {
  rndIndex = 0;
  prndIndex = 0;
}

/** Test/debug only: inspect the sequence position without disturbing it. */
export function randomIndices(): { rndIndex: number; prndIndex: number } {
  return { rndIndex, prndIndex };
}

export const RNDTABLE_SIZE = rndtable.length;
