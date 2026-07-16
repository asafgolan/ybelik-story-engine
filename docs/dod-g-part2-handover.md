> STATUS: EXECUTED · closed in the DOD-G PASS 2026-07-06 (dfee47e) · canonical now: @ybelik/scene-tracer (the shipped tuner — JS, succeeded the Python original 2026-07-16) + test-corpus/TRACE-SETTINGS.md (the policy)

# DOD-G — Part 2 · Handover
### ybelik-story-engine · branch `feature/generalization-gate` · continues `dod-g-plan.md`

Part 1 (TG0/TG2/TG4/TG5-tooling + the quantization sweep) is done and verified.
This file carries the human's locked answers, the one new spec, and the
remaining tickets to close DOD-G.

---

## ANSWERS — the human's pending decisions, now locked

**A. Sweep cell (GG5):** **cp8/ld32 locked** as the publish/demo trace setting
for the pines asset (2,096 paths · 1.6 MB · ~880 ms — cp8 softness at
production-range weight). cp8/ld8 recorded as the measured **jank ceiling**
(4,367 paths · 3 MB · 3.5 s compile).

**B. The general rule (bigger than one cell):** lock the **policy**, not just
the setting — `color_precision = 8` always (the quality axis), and
`layer_difference` **auto-tuned** per asset. This is the answer to "will it be
automatic / rule-based / deterministic / scalable": yes, via `trace_scene.py`
(spec below). Rationale: path count is content-driven (34 / 2,496 / 7,760 on
different content at one setting), so no fixed cell scales — but the sweep's
transfer function does: cp buys tonal layering, ld trims weight cheaply.

**C. Tōhaku note:** yes — record *Hasegawa Tōhaku, Pine Trees (Shōrin-zu
byōbu)* as the **A1 aesthetic reference** (style north-star; TG6 ratings and
future FLUX targets judge against it). Test-input use permitted via the
Corpus-B sourcing rig if ever wanted; **never a published demo asset.**

**D. Commit:** yes — commit Part 1 NOW, before Part 2 starts (tooling +
Corpus B + sweep traces/compiled + docs; `raster/` stays gitignored). Draft
the message in the established gate-by-gate style; the human runs it.

**E. GG4 (group-fill) — recommendation, human confirms at TG7:** **(a) defer**
with contract language. Evidence: the product pipeline (vtracer, stacked
color mode) *never emits* group-inherited fills — the boundary only exists
for hand-authored input, and `audit_svg.py` detects it mechanically (85.6%
attr-fb on B2). Contract wording anchored by the bird finding: *"small
fallback shares are harmless (production shipped 2.0% invisibly for its whole
life); structural fallback shares are not — the audit is the linter."*
Resolving `<g>` inheritance is logged as **Module A v0.2 backlog**, a declared
additive deviation whenever the editor accepts hand-authored SVGs.

---

## NEW SPEC — `trace_scene.py` (the trace-stage prototype; dual-purpose)

**Why it's product, not scaffolding:** the extraction map's pipeline was
`TRACE (GAP) → compiler → runtime`. This fills the GAP. Built now to finish
Corpus A consistently; graduates to a package at the restructure; becomes the
editor prep-panel's "Auto" mode and the SaaS trace service's core later.
**Out of scope now: any UI, HTTP service, or browser port.**

```
trace_scene(image_path, policy) -> (svg_text, chosen_settings)
policy defaults:
  color_precision : 8                     # pinned — the quality axis
  ld_ladder       : [8, 16, 24, 32, 48, 64]
  target_paths    : (1500, 3500)          # production range, jank-safe
  max_kb          : 2048
  base            : the locked TRACE-SETTINGS.md baseline for all other opts
loop (deterministic):
  start mid-ladder (ld=32 is a sane first probe) →
  trace → audit (path count via audit_svg internals) →
  paths above band or kb over max  → step ld UP the ladder
  paths below band                 → step ld DOWN the ladder
  first cell inside band → STOP; write settings JSON next to the trace
  (settings-are-data: the loop WRITES the chosen cell instead of a human
   choosing it; converges in 2–4 trace-audit cycles, build-time only)
edge cases (features, not failures):
  ld=64 still heavy  → downscale source to ~1024px and retry once;
                       still heavy → FLAG "over-ceiling" (weight ceiling)
  ld=8 still sparse  → FLAG "chunky-by-content" — a GG3 envelope fact;
                       the tuner normalizes settings, not content
```

**Acceptance test for the tool itself:** run it on the pines raster with no
hints — it must converge to **cp8/ld32** (2,096 paths) unaided. If it lands
on a neighboring in-band cell, record why (band edges); if it wanders,
the ladder logic is wrong.

**Determinism chain (state in the header):** vtracer deterministic per
input+settings → audit is arithmetic → ladder is a fixed procedure →
compile_scene seeded ⇒ same image in, same settings + trace + compiled SVG
out, forever.

---

## TICKETS — Part 2

**TP1 · Commit Part 1** *(machine drafts, human runs)* — gate-by-gate message
covering TG0/TG2/TG4/TG5-tooling, the sweep (GG5 table + locked cell +
ceiling), the bird closure, and this handover file. *~15min.*

**TP2 · Build `trace_scene.py`** per the spec; pass its acceptance test on
the pines; add the map addendum: *"trace stage prototype — GAP filled;
graduates to a package at the restructure."* *~1h.*

**TP3 · Complete Corpus A inputs** *(human)* — still missing:
- **A1 #2** — the bird/branch prompt (already provided) on the schnell Space,
  seed batch 42–45, pick by eye. If seed-42 pines' large negative space feels
  too empty for a *hero* (authentic ma for the corpus, maybe sparse for a
  demo), regenerate alternates with an added clause: *"balanced composition,
  subject structure spanning the frame."* Human's eye rules (decision (b)).
- **A4 landscape photo + A5 portrait photo** — two phone photos, own.
Drop all into `test-corpus/raster/` with seed/prompt noted. *~30min human.*

**TP4 · Trace remaining Corpus A via `trace_scene` (auto)** — every specimen
through the tuner → compile → audit. Produce the **convergence table**
(per specimen: chosen cell, iterations, paths, KB, compile ms, flags). This
table is the proof that "automatic, rule-based, deterministic, scalable"
generalizes beyond one image — attach to the report. Re-trace the three
synthetic starters through the tuner too, for table completeness. *~1h.*

**TP5 · Full rig walk** — `story-gen.json` over the complete corpus;
lab walk; mechanical pass (loads, buckets, no errors). *~0.5h.*

**TP6 · TG6 eyeball** *(human)* — rate every specimen
(reads-as-painting / acceptable / wrong-medium); pick the **two published
demo assets** and the hero; judge against the Tōhaku reference. *~1h.*

**TP7 · TG7 verdict** — `generalization-report.md`: envelope statement
(positioning copy verbatim), GG5 sweep table + locked cell + **policy** +
ceiling, the convergence table, Corpus-B findings + bird anchor, input
contract, **GG4 decision** (recommendation above; human confirms). Map
addendum: DOD-G recorded. Then the close-out commit. *~0.5h.*

---

## GATE COMPLETION MAP

| Gate | Status after Part 1 | Closed by |
|------|--------------------|-----------|
| GG1 pipeline end-to-end | synthetic + 1 real A1 | TP4 (full corpus) |
| GG2 same-style claim | 1 A1 clean (2,496 paths, 0% fb) | TP6 rating on both A1s |
| GG3 envelope | unrated | TP6 |
| GG4 robustness/contract | evidence complete (B1/B2/B3 + bird) | TP7 decision |
| GG5 quantization | **done** — table, cell, ceiling | lock policy in TP7 |
