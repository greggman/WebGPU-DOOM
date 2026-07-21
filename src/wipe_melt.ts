// The column state machine behind DOOM's screen "melt" (f_wipe.c), with no GPU
// dependency so both render backends share one implementation. The GPU side —
// snapshotting the old screen and compositing it over the new one — lives in
// each backend's wipe (webgpu: wipe.ts, webgl2: webgl2/wipe.ts).
//
// A melt cuts the 320-wide screen into 160 columns that slide the old screen
// downward at staggered, ramping speeds. Its own tiny PRNG (never P_Random) keeps
// demo playback bit-identical.

export const NCOLS = 160;        // DOOM melts width/2 columns of a 320-wide screen
export const MELT_H = 200;       // DOOM screen height, the melt's vertical unit
export const WIPE_TIC_MS = 1000 / 35;

export interface MeltColumns {
  /** Per-column offset in DOOM units, -16..MELT_H. */
  readonly y: Int16Array;
  /** wipe_initMelt: seed the ragged starting edge near the top. */
  init(): void;
  /** wipe_doMelt, one 35Hz tic. Returns true once every column hits the bottom. */
  step(): boolean;
  /** Fill `out` (length NCOLS) with the offsets normalised to 0..1. */
  normalized(out: Float32Array): void;
}

export function createMeltColumns(): MeltColumns {
  // A small self-contained PRNG so the stagger never touches the sim's P_Random.
  let seed = 0x1d872b41;
  const rnd = (): number => {
    seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff;
    return (seed >> 16) & 0xff;
  };

  const y = new Int16Array(NCOLS);

  return {
    y,
    // Column 0 gets a small random head start; each next column drifts by -1..+1
    // from the previous, clamped so the row starts near the top with a ragged edge.
    init(): void {
      y[0] = -(rnd() % 16);
      for (let i = 1; i < NCOLS; i++) {
        let v = y[i - 1] + ((rnd() % 3) - 1);
        if (v > 0) v = 0;
        else if (v === -16) v = -15;
        y[i] = v;
      }
    },
    // Negative columns count up (their delay), then each accelerates (dy ramps to
    // 8) until it reaches the bottom.
    step(): boolean {
      let done = true;
      for (let i = 0; i < NCOLS; i++) {
        if (y[i] < 0) { y[i]++; done = false; }
        else if (y[i] < MELT_H) {
          let dy = y[i] < 16 ? y[i] + 1 : 8;
          if (y[i] + dy >= MELT_H) dy = MELT_H - y[i];
          y[i] += dy;
          done = false;
        }
      }
      return done;
    },
    normalized(out: Float32Array): void {
      for (let i = 0; i < NCOLS; i++) {
        const v = y[i] <= 0 ? 0 : y[i] / MELT_H;
        out[i] = v > 1 ? 1 : v;
      }
    },
  };
}
