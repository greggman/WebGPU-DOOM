// Post-processing (index-postprocess.html). The scene renders into a small
// G-buffer — colour + a second target holding the geometric wall/floor normal
// and linear view depth — and this pass runs a Shadertoy-style filter over it
// before the melt/present.
//
// Effects are backend-agnostic modules (src/effects/); this consumes their WGSL.
// The harness below provides the Shadertoy-named inputs so ports stay close to
// their originals: `U.iResolution` (vec3), `U.iTime`, `U.iFrame`, `U.iMouse`,
// plus `iColor0(uv)` (iChannel0 colour), `iNormal0(uv)`/`iDepth0(uv)` (the DOOM
// G-buffer), and `fmod`/`fmod2` (GLSL's mod, absent from WGSL).

import { EFFECTS } from '../effects/index.js';
import type { PostEffectInfo, PostProcessControl, ShaderError } from '../renderer.js';

const HEADER = /* wgsl */ `
struct Uniforms { iResolution: vec3f, iTime: f32, iMouse: vec4f, iFrame: f32 };
@group(0) @binding(0) var iSampler : sampler;
@group(0) @binding(1) var iChannel0 : texture_2d<f32>;
@group(0) @binding(2) var iChannelND : texture_2d<f32>;
@group(0) @binding(3) var<uniform> U : Uniforms;

fn iColor0(uv: vec2f) -> vec4f { return textureSampleLevel(iChannel0, iSampler, uv, 0.0); }
fn iNormal0(uv: vec2f) -> vec3f { return textureSampleLevel(iChannelND, iSampler, uv, 0.0).xyz; }
fn iDepth0(uv: vec2f) -> f32 { return textureSampleLevel(iChannelND, iSampler, uv, 0.0).w; }
fn fmod(x: f32, y: f32) -> f32 { return x - y * floor(x / y); }
fn fmod2(x: vec2f, y: vec2f) -> vec2f { return x - y * floor(x / y); }

struct VSOut { @builtin(position) pos: vec4f, @location(0) uv: vec2f };
@vertex fn vs(@builtin(vertex_index) i: u32) -> VSOut {
  var p = array(vec2f(-1.0,-1.0), vec2f(3.0,-1.0), vec2f(-1.0,3.0));
  var o: VSOut;
  o.pos = vec4f(p[i], 0.0, 1.0);
  o.uv = vec2f(p[i].x*0.5+0.5, 0.5 - p[i].y*0.5);
  return o;
}
`;

const FOOTER = /* wgsl */ `
@fragment fn fs(in: VSOut) -> @location(0) vec4f {
  return mainImage(in.pos.xy);
}
`;

const U_SIZE = 48; // iResolution vec3(12) + iTime(4) + iMouse vec4(16 @16) + iFrame(4) -> 48

// Lines the harness prepends, to map WGSL error line numbers back to the editor.
const HEADER_LINES = HEADER.split('\n').length - 1;

export interface PostProcess extends PostProcessControl {
  setInputs(colorView: GPUTextureView, ndView: GPUTextureView): void;
  render(enc: GPUCommandEncoder, outView: GPUTextureView, width: number, height: number, dtMs: number): void;
}

export function createPostProcess(device: GPUDevice, format: GPUTextureFormat): PostProcess {
  const layout = device.createBindGroupLayout({
    entries: [
      { binding: 0, visibility: GPUShaderStage.FRAGMENT, sampler: { type: 'filtering' } },
      { binding: 1, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 2, visibility: GPUShaderStage.FRAGMENT, texture: { sampleType: 'float' } },
      { binding: 3, visibility: GPUShaderStage.FRAGMENT, buffer: { type: 'uniform' } },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({ bindGroupLayouts: [layout] });
  const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });
  const uniforms = device.createBuffer({ size: U_SIZE, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
  const uScratch = new ArrayBuffer(U_SIZE);
  const uF32 = new Float32Array(uScratch);

  const pipelines = new Map<string, GPURenderPipeline>();
  const build = (name: string): GPURenderPipeline => {
    const eff = EFFECTS.find((e) => e.name === name) ?? EFFECTS[0];
    const module = device.createShaderModule({ label: `pp-${eff.name}`, code: HEADER + eff.wgsl + FOOTER });
    return device.createRenderPipeline({
      label: `pp-${eff.name}`,
      layout: pipelineLayout,
      vertex: { module, entryPoint: 'vs' },
      fragment: { module, entryPoint: 'fs', targets: [{ format }] },
      primitive: { topology: 'triangle-list' },
    });
  };

  let bind: GPUBindGroup | null = null;
  let curName = EFFECTS[0].name;
  let curPipeline = build(curName);
  pipelines.set(curName, curPipeline);
  let time = 0, frame = 0;
  const mouse = new Float32Array([0, 0, 0, 0]);

  return {
    effects: EFFECTS.map((e) => ({
      name: e.name, author: e.author, authorUrl: e.authorUrl,
      src: e.src, license: e.license, licenseUrl: e.licenseUrl,
    })),
    language: 'wgsl',
    current: () => curName,
    setEffect(name: string): void {
      if (!EFFECTS.some((e) => e.name === name)) return;
      curName = name;
      let p = pipelines.get(name);
      if (!p) { p = build(name); pipelines.set(name, p); }
      curPipeline = p;
    },
    setMouse(x, y, down): void { mouse[0] = x; mouse[1] = y; mouse[2] = down ? 1 : 0; },
    sourceOf: (name) => (EFFECTS.find((e) => e.name === name)?.wgsl ?? EFFECTS[0].wgsl).trim(),
    async setCustomSource(source: string): Promise<ShaderError[]> {
      device.pushErrorScope('validation');
      const module = device.createShaderModule({ code: HEADER + source + FOOTER });
      const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: { module, entryPoint: 'vs' },
        fragment: { module, entryPoint: 'fs', targets: [{ format }] },
        primitive: { topology: 'triangle-list' },
      });
      const scopeErr = await device.popErrorScope();
      const errs = (await module.getCompilationInfo()).messages
        .filter((m) => m.type === 'error')
        .map((m) => ({ line: Math.max(1, m.lineNum - HEADER_LINES), col: Math.max(1, m.linePos), message: m.message }));
      if (errs.length) return errs;
      if (scopeErr) return [{ line: 1, col: 1, message: scopeErr.message }];
      curName = 'custom';
      curPipeline = pipeline;
      return [];
    },
    setInputs(colorView, ndView): void {
      bind = device.createBindGroup({
        layout,
        entries: [
          { binding: 0, resource: sampler },
          { binding: 1, resource: colorView },
          { binding: 2, resource: ndView },
          { binding: 3, resource: { buffer: uniforms } },
        ],
      });
    },
    render(enc, outView, width, height, dtMs): void {
      time += dtMs / 1000;
      frame += 1;
      uF32[0] = width; uF32[1] = height; uF32[2] = 1;   // iResolution
      uF32[3] = time;                                    // iTime
      uF32[4] = mouse[0]; uF32[5] = mouse[1]; uF32[6] = mouse[2]; uF32[7] = 0; // iMouse
      uF32[8] = frame;                                   // iFrame
      device.queue.writeBuffer(uniforms, 0, uScratch);

      const rp = enc.beginRenderPass({
        colorAttachments: [{ view: outView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: 'clear', storeOp: 'store' }],
      });
      rp.setPipeline(curPipeline);
      rp.setBindGroup(0, bind!);
      rp.draw(3);
      rp.end();
    },
  };
}
