> STATUS: EXECUTED · shipped via PR #43 (2026-07-16) with post-kit ORDERS 1–3 (viewBox fix · ink curve, superseded · wasm_vtracer@0.2.0 swap · package consumption) — diagnosis chain on #38 · canonical now: codepens/tracer-pen.html + @ybelik/scene-tracer

TRACER-PEN KIT — entity/BYO-image · browser lane (ticket #38, ratified direction on #36)
ybelik-story-engine · analyzer pass 2026-07-16 · cut against `main` = `8f19161`
PRE-PROVEN (analyzer sandbox, 2026-07-16): FULL CHAIN executed — `vtracer-wasm@0.1.0` traced a 512px raster at the mapped policy cell, the JS auto-tune ladder walked ld32→24→16→8 and flagged `chunky-by-content` (behavioral parity with `trace_scene.py` on the same image), `compileScene` bucketed 655 paths → 100 distinct buckets, audit 0/0 fallbacks — PASS · trace speed ~0.5 s @ 512px in-sandbox · package license MIT (LICENSE file; no license field in manifest — noted)
⚠ THE MAPPING (load-bearing — silent wrong output without it): `vtracer-wasm`'s `colorPrecision` is INVERTED vs the vtracer CLI — it passes raw into visioncortex `is_same_color_a`, where the CLI computes `8 − color_precision`. Policy `cp8` must be passed as `colorPrecision: 0`. `layerDifference` maps direct. Verified against the wrapper's source (`src/lib.rs`, runner construction) and empirically (cp8-as-8 panics; cp8-as-0 traces correctly).
Rulings ratified by Asaf 2026-07-16 ("yes to all"): pen title "ybelik · browser tracer — bring your own image" (rename at Save if desired — the Save field is the natural gate) · file `codepens/tracer-pen.html` · branch `feature/tracer-pen` · zero-server doctrine (client pays CPU) · min code / max value
Declared deviations from the Python tracer: input always normalized to ≤1024px canvas (Python downscales only when heavy) · ladder capped at 4 iterations (same as observed convergence) · no `.settings.json` sidecar (the readout shows the chosen cell instead)
The one thing sandbox cannot prove: CDN loading of the ESM+WASM pair in a real browser (MIME/CORS). That is PROBE 1 — run it before anything else and STOP on failure.
EXECUTOR CONTRACT

1. FILE 1 is complete — copy byte-verbatim. E2 is exact-match-or-STOP.
2. Scope (touchable): `codepens/tracer-pen.html` (new) · `codepens/README.md` (E2 only). Nothing else.
3. Prove in a real browser; courier raw outputs on #38; never self-declare acceptance.
4. ⛔ gates downstream: Asaf's merge, then Asaf's CodePen Save (new pen).
GIT LINE
Preconditions (STOP on failure): `origin/main` = `8f19161…` · `feature/tracer-pen` absent on origin.

```bash
git switch main && git pull && git switch -c feature/tracer-pen

```

* Commit 1 (new artifact): FILE 1 → `codepens: browser tracer pen — vtracer-wasm + auto-tune ladder, zero-server (tracer-pen.html)`
* Commit 2 (edit): E2 → `codepens: tracer pen recipe + load order in the pen home` Push, open one PR: `browser tracer pen — BYO image, traced/compiled/revealed client-side (#38)`. No squash. Never merge ⛔.
PROBE 1 · CDN pair loads (run FIRST, from any blank page or the built file)
Serve repo root (`python3 -m http.server 8000`), open the pen, check DevTools Network:

* `https://cdn.jsdelivr.net/npm/vtracer-wasm@0.1.0/vtracer.js` → 200, `content-type` javascript
* `https://cdn.jsdelivr.net/npm/vtracer-wasm@0.1.0/vtracer.wasm` → 200, `content-type: application/wasm`
* both unpkg tags → 200 Any failure → STOP, courier the response headers; the analyzer re-cuts (fallback: vendor the 150 kB package into `codepens/vendor/`, a one-commit change — Asaf's call).
FILE 1 · `codepens/tracer-pen.html` (complete, self-contained)

```html
<!doctype html>
<meta charset="utf-8">
<title>ybelik · browser tracer — bring your own image</title>
<style>
:root{ --paper:#f3ece0; --ink:#14110E; --ink2:#201B16; --line:#3A332B;
       --fg:#E9E2D4; --mist:#9A9284; --mist2:#C6BEAF; --shu:#C0432B;
       --mono:'JetBrains Mono',ui-monospace,Menlo,monospace; --serif:'Spectral',Georgia,serif; }
*{box-sizing:border-box} html,body{margin:0}
body{ background:var(--ink); color:var(--fg); font-family:var(--serif);
      line-height:1.5; -webkit-font-smoothing:antialiased; padding:clamp(16px,2.5vw,34px); }
header{ margin-bottom:16px }
h1{ font-size:20px; font-weight:400; letter-spacing:.04em; margin:0 0 6px }
h1 b{ font-weight:600; color:var(--shu) }
.sub{ font-family:var(--mono); font-size:11px; color:var(--mist); line-height:1.7; max-width:76ch }
.sub code{ color:var(--mist2) }
.stage{ position:relative; height:min(58vh,540px); background:var(--paper); border-radius:3px;
        overflow:hidden; box-shadow:0 1px 0 rgba(255,255,255,.12), 0 22px 44px -22px rgba(0,0,0,.8);
        display:flex; align-items:center; justify-content:center; }
.stage.drag{ outline:2px dashed var(--shu); outline-offset:-8px }
.stage svg{ width:100%; height:100%; display:block; object-fit:contain }
.rp{ opacity:0 }                       /* base rule — reveal-engine drives opacity */
.empty{ font-family:var(--mono); font-size:12px; color:#6b6455; text-align:center; padding:0 20px }
.empty b{ color:#8a5340 }
.controls{ display:flex; flex-wrap:wrap; align-items:center; gap:14px 22px; margin-top:16px;
           font-family:var(--mono); font-size:12px; color:var(--mist2);
           background:var(--ink2); border:1px solid var(--line); border-radius:3px; padding:14px 18px; }
.controls label{ display:flex; align-items:center; gap:8px }
input[type=file]{ font-family:var(--mono); font-size:11px; color:var(--mist); max-width:220px }
button{ font-family:var(--mono); font-size:12px; background:var(--shu); color:#fff;
        border:1px solid var(--shu); border-radius:3px; padding:6px 16px; cursor:pointer; letter-spacing:.06em }
button:hover{ background:#a93a25 } button:disabled{ opacity:.4; cursor:default }
.readout{ margin-left:auto; text-align:right; line-height:1.8; color:var(--mist) }
.readout b{ color:var(--mist2); font-weight:600 }
.readout .flag{ color:var(--shu) }
</style>

<header>
  <h1><b>ybelik</b> · browser tracer — bring your own image</h1>
  <p class="sub">The whole pipeline on your device, no server anywhere: your image is traced by
  <code>vtracer</code> (Rust→WASM), auto-tuned down a <code>layer_difference</code> ladder until the
  path count lands in the jank-safe band, bucketed by <code>@ybelik/scene-compiler</code>, and painted
  light-to-dark by <code>@ybelik/reveal-engine</code>. Nothing is uploaded — the file never leaves this page.</p>
</header>

<div class="stage" id="stage">
  <div class="empty" id="empty"><b>drop an image here</b> (or use the file picker below)<br>
  jpg / png / webp · it becomes an ink-wash-style reveal, entirely in your browser</div>
</div>

<div class="controls">
  <label>image <input type="file" id="file" accept="image/*"></label>
  <button id="replay" disabled>trace + reveal again</button>
  <div class="readout" id="readout">&#8212;</div>
</div>

<script src="https://unpkg.com/@ybelik/scene-compiler@0.1.0/scene-compiler.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
<script type="module">
import init, { to_svg } from 'https://cdn.jsdelivr.net/npm/vtracer-wasm@0.1.0/vtracer.js';
const ready = init({ module_or_path: 'https://cdn.jsdelivr.net/npm/vtracer-wasm@0.1.0/vtracer.wasm' });

/* policy — mirrors trace_scene.py DEFAULT_POLICY (test-corpus/TRACE-SETTINGS.md).
   MAPPING NOTE: vtracer-wasm's colorPrecision is inverted vs the vtracer CLI
   (raw is_same_color_a); policy cp8 is therefore passed as 0. */
const POLICY = { cp: 8, ladder: [8, 16, 24, 32, 48, 64], band: [1500, 3500], maxPx: 1024 };
const wasmCfg = (ld) => ({ binary: false, mode: 'spline', hierarchical: 'stacked',
  cornerThreshold: 60, lengthThreshold: 4, maxIterations: 10, spliceThreshold: 45,
  filterSpeckle: 4, colorPrecision: 8 - POLICY.cp, layerDifference: ld, pathPrecision: 3 });

const stage = document.getElementById('stage');
const empty = document.getElementById('empty');
const readout = document.getElementById('readout');
const replayBtn = document.getElementById('replay');
let lastImageData = null, raf = 0;

function toImageData(img){                      // normalize to <= maxPx (declared deviation)
  const s = Math.min(1, POLICY.maxPx / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * s)), h = Math.max(1, Math.round(img.height * s));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return c.getContext('2d').getImageData(0, 0, w, h);
}

function trace(id){                             // the auto-tune ladder (trace_scene.py, ported)
  let li = POLICY.ladder.indexOf(32), tried = [], svg, paths, flag = '';
  for (let i = 0; i < 4; i++) {
    svg = to_svg(new Uint8Array(id.data.buffer.slice(0)), id.width, id.height, wasmCfg(POLICY.ladder[li]));
    paths = (svg.match(/<path/g) || []).length;
    tried.push('ld' + POLICY.ladder[li] + '=' + paths);
    if (paths < POLICY.band[0] && li > 0) { li--; continue; }
    if (paths > POLICY.band[1] && li < POLICY.ladder.length - 1) { li++; continue; }
    break;
  }
  if (paths < POLICY.band[0] && li === 0) flag = 'chunky-by-content';
  if (paths > POLICY.band[1] && li === POLICY.ladder.length - 1) flag = 'over-ceiling';
  return { svg, paths, cell: 'cp8/ld' + POLICY.ladder[li], tried, flag };
}

async function run(id){
  await ready;
  empty.style.display = 'none';
  readout.innerHTML = 'tracing&#8230;';
  await new Promise(r => setTimeout(r, 30));    // let the readout paint before the CPU burst
  cancelAnimationFrame(raf);
  const t0 = performance.now();
  const t = trace(id);
  const traceMs = (performance.now() - t0).toFixed(0);
  const t1 = performance.now();
  const compiled = SceneCompiler.compileScene(t.svg, { seed: 42 });
  const compileMs = (performance.now() - t1).toFixed(0);
  stage.innerHTML = compiled;
  const engine = new RevealEngine(stage);
  readout.innerHTML = '<b>' + t.cell + '</b> &#183; <b>' + t.paths + '</b> paths &#183; <b>' +
    engine.bucketCount + '</b> buckets' + (t.flag ? ' &#183; <span class="flag">' + t.flag + '</span>' : '') +
    '<br>trace <b>' + traceMs + 'ms</b> &#183; compile <b>' + compileMs + 'ms</b> &#183; ladder: ' + t.tried.join(' ');
  replayBtn.disabled = false;
  if (RevealEngine.reducedMotion) { engine.fill(); return; }
  engine.clear();
  const start = performance.now(), DUR = 1600;
  (function tick(now){
    const p = Math.min(1, (now - start) / DUR);
    engine.setLevel(-1 + p * 100);
    if (p < 1) raf = requestAnimationFrame(tick);
  })(start);
}

function loadFile(file){
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  img.onload = () => { lastImageData = toImageData(img); URL.revokeObjectURL(img.src); run(lastImageData); };
  img.src = URL.createObjectURL(file);
}

document.getElementById('file').addEventListener('change', e => loadFile(e.target.files[0]));
replayBtn.addEventListener('click', () => lastImageData && run(lastImageData));
stage.addEventListener('dragover', e => { e.preventDefault(); stage.classList.add('drag'); });
stage.addEventListener('dragleave', () => stage.classList.remove('drag'));
stage.addEventListener('drop', e => { e.preventDefault(); stage.classList.remove('drag');
  loadFile(e.dataTransfer.files[0]); });
</script>

```

E2 · `codepens/README.md` — the pen home gains the recipe (exact-match-or-STOP)
OLD (1 line, exact — the last `###` heading of "The pens"):

```
### shell-pen.html ✅ (recipe, built)

```

NEW (the same line stays; the new section goes ABOVE it so pen order reads compiler→tracer→…; i.e. replace with):

```
### tracer-pen.html ✅ (recipe, built — browser lane, #38)
Zero-server BYO-image: `vtracer-wasm@0.1.0` (jsDelivr, ESM+WASM pair) + `@ybelik/scene-compiler@0.1.0` + `@ybelik/reveal-engine@0.1.0` (unpkg). The auto-tune ladder from `trace_scene.py`, ported (~15 lines); ⚠ `colorPrecision` inverted in the wasm wrapper — policy `cp8` is passed as `0` (mapping documented in the pen source). Input normalized to ≤1024px. Nothing uploads; the visitor's device pays the CPU. Pen URL: *(added post-save)*.

### shell-pen.html ✅ (recipe, built)

```

PROBES (comment raw output on #38)

1. PROBE 1 (CDN pair) — headers, run first.
2. Serve repo root, open `codepens/tracer-pen.html`, drop a real photo (any jpg): console = zero errors · readout shows a chosen cell + ladder walk · paint sweep visible. Courier: the readout line verbatim + a screenshot/still.
3. Drop a tiny flat image (e.g. a screenshot of solid UI): expect low path count + `chunky-by-content` flag — the flags vocabulary working.
4. `grep -c "tracer-pen.html" codepens/README.md` → expect 2 (heading + nothing else stray) · `git log --oneline main..HEAD` → exactly 2 commits, kit order.
STOP CONDITIONS

* `origin/main` ≠ `8f19161…` · branch exists · PROBE 1 failure (CDN/MIME/CORS)
* E2 OLD line not found exactly once
* console errors on drop, or the sweep doesn't paint
* any file outside Scope would change
AFTER THE PR (the human tail, listed for the record — not this kit's scope)
⛔ Asaf merges → ⛔ Asaf saves the pen on CodePen (new pen: paste HTML-panel = body content, CSS panel = the `<style>` body, keep the module script in the HTML panel; or extend `launchers.html` later) → then one tiny follow-up batch backfills: the pen URL into codepens/README, a fifth card on the index pen `JoEpPGr` (⛔ pen save), and the root README pens row. The advisor verifies the live pen by fetch, as with #33.
