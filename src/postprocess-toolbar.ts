// Shared wiring for the post-process toolbar (index-postprocess.html and its
// WebGL2 twin). Populates the dropdown from the backend's effect list, keeps the
// src/author/license links in step, honours + syncs ?pp=<name>, and feeds the
// cursor into iMouse. Backend-agnostic: it only touches the PostProcessControl.

import type { PostProcessControl, PostEffectInfo } from './renderer.js';

function setLink(el: HTMLAnchorElement, href: string | undefined, text: string): void {
  el.textContent = href ? text : '';
  el.href = href ?? '';
  el.style.display = href ? '' : 'none';
}

export function wirePostProcessToolbar(canvas: HTMLCanvasElement, pp: PostProcessControl): void {
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

  // iMouse: device-pixel cursor + button, for mouse and touch alike.
  // `touch-action: none` stops the browser claiming a finger DRAG as scroll/zoom
  // (which fires pointercancel and cuts off pointermove); pointer capture keeps
  // events flowing if the finger/cursor leaves the canvas.
  canvas.style.touchAction = 'none';
  const dpr = (): number => Math.min(window.devicePixelRatio, 2);
  let down = false;
  const move = (e: PointerEvent): void => {
    const r = canvas.getBoundingClientRect();
    pp.setMouse((e.clientX - r.left) * dpr(), (e.clientY - r.top) * dpr(), down);
  };
  const release = (e: PointerEvent): void => { down = false; move(e); };
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerdown', (e) => {
    down = true;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* not capturable */ }
    move(e);
  });
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
}
