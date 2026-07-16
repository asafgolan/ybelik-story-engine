# API — the full parameter surface

Pinned to source @ `main` `ce8d28e` (2026-07-16). Six functions, two CLIs, one
endpoint, two extension seams, one hard contract.

## The one hard contract

**`MAX_BUCKETS = 100`** — bucket classes are `rp b0..b99`, shared byte-for-byte between
compiler (both languages) and `reveal-engine`. The `buckets` option accepts 2..100;
the runtime discovers the count from the SVG.

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

### `compile_scene(svg_text, sort='luminance', direction='light-to-dark', buckets=MAX_BUCKETS, jitter=8, seed=None) → svg_text`

Traced SVG in, scene-ready SVG out: paths sorted by the key, distributed across
buckets, `class="rp bN"` injected.

| option | default | values |
|---|---|---|
| `sort` | `'luminance'` | any key in `SORT_KEYS` (sole registered key today) |
| `direction` | `'light-to-dark'` | `'light-to-dark'` \| `'dark-to-light'` |
| `buckets` | `100` | 2..`MAX_BUCKETS` |
| `jitter` | `8` | ≥ 0 — organic bucket variation (crisp ↔ painterly) |
| `seed` | `None` | seed the jitter for reproducibility |

CLI: `python3 packages/scene-compiler/compile_scene.py input.svg --out out.svg [--in-place] [--sort K] [--direction D] [--buckets N] [--jitter N] [--seed N]`

### `audit_svg` — the input linter

`audit_metrics(svg_text, kb=None) → dict` with keys
`{paths, non_path, kb, attr_fb, lum_fb, compile_ms, buckets}`.
`attr_fb` = paths with no own fill/stroke (the group-fill signature → `#808080`);
`lum_fb` = unparseable colors (named/gradient → the 0.5 fallback). Small fallback
shares are harmless; structural ones are not — this is the tool that tells them apart
before you compile.

CLI (a table formatter over the dict): `python3 packages/scene-compiler/audit_svg.py file.svg [more.svg …]`

## Build time — JS (`@ybelik/scene-compiler`)

`SceneCompiler.compileScene(svgText, { sort, direction, buckets, jitter, seed })` —
**identical options and defaults** to the Python. Parity: byte-identical output at
`jitter=0` (the cross-language gate); `jitter > 0` is seeded mulberry32 —
deterministic *within JS*, declared as not cross-language-reproducible.

`SceneCompiler.auditMetrics(svgText, { kb })` — same keys as the Python dict.

Also exported: `luminance`, `getColor`, `SORT_KEYS`, `MAX_BUCKETS`.
Browser global `SceneCompiler` + CommonJS (`require('@ybelik/scene-compiler')`).

## Stage 0 — generate (`packages/generate/`)

Worker endpoints:

- `GET /health` → `{ ok, styles, model }`
- `POST /generate` (Bearer token) — body `{ style, subject, seed?, steps? }` →
  JPEG bytes + `X-Gen-Settings` header (JSON: the reproduction recipe).
  Unknown style / bad subject → 400 · missing/bad token → 401 ·
  `steps` clamped 1..8 (default 4) · `seed` random unless given (same
  style+subject+seed = byte-identical image).

Client CLI:
`python3 generate_scene.py --style S --subject "…" --name basename [--seeds 42-45] [--steps 4] [--out DIR] [--endpoint URL] [--token T]`

Env pair: `GENERATE_ENDPOINT` · `GENERATE_TOKEN`. Clients MUST send a non-default
`User-Agent` (Cloudflare bot filter, error 1010) — `generate_scene.py` does.

## Runtime — browser globals

### `RevealEngine` (`@ybelik/reveal-engine`)

`new RevealEngine(container)` — container holds one compiled SVG.

- `.setLevel(n)` — show buckets 0..n; delta-only writes; rounds + clamps to [-1, 99]
- `.fill()` / `.clear()` — jump to 99 / −1
- `.level` (getter) · `.bucketCount` · `.pathCount` — discovered from the SVG
- `RevealEngine.reducedMotion` (static) — drivers branch on this and call `.fill()`
  instead of tweening

### `ScenePlayer` (`@ybelik/scene-player` — needs `RevealEngine` + `gsap`, plus its CSS)

`new ScenePlayer(stageEl, story, config)` — builds panels + captions from the
descriptor; **fetches** each `scenes[].asset` by URL.

story shape: `{ meta, config, scenes: [{ id, name, asset, enter, caption: { num, he, en, position } }] }`

config defaults: `transition 'dissolve-repaint'` · `reveal { duration: 1.6, ease: 'power1.out' }` ·
`captionDelay 0.35` · `captionSlide 12` · `hideDuration 0.45` · `jumpHideDuration 0.35` ·
`onSceneChange(i)` · `onBoundary(dir)`

Surface: `.ready` (promise) · `.goTo(i)` · `.next()` / `.prev()` ·
`.state` = `{ i, painted, busy }`

### navigation-shell (`@ybelik/navigation-shell` — needs `gsap` + `ScrollTrigger`)

- `new ScrollEngagement({ trigger*, exitSelector, seam: { entry: 800, exit: 600 }, scrollStart, scrollEnd, onEngage, onExitForward, onExitBackward, onDisengaged })`
- `new GestureNavigator({ engagement*, onStep*, isBusy, cooldown: 250, wheelLock: 350, wheelThreshold: 4, touchThreshold: 30, downKeys, upKeys })`
- `new ProgressDots(container, count)` · `.setActive(i)`

(`*` = required; numeric defaults are the verbatim production values.)

## Extension seams (two)

- **`SORT_KEYS`** (compiler, both languages) — register a sort key `fn(pathTag) → number`;
  `'luminance'` is the sole registered key today.
- **`POLICY`** (`trace_scene`) — pass a policy dict to override any `DEFAULT_POLICY` key.

Load orders per package: the package READMEs (their home). Pipeline overview: the
[root README](../README.md).
