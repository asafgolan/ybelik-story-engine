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
