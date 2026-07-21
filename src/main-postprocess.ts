// WebGPU + post-processing entry point (index-postprocess.html). Same core as
// main.ts, but the backend is built with the G-buffer + filter enabled, and a
// full-width toolbar (dropdown + src/author/license links, ?pp=<name>) chooses
// the effect at runtime. Modelled on greggman/pico-8-post-processing.

import { Wad } from './wad.js';
import { runGame } from './game.js';
import { createWebGPUBackend } from './webgpu/backend.js';
import { createPostProcess } from './webgpu/postprocess.js';
import type { PostEffectInfo } from './renderer.js';

const WAD_URL = './doom1.wad';

function setLink(el: HTMLAnchorElement, href: string | undefined, text: string): void {
  el.textContent = href ? text : '';
  el.href = href ?? '';
  el.style.display = href ? '' : 'none';
}

async function main(): Promise<void> {
  const canvas = document.querySelector<HTMLCanvasElement>('#screen')!;
  const res = await fetch(WAD_URL);
  if (!res.ok) throw new Error(`${WAD_URL}: ${res.status}`);
  const wad = new Wad(await res.arrayBuffer());
  const renderer = await createWebGPUBackend(canvas, wad, { postProcessFactory: createPostProcess });

  const pp = renderer.postProcess!;
  const sel = document.querySelector<HTMLSelectElement>('#pp')!;
  const srcEl = document.querySelector<HTMLAnchorElement>('#src')!;
  const authorEl = document.querySelector<HTMLAnchorElement>('#author')!;
  const licenseEl = document.querySelector<HTMLAnchorElement>('#license')!;

  const byName = new Map<string, PostEffectInfo>();
  for (const info of pp.effects) {
    byName.set(info.name, info);
    const o = document.createElement('option');
    o.value = info.name; o.textContent = info.name;
    sel.appendChild(o);
  }

  function showMeta(name: string): void {
    const info = byName.get(name);
    setLink(srcEl, info?.src, 'src');
    setLink(authorEl, info?.authorUrl ?? (info?.author ? '#' : undefined), info?.author ?? '');
    setLink(licenseEl, info?.licenseUrl ?? (info?.license ? '#' : undefined), info?.license ?? '');
  }

  function choose(name: string, updateUrl: boolean): void {
    pp.setEffect(name);
    sel.value = pp.current();
    showMeta(pp.current());
    if (updateUrl) {
      const q = new URLSearchParams(location.search);
      q.set('pp', pp.current());
      history.replaceState(null, '', `?${q.toString()}`);
    }
  }

  const wanted = new URLSearchParams(location.search).get('pp');
  choose(wanted && byName.has(wanted) ? wanted : pp.current(), false);
  sel.addEventListener('change', () => { choose(sel.value, true); canvas.focus(); });

  // iMouse: device-pixel cursor + button, matching fragCoord space.
  const dpr = (): number => Math.min(window.devicePixelRatio, 2);
  let down = false;
  const move = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    pp.setMouse((e.clientX - r.left) * dpr(), (e.clientY - r.top) * dpr(), down);
  };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', (e) => { down = true; move(e); });
  addEventListener('pointerup', () => { down = false; });

  await runGame(canvas, wad, renderer);
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f44;padding:1rem;white-space:pre-wrap">${err}\n\n${(err as Error).stack ?? ''}</pre>`;
  console.error(err);
});
