// WebGL2 entry point. Identical to the WebGPU entry except for the backend it
// hands the shared game loop.

import { Wad } from '../wad.js';
import { runGame } from '../game.js';
import { createWebGL2Backend } from './backend.js';

const WAD_URL = './doom1.wad';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());
  const renderer = createWebGL2Backend(canvas, wad);
  await runGame(canvas, wad, renderer);
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
