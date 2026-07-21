import * as esbuild from 'esbuild';
import { gzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import http from 'node:http';

const opts = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  format: 'esm',
  target: 'es2022',
  outfile: 'dist/doom.js',
  sourcemap: true,
  logLevel: 'info',
};

// The music synth runs in an AudioWorklet, which must be a separate script.
// IIFE (not ESM) so it loads as a plain worklet module in every browser.
const workletOpts = {
  entryPoints: ['src/music-worklet.ts'],
  bundle: true,
  format: 'iife',
  target: 'es2022',
  outfile: 'dist/music-worklet.js',
  sourcemap: true,
  logLevel: 'info',
};

const arg = process.argv[2];

if (arg === '--watch') {
  const ctx = await esbuild.context(opts);
  const wctx = await esbuild.context(workletOpts);
  await ctx.watch();
  await wctx.watch();
} else if (arg === '--serve') {
  const ctx = await esbuild.context(opts);
  const wctx = await esbuild.context(workletOpts);
  await ctx.watch();
  await wctx.watch();

  const { hosts, port } = await ctx.serve({ servedir: '.', host: '127.0.0.1', port: 8000 });
  // Proxy on 8080 that rewrites Host to something esbuild accepts
  const target = `127.0.0.1:${port}`
  const HOP = new Set(['connection','keep-alive','transfer-encoding','upgrade',
    'proxy-connection','te','trailer','proxy-authenticate','proxy-authorization'])

  http.createServer((req, res) => {
    const proxyReq = http.request(
      { host: '127.0.0.1', port, path: req.url, method: req.method,
        headers: { ...req.headers, host: target } },
      proxyRes => {
        const clean = {}
        for (const [k, v] of Object.entries(proxyRes.headers)) {
          if (!HOP.has(k.toLowerCase())) clean[k] = v
        }
        res.writeHead(proxyRes.statusCode ?? 502, clean)
        proxyRes.pipe(res, { end: true })
      }
    )
    proxyReq.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('proxy error') })
    req.pipe(proxyReq, { end: true })
  }).listen(8080, '127.0.0.1', () => console.log('proxy on 8080 ->', target));

} else {
  await esbuild.build({ ...opts, minify: true, sourcemap: false });
  await esbuild.build({ ...workletOpts, minify: true, sourcemap: false });
  const kb = (n) => (n / 1024).toFixed(1).padStart(7) + ' KB';
  for (const f of ['dist/doom.js', 'dist/music-worklet.js']) {
    const raw = readFileSync(f);
    const gz = gzipSync(raw, { level: 9 });
    console.log(`\n  ${f}\n  minified ${kb(raw.length)}\n  gzipped  ${kb(gz.length)}`);
  }
  console.log();
}
