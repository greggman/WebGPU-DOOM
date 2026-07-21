// WebGPU + post-processing entry point (index-postprocess.html). Same core as
// main.ts, but the backend is built with the G-buffer + filter enabled, and a
// full-width toolbar (dropdown + src/author/license links, ?pp=<name>) chooses
// the effect at runtime. Modelled on greggman/pico-8-post-processing.

import { Wad } from './wad.js';
import { runGame } from './game.js';
import { createWebGPUBackend } from './webgpu/backend.js';
import { createPostProcess } from './webgpu/postprocess.js';
import { wirePostProcessToolbar } from './postprocess-toolbar.js';

const WAD_URL = './doom1.wad';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());
  const renderer = await createWebGPUBackend(canvas, wad, { postProcessFactory: createPostProcess });
  wirePostProcessToolbar(canvas, renderer.postProcess!);
  await runGame(canvas, wad, renderer);
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
