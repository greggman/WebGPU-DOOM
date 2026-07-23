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

/** A shader compile error, positioned for inline display in the editor. Line and
 *  column are 1-based and editor-relative (the harness preamble is subtracted). */
export interface ShaderError {
  line: number;
  col: number;
  message: string;
  /** 'compile' (default) for shader errors, 'resource' for iChannel load failures. */
  kind?: 'compile' | 'resource';
}

/** Attribution shown in the post-process toolbar. */
export interface PostEffectInfo {
  name: string;
  author?: string;
  authorUrl?: string;
  src?: string;
  license?: string;
  licenseUrl?: string;
  /** Selectable via ?pp=<name> but omitted from the toolbar dropdown. */
  hidden?: boolean;
}

/** Runtime control of the post-process filter (index-postprocess.html). Present
 *  only on a post-process-enabled backend; undefined otherwise. */
export interface PostProcessControl {
  readonly effects: PostEffectInfo[];
  /** Shader language the editor edits: WGSL (WebGPU) or GLSL (WebGL2). */
  readonly language: 'wgsl' | 'glsl';
  current(): string;
  setEffect(name: string): void;
  /** Cursor for iMouse (device px, button state). */
  setMouse(x: number, y: number, down: boolean): void;
  /** Per-frame camera, for world-position reconstruction (iWorldPos). Basis
   *  vectors are the view matrix's rows; tanX/tanY are tan(halfFov) per axis. */
  setCamera(pos: number[], right: number[], up: number[], fwd: number[], tanX: number, tanY: number): void;
  /** The editable shader body for an effect (its `mainImage` + helpers). */
  sourceOf(name: string): string;
  /** Compile `source` and run it live as a "custom" effect. Resolves to an empty
   *  array on success, or the list of compile errors to display. Leaves the
   *  running effect unchanged when there are errors. */
  setCustomSource(source: string): Promise<ShaderError[]>;
}

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
  /** Post-process filter control, when the backend was built with it enabled. */
  readonly postProcess?: PostProcessControl;

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
