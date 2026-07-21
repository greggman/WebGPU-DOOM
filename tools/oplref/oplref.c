/* Reference OPL render: replay the register-write stream captured from our TS
 * sequencer (D_E1M1.oplcap) through Nuked-OPL3 (cycle-exact YMF262) and write a
 * WAV. If this sounds full/correct and ours doesn't, our synth (opl2.ts) is the
 * culprit; if this is ALSO thin, our sequencing (music.ts) is.
 *   oplref D_E1M1.oplcap D_E1M1.ref.wav
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "opl3.h"

static uint8_t *slurp(const char *path, long *len) {
  FILE *f = fopen(path, "rb");
  if (!f) { fprintf(stderr, "cannot open %s\n", path); exit(1); }
  fseek(f, 0, SEEK_END); *len = ftell(f); fseek(f, 0, SEEK_SET);
  uint8_t *b = (uint8_t *)malloc(*len);
  fread(b, 1, *len, f); fclose(f); return b;
}

static uint32_t u32(const uint8_t *p) { return p[0] | (p[1]<<8) | (p[2]<<16) | ((uint32_t)p[3]<<24); }
static uint16_t u16(const uint8_t *p) { return p[0] | (p[1]<<8); }

int main(int argc, char **argv) {
  if (argc < 3) { fprintf(stderr, "usage: oplref in.oplcap out.wav\n"); return 1; }
  long flen; uint8_t *d = slurp(argv[1], &flen);
  if (memcmp(d, "OPLC", 4) != 0) { fprintf(stderr, "bad magic\n"); return 1; }
  uint32_t rate = u32(d + 4), N = u32(d + 8), count = u32(d + 12);
  const uint8_t *rec = d + 16;
  printf("rate=%u samples=%u writes=%u\n", rate, N, count);

  opl3_chip chip;
  OPL3_Reset(&chip, rate);
  /* Pure replay: the sequencer now emits OPL3-enable (0x105), vibrato depth
   * (0xBD) and the C0 L/R bits itself, so we inject nothing here. */

  /* debug: show first writes + count key-ons */
  uint32_t keyons = 0;
  for (uint32_t i = 0; i < count; i++) {
    const uint8_t *r = rec + (size_t)i * 7;
    uint16_t reg = u16(r + 4);
    if ((reg & 0xf0) == 0xb0 && (r[6] & 0x20)) keyons++;
    if (i < 8) printf("  w[%u] t=%u reg=0x%03x val=0x%02x\n", i, u32(r), reg, r[6]);
  }
  printf("key-on writes=%u\n", keyons);

  int16_t *pcm = (int16_t *)malloc((size_t)N * 2); /* mono out */
  uint32_t wi = 0; /* next write index */
  int32_t maxamp = 0;
  for (uint32_t t = 0; t < N; t++) {
    while (wi < count) {
      const uint8_t *r = rec + (size_t)wi * 7;
      if (u32(r) != t) break;
      OPL3_WriteReg(&chip, u16(r + 4), r[6]);
      wi++;
    }
    int16_t buf[2];
    OPL3_GenerateResampled(&chip, buf);
    pcm[t] = buf[0]; /* left channel */
    int32_t a = buf[0] < 0 ? -buf[0] : buf[0];
    if (a > maxamp) maxamp = a;
  }
  printf("max|sample|=%d\n", maxamp);

  /* 16-bit mono WAV */
  FILE *o = fopen(argv[2], "wb");
  uint32_t dataBytes = N * 2, hdr = 36 + dataBytes, br = rate * 2;
  fwrite("RIFF", 1, 4, o); fwrite(&hdr, 4, 1, o); fwrite("WAVE", 1, 4, o);
  fwrite("fmt ", 1, 4, o); uint32_t f16 = 16; fwrite(&f16, 4, 1, o);
  uint16_t pcmfmt = 1, chans = 1, ba = 2, bps = 16; uint32_t sr = rate;
  fwrite(&pcmfmt, 2, 1, o); fwrite(&chans, 2, 1, o); fwrite(&sr, 4, 1, o);
  fwrite(&br, 4, 1, o); fwrite(&ba, 2, 1, o); fwrite(&bps, 2, 1, o);
  fwrite("data", 1, 4, o); fwrite(&dataBytes, 4, 1, o);
  fwrite(pcm, 2, N, o); fclose(o);
  printf("wrote %s (%u writes applied)\n", argv[2], wi);
  return 0;
}
