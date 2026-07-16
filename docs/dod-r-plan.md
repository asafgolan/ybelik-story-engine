> STATUS: EXECUTED · DOD-R sealed via PR #9 + tag engine-2.0-layout (2026-07-06) · canonical now: the repo layout itself + the root README table

# DOD-R — Restructure Gate (flat root → packages/)
### ybelik-story-engine · plan + move map · [CC] executes · [ASAF] verifies · ⛔ = STOP

**The bet.** The flat root reorganizes into the both-engines monorepo layout with
ZERO behavior change: every lab, the demo site, the parity suite, and the full
pipeline CLI run green from the new layout. Moves are moves; the only code edits
are the enumerated mechanical ones + the pre-agreed hygiene backlog. Sealed module
BODIES are untouched — only their consumers' path strings change.

**PRECONDITION (⛔ before anything):** DOD-G must be sealed — merge
`feature/generalization-gate` → `main` (no squash), tag, push, close the six board
issues. TR0 verifies; if HEAD isn't main, STOP and hand to [ASAF].

**Two-commit discipline (non-negotiable):** commit 1 = `git mv` ONLY (pure renames
→ history-follow survives); commit 2 = reference edits. Mixing them breaks rename
detection and the repo's archaeology.

---

## TARGET LAYOUT + MOVE MAP (exhaustive; `git mv` each)

```
packages/
  reveal-engine/      reveal-engine.js
  scene-player/       scene-player.js · scene-player.css
  navigation-shell/   navigation-shell.js
  themes/             theme-yael.css
  scene-compiler/     compile_scene.py · audit_svg.py · trace_scene.py
    oracle/           bucket_svg.py            (from svg/ — reference-only, sealed)
    tests/            test_compile_parity.py
  generate/           worker.js · styles.js · wrangler.toml ·
                      generate_scene.py · README.md   (dir moves intact)
  entity-engine/      README.md  (NEW stub: "engine #2 — developing in dev-quest
                      per the womb pattern; graduates here. No code yet by design.")
demo/
  index.html · story.json
  svg/                01..05-*.svg             (the five production scenes)
labs/
  bucket-lab.html · scene-lab.html
docs/
  reusable-components-extraction-map.md · dod-g-plan.md ·
  dod-g-part2-handover.md · generalization-report.md · live-images-tbd.md ·
  dod-r-plan.md (this file, after execution)
ROOT (stays): README.md · .gitignore · .env · .env.example · test-corpus/ (ALL,
  unchanged location — its .gitignore rules keep working verbatim) · .claude/
DELETE: stray __pycache__/ (gitignored anyway)
```

## PATH DOCTRINE

Dev serving is always `python3 -m http.server` from repo root (established across
every DOD). Therefore all HTML/JSON references become **root-relative** (`/...`) —
depth-proof, zero `../` arithmetic. (The Phase-1 GH-Pages demo is a separately
dressed artifact and does its own path handling; not this repo's dev files.)

## MECHANICAL EDIT LIST (commit 2 — exhaustive; nothing outside it)

1. **demo/index.html** — `<link>`s → `/packages/themes/theme-yael.css`,
   `/packages/scene-player/scene-player.css`; `<script>`s →
   `/packages/reveal-engine/reveal-engine.js`, `/packages/scene-player/scene-player.js`,
   `/packages/navigation-shell/navigation-shell.js`; `fetch('/demo/story.json')`;
   the five preloads → `/demo/svg/…`.
2. **demo/story.json** — five `asset` values → `/demo/svg/0N-….svg`.
3. **labs/scene-lab.html** — links/scripts as above; default story fetch →
   `/demo/story.json`; footer's `?story=` example → `/test-corpus/story-gen.json`.
4. **labs/bucket-lab.html** — reveal-engine script path; embedded DEFAULT_STORY
   asset paths → `/demo/svg/…`; `fetch('/demo/story.json')`.
5. **test-corpus/story-gen.json + story-sweep.json** — all asset paths →
   root-relative `/test-corpus/…` (and `/demo/svg/…` where they point at scenes).
6. **scene-compiler/tests/test_compile_parity.py** — path constants only:
   ORACLE → `../oracle/bucket_svg.py` (via `Path(__file__)` parents); SCENES →
   `<repo>/demo/svg/`; `sys.path` insert → the package dir for
   `from compile_scene import …`. Its oracle-tamper sanity check is logic — untouched.
7. **trace_scene.py** — make its `compile_scene` import robust to cwd:
   `sys.path.insert(0, dirname(__file__))` if not already; path constants if any.
8. **packages/generate/generate_scene.py** — env-loader tuple gains repo-root at
   new depth: `('../../.env', '../.env', './.env')` + comment. Nothing else.
9. **packages/generate/README.md** — `cd packages/generate` in deploy steps;
   client example `--out ../../test-corpus/raster/`.
10. **root README.md** — rewritten for the new layout (package table, run
    instructions unchanged: serve root, open `/labs/…`, `/demo/index.html`).
11. **docs/…map.md** — addendum table: module → package path (A→scene-compiler,
    B→reveal-engine, C→scene-player, D→navigation-shell, E→themes; trace stage →
    scene-compiler; generate → packages/generate; entity-engine scaffold noted).

## HYGIENE BACKLOG LANDING (commit 3 — the pre-agreed items, nothing more)

- **audit_metrics refactor**: `audit_metrics(svg_text) -> dict` (raw numbers:
  paths, non_path, kb?, attr_fb, lum_fb, compile_ms, buckets — kb needs the
  path, so signature `audit_metrics(svg_text, *, kb=None)` or compute at CLI);
  CLI table becomes a formatter over it. CLI OUTPUT IDENTICAL — diff a before/
  after run on `demo/svg/03-bird.svg` to prove it.
- **downscale-comment nit** in trace_scene (`_downscaled_copy`): remove the
  no-op branch, fix the "only ever shrinks" comment to reflect reality.
- **package.json stubs** for the three JS runtime packages (reveal-engine,
  scene-player, navigation-shell): `{ name: "@ybelik/<pkg>", version: "0.1.0",
  main: "<file>.js", license: "UNLICENSED" }` — license flips at Phase 1.
  ⛔ **[ASAF] confirms the `@ybelik` scope name before this commit** (npm-free,
  standing recommendation; `nijimi` stays pocketed as a product name).

## GATES

**GR1 · Layout.** Tree matches the move map exactly; commit 1 is renames-only
(`git log --follow` works on a sampled moved file); no logic diffs in moved files.
**GR2 · Parity.** `python3 packages/scene-compiler/tests/test_compile_parity.py`
→ 10/10 byte-identical from the new location; oracle-tamper check still armed.
**GR3 · Labs.** Serve root: `/labs/bucket-lab.html` (default story + one
`?story=/test-corpus/story-gen.json` walk) and `/labs/scene-lab.html` (default +
same param) — load, paint, navigate, zero console errors.
**GR4 · Demo.** `/demo/index.html` — full quick traversal: engage seam, forward
1→5, back 5→1, both exits + re-engage, captions, dots. (Paths were edited here;
this is the gate that catches a missed one.)
**GR5 · Pipeline smoke.** From repo root: `generate_scene.py` one image (proves
the env loader finds root `.env` from the new depth) → `trace_scene.py` on it
(converges in band) → `audit_svg.py` CLI (output format unchanged) → compile.
**GR6 · Hygiene proof.** audit CLI before/after diff clean; parity still 10/10
after the audit refactor (it imports compile_scene, untouched); stubs valid JSON.
**GR7 · Docs + seal.** README + map addendum landed; this plan moved to docs/;
[ASAF] merges `feature/restructure` → main, tags (`engine-2.0-layout` suggested —
layout change, zero behavior), pushes.

## TICKETS

**TR0 [CC] · Preflight** — `git branch --show-current` = main (⛔ else STOP →
[ASAF] merges DOD-G first); clean tree; `git switch -c feature/restructure`;
capture a pre-move baseline: run GR2/GR3/GR4/GR5 once on the OLD layout so every
gate has a green-before-green-after pair. *~0.5h.*
**TR1 [CC] · Moves** — `git mv` per map + entity-engine stub + delete stray
`__pycache__`; commit 1 (renames only). *~0.5h.*
**TR2 [CC] · Reference edits** — the 11-item list, nothing else; commit 2. *~1h.*
**TR3 [CC] · Hygiene** — the three backlog items; ⛔ scope-name confirm inside;
commit 3. *~1h.*
**TR4 [CC] · Gates GR1–GR6** — full run, report table. *~0.5h.*
**TR5 [ASAF] · Eyeball + seal** — quick demo traversal by eye, confirm, merge +
tag + push (GR7); board: file DOD-R as done. *~0.25h.*

## RULES IN FORCE

`git mv` only — never delete+recreate. No edits outside the enumerated lists.
Sealed module bodies (reveal-engine, scene-player, navigation-shell, compile_scene
algorithm, oracle) byte-identical through the move — `git diff --stat` on commit 1
must show 0 insertions/deletions. test-corpus stays rooted; its gitignore rules
and the raster licensing note are untouched. If ANY gate fails: fix forward on the
branch, never rearrange further to "work around" — a path bug is a path bug.
