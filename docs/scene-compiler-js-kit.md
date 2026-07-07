# SCENE-COMPILER JS PORT · KIT
### @ybelik/scene-compiler v0.1.0 · analyzer pass 2026-07-07 · source: compile_scene.py @ main (read in full)
### **PRE-PROVEN in the analyzer sandbox: 5/5 byte-parity vs the Python oracle on first run, + depth-2 parity + seed checks**

**Executor contract (unchanged house rules):** files below are COMPLETE — copy
byte-for-byte, never adapt. The parity gate is the truth-teller: if it fails,
STOP and report the diff; do not "fix" the JS to make it pass by feel.

## HAZARD TABLE (why the port looks the way it does)
| # | hazard | mirror decision |
|---|---|---|
| H1 | **Python `round()` = half-to-EVEN; JS `Math.round` = half-up.** Line 147 bucket formula hits exact .5 on real path counts | `pyRound()` (banker's) — the load-bearing function |
| H2 | `int(x,16)` throws on garbage → 0.5; `parseInt` silently truncates | strict `/^[0-9a-f]+$/` per hex pair; reproduces Python's odd-length tolerance (`#abcde` computes; 4-char → 0.5) |
| H3 | float formula must yield bit-identical doubles | identical literals + op order: `(0.299*r + 0.587*g + 0.114*b)/255` |
| H4 | sort stability + key evaluation | keys precomputed once; light-to-dark = descending comparator `(a,b)=>b.k-a.k`; ties→0 → stable (ES2019) ≡ Python stable sort on negated key |
| H5 | `re.sub` default = ALL; class-inject is `count=1`; `\1`→`$1` | strip/empty-clean use `/g`; inject uses first-only string/regex replace; `$1` |
| H6 | `re.DOTALL` on PATH_RE | no `.` in pattern → no-op; dropped with comment |
| H7 | jitter RNG (MT19937) | **declared deviation**: mulberry32, seeded-deterministic in JS, drawn in RANK order; `jitter=0` = the cross-language gate |
| H8 | regex `lastIndex` statefulness | fresh `/g` regex constructed inside `compileScene` |
| H9 | dual-language directory | JS joins `packages/scene-compiler/`; npm `files` whitelist ships ONLY the JS half |
| H10 | **verified quirk**: recompiling accretes one attribute space per pass (`class=""` removal leaves its flanking spaces) — inherited from Python, byte-identical in both languages, XML-harmless | documented, not fixed (doctrine); gates therefore test depth-2 cross-language parity + SEMANTIC idempotency (same buckets), never byte-stability across recompiles |

---

## FILE 1 · `packages/scene-compiler/scene-compiler.js` (complete)

```javascript
/*!
 * scene-compiler.js — JS port of compile_scene.py (Module A) for
 * @ybelik/scene-compiler. Browser global `SceneCompiler` + CommonJS.
 *
 * PARITY CONTRACT: byte-identical output to compile_scene.py at jitter=0
 * (gate: tests/parity_js.mjs vs the Python oracle, live). Jitter>0 is a
 * DECLARED DEVIATION: seeded mulberry32 (deterministic within JS; not
 * cross-language — MT19937 was not ported, aesthetic noise only), drawn
 * in RANK order per the original's call-sequence doctrine.
 *
 * Port hazards honored: pyRound (Python banker's rounding — Math.round
 * would mis-bucket exact .5 ranks), strict hex parsing (parseInt's silent
 * truncation vs int(x,16) throwing), replace-all vs first-only sub
 * semantics, stable-sort tie order, fresh /g regex per call.
 */
(function (global) {
  'use strict';

  var MAX_BUCKETS = 100; // shared contract with reveal-engine.js (b0..b99)

  /* Python round(): half-to-even. x >= 0 here. */
  function pyRound(x) {
    var f = Math.floor(x), d = x - f;
    if (d < 0.5) return f;
    if (d > 0.5) return f + 1;
    return (f % 2 === 0) ? f : f + 1;
  }

  /* mulberry32 — the declared jitter RNG (seeded, JS-deterministic). */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hexPair(s) {
    if (s.length === 0 || !/^[0-9a-f]+$/.test(s)) return null;
    return parseInt(s, 16);
  }

  /* verbatim mirror of get_color: fill attr -> fill-in-style ->
     stroke attr -> stroke-in-style -> #808080 */
  function getColor(tag) {
    var attrs = ['fill', 'stroke'];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      var m = tag.match(new RegExp('\\b' + attr + '="([^"]+)"'));
      if (m && m[1] !== 'none' && m[1] !== 'transparent') return m[1];
      m = tag.match(new RegExp('style="[^"]*\\b' + attr + '\\s*:\\s*([^;"]+)'));
      if (m) {
        var v = m[1].trim();
        if (v !== 'none' && v !== 'transparent') return v;
      }
    }
    return '#808080';
  }

  /* verbatim mirror of luminance: Rec.601, 0.5 fallbacks */
  function luminance(color) {
    var c = color.trim().toLowerCase();
    var r, g, b;
    if (c.charAt(0) === '#') {
      c = c.slice(1);
      if (c.length === 3) c = c.split('').map(function (ch) { return ch + ch; }).join('');
      r = hexPair(c.slice(0, 2)); g = hexPair(c.slice(2, 4)); b = hexPair(c.slice(4, 6));
      if (r === null || g === null || b === null) return 0.5;
    } else if (c.slice(0, 3) === 'rgb') {
      var nums = c.match(/\d+/g);
      if (nums && nums.length >= 3) {
        r = Number(nums[0]); g = Number(nums[1]); b = Number(nums[2]);
      } else return 0.5;
    } else {
      return 0.5; // named colors — skip
    }
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  var SORT_KEYS = {
    luminance: function (tag) { return luminance(getColor(tag)); }
  };
  var DIRECTIONS = ['light-to-dark', 'dark-to-light'];

  function compileScene(svgText, opts) {
    opts = opts || {};
    var sort = opts.sort !== undefined ? opts.sort : 'luminance';
    var direction = opts.direction !== undefined ? opts.direction : 'light-to-dark';
    var buckets = opts.buckets !== undefined ? opts.buckets : MAX_BUCKETS;
    var jitter = opts.jitter !== undefined ? opts.jitter : 8;
    var seed = opts.seed !== undefined ? opts.seed : null;

    if (!SORT_KEYS.hasOwnProperty(sort))
      throw new Error("unknown sort '" + sort + "'; registered: " +
                      Object.keys(SORT_KEYS).sort().join(', '));
    if (DIRECTIONS.indexOf(direction) === -1)
      throw new Error('direction must be one of ' + DIRECTIONS.join(' | '));
    if (!(buckets >= 2 && buckets <= MAX_BUCKETS))
      throw new Error('buckets must be 2..' + MAX_BUCKETS +
                      ' (runtime contract: reveal-engine.js b0..b' + (MAX_BUCKETS - 1) + ')');
    if (jitter < 0) throw new Error('jitter must be >= 0');

    var rand = mulberry32(seed === null ? (Math.random() * 4294967296) >>> 0 : seed);
    function randint(a, b) { return Math.floor(rand() * (b - a + 1)) + a; }

    var keyfn = SORT_KEYS[sort];
    var re = /<path\b[^>]*?>/g;                 // DOTALL dropped: no '.' in pattern
    var matches = [];
    var m;
    while ((m = re.exec(svgText)) !== null)
      matches.push({ index: m.index, text: m[0] });
    var n = matches.length;
    if (n === 0) return svgText;

    var items = matches.map(function (mm, i) {
      return { i: i, k: keyfn(mm.text) };       // key computed ONCE (mirrors key=)
    });
    var ranked = items.slice().sort(direction === 'light-to-dark'
      ? function (a, b) { return b.k - a.k; }   // ≡ sorted(key=-k), stable ties
      : function (a, b) { return a.k - b.k; });

    var span = buckets - 1;
    var denom = Math.max(n - 1, 1);
    var assignments = new Array(n);
    for (var rank = 0; rank < n; rank++) {      // jitter drawn in RANK order
      var bucket = pyRound(rank * span / denom);
      if (jitter) bucket = Math.max(0, Math.min(span, bucket + randint(-jitter, jitter)));
      assignments[ranked[rank].i] = bucket;
    }

    var out = svgText;                          // reverse rewrite (verbatim)
    for (var i = n - 1; i >= 0; i--) {
      var mt = matches[i];
      var bucket2 = assignments[i];
      var cleaned = mt.text.replace(/\brp\s+b\d+\s*/g, '')
                           .replace(/class="\s*"/g, '');
      var neu;
      if (cleaned.indexOf('class=') !== -1)
        neu = cleaned.replace(/class="([^"]*)"/, 'class="rp b' + bucket2 + ' $1"');
      else
        neu = cleaned.replace('<path', '<path class="rp b' + bucket2 + '"');
      out = out.slice(0, mt.index) + neu + out.slice(mt.index + mt.text.length);
    }
    return out;
  }

  /* auditMetrics — the linter half (mirrors audit_svg.audit_metrics). */
  var NONPATH_RE = /<(circle|rect|polygon|ellipse|line|polyline)\b/gi;
  function attrResolvable(tag) {
    var attrs = ['fill', 'stroke'];
    for (var i = 0; i < attrs.length; i++) {
      var attr = attrs[i];
      var m = tag.match(new RegExp('\\b' + attr + '="([^"]+)"'));
      if (m && m[1] !== 'none' && m[1] !== 'transparent') return true;
      m = tag.match(new RegExp('style="[^"]*\\b' + attr + '\\s*:\\s*([^;"]+)'));
      if (m && m[1].trim() !== 'none' && m[1].trim() !== 'transparent') return true;
    }
    return false;
  }
  function lumResolvable(color) {
    var c = color.trim().toLowerCase();
    if (c.charAt(0) === '#') {
      var h = c.slice(1);
      if (h.length === 3) h = h.split('').map(function (ch) { return ch + ch; }).join('');
      return hexPair(h.slice(0, 2)) !== null && hexPair(h.slice(2, 4)) !== null &&
             hexPair(h.slice(4, 6)) !== null;
    }
    if (c.slice(0, 3) === 'rgb') return (c.match(/\d+/g) || []).length >= 3;
    return false;
  }
  function auditMetrics(svgText, opts) {
    opts = opts || {};
    var re = /<path\b[^>]*?>/g, tags = [], m;
    while ((m = re.exec(svgText)) !== null) tags.push(m[0]);
    var n = tags.length, attrFb = 0, lumFb = 0;
    for (var i = 0; i < n; i++) {
      if (!attrResolvable(tags[i])) attrFb++;
      else if (!lumResolvable(getColor(tags[i]))) lumFb++;
    }
    var t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    var compiled = n ? compileScene(svgText, { seed: 42 }) : svgText;
    var ms = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - t0;
    var bset = {}, bm, bre = /\brp b(\d+)\b/g;
    while ((bm = bre.exec(compiled)) !== null) bset[bm[1]] = 1;
    return { paths: n, non_path: (svgText.match(NONPATH_RE) || []).length,
             kb: opts.kb !== undefined ? opts.kb : null,
             attr_fb: attrFb, lum_fb: lumFb, compile_ms: ms,
             buckets: Object.keys(bset).length };
  }

  var api = { compileScene: compileScene, auditMetrics: auditMetrics,
              luminance: luminance, getColor: getColor,
              SORT_KEYS: SORT_KEYS, MAX_BUCKETS: MAX_BUCKETS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.SceneCompiler = api;

})(typeof window !== 'undefined' ? window : this);
```

## FILE 2 · `packages/scene-compiler/tests/parity_js.mjs` (complete)

```javascript
// Cross-language parity gate: JS compileScene vs Python compile_scene (oracle).
// Gates: byte-identical at jitter=0 on the five canonical scenes; depth-2
// cross-language parity; JS jitter determinism; SEMANTIC idempotency (H10).
// Run from repo root: node packages/scene-compiler/tests/parity_js.mjs
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = join(here, '..');                       // packages/scene-compiler
const repo = join(pkg, '..', '..');                 // repo root
const { compileScene } = createRequire(import.meta.url)(join(pkg, 'scene-compiler.js'));

const SCENES = ['01-quiet-sun', '02-vivid-sun', '03-bird', '04-empty-rock', '05-girl']
  .map(n => join(repo, 'demo', 'svg', n + '.svg'));

const tmp = mkdtempSync(join(tmpdir(), 'parity-'));
let fail = 0;
console.log('scene                    jitter=0 byte-parity');
console.log('---------------------------------------------');
for (const scene of SCENES) {
  const src = readFileSync(scene, 'utf8');
  const js = compileScene(src, { jitter: 0 });
  const outPy = join(tmp, 'py.svg');
  execFileSync('python3', [join(pkg, 'compile_scene.py'), scene,
    '--out', outPy, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
  const py = readFileSync(outPy, 'utf8');
  const ok = Buffer.from(js, 'utf8').equals(Buffer.from(py, 'utf8'));
  console.log(`${scene.split('/').pop().padEnd(24)} ${ok ? 'PASS' : 'FAIL'}`);
  if (!ok) {
    fail++;
    for (let i = 0; i < Math.min(js.length, py.length); i++)
      if (js[i] !== py[i]) {
        console.log(`  first diff @ char ${i}:`);
        console.log(`  js: …${js.slice(Math.max(0, i - 40), i + 40)}…`);
        console.log(`  py: …${py.slice(Math.max(0, i - 40), i + 40)}…`);
        break;
      }
  }
}
// declared-deviation + invariant checks
const src0 = readFileSync(SCENES[0], 'utf8');
const a = compileScene(src0, { seed: 42 }), b = compileScene(src0, { seed: 42 });
const c = compileScene(src0, { seed: 43 });
// Verified quirk (H10): recompiling accretes one attribute space per pass —
// inherited from Python, identical in both languages, XML-harmless. Honest
// invariants: (1) cross-language parity at depth 2, (2) SEMANTIC idempotency.
const js1 = compileScene(src0, { jitter: 0 });
const js2 = compileScene(js1, { jitter: 0 });
const py1 = join(tmp, 'py1.svg'), py2p = join(tmp, 'py2.svg');
execFileSync('python3', [join(pkg, 'compile_scene.py'), SCENES[0],
  '--out', py1, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
execFileSync('python3', [join(pkg, 'compile_scene.py'), py1,
  '--out', py2p, '--jitter', '0'], { stdio: ['ignore', 'ignore', 'inherit'] });
const depth2 = js2 === readFileSync(py2p, 'utf8');
const bk = s => (s.match(/\brp b(\d+)\b/g) || []).join(',');
const semIdem = bk(js1) === bk(js2);
console.log('---------------------------------------------');
console.log(`jitter determinism (seed 42 == seed 42): ${a === b ? 'PASS' : 'FAIL'}`);
console.log(`jitter divergence  (seed 42 != seed 43): ${a !== c ? 'PASS' : 'FAIL'}`);
console.log(`depth-2 cross-language parity:           ${depth2 ? 'PASS' : 'FAIL'}`);
console.log(`semantic idempotency (buckets p1==p2):   ${semIdem ? 'PASS' : 'FAIL'}`);
if (a !== b || a === c || !depth2 || !semIdem) fail++;
rmSync(tmp, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
```

## FILE 3 · `packages/scene-compiler/package.json` (complete — NEW file; dir had none)

```json
{
  "name": "@ybelik/scene-compiler",
  "version": "0.1.0",
  "description": "Bucket compiler for the ybelik story engine — sorts SVG paths by luminance and injects rp bN classes so reveal-engine can paint them light to dark. JS port, byte-parity with the Python original at jitter=0. Includes the input linter (auditMetrics).",
  "main": "scene-compiler.js",
  "files": ["scene-compiler.js"],
  "license": "MIT",
  "author": "Asaf Golan",
  "repository": { "type": "git", "url": "git+https://github.com/asafgolan/ybelik-story-engine.git", "directory": "packages/scene-compiler" },
  "homepage": "https://github.com/asafgolan/ybelik-story-engine#readme",
  "keywords": ["svg", "compiler", "bucketing", "luminance", "ink-wash", "animation", "reveal"],
  "publishConfig": { "access": "public" }
}
```

## FILE 4 · `packages/scene-compiler/README.md` (complete — becomes the npm face)

```markdown
# @ybelik/scene-compiler

Bucket compiler for the [ybelik story engine](https://github.com/asafgolan/ybelik-story-engine):
sorts an SVG's `<path>`s by luminance and injects `class="rp bN"` (N = 0..99) so
[`@ybelik/reveal-engine`](https://www.npmjs.com/package/@ybelik/reveal-engine)
can paint the scene in tonal order — light washes first, ink last.

## Use (script tag — primary)
```
<script src="https://unpkg.com/@ybelik/scene-compiler/scene-compiler.js"></script>
```
```js
const scene = SceneCompiler.compileScene(svgText, { jitter: 0, seed: 42 });
const report = SceneCompiler.auditMetrics(svgText);   // paths, fallback shares…
```
Works in Node too (`require('@ybelik/scene-compiler')`).

Input contract: **traced SVGs** (flat `<path>`s, each with its own fill — what
image tracers emit). Hand-authored SVGs with group-inherited fills, gradients
or named colors mid-bucket by design; `auditMetrics` detects exactly that
(`attr_fb` / `lum_fb`) before you compile.

Fidelity: the JS is **byte-identical to the Python original at `jitter=0`**
(cross-language parity gate in the repo). `jitter > 0` is seeded and
deterministic *within JS* (mulberry32) — an aesthetic knob, declared as not
cross-language-reproducible.

MIT · part of the ybelik story engine monorepo.
```

---

## TICKET PLAN (S-epic + S1–S4; created on Asaf's go)

**S1 [machine] · branch + drop-in + parity gate.** Branch `feature/scene-compiler-js`
off main; copy FILES 1–2 verbatim; `cp LICENSE packages/scene-compiler/`;
run `node packages/scene-compiler/tests/parity_js.mjs` → **5× PASS + 4 invariant
checks PASS** (pre-proven in the analyzer sandbox 2026-07-07, first run 5/5);
paste output. Python parity suite re-run (still 10/10 — untouched).
FAIL = STOP with the first-diff hunk; never adjust JS to force a pass.
**S2 [machine] · package prep.** FILES 3–4 verbatim; `npm pack --dry-run` proof —
tarball EXACTLY `package.json · README.md · LICENSE · scene-compiler.js`
(the Python files must NOT appear — the `files` whitelist is the fence);
commit; PR → **[ASAF merges]**.
**S3 [machine] · publish.** Canary `npm publish` (house convention), verify,
done — it's one package. Registry URL + `npm view` in the comment.
**S4 [machine] · verify.** Cold-install + require smoke
(`typeof compileScene === 'function'`, auditMetrics on a fixture), unpkg check,
badge line appended to the root-README badge row (PR → [ASAF merges]).
**On PASS:** the pens epic unblocks with its full dependency set — four live
CDN packages, the money pen's compile-time scrubbers now possible.
