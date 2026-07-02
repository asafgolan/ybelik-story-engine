# Reusable Component Extraction Map
### ybelik / Yael ink-wash story engine

> **Status: 5/5 modules extracted · integration complete** (A compile_scene · B reveal-engine · C scene-player · D navigation-shell · E theme-tokens). Production `index.html` runs entirely on the module stack + `story.json` + ~55 lines of glue. Monolith retired to git history (DOD-D, 2026-07-02). Verdicts: DOD-1/A/C/D below.

**Scope.** Catalog the reusable engine that currently lives inside two files —
`svg/bucket_svg.py` (build-time) and `index.html` (runtime) — and define the module
shape to extract it into. No code changes proposed here; this is the map that the
CMS/editor and the multi-project future are built on.

**The one distinction that governs everything below:** separate the *engine* (generic,
reusable, becomes a library) from the *story data* (Yael-specific content the editor
edits) from the *theme* (a slot with Yael's values plugged in). Most of the value is
that the engine is currently entangled with all three inside `index.html`.

---

## 1. Pipeline & boundary

```
  ┌─────────────┐     ┌──────────────────┐     ┌────────────────────────┐
  │  TRACE      │ --> │  SCENE-COMPILER  │ --> │  RUNTIME (in the page) │
  │  jpeg→svg   │     │  bucket_svg.py   │     │  index.html            │
  │  (GAP)      │     │  luminance→rp bN │     │  paint + view stepping │
  └─────────────┘     └──────────────────┘     └────────────────────────┘
        │                     │                          │
   trace params         prep params               runtime params
   (quantize,           (sort, dir,               (reveal, transition,
    simplify)            buckets, jitter)           caption, gesture)

  ENGINE  = compiler + runtime modules  (reusable, library)
  DATA    = scenes, captions, intro, cta, footer          (per-project, edited)
  THEME   = palette + type tokens                          (slot, per-project values)
```

The engine reads `.rp bN`-classed SVGs and story data; it knows nothing about Yael.
Everything Yael-specific is content plugged into it.

---

## 2. Component inventory

Reusability: **High** = drop-in generic · **Med** = generic after decoupling · **Low** = app-specific glue.

| ID  | Component | Current location | Reuse | Coupling to sever on extract |
|-----|-----------|------------------|-------|------------------------------|
| **P1** | Color resolver (`get_color`) | bucket_svg.py | High | none (pure); *does not resolve group-inherited fills — a boundary, see §7* |
| **P2** | Luminance (`luminance`, Rec.601) | bucket_svg.py | High | none (pure utility) |
| **P3** | Bucket assigner (rank → even distribute → jitter) | bucket_svg.py | High | hardcoded 100 buckets, light→dark, luminance-only sort key |
| **P4** | Class injector (strip + inject `rp bN`, reverse-order rewrite) | bucket_svg.py | High | hardcoded `FNAME`, in-place overwrite |
| **R1** | Inline SVG loader (`loadPanel`, parallel `Promise.all`, veil) | index.html | High | loading-veil DOM assumption |
| **R2** | **Reveal engine** (`panelBuckets`, `setLevel` delta writes, `fill/clear`) | index.html | High | reads `.rp bN` convention (fine — that's the contract) |
| **R3** | ~~Declarative bucket CSS~~ (dead code — `data-reveal` never set; deleted in F1) | index.html | — | none: removed, not extracted |
| **R4** | Paint transitions (`paintPanel` GSAP tween / `hidePanel` CSS-transition over R2) | index.html | Med | caption trigger baked in (→ move to R9) |
| **R5** | View state machine (`state`, `goTo`, `jumpToPainted`) | index.html | High | this *is* the "view transitions, not sequential" model |
| **R6** | Scroll engagement / seam (`engage`, `disengage*`, `smoothScrollTo`, `ctaOpticalY`, ScrollTrigger) | index.html | Med | assumes surrounding intro + CTA sections |
| **R7** | Gesture navigator (`step`, wheel/touch/key, cooldown + lock) | index.html | High | emits `step(±1)`; cleanly separable |
| **R8** | Progress dots (`.active` toggle) | index.html | High | trivial |
| **R9** | Caption controller (tl/tr/bl/br presets, reveal timing, paper-glow legibility) | index.html | Med | *content* is Yael's (data); *mechanism* is generic |
| **R10** | Reduced-motion floor (instant fill branch) | index.html | High | fold into R2/R4 |

---

## 3. Target module shape

Five modules. Interfaces are described (in → out), not implemented.

### Module A · `scene-compiler` — absorbs P1, P2, P3, P4
Build-time (Python today, could be Node in-browser later). Turns a traced SVG into a
scene-ready SVG. **This is the entire reusable value of `bucket_svg.py`.**

```
compile_scene(svg_str, opts) -> svg_str
  opts = { sort: "luminance"|"hue"|"spatial",   # P3 sort key (pluggable)
           direction: "light-to-dark"|"dark-to-light"|"edges-first",
           buckets: int = 100,                   # P3 granularity
           jitter: int = 8 }                     # P3 organic-ness (creative knob)
```
Internal seam: `resolve_color (P1) → luminance/key (P2) → assign (P3) → inject (P4)`.
Extraction fixes only the packaging (arg instead of `FNAME`, return instead of
overwrite) — the algorithm is untouched.

### Module B · `reveal-engine` — absorbs R2, R10 (R3 deleted as dead code)
Runtime core, zero dependencies beyond the DOM. The performance-critical heart.

```
class RevealEngine(container)
  .setLevel(n)     # delta-only opacity writes, buckets ≤ n visible
  .fill()          # jump to 99
  .clear()         # jump to -1
  .bucketCount     # discovered from the SVG
  (auto-applies reduced-motion = instant fill)
```
Reusable against **any** bucketed SVG. Extract first — nothing depends on the rest.
Note: R10's current in-page implementation is partial (stacks all panels;
engage path still animates). Extraction FIXES this per patch F4 rather than
preserving it.

### Module C · `scene-player` — absorbs R1, R4, R5, R9
Sits on RevealEngine + GSAP. Owns one story's worth of views and the transitions
between them. This is where the **view-transition paradigm** is realized.

```
class ScenePlayer(scenes[], config)
  .goTo(i)              # R5: hide current → paint next (or jumpToPainted for back)
  config.reveal      = { duration, ease, stagger }   # R4
  config.transition  = "dissolve-repaint"|"paint-over"|"wipe"  # R4/R5 seam
  config.captions    = per-scene { position, delay }  # R9 mechanism only
```
Internal seam worth keeping visible: R5 (which view is active) vs R4 (how a view
paints). If you later want a standalone `view-controller`, R5 is the split line.

### Module D · `navigation-shell` — absorbs R6, R7, R8
Input normalization + host-page embedding. **R6 is the piece that makes a story
embeddable inside a scrolling page** — directly relevant to the "export as a web
content block" goal.

```
GestureNavigator({ onStep, cooldown, wheelThreshold, touchThreshold })  # R7
ScrollEngagement({ trigger, onEngage, onDisengageFwd, onDisengageBack }) # R6
ProgressDots(count).setActive(i)                                          # R8
```

### Module E · `theme-tokens` — the CSS variable + type slot
`--paper --ink --ink-soft --indigo --ochre` + the three font roles (Frank Ruhl Libre /
Heebo / Cormorant). Structure is reusable; the *values* are Yael's. Becomes per-project
theme data.

---

## 4. Dependency graph & extraction order

```
  A scene-compiler   (independent, build-time)      ── extract anytime
  B reveal-engine    (DOM only)                      ── extract FIRST
  C scene-player     needs B + GSAP                  ── second
  D navigation-shell needs C's step interface + GSAP/ScrollTrigger ── third
  E theme-tokens     independent                     ── extract anytime
```

Suggested order: **B → (A, E in parallel) → C → D.** B is the highest-value, lowest-risk
pull; once it's a clean class, everything above it composes cleanly.

---

## 5. Parameter surface, mapped to modules

The editor's knobs, now with a home. Two layers, as established:

**Prep-time (baked into the SVG by Module A):**
- sort key — luminance (today) / hue / spatial — *A/P3*
- direction — light→dark / dark→light / edges-first — *A/P3*
- bucket count — reveal-step granularity — *A/P3*
- jitter — crisp ↔ painterly (creative, not just dithering) — *A/P3*
- *(upstream, GAP)* trace quantization + path simplification — sets path count **and** tonal resolution together

**Runtime (set in the compose layer, consumed by C/D):**
- reveal duration / ease / per-bucket stagger — *C/R4*
- view-transition type + seam timing — *C/R4-R5*
- caption position / delay / dwell — *C/R9*
- gesture cooldown + wheel/touch thresholds — *D/R7*
- engage/disengage seam timing, optical landing — *D/R6*

---

## 6. The story-data boundary (NOT reusable — this is the schema the editor edits)

Everything below is content, not engine. It is what the CMS produces and the engine
consumes. Naming it precisely *is* the editor's data model:

- **scenes[]** — `{ asset, order }` (Yael: 5 traced SVGs)
- **captions[]** — `{ num, he, en, position }` per scene (bilingual content)
- **intro** — eyebrow, h1, tagline
- **invitation / cta** — heading, body, WhatsApp link + prefilled message
- **footer** — social links
- **theme values** — the specific palette + font choices (Module E's slot, filled)
- **param values** — the specific timings chosen for Yael (SEAM, paint 1.6–1.8s,
  cooldown 250ms). These are per-project *values* of §5's parameters, not engine.

---

## 7. Known boundaries — NOT extraction targets

Named so the map is complete; these are separate concerns, not things to pull out.

- **Tracer (jpeg→svg)** — the first pipeline stage doesn't exist yet. It's a *component
  to build*, not extract, and it's the frontier that decides perf (via color
  quantization). Sits before Module A.
- **P1 group-fill robustness** — `get_color` reads a path's own fill/stroke/style only;
  paths that inherit color from a parent `<g>` fall to `#808080` and mis-bucket. Real
  for arbitrary user uploads, invisible on Yael's per-path-filled traces. A robustness
  concern for Module A's future, not an extraction unit.
- **Same-bucket path merging** — absent today; it's the lever against the
  1 MB / thousands-of-nodes weight (merge same-bucket subpaths → one node). An
  optimization that would live inside Module A, not a current component.

---

## Summary

The reusable engine is `compile_scene(params) → RevealEngine → ScenePlayer → navigation-shell`,
themeable via tokens. Two of the three pipeline stages already exist and are cleanly
extractable; the third (trace) is the build frontier. Pull **B (reveal-engine) first** —
it's the core, it's dependency-free, and it unblocks everything else.

---

## DOD-1 verdict — Module B extraction gate

**Status: PASS (automated gates)** · recorded 2026-07-02 · lab: `bucket-lab.html` + `story.json` + `reveal-engine.js`, served via `python3 -m http.server`.

| Gate | Result |
|------|--------|
| **G1** Fixes verified | F1–F5 applied; no `#bucketRules`, `SEAM.ENTRY` live, `REDUCED` captured at init. *(reduced-motion round-trip on production `index.html` = manual)* |
| **G2** Code parity on paper | **PASS** — `setLevel` delta-write loops verbatim vs inline original; deviations limited to header-declared (round/clamp moved into `setLevel`, `bucketCount` discovery, `rescan()`). |
| **G3** Visual parity, 5 scenes | **PASS (mechanical)** — identical rendered image both panes; exact path parity (1295 / 4236 / 1789 / 3345 / 4111, ref = engine); no console errors. *(build-rhythm eyeball + 3b cross-check vs `index.html` = manual)* |
| **G4** Timing parity ≤50ms | **PASS** — **0 ms** delta on all five scenes, incl. heaviest (vivid-sun 4236, girl 4111). |
| **G5** JSON drives behavior | **PASS** — editing `story.json` only (reorder 2↔3, duration 3.0s, `power2.inOut`) → right stage followed (engine 3000ms vs ref 1600ms), left stayed production, zero code touched. File restored to production values after. |
| **G6** Reduced motion | **PASS (code path)** — emulated `prefers-reduced-motion:reduce` → both stages instant-fill, verdict correct. *(real macOS OS-toggle = manual)* |

**Outstanding manual gates** (human eyeball / OS toggle, not machine-checkable): G3 build-rhythm during the tween, G3b cross-check against live `index.html`, G1/G6 reduced-motion via actual macOS Reduce Motion setting.

**Next on PASS:** extract Module A (`compile_scene`, packaging-only) and Module E (theme tokens) in parallel, then C. The extracted `reveal-engine.js` + a scene demo is also the open-source/CodePen marketing candidate.

---

## DOD-A verdict — Module A extraction gate

**Status: PASS** · recorded 2026-07-02 · `compile_scene.py` + `test_compile_parity.py` at repo root; oracle `svg/bucket_svg.py` unmodified.

| Gate | Result |
|------|--------|
| **GA1** Packaging | **PASS** — `from compile_scene import compile_scene` imports clean; CLI refuses with no `--out`, refuses `--out == input` without `--in-place`. (Fixed a cosmetic `SyntaxWarning` — module docstring made raw; no behavior change.) |
| **GA2** Byte parity (oracle gate) | **PASS — 10/10 byte-identical** vs `bucket_svg.py`. Five scenes × jitter=0 (sort/distribution/strip/inject) and × jitter=8/seed=42 (RNG call order). Paths 1295/4236/1825/3345/4111. |
| **GA3** Runtime contract | **PASS** — recompiled `01-quiet-sun` (seed 42) loaded in bucket-lab: 1295 paths · 100 buckets, 0 ms delta, no console errors. Derived file removed after; `story.json` restored. |
| **GA4** Direction | **PASS** — dark-to-light compile inverts bucket order: early b0–5 mean-luma 0.196 (ink first) vs light-to-dark 0.941 (washes first). First new creative capability from the extraction. |
| **GA5** Docs | **PASS** — header states params, the 100-bucket runtime ceiling, and the three inherited boundaries (group fills → mid-gray, named colors → 0.5, opacity ignored). |

**`svg/bucket_svg.py` retired to reference status** — keep as the oracle for any future Module-A refactor; do not delete.

**A + B now form the complete publishable pipeline** (compile → reveal). Map's next: **Module E** (theme tokens, ~1h) then **Module C** (scene-player).

---

## DOD-C verdict — Module C extraction gate (Module E folded in)

**Status: PASS (automated gates)** · recorded 2026-07-02 · `scene-player.js` + `scene-player.css` + `theme-yael.css` + `scene-lab.html` + `story.json` v2 at repo root. `index.html` untouched — remains production + the GC3 reference.

**Three declared design decisions — ACCEPTED** (C is not pure preservation):
1. Captions are descriptor data (`num/he/en/position` in `story.json`), rendered via text nodes / `\n`→`<br>`, never innerHTML of story text.
2. Panels are BUILT from `scenes[]` (R1 no longer reads pre-declared `data-src`); player exposes a `ready` promise, page veil stays a host concern.
3. D-facing surface is callbacks (`onSceneChange`/`onBoundary`), not DOM — no dots/gestures/scroll in C.

**Inherited quirk preserved (verbatim):** only the `tl` caption slides from −12px; all others from +12px (original checked only `contains('tl')`).

| Gate | Result |
|------|--------|
| **GC1** Packaging | **PASS** — `new ScenePlayer(stage, story, config)` builds panels + captions; `ready` resolves after all fetches; throws on missing RevealEngine/gsap and on unknown `transition`. |
| **GC2** Fidelity on paper | **PASS** — `paintScene`/`hideScene`/`goTo`/`jumpToPainted`/`next`/`prev` verbatim vs inline `index.html` (1.6 / 0.45 / 0.35 / 35% / 12px, `{i,painted,busy}` guards, fwd-paints/back-jumps asymmetry, F4 branches); deviations limited to the three declared decisions. |
| **GC3** Behavioral parity | **HUMAN GATE — pending** — side-by-side vs `index.html` (build-rhythm, caption entry ~35%/slide dir, hide feel). Mechanically pre-cleared: captions render in correct positions, asymmetry + timings verbatim. |
| **GC4** JSON drives view layer | **PASS** — editing only `story.json`: caption text, caption position (`tr→bl`), and per-scene duration (→3.0s, readout + paint followed) all changed; zero code. |
| **GC5** Reduced motion | **PASS (code path)** — emulated `reduce`: player `reduced=true`, paint completes ~1 ms (instant fill + caption), next/prev navigate instantly, zero hide wait. *(real macOS toggle = manual)* |
| **GE1/GE2** Theme slot | **PASS** — `theme-yael.css` present (token structure vs Yael values, + `--paper-glow` triplet); changing only `--ochre` recolored caption numerals to the new value, zero structural edits. |

**Outstanding manual gate:** GC3 side-by-side behavioral parity vs live `index.html`, and GC5 via the real macOS Reduce Motion setting.

**Four of five modules extracted (A, B, C, E).** Next: **Module D** (navigation-shell — gestures/dots/scroll-engage attaching at `onSceneChange`/`onBoundary`), then the first integration milestone: rewiring `index.html` onto the module stack (C's second consumer).

---

## DOD-D verdict — Module D + integration gate (the finale)

**Status: FULL PASS** · recorded 2026-07-02 · `navigation-shell.js` at repo root; `index.html` rewired onto the full module stack (theme-yael.css + scene-player.css + reveal-engine.js + scene-player.js + navigation-shell.js + story.json + ~55 lines of glue). `index-legacy.html` reference **deleted** on pass — monolith preserved in git history (`git show HEAD~:index.html`).

**Two declared deviations — ACCEPTED:** veil lifts on `player.ready` (all five scenes) instead of first-scene-loaded (invisible on localhost); dots are descriptor-built (count from `scenes.length`) with dot 0 pre-activated (matches production's initial state). **Documented quirk access into C's public surface:** glue `fadeOut(i)` writes `player.panels[i]`/`captions[i]` directly (fade-no-clear), `onDisengaged` resets `player.state` — `scene-player.js` sealed/untouched.

| Gate | Result |
|------|--------|
| **GD1** Packaging | **PASS** — `ScrollEngagement` / `GestureNavigator` / `ProgressDots` exported; constructors throw on missing trigger / gsap+ScrollTrigger / engagement / onStep; `destroy()` removes every listener. |
| **GD2** Fidelity on paper | **PASS** — R6/R7/R8 bodies verbatim vs `index-legacy.html`; all four sequencing subtleties present (engage paint@t=0 / `engaged` flips on scroll-land; busy-before-cooldown + stamp-after-step; entry/exit key asymmetry; disengage fade-no-clear with EXIT×0.25 lead); constants 250/350/4/30, seam 800/600, `top bottom-=20%`. Deviations limited to the declared two. |
| **GD3** Traversal parity | **PASS (human — you cleared it)** — full side-by-side vs `index-legacy.html`. Mechanically corroborated: engage scroll-locks + paints scene 1, forward step repaints, backward step jumps, dots stay in sync, cooldown debounces. |
| **GD4** Knobs live | **PASS** — `seam.exit` scales the exit scroll (601 ms @600 → 1208 ms @1200, exactly 2×, via the verbatim `_smoothScrollTo`); editing only `story.json` caption position followed through Module C. Zero module edits. |
| **GD5** Reduced motion | **PASS** — code path proven (Module D `_smoothScrollTo` → 0 ms instant under `reduced`; Module C instant-fill from GC5) **and** confirmed via the real macOS Reduce Motion toggle: instant engage/steps/exits, static cue/veil; OFF → animation returns. |
| **GD6** Touch | **PASS** — real-device gesture parity confirmed: one swipe = one step, no page rubber-banding while engaged, thresholds match legacy. |
| **GD7** Recorded + retired | **PASS** — verdict recorded here; `index-legacy.html` deleted (monolith in git history). |

**Note (not a defect):** the local `python3 -m http.server` sends no cache headers, so the preview browser served stale `theme-yael.css` / `story.json` across reloads during testing. Files on disk are correct; a hard refresh or any real host with normal caching is unaffected.

**5/5 modules extracted, integration complete.** The engine exists: `compile_scene (A) → reveal-engine (B) → scene-player (C) → navigation-shell (D)`, themed by tokens (E), with production `index.html` as the integrated proof. Unlocks: the publish decision (A+B razor pipeline; C+D now have their second consumer), the second-project test (new `story.json` + theme + compiled scenes, zero engine code), and the parked sequential-mode experiment.
