// Shown when WebGPU can't initialise — no `navigator.gpu`, no adapter, or
// `requestDevice` rejected. Points the visitor at the WebGL2 build, which runs
// the same game without WebGPU. Used by the two WebGPU entry points (main.ts,
// main-postprocess.ts); the WebGL2 pages need no such fallback.

/** True when `err` looks like a WebGPU-availability failure (vs. a real bug). */
export function isWebGPUUnavailable(err: unknown): boolean {
  return !navigator.gpu || /webgpu|adapter|requestdevice|gpuadapter/i.test(String(err));
}

/** Replace the page with a friendly "no WebGPU, try WebGL2" message + link.
 *  Carries the `pp=` effect param over (and only that), so a deep link like
 *  `?pp=chrome` lands on the same effect in the WebGL2 build. */
export function showWebGPUFallback(webgl2Href: string): void {
  const pp = new URLSearchParams(location.search).get('pp');
  const href = pp !== null ? `${webgl2Href}?pp=${encodeURIComponent(pp)}` : webgl2Href;
  document.body.innerHTML = `
    <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;
                background:#111;color:#ddd;font:16px/1.5 system-ui,sans-serif;padding:1.5rem;text-align:center">
      <div style="max-width:34rem">
        <div style="font-size:2.5rem;margin-bottom:.5rem">🚫🖥️</div>
        <h1 style="font-size:1.4rem;margin:0 0 .75rem;color:#fff">WebGPU isn't available</h1>
        <p style="margin:0 0 1.25rem">Looks like your browser or device doesn't support WebGPU yet.</p>
        <p style="margin:0">
          <a href="${href}"
             style="display:inline-block;padding:.6rem 1.1rem;border-radius:6px;
                    background:#3355dd;color:#fff;text-decoration:none;font-weight:600">
            Try the WebGL2 version instead →
          </a>
        </p>
      </div>
    </div>`;
}
