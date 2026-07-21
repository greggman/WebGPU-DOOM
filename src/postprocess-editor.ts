// Live shader editor for the post-process pages. The toolbar "edit" button splits
// the stage (game | draggable divider | editor); typing recompiles the current
// effect live via PostProcessControl.setCustomSource, showing compile errors both
// inline (CodeMirror lint markers, when available) and in a word-wrapped panel.
// "save" deflates the shader into the URL fragment (#post=<base64>) and copies the
// link. Backend-agnostic: WGSL on the WebGPU page, GLSL on the WebGL2 page.
//
// CodeMirror 6 (+ its lint addon) load from a CDN on first open, via variable
// specifiers so the bundler leaves them external; a <textarea> is the fallback.
// deflate/inflate use the native CompressionStream — no library.

import type { PostProcessControl, ShaderError } from './renderer.js';

const CM_URL = 'https://esm.sh/codemirror@6.0.1';
const LINT_URL = 'https://esm.sh/@codemirror/lint@6';

// ---- URL codec: deflate + base64url, both native ----
async function deflate(str: string): Promise<string> {
  const cs = new CompressionStream('deflate');
  const w = cs.writable.getWriter();
  void w.write(new TextEncoder().encode(str)); void w.close();
  const buf = new Uint8Array(await new Response(cs.readable).arrayBuffer());
  let s = '';
  for (const b of buf) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
async function inflate(b64: string): Promise<string> {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ds = new DecompressionStream('deflate');
  const w = ds.writable.getWriter();
  void w.write(bytes); void w.close();
  return new Response(ds.readable).text();
}

interface Editor {
  getText(): string;
  setText(t: string): void;
  setErrors(errs: ShaderError[]): void;
}

async function makeEditor(host: HTMLElement, initial: string, onChange: (text: string) => void): Promise<Editor> {
  try {
    const cm = await import(CM_URL) as { EditorView: any; basicSetup: any };
    let lint: any = null;
    try { lint = await import(LINT_URL); } catch (e) { console.warn('CodeMirror lint addon unavailable', e); }
    const { EditorView, basicSetup } = cm;
    // eslint-disable-next-line prefer-const
    let view: any;
    const listener = EditorView.updateListener.of((u: { docChanged: boolean }) => {
      if (u.docChanged) onChange(view.state.doc.toString());
    });
    const theme = EditorView.theme({
      '&': { height: '100%', fontSize: '12px', color: '#e6e6e6', backgroundColor: '#1e1e1e' },
      '.cm-content': { caretColor: '#fff' },
      '.cm-cursor': { borderLeftColor: '#fff' },
      '.cm-scroller': { overflow: 'auto', fontFamily: 'monospace', lineHeight: '1.5' },
      '.cm-gutters': { backgroundColor: '#181818', color: '#7a7a7a', border: 'none' },
      '.cm-activeLine': { backgroundColor: 'rgba(255,255,255,0.06)' },
      '.cm-activeLineGutter': { backgroundColor: 'rgba(255,255,255,0.06)' },
      '.cm-tooltip': { maxWidth: '90%', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
    }, { dark: true });
    // Build with lint if it loaded; a version mismatch between CDN packages can
    // throw here, so fall back to CodeMirror WITHOUT inline markers (the error
    // panel still works) rather than dropping to a textarea.
    const base = [basicSetup, theme, listener];
    try {
      view = new EditorView({ doc: initial, extensions: lint ? [...base, lint.lintGutter()] : base, parent: host });
    } catch (e) {
      console.warn('lint extension incompatible; editor without inline markers', e);
      lint = null; host.innerHTML = '';
      view = new EditorView({ doc: initial, extensions: base, parent: host });
    }
    return {
      getText: () => view.state.doc.toString(),
      setText: (t) => view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: t } }),
      setErrors: (errs) => {
        if (!lint) return;
        try {
          const diags = errs.map((e) => {
            const ln = Math.min(Math.max(1, e.line), view.state.doc.lines);
            const line = view.state.doc.line(ln);
            return { from: Math.min(line.from + Math.max(0, e.col - 1), line.to), to: line.to, severity: 'error', message: e.message };
          });
          view.dispatch(lint.setDiagnostics(view.state, diags));
        } catch (err) { console.warn('lint dispatch failed', err); }
      },
    };
  } catch (err) {
    console.warn('CodeMirror failed to load; using a plain textarea', err);
    const ta = document.createElement('textarea');
    ta.spellcheck = false; ta.value = initial;
    ta.style.cssText = 'width:100%;height:100%;box-sizing:border-box;resize:none;border:0;outline:0;'
      + 'background:#1e1e1e;color:#e6e6e6;font:12px/1.5 monospace;padding:8px';
    ta.addEventListener('input', () => onChange(ta.value));
    ta.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      e.preventDefault();
      const s = ta.selectionStart, en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      onChange(ta.value);
    });
    host.appendChild(ta);
    return { getText: () => ta.value, setText: (t) => { ta.value = t; }, setErrors: () => {} };
  }
}

export function wirePostProcessEditor(canvas: HTMLCanvasElement, pp: PostProcessControl): void {
  const editBtn = document.querySelector<HTMLButtonElement>('#editbtn');
  const host = document.querySelector<HTMLElement>('#editor-host');
  const saveBtn = document.querySelector<HTMLButtonElement>('#savebtn');
  const statusEl = document.querySelector<HTMLElement>('#editor-status');
  const errorsEl = document.querySelector<HTMLElement>('#editor-errors');
  const splitter = document.querySelector<HTMLElement>('#splitter');
  const stage = document.querySelector<HTMLElement>('#stage');
  const sel = document.querySelector<HTMLSelectElement>('#pp');
  if (!editBtn || !host || !saveBtn || !statusEl || !errorsEl || !splitter || !stage || !sel) return;

  let editor: Editor | null = null;
  let programmatic = false;   // suppress onChange during programmatic setText
  let timer = 0;

  const showErrors = (errs: ShaderError[]): void => {
    editor?.setErrors(errs);
    if (errs.length) {
      statusEl.textContent = `${errs.length} error${errs.length > 1 ? 's' : ''}`;
      statusEl.style.color = '#f66';
      errorsEl.textContent = errs.map((e) => `line ${e.line}: ${e.message}`).join('\n\n');
      errorsEl.hidden = false;
    } else {
      statusEl.textContent = 'compiled ✓';
      statusEl.style.color = '#8c8';
      errorsEl.textContent = '';
      errorsEl.hidden = true;
    }
  };

  const apply = async (text: string): Promise<void> => showErrors(await pp.setCustomSource(text));
  const onChange = (text: string): void => {
    if (programmatic) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => void apply(text), 300);
  };
  const setText = (t: string): void => {
    if (!editor) return;
    programmatic = true; editor.setText(t); programmatic = false;
  };

  let rafPending = false;
  const relayout = (): void => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; dispatchEvent(new Event('resize')); });
  };

  const open = async (seed?: string): Promise<void> => {
    document.body.classList.add('editing');
    editBtn.textContent = 'close editor';
    canvas.style.flexBasis = Math.round(stage.clientWidth * 2 / 3) + 'px';
    const initial = seed ?? pp.sourceOf(pp.current());
    if (!editor) editor = await makeEditor(host, initial, onChange);
    else setText(initial);
    relayout();
    if (seed !== undefined) await apply(seed);   // a shared shader: run it
    else { statusEl.textContent = `editing ${pp.language.toUpperCase()} — ${pp.current()}`; statusEl.style.color = '#ccc'; errorsEl.hidden = true; }
  };
  const close = (): void => {
    document.body.classList.remove('editing');
    editBtn.textContent = 'edit';
    canvas.style.flexBasis = '';
    relayout();
  };
  editBtn.addEventListener('click', () => {
    if (document.body.classList.contains('editing')) close(); else void open();
  });

  // Draggable divider (only interactive while editing).
  let dragging = false;
  splitter.addEventListener('pointerdown', (e) => {
    dragging = true; splitter.setPointerCapture(e.pointerId); e.preventDefault();
  });
  splitter.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const r = stage.getBoundingClientRect();
    const w = Math.max(220, Math.min(r.width - 220, e.clientX - r.left));
    canvas.style.flexBasis = w + 'px';
    relayout();
  });
  const endDrag = (e: PointerEvent): void => {
    if (!dragging) return;
    dragging = false;
    try { splitter.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    relayout();
  };
  splitter.addEventListener('pointerup', endDrag);
  splitter.addEventListener('pointercancel', endDrag);

  // Changing the effect while open reseeds the editor (the dropdown already switched
  // the running effect, so don't re-apply).
  sel.addEventListener('change', () => {
    if (!document.body.classList.contains('editing')) return;
    setText(pp.sourceOf(pp.current()));
    showErrors([]);
    statusEl.textContent = `editing ${pp.language.toUpperCase()} — ${pp.current()}`;
    statusEl.style.color = '#ccc';
  });

  saveBtn.addEventListener('click', async () => {
    if (!editor) return;
    // The shader lives entirely in #post=; the ?pp= effect param is redundant
    // (and stale — the running shader is "custom"), so drop it from the link.
    const payload = 'post=' + await deflate(editor.getText());
    const q = new URLSearchParams(location.search);
    q.delete('pp');
    const qs = q.toString();
    history.replaceState(null, '', location.pathname + (qs ? `?${qs}` : '') + '#' + payload);
    try {
      await navigator.clipboard.writeText(location.href);
      statusEl.textContent = 'URL copied to clipboard'; statusEl.style.color = '#8c8';
    } catch {
      statusEl.textContent = 'URL is in the address bar (clipboard blocked)'; statusEl.style.color = '#8c8';
    }
  });

  // A shared shader in the fragment opens the editor and runs it.
  const m = /(?:^|[#&])post=([^&]+)/.exec(location.hash);
  if (m) inflate(m[1]).then((src) => open(src)).catch((e) => console.warn('bad #post= payload', e));
}
