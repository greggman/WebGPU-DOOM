// WebGPU implementation of the Renderer seam. Everything GPU that used to live
// inline in main.ts is here: device/context, the four passes (world, sky,
// sprites, HUD), the palette/colormap textures, the screen-melt and automap, and
// the per-level resources (atlas, vertex buffer, sector-light and animation
// buffers, bind groups). The game loop drives it entirely through Renderer.

import { createPass, writeGlobals } from '../render.js';
import { createSkyPass, writeSkyGlobals } from '../sky.js';
import { createBillboardPass, INSTANCE_STRIDE } from '../billboard.js';
import { createHud2D } from '../hud2d.js';
import { createWipe } from '../wipe.js';
import { createAutomap } from '../automap.js';
import { createPaletteResources } from '../palette.js';
import { buildTextureArray, type TextureArray } from '../textures.js';
import { spriteTextures } from '../things.js';
import { initSpriteDefs } from '../sprites.js';
import { statusBarLumps, weaponSpriteLumps, fontLumps } from '../st_stuff.js';
import { menuLumps } from '../m_menu.js';
import { wiLumps } from '../wi_stuff.js';
import { allThinkers } from '../p_tick.js';
import type { Wad } from '../wad.js';
import type { LevelGeometry } from '../level.js';
import type { Renderer, AutomapControl } from '../renderer.js';

interface LevelGpu {
  atlas: TextureArray;
  vbo: GPUBuffer;
  vboCapacity: number;
  count: number;
  sectorLightBuf: GPUBuffer;
  texTransBuf: GPUBuffer;
  bindGroup: GPUBindGroup;
  skyBindGroup: GPUBindGroup;
  spriteBindGroup: GPUBindGroup;
  spriteLayer: Map<string, number>;
}

export async function createWebGPUBackend(canvas: HTMLCanvasElement, wad: Wad): Promise<Renderer> {
  if (!navigator.gpu) throw new Error('WebGPU not available in this browser');
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) throw new Error('no WebGPU adapter');

  // Ask for as many array layers as the adapter has (spec min is 256; a level
  // needs up to 562). Typical desktop/mobile GPUs expose 2048.
  const NEEDED_LAYERS = 600;
  const wantLayers = Math.min(adapter.limits.maxTextureArrayLayers, 1024);
  const device = await adapter.requestDevice({ requiredLimits: { maxTextureArrayLayers: wantLayers } });
  if (device.limits.maxTextureArrayLayers < NEEDED_LAYERS) {
    console.warn(`maxTextureArrayLayers is ${device.limits.maxTextureArrayLayers}; levels need up to 562.`);
  }

  const fatal = (msg: string): void => {
    console.error(msg);
    const el = document.createElement('pre');
    el.style.cssText = 'position:fixed;top:0;left:0;right:0;margin:0;padding:8px;z-index:99;' +
      'background:#600;color:#fff;font:12px monospace;white-space:pre-wrap';
    el.textContent = msg;
    document.body.appendChild(el);
  };
  device.lost.then((info) => fatal(`WebGPU DEVICE LOST: ${info.reason} — ${info.message}`));
  device.addEventListener('uncapturederror', (e) => console.error('WebGPU error:', (e as GPUUncapturedErrorEvent).error));

  const context = canvas.getContext('webgpu')!;
  const format = navigator.gpu.getPreferredCanvasFormat();
  context.configure({ device, format, alphaMode: 'opaque' });

  const wipe = createWipe(device, format);
  const automapCtl = createAutomap(device, format);
  const { paletteTex, colormapTex } = createPaletteResources(device, wad);
  const pass = createPass(device, format);
  const skyPass = createSkyPass(device, format);
  const spritePass = createBillboardPass(device, format);
  const spriteDefs = initSpriteDefs(wad);
  const sprTex = spriteTextures(wad, spriteDefs); // same for every level; decode once
  const hud = createHud2D(device, format, paletteTex.createView(), wad,
    ['TITLEPIC', 'CREDIT', ...statusBarLumps(), ...weaponSpriteLumps(), ...menuLumps(), ...fontLumps(), ...wiLumps()]);

  const MAX_SPRITES = 1024;
  const instanceBuf = device.createBuffer({
    label: 'sprite-instances', size: MAX_SPRITES * INSTANCE_STRIDE,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });
  const camScratch = new Float32Array(4);

  let depth: GPUTexture | null = null;
  let width = 0, height = 0;
  let gpu: LevelGpu | null = null;
  let enc: GPUCommandEncoder | null = null;
  let rp: GPURenderPassEncoder | null = null;

  function resize(): void {
    const dpr = Math.min(window.devicePixelRatio, 2);
    width = canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    height = canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    depth?.destroy();
    depth = device.createTexture({ size: [width, height], format: 'depth24plus', usage: GPUTextureUsage.RENDER_ATTACHMENT });
    wipe.resize(width, height);
  }

  function setLevel(geo: LevelGeometry, sectorCount: number): void {
    if (gpu) {
      gpu.atlas.texture.destroy(); gpu.atlas.sizes.destroy();
      gpu.vbo.destroy(); gpu.sectorLightBuf.destroy(); gpu.texTransBuf.destroy();
    }
    const spriteLayer = new Map<string, number>();
    for (let i = 0; i < sprTex.length; i++) spriteLayer.set(sprTex[i].name, geo.textures.length + i);
    const atlas = buildTextureArray(device, [...geo.textures, ...sprTex]);

    const vboCapacity = Math.ceil(geo.vertices.byteLength * 1.5);
    const vbo = device.createBuffer({ label: 'level', size: vboCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(vbo, 0, geo.vertices);

    const sectorLightBuf = device.createBuffer({ label: 'sector-light', size: Math.max(16, sectorCount * 4), usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });

    const texTransData = new Uint32Array(geo.textures.length);
    for (let i = 0; i < texTransData.length; i++) texTransData[i] = i;
    const texTransBuf = device.createBuffer({ label: 'tex-translation', size: Math.max(16, texTransData.byteLength), usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(texTransBuf, 0, texTransData);

    const bindGroup = device.createBindGroup({
      layout: pass.layout,
      entries: [
        { binding: 0, resource: { buffer: pass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: colormapTex.createView() },
        { binding: 3, resource: atlas.texture.createView() },
        { binding: 4, resource: { buffer: atlas.sizes } },
        { binding: 5, resource: { buffer: sectorLightBuf } },
        { binding: 6, resource: { buffer: texTransBuf } },
      ],
    });
    const skyBindGroup = device.createBindGroup({
      layout: skyPass.layout,
      entries: [
        { binding: 0, resource: { buffer: skyPass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: atlas.texture.createView() },
        { binding: 3, resource: { buffer: atlas.sizes } },
      ],
    });
    const spriteBindGroup = device.createBindGroup({
      layout: spritePass.layout,
      entries: [
        { binding: 0, resource: { buffer: pass.globals } },
        { binding: 1, resource: paletteTex.createView() },
        { binding: 2, resource: colormapTex.createView() },
        { binding: 3, resource: atlas.texture.createView() },
        { binding: 4, resource: { buffer: atlas.sizes } },
        { binding: 5, resource: { buffer: spritePass.camera } },
      ],
    });

    gpu = { atlas, vbo, vboCapacity, count: geo.count, sectorLightBuf, texTransBuf, bindGroup, skyBindGroup, spriteBindGroup, spriteLayer };
    console.log(`${geo.count / 3} tris, ${atlas.layerCount} layers, ${allThinkers().length} thinkers`);
  }

  function updateGeometry(geo: LevelGeometry): void {
    if (!gpu) return;
    if (geo.vertices.byteLength > gpu.vboCapacity) {
      gpu.vboCapacity = Math.ceil(geo.vertices.byteLength * 1.5);
      gpu.vbo.destroy();
      gpu.vbo = device.createBuffer({ label: 'level', size: gpu.vboCapacity, usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST });
    }
    device.queue.writeBuffer(gpu.vbo, 0, geo.vertices);
    gpu.count = geo.count;
  }

  const automap: AutomapControl = {
    get active() { return automapCtl.active; },
    toggle: () => automapCtl.toggle(),
    key: (c) => automapCtl.key(c),
    cheatCycle: () => automapCtl.cheatCycle(),
    prepare: (lines, player, things, aspect, allmap) => automapCtl.prepare(lines, player, things, aspect, allmap),
  };

  resize();

  return {
    patchOf: hud.patchOf,
    get width() { return width; },
    get height() { return height; },
    automap,
    spriteLayerOf: (name) => gpu?.spriteLayer.get(name),
    resize,
    setLevel,
    updateGeometry,
    isMelting: () => wipe.melting(),
    requestWipe: () => wipe.request(),
    beginFrame(clearMagenta) {
      enc = device.createCommandEncoder();
      wipe.capture(enc);
      rp = enc.beginRenderPass({
        colorAttachments: [{
          view: wipe.sceneView(),
          clearValue: clearMagenta ? { r: 1, g: 0, b: 1, a: 1 } : { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear', storeOp: 'store',
        }],
        depthStencilAttachment: { view: depth!.createView(), depthClearValue: 1.0, depthLoadOp: 'clear', depthStoreOp: 'store' },
      });
    },
    hudBeginFrame: () => hud.beginFrame(),
    drawSky(right, up, forward, tanHalfY, aspect, skyLayer) {
      writeSkyGlobals(device, skyPass, right, up, forward, tanHalfY, aspect, skyLayer);
      rp!.setPipeline(skyPass.pipeline); rp!.setBindGroup(0, gpu!.skyBindGroup); rp!.draw(3);
    },
    drawWorld(mvp, paletteRow, fixedMap, extralight, sectorLight, texTrans) {
      writeGlobals(device, pass, mvp, paletteRow, fixedMap, extralight);
      device.queue.writeBuffer(gpu!.sectorLightBuf, 0, sectorLight);
      device.queue.writeBuffer(gpu!.texTransBuf, 0, texTrans);
      rp!.setPipeline(pass.pipeline); rp!.setBindGroup(0, gpu!.bindGroup);
      rp!.setVertexBuffer(0, gpu!.vbo); rp!.draw(gpu!.count);
    },
    drawSprites(instances, count, cameraRight) {
      if (count <= 0) return;
      camScratch.set(cameraRight, 0);
      device.queue.writeBuffer(spritePass.camera, 0, camScratch);
      device.queue.writeBuffer(instanceBuf, 0, instances, 0, count * (INSTANCE_STRIDE / 4));
      rp!.setPipeline(spritePass.pipeline); rp!.setBindGroup(0, gpu!.spriteBindGroup);
      rp!.setVertexBuffer(0, instanceBuf); rp!.draw(6, count);
    },
    drawAutomap: () => automapCtl.draw(rp!),
    drawHud: (quads, paletteRow) => hud.draw(rp!, quads, paletteRow),
    present(dtMs) {
      rp!.end();
      wipe.present(enc!, context.getCurrentTexture().createView(), dtMs);
      device.queue.submit([enc!.finish()]);
      rp = null; enc = null;
    },
  };
}
