// The sim-facing sound API (s_sound.c's public surface). It is deliberately
// PURE: until a browser audio backend registers via setSoundBackend, every call
// is a no-op. That keeps the headless oracle (timedemo/demotrace) silent AND
// guarantees wiring these calls into the playsim can never shift a P_Random
// draw — sound SELECTION (which does draw) already happens in the action
// functions; this is only playback.

/** Anything with a world position can emit a sound: a mobj, or a sector's
 *  centre (doors/lifts). A truthy `player` marks the local listener (full
 *  volume, no attenuation). */
export interface SoundOrigin {
  x: number;
  y: number;
  player?: unknown;
}

export interface SoundBackend {
  /** origin gives the sound a world position for distance attenuation; null is
   *  full volume (UI, or the local player's own weapon). */
  startSound(origin: SoundOrigin | null, sfx: string): void;
  changeMusic(name: string, loop: boolean): void;
  stopMusic(): void;
}

let backend: SoundBackend | null = null;
export function setSoundBackend(b: SoundBackend | null): void { backend = b; }

export function S_StartSound(origin: SoundOrigin | null, sfx: string): void {
  backend?.startSound(origin, sfx);
}
/** Play at a fixed world point — the sector-centre origin for doors/lifts. */
export function S_StartSoundAt(x: number, y: number, sfx: string): void {
  backend?.startSound({ x, y }, sfx);
}
export function S_ChangeMusic(name: string, loop: boolean): void {
  backend?.changeMusic(name, loop);
}
export function S_StopMusic(): void {
  backend?.stopMusic();
}
