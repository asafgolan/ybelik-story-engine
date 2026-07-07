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
  - *Inline* a small scene into the pen (fully self-contained, no fetch). Reveal pen inlines the pre-compiled `B1-gradient-sphere` (9.7 kB); money pen inlines the **raw** `B2-groupfill-x29` (26 kB, 209 paths) and compiles it live.
  - *Fetch* via jsDelivr's GitHub CDN for the multi-scene pens (scene-player), e.g. `https://cdn.jsdelivr.net/gh/asafgolan/ybelik-story-engine@main/demo/svg/01-quiet-sun.svg` — **verified HTTP 200 with CORS** (2026-07-07). Pin `@<tag>`, not `@main`, when the pens ship.
- **Standalone contract:** every pen self-contained — loads only the packages it needs, works in a fresh browser with nothing cached.
- **Whole contract:** shared theme tokens (the ink-wash palette below), a deliberate order (reveal → compiler → player → shell), and an **index** pen/page linking all four.
- **Save mechanism:** CodePen has no write API. Ship each pen as a committed self-contained `.html` here, and generate a **Prefill-API** launcher (`<form action="https://codepen.io/pen/define" method="POST">` with a JSON `data` field) — one click opens a pre-filled pen to Save. (Browser-automation is the fallback if hands-off saving is wanted.)

## Shared theme tokens (the *whole*)
`--paper:#f3ece0 · --ink:#14110E · --shu:#C0432B · --mist:#9A9284`, serif = Spectral,
mono = JetBrains Mono. Every pen uses these so the set reads as one family.

## The pens
| file | package(s) | demonstrates | status |
|---|---|---|---|
| `money-pen.html` | scene-compiler + reveal-engine | **flagship** — live compile: direction/jitter/seed scrubbers recompile the SVG in-browser → repaint | ✅ proven |
| `reveal-pen.html` | reveal-engine | scrub a pre-compiled scene bucket-by-bucket (`setLevel`) + play | ✅ proven |
| `player-pen.html` | scene-player (+ reveal-engine, gsap) | descriptor-driven multi-scene player; captions from `story.json`; fetches scenes via jsDelivr-GH | ◻︎ spec'd |
| `shell-pen.html` | navigation-shell (+ scene-player, reveal-engine, gsap, ScrollTrigger) | full scroll-engage experience: seam, gestures, progress dots | ◻︎ spec'd |
| `index.html` | — | landing: the four badges + links, the pipeline line, one embed each | ◻︎ spec'd |

### money-pen.html ✅ (load order)
```html
<script src="https://unpkg.com/@ybelik/scene-compiler@0.1.0/scene-compiler.js"></script>
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
```
Proof (in-browser): both unpkg 200 · `209 paths · 100 buckets · compile ~2–5 ms` · direction
flips / jitter changes / seed changes each produce **different** bucket assignments · jitter
deterministic per seed · zero console errors.

### reveal-pen.html ✅ (load order)
```html
<script src="https://unpkg.com/@ybelik/reveal-engine@0.1.0/reveal-engine.js"></script>
```
Proof: 5 paths / 99 buckets · slider drives progressive reveal (3 visible at level 50 → 5 at
99) · zero console errors.

### player-pen.html ◻︎ (recipe)
Load order: `gsap@3.13.0` → `reveal-engine@0.1.0` → `scene-player@0.1.0`. Build a `story`
object inline (`{scenes:[{asset, caption:{num,he,en,position}}…]}`) whose `asset`s are jsDelivr-GH
URLs of the pre-compiled demo scenes; `new ScenePlayer(stage, story, {onSceneChange})`;
`await player.ready`; prev/next buttons → `player.next()`/`player.prev()`. Note: scene-player
**fetches** assets, so a pen needs the jsDelivr-GH route (200/CORS proven).

### shell-pen.html ◻︎ (recipe)
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
