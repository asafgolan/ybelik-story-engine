# ybelik story engine

An ink-wash **view-transition** story engine, extracted from a production site
into five composable modules: `compile_scene.py` (A, build-time bucket compiler),
`reveal-engine.js` (B), `scene-player.js` (C), `navigation-shell.js` (D), and
`theme-yael.css` (E). `index.html` is the integrated proof; `story.json` is the
descriptor that drives it.

**Architecture** — [reusable-components-extraction-map.md](reusable-components-extraction-map.md)
is the authoritative module map and carries every extraction verdict (DOD-1/A/C/D).

**Run it** (serve over http, not `file://`):

    python3 -m http.server 8000

then open `index.html` (production proof), `scene-lab.html` (Module C lab —
`?story=` picks a descriptor), or `bucket-lab.html` (Module B reveal lab).

**Docs**
- [dod-g-plan.md](dod-g-plan.md) · [dod-g-part2-handover.md](dod-g-part2-handover.md) — the generalization gate (DOD-G): does the engine hold on *any* traced image?
- [test-corpus/TRACE-SETTINGS.md](test-corpus/TRACE-SETTINGS.md) — locked trace policy (`color_precision=8` pinned, `layer_difference` auto-tuned) + the baseline audit row
- [test-corpus/corpus-b/CORPUS-B-SOURCES.md](test-corpus/corpus-b/CORPUS-B-SOURCES.md) — robustness-probe SVGs + their public-domain provenance

**License** — none yet. A LICENSE lands at **Phase 1** (the publish milestone).
A public-destined repo in a temporary unlicensed state is a known, tracked
condition here, not an oversight.
