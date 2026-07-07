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
