// The thinker list. Ported from linuxdoom-1.10/p_tick.c.
//
// Vanilla runs a circular doubly-linked list and defers removal by setting
// function = -1, so P_RemoveThinker during iteration can't corrupt the walk.
// We keep an array plus a removed flag and compact after the pass, which
// preserves the two things that matter: iteration ORDER, and the rule that a
// thinker removed mid-tic still gets skipped rather than shifting its
// neighbours. Order matters because every thinker that draws P_Random moves the
// shared sequence — reorder them and demos desync.

export interface Thinker {
  /** Set instead of splicing, so removal during a tic can't disturb the walk. */
  removed: boolean;
  /** null means "no behaviour" — vanilla's function = NULL. */
  tick: (() => void) | null;
}

let thinkers: Thinker[] = [];
/** True while P_RunThinkers is walking, so removals defer to the compaction. */
let running = false;

/** P_InitThinkers — called per level. */
export function P_InitThinkers(): void {
  thinkers = [];
  running = false;
}

/** P_AddThinker. Appends: spawn order IS execution order. */
export function P_AddThinker(t: Thinker): void {
  thinkers.push(t);
}

/**
 * P_RemoveThinker. Vanilla only marks; the list is compacted later. Removing
 * immediately would shift the array under an in-progress walk and silently skip
 * whichever thinker slid into the vacated slot.
 */
export function P_RemoveThinker(t: Thinker): void {
  t.removed = true;
}

/** P_RunThinkers. */
export function P_RunThinkers(): void {
  running = true;
  // Index-based, and re-read length each step: thinkers spawned during the tic
  // (a fired projectile, a spawned puff) are appended and DO run this same tic
  // in vanilla, because the new node lands before the list head is revisited.
  for (let i = 0; i < thinkers.length; i++) {
    const t = thinkers[i];
    if (t.removed) continue;
    if (t.tick) t.tick();
  }
  running = false;

  // Compact once, after the walk.
  let any = false;
  for (const t of thinkers) if (t.removed) { any = true; break; }
  if (any) thinkers = thinkers.filter((t) => !t.removed);
}

/** Test/debug: current live thinker count. */
export function thinkerCount(): number {
  return thinkers.reduce((n, t) => n + (t.removed ? 0 : 1), 0);
}

export function allThinkers(): readonly Thinker[] {
  return thinkers;
}

export function thinkersRunning(): boolean {
  return running;
}
