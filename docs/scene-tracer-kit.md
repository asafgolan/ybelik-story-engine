> STATUS: EXECUTED · shipped via PR #45 (2026-07-16) · canonical now: packages/scene-tracer/ on npm + the live docs it re-pointed

# SCENE-TRACER KIT — @ybelik/scene-tracer · Python trace stage retired (ticket #44)
### ybelik-story-engine · analyzer pass 2026-07-16 · cut against `main` = `8f19161` (PR #43 touches only `codepens/` — zero scope overlap; pairs remain exact either way)
### PRE-PROVEN (analyzer sandbox, 2026-07-16): FILE 1 + FILE 2 executed end-to-end on a real 1024px photographic frame — ladder walked `ld32=209 ld24=345 ld16=618 ld8=1352`, chose `cp8/ld8`, flagged `chunky-by-content`, wrote SVG with injected viewBox + `.settings.json` sidecar · **1352 paths = exact vendor-CLI parity count** (evidence chain on #38) · pure-JS decode identity: pngjs-decoded pixels trace to the identical path count as PIL-decoded · `npm pack --dry-run`: 2.8 kB tarball, exactly the whitelist · deps pinned from tested install: `wasm_vtracer@0.2.0 · pngjs@7.0.0 · jpeg-js@0.4.4`
### Rulings ratified by Asaf 2026-07-16 ("go"): package name **`@ybelik/scene-tracer`** · `trace_scene.py` **deleted** (history preserves; corpus recipes cite historical commits) · `compile_scene.py` + `audit_svg.py` **stay** (parity twins) · pen refactor deferred to post-publish follow-up · L3 extraction map + all sealed-doc bodies untouched
### Named exception: E10 edits ONE sealed-doc **banner line** (dod-g-part2-handover). Banners are the status-metadata layer above the byte-preserved body; the body stays untouched. This overrides "sealed files stay byte-untouched" for the banner line only, by name.
### Sequencing note (honest gap): E2 documents `npx @ybelik/scene-tracer`, which resolves only after Asaf publishes. Publish in the same sitting as the merge (⛔ both yours) to keep the gap to minutes.

---

## EXECUTOR CONTRACT
1. FILES 1–4 complete — byte-verbatim. Every E-pair is exact-match-or-STOP.
2. **Scope (touchable, exhaustive):**
   NEW: `packages/scene-tracer/scene-tracer.js` · `packages/scene-tracer/bin/trace-scene.js` · `packages/scene-tracer/package.json` · `packages/scene-tracer/README.md`
   EDIT: `.gitignore` (E0) · `README.md` (E1) · `docs/QUICKSTART.md` (E2, E3) · `docs/API.md` (E7, E8, E9) · `test-corpus/TRACE-SETTINGS.md` (E4, E5) · `packages/generate/README.md` (E6) · `docs/dod-g-part2-handover.md` (E10 — banner line ONLY)
   DELETE: `packages/scene-compiler/trace_scene.py` (`git rm`)
   **`node_modules/` never enters git.** No other file changes for any reason.
3. Courier raw probe output on #44. Never self-declare acceptance. ⛔ merge + npm publish are Asaf's.

## GIT LINE
Preconditions (STOP on failure): `feature/scene-tracer` absent on origin · every E-pair OLD found exactly once.
```bash
git switch main && git pull && git switch -c feature/scene-tracer
```
- **Commit 1** (new package): FILES 1–4 + E0 →
  `packages: @ybelik/scene-tracer — JS tracer (wasm_vtracer core, auto-tune ladder, CLI + sidecar)`
- **Commit 2** (retirement): `git rm packages/scene-compiler/trace_scene.py` →
  `scene-compiler: retire trace_scene.py — succeeded by @ybelik/scene-tracer (CLI-parity proven, #38)`
- **Commit 3** (refs): E1–E10 →
  `docs: tracer references → @ybelik/scene-tracer (one home per fact maintained)`
Push, open **one PR**: `@ybelik/scene-tracer — JS tracer package; Python trace stage retired (#44)`. No squash. Never merge ⛔.

## E0 · `.gitignore` — append one line (exact)
```
packages/scene-tracer/node_modules/
```

## FILE 1 · `packages/scene-tracer/scene-tracer.js` (complete)

```javascript
// scene-tracer.js — @ybelik/scene-tracer core (ESM, environment-free).
// The auto-tune ladder from the retired trace_scene.py, wrapping wasm_vtracer.
// Wiring is injected: pass the glue module + wasm bytes/URL to initTracer.
export const DEFAULT_POLICY = {
  color_precision: 8,                       // pinned — the quality axis
  ld_ladder: [8, 16, 24, 32, 48, 64],       // layer_difference steps
  target_paths: [1500, 3500],               // the jank-safe band
  max_kb: 2048,                             // weight ceiling
  downscale_px: 1024,                       // one downscale retry when heavy
};
const MAX_ITERS = 4;

export async function initTracer({ glue, wasm }) {
  const bytes = (typeof wasm === 'string' || wasm instanceof URL)
    ? await fetch(wasm).then((r) => r.arrayBuffer()) : wasm;
  const { instance } = await WebAssembly.instantiate(bytes, { './wasm_vtracer_bg.js': glue });
  glue.__wbg_set_wasm(instance.exports);
  instance.exports.__wbindgen_start();
  return new Tracer(glue);
}

class Tracer {
  constructor(glue) { this.vt = glue; }
  _cfg(cp, ld) {
    const c = new this.vt.TracerConfig();
    c.setColorMode(0); c.setHierarchical(0); c.setPathSimplifyMode(1);
    c.setFilterSpeckle(4); c.setColorPrecision(cp); c.setLayerDifference(ld);
    c.setCornerThreshold(60); c.setLengthThreshold(4); c.setSpliceThreshold(45);
    c.setPathPrecision(3);
    return c;                                // fresh per call — the wasm consumes it
  }
  traceScene(rgba, width, height, opts = {}) {
    const P = Object.assign({}, DEFAULT_POLICY, opts.policy || {});
    let img = { rgba: new Uint8Array(rgba), width, height };
    let downscaled = false;
    let li = P.ld_ladder.indexOf(32); if (li < 0) li = Math.floor(P.ld_ladder.length / 2);
    let tried = [], svg, paths, kb;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < MAX_ITERS; i++) {
        svg = this.vt.convertImageToSvg(img.rgba.slice(0), img.width, img.height,
          this._cfg(P.color_precision, P.ld_ladder[li]));
        paths = (svg.match(/<path/g) || []).length;
        kb = Math.round(svg.length / 1024);
        tried.push('ld' + P.ld_ladder[li] + '=' + paths);
        if (paths < P.target_paths[0] && li > 0) { li--; continue; }
        if (paths > P.target_paths[1] && li < P.ld_ladder.length - 1) { li++; continue; }
        break;
      }
      if (kb > P.max_kb && !downscaled && Math.max(img.width, img.height) > P.downscale_px) {
        img = boxDownscale(img, P.downscale_px); downscaled = true;
        li = P.ld_ladder.indexOf(32); tried.push('downscaled');
        continue;
      }
      break;
    }
    let flag = '';
    if (paths < P.target_paths[0] && li === 0) flag = 'chunky-by-content';
    else if (paths > P.target_paths[1] || kb > P.max_kb) flag = 'over-ceiling';
    else if (li === 0 || li === P.ld_ladder.length - 1) flag = 'band-edge';
    const withBox = svg.includes('viewBox') ? svg
      : svg.replace('<svg', '<svg viewBox="0 0 ' + img.width + ' ' + img.height + '"');
    return { svg: withBox, settings: {
      color_precision: P.color_precision, layer_difference: P.ld_ladder[li],
      paths, kb, ladder: tried, flag, downscaled, width: img.width, height: img.height } };
  }
}

function boxDownscale({ rgba, width, height }, maxPx) {
  const s = maxPx / Math.max(width, height);
  const w = Math.max(1, Math.round(width * s)), h = Math.max(1, Math.round(height * s));
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = Math.min(width - 1, Math.round(x / s)), sy = Math.min(height - 1, Math.round(y / s));
    const si = (sy * width + sx) * 4, di = (y * w + x) * 4;
    out[di] = rgba[si]; out[di+1] = rgba[si+1]; out[di+2] = rgba[si+2]; out[di+3] = rgba[si+3];
  }
  return { rgba: out, width: w, height: h };
}
```

## FILE 2 · `packages/scene-tracer/bin/trace-scene.js` (complete)

```javascript
#!/usr/bin/env node
// trace-scene — CLI twin of the retired trace_scene.py.
// usage: trace-scene image.png|jpg out.svg [--min N] [--max N] [--max-kb N]
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { initTracer, DEFAULT_POLICY } from '../scene-tracer.js';
const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const [input, output] = args;
if (!input || !output) { console.error('usage: trace-scene image.png out.svg [--min N --max N --max-kb N]'); process.exit(2); }
const opt = (n) => { const i = args.indexOf(n); return i === -1 ? null : Number(args[i + 1]); };
const policy = {};
if (opt('--min') || opt('--max'))
  policy.target_paths = [opt('--min') ?? DEFAULT_POLICY.target_paths[0], opt('--max') ?? DEFAULT_POLICY.target_paths[1]];
if (opt('--max-kb')) policy.max_kb = opt('--max-kb');

const buf = readFileSync(input);
let rgba, width, height;
if (buf[0] === 0x89 && buf[1] === 0x50) {                    // PNG
  const { PNG } = require('pngjs');
  const p = PNG.sync.read(buf); rgba = p.data; width = p.width; height = p.height;
} else if (buf[0] === 0xff && buf[1] === 0xd8) {             // JPEG
  const jpeg = require('jpeg-js');
  const j = jpeg.decode(buf, { useTArray: true }); rgba = j.data; width = j.width; height = j.height;
} else { console.error('unsupported input (png/jpeg only)'); process.exit(2); }

const glue = await import('wasm_vtracer/wasm_vtracer_bg.js');
const wasm = readFileSync(require.resolve('wasm_vtracer/wasm_vtracer_bg.wasm'));
const tracer = await initTracer({ glue, wasm });
const { svg, settings } = tracer.traceScene(rgba, width, height, { policy });
writeFileSync(output, svg);
writeFileSync(output.replace(/\.svg$/, '') + '.settings.json', JSON.stringify(settings, null, 2));
console.log(`${input} -> ${output}`);
console.log(`  chosen: cp${settings.color_precision}/ld${settings.layer_difference}  ${settings.paths} paths · ${settings.kb} kB · ${settings.ladder.length} iters${settings.flag ? '  FLAG: ' + settings.flag : ''}`);
console.log(`  ladder: ${settings.ladder.join(' ')}`);
```

## FILE 3 · `packages/scene-tracer/package.json` (complete — publish-ready, no `private`)

```json
{
  "name": "@ybelik/scene-tracer",
  "version": "0.1.0",
  "description": "Image → traced SVG with a deterministic auto-tune ladder (the ybelik trace stage). Wraps wasm_vtracer; runs in browser and Node; writes settings-are-data sidecars from the CLI.",
  "license": "MIT",
  "type": "module",
  "main": "scene-tracer.js",
  "exports": "./scene-tracer.js",
  "bin": { "trace-scene": "bin/trace-scene.js" },
  "files": ["scene-tracer.js", "bin/"],
  "repository": { "type": "git", "url": "git+https://github.com/asafgolan/ybelik-story-engine.git", "directory": "packages/scene-tracer" },
  "dependencies": {
    "wasm_vtracer": "0.2.0",
    "pngjs": "7.0.0",
    "jpeg-js": "0.4.4"
  }
}
```

## FILE 4 · `packages/scene-tracer/README.md` (complete)

```markdown
# @ybelik/scene-tracer

Image → traced SVG, auto-tuned. The trace stage of the ybelik pipeline
(`generate → trace → compile → reveal` — see the [root README](../../README.md)):
a deterministic `layer_difference` ladder walks the trace until the path count lands
in the jank-safe band, then the result is ready for `@ybelik/scene-compiler`.

The vector core is [visioncortex vtracer](https://github.com/visioncortex/vtracer) via
`wasm_vtracer` — CLI-parity verified on real photographic input (identical path count
and render vs the native vtracer CLI). Succeeded the project's Python `trace_scene.py`
on 2026-07-16.

## CLI (Node)

```bash
npx @ybelik/scene-tracer image.png scene.svg
# or with a custom band / ceiling:
npx @ybelik/scene-tracer image.jpg scene.svg --min 1500 --max 3500 --max-kb 2048
```

Prints the chosen cell, the ladder it walked, and any flag; writes a
`scene.settings.json` sidecar — the full reproduction recipe (settings-are-data).
PNG and JPEG in; SVG (with `viewBox`) out.

## Browser (ESM, no build step)

```js
import * as glue from 'https://cdn.jsdelivr.net/npm/wasm_vtracer@0.2.0/wasm_vtracer_bg.js';
import { initTracer } from 'https://cdn.jsdelivr.net/npm/@ybelik/scene-tracer@0.1.0/scene-tracer.js';

const tracer = await initTracer({
  glue,
  wasm: 'https://cdn.jsdelivr.net/npm/wasm_vtracer@0.2.0/wasm_vtracer_bg.wasm',
});
const { svg, settings } = tracer.traceScene(imageData.data, imageData.width, imageData.height);
```

The visitor's device pays the CPU (~1–3 s per ladder step at 1024 px); nothing uploads.

## Policy

`DEFAULT_POLICY` — `color_precision: 8` (pinned) · `ld_ladder: [8,16,24,32,48,64]` ·
`target_paths: [1500, 3500]` · `max_kb: 2048` · `downscale_px: 1024`. Override any key
via `traceScene(..., { policy })`. Flags: `band-edge` · `over-ceiling` ·
`chunky-by-content` (features, not failures). The numbers' home — rationale and
acceptance criteria: [TRACE-SETTINGS.md](../../test-corpus/TRACE-SETTINGS.md).

MIT · part of the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine).
```

## E1 · root `README.md` — layout table (exact-match-or-STOP)
OLD (1 line):
```
| `packages/scene-compiler` | Module A + trace stage: `compile_scene`, `trace_scene`, `audit_svg`, `oracle/`, `tests/` |
```
NEW (2 lines):
```
| `packages/scene-compiler` | Module A: `compile_scene`, `audit_svg`, `oracle/`, `tests/` |
| `packages/scene-tracer` | trace stage: `@ybelik/scene-tracer` — JS auto-tune tracer + CLI |
```

## E2 · `docs/QUICKSTART.md` — Lane B commands (exact-match-or-STOP)
OLD (3 lines):
```
pip install vtracer
python3 packages/scene-compiler/trace_scene.py your-image.jpg your-scene.svg
python3 packages/scene-compiler/compile_scene.py your-scene.svg --out your-scene.compiled.svg --seed 42
```
NEW (2 lines):
```
npx @ybelik/scene-tracer your-image.jpg your-scene.svg
python3 packages/scene-compiler/compile_scene.py your-scene.svg --out your-scene.compiled.svg --seed 42
```

## E3 · `docs/QUICKSTART.md` — prose (exact-match-or-STOP)
OLD (1 line):
```
`trace_scene` auto-tunes the trace for you — `color_precision` pinned at 8 (the quality
```
NEW (1 line):
```
`scene-tracer` auto-tunes the trace for you — `color_precision` pinned at 8 (the quality
```

## E4 · `test-corpus/TRACE-SETTINGS.md` (exact-match-or-STOP)
OLD (1 line):
```
- **`layer_difference` — auto-tuned per asset** by `trace_scene.py` (ladder
```
NEW (1 line):
```
- **`layer_difference` — auto-tuned per asset** by `@ybelik/scene-tracer` (ladder
```

## E5 · `test-corpus/TRACE-SETTINGS.md` (exact-match-or-STOP)
OLD (1 line):
```
> Baseline = the sweep's starting values (historical; the `color_precision 6` below is superseded). Production pins `color_precision = 8` — see LOCKED POLICY above and `DEFAULT_POLICY` in `packages/scene-compiler/trace_scene.py`.
```
NEW (1 line):
```
> Baseline = the sweep's starting values (historical; the `color_precision 6` below is superseded). Production pins `color_precision = 8` — see LOCKED POLICY above and `DEFAULT_POLICY` in `packages/scene-tracer/scene-tracer.js`.
```

## E6 · `packages/generate/README.md` (exact-match-or-STOP)
OLD (1 line — the standalone line ending the pipeline paragraph):
```
`trace_scene.py`.
```
NEW (1 line):
```
`@ybelik/scene-tracer`.
```

## E7 · `docs/API.md` — intro (exact-match-or-STOP)
OLD (2 lines):
```
Pinned to source @ `main` `ce8d28e` (2026-07-16). Six functions, two CLIs, one
endpoint, two extension seams, one hard contract.
```
NEW (2 lines):
```
Pinned to source @ `main` (2026-07-16; tracer updated same day). Seven functions, two
CLIs, one endpoint, two extension seams, one hard contract.
```

## E8 · `docs/API.md` — the trace section swap (exact-match-or-STOP)
OLD (the full block, from the Python header through the TRACE-SETTINGS paragraph — 27 lines, exact):
```
## Build time — Python (`packages/scene-compiler/`)

### `trace_scene(image_path, policy=None, out_svg=None) → (svg_text, chosen_settings)`

Deterministic auto-tuner: image → traced SVG, converging on a jank-safe path budget
in 2–4 trace/audit cycles. Writes a `.settings.json` sidecar next to the output
(settings-are-data: the reproduction recipe).

`DEFAULT_POLICY` (override any key via the `policy` dict — this is an extension seam):

| key | default | meaning |
|---|---|---|
| `color_precision` | `8` | pinned — the quality/tonal-layering axis |
| `ld_ladder` | `[8, 16, 24, 32, 48, 64]` | `layer_difference` steps the tuner walks |
| `target_paths` | `(1500, 3500)` | the jank-safe band |
| `max_kb` | `2048` | weight ceiling |
| `downscale_px` | `1024` | one downscale retry when still heavy at ld64 |

Flags vocabulary (features, not failures): `band-edge` (converged at a ladder edge) ·
`over-ceiling` (still heavy after the downscale retry) · `chunky-by-content` (still
sparse at ld8 — the content is genuinely sparse).

CLI: `python3 packages/scene-compiler/trace_scene.py image.png out.svg [--min N --max N --max-kb N]`

The numbers' home — policy rationale, acceptance criteria, the locked cell and the
measured ceiling: [TRACE-SETTINGS.md](../test-corpus/TRACE-SETTINGS.md).
```
NEW (replaces the block; the Python header returns at the end so compile/audit stay under it):
```
## Build time — the tracer (`@ybelik/scene-tracer` · JS · browser + Node)

### `initTracer({ glue, wasm }) → Promise<Tracer>` · `tracer.traceScene(rgba, width, height, { policy? }) → { svg, settings }`

Deterministic auto-tuner: RGBA in, traced SVG (with `viewBox`) + a settings object out,
converging on a jank-safe path budget in 2–4 trace cycles. Wiring is injected —
`glue` is the imported `wasm_vtracer` glue module, `wasm` is the binary's bytes or URL —
so the same core runs in the browser and in Node. The CLI writes the settings object as
a `.settings.json` sidecar (settings-are-data: the reproduction recipe). Succeeded the
Python `trace_scene.py` 2026-07-16 with CLI-parity proven on real photographic input.

`DEFAULT_POLICY` (override any key via `{ policy }` — this is an extension seam):

| key | default | meaning |
|---|---|---|
| `color_precision` | `8` | pinned — the quality/tonal-layering axis |
| `ld_ladder` | `[8, 16, 24, 32, 48, 64]` | `layer_difference` steps the tuner walks |
| `target_paths` | `[1500, 3500]` | the jank-safe band |
| `max_kb` | `2048` | weight ceiling |
| `downscale_px` | `1024` | one downscale retry when still heavy |

Flags vocabulary (features, not failures): `band-edge` (converged at a ladder edge) ·
`over-ceiling` (still heavy after the downscale retry) · `chunky-by-content` (still
sparse at ld8 — the content is genuinely sparse).

CLI: `npx @ybelik/scene-tracer image.png out.svg [--min N --max N --max-kb N]`
Browser wiring (no build step): the package README shows the two-import jsDelivr pattern.

The numbers' home — policy rationale, acceptance criteria, the locked cell and the
measured ceiling: [TRACE-SETTINGS.md](../test-corpus/TRACE-SETTINGS.md).

## Build time — Python (`packages/scene-compiler/`)
```

## E9 · `docs/API.md` — extension seam line (exact-match-or-STOP)
OLD (1 line):
```
- **`POLICY`** (`trace_scene`) — pass a policy dict to override any `DEFAULT_POLICY` key.
```
NEW (1 line):
```
- **`POLICY`** (`scene-tracer`) — pass `{ policy }` to `traceScene` to override any `DEFAULT_POLICY` key.
```

## E10 · `docs/dod-g-part2-handover.md` — banner line ONLY (named exception; exact-match-or-STOP)
OLD (1 line — the banner):
```
> STATUS: EXECUTED · closed in the DOD-G PASS 2026-07-06 (dfee47e) · canonical now: packages/scene-compiler/trace_scene.py (the shipped tuner) + test-corpus/TRACE-SETTINGS.md (the policy)
```
NEW (1 line):
```
> STATUS: EXECUTED · closed in the DOD-G PASS 2026-07-06 (dfee47e) · canonical now: @ybelik/scene-tracer (the shipped tuner — JS, succeeded the Python original 2026-07-16) + test-corpus/TRACE-SETTINGS.md (the policy)
```
Everything below the banner stays byte-untouched — verify: `git diff --numstat main -- docs/dod-g-part2-handover.md` = `1	1`.

## PROBES (comment raw output on #44)
```bash
cd packages/scene-tracer && npm install && cd ../..
node packages/scene-tracer/bin/trace-scene.js test-corpus/raster/a4-photo-02.jpg /tmp/probe.svg
cat /tmp/probe.settings.json
grep -c "viewBox" /tmp/probe.svg                                     # expect 1
cd packages/scene-tracer && npm pack --dry-run 2>&1 | grep -E "Tarball|kB|files"; cd ../..
ls packages/scene-compiler/trace_scene.py 2>&1                       # expect: No such file
grep -rn "trace_scene" --include="*.md" . | grep -vE "docs/dod-|docs/generalization|docs/scene-compiler-js-kit|docs/docs-audit-kit|docs/collaboration|extraction-map|live-images-tbd|docs/README.md|generate/README.md:5[0-9]"
# ^ expect EMPTY — every live instruction-bearing ref is gone (residue whitelist: sealed docs,
#   L3 map, roadmap stage-vocabulary, the L4 descriptor line, generate's historical proof line)
git status --porcelain | grep node_modules ; echo "clean exit: $?"   # expect exit 1
git log --oneline main..HEAD                                         # expect exactly 3 commits, kit order
```
Plus: one run of the CLI on a JPEG (any) — decode branch coverage.

## STOP CONDITIONS
- branch exists · any E-pair OLD not found exactly once · tarball contains anything beyond the whitelist + package.json + README.md · CLI probe fails (courier the full error) · E10 numstat ≠ `1 1` · any file outside Scope would change

## AFTER THE PR (⛔ Asaf, in one sitting to close the npx gap)
1. Advisor verifies off remote → 2. **merge** → 3. from merged main: `cd packages/scene-tracer && npm publish --access public` (canary shape per #20: `npm pack` eyeball first; your token, your click) → 4. advisor verifies the package live on the registry + `npx` resolves → 5. follow-up order: tracer pen consumes `@ybelik/scene-tracer@0.1.0` from CDN (the ladder then lives in exactly one place) + codepens recipe line + #44 closes with evidence.
