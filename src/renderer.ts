// The backend seam. The game loop (src/game.ts) is written against this
// interface; src/webgpu/ and src/webgl2/ each provide an implementation. Only
// GPU work crosses it — sim, input, geometry and data stay backend-agnostic.
//
// The per-frame contract is primitive-based, mirroring the draw order the game
// already issues (begin → sky → world → sprites → HUD batches, or the automap in
// place of the 3D view → present), so the loop reads the same in both backends
// and neither owns a copy of the frame graph.

import type { IndexedImage } from './patch.js';
import type { Quad } from './hud2d.js';
import type { LevelGeometry } from './level.js';
import type { PLine, PMobj } from './p_local.js';

/** Sprite instance = 6 floats: worldX, worldY(up), worldZ, atlasLayer, flip bits
 *  (bit0 mirror, bit1 MF_SHADOW), light row (-1 = fullbright). Shared by both
 *  billboard shaders, so the game builds the array once. */
export const SPRITE_FLOATS = 6;

/** The overhead automap. State/logic is trivial; prepare/draw touch the GPU. */
export interface AutomapControl {
  readonly active: boolean;
  toggle(): void;
  key(code: string): boolean;
  cheatCycle(): void;
  prepare(lines: PLine[], player: PMobj, things: Iterable<PMobj>, aspect: number, allmap: boolean): void;
}

export interface Renderer {
  /** Decoded HUD patches, so the game can size/position Quads (drawText etc.). */
  readonly patchOf: Map<string, IndexedImage>;
  /** Drawing-buffer size in device pixels, refreshed by resize(). */
  readonly width: number;
  readonly height: number;
  readonly automap: AutomapControl;

  /** Atlas layer for a sprite lump name, or undefined if absent. */
  spriteLayerOf(name: string): number | undefined;
  /** Sync the drawing buffer to the canvas/DPR. */
  resize(): void;
  /** (Re)build per-level GPU resources; destroys the previous level's set. */
  setLevel(geo: LevelGeometry, sectorCount: number): void;
  /** Re-upload the level vertices after a door/lift moved a sector. */
  updateGeometry(geo: LevelGeometry): void;
  /** A screen melt is animating — the game freezes the sim while it plays. */
  isMelting(): boolean;
  /** Request a melt on the next present (a screen changed). */
  requestWipe(): void;

  /** Begin the scene pass (into the offscreen melt target). */
  beginFrame(clearMagenta: boolean): void;
  /** Reset the HUD batch cursor (once, after beginFrame, before HUD batches). */
  hudBeginFrame(): void;
  /** Full-screen sky behind the world (skip by not calling it). */
  drawSky(right: number[], up: number[], forward: number[], tanHalfY: number, aspect: number, skyLayer: number): void;
  /** Level geometry with live sector light and the animation redirect. */
  drawWorld(mvp: Float32Array, paletteRow: number, fixedMap: number, extralight: number,
    sectorLight: Float32Array<ArrayBuffer>, texTrans: Uint32Array<ArrayBuffer>): void;
  /** Billboards. `instances` holds count*SPRITE_FLOATS; cameraRight orients them. */
  drawSprites(instances: Float32Array<ArrayBuffer>, count: number, cameraRight: number[]): void;
  /** The overhead automap, replacing the 3D view. */
  drawAutomap(): void;
  /** A batch of 320x200 HUD quads with a palette-tint row. */
  drawHud(quads: Quad[], paletteRow: number): void;
  /** Blit the scene to the swapchain, or melt the previous frame over it. */
  present(dtMs: number): void;
}
