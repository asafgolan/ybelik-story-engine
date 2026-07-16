> STATUS: SEALED VERDICT · recorded 2026-07-06 · remains the home of the claims-of-record (the GG3 envelope, in the words it was proved in); the live pitch evolves at the root README, never here

# DOD-G — Generalization Report
### ybelik-story-engine · the generalization gate · **VERDICT: PASS**
recorded 2026-07-06 · branch `feature/generalization-gate`

---

## Verdict

**PASS.** The "any traced image" claim is earned for the stated envelope. Phase-1
publish is unblocked with **demo assets, locked trace settings, positioning copy,
and — beyond the original plan — a full GENERATE stage** in hand. The pipeline the
extraction map opened on day one is now complete end to end:

```
GENERATE (worker, flux-1-schnell) → trace_scene (auto-tune) → compile_scene (buckets) → reveal
   intent (style+subject)              cp8 + ld ladder          rp bN classes        paints
```

---

## The envelope (GG3) — positioning copy, verbatim

> **Designed for ink-wash / illustration / graphic content generated from a
> prompt.** Photographs work **today** as a *posterized* painterly reveal — the
> published hero proves it. Turning a photo into a *true ink-wash painting* is
> the next build: an img2img restyle stage (`live-images-tbd.md`, path 2).

Two things the corpus made concrete: the trace/compile/reveal chain is
style-blind — it faithfully carries whatever tonal structure the source hands it,
and **cannot invent painterliness that isn't in the source.** So the look is won
at GENERATE. A prompt-generated ink-wash reveals as ink-wash; a photo reveals as
a posterized photo (striking in its own right — rated hero-worthy — but not ink).

---

## What was tested

Everything before DOD-G proved the extraction *preserved production* — on one
input class (five traces, one tracer, one style). DOD-G tested the product claim
on a corpus built to break it: **Corpus A** (images we generate + trace, the core
claim) and **Corpus B** (wild hand-authored SVGs, the robustness probe).

---

## GG1 · Pipeline end-to-end — **PASS**

The four-stage pipeline ran clean on the real corpus (pre-flight had only proven
the mechanism on synthetic content). Every Corpus-A specimen: generate → trace →
compile → walked in `scene-lab` with 100 buckets discovered and zero console
errors (11 committable scenes + 4 local photo specimens = 15 walked).

## GG2 · Same-style claim — **PASS**

The home style (A1 ink-wash) is flawless, and the auto-tuner **generalizes across
the style** — five specimens, five *different* converged cells, all clean:

| specimen | cell | paths | iters | audit |
|---|---|---|---|---|
| a1-pines-s42 | cp8/ld32 | 2,096 | 1 | 0% fallback · 100 bkts |
| a1-bird-s42 | cp8/ld8 | 1,942 | 4 | 0% · 100 |
| a1-bird-s43 | cp8/ld32 | 1,645 | 1 | 0% · 100 |
| a1-bird-s44 | cp8/ld16 | 1,574 | 3 | 0% · 100 |
| a1-bird-s45 | cp8/ld16 | 2,123 | 3 | 0% · 100 |

Human rating (TG6): **reads-as-painting.** The output *is* the publish demo
assets.

## GG5 · Quantization envelope — **DONE**

**Policy (locked): `color_precision = 8` pinned** (the quality/tonal-layering
axis), **`layer_difference` auto-tuned per asset** — because path count is
content-driven, no fixed cell scales, but the sweep's transfer function does.

Sweep on the pines A1 (path counts, actual):

| | ld8 | ld16 | ld32 |
|---|---|---|---|
| **cp4** | 1,036 | 997 | 893 (chunky) |
| **cp6** | 2,746 | 2,496 | 2,000 |
| **cp8** | **4,367** ⛔ ceiling | 3,146 | **2,096** ✅ demo |

- **Demo cell (locked): `cp8/ld32`** — 2,096 paths · 1.6 MB · ~880 ms compile.
  cp8 softness at production-range weight.
- **Measured jank ceiling: `cp8/ld8`** — 4,367 paths · **3 MB · 3.5 s** compile.
- Smoothness is bought with `cp`; `ld` trims weight cheaply. Sweet spot is
  *high cp, high ld*.

## TP4 · Convergence table — the tuner generalizes, and flags the edges itself

`trace_scene` on the full corpus. **The tuner not only converges across content
classes — its flags mechanically localize the envelope edges, with no human in
the loop:**

| specimen | class | cell | paths | flag |
|---|---|---|---|---|
| a1-pines / bird ×4 | ink-wash | cp8/ld8–32 | 1,574–2,123 | — (clean) |
| a2-watercolor | watercolor | cp8/ld8 | 2,498 | **weight** (3 MB, over ceiling) |
| a3-poster | flat graphic | cp8/ld8 | **711** | **chunky-by-content** (genuinely sparse) |
| a6-lineart | line art | cp8/ld8 | 1,750 | — (near-binary tonally) |
| a4/a5 photos ×4 | photograph | cp8/ld48–64 | 1,531–2,844 | **band-edge / downscaled** |

All specimens: **0% fallback, 100 buckets** (vtracer always self-colors). Photos
stressed every dimension — max `ld`, downscale-to-1024 recovery, weight-edge, and
15–52 s trace times vs ~1–5 s for ink-wash. The mechanical pipeline coped; the
posterize *look* is the human's call (rated acceptable → **photos are inside the
envelope, path 1**).

Determinism (GEN2): same style+subject+seed = byte-identical. The whole chain —
intent → image → trace → compiled SVG — is reproducible; sidecars are recipes.

## GG4 · Robustness findings — **FILED · decision: (a) DEFER**

Corpus B fired exactly as designed (the inverted test — a clean specimen is the
wrong specimen):

| specimen | fires | signature |
|---|---|---|
| B1 gradient-sphere | **100% lum-fb** | all paths `fill="url(#…)"` → 0.5 mush |
| B2 groupfill-x29 | **85.6% attr-fb** | one `<g fill>` over bare paths → #808080 |
| B3 shapebuilt-su47 | **60 non-path** | 52 `<line>` + 8 `<polyline>` ignored (36/96 marks reveal) |

**Empirical anchor (the bird thread from DOD-A, closed):** `svg/03-bird.svg`
carries 2.0% lum-fb = **36 `url(#gradient)` paths**; 1825 `<path>` − 36 = **1789**,
exactly the `.rp` DOM count filed in DOD-A. Production has shipped a ~2% fallback
share **invisibly for the site's entire life.**

**Input contract:** *small fallback shares are harmless (production shipped 2.0%
invisibly for years); structural fallback shares are not — and `audit_svg.py` is
the linter that tells them apart before compile.* The engine's contract is
**traced input**; hand-authored SVGs may mis-bucket.

**Group-fill decision — (a) DEFER.** The product pipeline (vtracer, stacked color
mode) *never emits* group-inherited fills — the boundary exists only for
hand-authored input, and the audit detects it mechanically (85.6% attr-fb on B2).
Resolving `<g>` inheritance is logged as **Module A v0.2 backlog**, a declared
additive deviation for whenever the editor accepts hand-authored SVGs. Consequence
(as the plan foresaw): the oracle `bucket_svg.py` shares the limitation, so a
future fix diverges by design — GA2 byte-parity then guards the verbatim path only.

---

## Demo assets (graduated)

| role | asset | what it proves |
|---|---|---|
| **hero** | `a4-photo-02` (posterized) | any image → painterly reveal (path 1, shipped) |
| **paired** | `a1-pines-s42` (cp8/ld32) | prompt → ink-wash painting (the home claim) |

Together they tell the whole pitch. (Other A4/A5 photo specimens stay local; only
the graduated hero enters the repo.)

---

## Bonus stage — GENERATE (`generate/`), not in the original plan

DOD-G filled the extraction map's `TRACE (GAP)` *and* the stage before it. The
`generate/` component (Cloudflare Workers AI, flux-1-schnell, **Apache-2.0
outputs — publish-clean**) means the user now brings **intent (style + subject)**,
not an image. GEN1 (deploy + auth), GEN2 (**deterministic**), GEN3 (four-stage
splice) all **PASS**. Free tier ≈ 173 images/day. Style registry is server-
enforced. Roadmap (`live-images-tbd.md`): the img2img *styled-photo* path (path 2)
is the next differentiator.

---

## On PASS → Phase 1

The publish claim is earned. Phase 1 unblocks with the two demo assets, the locked
`cp8/ld32` setting + the pinned-cp / auto-ld **policy**, the positioning copy
above, and a working generate → trace → compile → reveal chain. **Next after
merge:** the `packages/` restructure (both-engine monorepo) and the two live-image
paths — separate steps, not this DOD.
