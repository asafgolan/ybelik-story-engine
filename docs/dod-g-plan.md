> STATUS: EXECUTED · DOD-G PASS 2026-07-06 (commit dfee47e) · canonical now: generalization-report.md (the verdict) + the shipped pipeline stages

# DOD-G — Generalization Gate
### ybelik-story-engine · plan + checklist · gates the Phase-1 publish

---

## HANDOVER CONTEXT — fresh session, read this first

**This repo** is a history-free snapshot of the ybelik `engine-1.0` tag: a story
engine extracted from a production site across four gated phases (DOD-1/A/C/D).
Read `reusable-components-extraction-map.md` first — it is the authoritative map:
module contracts, the §7 boundaries this DOD probes, and every prior verdict.

**What's here:** `compile_scene.py` (Module A, build-time compiler; header
documents its color-resolution fallbacks), `reveal-engine.js` (B),
`scene-player.js/.css` (C), `navigation-shell.js` (D), `theme-yael.css` (E),
`story.json` (descriptor), two lab harnesses (`bucket-lab.html`,
`scene-lab.html`), `index.html` (integrated proof), `svg/` (five production
scenes + `bucket_svg.py`, retired to oracle status — do not modify), and
`test_compile_parity.py` (GA2 oracle test; keep green).

**What this repo will become:** the monorepo for BOTH animation engines
(view-transition + a future sequential/entity engine). **Neither the package
restructure nor any entity-engine work happens in this DOD** — flat layout,
DOD-G only. Packages come after.

**Division of labor:** the human handles TG1 (image generation — FLUX pipeline,
own photos) and TG6 (the eyeball session). Everything else is mechanical.
**Kit:** `audit_svg.py` ships PRE-BUILT AND TESTED (see pre-flight box). The
`scene-lab.html` `?story=` param is built in-session (labs are tooling, not
sealed engine; `scene-player.js` and the other modules ARE sealed).

**Working style (established across four prior DODs):** verbatim-first, every
deviation declared; back-up/restore around any test edit to shared files;
verdicts recorded in the map; nothing committed without the human's go.

---

## VERIFIED PRE-FLIGHT FACTS (pipeline already smoke-tested in a sandbox)

The riskiest assumptions were executed, not guessed, before handover:

- **Install:** `pip install vtracer` works (v0.6.15, prebuilt wheels). Binding:
  `vtracer.convert_image_to_svg_py(image_path, out_path, colormode,
  hierarchical, mode, filter_speckle, color_precision, layer_difference,
  corner_threshold, length_threshold, max_iterations, splice_threshold,
  path_precision)`.
- **Compatibility CONFIRMED:** vtracer (colormode='color',
  hierarchical='stacked') emits FLAT `<path>` tags, each with its own
  `fill="#hex"` attribute, ZERO `<g>` groups → fully `get_color`-compatible.
  The §7 group-fill boundary does not trigger on vtracer output.
- **Full pipeline ran end-to-end:** synthetic raster → vtracer →
  `compile_scene(seed=42)` (4ms, `rp bN` injected, buckets 0–99) →
  `audit_svg.py` (0.0% attr-fb, 0.0% lum-fb).
- **Detector proof:** on a deliberately bad hand-authored fixture, the audit
  fired exactly right — 40% attr-fb (group-inherited fills), 40% lum-fb
  (named color + gradient), non-path tags counted.
- **Knob semantics:** `color_precision` is BITS (1–8), not a color count — and
  on smooth content it saturates early (a soft 512px synthetic gave 18 paths
  at p=2, 34 paths at p=3–8). Path count is content-driven and co-governed by
  `layer_difference`. The sweep must record ACTUAL path counts per setting.
- **Smoothness insight:** that 34-path trace used only 29 of 100 buckets —
  sparse traces paint CHUNKY. Reveal smoothness needs path count in roughly
  the production range; see TG2's acceptance criteria.

---

**The bet being tested.** Everything so far proved "the extraction preserves
production" — on exactly one input class: five traces, one tracer, one style.
The product claims "any traced image." DOD-G tests that claim before it ships,
on a corpus designed to break it.

**The corpus split (two different claims):**

- **Corpus A — traced rasters (the core claim).** The engine's contract is
  *traced* SVGs: thousands of anonymous filled paths from a raster→vector
  pass. Corpus A is RASTER images that WE trace — the full
  `image → trace → compile → reveal` pipeline on real content (pre-flight ran
  it on synthetic content only).
- **Corpus B — wild hand-authored SVGs (the robustness probe).** Deliberately
  chosen to trigger the §7 boundaries (group-inherited fills → #808080 mush,
  named colors → 0.5, gradients, strokes-only art). Expected findings, not
  failures — it forces the input-contract decision.

**Licensing rule (hard):** every Corpus-A image is self-generated or the
human's own photo; every Corpus-B SVG is CC0/public-domain. Winners graduate
to public demo assets — nothing under unclear license enters the corpus.

**Layout:** `test-corpus/raster/` (**gitignored** — sources stay local),
`test-corpus/traces/`, `test-corpus/compiled/`, `story-gen.json`,
`generalization-report.md`. Only compiled specimens + the report get committed.

---

## EXECUTION ORDER (resolves the TG1 dependency)

Corpus images arrive on the human's schedule — do NOT block on them:

1. **Tooling first, against known-good fixtures:** TG0 → TG2 (vtracer setup)
   → TG5-tooling (drop in `audit_svg.py`, add `?story=` to scene-lab) — all
   validated against the FIVE PRODUCTION SVGs in `svg/` (expected: ~0%
   fallbacks, 1295/4236/1825/3345/4111 paths, 100 buckets). This also
   produces the audit baseline row for the report.
2. **Corpus B (TG4)** — independent of TG1; fetchable immediately.
3. **When TG1 images land:** TG3 (trace + compile + sweep) → TG5-rig
   (story-gen.json + lab walk) → hand TG6 to the human → TG7.

---

## The test matrix

**Corpus A — six categories, ~8 rasters (~1024px each):**
| # | Category | Why it's in |
|---|----------|-------------|
| A1 | FLUX ink-wash / sumi-e ×2 | the home style; **doubles as the IP-clean Phase-1 demo assets** |
| A2 | Watercolor / soft illustration | adjacent style, gradient-ish washes |
| A3 | Flat graphic / poster style | large uniform regions, few tones |
| A4 | Photograph — landscape | gradient-heavy: the predicted hard case |
| A5 | Photograph — portrait | skin gradients; "art or glitch" question |
| A6 | Line art / pen sketch | near-binary tones; thin end of light→dark |

**Corpus B — 3–4 wild SVGs:** one icon using `<g fill>` inheritance, one
illustration with gradients + named colors, one strokes-only line drawing.

**Quantization sweep (the master-knob probe):** ONE A1 image, sweeping
`color_precision` ∈ {2,3,4,5,6,8} × `layer_difference` ∈ {8,16,32} (prune the
grid once the shape is clear). Record per cell: ACTUAL path count, file KB,
compile ms, buckets used, human smoothness rating. Picks the publish demo's
settings (smallest cell that still reads smooth).

---

## Tickets

**TG0 · Branch + scaffold** — from this repo's `main`:
`git switch -c feature/generalization-gate`; corpus dirs;
`test-corpus/raster/` into `.gitignore`. *~15min.*

**TG1 · Assemble Corpus A** *(human)* — FLUX generations + own photos, six
categories, ~1024px, into `test-corpus/raster/`. *~1–2h.*

**TG2 · Tracer setup + acceptance criteria** — `pip install vtracer`;
baseline: colormode='color', hierarchical='stacked', mode='spline',
filter_speckle=4, color_precision=6, layer_difference=16. **A trace is
ACCEPTED when:** audit shows attr-fb ≈ 0% and lum-fb ≈ 0%; path count lands
roughly 500–6,000 (production range 1.3k–4.2k; below ~300 the reveal paints
chunky — raise detail via layer_difference↓ / color_precision↑; far above
~8k flags weight — see the sweep). Record settings next to every output —
settings are data. *~0.5h.*

**TG3 · Trace + compile Corpus A** — all rasters → vtracer →
`compile_scene.py` (seeded, defaults) → `test-corpus/compiled/`; plus the
quantization sweep on one A1. *~1h mechanical.*

**TG4 · Corpus B probe** — fetch the CC0 set, compile AS-IS (no trace),
audit. Expected: fallback-heavy. *~0.5h.*

**TG5 · Audit + rig** — `audit_svg.py` is pre-built and tested: run it on
the five production scenes (baseline), every specimen, and every sweep cell.
Add the `?story=` query param to `scene-lab.html` (default `story.json`).
Build `story-gen.json` over the corpus; walk everything in the lab.
Mechanical pass: loads, buckets discovered, no console errors. Jank
measurement: if no browser tooling is available in-session, fold the jank
judgment into TG6's human pass. *~1h.*

**TG6 · The eyeball session** *(human)* — rate every specimen:
**reads-as-painting / acceptable / wrong-medium**. Photos are *allowed* to
land wrong-medium — the rating IS the deliverable. Pick the two publish demo
assets from A1 + the sweep. *~1h.*

**TG7 · Verdict** — `generalization-report.md`: the envelope statement (which
content classes this is FOR — future positioning copy verbatim), the sweep
table + chosen demo settings, the Corpus-B findings with audit numbers, the
input-contract wording, and **the group-fill decision** (GG4). Map addendum:
DOD-G recorded. *~0.5h.*

---

## Gates

**GG1 · Pipeline end-to-end.** raster → vtracer → compile_scene → scene-lab
runs clean for every Corpus-A specimen (pre-flight proved the mechanism on
synthetic content; GG1 proves it on the real corpus).

**GG2 · Same-style claim.** A1 traces paint beautifully (human) with clean
audits (near-zero fallback share, accepted path counts). **Hard gate for the
Phase-1 publish** — its output IS the publish demo assets.

**GG3 · Envelope stated.** Every category rated; the report contains the
one-paragraph "designed for X; workable for Y; not for Z" positioning text.
No fail state — only an unwritten state.

**GG4 · Robustness findings filed.** Corpus-B behavior documented with audit
numbers; the input contract written; the group-fill decision made explicitly:
- *(a) defer* — contract language only ("designed for traced input;
  hand-authored SVGs may mis-bucket"), or
- *(b) fix now* — Module A v0.2: resolve `<g>`-inherited fills as a
  **declared additive deviation**. Consequence either way: the oracle
  (`bucket_svg.py`) shares the limitation, so a fix diverges by design — GA2
  byte-parity then guards the verbatim path only, and the fix gets its own
  targeted test. This plan forces the decision, not the answer.

**GG5 · Quantization envelope.** The sweep table exists; demo settings
chosen; the jank threshold (if hit) recorded as the current perf ceiling.

---

## Expected findings (so nobody panics)

- Corpus B mis-buckets into mid-gray mush → **expected**; that's GG4 working
  (the audit detectors are proven to fire on exactly this).
- Photos feel like a loading effect rather than painting → **allowed**;
  that's GG3's envelope talking. "For illustrated / ink-wash / graphic
  content" is a sharper product than "for anything."
- Smooth/soft content traces SPARSE (pre-flight: 34 paths) → not a bug;
  either raise trace detail per TG2's criteria or let the rating land where
  it lands.
- High-detail traces get heavy / janky → **wanted** — the ceiling
  measurement; same-bucket path merging (map §7) remains the known lever.

## On PASS / on FAIL

**PASS (GG1+GG2 green, GG3–GG5 written)** → the publish claim is earned;
Phase 1 unblocks with demo assets, settings, and positioning copy in hand;
merge the report + graduated assets. Next after merge: the `packages/`
restructure (both-engine monorepo layout) — a separate step, not this DOD.

**FAIL (GG2)** — same-style traces don't paint well → the finding is
trace-settings sensitivity, not the engine; the sweep data localizes it;
Phase 1 waits until an A1 specimen passes.
