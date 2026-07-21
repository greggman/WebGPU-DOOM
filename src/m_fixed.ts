// Fixed-point math. Ported from linuxdoom-1.10/m_fixed.c.
//
// fixed_t is a 32-bit signed int with 16 fractional bits.
//
// 32-bit integer math is exact in JS — |0 and Math.imul give bit-identical
// results to C, which is what asm.js was built on. The catch is that FixedMul
// is NOT a 32-bit operation: it reads bits 16..47 of a 32x32->64 product, and
// JS has no 32x32->64 primitive (Math.imul is 32x32->32 by definition, and
// returns only the low half). This is the same wall asm.js hit — no i64 — and
// the fix is the same one emscripten used: emulate the wide product from 32-bit
// halves.
//
// Get it subtly wrong and nothing crashes. Demos just silently desync a minute
// in and monsters walk through walls.

export const FRACBITS = 16;
export const FRACUNIT = 1 << FRACBITS;

export const MININT = -2147483648;
export const MAXINT = 2147483647;

/**
 * FixedMul: ((long long)a * (long long)b) >> 16.
 *
 * The result needs bits 16..47 of the 64-bit product, so neither obvious
 * translation works:
 *   (a*b) >> 16          — the double product loses bits above 2^53, and >>
 *                          coerces to int32 before shifting anyway.
 *   Math.imul(a,b) >> 16 — bit-exact, but only the LOW 32 bits. FixedMul(2048.0,
 *                          1.5) has a product of 0xc0000000000, whose low 32
 *                          bits are all zero: the answer comes out 0, not 3072.
 *
 * So build the wide product from 16-bit halves, keeping every partial exact:
 *
 *   a = ah*2^16 + al,  b = bh*2^16 + bl        (al, bl unsigned; ah, bh signed)
 *   a*b        = ah*bh*2^32 + (ah*bl + al*bh)*2^16 + al*bl
 *   (a*b)>>16  = ah*bh*2^16 + (ah*bl + al*bh)  + (al*bl)>>16
 *
 * Each term fits int32; the sum is taken mod 2^32 by |0, matching C's wrap.
 * al*bl peaks at 65535*65535 = 4294836225 < 2^32, so >>> 16 is safe on it.
 */
export function FixedMul(a: number, b: number): number {
  const ah = a >> 16, al = a & 0xffff;
  const bh = b >> 16, bl = b & 0xffff;
  return (
    (Math.imul(ah, bh) << 16) +
    Math.imul(ah, bl) +
    Math.imul(al, bh) +
    ((al * bl) >>> 16)
  ) | 0;
}

/**
 * FixedDiv: guards against overflow, then divides in double precision exactly
 * as the C does (m_fixed.c FixedDiv2 uses `double`, not a 64-bit shift — the
 * shift version is #if 0'd out, and the double path is what shipped, so it's
 * what demos depend on).
 */
export function FixedDiv(a: number, b: number): number {
  // Vanilla's overflow test. Note abs(MININT) is still MININT in C's two's
  // complement; Math.abs promotes to +2147483648, so force it back to int32 to
  // keep the comparison identical.
  const absA = Math.abs(a) | 0;
  const absB = Math.abs(b) | 0;
  if ((absA >> 14) >= absB) {
    return (a ^ b) < 0 ? MININT : MAXINT;
  }
  // (fixed_t)c truncates toward zero and wraps to int32.
  return truncInt32((a / b) * FRACUNIT);
}

/** C's `(int)someDouble`: truncate toward zero, then wrap to int32. */
function truncInt32(c: number): number {
  return Math.trunc(c) | 0;
}
