// WebGPU entry point. Creates the WebGPU render backend and hands it to the
// shared game loop (game.ts). The WebGL2 entry (webgl2/main-webgl2.ts) is the
// same three lines with a different backend.

import { Wad } from './wad.js';
import { runGame } from './game.js';
import { createWebGPUBackend } from './webgpu/backend.js';
import { isWebGPUUnavailable, showWebGPUFallback } from './webgpu-fallback.js';

const WAD_URL = './doom1.wad';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());
  const renderer = await createWebGPUBackend(canvas, wad);
  await runGame(canvas, wad, renderer);
}

main().catch((err) => {
  if (isWebGPUUnavailable(err)) { showWebGPUFallback('./index-webgl2.html'); return; }
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
