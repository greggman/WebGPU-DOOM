// WebGL2 + post-processing entry (index-postprocess-webgl2.html). The WebGL2 twin
// of main-postprocess.ts: same shared game loop and toolbar, GLSL effects.

import { Wad } from '../wad.js';
import { runGame } from '../game.js';
import { createWebGL2Backend } from './backend.js';
import { createWebGL2PostProcess } from './postprocess.js';
import { wirePostProcessToolbar } from '../postprocess-toolbar.js';
import { wirePostProcessEditor } from '../postprocess-editor.js';

const WAD_URL = './doom1.wad';

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());
  const renderer = createWebGL2Backend(canvas, wad, { postProcessFactory: createWebGL2PostProcess });
  wirePostProcessToolbar(canvas, renderer.postProcess!);
  wirePostProcessEditor(canvas, renderer.postProcess!);
  await runGame(canvas, wad, renderer);
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
