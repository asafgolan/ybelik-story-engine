# ybelik CodePens — kit

Self-contained demo pens for the four published `@ybelik` packages (all `v0.1.0`,
live on npm + unpkg). Each pen loads its packages **from unpkg only** — no repo
files, no build step — so it drops straight into CodePen and works cold.

**Analyzer pass 2026-07-07.** Pens marked ✅ were built and run in a browser
against the live unpkg packages (zero console errors, interactions verified);
pens marked ◻︎ are fully specified here with a proven asset route, not yet built.

## The packages (real API, cited from source)
| package | global | key surface (file:line) |
|---|---|---|
| `@ybelik/reveal-engine` | `RevealEngine` | `new RevealEngine(el)` · `setLevel(-1..99)` · `fill()`/`clear()` · `.level`/`.pathCount`/`.bucketCount` · `RevealEngine.reducedMotion` — `reveal-engine.js:35,75,90,101` |
| `@ybelik/scene-compiler` | `SceneCompiler` | `compileScene(svg,{sort,direction,buckets,jitter,seed})` · `auditMetrics(svg,{kb})` — `scene-compiler.js:114,200` |
| `@ybelik/scene-player` | `ScenePlayer` | `new ScenePlayer(stageEl, story, cfg)` (needs `RevealEngine`+`gsap`); **fetches** `story.scenes[].asset` by URL · `.ready` · `goTo`/`next`/`prev` — `scene-player.js:67,104,178` |
| `@ybelik/navigation-shell` | `ScrollEngagement`, `GestureNavigator`, `ProgressDots` | `new ScrollEngagement({trigger,exitSelector,seam,on…})` (needs `gsap`+`ScrollTrigger`) · `new GestureNavigator({engagement,isBusy,onStep})` · `new ProgressDots(el,count).setActive(i)` — `navigation-shell.js:80,205,287` |

## Decisions (recorded — don't relitigate mid-run)
- **Scope:** one pen per package (4), plus an index that ties them together (the *whole*).
- **CDN pins:** unpkg `@ybelik/<pkg>@0.1.0`; gsap/ScrollTrigger from `cdn.jsdelivr.net/npm/gsap@3.13.0` (the repo's pin). Pin everything — pens must not float on `latest`.
- **`sort` is `luminance` only** — it's the sole registered `SORT_KEYS` entry (`scene-compiler.js:109`). The money pen exposes **direction + jitter + seed** (not a sort dropdown); stated honestly in-pen.
- **Asset strategy — two routes, both proven:**
  - *Inline* a small scene (self-contained). Reveal pen inlines the pre-compiled `B1-gradient-sphere` (9.7 kB, gradient fills → 100% lum-fb, ties by design — a pure `setLevel` demo).
  - *Fetch* via jsDelivr's GitHub CDN, pinned `@engine-2.0-layout` — **verified HTTP 200 + CORS** (2026-07-07). The money/player/shell pens fetch the demo scenes this way.
  - **Flagship ruling (advisor 2026-07-07):** the money pen's *primary* asset is a **real traced ink-wash scene** — `03-bird.svg` via jsDelivr (readout `1825 paths · 100 buckets · attr-fb 0.0% · lum-fb 2.0%` — the audit landmark; the luminance story is *true*). The **raw `B2-groupfill-x29`** stays inline as a **hostile** toggle: group-inherited `<g fill>` → attr-fb **85.6%** → luminance ties → draw-order reveal; `auditMetrics` surfaces it in the readout (the input-contract linter, in UI). Network is already mandatory (unpkg), so fetching the primary adds no new failure class.
  - **Provenance / license — cleared:** every specimen is **Public Domain** per `test-corpus/corpus-b/CORPUS-B-SOURCES.md` — B2 = "Grumman X-29 3-view line art" (Wikimedia Commons · NASA Dryden · PD), B1 gradient sphere (PD). Publishable in a public pen.
- **Standalone contract:** every pen self-contained — loads only the packages it needs, works in a fresh browser with nothing cached.
- **Whole contract:** shared theme tokens (the ink-wash palette below), a deliberate order (reveal → compiler → player → shell), and an **index** pen/page linking all four.
- **Save mechanism:** CodePen has no write API. Ship each pen as a committed self-contained `.html` here, and generate a **Prefill-API** launcher (`<form action="https://codepen.io/pen/define" method="POST">` with a JSON `data` field) — one click opens a pre-filled pen to Save. (Browser-automation is the fallback if hands-off saving is wanted.)

## Shared theme tokens (the *whole*)
`--paper:#f3ece0 · --ink:#14110E · --shu:#C0432B · --mist:#9A9284`, serif = Spectral,
mono = JetBrains Mono. Every pen uses these so the set reads as one family.

## The pens
| file | package(s) | demonstrates | status |
|---|---|---|---|
| [`money-pen.html`](https://codepen.io/asafgolan/pen/ZYLrzQO) | scene-compiler + reveal-engine | **flagship** — live compile: direction/jitter/seed recompile in-browser; bird primary + X-29 hostile with `auditMetrics` | ✅ proven — bird `1825·100·attr-fb 0.0%·lum-fb 2.0%`, X-29 `209·attr-fb 85.6%` (red), knobs reassign, 0 console errors |
| [`reveal-pen.html`](https://codepen.io/asafgolan/pen/MYJQgKy) | reveal-engine | scrub a pre-compiled scene bucket-by-bucket (`setLevel`) + play | ✅ proven — 5 paths/99 buckets, 3 visible@50 → 5@99, 0 errors |
| [`player-pen.html`](https://codepen.io/asafgolan/pen/QwdQLyW) | scene-player (+ reveal-engine, gsap) | descriptor-driven 3-scene player; captions (he/en); scenes via jsDelivr-GH | ✅ proven — `2/3 bird` paints, captions render, dots track, 0 errors |
| [`shell-pen.html`](https://codepen.io/asafgolan/pen/bNgLbVP) | navigation-shell (+ scene-player, reveal-engine, gsap, ScrollTrigger) | full scroll-engage experience: seam, gestures, progress dots | ✅ proven — 3 exports wire, scroll-engage paints 1331 paths, dot tracks, 0 errors |
| [`index.html`](https://codepen.io/asafgolan/pen/JoEpPGr) | — | landing: the four badges + links, the pipeline line, embed placeholders | ✅ proven — 4 badges render, 4 cards linked, 0 errors |
| `launchers.html` | — | Prefill-API launchers (5 forms → `codepen.io/pen/define`) | ✅ built — payloads round-trip, externals routed; ⛔ open-only, Asaf saves |

### money-pen.html ✅ (load order)
```html
<script src="https://unpkg.com/@ybelik/scene-compiler@0.1.0/scene-compiler.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
```
Primary asset = `03-bird.svg` via jsDelivr (pinned `@engine-2.0-layout`); hostile `B2-groupfill-x29`
inline. Proof (in-browser): all CDN loads 200 · bird `1825 paths · 100 buckets · attr-fb 0.0% · lum-fb 2.0%`
(the audit landmark) · X-29 hostile `209 · attr-fb 85.6%` (glows `--shu`) + its sub-line · direction
flips / jitter changes / seed changes each produce **different** bucket assignments · jitter
deterministic per seed · zero console errors.

### reveal-pen.html ✅ (load order)
```html
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
```
Proof: 5 paths / 99 buckets · slider drives progressive reveal (3 visible at level 50 → 5 at
99) · zero console errors.

### player-pen.html ✅ (recipe, built)
Load order: `gsap@3.13.0` → `reveal-engine@0.1.0` → `scene-player@0.1.0`. Build a `story`
object inline (`{scenes:[{asset, caption:{num,he,en,position}}…]}`) whose `asset`s are jsDelivr-GH
URLs of the pre-compiled demo scenes; `new ScenePlayer(stage, story, {onSceneChange})`;
`await player.ready`; prev/next buttons → `player.next()`/`player.prev()`. Note: scene-player
**fetches** assets, so a pen needs the jsDelivr-GH route (200/CORS proven).

### tracer-pen.html ✅ (recipe, built — browser lane, #38)
Zero-server BYO-image: `@ybelik/scene-tracer@0.1.0` (the published trace stage — auto-tune ladder, flags, viewBox; wraps `wasm_vtracer@0.2.0`, CLI-parity verified on a real photo, evidence on #38) + `@ybelik/scene-compiler@0.1.0` + `@ybelik/reveal-engine@0.1.0` (unpkg). Input normalized to ≤1024px; a 1024px photo traces in ~2–3 s per ladder step, on the visitor's device. Nothing uploads. Pen URL: [live](https://codepen.io/editor/asafgolan/pen/019f6bee-0443-789f-a212-b1afd7b73ea5).

### shell-pen.html ✅ (recipe, built)
Load order adds `ScrollTrigger`. Wire a tall scroll section: `new ScrollEngagement({trigger,
exitSelector, seam:{entry:800,exit:600}, onEngage:()=>player.goTo(0), …})`, `new GestureNavigator({
engagement, isBusy:()=>player.state.busy, onStep})`, `new ProgressDots(el, story.scenes.length)`.
Mirrors `demo/index.html`'s glue (the reference integration).

## Executor / house rules
Kit is canonical; pen sources here are the verbatim artifacts. Don't edit the published
package `.js`/`.css` (sealed — pens consume from unpkg only). Pin all CDN URLs. When a pen
ships to CodePen, save via the Prefill launcher; the ⛔ human gate applies to anything that
posts to an external account. Re-prove a pen (serve + browser, zero console errors) before
declaring it done.
