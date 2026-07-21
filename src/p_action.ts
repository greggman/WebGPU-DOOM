// Action function dispatch.
//
// DOOM's state table stores a C function pointer per state; P_SetMobjState
// calls it on entry. That single call is what makes a monster look, chase and
// attack — without it the state machine ticks through its frames and the game
// is a diorama.
//
// We can't store function pointers in generated data, so states carry the
// NAME and this maps it to an implementation. A name with no entry is a
// not-yet-ported gap, not a crash: it's reported once and skipped, so the game
// degrades in a way you can see rather than dying.

import type { PMobj } from './p_local.js';
import { ACTION_NAMES } from './info.js';

export type ActionFn = (mo: PMobj) => void;

const actions = new Map<string, ActionFn>();
const reportedMissing = new Set<string>();

export function P_RegisterActions(table: Record<string, ActionFn>): void {
  for (const [name, fn] of Object.entries(table)) actions.set(name, fn);
}

/** Call a state's action, if we have it. Returns false if it's unimplemented. */
export function P_CallAction(name: string, mo: PMobj): boolean {
  const fn = actions.get(name);
  if (!fn) {
    if (!reportedMissing.has(name)) {
      reportedMissing.add(name);
      console.warn(`action ${name}() not implemented — state will animate but do nothing`);
    }
    return false;
  }
  fn(mo);
  return true;
}

/** Which of the state table's actions are still missing. */
export function P_MissingActions(): string[] {
  return ACTION_NAMES.filter((n) => !actions.has(n));
}

export function P_ActionCoverage(): { implemented: number; total: number } {
  return { implemented: ACTION_NAMES.filter((n) => actions.has(n)).length, total: ACTION_NAMES.length };
}
