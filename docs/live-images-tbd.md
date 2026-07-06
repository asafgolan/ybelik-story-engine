# Live images — quality vs compute (TBD / exploratory)
### how to make on-demand generated scenes read as ink-wash *paintings*, cheaply

> Status: **exploratory, not decided.** Opened during DOD-G. Captures the levers
> and the open questions for "live" (customer-facing, on-demand) generation.
> Nothing here is a commitment; TBD markers are real.

## The core insight

**Painterliness is won at GENERATE, then carried faithfully downstream.**
`trace_scene → compile_scene → reveal` are style-blind — they reproduce whatever
tonal structure the source raster hands them. So the cheapest, biggest lever on
"does it look like a painting" is the **style prompt**, not any post-processing.
The trace can *harden* soft edges (vtracer's cut-out look) but cannot *invent*
painterliness that isn't in the source. Spend the quality budget on the prompt.

## Levers, cheapest → most expensive

| Lever | Stage | Runtime cost | Effect | Verdict |
|-------|-------|--------------|--------|---------|
| **Style/prompt clauses** (`styles.js`) | generate | **zero** (server-side, one registry) | the whole painterly look — mid-tone washes, dry-brush, granulation, calligraphic strokes | **primary lever** — tune here first |
| **jitter** (crisp↔painterly) | compile | zero (build-time) | organic bucket variation → less mechanical reveal | TBD: sweep for the painterly feel |
| **cp8 pinned + ld auto** | trace | build-time only, one-off per image | tonal layering = smoothness; ld trims weight | **decided** (GG5) |
| **same-bucket path merging** (map §7) | compile/build | lowers *runtime* weight → smoother reveal on weak devices | fewer DOM nodes, lighter files | TBD backlog — the known weight lever |
| **steps 4 → 8** | generate | **2× GPU** | marginal extra detail (schnell sweet spot is 4) | probably **no** |
| **post-trace edge softening** (feather/blur) | new stage | extra CPU + complexity | soften vtracer's hard edges | TBD, likely not v0 |
| **model swap** (flux-dev / flux-2) | generate | higher GPU + licensing | better source | **no** while Apache-2.0 output is the publish requirement (dev = non-commercial) |

**Takeaway:** the free wins are **prompt clauses + jitter**; the weight win is
**same-bucket merging**; everything else is more compute for marginal gain.

## Same style, or open? — lock it

Live images should stay **style-locked to the curated registry** (the v0 design:
clients send `{style, subject}`, never raw prompts; the worker enforces `styles.js`).
That IS the quality guarantee — customers can't wander off-style, and the painterly
look is defined once, server-side. "Make it a painting" == "pick a painterly style
from the registry." Growing the palette = one registry entry each (cheap), reviewed
for the same load-bearing clauses.

## Two paths for photos — the roadmap

Photos are a real input class (the human picked a posterized photo as the DOD-G
hero). There are two distinct ways to serve them, and they are sequential:

1. **Posterize — SHIPPED (v0).** Photo → `trace_scene` → `compile_scene` →
   reveal, *unchanged*. The soft photo becomes flat posterized color regions —
   a screenprint-like painterly reveal. **No new code**: it is the exact same
   compile as every other specimen. Validated in DOD-G and rated hero-worthy.
   It is honest about what the pipeline does today — it does *not* add ink.

2. **Styled — NEXT TO ADD.** Photo → **FLUX img2img with an ink-wash style**
   (reinterpret the photo *as* sumi-e / watercolor) → *then* trace → compile →
   reveal. This is what makes "turn your photo into an ink-wash **painting**"
   real, instead of a posterized photo. Requires:
   - an **img2img** route on the generate worker (`@cf/.../flux-1-schnell`
     img2img, or dev) — sibling to `/generate`;
   - a **strength / denoise** knob (how far from the photo toward the style);
   - a style from the same `styles.js` registry (server-enforced, as today).
   NOT built. This is the single biggest painterly lever for the photo class,
   and it lives at GENERATE — consistent with this doc's core insight.

**Positioning follows from which path.** Path 1 = "posterize any image into a
painterly reveal." Path 2 = "turn your photo into an ink-wash painting." The
DOD-G hero proves Path 1 works; Path 2 is the differentiator to build.

## Open questions (TBD)

- [ ] **jitter sweep** — what jitter value reads most "hand-painted" without turning to noise? (compile-time, free to explore)
- [ ] **same-bucket merging** — build it? measures: node-count drop, file-KB drop, reveal-jank headroom on low-end devices. Map §7 lever.
- [ ] **negative-space control** — `sumi-e` (authentic ma) vs `sumi-e-hero` (framed) — expose as a style choice, or auto-pick per subject?
- [ ] **schnell's stray marks** — it adds calligraphy/seals despite "no text/no seal" clauses (seen in DOD-G). Tolerate as texture, or add a post-trace crop/mask? (adds compute)
- [ ] **which content classes to *offer* live** — envelope says ink-wash/illustration/graphic yes; photos posterize (wrong-medium). Gate the style list to the ones that read as paintings?
- [ ] **caching** — GEN2 is deterministic (same style+subject+seed = byte-identical), so identical requests are cacheable at zero GPU. Worth a KV/R2 cache? (v0 scope says no; revisit.)
- [ ] **per-image trace time** — ink-wash ~1–5 s, photos 15–52 s. Live UX needs a budget/timeout + async job model if photos are ever offered.

## Not in scope here

The reveal/runtime engine is unchanged. This doc is only about the *source→trace*
front of the pipeline and what it costs to make it painterly.
