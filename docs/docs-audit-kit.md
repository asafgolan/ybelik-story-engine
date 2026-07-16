# D0 · DOCS AUDIT KIT — docs consolidation (epic #24 · tickets D1–D3)
### ybelik-story-engine · analyzer pass 2026-07-16 · everything read fresh @ `main` = `ce8d28e`
### PRE-PROVEN (analyzer sandbox, 2026-07-16): every §7 OLD block verified unique + byte-exact @ `ce8d28e` · all six sealed docs verified banner-free at line 1 · QUICKSTART Lane B executed verbatim (vtracer 0.6.15: converged `cp8/ld8` · 1311 paths · audit 0.0%/0.0% · 100 buckets) · Lane A compile verified in Node (7 paths → `b0..b99`, lightest=b0, darkest=b99) · all four npm pins live `@0.1.0` (registry-checked)

Rulings ratified by Asaf 2026-07-16 (checkpoint 2 + relay): codepens/README stays **live**
(seal deferred until pens-v1 closes) · generate's pipeline diagram → one line, position
survives · generalization-report sealed but remains home of the **claims-of-record**
(live pitch is a different fact, homed at L0) · TRACE-SETTINGS gains one baseline-vs-policy
clarifier line.

---

## EXECUTOR CONTRACT — read before anything

1. **No discovery. No judgment. No improvement.** Every change is an exact OLD→NEW
   pair or a complete replacement/new file below. You never search for what to change;
   you match what is written here.
2. **Exact-match-or-STOP:** before each §7 edit, verify the OLD block exists
   byte-for-byte, exactly once. Mismatch ⇒ STOP + comment the diff on the ticket;
   the analyzer re-syncs. Never adapt.
3. Ticket order **D1 → D2 → D3**; within §7, apply in listed order (E1→E4).
4. **Scope (touchable files, exhaustive):**
   NEW: `docs/docs-audit-kit.md` (this file) · `docs/README.md` · `docs/QUICKSTART.md` · `docs/API.md`
   BANNER-ONLY (+2 lines at top, nothing else): the six §4 docs
   EDIT-PER-§7: `README.md` · `packages/generate/README.md` · `test-corpus/TRACE-SETTINGS.md`
   Everything else is read-only.
5. If a board ticket's wording and this kit disagree on a value, **the kit wins**
   (#25: "kit wins on values"). Known deltas are flagged inline with ⚠ KIT-WINS.
6. Comment proofs raw and complete on #26 / #27 / #28 per §8. Never self-declare
   acceptance — the advisor judges.

## GIT LINE

Preconditions (⛔ STOP on any failure):
- `git ls-remote origin refs/heads/main` head = `ce8d28e860f9eb7a430723ec07f6064a48f0f2e3` (else STOP: repo drifted since audit)
- `feature/docs-consolidation` does not exist on origin (else STOP)

Then:
```bash
git switch main && git pull && git switch -c feature/docs-consolidation
```
- **Commit 1** — this file, verbatim, at `docs/docs-audit-kit.md`:
  `docs: D0 audit kit (analyzer pass 2026-07-16)`
- **Commit 2 (D1)** — §4 banners + §5 spine:
  `docs: status banners on sealed DOD/kit docs + docs index (L0–L4 spine)`
- **Commit 3 (D2)** — §6 QUICKSTART.md + API.md:
  `docs: QUICKSTART + API reference (L1/L2)`
- **Commit 4 (D3)** — §7 manifest:
  `docs: dedupe — one home per fact, pointers elsewhere`

Two-commit discipline honored: the verbatim artifact (this kit) is its own commit,
separate from every edit. `git push -u origin feature/docs-consolidation`; open **one PR**
titled `docs consolidation — banners, spine, QUICKSTART/API, dedupe (D1–D3, epic #24)`.
**No squash. Never merge.** ⛔ Merge is Asaf's.

---

## §1 CONTENT MAP — one home per fact

| fact | home (live) | everywhere else |
|---|---|---|
| pipeline description (4-stage diagram) | root `README.md` | one-line parenthetical + link in the 4 npm-face package READMEs = pointers (stay); `generate/README` → pointer via E3; sealed occurrences exempt |
| repo layout table | root `README.md` | — |
| docs entry point | `docs/README.md` (the spine, new) | root README points at it (E1) |
| pens: which exist, state, recipes | `codepens/README.md` (**live**, the pen home) | root README's showcase row = pointer (E2) |
| trace policy numbers (cp8 pin · ld ladder · locked cell · jank ceiling · bird row) | `test-corpus/TRACE-SETTINGS.md` | `API.md` states `DEFAULT_POLICY` keys/defaults as code-surface facts and links here for rationale; sealed exempt |
| trace acceptance criteria | `test-corpus/TRACE-SETTINGS.md` | QUICKSTART links |
| input contract (traced SVGs; hand-authored may mis-bucket) | `packages/scene-compiler/README.md` (npm face) | sealed copies resolved by banners |
| load orders | the package READMEs | codepens copies are pen recipes with pen-specific pins — not dupes (ruling 1) |
| `MAX_BUCKETS = 100` (the one hard contract) | `docs/API.md` | one-line contract citations elsewhere stay |
| full parameter surface | `docs/API.md` (new) | — |
| **claims-of-record** (what DOD-G proved, in the words it was proved in — GG3 envelope) | `docs/generalization-report.md` (sealed) | **live pitch is a different fact, homed at L0 (root README).** When the public pitch evolves, edit L0 — never the sealed report; the report stays the evidence the pitch descends from. |
| Corpus-B license paper trail | `test-corpus/corpus-b/CORPUS-B-SOURCES.md` | — |
| live-image levers / img2img roadmap | `docs/live-images-tbd.md` | — |

## §2 DUPE/DRIFT RULINGS (live layer only; sealed exempt — history may repeat itself)

- **Pipeline line** — 5 live restatements found. Ruling: full description homes in root
  README; the single-line link-carrying mentions in `reveal-engine`/`scene-player`/
  `navigation-shell`/`scene-compiler` READMEs are pointers and **stay** (npm pages must
  stand alone); `generate/README`'s ASCII diagram is a true second rendering → E3.
- **Trace numbers / ceiling / bird landmark** — already single-homed in the live layer
  (TRACE-SETTINGS). No dedupe edit. One *clarity* drift found: the baseline table shows
  `color_precision 6` while the locked policy pins 8 → E4 (one labeled line; ratified).
- **Load orders / input contract / MAX_BUCKETS** — live homes already correct (§1); the
  sealed-side copies (`scene-compiler-js-kit.md` FILE 4 = verbatim README twin — the
  flagship dupe) are resolved by §4 banners, per the canonicality-inversion decision.
- **Docs entry** — root README currently routes to the extraction map → E1 reroutes to
  the spine; the map becomes L3 inside it.
- Provenance note, no action: DOD-G landed as a squash (`dfee47e`, 2026-07-06) —
  predates the no-squash convention; banners cite the commit as-is.

## §3 PER-FILE SCOPE RULINGS (all 20 markdown files @ `ce8d28e`)

**live-canonical (12):** root `README.md` (edit-per-§7) · `packages/reveal-engine/README.md` ·
`packages/scene-player/README.md` · `packages/navigation-shell/README.md` ·
`packages/scene-compiler/README.md` · `packages/generate/README.md` (edit-per-§7) ·
`packages/entity-engine/README.md` (4 lines by design) · `test-corpus/TRACE-SETTINGS.md`
(edit-per-§7) · `test-corpus/corpus-b/CORPUS-B-SOURCES.md` · `docs/live-images-tbd.md` ·
`docs/reusable-components-extraction-map.md` (**L3, unchanged** — epic decision) ·
`codepens/README.md` (**live pen home** — ruling 2026-07-16; seal deferred to pens-v1 close)

**sealed-historical, banner per §4 (6):** `docs/dod-g-plan.md` · `docs/dod-g-part2-handover.md` ·
`docs/generalization-report.md` · `docs/dod-r-plan.md` · `docs/dod-r-edit-manifest.md` ·
`docs/scene-compiler-js-kit.md`

**operational, outside the spine's L-layers, dedupe-exempt (2):** root `CLAUDE.md`
(executor overlay) · `docs/collaboration-constitution.md` (reference copy,
duplicate-by-design; indexed under Adjacent/governance in the spine)

(+ this kit lands as file 21, `docs/docs-audit-kit.md`, and becomes L4 history the
moment the PR merges.)

## §4 BANNER TEXTS (D1) — verbatim, six files

**Mechanics:** insert the banner as **new line 1**, followed by **one blank line**, before
the file's existing first line. Nothing else in the file changes.
Proof per file: `git diff --numstat main -- <file>` prints exactly `2	0	<file>`.

`docs/dod-g-plan.md`:
```
> STATUS: EXECUTED · DOD-G PASS 2026-07-06 (commit dfee47e) · canonical now: generalization-report.md (the verdict) + the shipped pipeline stages
```

`docs/dod-g-part2-handover.md`:
```
> STATUS: EXECUTED · closed in the DOD-G PASS 2026-07-06 (dfee47e) · canonical now: packages/scene-compiler/trace_scene.py (the shipped tuner) + test-corpus/TRACE-SETTINGS.md (the policy)
```

`docs/generalization-report.md`:
```
> STATUS: SEALED VERDICT · recorded 2026-07-06 · remains the home of the claims-of-record (the GG3 envelope, in the words it was proved in); the live pitch evolves at the root README, never here
```

`docs/dod-r-plan.md`:
```
> STATUS: EXECUTED · DOD-R sealed via PR #9 + tag engine-2.0-layout (2026-07-06) · canonical now: the repo layout itself + the root README table
```

`docs/dod-r-edit-manifest.md`:
```
> STATUS: EXECUTED · consumed by PR #9 (engine-2.0-layout, 2026-07-06) · canonical now: the shipped files; this is the record of how they moved
```

`docs/scene-compiler-js-kit.md`:
```
> STATUS: EXECUTED · shipped via PR #22 (2026-07-07) · canonical now: packages/scene-compiler/scene-compiler.js + its README on npm; this kit's FILE 1–4 are the historical source
```

## §5 THE SPINE — `docs/README.md` (D1) — complete file, verbatim

```markdown
# ybelik docs — the index

Progressive disclosure, five layers. Start where your question lives:

| layer | doc | answers |
|---|---|---|
| **L0 · pitch** | [../README.md](../README.md) | what is this? — plus live pens, layout, how to run |
| **L1 · quickstart** | [QUICKSTART.md](QUICKSTART.md) | how do I see it work in two minutes — or with my own image? |
| **L2 · reference** | [API.md](API.md) | every function, option, CLI flag, endpoint, and the one hard contract |
| **L3 · architecture** | [reusable-components-extraction-map.md](reusable-components-extraction-map.md) | why is it shaped this way? — the authoritative module map + every DOD verdict |
| **L4 · history** | below | how did it get here? |

## L4 — the sealed records

Each carries a `> STATUS:` banner on line 1; everything below the banner is
byte-preserved history (ADR doctrine: status-marked, never deleted, never moved).

- [dod-g-plan.md](dod-g-plan.md) — the generalization gate: plan + corpus design
- [dod-g-part2-handover.md](dod-g-part2-handover.md) — DOD-G part 2: locked decisions + the `trace_scene` spec
- [generalization-report.md](generalization-report.md) — the DOD-G verdict · home of the claims-of-record (GG3 envelope)
- [dod-r-plan.md](dod-r-plan.md) — the restructure gate: flat root → `packages/`
- [dod-r-edit-manifest.md](dod-r-edit-manifest.md) — DOD-R implementation-grade manifest
- [scene-compiler-js-kit.md](scene-compiler-js-kit.md) — the JS port kit, shipped as `@ybelik/scene-compiler`
- [docs-audit-kit.md](docs-audit-kit.md) — this consolidation's own kit (D0)

## Adjacent

- **Roadmap (exploratory):** [live-images-tbd.md](live-images-tbd.md) — live/styled image levers; the img2img path
- **Pens (live home):** [../codepens/README.md](../codepens/README.md) — the five pens: links, recipes, proofs
- **Trace policy (the numbers' home):** [../test-corpus/TRACE-SETTINGS.md](../test-corpus/TRACE-SETTINGS.md)
- **Governance (reference copy):** [collaboration-constitution.md](collaboration-constitution.md)
```

## §6 THE TWO CONSUMER DOCS (D2) — complete files, verbatim

⚠ KIT-WINS: ticket #27 and #29 say "four CDN tags" for Lane A; the honest minimum is
**two** — this kit's value stands. The full-experience load orders live where §1 homes
them (the package READMEs) and are linked, not restated.

### `docs/QUICKSTART.md`

```markdown
# Quickstart

Two lanes. **Lane A**: see a reveal in two minutes, browser only, nothing to install.
**Lane B**: bring your own image through the Python trace stage — and reveal that instead.

## Lane A — two script tags, two minutes

Paste this into a blank `.html` file and open it in a browser (no server needed):

```html
<script src="https://unpkg.com/@ybelik/scene-compiler@0.1.0/scene-compiler.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
<div id="stage" style="max-width:480px"></div>
<script>
  // a tiny traced-style scene: flat paths, own fills, light washes → dark ink
  const svg = `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 210 Q200 150 400 220 L400 300 L0 300 Z" fill="#d9d2c4"/>
  <path d="M0 240 Q200 190 400 250 L400 300 L0 300 Z" fill="#bcb2a0"/>
  <path d="M40 250 Q60 170 90 250 Z" fill="#8f8574"/>
  <path d="M300 260 Q330 160 365 260 Z" fill="#6e6353"/>
  <path d="M150 265 Q185 130 225 265 Z" fill="#4a4238"/>
  <path d="M175 150 Q190 120 210 145 Q225 165 200 170 Q180 168 175 150 Z" fill="#2a251f"/>
  <path d="M195 90 L205 60 L215 92 Z" fill="#14110e"/>
</svg>`;
  const stage = document.getElementById('stage');
  stage.innerHTML = SceneCompiler.compileScene(svg, { jitter: 0 });
  const engine = new RevealEngine(stage);
  let level = -1;
  const timer = setInterval(() => {
    engine.setLevel(++level);
    if (level >= engine.bucketCount - 1) clearInterval(timer);
  }, 30);
</script>
```

The compiler sorts the paths by luminance and classes them `rp b0..b99`; the engine
paints them in tonal order — light washes first, ink last. Swap the inline SVG for any
traced SVG (Lane B makes one from your image).

**The full experience** — descriptor-driven player, scroll engagement, gestures, dots —
is the same pattern with more tags. Load orders live in each package's README
([scene-player](../packages/scene-player/README.md) ·
[navigation-shell](../packages/navigation-shell/README.md)); working, proven examples
are the [live pens](../codepens/README.md).

## Lane B — bring your own image (the Python trace stage)

```bash
git clone https://github.com/asafgolan/ybelik-story-engine.git
cd ybelik-story-engine
pip install vtracer
python3 packages/scene-compiler/trace_scene.py your-image.jpg your-scene.svg
python3 packages/scene-compiler/compile_scene.py your-scene.svg --out your-scene.compiled.svg --seed 42
```

`trace_scene` auto-tunes the trace for you — `color_precision` pinned at 8 (the quality
axis), `layer_difference` walked down a ladder until the path count lands in the
jank-safe band — and prints the chosen cell, the ladder it walked, and any flag.
A `.settings.json` sidecar lands next to the trace: the full reproduction recipe.

Optional lint before you ship it anywhere:

```bash
python3 packages/scene-compiler/audit_svg.py your-scene.compiled.svg
```

What good looks like: `attr-fb ≈ 0%` · `lum-fb ≈ 0%` · 100 buckets · paths in the
1,500–3,500 band. The policy, the acceptance criteria, and why:
[TRACE-SETTINGS.md](../test-corpus/TRACE-SETTINGS.md).

**Reveal it:** paste your compiled SVG into Lane A's page in place of the inline scene —
or serve the repo (`python3 -m http.server 8000`) and walk it in `/labs/scene-lab.html`.

**No image at all?** Bring intent instead — a style + a subject. That's pipeline
stage 0: [packages/generate](../packages/generate/README.md).
```

### `docs/API.md`

```markdown
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
```

## §7 D3 EDIT MANIFEST — exact-match-or-STOP pairs, apply in order

**E1 · `README.md` — docs entry reroutes to the spine**

OLD (3 lines, exact):
```
**Docs** — start at [docs/reusable-components-extraction-map.md](docs/reusable-components-extraction-map.md)
(the module map; every extraction verdict). Generalization gate:
[docs/generalization-report.md](docs/generalization-report.md).
```
NEW:
```
**Docs** — start at [docs/README.md](docs/README.md) — the index:
quickstart → API → architecture → history.
```

**E2 · `README.md` — pens row gains its home pointer**

OLD (1 line, exact):
```
**live pens:** [live compile](https://codepen.io/asafgolan/pen/ZYLrzQO) · [bucket reveal](https://codepen.io/asafgolan/pen/MYJQgKy) · [scene player](https://codepen.io/asafgolan/pen/QwdQLyW) · [full shell](https://codepen.io/asafgolan/pen/bNgLbVP) · [all pens](https://codepen.io/asafgolan/pen/JoEpPGr)
```
NEW (1 line):
```
**live pens:** [live compile](https://codepen.io/asafgolan/pen/ZYLrzQO) · [bucket reveal](https://codepen.io/asafgolan/pen/MYJQgKy) · [scene player](https://codepen.io/asafgolan/pen/QwdQLyW) · [full shell](https://codepen.io/asafgolan/pen/bNgLbVP) · [all pens](https://codepen.io/asafgolan/pen/JoEpPGr) — index & recipes: [codepens/](codepens/README.md)
```

**E3 · `packages/generate/README.md` — diagram dies, position survives (ratified ruling 2)**

OLD (exact, incl. the fenced block):
````
Completes the pipeline the extraction map opened with `TRACE (GAP)`:

```
GENERATE (this) → trace_scene → compile_scene → runtime
   intent            auto-tune      buckets        paints
```
````
NEW:
```
Completes the pipeline the extraction map opened with `TRACE (GAP)`. Stage 0 of
`generate → trace → compile → reveal` (the pipeline's home: the
[root README](../../README.md)) — this worker is the GENERATE stage, feeding
`trace_scene.py`.
```

**E4 · `test-corpus/TRACE-SETTINGS.md` — baseline vs policy clarifier (ratified ruling 4)**

OLD (1 line, exact):
```
## Baseline settings (apply to every Corpus-A trace unless the sweep says otherwise)
```
NEW (heading + blank + one blockquote line):
```
## Baseline settings (apply to every Corpus-A trace unless the sweep says otherwise)

> Baseline = the sweep's starting values (historical; the `color_precision 6` below is superseded). Production pins `color_precision = 8` — see LOCKED POLICY above and `DEFAULT_POLICY` in `packages/scene-compiler/trace_scene.py`.
```

## §8 ACCEPTANCE + VERIFICATION PROBES (comment raw output on the tickets)

**D1 (#26):**
```bash
for f in docs/dod-g-plan.md docs/dod-g-part2-handover.md docs/generalization-report.md \
         docs/dod-r-plan.md docs/dod-r-edit-manifest.md docs/scene-compiler-js-kit.md; do
  git diff --numstat main -- "$f"; head -1 "$f"; done
ls -la docs/README.md
# every relative link in the spine resolves:
cd docs && for p in ../README.md QUICKSTART.md API.md reusable-components-extraction-map.md \
  dod-g-plan.md dod-g-part2-handover.md generalization-report.md dod-r-plan.md \
  dod-r-edit-manifest.md scene-compiler-js-kit.md docs-audit-kit.md live-images-tbd.md \
  ../codepens/README.md ../test-corpus/TRACE-SETTINGS.md collaboration-constitution.md; do
  [ -f "$p" ] && echo "OK  $p" || echo "MISSING  $p"; done; cd ..
```
Accept: six `2	0` lines · six `head -1` lines each starting `> STATUS:` · zero MISSING.
(Note: QUICKSTART.md/API.md show MISSING until D2 — run the link loop again after D2
and paste both runs.)

**D2 (#27):**
```bash
ls -la docs/QUICKSTART.md docs/API.md
node -e "const{compileScene}=require('./packages/scene-compiler/scene-compiler.js');const s='<svg><path d=\"M0 0\" fill=\"#d9d2c4\"/><path d=\"M0 0\" fill=\"#14110e\"/></svg>';console.log((compileScene(s,{jitter:0}).match(/rp b\d+/g)||[]).join(' '))"
```
Accept: both files exist · node prints `rp b0 rp b99` (lightest→b0, darkest→b99 —
the Lane A mechanism). Lane B was pre-proven by the analyzer (header); do **not**
install vtracer in-session unless Asaf asks.

**D3 (#28):**
```bash
python3 - << 'EOF'
import io
pairs = [
 ("README.md", "start at [docs/README.md](docs/README.md)", "docs/reusable-components-extraction-map.md](docs/reusable"),
 ("README.md", "index & recipes: [codepens/](codepens/README.md)", None),
 ("packages/generate/README.md", "this worker is the GENERATE stage", "GENERATE (this) → trace_scene"),
 ("test-corpus/TRACE-SETTINGS.md", "Production pins `color_precision = 8`", None),
]
for path, new, old in pairs:
    b = io.open(path, encoding="utf-8").read()
    print(path, "NEW:", b.count(new), ("OLD:"+str(b.count(old))) if old else "")
EOF
```
Accept: every `NEW: 1`; every printed `OLD: 0`.

**PR-level:** `git log --oneline main..HEAD` → exactly 4 commits, messages per GIT LINE,
in order. No squash.

## §9 STOP CONDITIONS (report, never improvise)

- `origin/main` ≠ `ce8d28e…` at branch time
- `feature/docs-consolidation` already exists on origin
- any §7 OLD block not found exactly once, byte-for-byte
- any §4 target whose current line 1 already starts with `>`
- any change that would touch a file outside the §Scope list
